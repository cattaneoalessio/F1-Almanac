"""
main.py — API FastAPI del progetto (Fase C).

Due endpoint, come richiesto:
  GET /gare/risultati?anno=&circuito=   -> ordine di arrivo completo di una gara
  GET /classifica/piloti?anno=          -> classifica piloti di una stagione (bonus,
                                            utile al frontend storico/fase D)

Nota sui punti (AGGIORNATA in fase di import stagioni 1951-1970): le
classifiche calcolate qui sommano DIRETTAMENTE risultati_gara.punti,
la colonna che lo schema descrive come "fonte di verità" per i punti.
Non è sempre stato così: l'import CSV del 1950 (Fase B) lasciava questa
colonna a 0 e le classifiche la calcolavano al volo unendo
punti_per_posizione — un meccanismo diverso da quanto lo schema stesso
dichiarava. db/patch_backfill_punti_risultati.sql ha corretto la
colonna anche per il 1950 (stessi numeri di prima, verificato), così
oggi un solo meccanismo (SUM(risultati_gara.punti)) vale per tutte le
stagioni, vecchie e nuove: le stagioni importate da Jolpica scrivono i
punti reali (già corretti per l'epoca, arrivi a pari merito compresi,
bonus giro veloce già incluso nel totale) direttamente in questa
colonna, senza bisogno di un'altra tabella di supporto.

2026-09-21: la nota sopra era vera solo per /classifica/piloti e
/classifica/scuderie — /gare/risultati, /piloti, /piloti/{slug} e
/scuderie/{slug} erano rimasti indietro e leggevano ancora
punti_per_posizione (che non viene mai popolata per le stagioni
importate da Jolpica, quindi restituivano sempre 0 su quelle gare).
Allineati anche questi quattro a risultati_gara.punti: ora nessun
endpoint dell'API dipende più da punti_per_posizione.

Avvio in locale:
    pip install fastapi uvicorn[standard] psycopg2-binary python-dotenv --break-system-packages
    uvicorn main:app --reload
Poi apri http://127.0.0.1:8000/docs per la documentazione interattiva
generata automaticamente da FastAPI.
"""
from datetime import date, datetime, timezone
import os
from typing import Optional

import psycopg2.extras
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import utente_da_token
from chronoquiz import genera_quiz
from db import get_connection
from game import PUNTI_PER_POSIZIONE, gp_pronto_per_chiusura, valida_tentativo
from schemas import (
    ClassificaTempiCircuito,
    ConfigurazioneCircuito,
    CurvaCircuito,
    DomandaChronoQuiz,
    GaraCircuito,
    GaraScuderia,
    GaraStagione,
    InvioTempoGioco,
    RichiestaPunteggio,
    RisultatiGara,
    RisultatoPilota,
    RisultatoStoricoPilota,
    RispostaChiusuraAutomatica,
    RispostaChiusuraGp,
    RispostaGriglia,
    RispostaInvioTempo,
    RispostaLivelloPilota,
    RispostaMioRecord,
    RispostaMioRecordArcade,
    RispostaPunteggio,
    SchedaCircuito,
    SchedaPilota,
    SchedaScuderia,
    VoceAlboOro,
    VoceCircuito,
    VoceClassificaArcade,
    VoceClassificaCampionato,
    VoceClassificaPiloti,
    VoceClassificaScuderie,
    VoceClassificaTempi,
    VoceIndicePiloti,
    VocePilotaScuderia,
    VoceScuderia,
)

app = FastAPI(
    title="GP Almanac API",
    description="API dei risultati storici del progetto (nome di lavoro, non definitivo).",
    version="0.1.0",
)

# CORS ristretto al dominio reale del frontend pubblicato, più gli
# indirizzi locali di sviluppo (Vite): senza questi ultimi, il frontend
# avviato in locale con `npm run dev`/`npm run preview` verrebbe
# bloccato dal browser (il backend risponderebbe comunque, ma il
# browser scarterebbe la risposta perché l'origine non è in lista).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://f1-almanac.netlify.app",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Chiave condivisa per proteggere /game/close-gp: non c'è ancora un
# concetto di ruolo/admin in questo progetto (utenti sono tutti alla pari
# via Netlify Identity), quindi questo è il minimo indispensabile per
# evitare che chiunque possa chiudere un GP e assegnare punti a piacere.
# Se GAME_ADMIN_KEY non è impostata, l'endpoint rifiuta sempre — fail
# closed, non fail open.
GAME_ADMIN_KEY = os.environ.get("GAME_ADMIN_KEY", "")


@app.get("/")
def stato():
    """Endpoint di controllo: se risponde, l'API è viva."""
    return {"stato": "ok", "servizio": "gp-almanac-api"}


@app.get("/gare/risultati", response_model=RisultatiGara)
def risultati_gara(
    anno: int = Query(..., description="Anno della stagione, es. 1950"),
    circuito: str = Query(..., description="codice_riferimento del circuito, es. 'silverstone'"),
):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gp.nome_gp, gp.data_gara, gp.commento
                FROM gran_premi gp
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                WHERE s.anno = %(anno)s AND ci.codice_riferimento = %(circuito)s
                """,
                {"anno": anno, "circuito": circuito},
            )
            gp_meta = cur.fetchone()
            if gp_meta is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Nessun Gran Premio trovato per anno={anno} e circuito='{circuito}'.",
                )

            query_risultati = """
                SELECT
                    r.posizione_finale AS posizione,
                    r.posizione_finale_testo AS posizione_testo,
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS pilota_slug,
                    c.nome AS costruttore,
                    r.giri_completati,
                    COALESCE(r.tempo_totale::text, r.distacco_testo) AS tempo,
                    sr.codice AS stato,
                    r.motivo_ritiro,
                    COALESCE(r.punti, 0) AS punti
                FROM gran_premi gp
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN risultati_gara r ON r.gran_premio_id = gp.id
                JOIN piloti p ON p.id = r.pilota_id
                JOIN costruttori c ON c.id = r.costruttore_id
                LEFT JOIN stati_risultato sr ON sr.id = r.stato_id
                WHERE s.anno = %(anno)s AND ci.codice_riferimento = %(circuito)s
                    AND r.tipo_sessione = %(tipo_sessione)s
                ORDER BY r.posizione_finale NULLS LAST, r.giri_completati DESC NULLS LAST
                """
            cur.execute(query_risultati, {"anno": anno, "circuito": circuito, "tipo_sessione": "gara"})
            righe = cur.fetchall()

            # Sprint Race dello stesso weekend, se c'è (dal 2021): righe
            # vuote per la stragrande maggioranza dei GP, che non ne hanno
            # una — il frontend nasconde il box quando la lista è vuota.
            cur.execute(query_risultati, {"anno": anno, "circuito": circuito, "tipo_sessione": "sprint"})
            righe_sprint = cur.fetchall()
    finally:
        conn.close()

    return RisultatiGara(
        anno=anno,
        circuito=circuito,
        nome_gp=gp_meta["nome_gp"],
        data_gara=gp_meta["data_gara"],
        commento=gp_meta["commento"],
        risultati=[RisultatoPilota(**riga) for riga in righe],
        risultati_sprint=[RisultatoPilota(**riga) for riga in righe_sprint],
    )


@app.get("/classifica/piloti", response_model=list[VoceClassificaPiloti])
def classifica_piloti(anno: int = Query(..., description="Anno della stagione, es. 1950")):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS pilota_slug,
                    n.codice_iso2 AS nazione_codice,
                    COALESCE(SUM(r.punti), 0) AS punti_totali,
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1 AND r.tipo_sessione = 'gara') AS vittorie,
                    COUNT(DISTINCT r.gran_premio_id) AS gare_disputate
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN piloti p ON p.id = r.pilota_id
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                WHERE s.anno = %(anno)s
                GROUP BY p.id, p.nome, p.cognome, p.codice_riferimento, n.codice_iso2
                ORDER BY punti_totali DESC, vittorie DESC, pilota ASC
                """,
                {"anno": anno},
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    if not righe:
        raise HTTPException(status_code=404, detail=f"Nessun dato trovato per la stagione {anno}.")

    return [VoceClassificaPiloti(**riga) for riga in righe]


@app.get("/classifica/scuderie", response_model=list[VoceClassificaScuderie])
def classifica_scuderie(anno: int = Query(..., description="Anno della stagione, es. 1950")):
    """Classifica scuderie della stagione, stesso criterio "a somma" già
    usato in /classifica/piloti (si sommano i punti di TUTTI i piloti
    schierati dalla scuderia, non solo il migliore): nel 1950 non
    esisteva un Mondiale Costruttori ufficiale (arrivato solo nel 1958),
    quindi qui applichiamo per coerenza lo stesso criterio già scelto
    per i piloti, non una regola storica realmente esistita all'epoca.

    I punti si sommano DIRETTAMENTE da risultati_gara.punti (vedi nota
    in cima al file e db/patch_backfill_punti_risultati.sql): stesso
    meccanismo unico usato da /classifica/piloti, valido sia per il 1950
    (backfillato) sia per le stagioni importate da Jolpica."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    c.nome AS scuderia,
                    c.codice_riferimento AS scuderia_slug,
                    n.codice_iso2 AS nazione_codice,
                    COALESCE(SUM(r.punti), 0) AS punti_totali,
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1 AND r.tipo_sessione = 'gara') AS vittorie,
                    COUNT(DISTINCT r.gran_premio_id) AS gare_disputate
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN costruttori c ON c.id = r.costruttore_id
                LEFT JOIN nazioni n ON n.id = c.nazione_id
                WHERE s.anno = %(anno)s
                GROUP BY c.id, c.nome, c.codice_riferimento, n.codice_iso2
                ORDER BY punti_totali DESC, vittorie DESC, scuderia ASC
                """,
                {"anno": anno},
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    if not righe:
        raise HTTPException(status_code=404, detail=f"Nessun dato trovato per la stagione {anno}.")

    return [VoceClassificaScuderie(**riga) for riga in righe]


@app.get("/gare", response_model=list[GaraStagione])
def gare_stagione(anno: int = Query(..., description="Anno della stagione, es. 1950")):
    """Elenco delle gare di una stagione, usato per generare i link
    cliccabili dalla pagina della classifica (Fase D) verso ogni gara."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gp.nome_gp, ci.codice_riferimento AS circuito, gp.data_gara,
                       EXISTS (
                           SELECT 1 FROM risultati_gara r
                           WHERE r.gran_premio_id = gp.id AND r.tipo_sessione = 'sprint'
                       ) AS ha_sprint
                FROM gran_premi gp
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                WHERE s.anno = %(anno)s
                ORDER BY gp.data_gara ASC NULLS LAST
                """,
                {"anno": anno},
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    if not righe:
        raise HTTPException(status_code=404, detail=f"Nessuna gara trovata per la stagione {anno}.")

    return [GaraStagione(**riga) for riga in righe]


@app.get("/piloti", response_model=list[VoceIndicePiloti])
def elenco_piloti():
    """Indice di tutti i piloti presenti nel database, con i totali di
    carriera (punti, vittorie, gare), per la pagina /piloti del frontend.
    Ordinato per cognome: è un roster, non una classifica, quindi non ha
    senso ordinarlo per punti come /classifica/piloti."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS slug,
                    n.codice_iso2 AS nazione_codice,
                    COALESCE(SUM(r.punti), 0) AS punti_totali_carriera,
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1 AND r.tipo_sessione = 'gara') AS vittorie_totali,
                    COUNT(DISTINCT r.gran_premio_id) AS gare_totali,
                    (
                        SELECT c2.nome FROM risultati_gara r2
                        JOIN gran_premi gp2 ON gp2.id = r2.gran_premio_id
                        JOIN costruttori c2 ON c2.id = r2.costruttore_id
                        WHERE r2.pilota_id = p.id
                        ORDER BY gp2.data_gara DESC NULLS LAST
                        LIMIT 1
                    ) AS ultima_scuderia
                FROM piloti p
                JOIN risultati_gara r ON r.pilota_id = p.id
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                GROUP BY p.id, p.nome, p.cognome, p.codice_riferimento, n.codice_iso2
                ORDER BY p.cognome ASC, p.nome ASC
                """
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return [VoceIndicePiloti(**riga) for riga in righe]


@app.get("/piloti/{slug}", response_model=SchedaPilota)
def scheda_pilota(slug: str):
    """Scheda di carriera di un pilota: totali e risultati gara per gara,
    usata dalla pagina /piloti/:slug del frontend (Fase D)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.id,
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS pilota_slug,
                    n.codice_iso2 AS nazione_codice,
                    p.data_nascita,
                    p.data_morte,
                    p.url_wikipedia,
                    p.biografia,
                    p.curiosita,
                    p.fonti_sufficienti,
                    (
                        SELECT c2.nome FROM risultati_gara r2
                        JOIN gran_premi gp2 ON gp2.id = r2.gran_premio_id
                        JOIN costruttori c2 ON c2.id = r2.costruttore_id
                        WHERE r2.pilota_id = p.id
                        ORDER BY gp2.data_gara DESC NULLS LAST
                        LIMIT 1
                    ) AS ultima_scuderia
                FROM piloti p
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                WHERE p.codice_riferimento = %(slug)s
                """,
                {"slug": slug},
            )
            pilota = cur.fetchone()
            if pilota is None:
                raise HTTPException(status_code=404, detail=f"Nessun pilota trovato con slug '{slug}'.")

            cur.execute(
                """
                SELECT
                    s.anno,
                    gp.nome_gp,
                    ci.codice_riferimento AS circuito,
                    c.nome AS costruttore,
                    r.posizione_finale AS posizione,
                    r.posizione_finale_testo AS posizione_testo,
                    COALESCE(r.punti, 0) AS punti
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN costruttori c ON c.id = r.costruttore_id
                WHERE r.pilota_id = %(pilota_id)s AND r.tipo_sessione = 'gara'
                ORDER BY s.anno ASC, gp.data_gara ASC
                """,
                {"pilota_id": pilota["id"]},
            )
            risultati = cur.fetchall()

            # Il totale punti carriera include anche i punti Sprint (che
            # contano per il mondiale), a differenza della tabella
            # piazzamenti/vittorie qui sopra che mostra solo le gare della
            # domenica: sommati con una query separata su TUTTE le righe.
            cur.execute(
                "SELECT COALESCE(SUM(punti), 0) AS totale FROM risultati_gara WHERE pilota_id = %(pilota_id)s",
                {"pilota_id": pilota["id"]},
            )
            punti_totali_carriera = cur.fetchone()["totale"]
    finally:
        conn.close()

    vittorie_totali = sum(1 for r in risultati if r["posizione"] == 1)

    return SchedaPilota(
        pilota=pilota["pilota"],
        pilota_slug=pilota["pilota_slug"],
        nazione_codice=pilota["nazione_codice"],
        data_nascita=pilota["data_nascita"],
        data_morte=pilota["data_morte"],
        url_wikipedia=pilota["url_wikipedia"],
        biografia=pilota["biografia"],
        curiosita=pilota["curiosita"],
        fonti_sufficienti=pilota["fonti_sufficienti"],
        ultima_scuderia=pilota["ultima_scuderia"],
        punti_totali_carriera=punti_totali_carriera,
        vittorie_totali=vittorie_totali,
        gare_totali=len(risultati),
        risultati=[RisultatoStoricoPilota(**r) for r in risultati],
    )


@app.get("/circuiti", response_model=list[VoceCircuito])
def elenco_circuiti():
    """Indice di tutti i circuiti presenti nel database, per la pagina
    /circuiti del frontend (Fase D). Esclude i circuiti fittizi (es.
    Brianza Speed Ring, il tracciato del gioco Time Attack): quelli non
    sono mai esistiti davvero, non appartengono all'archivio storico."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ci.nome, ci.codice_riferimento AS slug,
                       n.codice_iso2 AS nazione_codice, n.nome AS nazione_nome,
                       ci.localita
                FROM circuiti ci
                LEFT JOIN nazioni n ON n.id = ci.nazione_id
                WHERE ci.fittizio = false
                ORDER BY ci.nome ASC
                """
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return [VoceCircuito(**riga) for riga in righe]


@app.get("/circuiti/{slug}", response_model=SchedaCircuito)
def scheda_circuito(slug: str):
    """Scheda di un circuito: info di base, elenco gare storiche disputate
    lì (con vincitore) e albo d'oro (piloti più vincenti su quel
    tracciato), usata dalla pagina /circuiti/:slug del frontend."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ci.id, ci.nome, ci.codice_riferimento AS slug, ci.localita,
                       n.codice_iso2 AS nazione_codice, ci.lunghezza_km,
                       ci.indirizzo, ci.capienza, ci.google_maps_url, ci.storia
                FROM circuiti ci
                LEFT JOIN nazioni n ON n.id = ci.nazione_id
                WHERE ci.codice_riferimento = %(slug)s AND ci.fittizio = false
                """,
                {"slug": slug},
            )
            circuito = cur.fetchone()
            if circuito is None:
                raise HTTPException(status_code=404, detail=f"Nessun circuito trovato con slug '{slug}'.")

            cur.execute(
                """
                SELECT ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota
                FROM circuiti_curve
                WHERE circuito_id = %(circuito_id)s
                ORDER BY ordine ASC
                """,
                {"circuito_id": circuito["id"]},
            )
            curve = cur.fetchall()

            cur.execute(
                """
                SELECT anno_da, anno_a, lunghezza_km, descrizione
                FROM circuiti_configurazioni
                WHERE circuito_id = %(circuito_id)s
                ORDER BY anno_da ASC
                """,
                {"circuito_id": circuito["id"]},
            )
            configurazioni = cur.fetchall()

            cur.execute(
                """
                SELECT
                    s.anno,
                    gp.nome_gp,
                    gp.data_gara,
                    vincitore.nome || ' ' || vincitore.cognome AS vincitore,
                    vincitore.codice_riferimento AS vincitore_slug
                FROM gran_premi gp
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                LEFT JOIN risultati_gara r
                    ON r.gran_premio_id = gp.id AND r.posizione_finale = 1 AND r.tipo_sessione = 'gara'
                LEFT JOIN piloti vincitore ON vincitore.id = r.pilota_id
                WHERE ci.codice_riferimento = %(slug)s
                ORDER BY gp.data_gara ASC NULLS LAST, s.anno ASC
                """,
                {"slug": slug},
            )
            gare = cur.fetchall()

            cur.execute(
                """
                SELECT
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS pilota_slug,
                    n.codice_iso2 AS nazione_codice,
                    COUNT(*) AS vittorie
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN piloti p ON p.id = r.pilota_id
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                WHERE ci.codice_riferimento = %(slug)s AND r.posizione_finale = 1 AND r.tipo_sessione = 'gara'
                GROUP BY p.id, p.nome, p.cognome, p.codice_riferimento, n.codice_iso2
                ORDER BY vittorie DESC, pilota ASC
                """,
                {"slug": slug},
            )
            albo_oro = cur.fetchall()
    finally:
        conn.close()

    return SchedaCircuito(
        nome=circuito["nome"],
        slug=circuito["slug"],
        localita=circuito["localita"],
        nazione_codice=circuito["nazione_codice"],
        lunghezza_km=circuito["lunghezza_km"],
        indirizzo=circuito["indirizzo"],
        capienza=circuito["capienza"],
        google_maps_url=circuito["google_maps_url"],
        storia=circuito["storia"],
        curve=[CurvaCircuito(**c) for c in curve],
        configurazioni=[ConfigurazioneCircuito(**c) for c in configurazioni],
        gare=[GaraCircuito(**g) for g in gare],
        albo_oro=[VoceAlboOro(**v) for v in albo_oro],
    )


@app.get("/scuderie", response_model=list[VoceScuderia])
def elenco_scuderie():
    """Indice di tutte le scuderie presenti nel database, per la pagina
    /scuderie del frontend."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.nome, c.codice_riferimento AS slug,
                       n.codice_iso2 AS nazione_codice
                FROM costruttori c
                LEFT JOIN nazioni n ON n.id = c.nazione_id
                ORDER BY c.nome ASC
                """
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return [VoceScuderia(**riga) for riga in righe]


@app.get("/scuderie/{slug}", response_model=SchedaScuderia)
def scheda_scuderia(slug: str):
    """Scheda di una scuderia: info di base, storico gare disputate (con
    il miglior risultato ottenuto in ognuna, dato che una scuderia può
    schierare più piloti nella stessa gara) e i piloti che ci hanno
    corso, coi loro totali SOLO per il periodo passato in questa
    scuderia (non di carriera). Usata dalla pagina /scuderie/:slug."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.id, c.nome, c.codice_riferimento AS slug,
                       n.codice_iso2 AS nazione_codice
                FROM costruttori c
                LEFT JOIN nazioni n ON n.id = c.nazione_id
                WHERE c.codice_riferimento = %(slug)s
                """,
                {"slug": slug},
            )
            scuderia = cur.fetchone()
            if scuderia is None:
                raise HTTPException(status_code=404, detail=f"Nessuna scuderia trovata con slug '{slug}'.")

            cur.execute(
                """
                SELECT
                    gp.id AS gran_premio_id,
                    s.anno,
                    gp.nome_gp,
                    ci.codice_riferimento AS circuito,
                    gp.data_gara,
                    p.id AS pilota_id,
                    p.nome || ' ' || p.cognome AS pilota,
                    p.codice_riferimento AS pilota_slug,
                    n.codice_iso2 AS pilota_nazione_codice,
                    r.posizione_finale AS posizione,
                    r.posizione_finale_testo AS posizione_testo,
                    COALESCE(r.punti, 0) AS punti
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN piloti p ON p.id = r.pilota_id
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                WHERE r.costruttore_id = %(costruttore_id)s AND r.tipo_sessione = 'gara'
                ORDER BY s.anno ASC, gp.data_gara ASC NULLS LAST
                """,
                {"costruttore_id": scuderia["id"]},
            )
            risultati = cur.fetchall()

            # Punti totali di scuderia: includono anche i punti Sprint
            # (contano per il mondiale costruttori), a differenza
            # dell'elenco gare/piloti qui sopra che mostra solo le gare
            # della domenica — vedi stessa scelta fatta per /piloti/{slug}.
            cur.execute(
                "SELECT COALESCE(SUM(punti), 0) AS totale FROM risultati_gara WHERE costruttore_id = %(costruttore_id)s",
                {"costruttore_id": scuderia["id"]},
            )
            punti_totali = cur.fetchone()["totale"]

            # Punti totali PER PILOTA con questa scuderia (gara + Sprint):
            # serve per il campo "punti" di ogni voce in piloti qui sotto,
            # che altrimenti (costruito solo dalle righe "gara" di risultati)
            # non conterebbe i punti Sprint del singolo pilota.
            cur.execute(
                """
                SELECT pilota_id, COALESCE(SUM(punti), 0) AS totale
                FROM risultati_gara
                WHERE costruttore_id = %(costruttore_id)s
                GROUP BY pilota_id
                """,
                {"costruttore_id": scuderia["id"]},
            )
            punti_per_pilota = {r["pilota_id"]: float(r["totale"]) for r in cur.fetchall()}
    finally:
        conn.close()

    if not risultati:
        # La scuderia esiste ma non ha (ancora) risultati importati: si
        # restituisce comunque la scheda, con liste vuote, invece di un
        # 404 che sarebbe fuorviante (la scuderia c'è davvero).
        return SchedaScuderia(
            nome=scuderia["nome"],
            slug=scuderia["slug"],
            nazione_codice=scuderia["nazione_codice"],
            punti_totali=0,
            vittorie_totali=0,
            gare_totali=0,
            gare=[],
            piloti=[],
        )

    vittorie_totali = sum(1 for r in risultati if r["posizione"] == 1)

    # Una riga "gara" per ogni gran premio disputato: si tiene il
    # migliore dei risultati di quella gara (posizione più bassa vince;
    # i ritiri/non classificati, posizione nulla, vanno dopo).
    def chiave_migliore(riga):
        return (riga["posizione"] is None, riga["posizione"] or 0)

    gare_per_id = {}
    for r in risultati:
        gp_id = r["gran_premio_id"]
        if gp_id not in gare_per_id or chiave_migliore(r) < chiave_migliore(gare_per_id[gp_id]):
            gare_per_id[gp_id] = r

    gare = [
        GaraScuderia(
            anno=r["anno"],
            nome_gp=r["nome_gp"],
            circuito=r["circuito"],
            data_gara=r["data_gara"],
            miglior_pilota=r["pilota"],
            miglior_pilota_slug=r["pilota_slug"],
            miglior_posizione=r["posizione"],
            miglior_posizione_testo=r["posizione_testo"],
        )
        for r in sorted(gare_per_id.values(), key=lambda r: (r["anno"], r["data_gara"] or date.min))
    ]

    # Un pilota per riga: i totali contano SOLO i risultati ottenuti con
    # QUESTA scuderia, non l'intera carriera del pilota (che può aver
    # corso anche per altre scuderie, con numeri diversi).
    piloti_map = {}
    for r in risultati:
        pid = r["pilota_id"]
        voce = piloti_map.setdefault(
            pid,
            {
                "pilota": r["pilota"],
                "pilota_slug": r["pilota_slug"],
                "nazione_codice": r["pilota_nazione_codice"],
                "gare": 0,
                "vittorie": 0,
                "punti": 0.0,
            },
        )
        voce["gare"] += 1
        voce["vittorie"] += 1 if r["posizione"] == 1 else 0

    # I punti si sovrascrivono qui (invece di sommarli riga per riga sopra)
    # con il totale gara+Sprint calcolato nella query dedicata: "gare" e
    # "vittorie" restano invece basati solo sulle righe "gara".
    for pid, voce in piloti_map.items():
        voce["punti"] = punti_per_pilota.get(pid, 0.0)

    piloti = sorted(piloti_map.values(), key=lambda v: (-v["punti"], -v["vittorie"], v["pilota"]))

    return SchedaScuderia(
        nome=scuderia["nome"],
        slug=scuderia["slug"],
        nazione_codice=scuderia["nazione_codice"],
        punti_totali=punti_totali,
        vittorie_totali=vittorie_totali,
        gare_totali=len(gare_per_id),
        gare=gare,
        piloti=[VocePilotaScuderia(**v) for v in piloti],
    )


# == Arcade ==
# Endpoint dei giochi della sezione /arcade del frontend. La logica di
# generazione vera e propria vive in chronoquiz.py (vedi il modulo per
# il perché): questo endpoint resta un guscio sottile, stesso stile di
# connessione apri/chiudi degli altri qui sopra.


@app.get("/arcade/chronoquiz/questions", response_model=list[DomandaChronoQuiz])
def chronoquiz_questions():
    """10 domande generate a caso per una partita a ChronoQuiz (possono
    essere meno di 10 se il DB non ha abbastanza dati per generarne di
    più — vedi policy "meglio vuoto che inventato" in chronoquiz.py).
    Nessun parametro: ogni chiamata genera un set nuovo e indipendente,
    non c'è un concetto di sessione/utente da tracciare lato server."""
    conn = get_connection()
    try:
        domande = genera_quiz(conn, n_domande=10)
    finally:
        conn.close()

    if not domande:
        raise HTTPException(
            status_code=503,
            detail="Impossibile generare domande in questo momento: dati insufficienti nel database.",
        )

    return [DomandaChronoQuiz(**d) for d in domande]


@app.post("/arcade/punteggi", response_model=RispostaPunteggio)
def salva_punteggio_arcade(payload: RichiestaPunteggio, authorization: str = Header(default="")):
    """Salva un punteggio Arcade SOLO se la richiesta arriva da un utente
    Netlify Identity valido (header Authorization: Bearer <token>). Login
    facoltativo in questo progetto: senza token valido non è un errore,
    risponde comunque 200 con salvato=False — è il caso normale di chi
    gioca senza account (vedi ChronoQuizView.jsx)."""
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    # Autocommit invece di un'unica transazione con commit manuale: serve
    # a utente_da_token, che può dover ritentare un INSERT dopo un
    # UniqueViolation (username duplicato) senza restare bloccata da una
    # transazione già "avvelenata" dall'errore precedente (vedi auth.py).
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            utente_id, username = utente_da_token(cur, token)
            if utente_id is None:
                return RispostaPunteggio(salvato=False, username=None)

            cur.execute(
                """
                INSERT INTO arcade_punteggi (utente_id, gioco, punti)
                VALUES (%(utente_id)s, %(gioco)s, %(punti)s)
                """,
                {"utente_id": utente_id, "gioco": payload.gioco, "punti": payload.punti},
            )
    finally:
        conn.close()

    return RispostaPunteggio(salvato=True, username=username)


@app.get("/arcade/classifica", response_model=list[VoceClassificaArcade])
def classifica_arcade(gioco: str, limite: int = 10):
    """Top N punteggi di un gioco Arcade (default 10). Una riga per
    partita, non solo il record personale — coerente con arcade_punteggi
    che traccia ogni partita giocata, non solo il massimo per utente."""
    limite = max(1, min(limite, 50))  # rete di sicurezza contro richieste abnormi
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.username, ap.punti, ap.creato_il
                FROM arcade_punteggi ap
                JOIN utenti u ON u.id = ap.utente_id
                WHERE ap.gioco = %(gioco)s
                ORDER BY ap.punti DESC
                LIMIT %(limite)s
                """,
                {"gioco": gioco, "limite": limite},
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return [VoceClassificaArcade(**r) for r in righe]


@app.get("/arcade/mio-record", response_model=RispostaMioRecordArcade)
def mio_record_arcade(gioco: str, authorization: str = Header(default="")):
    """Il punteggio massimo dell'utente loggato per un gioco Arcade, su
    tutte le partite giocate (arcade_punteggi tiene una riga per
    partita, non solo la migliore) — usato dal frontend per mostrare
    "il tuo record" accanto al record assoluto della classifica. Login
    facoltativo: senza token risponde comunque 200 con punti=null."""
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    conn.autocommit = True  # utente_da_token può scrivere una riga nuova al primo accesso
    try:
        with conn.cursor() as cur:
            utente_id, _username = utente_da_token(cur, token)
            if utente_id is None:
                return RispostaMioRecordArcade(punti=None)

            cur.execute(
                """
                SELECT MAX(punti) AS punti FROM arcade_punteggi
                WHERE utente_id = %(u)s AND gioco = %(gioco)s
                """,
                {"u": utente_id, "gioco": gioco},
            )
            riga = cur.fetchone()
    finally:
        conn.close()

    return RispostaMioRecordArcade(punti=riga["punti"] if riga is not None else None)


# == Time Attack ("Monoposto Virtual Arena") ==
# Stessa filosofia di ChronoQuiz: login sempre facoltativo per GIOCARE,
# ma qui — a differenza di ChronoQuiz — è obbligatorio per SALVARE un
# tempo ufficiale (Qualifica/Gara): il concetto stesso di campionato
# richiede un'identità persistente. Le Prove Libere non passano mai da
# qui: girano solo lato frontend, nessuna chiamata a questi endpoint.


def _circuito_da_slug(cur, slug):
    """Risolve uno slug nel suo id interno + nome, o None se non esiste.
    Helper condiviso dai 3 endpoint sotto che accettano uno slug."""
    cur.execute(
        "SELECT id, nome FROM circuiti WHERE codice_riferimento = %(slug)s",
        {"slug": slug},
    )
    return cur.fetchone()


def _giorni_trascorsi_da(timestamp):
    """Giorni trascorsi da `timestamp` a adesso. Robusto sia che
    psycopg2 l'abbia restituito "aware" (con fuso orario, atteso per una
    colonna TIMESTAMPTZ) sia "naive" (senza): un mismatch tra i due nella
    sottrazione diretta solleva un TypeError non gestito (un 500 grezzo,
    non un errore applicativo nostro) — meglio non fidarsi ciecamente del
    tipo esatto della colonna sul database reale."""
    ora = datetime.now(timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return (ora - timestamp).days


@app.post("/game/submit", response_model=RispostaInvioTempo)
def invia_tempo_gioco(payload: InvioTempoGioco, authorization: str = Header(default="")):
    """Salva un tempo ufficiale di Time Attack. A differenza di
    /arcade/punteggi, qui il login NON è facoltativo: senza un token
    Netlify Identity valido la richiesta è rifiutata con 401 (il
    campionato ha senso solo con un'identità persistente)."""
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            utente_id, _username = utente_da_token(cur, token)
            if utente_id is None:
                raise HTTPException(
                    status_code=401,
                    detail="Login richiesto per salvare un tempo ufficiale (Prove Libere restano gratuite e locali).",
                )

            circuito = _circuito_da_slug(cur, payload.circuito_slug)
            if circuito is None:
                raise HTTPException(status_code=404, detail="Circuito non trovato.")

            valido, motivo = valida_tentativo(payload.tipo_sessione, payload.tempo_totale, payload.checkpoint)
            if not valido:
                return RispostaInvioTempo(salvato=False, motivo_rifiuto=motivo)

            cur.execute(
                """
                SELECT tempo_totale FROM gioco_tempi
                WHERE utente_id = %(u)s AND circuito_id = %(c)s AND tipo_sessione = %(t)s
                """,
                {"u": utente_id, "c": circuito["id"], "t": payload.tipo_sessione},
            )
            precedente = cur.fetchone()
            if precedente is not None and payload.tempo_totale >= float(precedente["tempo_totale"]):
                return RispostaInvioTempo(
                    salvato=False,
                    record_personale=False,
                    motivo_rifiuto="Tempo non migliore del tuo record precedente su questo circuito e sessione.",
                )

            cur.execute(
                """
                INSERT INTO gioco_tempi (utente_id, circuito_id, tipo_sessione, tempo_totale, telemetria_json)
                VALUES (%(u)s, %(c)s, %(t)s, %(tempo)s, %(tel)s)
                ON CONFLICT (utente_id, circuito_id, tipo_sessione) DO UPDATE SET
                    tempo_totale = EXCLUDED.tempo_totale,
                    telemetria_json = EXCLUDED.telemetria_json,
                    creato_il = now()
                """,
                {
                    "u": utente_id,
                    "c": circuito["id"],
                    "t": payload.tipo_sessione,
                    "tempo": payload.tempo_totale,
                    "tel": psycopg2.extras.Json([cp.model_dump() for cp in payload.checkpoint]),
                },
            )
    finally:
        conn.close()

    return RispostaInvioTempo(salvato=True, record_personale=True)


@app.get("/game/leaderboard/{slug}", response_model=ClassificaTempiCircuito)
def classifica_tempi_circuito(slug: str, limite: int = 10):
    """Classifica Prove Libere, Qualifica e Gara per un circuito,
    separate. Un solo tempo per utente per sessione (il record
    personale, vedi gioco_tempi), quindi nessuna riga duplicata per lo
    stesso pilota."""
    limite = max(1, min(limite, 50))
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            circuito = _circuito_da_slug(cur, slug)
            if circuito is None:
                raise HTTPException(status_code=404, detail="Circuito non trovato.")

            classifiche = {}
            for tipo in ("prove_libere", "qualifica", "gara"):
                cur.execute(
                    """
                    SELECT u.username, gt.tempo_totale, gt.creato_il
                    FROM gioco_tempi gt
                    JOIN utenti u ON u.id = gt.utente_id
                    WHERE gt.circuito_id = %(id)s AND gt.tipo_sessione = %(tipo)s
                    ORDER BY gt.tempo_totale ASC
                    LIMIT %(limite)s
                    """,
                    {"id": circuito["id"], "tipo": tipo, "limite": limite},
                )
                classifiche[tipo] = [VoceClassificaTempi(**r) for r in cur.fetchall()]
    finally:
        conn.close()

    return ClassificaTempiCircuito(
        circuito=circuito["nome"],
        prove_libere=classifiche["prove_libere"],
        qualifica=classifiche["qualifica"],
        gara=classifiche["gara"],
    )


@app.get("/game/campionato", response_model=list[VoceClassificaCampionato])
def classifica_campionato():
    """Classifica generale del Campionato Mondiale Virtuale, per punti
    totali (i punti si accumulano solo chiudendo un GP, vedi
    /game/close-gp — non appena qualcuno registra un tempo di gara)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.username, gc.punti_totali, gc.gare_disputate
                FROM gioco_classifica_campionato gc
                JOIN utenti u ON u.id = gc.utente_id
                ORDER BY gc.punti_totali DESC, gc.gare_disputate ASC
                """
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return [
        VoceClassificaCampionato(
            posizione=indice + 1,
            username=riga["username"],
            punti_totali=riga["punti_totali"],
            gare_disputate=riga["gare_disputate"],
        )
        for indice, riga in enumerate(righe)
    ]


def _chiudi_gp_circuito(cur, circuito_id):
    """Logica di chiusura condivisa tra /game/close-gp/{slug} (manuale)
    e /game/close-gp-automatico (schedulato): assegna i punti
    campionato (25-18-15-...-1) in base alla classifica Gara del
    circuito e lo marca come chiuso. Il chiamante deve aver già
    verificato che il circuito non sia già chiuso — questa funzione non
    lo ricontrolla, per evitare due query identiche quando il chiamante
    l'ha già fatta (vedi chiudi_gp_automatico, che filtra a monte con
    una NOT IN)."""
    cur.execute(
        """
        SELECT u.id AS utente_id, u.username
        FROM gioco_tempi gt
        JOIN utenti u ON u.id = gt.utente_id
        WHERE gt.circuito_id = %(id)s AND gt.tipo_sessione = 'gara'
        ORDER BY gt.tempo_totale ASC
        """,
        {"id": circuito_id},
    )
    classifica_gara = cur.fetchall()

    punti_assegnati = {}
    for posizione, riga in enumerate(classifica_gara, start=1):
        punti = PUNTI_PER_POSIZIONE[posizione - 1] if posizione <= len(PUNTI_PER_POSIZIONE) else 0
        if punti > 0:
            punti_assegnati[riga["username"]] = punti
        cur.execute(
            """
            INSERT INTO gioco_classifica_campionato (utente_id, punti_totali, gare_disputate)
            VALUES (%(utente_id)s, %(punti)s, 1)
            ON CONFLICT (utente_id) DO UPDATE SET
                punti_totali = gioco_classifica_campionato.punti_totali + EXCLUDED.punti_totali,
                gare_disputate = gioco_classifica_campionato.gare_disputate + 1,
                aggiornato_il = now()
            """,
            {"utente_id": riga["utente_id"], "punti": punti},
        )

    cur.execute("INSERT INTO gioco_gp_chiusi (circuito_id) VALUES (%(id)s)", {"id": circuito_id})
    return punti_assegnati, len(classifica_gara)


@app.post("/game/close-gp/{slug}", response_model=RispostaChiusuraGp)
def chiudi_gp(slug: str, x_admin_key: str = Header(default="")):
    """Chiude un GP a mano, per un circuito specifico, indipendentemente
    dalle soglie della chiusura automatica (vedi close-gp-automatico
    più sotto) — usato dal pannello /admin/chiudi-gp per forzare una
    chiusura anticipata. Idempotente: una seconda chiamata sullo stesso
    circuito restituisce 409, non assegna i punti due volte.

    Protetto da una chiave condivisa (header X-Admin-Key) invece che da
    un vero sistema di ruoli, che questo progetto non ha ancora: fail
    closed se GAME_ADMIN_KEY non è configurata su Render."""
    if not GAME_ADMIN_KEY or x_admin_key != GAME_ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Non autorizzato.")

    conn = get_connection()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            circuito = _circuito_da_slug(cur, slug)
            if circuito is None:
                raise HTTPException(status_code=404, detail="Circuito non trovato.")

            cur.execute("SELECT 1 FROM gioco_gp_chiusi WHERE circuito_id = %(id)s", {"id": circuito["id"]})
            if cur.fetchone() is not None:
                raise HTTPException(status_code=409, detail="Il GP per questo circuito è già stato chiuso.")

            punti_assegnati, n_partecipanti = _chiudi_gp_circuito(cur, circuito["id"])
    finally:
        conn.close()

    return RispostaChiusuraGp(
        circuito=circuito["nome"],
        piloti_classificati=n_partecipanti,
        punti_assegnati=punti_assegnati,
    )


@app.post("/game/close-gp-automatico", response_model=RispostaChiusuraAutomatica)
def chiudi_gp_automatico(x_admin_key: str = Header(default="")):
    """Chiude automaticamente OGNI GP pronto (vedi game.gp_pronto_per_chiusura:
    almeno SOGLIA_PARTECIPANTI_CHIUSURA_AUTOMATICA piloti diversi hanno
    fatto una Gara su quel circuito, OPPURE sono passati almeno
    SOGLIA_GIORNI_CHIUSURA_AUTOMATICA giorni dal primo tempo di Gara
    registrato lì) tra i circuiti non ancora chiusi. Nessuno slug da
    passare: valuta tutti i circuiti in un colpo solo.

    Pensata per essere chiamata periodicamente da un job schedulato,
    non da un utente — vedi .github/workflows/chiudi-gp-automatico.yml.
    Zero GP chiusi in una chiamata è un esito normale (nessun circuito
    ha ancora raggiunto una delle due soglie), non un errore."""
    if not GAME_ADMIN_KEY or x_admin_key != GAME_ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Non autorizzato.")

    conn = get_connection()
    conn.autocommit = True
    gp_chiusi = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ci.id, ci.nome,
                       COUNT(DISTINCT gt.utente_id) AS partecipanti,
                       MIN(gt.creato_il) AS primo_tempo
                FROM gioco_tempi gt
                JOIN circuiti ci ON ci.id = gt.circuito_id
                WHERE gt.tipo_sessione = 'gara'
                  AND ci.id NOT IN (SELECT circuito_id FROM gioco_gp_chiusi)
                GROUP BY ci.id, ci.nome
                """
            )
            candidati = cur.fetchall()

            for candidato in candidati:
                giorni_trascorsi = _giorni_trascorsi_da(candidato["primo_tempo"])
                if not gp_pronto_per_chiusura(candidato["partecipanti"], giorni_trascorsi):
                    continue

                punti_assegnati, n_partecipanti = _chiudi_gp_circuito(cur, candidato["id"])
                gp_chiusi.append(
                    RispostaChiusuraGp(
                        circuito=candidato["nome"],
                        piloti_classificati=n_partecipanti,
                        punti_assegnati=punti_assegnati,
                    )
                )
    finally:
        conn.close()

    return RispostaChiusuraAutomatica(gp_chiusi=gp_chiusi)


# == Livello Pilota unificato ==
# Somma i punteggi di TUTTI i giochi Arcade in un solo "Livello Pilota",
# invece di lasciarlo calcolato solo lato frontend da un unico gioco
# (com'era finché esisteva solo ChronoQuiz). Richiede login: senza
# un'identità non c'è nulla da sommare — il frontend usa questo
# endpoint solo se il visitatore è loggato, altrimenti mantiene il
# vecchio calcolo locale (solo ChronoQuiz, da localStorage) come
# fallback per chi gioca senza account.
#
# La colonna utenti.livello_pilota non viene letta né scritta qui: il
# livello è ricalcolato al volo dalle tabelle dei punteggi ogni volta
# che viene chiesto, invece di tenere un valore salvato che rischia di
# disallinearsi (nessun trigger/job che lo aggiornerebbe altrimenti).

LIVELLI_PILOTA = [
    (1000, "Campione del Mondo"),
    (500, "Collaudatore"),
    (200, "Meccanico"),
    (0, "Rookie"),
]


def _livello_da_punti(punti_totali):
    for soglia, nome in LIVELLI_PILOTA:
        if punti_totali >= soglia:
            return nome
    return "Rookie"


@app.get("/arcade/livello", response_model=RispostaLivelloPilota)
def livello_pilota(authorization: str = Header(default="")):
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    # Autocommit anche qui, pur essendo un endpoint "di sola lettura" per
    # i punteggi: utente_da_token può scrivere una riga nuova in utenti
    # al primo accesso di qualcuno, e senza autocommit quella scrittura
    # verrebbe annullata alla chiusura della connessione (bug reale
    # trovato testando questo endpoint, non solo per prudenza).
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            utente_id, username = utente_da_token(cur, token)
            if utente_id is None:
                raise HTTPException(status_code=401, detail="Login richiesto.")

            cur.execute(
                """
                SELECT COALESCE(MAX(punti), 0) AS record
                FROM arcade_punteggi
                WHERE utente_id = %(u)s AND gioco = 'chronoquiz'
                """,
                {"u": utente_id},
            )
            record_chronoquiz = cur.fetchone()["record"]

            cur.execute(
                "SELECT punti_totali FROM gioco_classifica_campionato WHERE utente_id = %(u)s",
                {"u": utente_id},
            )
            riga_campionato = cur.fetchone()
            punti_campionato = riga_campionato["punti_totali"] if riga_campionato else 0
    finally:
        conn.close()

    punti_totali = record_chronoquiz + punti_campionato
    return RispostaLivelloPilota(
        username=username,
        punti_totali=punti_totali,
        livello=_livello_da_punti(punti_totali),
    )


@app.get("/game/mio-record/{slug}", response_model=RispostaMioRecord)
def mio_record(slug: str, authorization: str = Header(default="")):
    """Il tempo personale dell'utente loggato su questo circuito, per
    Prove Libere, Qualifica e Gara separatamente — usato dal frontend
    per colorare di viola un giro che batte il proprio record assoluto.
    Login facoltativo: senza token risponde comunque 200 con tutti i
    campi null (nessun errore, semplicemente niente da confrontare)."""
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    conn.autocommit = True  # utente_da_token può scrivere una riga nuova al primo accesso
    try:
        with conn.cursor() as cur:
            circuito = _circuito_da_slug(cur, slug)
            if circuito is None:
                raise HTTPException(status_code=404, detail="Circuito non trovato.")

            utente_id, _username = utente_da_token(cur, token)
            if utente_id is None:
                return RispostaMioRecord(prove_libere=None, qualifica=None, gara=None)

            valori = {}
            for tipo in ("prove_libere", "qualifica", "gara"):
                cur.execute(
                    """
                    SELECT tempo_totale FROM gioco_tempi
                    WHERE utente_id = %(u)s AND circuito_id = %(c)s AND tipo_sessione = %(t)s
                    """,
                    {"u": utente_id, "c": circuito["id"], "t": tipo},
                )
                riga = cur.fetchone()
                valori[tipo] = float(riga["tempo_totale"]) if riga is not None else None
    finally:
        conn.close()

    return RispostaMioRecord(**valori)


@app.get("/game/griglia/{slug}", response_model=RispostaGriglia)
def griglia_partenza(slug: str, authorization: str = Header(default="")):
    """Posizione di partenza in griglia per la Gara: quanti piloti hanno
    un tempo di Qualifica su questo circuito più veloce del proprio.
    Login facoltativo: senza token (o senza un tempo di qualifica lì)
    risponde comunque 200 con posizione=null — in F1 senza un tempo di
    qualifica si parte comunque, dal fondo, non è un errore."""
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    conn = get_connection()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            circuito = _circuito_da_slug(cur, slug)
            if circuito is None:
                raise HTTPException(status_code=404, detail="Circuito non trovato.")

            cur.execute(
                "SELECT COUNT(*) AS n FROM gioco_tempi WHERE circuito_id = %(c)s AND tipo_sessione = 'qualifica'",
                {"c": circuito["id"]},
            )
            piloti_totali = cur.fetchone()["n"]

            posizione = None
            utente_id, _username = utente_da_token(cur, token)
            if utente_id is not None:
                cur.execute(
                    """
                    SELECT tempo_totale FROM gioco_tempi
                    WHERE utente_id = %(u)s AND circuito_id = %(c)s AND tipo_sessione = 'qualifica'
                    """,
                    {"u": utente_id, "c": circuito["id"]},
                )
                mio_tempo = cur.fetchone()
                if mio_tempo is not None:
                    cur.execute(
                        """
                        SELECT COUNT(*) AS n FROM gioco_tempi
                        WHERE circuito_id = %(c)s AND tipo_sessione = 'qualifica' AND tempo_totale < %(t)s
                        """,
                        {"c": circuito["id"], "t": mio_tempo["tempo_totale"]},
                    )
                    posizione = cur.fetchone()["n"] + 1
    finally:
        conn.close()

    return RispostaGriglia(posizione=posizione, piloti_totali=piloti_totali)
