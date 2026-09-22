"""
auth.py — verifica dei token di Netlify Identity per gli endpoint Arcade
che riconoscono un utente loggato. Il login è SEMPRE facoltativo in
questo progetto (vedi ChronoQuizView.jsx): questo modulo non solleva mai
eccezioni per un token mancante/scaduto/non valido, restituisce
semplicemente "nessun utente" — decide il chiamante cosa fare.

Come funziona la verifica: Netlify Identity (basato su GoTrue) espone,
sullo stesso sito Netlify, un endpoint GET /.netlify/identity/user che,
dato un Bearer token valido nell'header Authorization, restituisce
l'utente; un token scaduto o non valido riceve 401/403. Deleghiamo la
verifica a QUESTO endpoint invece di validare la firma JWT qui in
locale: evita di dover conservare il JWT secret del sito sul backend
(che gira su Render, non su Netlify), al prezzo di una chiamata HTTP in
più per richiesta autenticata — accettabile per il volume di questo
progetto. Nessuna nuova dipendenza pip: uso urllib della standard
library invece di requests, così non serve toccare il Build Command su
Render per questo modulo.

Richiede la variabile d'ambiente NETLIFY_IDENTITY_URL, es.
https://f1-almanac.netlify.app/.netlify/identity — SENZA lo /user
finale, lo aggiunge questo modulo. Da impostare anche su Render (vedi
.env.example). Se non impostata, utente_da_token si comporta come se
nessun token fosse mai valido (login facoltativo: il sito resta
utilizzabile, semplicemente nessun punteggio verrà mai salvato).
"""
import json
import os
import urllib.error
import urllib.request

import psycopg2.errors

NETLIFY_IDENTITY_URL = os.environ.get("NETLIFY_IDENTITY_URL", "").rstrip("/")
TIMEOUT_SECONDI = 5
TENTATIVI_USERNAME_MASSIMI = 20


def _utente_netlify_da_token(token):
    """Chiama /.netlify/identity/user con quel token. Ritorna il dict
    utente Netlify se il token è valido, altrimenti None — qualunque
    problema (rete, timeout, sito non configurato, token scaduto) è
    trattato allo stesso modo: "nessun utente loggato"."""
    if not NETLIFY_IDENTITY_URL or not token:
        return None
    richiesta = urllib.request.Request(
        f"{NETLIFY_IDENTITY_URL}/user",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(richiesta, timeout=TIMEOUT_SECONDI) as risposta:
            return json.loads(risposta.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, OSError):
        return None


def _nome_utente_da_utente_netlify(utente_netlify):
    """Ricava uno username leggibile dai metadati Netlify Identity:
    preferisce user_metadata.full_name (se l'utente l'ha impostato in
    fase di registrazione), altrimenti la parte locale dell'email."""
    metadati = utente_netlify.get("user_metadata") or {}
    nome_completo = (metadati.get("full_name") or "").strip()
    if nome_completo:
        return nome_completo
    email = utente_netlify.get("email") or ""
    return email.split("@")[0] if email else "Pilota"


def utente_da_token(cur, token):
    """Dato il token Bearer (o None/stringa vuota), ritorna (utente_id,
    username) se il login è valido, altrimenti (None, None). Al primo
    accesso di un auth_id mai visto crea la riga in utenti al volo.

    Il cursore passato deve appartenere a una connessione in autocommit
    (vedi l'endpoint che la usa): serve perché il tentativo di INSERT
    può fallire per username duplicato e va ritentato con un suffisso,
    senza che un singolo fallimento blocchi le query successive sulla
    stessa connessione."""
    if not token:
        return None, None

    utente_netlify = _utente_netlify_da_token(token)
    if utente_netlify is None or not utente_netlify.get("id"):
        return None, None

    auth_id = utente_netlify["id"]
    cur.execute("SELECT id, username FROM utenti WHERE auth_id = %(auth_id)s", {"auth_id": auth_id})
    riga = cur.fetchone()
    if riga is not None:
        return riga["id"], riga["username"]

    username_base = _nome_utente_da_utente_netlify(utente_netlify)
    username_tentativo = username_base
    for tentativo in range(1, TENTATIVI_USERNAME_MASSIMI + 2):
        try:
            cur.execute(
                """
                INSERT INTO utenti (auth_id, username)
                VALUES (%(auth_id)s, %(username)s)
                RETURNING id, username
                """,
                {"auth_id": auth_id, "username": username_tentativo},
            )
            nuovo = cur.fetchone()
            return nuovo["id"], nuovo["username"]
        except psycopg2.errors.UniqueViolation:
            # Con autocommit questo singolo INSERT fallito non "avvelena"
            # una transazione più ampia: si può interrogare di nuovo subito.
            # Prima ricontrolla se è stato questo stesso auth_id, creato nel
            # frattempo da una richiesta concorrente (es. doppio click):
            # in quel caso va usato quello, non un altro tentativo di username.
            cur.execute("SELECT id, username FROM utenti WHERE auth_id = %(auth_id)s", {"auth_id": auth_id})
            corsa = cur.fetchone()
            if corsa is not None:
                return corsa["id"], corsa["username"]
            username_tentativo = f"{username_base}{tentativo}"

    return None, None
