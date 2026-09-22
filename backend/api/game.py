"""
game.py — logica pura del Time Attack ("Monoposto Virtual Arena"): validazione
anti-cheat dei tentativi inviati da POST /game/submit, e le costanti che
descrivono la struttura di una sessione (giri, checkpoint per giro,
punteggio del campionato). Nessun accesso al DB qui dentro — quello vive
negli endpoint in main.py, stesso principio già seguito da chronoquiz.py.

La geometria del tracciato NON vive qui: è generata interamente lato
frontend (frontend/src/game/pista.js), un circuito generico e non una
sagoma reale — vedi la nota lì. Qui sappiamo solo "quanti checkpoint deve
avere un giro valido", non dove sono nello spazio: la validazione è sulla
STRUTTURA della telemetria (sequenza, tempi crescenti, tempo plausibile),
non sulla traiettoria geometrica, che il backend non può verificare senza
duplicare la fisica del gioco lato server (fuori scope qui).
"""

CHECKPOINT_PER_GIRO = 4  # 3 intermedi (indice 0,1,2) + 1 traguardo (indice 3)
GIRI_PER_SESSIONE = {"qualifica": 1, "gara": 3}

# Soglia fisica minima per un singolo giro sulla pista generica. Valore di
# partenza ragionevole (la pista base è breve), non calibrato su un vero
# circuito — non esiste ancora un modo per farlo dato che non c'è una
# geometria reale salvata (vedi discussione con l'utente su questo). Da
# rivedere quando/se la pista o i suoi modificatori cambieranno molto.
TEMPO_MINIMO_GIRO_SECONDI = 10.0

# Tolleranza tra tempo_totale dichiarato e l'ultimo timestamp di telemetria
# (in secondi): oltre questa soglia il tempo dichiarato non corrisponde
# alla telemetria inviata, sospetto di manomissione lato client.
TOLLERANZA_COERENZA_TEMPO_SECONDI = 1.0

PUNTI_PER_POSIZIONE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]  # posizioni 1-10, sistema F1 2019-oggi

# Soglie per la chiusura AUTOMATICA di un GP (vedi
# POST /game/close-gp-automatico e .github/workflows/chiudi-gp-automatico.yml):
# condizione OR, non AND — basta soddisfarne una delle due.
SOGLIA_PARTECIPANTI_CHIUSURA_AUTOMATICA = 25
SOGLIA_GIORNI_CHIUSURA_AUTOMATICA = 10


def gp_pronto_per_chiusura(numero_partecipanti, giorni_dal_primo_tempo):
    """True se un GP è pronto per la chiusura automatica: almeno
    SOGLIA_PARTECIPANTI_CHIUSURA_AUTOMATICA piloti diversi hanno
    registrato un tempo di Gara sul circuito, OPPURE sono passati
    almeno SOGLIA_GIORNI_CHIUSURA_AUTOMATICA giorni dal PRIMO tempo di
    Gara registrato lì. Pura: il chiamante calcola i due numeri dal DB,
    questa funzione decide soltanto."""
    return (
        numero_partecipanti >= SOGLIA_PARTECIPANTI_CHIUSURA_AUTOMATICA
        or giorni_dal_primo_tempo >= SOGLIA_GIORNI_CHIUSURA_AUTOMATICA
    )


def valida_tentativo(tipo_sessione, tempo_totale, checkpoint):
    """Verifica un tentativo prima di salvarlo. Ritorna (valido: bool,
    motivo: str|None) — non solleva mai eccezioni per input malformato,
    un motivo chiaro nella risposta è più utile di un 500 generico.

    Controlli, in ordine:
    1. tempo_totale non sotto la soglia fisica minima per quel numero di giri
    2. numero di checkpoint coerente col numero di giri atteso
    3. sequenza giro/indice esattamente quella attesa, in ordine
    4. timestamp (t) strettamente crescenti checkpoint dopo checkpoint
    5. tempo_totale coerente (con tolleranza) con l'ultimo timestamp —
       altrimenti una telemetria valida potrebbe accompagnare un tempo
       dichiarato più basso di quello realmente registrato
    """
    giri_attesi = GIRI_PER_SESSIONE.get(tipo_sessione)
    if giri_attesi is None:
        return False, "tipo_sessione non valido"

    tempo_minimo = TEMPO_MINIMO_GIRO_SECONDI * giri_attesi
    if tempo_totale < tempo_minimo:
        return False, f"tempo_totale sotto la soglia fisica minima ({tempo_minimo:.1f}s per {giri_attesi} giro/i)"

    numero_atteso = giri_attesi * CHECKPOINT_PER_GIRO
    if len(checkpoint) != numero_atteso:
        return False, f"numero di checkpoint inatteso: ricevuti {len(checkpoint)}, attesi {numero_atteso}"

    for i, cp in enumerate(checkpoint):
        giro_atteso = i // CHECKPOINT_PER_GIRO + 1
        indice_atteso = i % CHECKPOINT_PER_GIRO
        if cp.giro != giro_atteso or cp.indice != indice_atteso:
            return False, f"sequenza checkpoint non valida alla posizione {i} (atteso giro {giro_atteso} indice {indice_atteso})"
        if i > 0 and cp.t <= checkpoint[i - 1].t:
            return False, "i timestamp dei checkpoint non sono strettamente crescenti"

    ultimo_timestamp_secondi = checkpoint[-1].t / 1000
    if abs(ultimo_timestamp_secondi - tempo_totale) > TOLLERANZA_COERENZA_TEMPO_SECONDI:
        return False, "tempo_totale non coerente con l'ultimo timestamp della telemetria inviata"

    return True, None
