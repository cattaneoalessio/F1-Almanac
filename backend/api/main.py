"""
main.py — API FastAPI del progetto (Fase C).

Due endpoint, come richiesto:
  GET /gare/risultati?anno=&circuito=   -> ordine di arrivo completo di una gara
  GET /classifica/piloti?anno=          -> classifica piloti di una stagione (bonus,
                                            utile al frontend storico/fase D)

Nota sui punti: sia qui che nella classifica i punti NON vengono letti
dalla colonna risultati_gara.punti (che l'import di Fase B lascia a 0),
ma calcolati al volo unendo la posizione di ogni pilota alla tabella
punti_per_posizione del sistema di punteggio della sua stagione. Così
lo schema disegnato in Fase A (pensato apposta per gestire punteggi
storici diversi da quelli moderni) viene davvero usato, invece di
restare solo teoria. Il punto bonus per il giro più veloce NON è
incluso: l'import di Fase B non popola ancora il campo giro_veloce.

Avvio in locale:
    pip install fastapi uvicorn[standard] psycopg2-binary python-dotenv --break-system-packages
    uvicorn main:app --reload
Poi apri http://127.0.0.1:8000/docs per la documentazione interattiva
generata automaticamente da FastAPI.
"""
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from db import get_connection
from schemas import (
    GaraCircuito,
    GaraStagione,
    RisultatiGara,
    RisultatoPilota,
    RisultatoStoricoPilota,
    SchedaCircuito,
    SchedaPilota,
    VoceAlboOro,
    VoceCircuito,
    VoceClassificaPiloti,
)

app = FastAPI(
    title="GP Almanac API",
    description="API dei risultati storici del progetto (nome di lavoro, non definitivo).",
    version="0.1.0",
)

# CORS aperto a tutte le origini: va bene per sviluppo locale. Prima di
# andare online, restringilo al dominio reale del frontend (una riga
# sola da cambiare qui sotto).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://f1-almanac.netlify.app"],
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
                    COALESCE(pp.punti, 0) AS punti
                FROM gran_premi gp
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN risultati_gara r ON r.gran_premio_id = gp.id
                JOIN piloti p ON p.id = r.pilota_id
                JOIN costruttori c ON c.id = r.costruttore_id
                LEFT JOIN stati_risultato sr ON sr.id = r.stato_id
                LEFT JOIN punti_per_posizione pp
                    ON pp.sistema_punteggio_id = s.sistema_punteggio_id
                    AND pp.posizione = r.posizione_finale
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
                    COALESCE(SUM(pp.punti), 0) AS punti_totali,
                    COUNT(*) FILTER (WHERE r.posizione_finale = 1) AS vittorie,
                    COUNT(*) AS gare_disputate
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN piloti p ON p.id = r.pilota_id
                LEFT JOIN nazioni n ON n.id = p.nazione_id
                LEFT JOIN punti_per_posizione pp
                    ON pp.sistema_punteggio_id = s.sistema_punteggio_id
                    AND pp.posizione = r.posizione_finale
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
                    n.codice_iso2 AS nazione_codice
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
                    COALESCE(pp.punti, 0) AS punti
                FROM risultati_gara r
                JOIN gran_premi gp ON gp.id = r.gran_premio_id
                JOIN stagioni s ON s.id = gp.stagione_id
                JOIN circuiti ci ON ci.id = gp.circuito_id
                JOIN costruttori c ON c.id = r.costruttore_id
                LEFT JOIN punti_per_posizione pp
                    ON pp.sistema_punteggio_id = s.sistema_punteggio_id
                    AND pp.posizione = r.posizione_finale
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
                SELECT ci.nome, ci.codice_riferimento AS slug, ci.localita,
                       n.codice_iso2 AS nazione_codice, ci.lunghezza_km
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
        gare=[GaraCircuito(**g) for g in gare],
        albo_oro=[VoceAlboOro(**v) for v in albo_oro],
    )
