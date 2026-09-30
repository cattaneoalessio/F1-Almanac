"""
driverle.py — logica del gioco Arcade Driverle: indovina il pilota misterioso
del giorno, alla Wordle. Isolato da main.py come già game.py e chronoquiz.py
(citato per nome come prossimo gioco proprio nel commento in cima a
chronoquiz.py, prima ancora che qualcuno lo chiedesse).

Determinismo del pilota del giorno: NESSUNO stato in memoria. Il pilota è
scelto da un hash della data UTC (YYYY-MM-DD) sul pool di piloti idonei — lo
stesso giorno UTC produce sempre lo stesso pilota, ovunque, anche se il
server Render si è addormentato e riavviato nel frattempo (motivo esplicito
della richiesta: il piano gratuito lo fa spesso). Nessun bisogno di salvare
"il pilota di oggi" da nessuna parte: si ricalcola, sempre uguale, ad ogni
richiesta.

Anti-cheat: il pilota misterioso non lascia MAI questo modulo verso il
frontend se non come id interno usato per interrogare di nuovo il DB — i
suoi attributi restano sul server, il client riceve solo il feedback del
confronto. Stessa policy "meglio vuoto che inventato" già in uso altrove:
se un dato manca (data di nascita, numero di gara) per il pilota TENTATO,
il feedback per quell'attributo è "non disponibile", mai una freccia a
caso.
"""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timezone
from typing import Optional

# Punti assegnati in base a quanti tentativi sono serviti per indovinare
# (indice 0 = indovinato al 1° tentativo). Si sommano nel tempo nel
# Livello Pilota (arcade_punteggi, gioco='driverle'): ogni giorno vinto è
# un traguardo a sé, non un "record" da battere come ChronoQuiz — coerente
# con la scelta fatta con l'utente.
PUNTI_PER_TENTATIVO = [50, 40, 30, 20, 12, 6]
NUMERO_TENTATIVI_MASSIMO = len(PUNTI_PER_TENTATIVO)  # 6

# Pool dei piloti MISTERIOSI (non della ricerca, che resta aperta a tutti
# dal 1950): un pilota diventa eleggibile come misterioso solo se
# ragionevolmente noto — o per numero di presenze, o perché ha corso di
# recente (include così anche gli esordienti con poche gare). Deciso con
# l'utente.
SOGLIA_GARE_CARRIERA = 20
SOGLIA_ANNO_RECENTE = 2010

# Dal 2014 il numero di gara è personale e fisso per tutta la carriera del
# pilota (prima cambiava gara per gara, a volte anche stagione per
# stagione): confrontarlo per un pilota di un'epoca precedente non
# avrebbe un significato stabile. Il valore mostrato resta comunque
# quello del suo risultato più recente in archivio (non nascosto), ma il
# confronto è etichettato "N/D" per chi ha corso solo prima di questa
# soglia.
PRIMO_ANNO_NUMERO_PERSONALE = 2014


def oggi_utc() -> date:
    return datetime.now(timezone.utc).date()


def id_pilota_del_giorno(cur, giorno: date) -> Optional[int]:
    """Il pilota misterioso di `giorno`, scelto in modo deterministico:
    hash della data come seed su un pool ORDINATO in modo stabile (per
    id) di piloti idonei. Nessuno stato salvato: la stessa data produce
    sempre la stessa scelta, anche da un processo appena riavviato.
    Esclude i piloti deceduti (p.data_morte): per loro il confronto
    "età" non avrebbe un valore attuale con cui confrontarsi, e se
    fosse il misterioso l'intera colonna sarebbe inutile per tutti i
    tentativi di quel giorno — restano comunque tentabili (la ricerca
    resta aperta a tutti i piloti dal 1950), solo mai come misterioso.
    None se il pool è vuoto (non dovrebbe succedere con dati reali, ma
    "meglio vuoto che inventato" anche qui: mai un pilota a caso fuori
    dal pool)."""
    cur.execute(
        """
        SELECT p.id
        FROM piloti p
        JOIN (
            SELECT r.pilota_id, COUNT(*) AS gare_totali, MAX(s.anno) AS ultimo_anno
            FROM risultati_gara r
            JOIN gran_premi gp ON gp.id = r.gran_premio_id
            JOIN stagioni s ON s.id = gp.stagione_id
            WHERE r.tipo_sessione = 'gara'
            GROUP BY r.pilota_id
        ) g ON g.pilota_id = p.id
        WHERE p.data_nascita IS NOT NULL
          AND p.data_morte IS NULL
          AND p.nazione_id IS NOT NULL
          AND (g.gare_totali >= %(soglia_gare)s OR g.ultimo_anno >= %(soglia_anno)s)
        ORDER BY p.id
        """,
        {"soglia_gare": SOGLIA_GARE_CARRIERA, "soglia_anno": SOGLIA_ANNO_RECENTE},
    )
    pool = [riga["id"] for riga in cur.fetchall()]
    if not pool:
        return None
    seed = int(hashlib.sha256(giorno.isoformat().encode()).hexdigest(), 16)
    return pool[seed % len(pool)]


def mappa_titoli_mondiali(cur) -> dict[int, int]:
    """{pilota_id: numero di Mondiali Piloti vinti}, per TUTTI i piloti in
    una sola query (chiamata una volta per richiesta, non una volta per
    pilota confrontato). Stagione = 1 titolo solo se il primo in
    classifica (somma punti nelle gare) non è in parità col secondo:
    stessa regola "meglio vuoto che inventato" già usata da
    chronoquiz._domanda_tipo_mondiale per lo stesso motivo (senza un
    criterio di spareggio codificato nel DB, una parità in testa non ha
    un vincitore certo — quella stagione non conta per nessuno)."""
    cur.execute(
        """
        WITH classifica_stagione AS (
            SELECT s.anno, r.pilota_id, SUM(r.punti) AS punti_totali
            FROM risultati_gara r
            JOIN gran_premi gp ON gp.id = r.gran_premio_id
            JOIN stagioni s ON s.id = gp.stagione_id
            WHERE r.tipo_sessione = 'gara'
            GROUP BY s.anno, r.pilota_id
        ),
        con_rango AS (
            SELECT anno, pilota_id, punti_totali,
                   RANK() OVER (PARTITION BY anno ORDER BY punti_totali DESC) AS rango
            FROM classifica_stagione
        ),
        primi_per_anno AS (
            SELECT anno, COUNT(*) AS numero_primi
            FROM con_rango
            WHERE rango = 1
            GROUP BY anno
        )
        SELECT cr.pilota_id, COUNT(*) AS titoli
        FROM con_rango cr
        JOIN primi_per_anno pp ON pp.anno = cr.anno
        WHERE cr.rango = 1 AND pp.numero_primi = 1
        GROUP BY cr.pilota_id
        """
    )
    return {riga["pilota_id"]: riga["titoli"] for riga in cur.fetchall()}


def id_da_slug(cur, slug: str) -> Optional[int]:
    """Risolve lo slug pubblico (/piloti/{slug}, lo stesso restituito da
    GET /piloti per l'autocompletamento) nell'id interno usato dal resto
    di questo modulo. None se non esiste."""
    cur.execute("SELECT id FROM piloti WHERE codice_riferimento = %(slug)s", {"slug": slug})
    riga = cur.fetchone()
    return riga["id"] if riga else None


def dati_confronto_pilota(cur, pilota_id: int, titoli: dict[int, int]) -> Optional[dict]:
    """Tutti gli attributi di un pilota necessari per il confronto
    Driverle, in un'unica struttura. None se il pilota non esiste."""
    cur.execute(
        """
        SELECT
            p.id, p.codice_riferimento AS slug, p.sigla,
            p.nome || ' ' || p.cognome AS nome,
            p.data_nascita, p.data_morte, p.biografia, p.fonti_sufficienti, p.url_wikipedia,
            n.codice_iso2 AS nazione_codice, p.nazione_id,
            (SELECT MIN(s2.anno) FROM risultati_gara r2
                JOIN gran_premi gp2 ON gp2.id = r2.gran_premio_id
                JOIN stagioni s2 ON s2.id = gp2.stagione_id
                WHERE r2.pilota_id = p.id AND r2.tipo_sessione = 'gara') AS anno_debutto,
            (SELECT r3.numero_vettura FROM risultati_gara r3
                JOIN gran_premi gp3 ON gp3.id = r3.gran_premio_id
                JOIN stagioni s3 ON s3.id = gp3.stagione_id
                WHERE r3.pilota_id = p.id AND r3.tipo_sessione = 'gara' AND r3.numero_vettura IS NOT NULL
                ORDER BY s3.anno DESC, gp3.id DESC LIMIT 1) AS numero_vettura,
            (SELECT MAX(s4.anno) FROM risultati_gara r4
                JOIN gran_premi gp4 ON gp4.id = r4.gran_premio_id
                JOIN stagioni s4 ON s4.id = gp4.stagione_id
                WHERE r4.pilota_id = p.id AND r4.tipo_sessione = 'gara') AS ultimo_anno_attivo,
            (SELECT c.id FROM risultati_gara r5
                JOIN gran_premi gp5 ON gp5.id = r5.gran_premio_id
                JOIN stagioni s5 ON s5.id = gp5.stagione_id
                JOIN costruttori c ON c.id = r5.costruttore_id
                WHERE r5.pilota_id = p.id AND r5.tipo_sessione = 'gara'
                ORDER BY s5.anno DESC, gp5.id DESC LIMIT 1) AS costruttore_id,
            (SELECT c.nome FROM risultati_gara r6
                JOIN gran_premi gp6 ON gp6.id = r6.gran_premio_id
                JOIN stagioni s6 ON s6.id = gp6.stagione_id
                JOIN costruttori c ON c.id = r6.costruttore_id
                WHERE r6.pilota_id = p.id AND r6.tipo_sessione = 'gara'
                ORDER BY s6.anno DESC, gp6.id DESC LIMIT 1) AS costruttore_nome
        FROM piloti p
        LEFT JOIN nazioni n ON n.id = p.nazione_id
        WHERE p.id = %(id)s
        """,
        {"id": pilota_id},
    )
    riga = cur.fetchone()
    if riga is None:
        return None

    cur.execute(
        "SELECT DISTINCT costruttore_id FROM risultati_gara WHERE pilota_id = %(id)s AND tipo_sessione = 'gara'",
        {"id": pilota_id},
    )
    squadre = {r["costruttore_id"] for r in cur.fetchall()}

    eta = None
    if riga["data_nascita"] is not None and riga["data_morte"] is None:
        # Età ATTUALE, ha senso solo per chi è vivo oggi: per un pilota
        # deceduto darebbe un numero calcolato come se fosse ancora vivo
        # (es. "110" per un pilota degli anni '50), tecnicamente un
        # conto giusto ma un fatto senza senso da mostrare in un
        # confronto — N/D, mai un'invenzione anche se aritmeticamente
        # corretta.
        oggi = oggi_utc()
        nascita = riga["data_nascita"]
        eta = oggi.year - nascita.year - ((oggi.month, oggi.day) < (nascita.month, nascita.day))

    return {
        "id": riga["id"],
        "slug": riga["slug"],
        "codice": riga["sigla"] or riga["nome"][:3].upper(),
        "nome": riga["nome"],
        "nazione_id": riga["nazione_id"],
        "nazione_codice": riga["nazione_codice"],
        "biografia": riga["biografia"],
        "fonti_sufficienti": riga["fonti_sufficienti"],
        "url_wikipedia": riga["url_wikipedia"],
        "eta": eta,
        "anno_debutto": riga["anno_debutto"],
        "numero_vettura": riga["numero_vettura"],
        # il confronto sul numero di gara ha senso solo per carriere (in
        # parte) nell'era del numero personale fisso (dal 2014) — vedi
        # PRIMO_ANNO_NUMERO_PERSONALE.
        "numero_vettura_confrontabile": (
            riga["numero_vettura"] is not None
            and riga["ultimo_anno_attivo"] is not None
            and riga["ultimo_anno_attivo"] >= PRIMO_ANNO_NUMERO_PERSONALE
        ),
        "costruttore_id": riga["costruttore_id"],
        "costruttore_nome": riga["costruttore_nome"],
        "squadre": squadre,
        "titoli_mondiali": titoli.get(riga["id"], 0),
    }


def _feedback_numerico(valore_tentato, valore_misterioso) -> dict:
    if valore_tentato is None:
        return {"match": False, "direzione": None, "valore": None}
    if valore_tentato == valore_misterioso:
        return {"match": True, "direzione": None, "valore": valore_tentato}
    return {
        "match": False,
        "direzione": "su" if valore_misterioso > valore_tentato else "giu",
        "valore": valore_tentato,
    }


def confronta_piloti(tentato: dict, misterioso: dict) -> dict:
    """Pura (nessun accesso al DB): il feedback sui 6 attributi per un
    tentativo. `tentato` e `misterioso` sono nella forma di
    dati_confronto_pilota()."""
    if tentato["nazione_id"] is not None and tentato["nazione_id"] == misterioso["nazione_id"]:
        nazione = {"match": True, "codice_iso2": tentato["nazione_codice"]}
    else:
        nazione = {"match": False, "codice_iso2": tentato["nazione_codice"]}

    if tentato["costruttore_id"] is not None and tentato["costruttore_id"] == misterioso["costruttore_id"]:
        scuderia = {"stato": "match", "nome": tentato["costruttore_nome"]}
    elif tentato["squadre"] & misterioso["squadre"]:
        scuderia = {"stato": "passato", "nome": tentato["costruttore_nome"]}
    else:
        scuderia = {"stato": "diverso", "nome": tentato["costruttore_nome"]}

    eta = _feedback_numerico(tentato["eta"], misterioso["eta"])
    debutto = _feedback_numerico(tentato["anno_debutto"], misterioso["anno_debutto"])
    titoli = _feedback_numerico(tentato["titoli_mondiali"], misterioso["titoli_mondiali"])

    if tentato["numero_vettura_confrontabile"] and misterioso["numero_vettura_confrontabile"]:
        numero_gara = _feedback_numerico(tentato["numero_vettura"], misterioso["numero_vettura"])
    else:
        # Uno dei due (o entrambi) è di un'epoca senza numero personale
        # fisso: il confronto non avrebbe un significato stabile — "N/D",
        # non una freccia calcolata su un dato che cambiava gara per gara.
        numero_gara = {"match": False, "direzione": None, "valore": tentato["numero_vettura"]}

    return {
        "nazione": nazione,
        "scuderia": scuderia,
        "eta": eta,
        "numero_gara": numero_gara,
        "debutto": debutto,
        "titoli_mondiali": titoli,
        "indovinato": tentato["id"] == misterioso["id"],
    }


def punti_per_tentativo(numero_tentativo: int) -> int:
    """numero_tentativo è 1-based (1 = indovinato al primo colpo)."""
    if 1 <= numero_tentativo <= NUMERO_TENTATIVI_MASSIMO:
        return PUNTI_PER_TENTATIVO[numero_tentativo - 1]
    return 0
