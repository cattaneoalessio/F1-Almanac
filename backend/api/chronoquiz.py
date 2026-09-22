"""
chronoquiz.py — generazione dinamica delle domande del gioco Arcade
ChronoQuiz. Isolato da main.py (come suggerito nella richiesta) perché
la logica — 3 tipi di domanda, ciascuno con i propri distrattori reali
pescati dal DB — è più corposa di un tipico endpoint di sola lettura, e
perché i futuri giochi Arcade (Driverle, ApexGrid, ecc.) avranno
probabilmente un modulo analogo.

Policy "meglio vuoto che inventato" (la stessa già usata per bio piloti
e curve circuiti) applicata così: ogni `_domanda_tipo_*` restituisce
None se il campione scelto a caso (anno, gran premio, circuito) non ha
abbastanza dati reali per costruire 4 opzioni distinte e univocamente
corrette — MAI un distrattore o un testo inventato. Il chiamante
(`genera_quiz`) ritenta con un altro campione casuale finché non
raggiunge il numero di domande richiesto o esaurisce i tentativi; in
quel caso restituisce comunque le domande valide raccolte fino a quel
momento, anche se sono MENO del numero richiesto (mai completate con
domande fittizie). Il frontend è scritto per adattarsi alla lunghezza
reale dell'array ricevuto, non per aspettarsi sempre 10 elementi.
"""
import random
import uuid

TIPI_DOMANDA = ("mondiale", "gara", "curva")

# Tentativi massimi complessivi (non per tipo) prima di arrendersi e
# restituire quello che si è riuscito a raccogliere. Abbondante rispetto
# a quanto serve nella pratica per Tipo A/B (il DB ha decine di stagioni
# e centinaia di gare, quasi sempre validi al primo colpo): la rete di
# sicurezza serve soprattutto per Tipo C finché le curve non sono
# popolate per molti circuiti (vedi claude/prompt-curve-rettilinei-circuiti.md,
# lavoro ancora in corso al momento in cui scrivo).
TENTATIVI_PER_DOMANDA = 12


def _mescola_opzioni(corretta, distrattori):
    """Ritorna (options, correct_option_index) con l'ordine mescolato."""
    opzioni = [corretta, *distrattori]
    indici = list(range(len(opzioni)))
    random.shuffle(indici)
    opzioni_mescolate = [opzioni[i] for i in indici]
    indice_corretto = indici.index(0)
    return opzioni_mescolate, indice_corretto


def _domanda_tipo_mondiale(cur):
    """Tipo A: "Chi ha vinto il Mondiale Piloti nel [anno]?" — distrattori:
    altri 3 piloti che hanno corso in quell'anno (stesso criterio "a
    somma" già usato da /classifica/piloti per calcolare il vincitore,
    coerente col resto del sito)."""
    cur.execute(
        """
        SELECT s.anno
        FROM stagioni s
        JOIN gran_premi gp ON gp.stagione_id = s.id
        JOIN risultati_gara r ON r.gran_premio_id = gp.id AND r.tipo_sessione = 'gara'
        GROUP BY s.anno
        HAVING COUNT(DISTINCT r.pilota_id) >= 4
        ORDER BY random()
        LIMIT 1
        """
    )
    riga_anno = cur.fetchone()
    if riga_anno is None:
        return None
    anno = riga_anno["anno"]

    cur.execute(
        """
        SELECT p.nome || ' ' || p.cognome AS pilota, SUM(r.punti) AS punti_totali
        FROM risultati_gara r
        JOIN gran_premi gp ON gp.id = r.gran_premio_id
        JOIN stagioni s ON s.id = gp.stagione_id
        JOIN piloti p ON p.id = r.pilota_id
        WHERE s.anno = %(anno)s AND r.tipo_sessione = 'gara'
        GROUP BY p.id, p.nome, p.cognome
        ORDER BY punti_totali DESC
        LIMIT 4
        """,
        {"anno": anno},
    )
    classifica = cur.fetchall()
    if len(classifica) < 4:
        return None
    # Pari merito al primo posto: senza un criterio di spareggio codificato
    # nel DB, "chi ha vinto" non avrebbe una risposta univoca — si scarta
    # invece di sceglierne uno a caso spacciandolo per il vincitore certo.
    if classifica[0]["punti_totali"] == classifica[1]["punti_totali"]:
        return None

    vincitore = classifica[0]["pilota"]
    distrattori = [riga["pilota"] for riga in classifica[1:4]]
    opzioni, indice_corretto = _mescola_opzioni(vincitore, distrattori)

    return {
        "text": f"Chi ha vinto il Mondiale Piloti nel {anno}?",
        "options": opzioni,
        "correct_option_index": indice_corretto,
    }


def _domanda_tipo_gara(cur):
    """Tipo B: "Chi ha vinto il [nome GP] del [anno]?" — distrattori: i
    piloti arrivati 2°, 3° e 4° in quella gara specifica."""
    cur.execute(
        """
        SELECT gp.id, gp.nome_gp, s.anno
        FROM gran_premi gp
        JOIN stagioni s ON s.id = gp.stagione_id
        JOIN risultati_gara r
            ON r.gran_premio_id = gp.id
            AND r.tipo_sessione = 'gara'
            AND r.posizione_finale BETWEEN 1 AND 4
        GROUP BY gp.id, gp.nome_gp, s.anno
        HAVING COUNT(DISTINCT r.posizione_finale) = 4
        ORDER BY random()
        LIMIT 1
        """
    )
    gara = cur.fetchone()
    if gara is None:
        return None

    cur.execute(
        """
        SELECT r.posizione_finale AS posizione, p.nome || ' ' || p.cognome AS pilota
        FROM risultati_gara r
        JOIN piloti p ON p.id = r.pilota_id
        WHERE r.gran_premio_id = %(gp_id)s AND r.tipo_sessione = 'gara'
            AND r.posizione_finale BETWEEN 1 AND 4
        ORDER BY r.posizione_finale ASC
        """,
        {"gp_id": gara["id"]},
    )
    primi_quattro = cur.fetchall()
    if len(primi_quattro) < 4:
        return None

    vincitore = primi_quattro[0]["pilota"]
    distrattori = [riga["pilota"] for riga in primi_quattro[1:4]]
    opzioni, indice_corretto = _mescola_opzioni(vincitore, distrattori)

    return {
        "text": f"Chi ha vinto il {gara['nome_gp']} del {gara['anno']}?",
        "options": opzioni,
        "correct_option_index": indice_corretto,
    }


def _domanda_tipo_curva(cur):
    """Tipo C: "In quale circuito si trova la famosa curva '[nome]'?" —
    distrattori: nomi di altri circuiti a caso nel DB (non altre curve:
    la domanda testa il circuito, non l'elenco delle curve)."""
    cur.execute(
        """
        SELECT cc.nome_moderno, ci.nome AS circuito, ci.id AS circuito_id
        FROM circuiti_curve cc
        JOIN circuiti ci ON ci.id = cc.circuito_id
        WHERE cc.nome_moderno IS NOT NULL
        ORDER BY random()
        LIMIT 1
        """
    )
    curva = cur.fetchone()
    if curva is None:
        return None

    cur.execute(
        """
        SELECT nome FROM circuiti
        WHERE id != %(circuito_id)s
        ORDER BY random()
        LIMIT 3
        """,
        {"circuito_id": curva["circuito_id"]},
    )
    distrattori = [riga["nome"] for riga in cur.fetchall()]
    if len(distrattori) < 3:
        return None

    opzioni, indice_corretto = _mescola_opzioni(curva["circuito"], distrattori)

    return {
        "text": f"In quale circuito si trova la famosa curva '{curva['nome_moderno']}'?",
        "options": opzioni,
        "correct_option_index": indice_corretto,
    }


_GENERATORI = {
    "mondiale": _domanda_tipo_mondiale,
    "gara": _domanda_tipo_gara,
    "curva": _domanda_tipo_curva,
}


def genera_quiz(conn, n_domande=10):
    """Genera fino a n_domande domande, alternando i 3 tipi a caso.

    Ritorna una lista di dict, ciascuno già completo di `id` (uuid)
    oltre ai campi di DomandaChronoQuiz. Evita testi di domanda
    duplicati nella stessa partita. Se i dati reali non bastano, la
    lista può avere MENO di n_domande elementi — vedi nota "meglio
    vuoto che inventato" in cima al file."""
    domande = []
    testi_gia_usati = set()
    tentativi = 0
    tentativi_massimi = n_domande * TENTATIVI_PER_DOMANDA

    with conn.cursor() as cur:
        while len(domande) < n_domande and tentativi < tentativi_massimi:
            tentativi += 1
            tipo = random.choice(TIPI_DOMANDA)
            domanda = _GENERATORI[tipo](cur)
            if domanda is None or domanda["text"] in testi_gia_usati:
                continue
            testi_gia_usati.add(domanda["text"])
            domanda["id"] = str(uuid.uuid4())
            domande.append(domanda)

    return domande
