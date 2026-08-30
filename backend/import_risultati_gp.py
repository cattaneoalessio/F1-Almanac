#!/usr/bin/env python3
"""
import_risultati_gp.py
-----------------------
Script di data ingestion per il progetto "GP Almanac".

COSA FA
  Legge un file CSV con i risultati di UN Gran Premio storico e li importa
  nel database PostgreSQL (schema in db/schema.sql), occupandosi di:
    1. normalizzare i tempi sul giro/gara nel formato standard MM:SS.mmm
    2. gestire i valori nulli (ritiri, non classificati, dati mancanti)
    3. mappare i nomi dei piloti (testo libero nel CSV) agli ID univoci
       già presenti nella tabella "piloti" del database (creandoli se
       non esistono ancora, con un avviso ben visibile in console)

FORMATO CSV ATTESO (intestazioni, in qualsiasi ordine):
    posizione_finale     -> es. "1", "2", "" (vuoto se ritirato/non class.)
    posizione_griglia    -> es. "3" (facoltativo)
    pilota                -> nome e cognome per esteso, es. "Antonio Ascari"
    costruttore           -> es. "Alfa Romeo"
    numero_vettura        -> facoltativo
    giri_completati       -> es. "80"
    tempo_o_distacco      -> es. "2:12:34.500", "+45.230", "Ritirato", "DNF"
    tempo_giro_veloce     -> es. "1:32.456" (facoltativo)
    stato                 -> facoltativo, testo libero tipo "Incidente",
                             "Problema motore"; se assente viene dedotto
                             da tempo_o_distacco
    nazionalita            -> facoltativo, codice ISO2 del paese del pilota
                             (es. "IT", "GB", "AR"): usato solo se il
                             pilota va creato ex novo, per popolare la
                             bandierina mostrata nel frontend (Fase D)

ESEMPIO D'USO
    # 1) installare le dipendenze (una sola volta):
    pip install pandas psycopg2-binary python-dotenv --break-system-packages

    # 2) creare un file .env nella stessa cartella con:
    DATABASE_URL=postgresql://utente:password@host:5432/nome_db

    # 3) lanciare uno "smoke test" senza scrivere nulla sul DB:
    python import_risultati_gp.py --csv gp_1920_targa_florio.csv \
        --anno 1920 --circuito targa-florio --nome-gp "Targa Florio" \
        --data-gara 1920-04-25 --dry-run

    # 4) una volta verificato l'output, rilanciare SENZA --dry-run per
    #    scrivere davvero sul database.

Pensato per essere lanciato UNA VOLTA PER GARA (un CSV = un Gran Premio).
Se hai un intero anno da importare, lancialo più volte con file diversi,
oppure adatta la funzione main() per iterare su più CSV in una cartella.
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import unicodedata
from dataclasses import dataclass
from datetime import date
from typing import Optional

import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(message)s",
)
log = logging.getLogger("import_risultati_gp")

# Parole che nel CSV indicano "non arrivato al traguardo" / dato mancante
PAROLE_RITIRO = {
    "ritirato", "rit", "rit.", "dnf", "dns", "dsq", "squalificato",
    "non classificato", "nc", "n.c.", "", "nan", "none",
}

# Mappa (parziale, estendibile) testo libero -> codice stato standard
MAPPA_STATO = {
    "incidente": "ACCIDENT",
    "crash": "ACCIDENT",
    "motore": "ENGINE",
    "problema motore": "ENGINE",
    "squalificato": "DSQ",
    "dsq": "DSQ",
    "disqualified": "DSQ",
    "non classificato": "NOT_CLASSIFIED",
    "nc": "NOT_CLASSIFIED",
    "not classified": "NOT_CLASSIFIED",
    # varianti in inglese, comuni nelle fonti storiche internazionali
    # (es. dataset derivati da Ergast/Jolpica): il testo originale resta
    # comunque conservato per intero in motivo_ritiro, questa mappa serve
    # solo per la categoria grossolana (stato_id).
    "accident": "ACCIDENT",
    "collision": "ACCIDENT",
    "engine": "ENGINE",
}


@dataclass
class Contesto:
    """Parametri della gara passati da riga di comando."""
    anno: int
    circuito_slug: str
    nome_gp: str
    data_gara: Optional[date]


# ---------------------------------------------------------------------------
# 1) NORMALIZZAZIONE TEMPI -> formato standard MM:SS.mmm
# ---------------------------------------------------------------------------

def normalizza_tempo(raw: Optional[str]) -> Optional[str]:
    """Converte una stringa di tempo giro/gara "sporca" nel formato
    standard MM:SS.mmm (minuti:secondi.millisecondi).

    Gestisce input come:
        "1:32.456"      -> "01:32.456"
        "1:32:456"      -> "01:32.456"   (separatore ms scritto con ':')
        "92.456"        -> "01:32.456"   (solo secondi totali)
        "1h32m45s654ms" -> None (fuori standard MM:SS, restituisce grezzo)
        "", "Ritirato", None -> None

    Ritorna None se il valore indica un ritiro/dato mancante: in quel
    caso la riga NON deve avere un tempo, non un tempo a zero.
    """
    if raw is None:
        return None
    testo = str(raw).strip()
    if testo.lower() in PAROLE_RITIRO:
        return None

    # Caso "MM:SS.mmm" o "MM:SS:mmm" (a volte i CSV storici usano ':' anche
    # per separare i millisecondi invece del punto)
    m = re.match(r"^(\d{1,2}):(\d{2})[.:](\d{1,3})$", testo)
    if m:
        minuti, secondi, millis = m.groups()
        millis = millis.ljust(3, "0")  # "45" -> "450"
        return f"{int(minuti):02d}:{secondi}.{millis}"

    # Caso "MM:SS" senza millisecondi
    m = re.match(r"^(\d{1,2}):(\d{2})$", testo)
    if m:
        minuti, secondi = m.groups()
        return f"{int(minuti):02d}:{secondi}.000"

    # Caso solo secondi totali, es. "92.456" o "45"
    m = re.match(r"^(\d{1,4})([.](\d{1,3}))?$", testo)
    if m:
        secondi_totali = float(testo)
        minuti = int(secondi_totali // 60)
        secondi = secondi_totali - minuti * 60
        return f"{minuti:02d}:{secondi:06.3f}"

    # Formato non riconosciuto: lo segnaliamo invece di inventare un dato
    log.warning("Formato tempo non riconosciuto, lasciato vuoto: %r", raw)
    return None


def normalizza_tempo_totale(raw: Optional[str]) -> Optional[str]:
    """Normalizza il TEMPO TOTALE DI GARA del vincitore (che può superare
    l'ora, a differenza di un singolo giro). Restituisce una stringa
    compatibile col tipo INTERVAL di PostgreSQL ("HH:MM:SS.mmm"), oppure
    None se il valore indica un ritiro/dato mancante.

    NOTA: per i distacchi degli altri piloti (es. "+5.320", "+1 Giro") non
    si usa questa funzione: quei valori restano testo libero nella colonna
    distacco_testo, perché non sono un tempo assoluto ma una differenza.
    """
    if raw is None:
        return None
    testo = str(raw).strip()
    if testo.lower() in PAROLE_RITIRO:
        return None

    # "H:MM:SS.mmm" o "H:MM:SS" (tempo di gara assoluto, es. vincitore)
    m = re.match(r"^(\d{1,3}):(\d{2}):(\d{2})(?:[.:](\d{1,3}))?$", testo)
    if m:
        ore, minuti, secondi, millis = m.groups()
        millis = (millis or "0").ljust(3, "0")
        return f"{int(ore):02d}:{minuti}:{secondi}.{millis}"

    # "H:MM" con un solo separatore (secondi non registrati nella fonte
    # storica): capitato per davvero con dati reali del 1950 (GP del
    # Belgio, vincitore Fangio, fonte Jolpica/Ergast riporta solo "2:47").
    # Qui NON può essere interpretato come MM:SS (tempo sul giro): nessuna
    # gara di Formula 1 dura pochi minuti, quindi un H:MM ambiguo a questo
    # livello (tempo TOTALE di gara) va letto come ore:minuti, non come
    # minuti:secondi. I secondi mancanti restano a 00 con un avviso, invece
    # di inventare un dato più preciso di quello disponibile alla fonte.
    m = re.match(r"^(\d{1,2}):(\d{2})$", testo)
    if m:
        ore, minuti = m.groups()
        log.warning(
            "Tempo totale di gara %r senza i secondi: interpretato come %s ore e %s minuti "
            "(secondi non disponibili nella fonte, impostati a 00).",
            raw, ore, minuti,
        )
        return f"{int(ore):02d}:{minuti}:00.000"

    # altrimenti è un tempo "corto" (MM:SS.mmm o secondi totali): riusa la
    # normalizzazione da tempo sul giro, che copre già questi casi
    corto = normalizza_tempo(testo)
    return corto


def deduci_stato(posizione_finale: Optional[str], tempo_o_distacco: Optional[str],
                  stato_testo: Optional[str]) -> str:
    """Deduce il codice di stato_risultato da usare (FINISHED/RETIRED/...)."""
    testo_stato = (stato_testo or "").strip().lower()
    if testo_stato in MAPPA_STATO:
        return MAPPA_STATO[testo_stato]

    pos_vuota = posizione_finale is None or str(posizione_finale).strip() == ""
    tempo_vuoto = tempo_o_distacco is None or str(tempo_o_distacco).strip().lower() in PAROLE_RITIRO

    if not pos_vuota:
        return "FINISHED"
    if tempo_vuoto:
        return "RETIRED"
    return "NOT_CLASSIFIED"


# ---------------------------------------------------------------------------
# 2) MAPPATURA PILOTI -> ID univoci nel database
# ---------------------------------------------------------------------------

def slugify(testo: str) -> str:
    """'Antônio Ascari' -> 'antonio-ascari' (per il campo codice_riferimento)."""
    testo = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    testo = re.sub(r"[^a-zA-Z0-9]+", "-", testo).strip("-").lower()
    return testo


def trova_o_crea_nazione(cur, codice_iso2: str) -> int:
    """Cerca la nazione per codice ISO2 (es. 'IT'); se non esiste la crea
    con un nome segnaposto (il codice stesso) — meglio un placeholder
    visibile da correggere a mano che bloccare l'import per una nazione
    non ancora seminata in db/schema.sql."""
    codice_iso2 = codice_iso2.strip().upper()
    cur.execute("SELECT id FROM nazioni WHERE codice_iso2 = %s", (codice_iso2,))
    riga = cur.fetchone()
    if riga:
        return riga[0]
    log.warning(
        "Nazione con codice ISO2 %r non presente in tabella nazioni, la creo "
        "con nome segnaposto: aggiorna il nome a mano quando puoi.",
        codice_iso2,
    )
    cur.execute(
        "INSERT INTO nazioni (codice_iso2, nome) VALUES (%s, %s) RETURNING id",
        (codice_iso2, codice_iso2),
    )
    return cur.fetchone()[0]


def trova_o_crea_pilota(cur, nome_completo: str, nazionalita_iso2: Optional[str] = None) -> int:
    """Cerca il pilota per slug; se non esiste lo crea e AVVISA in console
    (meglio un avviso visibile che un duplicato silenzioso: verifica sempre
    a mano i piloti creati automaticamente).

    `nazionalita_iso2` (facoltativo, dalla colonna CSV "nazionalita") va
    valorizzato SOLO in fase di creazione: se il pilota esiste già, il suo
    dato in database resta quello (lo script non sovrascrive mai un
    pilota esistente, solo ne aggiunge di nuovi)."""
    nome_completo = nome_completo.strip()
    slug = slugify(nome_completo)

    cur.execute("SELECT id FROM piloti WHERE codice_riferimento = %s", (slug,))
    riga = cur.fetchone()
    if riga:
        return riga[0]

    # split semplice "Nome Cognome" -> ultima parola = cognome
    parti = nome_completo.split()
    nome, cognome = (parti[0], " ".join(parti[1:])) if len(parti) > 1 else (nome_completo, "")

    nazione_id = trova_o_crea_nazione(cur, nazionalita_iso2) if nazionalita_iso2 else None

    log.warning(
        "Pilota non trovato nel DB, lo creo ora: %r (slug=%s). "
        "Controlla poi a mano nazionalità/date di nascita.",
        nome_completo, slug,
    )
    cur.execute(
        """INSERT INTO piloti (codice_riferimento, nome, cognome, nazione_id)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (slug, nome, cognome, nazione_id),
    )
    return cur.fetchone()[0]


def trova_o_crea_costruttore(cur, nome: str) -> int:
    nome = nome.strip()
    slug = slugify(nome)
    cur.execute("SELECT id FROM costruttori WHERE codice_riferimento = %s", (slug,))
    riga = cur.fetchone()
    if riga:
        return riga[0]
    log.warning("Costruttore non trovato, lo creo ora: %r (slug=%s)", nome, slug)
    cur.execute(
        "INSERT INTO costruttori (codice_riferimento, nome) VALUES (%s, %s) RETURNING id",
        (slug, nome),
    )
    return cur.fetchone()[0]


def trova_o_crea_gran_premio(cur, ctx: Contesto) -> int:
    """Assicura che esistano stagione, circuito (deve già esistere) e
    gran premio; ritorna l'id del gran premio su cui agganciare i risultati."""
    cur.execute("SELECT id FROM circuiti WHERE codice_riferimento = %s", (ctx.circuito_slug,))
    riga = cur.fetchone()
    if not riga:
        raise SystemExit(
            f"Circuito '{ctx.circuito_slug}' non trovato in tabella circuiti. "
            f"Inseriscilo prima a mano (nome, paese, ecc.) e rilancia lo script."
        )
    circuito_id = riga[0]

    cur.execute("SELECT id FROM stagioni WHERE anno = %s", (ctx.anno,))
    riga = cur.fetchone()
    if riga:
        stagione_id = riga[0]
    else:
        log.info("Stagione %s non presente, la creo.", ctx.anno)
        # Colleghiamo subito la stagione al sistema di punteggio della sua
        # epoca, se ne esiste uno in tabella: senza questo collegamento la
        # classifica piloti (Fase C) calcolerebbe sempre 0 punti anche
        # avendo i risultati, perché non saprebbe quali punti assegnare a
        # ogni posizione.
        cur.execute(
            """SELECT id FROM sistemi_punteggio
               WHERE anno_inizio <= %s AND (anno_fine IS NULL OR anno_fine >= %s)
               ORDER BY anno_inizio DESC LIMIT 1""",
            (ctx.anno, ctx.anno),
        )
        riga_sistema = cur.fetchone()
        sistema_id = riga_sistema[0] if riga_sistema else None
        if sistema_id is None:
            log.warning(
                "Nessun sistema di punteggio in tabella copre l'anno %s: la classifica "
                "piloti per questa stagione darà 0 punti finché non ne aggiungi uno "
                "(vedi sistemi_punteggio / punti_per_posizione in db/schema.sql).",
                ctx.anno,
            )
        cur.execute(
            "INSERT INTO stagioni (anno, sistema_punteggio_id) VALUES (%s, %s) RETURNING id",
            (ctx.anno, sistema_id),
        )
        stagione_id = cur.fetchone()[0]

    cur.execute(
        """SELECT id FROM gran_premi
           WHERE stagione_id = %s AND circuito_id = %s
             AND (data_gara = %s OR (%s IS NULL AND data_gara IS NULL))""",
        (stagione_id, circuito_id, ctx.data_gara, ctx.data_gara),
    )
    riga = cur.fetchone()
    if riga:
        return riga[0]

    cur.execute(
        """INSERT INTO gran_premi (stagione_id, circuito_id, nome_gp, data_gara)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (stagione_id, circuito_id, ctx.nome_gp, ctx.data_gara),
    )
    return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# 3) IMPORT PRINCIPALE
# ---------------------------------------------------------------------------

def importa_csv(path_csv: str, ctx: Contesto, dry_run: bool) -> None:
    df = pd.read_csv(path_csv, dtype=str, keep_default_na=False)
    df.columns = [c.strip().lower() for c in df.columns]

    colonne_richieste = {"pilota", "costruttore"}
    mancanti = colonne_richieste - set(df.columns)
    if mancanti:
        raise SystemExit(f"Colonne obbligatorie mancanti nel CSV: {mancanti}")

    # Pulizia + normalizzazione applicata riga per riga
    df["tempo_normalizzato"] = df.get("tempo_o_distacco", "").apply(
        lambda v: v if str(v).strip().startswith("+") else normalizza_tempo_totale(v)
    )
    df["giro_veloce_normalizzato"] = df.get("tempo_giro_veloce", "").apply(normalizza_tempo)
    df["stato_dedotto"] = df.apply(
        lambda r: deduci_stato(r.get("posizione_finale"), r.get("tempo_o_distacco"), r.get("stato")),
        axis=1,
    )

    # IMPORTANTE: pandas converte silenziosamente i "None" restituiti dalle
    # funzioni di normalizzazione in NaN (float) quando costruisce le nuove
    # colonne. psycopg2 non sa scrivere un NaN in una colonna INTERVAL, quindi
    # qui riportiamo esplicitamente ogni NaN a un vero None prima di
    # procedere: senza questo passaggio l'inserimento fallirebbe con
    # "DatatypeMismatch" sulle righe di ritiro/dati mancanti.
    df = df.astype(object).where(pd.notnull(df), None)

    log.info("Righe lette dal CSV: %d", len(df))
    log.info("Anteprima normalizzazione tempi:\n%s",
              df[["pilota", "tempo_o_distacco", "tempo_normalizzato", "stato_dedotto"]].head(10).to_string(index=False))

    if dry_run:
        log.info("--dry-run attivo: NESSUNA scrittura sul database. Rilancia senza --dry-run per importare davvero.")
        return

    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("Variabile DATABASE_URL non impostata (creala in un file .env).")

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                gran_premio_id = trova_o_crea_gran_premio(cur, ctx)
                cur.execute("SELECT id, codice FROM stati_risultato")
                stati = {codice: sid for sid, codice in cur.fetchall()}

                inserite, saltate = 0, 0
                # NOTA: si usa df.to_dict("records") e non df.iterrows().
                # df.iterrows() ricostruisce ogni riga come una Series con un
                # unico dtype "unificato": quando una riga mescola numeri,
                # testo e valori mancanti, questo fa ridiventare NaN i valori
                # None già puliti sopra, ripresentando lo stesso bug del
                # DatatypeMismatch su colonne INTERVAL. to_dict("records")
                # non ha questo problema perché legge ogni cella così com'è.
                for riga in df.to_dict(orient="records"):
                    if not riga["pilota"].strip():
                        saltate += 1
                        continue

                    pilota_id = trova_o_crea_pilota(cur, riga["pilota"], riga.get("nazionalita") or None)
                    costruttore_id = trova_o_crea_costruttore(cur, riga["costruttore"])
                    stato_id = stati.get(riga["stato_dedotto"])

                    posizione_finale = riga.get("posizione_finale", "").strip()
                    posizione_griglia = riga.get("posizione_griglia", "").strip()
                    giri = riga.get("giri_completati", "").strip()

                    motivo_ritiro = (riga.get("stato") or "").strip() or None

                    cur.execute(
                        """
                        INSERT INTO risultati_gara (
                            gran_premio_id, pilota_id, costruttore_id,
                            numero_vettura, posizione_griglia, posizione_finale,
                            posizione_finale_testo, stato_id, motivo_ritiro, giri_completati,
                            tempo_totale, distacco_testo, tempo_giro_veloce, punti
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        ON CONFLICT (gran_premio_id, pilota_id) DO NOTHING
                        """,
                        (
                            gran_premio_id, pilota_id, costruttore_id,
                            riga.get("numero_vettura") or None,
                            int(posizione_griglia) if posizione_griglia.isdigit() else None,
                            int(posizione_finale) if posizione_finale.isdigit() else None,
                            None if posizione_finale.isdigit() else (posizione_finale or None),
                            stato_id,
                            motivo_ritiro,
                            int(giri) if giri.isdigit() else None,
                            riga["tempo_normalizzato"] if riga["tempo_normalizzato"] and not str(riga["tempo_normalizzato"]).startswith("+") else None,
                            riga["tempo_o_distacco"] if str(riga.get("tempo_o_distacco", "")).strip().startswith("+") else None,
                            riga["giro_veloce_normalizzato"],
                            0,  # i punti si assegnano in un passaggio successivo dedicato (vedi README fase B)
                        ),
                    )
                    inserite += 1

        log.info("Import completato: %d righe inserite, %d righe saltate (pilota vuoto).", inserite, saltate)
    finally:
        conn.close()


def parse_args() -> Contesto:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--csv", required=True, help="Percorso del file CSV della gara")
    p.add_argument("--anno", required=True, type=int, help="Anno della stagione, es. 1920")
    p.add_argument("--circuito", required=True, dest="circuito_slug",
                   help="codice_riferimento del circuito già presente in tabella circuiti, es. 'monza'")
    p.add_argument("--nome-gp", required=True, help="Nome del Gran Premio, es. 'Gran Premio d'Italia'")
    p.add_argument("--data-gara", default=None, help="Data gara in formato YYYY-MM-DD (facoltativa)")
    p.add_argument("--dry-run", action="store_true", help="Analizza e stampa senza scrivere sul database")
    args = p.parse_args()

    data_gara = date.fromisoformat(args.data_gara) if args.data_gara else None
    ctx = Contesto(anno=args.anno, circuito_slug=args.circuito_slug, nome_gp=args.nome_gp, data_gara=data_gara)
    return args.csv, ctx, args.dry_run


if __name__ == "__main__":
    csv_path, contesto, dry_run = parse_args()
    if not os.path.exists(csv_path):
        sys.exit(f"File non trovato: {csv_path}")
    importa_csv(csv_path, contesto, dry_run)
