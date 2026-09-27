#!/usr/bin/env python3
"""
update_data.py — Genera i JSON statici per la sezione "Analisi GP" di monoposto.ai.

USO
----
    python update_data.py                      # ultimo GP disputato della stagione in corso
    python update_data.py --year 2026           # ultimo GP disputato di quella stagione
    python update_data.py --year 2026 --round 15  # un GP specifico
    python update_data.py --all                 # rigenera TUTTI i GP disputati della stagione in corso

OUTPUT
------
Per ogni GP elaborato, crea la cartella data/<anno>_<round>_<slug-circuito>/ con:
    meta.json              - info evento, elenco piloti (con colori scuderia), risultati
                              gara/qualifica, contesto mondiale (Jolpica: classifica piloti
                              dopo questo GP)
    laps.json               - TUTTI i giri di TUTTI i piloti (Qualifica + Gara): tempo sul
                              giro, mescola, stint, posizione — usato per il grafico "Lap
                              Time Comparison" e per gli "Tyre Stints"
    telemetry.json          - il GIRO PIÙ VELOCE DI OGNI PILOTA (non solo i 3 assoluti, vedi
                              nota sotto), con Velocità/Acceleratore/Freno/DRS vs Distanza —
                              usato per il grafico di telemetria comparativa

Aggiorna anche data/index.json con l'elenco di tutti i GP disponibili (serve al frontend per
popolare il menu a tendina "Gran Premio").

NOTA DI DESIGN — perché "il giro più veloce di ogni pilota" e non solo "i 3 più veloci in
assoluto": la richiesta originale chiede entrambe le cose insieme ("i 3 giri più veloci in
assoluto... per un confronto iniziale" E "due piloti A SCELTA") ma sono in tensione — se si
esportano solo 3 giri in totale, la scelta tra i due piloti da confrontare non è più libera
per chiunque non sia tra quei 3. Qui si esporta il giro più veloce di CIASCUN pilota (circa
20 giri per sessione, non centinaia: non tutti i giri di tutti i piloti, che sarebbe troppo
pesante per un sito statico), così il confronto è davvero libero come richiesto, e si
marcano comunque esplicitamente i 3 assoluti più veloci in `meta.json` (campo
`top3_qualifica` / `top3_gara`) perché il frontend li usi come selezione di default.

DIPENDENZE
----------
    pip install fastf1

    fastf1 include già un client per la Jolpica-F1 API (successore di Ergast, dismessa a
    inizio 2025) in fastf1.ergast.Ergast — non serve un pacchetto "jolpica-f1" a parte:
    non esiste come pacchetto pip installabile (verificato: 404 su PyPI), Jolpica è
    un'API REST (https://api.jolpi.ca/ergast/f1/), e fastf1.ergast la incapsula già.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import fastf1
import fastf1.ergast
import pandas as pd

# ---------------------------------------------------------------------------
# Configurazione
# ---------------------------------------------------------------------------

# Cartella della cache FastF1: FONDAMENTALE. Senza cache, ogni run riscarica
# da zero tutti i dati di sessione dai server F1/Jolpica, sovraccaricandoli
# inutilmente e rischiando un blocco per troppe richieste. Rimane sul tuo
# computer da un lancio all'altro dello script (esecuzione manuale locale,
# non un workflow GitHub Actions — i server F1 bloccano le richieste dagli
# indirizzi IP dei servizi cloud, vedi README). Sovrascrivibile con la
# variabile d'ambiente FASTF1_CACHE_DIR, altrimenti ./cache di default.
import os  # noqa: E402  (import qui per leggere subito la env var)

CACHE_DIR = Path(os.environ.get("FASTF1_CACHE_DIR", "cache"))
DATA_DIR = Path(os.environ.get("F1_DATA_DIR", "data"))

# Jolpica-F1 chiede esplicitamente un User-Agent identificativo (non quello
# di default) per poter distinguere client "ben educati" in caso di abusi
# altrui — vedi https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md
USER_AGENT = f"monoposto.ai-analisi-gp/1.0 fastf1/{fastf1.__version__}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("update_data")


def configura_ambiente() -> None:
    """Cache FastF1 + User-Agent Jolpica. Va chiamata UNA VOLTA sola, prima
    di qualunque altra chiamata a fastf1 (get_session, Ergast, ...)."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))
    # Il modulo fastf1.ergast.interface espone l'header di default: lo
    # sostituiamo con uno che include il nome della nostra app, come da
    # linee guida Jolpica (non lo azzeriamo: manteniamo comunque
    # l'indicazione della libreria sottostante, utile a loro per capire da
    # dove arriva il traffico).
    import fastf1.ergast.interface as ergast_interface

    ergast_interface.HEADERS["User-Agent"] = USER_AGENT


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------


def slug(testo: str) -> str:
    """'São Paulo Grand Prix' -> 'sao-paulo-grand-prix' — per i nomi di cartella."""
    testo = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    testo = re.sub(r"[^a-zA-Z0-9]+", "-", testo).strip("-").lower()
    return testo


def td_to_seconds(valore: Any) -> Optional[float]:
    """Converte un pandas.Timedelta in secondi (float), None se NaT/NaN.
    JSON non sa serializzare i Timedelta di pandas: vanno convertiti a mano
    PRIMA di passare i dati a json.dump, altrimenti solleva TypeError."""
    if valore is None or pd.isna(valore):
        return None
    return round(valore.total_seconds(), 3)


def pulisci_float(valore: Any, decimali: int = 2) -> Optional[float]:
    """None se NaN, altrimenti float arrotondato — riduce sensibilmente la
    dimensione dei JSON di telemetria senza perdere precisione utile
    (i canali telemetria non hanno bisogno di 15 cifre decimali)."""
    if valore is None or (isinstance(valore, float) and pd.isna(valore)):
        return None
    return round(float(valore), decimali)


def scrivi_json(percorso: Path, dati: Any) -> None:
    percorso.parent.mkdir(parents=True, exist_ok=True)
    with open(percorso, "w", encoding="utf-8") as f:
        # separators compatti: questi file li legge solo il browser, non un
        # umano — risparmiare spazio conta più della leggibilità qui.
        json.dump(dati, f, ensure_ascii=False, separators=(",", ":"))
    log.info("Scritto %s (%.1f KB)", percorso, percorso.stat().st_size / 1024)


# ---------------------------------------------------------------------------
# Individuazione del GP da elaborare
# ---------------------------------------------------------------------------


def _rendi_confrontabile_utc(colonna_date: pd.Series) -> pd.Series:
    """EventDate è normalmente tz-naive (rappresenta già l'UTC senza il
    fuso esplicito) — ma un cambiamento futuro in FastF1, o un backend
    dati diverso da quello di default, potrebbe restituirla tz-aware.
    Gestiamo entrambi i casi esplicitamente invece di assumerne uno solo:
    un errore qui bloccherebbe la scelta del GP giusto senza un motivo
    ovvio da diagnosticare."""
    if colonna_date.dt.tz is None:
        return colonna_date.dt.tz_localize("UTC")
    return colonna_date.dt.tz_convert("UTC")


def trova_ultimo_gp_disputato(anno: int) -> int:
    """Numero di round dell'ultimo GP di `anno` la cui gara è già avvenuta
    (EventDate nel passato), esclusi i weekend di test. Solleva
    RuntimeError se nessun GP di quell'anno è ancora stato disputato."""
    calendario = fastf1.get_event_schedule(anno, include_testing=False)
    adesso = pd.Timestamp.now(tz="UTC")

    # Confrontiamo "alla giornata" (normalize) per evitare falsi
    # negativi/positivi legati all'ora esatta della gara.
    disputati = calendario[
        _rendi_confrontabile_utc(calendario["EventDate"]).dt.normalize()
        <= adesso.normalize()
    ]
    if disputati.empty:
        raise RuntimeError(
            f"Nessun Gran Premio del {anno} risulta ancora disputato."
        )
    ultimo = disputati.sort_values("RoundNumber").iloc[-1]
    log.info(
        "Ultimo GP disputato del %s: round %s (%s, %s)",
        anno, int(ultimo["RoundNumber"]), ultimo["EventName"], ultimo["Country"],
    )
    return int(ultimo["RoundNumber"])


def elenco_round_disputati(anno: int) -> list[int]:
    """Tutti i round di `anno` già disputati — usato da --all."""
    calendario = fastf1.get_event_schedule(anno, include_testing=False)
    adesso = pd.Timestamp.now(tz="UTC")
    disputati = calendario[
        _rendi_confrontabile_utc(calendario["EventDate"]).dt.normalize()
        <= adesso.normalize()
    ]
    return sorted(int(r) for r in disputati["RoundNumber"])


# ---------------------------------------------------------------------------
# Caricamento sessioni
# ---------------------------------------------------------------------------


def carica_sessione(anno: int, round_: int, tipo: str) -> Optional[fastf1.core.Session]:
    """Carica una sessione (tipo: 'Q' o 'R') con laps+telemetry. Ritorna
    None (invece di sollevare un'eccezione) se la sessione non esiste o i
    dati non sono ancora disponibili sui server F1 — capita ad esempio se
    lo script gira a ridosso della gara e i dati non sono stati ancora
    pubblicati: meglio saltare quel GP con un avviso che far fallire
    l'intera esecuzione (specie con --all, dove un solo GP problematico
    non deve bloccare gli altri)."""
    try:
        sessione = fastf1.get_session(anno, round_, tipo)
    except Exception:
        log.exception("Impossibile ottenere la sessione %s del round %s/%s", tipo, anno, round_)
        return None

    # Contesto diagnostico loggato SUBITO, prima di qualunque cosa possa
    # fallire più sotto: anche se il load()/le verifiche successive si
    # rompono, il log dice già di quale gara/data si tratta — utile per
    # correlare con il calendario reale mentre si diagnostica un problema.
    log.info(
        "Sessione trovata: %s - %s (%s), data evento %s",
        sessione.event.get("EventName", "?"), sessione.name,
        sessione.event.get("Country", "?"), sessione.event.get("EventDate", "?"),
    )

    try:
        sessione.load(laps=True, telemetry=True, weather=False, messages=False)
    except Exception:
        log.exception("session.load() ha sollevato un'eccezione per %s round %s/%s", tipo, anno, round_)
        return None

    # session.load() NON solleva un'eccezione se i dati non sono
    # disponibili per questa sessione (es. self.f1_api_support è False):
    # si limita a loggare un avviso interno e a lasciare .laps/.results
    # non impostati. Verifichiamo esplicitamente qui, loggando anche il
    # valore effettivo di f1_api_support — un log.exception() qui sotto
    # cattura anche il caso (osservato in produzione) in cui
    # f1_api_support risulti True ma .laps sollevi comunque
    # DataNotLoadedError per un altro motivo non ancora chiaro: il
    # traceback completo dirà da quale riga esatta parte l'eccezione,
    # cosa che il solo messaggio non rivelava nel log precedente.
    log.info("f1_api_support per questa sessione: %s", sessione.f1_api_support)
    try:
        if not sessione.f1_api_support:
            raise RuntimeError(
                "l'API F1 non supporta questa sessione (dati non ancora "
                "pubblicati o formato non supportato)"
            )
        numero_giri = len(sessione.laps)
        log.info("Giri caricati: %d", numero_giri)
        if numero_giri == 0:
            raise RuntimeError("nessun giro caricato per questa sessione")
        return sessione
    except Exception:
        log.exception(
            "Dati non disponibili per la sessione %s del round %s/%s (f1_api_support=%s)",
            tipo, anno, round_, sessione.f1_api_support,
        )
        return None


# ---------------------------------------------------------------------------
# Estrazione dati
# ---------------------------------------------------------------------------


def estrai_piloti(sessione: fastf1.core.Session) -> list[dict]:
    """Elenco piloti con i dettagli utili al frontend (selettori, colori
    scuderia, badge posizione) — dai risultati ufficiali della sessione."""
    piloti = []
    for _, riga in sessione.results.iterrows():
        piloti.append({
            "codice": riga["Abbreviation"],
            "numero": str(riga["DriverNumber"]),
            "nome": riga["FullName"],
            "scuderia": riga["TeamName"],
            "colore_scuderia": f"#{riga['TeamColor']}" if riga["TeamColor"] else "#888888",
            "posizione": None if pd.isna(riga["Position"]) else int(riga["Position"]),
            "posizione_griglia": None if pd.isna(riga["GridPosition"]) else int(riga["GridPosition"]),
            "classificato": riga["ClassifiedPosition"],
            "punti": None if pd.isna(riga["Points"]) else float(riga["Points"]),
        })
    # Ordina per posizione (i ritirati/non classificati, senza posizione, in fondo)
    piloti.sort(key=lambda p: (p["posizione"] is None, p["posizione"]))
    return piloti


def estrai_giri(sessione: fastf1.core.Session) -> list[dict]:
    """Tutti i giri di tutti i piloti — tempo, mescola, stint, posizione.
    Piccolo a sufficienza (poche decine di byte per giro) da includere per
    intero, a differenza della telemetria completa."""
    giri = []
    for _, giro in sessione.laps.iterrows():
        giri.append({
            "pilota": giro["Driver"],
            "giro": None if pd.isna(giro["LapNumber"]) else int(giro["LapNumber"]),
            "tempo_giro_s": td_to_seconds(giro["LapTime"]),
            "settore1_s": td_to_seconds(giro["Sector1Time"]),
            "settore2_s": td_to_seconds(giro["Sector2Time"]),
            "settore3_s": td_to_seconds(giro["Sector3Time"]),
            "mescola": giro["Compound"],
            "vita_gomma": None if pd.isna(giro["TyreLife"]) else int(giro["TyreLife"]),
            "gomma_nuova": bool(giro["FreshTyre"]) if not pd.isna(giro["FreshTyre"]) else None,
            "stint": None if pd.isna(giro["Stint"]) else int(giro["Stint"]),
            "posizione": None if pd.isna(giro["Position"]) else int(giro["Position"]),
            "ai_box_uscita": not pd.isna(giro["PitOutTime"]),
            "ai_box_entrata": not pd.isna(giro["PitInTime"]),
            "giro_accurato": bool(giro["IsAccurate"]) if not pd.isna(giro["IsAccurate"]) else None,
        })
    return giri


# Canali di telemetria che esportiamo: chiave interna -> nome colonna FastF1.
# Aggiungerne uno (es. RPM, nGear) richiede solo una riga qui, niente altro
# da toccare nella funzione sotto.
CANALI_TELEMETRIA = {
    "velocita": "Speed",
    "acceleratore": "Throttle",
    "freno": "Brake",
    "drs": "DRS",
}


def estrai_telemetria_giro(giro: pd.Series) -> Optional[dict]:
    """Telemetria di un singolo giro, campionata su Distanza (non Tempo):
    è quello che serve per sovrapporre due piloti sullo stesso grafico
    "per metri di pista", indipendentemente da quanto ciascuno ci abbia
    messo. Ritorna None se il giro non ha telemetria associata (capita per
    alcuni giri di inizio/fine sessione, in-lap/out-lap ai box, ecc.)."""
    try:
        tel = giro.get_car_data().add_distance()
    except Exception as errore:
        log.warning("Telemetria non disponibile per %s giro %s: %s", giro["Driver"], giro["LapNumber"], errore)
        return None
    if tel.empty:
        return None

    return {
        "distanza_m": [pulisci_float(v, 1) for v in tel["Distance"]],
        "velocita_kmh": [pulisci_float(v, 1) for v in tel["Speed"]],
        "acceleratore_pct": [pulisci_float(v, 1) for v in tel["Throttle"]],
        # Brake in FastF1 è booleano (freno premuto o no, non un valore
        # percentuale: i sensori ufficiali F1 non espongono la pressione
        # frenata) — lo esportiamo come 0/100 così il frontend può
        # disegnarlo con la stessa scala 0-100 dell'acceleratore.
        "freno_pct": [100 if v else 0 for v in tel["Brake"]],
        # DRS: 10/12/14 = attivo, tutto il resto = non attivo (inclusi gli
        # 8 = "rilevato, zona attivabile" — non è DRS aperto).
        # Fonte: fastf1.api.car_data (commento nel sorgente della libreria).
        "drs_attivo": [1 if v in (10, 12, 14) else 0 for v in tel["DRS"]],
        "tempo_s": [pulisci_float(v.total_seconds(), 3) for v in tel["Time"]],
    }


def estrai_telemetria_sessione(sessione: fastf1.core.Session) -> dict:
    """Il giro più veloce di OGNI pilota (non solo i 3 assoluti — vedi la
    nota di design in cima al file) più l'elenco dei 3 giri più veloci in
    assoluto, per l'evidenziazione di default nel frontend."""
    per_pilota: dict[str, dict] = {}
    piloti_e_tempi: list[tuple[str, float]] = []

    for codice in sessione.laps["Driver"].unique():
        giri_pilota = sessione.laps.pick_drivers(codice)
        giro_veloce = giri_pilota.pick_fastest()
        # pick_fastest() ritorna None (non un oggetto "vuoto") se nessun
        # giro del pilota è marcato come personal best in questa sessione
        # (capita per un pilota ritirato prestissimo, o con tutti i giri
        # cancellati per track limits) — senza il controllo su None,
        # .empty da solo avrebbe sollevato AttributeError e fatto fallire
        # l'intero script per un singolo pilota "sfortunato".
        if giro_veloce is None or giro_veloce.empty:
            continue

        dati_telemetria = estrai_telemetria_giro(giro_veloce)
        if dati_telemetria is None:
            continue

        per_pilota[codice] = {
            "giro": int(giro_veloce["LapNumber"]),
            "tempo_giro_s": td_to_seconds(giro_veloce["LapTime"]),
            "mescola": giro_veloce["Compound"],
            **dati_telemetria,
        }
        tempo_s = td_to_seconds(giro_veloce["LapTime"])
        if tempo_s is not None:
            piloti_e_tempi.append((codice, tempo_s))

    top3 = [codice for codice, _ in sorted(piloti_e_tempi, key=lambda x: x[1])[:3]]
    return {"piloti": per_pilota, "top3": top3}


def estrai_contesto_jolpica(anno: int, round_: int) -> dict:
    """Classifica piloti dopo questo GP, via Jolpica-F1 (fastf1.ergast) —
    il contesto mondiale che FastF1 da solo non fornisce (FastF1 copre
    solo i dati di sessione/telemetria, non le classifiche progressive)."""
    ergast = fastf1.ergast.Ergast()
    try:
        risposta = ergast.get_driver_standings(season=anno, round=round_)
        if not risposta.content:
            return {"classifica_piloti": []}
        tabella = risposta.content[0]
        classifica = [
            {
                "posizione": int(riga["position"]),
                "pilota": riga["driverCode"] if "driverCode" in tabella.columns else riga.get("familyName", ""),
                "punti": float(riga["points"]),
                "vittorie": int(riga["wins"]),
            }
            for _, riga in tabella.iterrows()
        ]
        return {"classifica_piloti": classifica}
    except Exception as errore:
        # Il contesto Jolpica è un "di più": se non è disponibile (rate
        # limit, manutenzione, round troppo recente per essere già in
        # classifica) il resto dei dati (FastF1) resta comunque valido e
        # va salvato lo stesso.
        log.warning("Contesto Jolpica non disponibile per %s round %s: %s", anno, round_, errore)
        return {"classifica_piloti": []}


# ---------------------------------------------------------------------------
# Elaborazione di un singolo GP
# ---------------------------------------------------------------------------


def elabora_gp(anno: int, round_: int) -> Optional[dict]:
    """Scarica ed elabora un GP, scrive i suoi 3 file JSON. Ritorna la voce
    da aggiungere a data/index.json, o None se il GP non è elaborabile
    (dati non ancora disponibili)."""
    log.info("=== Elaboro GP: %s round %s ===", anno, round_)

    sessione_r = carica_sessione(anno, round_, "R")
    if sessione_r is None:
        log.error("Salto %s round %s: dati di Gara non disponibili.", anno, round_)
        return None
    sessione_q = carica_sessione(anno, round_, "Q")
    # La Qualifica può mancare (es. weekend Sprint con formato diverso, o
    # dati non ancora pubblicati) senza che questo impedisca di pubblicare
    # comunque l'analisi della Gara.
    if sessione_q is None:
        log.warning("Qualifica non disponibile per %s round %s, procedo solo con la Gara.", anno, round_)

    evento = sessione_r.event
    id_gp = f"{anno}_{round_:02d}_{slug(evento['EventName'])}"
    cartella = DATA_DIR / id_gp

    # --- meta.json ---
    meta = {
        "anno": anno,
        "round": round_,
        "nome_evento": evento["EventName"],
        "paese": evento["Country"],
        "localita": evento["Location"],
        "data": evento["EventDate"].strftime("%Y-%m-%d"),
        "piloti_gara": estrai_piloti(sessione_r),
        "piloti_qualifica": estrai_piloti(sessione_q) if sessione_q else [],
        **estrai_contesto_jolpica(anno, round_),
        "generato_il": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    scrivi_json(cartella / "meta.json", meta)

    # --- laps.json ---
    laps = {
        "gara": estrai_giri(sessione_r),
        "qualifica": estrai_giri(sessione_q) if sessione_q else [],
    }
    scrivi_json(cartella / "laps.json", laps)

    # --- telemetry.json ---
    telemetria = {
        "gara": estrai_telemetria_sessione(sessione_r),
        "qualifica": estrai_telemetria_sessione(sessione_q) if sessione_q else {"piloti": {}, "top3": []},
    }
    scrivi_json(cartella / "telemetry.json", telemetria)

    return {
        "id": id_gp,
        "anno": anno,
        "round": round_,
        "nome_evento": evento["EventName"],
        "paese": evento["Country"],
        "data": evento["EventDate"].strftime("%Y-%m-%d"),
    }


def aggiorna_indice(nuove_voci: list[dict]) -> None:
    """Aggiorna data/index.json con le nuove voci, senza perdere quelle già
    presenti da run precedenti (fondamentale per --all così come per le
    esecuzioni settimanali che aggiungono un GP alla volta)."""
    percorso_indice = DATA_DIR / "index.json"
    indice: list[dict] = []
    if percorso_indice.exists():
        with open(percorso_indice, "r", encoding="utf-8") as f:
            indice = json.load(f)

    per_id = {voce["id"]: voce for voce in indice}
    for voce in nuove_voci:
        per_id[voce["id"]] = voce  # sovrascrive se già presente (rigenerazione)

    indice_finale = sorted(per_id.values(), key=lambda v: (v["anno"], v["round"]), reverse=True)
    scrivi_json(percorso_indice, indice_finale)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--year", type=int, default=datetime.now().year, help="Stagione (default: anno corrente)")
    parser.add_argument("--round", type=int, default=None, help="Round specifico (default: l'ultimo disputato)")
    parser.add_argument("--all", action="store_true", help="Rigenera tutti i round già disputati della stagione")
    args = parser.parse_args()

    configura_ambiente()

    if args.all:
        round_da_fare = elenco_round_disputati(args.year)
        log.info("Rigenero %d round della stagione %s: %s", len(round_da_fare), args.year, round_da_fare)
    elif args.round is not None:
        round_da_fare = [args.round]
    else:
        round_da_fare = [trova_ultimo_gp_disputato(args.year)]

    nuove_voci = []
    for r in round_da_fare:
        try:
            voce = elabora_gp(args.year, r)
            if voce is not None:
                nuove_voci.append(voce)
        except Exception:
            # Un GP che fallisce non deve bloccare gli altri quando si usa
            # --all, né deve far fallire il workflow con uno stacktrace
            # criptico: logghiamo per intero e andiamo avanti.
            log.exception("Errore inatteso elaborando %s round %s", args.year, r)

    if nuove_voci:
        aggiorna_indice(nuove_voci)
        log.info("Fatto: %d GP elaborati con successo.", len(nuove_voci))
        return 0
    else:
        log.error("Nessun GP elaborato con successo.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
