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
from datetime import date
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from db import get_connection
from schemas import (
    ConfigurazioneCircuito,
    CurvaCircuito,
    GaraCircuito,
    GaraScuderia,
    GaraStagione,
    RisultatiGara,
    RisultatoPilota,
    RisultatoStoricoPilota,
    SchedaCircuito,
    SchedaPilota,
    SchedaScuderia,
    VoceAlboOro,
    VoceCircuito,
    VoceClassificaPiloti,
    VoceClassificaScuderie,
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
    allow_methods=["GET"],
    allow_headers=["*"],
)


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
                SELECT gp.nome_gp, gp.data_gara
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

            cur.execute(
                """
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
                ORDER BY r.posizione_finale NULLS LAST, r.giri_completati DESC NULLS LAST
                """,
                {"anno": anno, "circuito": circuito},
            )
            righe = cur.fetchall()
    finally:
        conn.close()

    return RisultatiGara(
        anno=anno,
        circuito=circuito,
        nome_gp=gp_meta["nome_gp"],
        data_gara=gp_meta["data_gara"],
        risultati=[RisultatoPilota(**riga) for riga in righe],
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
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1) AS vittorie,
                    COUNT(*) AS gare_disputate
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
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1) AS vittorie,
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
                SELECT gp.nome_gp, ci.codice_riferimento AS circuito, gp.data_gara
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
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1) AS vittorie_totali,
                    COUNT(*) AS gare_totali,
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
                WHERE r.pilota_id = %(pilota_id)s
                ORDER BY s.anno ASC, gp.data_gara ASC
                """,
                {"pilota_id": pilota["id"]},
            )
            risultati = cur.fetchall()
    finally:
        conn.close()

    punti_totali_carriera = sum(r["punti"] for r in risultati)
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
    /circuiti del frontend (Fase D)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ci.nome, ci.codice_riferimento AS slug,
                       n.codice_iso2 AS nazione_codice, ci.localita
                FROM circuiti ci
                LEFT JOIN nazioni n ON n.id = ci.nazione_id
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
                WHERE ci.codice_riferimento = %(slug)s
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
                    ON r.gran_premio_id = gp.id AND r.posizione_finale = 1
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
                WHERE ci.codice_riferimento = %(slug)s AND r.posizione_finale = 1
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
                WHERE r.costruttore_id = %(costruttore_id)s
                ORDER BY s.anno ASC, gp.data_gara ASC NULLS LAST
                """,
                {"costruttore_id": scuderia["id"]},
            )
            risultati = cur.fetchall()
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

    punti_totali = sum(r["punti"] for r in risultati)
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
        voce["punti"] += float(r["punti"])

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
