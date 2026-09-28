#!/usr/bin/env python3
"""
update_data.py — Prepara i dati statici della sezione "Analisi GP" di monoposto.io.

COSA FA
-------
Per ogni Gran Premio già disputato scarica:
  * da OpenF1 (https://openf1.org, gratuita, senza chiave per lo storico):
    tempi di ogni giro, mescole/stint, telemetria (velocità, acceleratore,
    freno, DRS) del giro più veloce di ogni pilota, in Qualifica e in Gara;
  * da Jolpica-F1 (https://github.com/jolpica/jolpica-f1, successore di
    Ergast): calendario, classifica finale, punti, classifica mondiale.
e scrive file JSON statici in data/<anno>_<round>_<gp>/ che la pagina web
legge così come sono (nessun server da mantenere).

PERCHÉ NON FASTF1
-----------------
FastF1 dipende dai server "live timing" di F1, che rifiutano (403) le
richieste provenienti da servizi cloud/hosting come GitHub Actions o Render.
OpenF1 non ha questo blocco, quindi lo script può girare da solo su GitHub
Actions. Nessuna libreria esterna: solo la libreria standard di Python.

LIMITI NOTI (da conoscere)
--------------------------
  * OpenF1 copre le stagioni dal 2023 in poi.
  * La telemetria non ha una colonna "distanza": viene calcolata integrando
    la velocità nel tempo (come fa anche FastF1) e poi allineata tra i
    piloti della stessa sessione, così le curve si sovrappongono. I tracciati
    possono restare sfasati di qualche decina di metri.
  * Il "giro più veloce" è il più veloce cronometrato nei dati OpenF1: in
    Qualifica può essere un giro poi cancellato per track limits.
  * Una gara è considerata pronta solo se ci sono i giri e la telemetria di
    almeno 10 piloti; altrimenti viene saltata e ritentata alla prossima
    esecuzione (i dati OpenF1 possono arrivare con qualche ora di ritardo).

USO
---
    python3 update_data.py                    # elabora i GP dell'anno in corso
                                              # non ancora presenti in data/
    python3 update_data.py --year 2025        # idem per un altro anno (>= 2023)
    python3 update_data.py --round 15         # solo quel round
    python3 update_data.py --rigenera         # rigenera anche quelli già presenti

Variabili d'ambiente opzionali: F1_DATA_DIR (cartella di output), F1_PAUSA_S
(pausa tra richieste, default 0.5), F1_BUDGET_MINUTI (tempo massimo, default
100: se finisce, i GP rimasti vengono elaborati alla prossima esecuzione).
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import statistics
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Configurazione
# ---------------------------------------------------------------------------

OPENF1 = "https://api.openf1.org/v1"
JOLPICA = "https://api.jolpi.ca/ergast/f1"

DATA_DIR = Path(os.environ.get("F1_DATA_DIR", "frontend/public/analisi-gp/data"))
BUDGET_MINUTI = float(os.environ.get("F1_BUDGET_MINUTI", "100"))
PAUSA_TRA_RICHIESTE_S = float(os.environ.get("F1_PAUSA_S", "0.5"))

# Le API gratuite chiedono di identificarsi e di non esagerare con le richieste.
USER_AGENT = "monoposto.io-analisi-gp/2.0 (+https://monoposto.io)"
TIMEOUT_S = 30
MAX_TENTATIVI = 5
CODICI_RIPROVABILI = (429, 500, 502, 503, 504)

MIN_CAMPIONI_GIRO = 30            # ~8 s a 3,7 Hz: sotto, il giro è incompleto
MIN_PILOTI_CON_TELEMETRIA = 10    # sotto, la gara non è considerata pronta
FRAZIONE_MEDIANA_MINIMA = 0.6     # scarta "giri" assurdamente brevi (glitch)
DRS_ATTIVO = (10, 12, 14)         # codifica DRS di OpenF1 (vedi documentazione)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("update_data")


class ErroreRete(Exception):
    """Una richiesta HTTP è fallita anche dopo i tentativi di ripetizione."""


class DatiNonDisponibili(Exception):
    """Dati non (ancora) pubblicati: il GP viene saltato e ritentato dopo."""


# ---------------------------------------------------------------------------
# Rete
# ---------------------------------------------------------------------------


def scarica_json(url: str) -> Any:
    """GET + parsing JSON, con pausa tra richieste e ripetizione (con attesa
    crescente) su errori temporanei. Un 404 vale "nessun risultato": OpenF1
    risponde così quando un filtro non trova nulla."""
    ultimo_errore: Optional[Exception] = None
    for tentativo in range(1, MAX_TENTATIVI + 1):
        attesa = min(60, 2 ** tentativo)
        try:
            richiesta = urllib.request.Request(
                url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
            )
            with urllib.request.urlopen(richiesta, timeout=TIMEOUT_S) as risposta:
                corpo = risposta.read().decode("utf-8")
            dati = json.loads(corpo)
            time.sleep(PAUSA_TRA_RICHIESTE_S)
            return dati
        except urllib.error.HTTPError as errore:
            if errore.code == 404:
                log.warning("Nessun risultato (404) per %s", url)
                time.sleep(PAUSA_TRA_RICHIESTE_S)
                return []
            ultimo_errore = errore
            if errore.code not in CODICI_RIPROVABILI:
                break  # errore "definitivo" (es. 403): inutile riprovare
            valore = errore.headers.get("Retry-After") if errore.headers else None
            if valore and valore.isdigit():
                attesa = min(60, int(valore))
        except (OSError, json.JSONDecodeError) as errore:  # rete, timeout, JSON rotto
            ultimo_errore = errore
        if tentativo < MAX_TENTATIVI:
            log.warning(
                "Richiesta fallita (%s): riprovo tra %ss (%d/%d) — %s",
                ultimo_errore, attesa, tentativo, MAX_TENTATIVI, url,
            )
            time.sleep(attesa)
    raise ErroreRete(f"Richiesta fallita dopo {MAX_TENTATIVI} tentativi: {url} ({ultimo_errore})")


# Operatori di filtro di OpenF1: codificati come nei link della loro documentazione.
_OPERATORI_URL = {"=": "=", ">=": "%3E%3D", "<=": "%3C%3D", ">": "%3E", "<": "%3C"}


def costruisci_query(filtri: tuple) -> str:
    """Filtri come (chiave, valore) oppure (chiave, operatore, valore)."""
    parti = []
    for filtro in filtri:
        chiave, operatore, valore = (filtro[0], "=", filtro[1]) if len(filtro) == 2 else filtro
        parti.append(f"{chiave}{_OPERATORI_URL[operatore]}{urllib.parse.quote(str(valore), safe=':.-_')}")
    return "&".join(parti)


def openf1(endpoint: str, *filtri: tuple) -> list[dict]:
    dati = scarica_json(f"{OPENF1}/{endpoint}?{costruisci_query(filtri)}")
    return dati if isinstance(dati, list) else []


def jolpica(percorso: str) -> dict:
    dati = scarica_json(f"{JOLPICA}/{percorso}")
    return dati if isinstance(dati, dict) else {}


# ---------------------------------------------------------------------------
# Utilità
# ---------------------------------------------------------------------------


def slug(testo: str) -> str:
    """'São Paulo Grand Prix' -> 'sao-paulo-grand-prix' (nomi di cartella)."""
    testo = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", testo).strip("-").lower()


def parse_data(testo: str) -> datetime:
    """ISO 8601 -> datetime UTC (accetta anche il suffisso 'Z')."""
    d = datetime.fromisoformat(str(testo).strip().replace("Z", "+00:00"))
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def formatta_per_query(d: datetime) -> str:
    """Formato dei filtri data di OpenF1: UTC, senza fuso, al millisecondo."""
    d = d.astimezone(timezone.utc)
    return d.strftime("%Y-%m-%dT%H:%M:%S.") + f"{d.microsecond // 1000:03d}"


def _int_o_none(valore: Any) -> Optional[int]:
    try:
        return int(valore)
    except (TypeError, ValueError):
        return None


def scrivi_json(percorso: Path, dati: Any) -> None:
    percorso.parent.mkdir(parents=True, exist_ok=True)
    with open(percorso, "w", encoding="utf-8") as f:
        json.dump(dati, f, ensure_ascii=False, separators=(",", ":"))
    log.info("Scritto %s (%.1f KB)", percorso, percorso.stat().st_size / 1024)


# ---------------------------------------------------------------------------
# Calendario e collegamento OpenF1 <-> Jolpica
# ---------------------------------------------------------------------------


def calendario_gare(anno: int) -> list[dict]:
    """Gare dell'anno secondo Jolpica: round, nome, paese, località, data."""
    corse = jolpica(f"{anno}.json?limit=100").get("MRData", {}).get("RaceTable", {}).get("Races", [])
    gare = []
    for c in corse:
        try:
            gare.append({
                "round": int(c["round"]),
                "nome": c["raceName"],
                "paese": c.get("Circuit", {}).get("Location", {}).get("country", ""),
                "localita": c.get("Circuit", {}).get("Location", {}).get("locality", ""),
                "data": date.fromisoformat(c["date"]),
            })
        except (KeyError, ValueError):
            log.warning("Voce di calendario non valida ignorata: %s", c)
    return sorted(gare, key=lambda g: g["round"])


def trova_sessioni(sessioni: list[dict], data_gara: date) -> tuple[Optional[dict], Optional[dict]]:
    """Sessione di Gara OpenF1 con la data più vicina a quella di Jolpica
    (±1 giorno: la data Jolpica è locale, quella OpenF1 è UTC) e la Qualifica
    dello stesso weekend."""
    migliore: Optional[tuple[int, dict]] = None
    for s in sessioni:
        if s.get("session_name") != "Race" or s.get("is_cancelled"):
            continue
        try:
            scarto = abs((parse_data(s["date_start"]).date() - data_gara).days)
        except (KeyError, ValueError):
            continue
        if scarto <= 1 and (migliore is None or scarto < migliore[0]):
            migliore = (scarto, s)
    if migliore is None:
        return None, None
    gara = migliore[1]
    quali = next(
        (s for s in sessioni
         if s.get("session_name") == "Qualifying"
         and s.get("meeting_key") == gara.get("meeting_key")
         and not s.get("is_cancelled")),
        None,
    )
    return gara, quali


# ---------------------------------------------------------------------------
# Piloti (meta.json)
# ---------------------------------------------------------------------------


def _indici_piloti_openf1(piloti_of1: list[dict]) -> tuple[dict, dict]:
    per_codice, per_numero = {}, {}
    for p in piloti_of1:
        if p.get("name_acronym"):
            per_codice[p["name_acronym"]] = p
        if p.get("driver_number") is not None:
            per_numero[str(p["driver_number"])] = p
    return per_codice, per_numero


def _pilota_openf1(pilota_j: dict, per_codice: dict, per_numero: dict) -> Optional[dict]:
    """Collega un pilota Jolpica al suo omologo OpenF1: per sigla, altrimenti
    per numero di gara."""
    if pilota_j.get("code") in per_codice:
        return per_codice[pilota_j["code"]]
    numero = pilota_j.get("permanentNumber")
    if numero is not None and str(numero) in per_numero:
        return per_numero[str(numero)]
    return None


def _codice(pilota_j: dict, of1: Optional[dict]) -> str:
    return (of1 or {}).get("name_acronym") or pilota_j.get("code") or pilota_j.get("familyName", "???")[:3].upper()


def costruisci_piloti(righe_j: list[dict], piloti_of1: list[dict], qualifica: bool = False) -> list[dict]:
    """Elenco piloti per meta.json: classifica da Jolpica, nome/scuderia/colore
    da OpenF1 (con ripiego su Jolpica), ordinato per posizione."""
    per_codice, per_numero = _indici_piloti_openf1(piloti_of1)
    usati: set = set()
    piloti = []
    for r in righe_j:
        dj = r.get("Driver", {})
        of1 = _pilota_openf1(dj, per_codice, per_numero)
        if of1:
            usati.add(of1.get("driver_number"))
        posizione = _int_o_none(r.get("position"))
        nome = " ".join(x for x in (dj.get("givenName"), dj.get("familyName")) if x)
        punti = r.get("points")
        piloti.append({
            "codice": _codice(dj, of1),
            "numero": str((of1 or {}).get("driver_number", dj.get("permanentNumber", ""))),
            "nome": nome or (of1 or {}).get("full_name") or _codice(dj, of1),
            "scuderia": (of1 or {}).get("team_name") or r.get("Constructor", {}).get("name", ""),
            "colore_scuderia": f"#{of1['team_colour']}" if of1 and of1.get("team_colour") else "#888888",
            "posizione": posizione,
            # grid 0 = partenza dalla corsia box: come "non disponibile"
            "posizione_griglia": None if qualifica else (_int_o_none(r.get("grid")) or None),
            "classificato": str(posizione) if qualifica else r.get("positionText", ""),
            "punti": None if qualifica or punti is None else float(punti),
        })
    if not qualifica:
        # Piloti presenti su OpenF1 ma non nella classifica (es. non partiti):
        # restano selezionabili per giri/telemetria.
        for p in piloti_of1:
            if p.get("driver_number") not in usati and p.get("name_acronym"):
                piloti.append({
                    "codice": p["name_acronym"],
                    "numero": str(p.get("driver_number", "")),
                    "nome": p.get("full_name") or p["name_acronym"],
                    "scuderia": p.get("team_name", ""),
                    "colore_scuderia": f"#{p['team_colour']}" if p.get("team_colour") else "#888888",
                    "posizione": None, "posizione_griglia": None,
                    "classificato": "-", "punti": None,
                })
    piloti.sort(key=lambda p: (p["posizione"] is None, p["posizione"] or 0))
    return piloti


def costruisci_classifica_mondiale(righe: list[dict], piloti_of1: list[dict]) -> list[dict]:
    per_codice, per_numero = _indici_piloti_openf1(piloti_of1)
    classifica = []
    for s in righe:
        dj = s.get("Driver", {})
        try:
            classifica.append({
                "posizione": int(s["position"]),
                "pilota": _codice(dj, _pilota_openf1(dj, per_codice, per_numero)),
                "punti": float(s["points"]),
                "vittorie": int(s.get("wins", 0)),
            })
        except (KeyError, ValueError):
            continue
    return classifica


# ---------------------------------------------------------------------------
# Giri e gomme (laps.json)
# ---------------------------------------------------------------------------


def _stint_per_giro(stint_pilota: list[dict], numero_giro: int) -> Optional[dict]:
    for s in stint_pilota:
        inizio, fine = s.get("lap_start"), s.get("lap_end")
        if inizio is None or numero_giro < inizio:
            continue
        if fine is None or numero_giro <= fine:
            return s
    return None


def _indice_stint(stints: list[dict]) -> dict[Any, list[dict]]:
    per_pilota: dict[Any, list[dict]] = {}
    for s in stints:
        per_pilota.setdefault(s.get("driver_number"), []).append(s)
    for lista in per_pilota.values():
        lista.sort(key=lambda s: s.get("lap_start") or 0)
    return per_pilota


def costruisci_giri(laps: list[dict], stints: list[dict], numero_a_codice: dict) -> list[dict]:
    """Tutti i giri di tutti i piloti, con mescola e stint associati."""
    stint_idx = _indice_stint(stints)
    rientri = {  # (pilota, giro) dei giri di ingresso ai box: il giro dopo è "out lap"
        (l.get("driver_number"), l["lap_number"] - 1)
        for l in laps if l.get("is_pit_out_lap") and isinstance(l.get("lap_number"), int)
    }
    giri = []
    for l in laps:
        numero, n_giro = l.get("driver_number"), l.get("lap_number")
        if numero is None or not isinstance(n_giro, int):
            continue
        stint = _stint_per_giro(stint_idx.get(numero, []), n_giro)
        eta = stint.get("tyre_age_at_start") if stint else None
        durata = l.get("lap_duration")
        giri.append({
            "pilota": numero_a_codice.get(numero, str(numero)),
            "giro": n_giro,
            "tempo_giro_s": round(durata, 3) if isinstance(durata, (int, float)) else None,
            "settore1_s": l.get("duration_sector_1"),
            "settore2_s": l.get("duration_sector_2"),
            "settore3_s": l.get("duration_sector_3"),
            "mescola": (stint.get("compound") or "").upper() or None if stint else None,
            "vita_gomma": (eta + (n_giro - stint["lap_start"]) + 1) if stint and isinstance(eta, int) else None,
            "gomma_nuova": (eta == 0) if isinstance(eta, int) else None,
            "stint": stint.get("stint_number") if stint else None,
            "ai_box_uscita": bool(l.get("is_pit_out_lap")),
            "ai_box_entrata": (numero, n_giro) in rientri,
        })
    giri.sort(key=lambda g: (g["pilota"], g["giro"]))
    return giri


# ---------------------------------------------------------------------------
# Telemetria (telemetry.json)
# ---------------------------------------------------------------------------


def integra_distanza(tempi_s: list[float], velocita_kmh: list[float]) -> list[float]:
    """Distanza percorsa (m) integrando la velocità nel tempo (trapezi).
    OpenF1 non fornisce la distanza: si ricava come fa anche FastF1."""
    distanze = [0.0]
    for i in range(1, len(tempi_s)):
        dt = max(tempi_s[i] - tempi_s[i - 1], 0.0)
        distanze.append(distanze[-1] + (velocita_kmh[i] + velocita_kmh[i - 1]) / 2 / 3.6 * dt)
    return distanze


def traccia_giro(righe: list[dict], inizio: datetime, fine: datetime) -> Optional[dict]:
    """Da campioni grezzi 'car_data' a una traccia per distanza. None se il
    giro ha troppo pochi campioni per essere affidabile."""
    campioni = []
    for r in righe:
        try:
            d = parse_data(r["date"])
        except (KeyError, ValueError, TypeError):
            continue
        if r.get("speed") is None or not (inizio <= d <= fine):
            continue
        campioni.append((d, r))
    campioni.sort(key=lambda c: c[0])
    if len(campioni) < MIN_CAMPIONI_GIRO:
        return None
    tempi = [(d - inizio).total_seconds() for d, _ in campioni]
    velocita = [float(r["speed"]) for _, r in campioni]
    return {
        "distanza_m": integra_distanza(tempi, velocita),
        "velocita_kmh": velocita,
        "acceleratore_pct": [r.get("throttle") for _, r in campioni],
        # brake: 0/100 su OpenF1. Qualunque valore > 0 vale "freno premuto".
        "freno_pct": [100 if (r.get("brake") or 0) > 0 else 0 for _, r in campioni],
        "drs_attivo": [1 if r.get("drs") in DRS_ATTIVO else 0 for _, r in campioni],
        "tempo_s": tempi,
    }


def normalizza_distanze(tracce: dict[str, dict]) -> None:
    """Riporta la distanza finale di ogni giro alla mediana della sessione:
    l'integrazione della velocità accumula piccoli errori (e l'inizio giro
    OpenF1 è approssimato). Così le curve dei piloti restano sovrapposte."""
    finali = [t["distanza_m"][-1] for t in tracce.values() if t["distanza_m"][-1] > 0]
    if len(finali) < 3:
        return
    riferimento = statistics.median(finali)
    for t in tracce.values():
        fattore = riferimento / t["distanza_m"][-1] if t["distanza_m"][-1] > 0 else 1.0
        t["distanza_m"] = [d * fattore for d in t["distanza_m"]]


def giri_piu_veloci(laps: list[dict]) -> dict[Any, dict]:
    """Per ogni pilota, il giro cronometrato più veloce."""
    durate = [l["lap_duration"] for l in laps
              if isinstance(l.get("lap_duration"), (int, float)) and l["lap_duration"] > 0]
    if not durate:
        return {}
    soglia = statistics.median(durate) * FRAZIONE_MEDIANA_MINIMA
    migliori: dict[Any, dict] = {}
    for l in laps:
        d, n = l.get("lap_duration"), l.get("driver_number")
        if not isinstance(d, (int, float)) or d < soglia or n is None or not l.get("date_start"):
            continue
        if n not in migliori or d < migliori[n]["lap_duration"]:
            migliori[n] = l
    return migliori


def _arrotonda(t: dict) -> dict:
    t["distanza_m"] = [round(v, 1) for v in t["distanza_m"]]
    t["velocita_kmh"] = [round(v) for v in t["velocita_kmh"]]
    t["tempo_s"] = [round(v, 3) for v in t["tempo_s"]]
    return t


def costruisci_telemetria(session_key: Any, laps: list[dict], stints: list[dict], numero_a_codice: dict) -> dict:
    """Telemetria del giro più veloce di OGNI pilota (non solo dei primi tre:
    così due piloti qualsiasi sono confrontabili), più i 3 giri assoluti più
    veloci ('top3') per la selezione di default."""
    stint_idx = _indice_stint(stints)
    tracce: dict[str, dict] = {}
    for numero, giro in giri_piu_veloci(laps).items():
        codice = numero_a_codice.get(numero, str(numero))
        inizio = parse_data(giro["date_start"])
        fine = inizio + timedelta(seconds=giro["lap_duration"])
        try:
            righe = openf1(
                "car_data",
                ("session_key", session_key), ("driver_number", numero),
                ("date", ">=", formatta_per_query(inizio)), ("date", "<=", formatta_per_query(fine)),
            )
        except ErroreRete as errore:  # un pilota mancante non deve far saltare il GP
            log.warning("Telemetria di %s non scaricata: %s", codice, errore)
            continue
        traccia = traccia_giro(righe, inizio, fine)
        if traccia is None:
            log.warning("Telemetria di %s (giro %s) assente o incompleta", codice, giro.get("lap_number"))
            continue
        stint = _stint_per_giro(stint_idx.get(numero, []), giro["lap_number"])
        traccia.update(
            giro=giro["lap_number"],
            tempo_giro_s=round(giro["lap_duration"], 3),
            mescola=((stint.get("compound") or "").upper() or None) if stint else None,
        )
        tracce[codice] = traccia
    normalizza_distanze(tracce)
    for t in tracce.values():
        _arrotonda(t)
    top3 = [c for c, _ in sorted(tracce.items(), key=lambda kv: kv[1]["tempo_giro_s"])[:3]]
    return {"piloti": tracce, "top3": top3}


# ---------------------------------------------------------------------------
# Elaborazione di un GP
# ---------------------------------------------------------------------------


def elabora_sessione(sessione: dict) -> tuple[list[dict], list[dict], dict]:
    """(piloti OpenF1, giri, telemetria) di una sessione."""
    chiave = sessione["session_key"]
    piloti_of1 = openf1("drivers", ("session_key", chiave))
    laps = openf1("laps", ("session_key", chiave))
    if not laps:
        raise DatiNonDisponibili(f"nessun giro su OpenF1 per la sessione {chiave}")
    stints = openf1("stints", ("session_key", chiave))
    numero_a_codice = {
        p["driver_number"]: p.get("name_acronym") or str(p["driver_number"])
        for p in piloti_of1 if p.get("driver_number") is not None
    }
    return (
        piloti_of1,
        costruisci_giri(laps, stints, numero_a_codice),
        costruisci_telemetria(chiave, laps, stints, numero_a_codice),
    )


def id_gp(anno: int, gara: dict) -> str:
    return f"{anno}_{gara['round']:02d}_{slug(gara['nome'])}"


def elabora_gp(anno: int, gara: dict, sessioni: list[dict]) -> dict:
    """Scarica ed elabora un GP e scrive i suoi 3 file JSON. Solleva
    DatiNonDisponibili se i dati non sono ancora pronti."""
    log.info("=== GP %s round %s: %s (%s) ===", anno, gara["round"], gara["nome"], gara["data"])

    sess_gara, sess_quali = trova_sessioni(sessioni, gara["data"])
    if sess_gara is None:
        raise DatiNonDisponibili("sessione di gara non presente su OpenF1")

    numero = gara["round"]
    risultati = (jolpica(f"{anno}/{numero}/results.json").get("MRData", {}).get("RaceTable", {}).get("Races") or [{}])[0].get("Results", [])
    if not risultati:
        raise DatiNonDisponibili("risultati non ancora pubblicati su Jolpica")

    piloti_of1, giri_gara, tel_gara = elabora_sessione(sess_gara)
    if len(tel_gara["piloti"]) < MIN_PILOTI_CON_TELEMETRIA:
        raise DatiNonDisponibili(
            f"telemetria di gara incompleta ({len(tel_gara['piloti'])} piloti su OpenF1): riprovo alla prossima esecuzione"
        )

    giri_quali, tel_quali, piloti_quali_of1 = [], {"piloti": {}, "top3": []}, piloti_of1
    if sess_quali is not None:
        try:
            piloti_quali_of1, giri_quali, tel_quali = elabora_sessione(sess_quali)
        except DatiNonDisponibili as errore:
            log.warning("Qualifica non disponibile: %s (procedo con la sola gara)", errore)
    else:
        log.warning("Sessione di qualifica non trovata su OpenF1 (procedo con la sola gara)")

    righe_quali = (jolpica(f"{anno}/{numero}/qualifying.json").get("MRData", {}).get("RaceTable", {}).get("Races") or [{}])[0].get("QualifyingResults", [])
    classifica = (jolpica(f"{anno}/{numero}/driverstandings.json").get("MRData", {}).get("StandingsTable", {}).get("StandingsLists") or [{}])[0].get("DriverStandings", [])

    identificativo = id_gp(anno, gara)
    cartella = DATA_DIR / identificativo
    scrivi_json(cartella / "meta.json", {
        "anno": anno,
        "round": numero,
        "nome_evento": gara["nome"],
        "paese": gara["paese"],
        "localita": gara["localita"],
        "data": gara["data"].isoformat(),
        "piloti_gara": costruisci_piloti(risultati, piloti_of1),
        "piloti_qualifica": costruisci_piloti(righe_quali, piloti_quali_of1, qualifica=True) if righe_quali else [],
        "classifica_piloti": costruisci_classifica_mondiale(classifica, piloti_of1),
        "generato_il": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    scrivi_json(cartella / "laps.json", {"gara": giri_gara, "qualifica": giri_quali})
    scrivi_json(cartella / "telemetry.json", {"gara": tel_gara, "qualifica": tel_quali})
    return {
        "id": identificativo, "anno": anno, "round": numero,
        "nome_evento": gara["nome"], "paese": gara["paese"], "data": gara["data"].isoformat(),
    }


def aggiorna_indice(nuove_voci: list[dict]) -> None:
    """Aggiorna data/index.json senza perdere le voci di esecuzioni precedenti."""
    percorso = DATA_DIR / "index.json"
    voci: dict[str, dict] = {}
    if percorso.exists():
        with open(percorso, "r", encoding="utf-8") as f:
            voci = {v["id"]: v for v in json.load(f)}
    for v in nuove_voci:
        voci[v["id"]] = v
    scrivi_json(percorso, sorted(voci.values(), key=lambda v: (v["anno"], v["round"]), reverse=True))


def gia_elaborato(anno: int, gara: dict) -> bool:
    cartella = DATA_DIR / id_gp(anno, gara)
    return all((cartella / f).exists() for f in ("meta.json", "laps.json", "telemetry.json"))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--year", type=int, default=None, help="Stagione (default: anno corrente, >= 2023)")
    parser.add_argument("--round", type=int, default=None, help="Solo questo round")
    parser.add_argument("--rigenera", action="store_true", help="Rielabora anche i GP già presenti")
    args = parser.parse_args()

    anno = args.year or datetime.now(timezone.utc).year
    oggi = datetime.now(timezone.utc).date()

    gare = [g for g in calendario_gare(anno) if g["data"] <= oggi]
    if args.round is not None:
        gare = [g for g in gare if g["round"] == args.round]
    if not args.rigenera:
        gare = [g for g in gare if not gia_elaborato(anno, g)]
    if not gare:
        log.info("Nessun GP da elaborare per il %s: è tutto aggiornato.", anno)
        return 0
    log.info("GP da elaborare nel %s: %s", anno, [g["round"] for g in gare])

    sessioni = openf1("sessions", ("year", anno))
    if not sessioni:
        log.warning("OpenF1 non ha ancora sessioni per il %s: riprovo alla prossima esecuzione.", anno)
        return 0

    inizio = time.monotonic()
    nuove_voci, rimandati, errori = [], 0, 0
    for gara in gare:
        if (time.monotonic() - inizio) / 60 > BUDGET_MINUTI:
            log.warning("Tempo massimo raggiunto: i GP rimasti verranno elaborati alla prossima esecuzione.")
            break
        try:
            nuove_voci.append(elabora_gp(anno, gara, sessioni))
        except DatiNonDisponibili as motivo:
            rimandati += 1
            log.warning("GP %s rimandato: %s", gara["round"], motivo)
        except Exception:
            errori += 1
            log.exception("Errore elaborando il GP %s (%s)", gara["round"], gara["nome"])

    if nuove_voci:
        aggiorna_indice(nuove_voci)
    log.info("Fatto: %d elaborati, %d rimandati (dati non pronti), %d in errore.", len(nuove_voci), rimandati, errori)
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
