#!/usr/bin/env python3
"""
import_stagioni_jolpica.py
---------------------------
Importa intere stagioni di Formula 1 (gare, risultati, classifiche
ufficiali di fine anno) dalla API pubblica Jolpica
(https://api.jolpi.ca/ergast/, l'erede mantenuto di Ergast dopo la sua
dismissione), invece che da un CSV gara-per-gara come import_risultati_gp.py.

PERCHÉ UNO SCRIPT SEPARATO invece di estendere import_risultati_gp.py:
quello script è pensato per UNA gara alla volta da un file locale
(il flusso usato per il 1950, con dati arricchiti a mano); questo è
pensato per intere stagioni intere prese da un'API remota. Riusa però le
stesse funzioni di supporto (slug, ricerca/creazione pilota e
costruttore) importandole dal primo script, così un pilota che ha
corso sia nel 1950 sia nel 1951 viene riconosciuto come la STESSA persona
(lo slug è una funzione deterministica del nome completo, non un ID
generato a caso) invece di essere duplicato.

COSA NON FA, DI PROPOSITO:
- NON tocca il 1950: quella stagione resta quella già importata e
  arricchita a mano (biografie, curve storiche, ecc.). Lo script salta
  esplicitamente l'anno 1950 anche se richiesto per errore.
- NON inventa un sistema di punteggio proprio: i punti di ogni risultato
  vengono presi già calcolati dalla fonte (Jolpica assegna già
  correttamente i punti anche per arrivi a pari merito, gare accorciate,
  ecc.) e scritti direttamente in risultati_gara.punti, così come lo
  schema del database prevede esplicitamente ("i punti effettivi
  assegnati restano comunque memorizzati riga per riga in
  risultati_gara, fonte di verità" — vedi db/schema.sql).
- NON calcola da sé la classifica di fine stagione: la scarica già
  ufficiale (endpoint driverStandings/constructorStandings di Jolpica,
  che tiene conto delle regole reali dell'epoca, es. "migliori N
  risultati") e la scrive nelle tabelle classifica_ufficiale_piloti e
  classifica_ufficiale_costruttori (vedi db/patch_stagioni_1951_1970.sql),
  separate dalla nostra classifica "a somma" calcolata al volo
  dall'endpoint /classifica/piloti esistente. Le due cose sono mostrate
  nel frontend come criteri distinti e dichiarati, non fuse.

REQUISITO IMPORTANTE, VERIFICATO IN FASE DI SVILUPPO: l'ambiente in cui
questo script è stato scritto non ha accesso di rete diretto verso
api.jolpi.ca (bloccato dalle policy dell'organizzazione), quindi la
logica di parsing è stata verificata contro un fixture JSON scritto a
mano che riproduce ESATTAMENTE la struttura reale confermata (vedi
test_import_stagioni_jolpica.py), non contro l'API vera. Lo script va
eseguito per davvero in un ambiente con accesso a Internet completo —
esattamente come già facciamo per scripts/fetch-pirelli.js tramite
GitHub Actions (vedi .github/workflows/import-stagioni.yml).

USO
    pip install requests psycopg2-binary python-dotenv --break-system-packages

    # smoke test, non scrive nulla, mostra solo cosa farebbe:
    python import_stagioni_jolpica.py --anni 1951-1970 --dry-run

    # una sola stagione, utile per un primo controllo mirato:
    python import_stagioni_jolpica.py --anni 1955 --dry-run
    python import_stagioni_jolpica.py --anni 1955

    # intervallo completo, scrittura vera (richiede DATABASE_URL in .env):
    python import_stagioni_jolpica.py --anni 1951-1970
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from typing import Optional

import psycopg2
import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_risultati_gp import (  # noqa: E402  (import dopo sys.path, di proposito)
    slugify,
    trova_o_crea_nazione,
    trova_o_crea_pilota,
    trova_o_crea_costruttore,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger("import_stagioni_jolpica")

BASE_URL = "https://api.jolpi.ca/ergast/f1"

# La fonte richiede di non martellarla con richieste troppo ravvicinate:
# una piccola pausa tra una chiamata e l'altra è buona educazione (e
# riduce il rischio di essere rate-limitati a metà importazione).
PAUSA_TRA_RICHIESTE_SEC = 0.3

# Anno che questo script NON deve mai toccare: è già stato importato a
# mano con arricchimento (biografie, curve storiche, ecc.) in una fase
# precedente del progetto.
ANNO_ESCLUSO = 1950

# ---------------------------------------------------------------------------
# Mappa circuitId (Jolpica) -> codice_riferimento nostro.
#
# Costruita confrontando l'elenco reale dei circuiti restituito da
# GET /ergast/f1/circuits.json con gli slug già scelti in
# frontend/src/data/circuitPhotos.js (la tabella Creative Commons
# verificata dall'utente), così i circuiti importati da qui AGGANCIANO
# SUBITO le foto già pronte, senza bisogno di rinominare nulla dopo.
#
# Un circuitId assente da questa mappa non blocca l'importazione: lo
# script usa come ripiego lo stesso circuitId di Jolpica con "_" al posto
# di "-" (log ben visibile), da poter aggiungere qui in un secondo
# momento se compare una foto corrispondente.
# ---------------------------------------------------------------------------
MAPPA_CIRCUITI = {
    "albert_park": "albert-park",
    "americas": "austin",
    "brands_hatch": "brands-hatch",
    "charade": "clermont-ferrand",
    "essarts": "rouen-les-essarts",
    "galvez": "buenos-aires",
    "george": "east-london",
    "hockenheimring": "hockenheim",
    "las_vegas": "las-vegas",
    "long_beach": "long-beach",
    "magny_cours": "magny-cours",
    "marina_bay": "singapore",
    "red_bull_ring": "red-bull-ring",
    "ricard": "paul-ricard",
    "rodriguez": "mexico",
    "tremblant": "mont-tremblant",
    "vegas": "caesars-palace",
    "villeneuve": "montreal",
    "watkins_glen": "watkins-glen",
    "yas_marina": "yas-marina",
    "yeongam": "corea",
    # Jolpica tratta il Nürburgring come UN SOLO circuito indipendentemente
    # dalla configurazione (Nordschleife/GP-Strecke): niente da mappare
    # per le voci "nurburgring-gp-strecke"/"nurburgring-nordschleife" di
    # circuitPhotos.js, che infatti sono state consolidate sotto
    # "nurburgring" — vedi nota nello stesso file.
    # Tutti gli id non elencati qui (es. monza, spa, monaco, silverstone,
    # indianapolis, bremgarten, reims, adelaide, aintree, ...) coincidono
    # già col nostro slug, nessuna mappatura necessaria.
}

# Demonimi in inglese (come li restituisce Jolpica in Driver.nationality
# / Constructor.nationality) -> codice ISO2. Copre le nazionalità
# effettivamente comparse tra piloti e costruttori 1951-1970; se ne
# comparisse una non elencata, trova_o_crea_nazione la segnala comunque
# con un avviso invece di far fallire l'import.
MAPPA_NAZIONALITA_ISO2 = {
    "British": "GB", "Italian": "IT", "German": "DE", "French": "FR",
    "Argentine": "AR", "Argentinian": "AR", "Brazilian": "BR",
    "American": "US", "Belgian": "BE", "Swiss": "CH", "Dutch": "NL",
    "Swedish": "SE", "Finnish": "FI", "Austrian": "AT",
    "South African": "ZA", "New Zealander": "NZ", "Australian": "AU",
    "Monegasque": "MC", "Spanish": "ES", "Portuguese": "PT",
    "Irish": "IE", "Rhodesian": "ZW", "Thai": "TH", "Indian": "IN",
    "Venezuelan": "VE", "Uruguayan": "UY", "Colombian": "CO",
    "Mexican": "MX", "Canadian": "CA", "Japanese": "JP",
    "Liechtensteiner": "LI", "Hong Konger": "HK", "Danish": "DK",
    "Polish": "PL",
    # Jolpica usa "East German" per i piloti della Germania Ovest/Est di
    # inizio anni '50 indistintamente da "German" per motivi di comodo
    # storico nella loro fonte: nei primi anni '50 (i GP di Germania del
    # 1952-1953 dove è comparsa) la DDR non era ancora trattata come
    # nazione sportivamente distinta neppure dalla FIA. La mappiamo su
    # 'DE' come "German", non su una nazione a parte: vedi
    # db/patch_nazionalita_est_tedeschi.sql per il backfill dei piloti
    # già importati prima di questa correzione (1951-1970, lanciato il
    # 2026-09-20) che erano rimasti con nazione_id NULL.
    "East German": "DE",
}

# BUG REALE trovato dopo il lancio vero del 2026-09-20 (segnalato
# dall'utente controllando il sito, non dal log — l'import non dà
# nessun errore in questo caso, crea semplicemente un secondo pilota):
# pilota_id_da_jolpica() riconosce un pilota già in database confrontando
# lo slug calcolato da "{givenName} {familyName}" (dati Jolpica) con
# piloti.codice_riferimento — ma per alcuni piloti già presenti dal 1950
# (inserito a mano) il nome completo non coincide alla lettera con
# quello che restituisce Jolpica. Caso reale: Fangio nel 1950 è salvato
# come nome="Juan", cognome="Manuel Fangio" (slug "juan-manuel-fangio"),
# mentre Jolpica lo restituisce come givenName="Juan",
# familyName="Fangio" (senza "Manuel" nel mezzo) -> slug "juan-fangio":
# due slug diversi, quindi due righe diverse in piloti, con la sua
# carriera 1950 e 1951+ spezzata in due schede.
#
# Questa mappa forza, per lo specifico Jolpica driverId indicato, il
# riuso del pilota già esistente con quel codice_riferimento (invece di
# calcolare lo slug dal nome Jolpica) — bypassa il confronto per nome,
# non lo corregge: se in futuro emerge un altro pilota "sdoppiato" tra
# 1950 e le stagioni successive, va aggiunta qui una riga
# "driverId_jolpica": "codice-riferimento-esistente" (il driverId si
# legge nel JSON di Jolpica, es. https://api.jolpi.ca/ergast/f1/1951/drivers.json).
#
# NOTA: questa mappa NON sistema da sola i piloti già duplicati
# dall'import del 2026-09-20 — per quelli serve un merge manuale via SQL
# (vedi db/patch_merge_piloti_duplicati.sql per Fangio).
MAPPA_PILOTI_DRIVERID_CODICE = {
    "fangio": "juan-manuel-fangio",
}


def trova_pilota_per_codice(cur, codice_riferimento: str) -> Optional[int]:
    """Cerca un pilota per codice_riferimento esatto (usato da
    MAPPA_PILOTI_DRIVERID_CODICE per riagganciare un pilota Jolpica al
    suo record già esistente in database, quando il nome non combacia
    lettera per lettera). None se non lo trova — in quel caso il
    chiamante ricade sul percorso normale (cerca/crea per slug del
    nome)."""
    cur.execute("SELECT id FROM piloti WHERE codice_riferimento = %s", (codice_riferimento,))
    riga = cur.fetchone()
    return riga[0] if riga else None


def get_json(percorso: str, parametri: Optional[dict] = None) -> dict:
    """GET verso l'API Jolpica con una pausa di cortesia e un errore
    parlante se qualcosa va storto (status diverso da 200, JSON non
    valido): meglio fermarsi con un messaggio chiaro che proseguire con
    dati a metà."""
    url = f"{BASE_URL}/{percorso}"
    risposta = requests.get(url, params=parametri, timeout=30)
    time.sleep(PAUSA_TRA_RICHIESTE_SEC)
    if risposta.status_code != 200:
        raise RuntimeError(f"Jolpica ha risposto HTTP {risposta.status_code} per {url}")
    return risposta.json()


def slug_circuito(circuit_id: str) -> str:
    return MAPPA_CIRCUITI.get(circuit_id, circuit_id.replace("_", "-"))


def iso2_da_nazionalita(nazionalita_inglese: str) -> Optional[str]:
    trovato = MAPPA_NAZIONALITA_ISO2.get(nazionalita_inglese)
    if not trovato:
        log.warning(
            "Nazionalità %r non nella mappa MAPPA_NAZIONALITA_ISO2: verrà creata "
            "una nazione segnaposto. Aggiungi la mappatura giusta e correggi a mano.",
            nazionalita_inglese,
        )
    return trovato


def trova_o_crea_circuito(cur, circuito_jolpica: dict) -> int:
    slug = slug_circuito(circuito_jolpica["circuitId"])
    cur.execute("SELECT id FROM circuiti WHERE codice_riferimento = %s", (slug,))
    riga = cur.fetchone()
    if riga:
        return riga[0]

    loc = circuito_jolpica.get("Location", {})
    localita = ", ".join(p for p in [loc.get("locality"), loc.get("country")] if p) or None
    nazione_id = None
    if loc.get("country"):
        # Jolpica dà il nome del paese in inglese (es. "Italy"), non un
        # ISO2: qui usiamo solo la località testuale, la nazione_id la
        # lasciamo NULL piuttosto che indovinare un codice sbagliato — è
        # un dato secondario per la scheda circuito (già presente per i
        # 7 del 1950, inseriti a mano), non blocca l'import delle gare.
        pass

    log.info("Circuito nuovo: %s (slug=%s)", circuito_jolpica["circuitName"], slug)
    cur.execute(
        """INSERT INTO circuiti (codice_riferimento, nome, localita, nazione_id, latitudine, longitudine)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (
            slug,
            circuito_jolpica["circuitName"],
            localita,
            nazione_id,
            loc.get("lat"),
            loc.get("long"),
        ),
    )
    return cur.fetchone()[0]


def trova_o_crea_stagione(cur, anno: int) -> int:
    cur.execute("SELECT id FROM stagioni WHERE anno = %s", (anno,))
    riga = cur.fetchone()
    if riga:
        return riga[0]
    cur.execute("INSERT INTO stagioni (anno) VALUES (%s) RETURNING id", (anno,))
    return cur.fetchone()[0]


def trova_o_crea_gran_premio(cur, stagione_id: int, circuito_id: int, gara_jolpica: dict) -> int:
    data_gara = gara_jolpica.get("date") or None
    cur.execute(
        """SELECT id FROM gran_premi
           WHERE stagione_id = %s AND circuito_id = %s
             AND (data_gara = %s OR (%s IS NULL AND data_gara IS NULL))""",
        (stagione_id, circuito_id, data_gara, data_gara),
    )
    riga = cur.fetchone()
    if riga:
        return riga[0]
    cur.execute(
        """INSERT INTO gran_premi (stagione_id, circuito_id, nome_gp, round, data_gara)
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (stagione_id, circuito_id, gara_jolpica["raceName"], int(gara_jolpica.get("round") or 0) or None, data_gara),
    )
    return cur.fetchone()[0]


def pilota_id_da_jolpica(cur, driver: dict) -> int:
    # Prima controlla la mappa manuale (vedi MAPPA_PILOTI_DRIVERID_CODICE
    # più sopra): per i pochi piloti noti "sdoppiati" tra 1950 e le
    # stagioni successive, riaggancia direttamente il record esistente
    # invece di ricalcolare lo slug dal nome Jolpica.
    codice_forzato = MAPPA_PILOTI_DRIVERID_CODICE.get(driver.get("driverId", ""))
    if codice_forzato:
        pilota_id = trova_pilota_per_codice(cur, codice_forzato)
        if pilota_id:
            return pilota_id
        log.warning(
            "MAPPA_PILOTI_DRIVERID_CODICE indica codice_riferimento=%r per "
            "driverId=%r ma non esiste in tabella piloti: ricado sul "
            "percorso normale (cerca/crea per nome).",
            codice_forzato, driver.get("driverId"),
        )

    nome_completo = f"{driver['givenName']} {driver['familyName']}".strip()
    iso2 = iso2_da_nazionalita(driver.get("nationality", ""))
    return trova_o_crea_pilota(cur, nome_completo, iso2)


def costruttore_id_da_jolpica(cur, constructor: dict) -> int:
    return trova_o_crea_costruttore(cur, constructor["name"])


def stato_id_da_status(cur, status_testo: str) -> Optional[int]:
    """Mappa lo status testuale di Jolpica (es. 'Finished', '+1 Lap',
    'Accident', 'Engine', 'Retired', 'Disqualified') a uno stato
    categorico già presente in tabella stati_risultato. Un pilota
    doppiato ma comunque arrivato ('+1 Lap', '+2 Laps', ...) conta come
    FINISHED: ha completato la gara, solo con un giro di distacco."""
    status_testo = (status_testo or "").strip()
    if status_testo == "Finished" or status_testo.startswith("+"):
        codice = "FINISHED"
    elif status_testo.lower() in {"accident", "collision"}:
        codice = "ACCIDENT"
    elif "engine" in status_testo.lower() or "gearbox" in status_testo.lower():
        codice = "ENGINE"
    elif status_testo.lower() in {"disqualified"}:
        codice = "DSQ"
    elif status_testo.lower() in {"not classified", "nc"}:
        codice = "NOT_CLASSIFIED"
    else:
        codice = "RETIRED"
    cur.execute("SELECT id FROM stati_risultato WHERE codice = %s", (codice,))
    riga = cur.fetchone()
    return riga[0] if riga else None


def importa_risultati_gara(cur, gran_premio_id: int, risultati_jolpica: list[dict]) -> int:
    inserite = 0
    for r in risultati_jolpica:
        pilota_id = pilota_id_da_jolpica(cur, r["Driver"])
        costruttore_id = costruttore_id_da_jolpica(cur, r["Constructor"])
        stato_id = stato_id_da_status(cur, r.get("status"))
        # BUG REALE trovato testando contro un fixture e poi verificato
        # con una richiesta vera (GP Argentina 1955): il campo "position"
        # di Jolpica è la posizione di arrivo di TUTTI i piloti, ritirati
        # compresi (es. un ritirato può avere position="8") — NON indica
        # da solo se il pilota è stato classificato. Il campo giusto da
        # controllare è "positionText": se è un numero puro, è una vera
        # posizione di classifica; se è una lettera ('R' ritirato, 'D'
        # squalificato, 'W' ritirato prima del via, 'E' escluso, 'N' non
        # classificato, 'F' squalificato al traguardo), il pilota NON va
        # considerato classificato anche se "position" è un numero.
        position_text = str(r.get("positionText", "")).strip()
        posizione_finale = int(position_text) if position_text.isdigit() else None
        tempo = (r.get("Time") or {}).get("time")

        cur.execute(
            """INSERT INTO risultati_gara
                   (gran_premio_id, pilota_id, costruttore_id, numero_vettura,
                    posizione_griglia, posizione_finale, posizione_finale_testo,
                    stato_id, motivo_ritiro, giri_completati, distacco_testo, punti)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (gran_premio_id, pilota_id) DO NOTHING""",
            (
                gran_premio_id,
                pilota_id,
                costruttore_id,
                int(r["number"]) if str(r.get("number", "")).isdigit() else None,
                int(r["grid"]) if str(r.get("grid", "")).isdigit() else None,
                posizione_finale,
                None if posizione_finale else r.get("positionText"),
                stato_id,
                None if posizione_finale else r.get("status"),
                int(r["laps"]) if str(r.get("laps", "")).isdigit() else None,
                tempo,
                float(r.get("points") or 0),
            ),
        )
        inserite += 1
    return inserite


def importa_classifica_ufficiale(cur, stagione_id: int, tipo: str, voci: list[dict]) -> None:
    """tipo: 'piloti' o 'costruttori'."""
    for voce in voci:
        posizione = int(voce["position"]) if voce.get("position", "").isdigit() else None
        punti = float(voce.get("points") or 0)
        vittorie = int(voce.get("wins") or 0)
        if tipo == "piloti":
            entita_id = pilota_id_da_jolpica(cur, voce["Driver"])
            cur.execute(
                """INSERT INTO classifica_ufficiale_piloti (stagione_id, pilota_id, posizione, punti, vittorie)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (stagione_id, pilota_id)
                   DO UPDATE SET posizione = EXCLUDED.posizione, punti = EXCLUDED.punti, vittorie = EXCLUDED.vittorie""",
                (stagione_id, entita_id, posizione, punti, vittorie),
            )
        else:
            costruttori = voce.get("Constructors") or []
            for c in costruttori:
                entita_id = costruttore_id_da_jolpica(cur, c)
                cur.execute(
                    """INSERT INTO classifica_ufficiale_costruttori (stagione_id, costruttore_id, posizione, punti, vittorie)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT (stagione_id, costruttore_id)
                       DO UPDATE SET posizione = EXCLUDED.posizione, punti = EXCLUDED.punti, vittorie = EXCLUDED.vittorie""",
                    (stagione_id, entita_id, posizione, punti, vittorie),
                )


def importa_stagione(cur, anno: int, dry_run: bool) -> None:
    if anno == ANNO_ESCLUSO:
        log.warning("Anno %s escluso di proposito (già importato/arricchito a mano): salto.", anno)
        return

    log.info("=== Stagione %s ===", anno)
    dati_gare = get_json(f"{anno}.json", {"limit": 100})
    gare = dati_gare["MRData"]["RaceTable"]["Races"]
    log.info("Trovate %d gare nella stagione %s.", len(gare), anno)

    if dry_run:
        for g in gare:
            log.info("  [dry-run] Round %s: %s @ %s (%s) -> slug circuito: %s",
                      g.get("round"), g["raceName"], g["Circuit"]["circuitName"],
                      g.get("date"), slug_circuito(g["Circuit"]["circuitId"]))
        return

    stagione_id = trova_o_crea_stagione(cur, anno)

    for g in gare:
        circuito_id = trova_o_crea_circuito(cur, g["Circuit"])
        gran_premio_id = trova_o_crea_gran_premio(cur, stagione_id, circuito_id, g)

        dati_risultati = get_json(f"{anno}/{g['round']}/results.json", {"limit": 100})
        gare_risultati = dati_risultati["MRData"]["RaceTable"]["Races"]
        risultati = gare_risultati[0]["Results"] if gare_risultati else []
        n = importa_risultati_gara(cur, gran_premio_id, risultati)
        log.info("  Round %s (%s): %d risultati importati.", g.get("round"), g["raceName"], n)

    dati_piloti = get_json(f"{anno}/driverStandings.json")
    liste_piloti = dati_piloti["MRData"]["StandingsTable"]["StandingsLists"]
    if liste_piloti:
        importa_classifica_ufficiale(cur, stagione_id, "piloti", liste_piloti[0]["DriverStandings"])

    dati_costruttori = get_json(f"{anno}/constructorStandings.json")
    liste_costruttori = dati_costruttori["MRData"]["StandingsTable"]["StandingsLists"]
    if liste_costruttori:
        importa_classifica_ufficiale(cur, stagione_id, "costruttori", liste_costruttori[0]["ConstructorStandings"])

    log.info("Stagione %s completata.", anno)


def espandi_intervallo_anni(testo: str) -> list[int]:
    anni = []
    for parte in testo.split(","):
        parte = parte.strip()
        if "-" in parte:
            a, b = parte.split("-")
            anni.extend(range(int(a), int(b) + 1))
        else:
            anni.append(int(parte))
    return anni


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--anni", required=True, help="Es. '1951-1970' oppure '1955' oppure '1955,1960-1962'")
    p.add_argument("--dry-run", action="store_true", help="Mostra solo cosa farebbe, non scrive sul database")
    args = p.parse_args()

    anni = espandi_intervallo_anni(args.anni)

    if args.dry_run:
        for anno in anni:
            importa_stagione(None, anno, dry_run=True)
        return

    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("Variabile DATABASE_URL non impostata (creala in un file .env).")

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                for anno in anni:
                    importa_stagione(cur, anno, dry_run=False)
    finally:
        conn.close()

    log.info("Import completato per gli anni: %s", anni)


if __name__ == "__main__":
    main()
