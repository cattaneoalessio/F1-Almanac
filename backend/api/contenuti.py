"""
contenuti.py — articoli del sito: "In Primo Piano" (home) e News.

UN SOLO tipo di contenuto, con un campo `tipo`:
  - 'primo_piano': il box della home mostra il più recente PUBBLICATO.
    Quando ne pubblichi uno nuovo, il precedente finisce da solo tra le
    News (non serve spostarlo a mano: le News elencano tutto il pubblicato
    tranne il Primo Piano in vetrina).
  - 'news': compare solo tra le News.
Un contenuto è visibile al pubblico solo se stato='pubblicato' E la sua
data_pubblicazione è già passata (una data futura = uscita programmata).

PANNELLO DI GESTIONE (/admin/contenuti nel frontend) — doppia verifica:
  1. login Netlify Identity con l'email in ADMIN_EMAIL;
  2. codice a 6 cifre dell'app di autenticazione (Microsoft/Google
     Authenticator, standard TOTP) generato dal segreto ADMIN_TOTP_SECRET.
  Superati entrambi, il backend rilascia una "sessione admin" firmata,
  valida ADMIN_SESSIONE_ORE ore, da mandare nell'header X-Admin-Sessione.
  Netlify Identity non offre la verifica in due passaggi: per questo il
  secondo fattore è implementato qui, con la sola libreria standard.

IMMAGINI: compresse nel browser (WebP, o JPEG dove WebP non è disponibile), poi salvate da questo modulo nel
repository GitHub (frontend/public/contenuti/AAAA/MM/...) tramite l'API
GitHub. Netlify ripubblica il sito e l'immagine è online dopo 1-2 minuti.
Il messaggio di commit contiene "[skip render]" per non far ripartire
anche il backend a ogni immagine.

Variabili d'ambiente su Render:
  ADMIN_EMAIL              email dell'unico account abilitato
  ADMIN_TOTP_SECRET        segreto TOTP (base32), generato dalla pagina
                           /admin/contenuti al primo avvio
  GITHUB_TOKEN_CONTENUTI   token GitHub con permesso "Contents: Read and
                           write" sul solo repository del sito
  GITHUB_REPO              facoltativa, default cattaneoalessio/F1-Almanac
  GITHUB_BRANCH            facoltativa, default main
Fail closed: senza ADMIN_EMAIL o ADMIN_TOTP_SECRET il pannello rifiuta
tutto; senza GITHUB_TOKEN_CONTENUTI il caricamento immagini rifiuta.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import struct
import threading
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from auth import _utente_netlify_da_token
from db import get_connection

router = APIRouter()

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip().lower()
ADMIN_TOTP_SECRET = os.environ.get("ADMIN_TOTP_SECRET", "").strip().replace(" ", "").upper()
ADMIN_SESSIONE_ORE = int(os.environ.get("ADMIN_SESSIONE_ORE", "8"))
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN_CONTENUTI", "").strip()
GITHUB_REPO = os.environ.get("GITHUB_REPO", "cattaneoalessio/F1-Almanac").strip()
GITHUB_BRANCH = os.environ.get("GITHUB_BRANCH", "main").strip()

CARTELLA_IMMAGINI = "frontend/public/contenuti"
DIMENSIONE_MASSIMA_IMMAGINE = 3 * 1024 * 1024  # 3 MB dopo la compressione
SLUG_RISERVATI = {"nuovo", "admin"}

# ---------------------------------------------------------------------------
# Tabella (creata al primo uso: nessuno script da lanciare su Neon)
# ---------------------------------------------------------------------------
_SQL_TABELLA = """
CREATE TABLE IF NOT EXISTS contenuti (
    id                  SERIAL PRIMARY KEY,
    tipo                VARCHAR(20)  NOT NULL CHECK (tipo IN ('primo_piano', 'news')),
    slug                VARCHAR(160) NOT NULL UNIQUE,
    titolo              VARCHAR(250) NOT NULL,
    sottotitolo         TEXT,
    immagine            JSONB,
    galleria            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    corpo_html          TEXT         NOT NULL DEFAULT '',
    stato               VARCHAR(20)  NOT NULL DEFAULT 'bozza' CHECK (stato IN ('bozza', 'pubblicato')),
    data_pubblicazione  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creato_il           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    aggiornato_il       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contenuti_pubblicati_idx ON contenuti (stato, data_pubblicazione DESC);
"""
_tabella_pronta = False
_lock_tabella = threading.Lock()


def _connessione():
    global _tabella_pronta
    conn = get_connection()
    conn.autocommit = True
    if not _tabella_pronta:
        with _lock_tabella:
            if not _tabella_pronta:
                with conn.cursor() as cur:
                    cur.execute(_SQL_TABELLA)
                _tabella_pronta = True
    return conn


# ---------------------------------------------------------------------------
# Modelli
# ---------------------------------------------------------------------------
class Immagine(BaseModel):
    src: str = Field(max_length=500)
    alt: str = Field(default="", max_length=300)
    credito: str = Field(default="", max_length=300)


class DatiContenuto(BaseModel):
    tipo: Literal["primo_piano", "news"]
    titolo: str = Field(min_length=1, max_length=250)
    sottotitolo: Optional[str] = Field(default=None, max_length=600)
    slug: Optional[str] = Field(default=None, max_length=160)
    immagine: Optional[Immagine] = None
    galleria: list[Immagine] = Field(default_factory=list, max_length=40)
    corpo_html: str = Field(default="", max_length=400_000)
    stato: Literal["bozza", "pubblicato"] = "bozza"
    data_pubblicazione: Optional[datetime] = None


class RichiestaAccesso(BaseModel):
    codice: str = Field(min_length=6, max_length=8)


class RichiestaImmagine(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    dati_base64: str = Field(min_length=10)


# ---------------------------------------------------------------------------
# Utilità
# ---------------------------------------------------------------------------
def slugify(testo: str) -> str:
    testo = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    testo = re.sub(r"[^a-zA-Z0-9]+", "-", testo).strip("-").lower()
    return testo[:120] or "articolo"


def _riga_in_dict(riga, completo=True):
    if riga is None:
        return None
    dati = {
        "id": riga["id"],
        "tipo": riga["tipo"],
        "slug": riga["slug"],
        "titolo": riga["titolo"],
        "sottotitolo": riga["sottotitolo"],
        "immagine": riga["immagine"],
        "data_pubblicazione": riga["data_pubblicazione"].isoformat(),
    }
    if completo:
        dati.update(
            {
                "galleria": riga["galleria"] or [],
                "corpo_html": riga["corpo_html"],
                "stato": riga["stato"],
                "aggiornato_il": riga["aggiornato_il"].isoformat(),
            }
        )
    return dati


_SQL_VISIBILE = "stato = 'pubblicato' AND data_pubblicazione <= now()"


def _id_primo_piano_corrente(cur):
    cur.execute(
        f"SELECT id FROM contenuti WHERE tipo = 'primo_piano' AND {_SQL_VISIBILE} "
        "ORDER BY data_pubblicazione DESC, id DESC LIMIT 1"
    )
    riga = cur.fetchone()
    return riga["id"] if riga else None


# ---------------------------------------------------------------------------
# Endpoint pubblici
# ---------------------------------------------------------------------------
@router.get("/contenuti/primo-piano")
def primo_piano():
    """Il Primo Piano in vetrina in home, o null se non ce n'è."""
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            id_corrente = _id_primo_piano_corrente(cur)
            if id_corrente is None:
                return None
            cur.execute("SELECT * FROM contenuti WHERE id = %s", (id_corrente,))
            return _riga_in_dict(cur.fetchone(), completo=False)
    finally:
        conn.close()


@router.get("/contenuti/news")
def elenco_news(limite: int = Query(10, ge=1, le=50), pagina: int = Query(1, ge=1)):
    """News pubblicate, dalla più recente: comprende i Primo Piano passati,
    esclude quello attualmente in vetrina in home."""
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            id_corrente = _id_primo_piano_corrente(cur)
            escludi = "AND id <> %(escludi)s" if id_corrente else ""
            parametri = {"escludi": id_corrente, "limite": limite, "offset": (pagina - 1) * limite}
            cur.execute(f"SELECT count(*) AS n FROM contenuti WHERE {_SQL_VISIBILE} {escludi}", parametri)
            totale = cur.fetchone()["n"]
            cur.execute(
                f"SELECT * FROM contenuti WHERE {_SQL_VISIBILE} {escludi} "
                "ORDER BY data_pubblicazione DESC, id DESC LIMIT %(limite)s OFFSET %(offset)s",
                parametri,
            )
            voci = [_riga_in_dict(r, completo=False) for r in cur.fetchall()]
        return {"totale": totale, "pagina": pagina, "limite": limite, "voci": voci}
    finally:
        conn.close()


@router.get("/contenuti")
def elenco_slug():
    """Tutti i contenuti pubblicati (solo slug e data): usato dalla sitemap."""
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT slug, data_pubblicazione FROM contenuti WHERE {_SQL_VISIBILE} ORDER BY data_pubblicazione DESC")
            return [{"slug": r["slug"], "data_pubblicazione": r["data_pubblicazione"].isoformat()} for r in cur.fetchall()]
    finally:
        conn.close()


@router.get("/contenuti/articolo/{slug}")
def articolo(slug: str):
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM contenuti WHERE slug = %s AND {_SQL_VISIBILE}", (slug,))
            riga = cur.fetchone()
        if riga is None:
            raise HTTPException(status_code=404, detail="Articolo non trovato.")
        return _riga_in_dict(riga)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Doppia verifica: TOTP (RFC 6238, SHA-1, 30 s, 6 cifre) + sessione firmata
# ---------------------------------------------------------------------------
def _codice_totp(segreto_b32: str, contatore: int) -> str:
    chiave = base64.b32decode(segreto_b32 + "=" * (-len(segreto_b32) % 8))
    digest = hmac.new(chiave, struct.pack(">Q", contatore), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    numero = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return f"{numero % 1_000_000:06d}"


def _totp_valido(codice: str) -> bool:
    codice = re.sub(r"\D", "", codice or "")
    if len(codice) != 6 or not ADMIN_TOTP_SECRET:
        return False
    adesso = int(time.time()) // 30
    # ±1 intervallo: tollera un orologio del telefono sfasato di 30 secondi.
    return any(hmac.compare_digest(_codice_totp(ADMIN_TOTP_SECRET, adesso + d), codice) for d in (-1, 0, 1))


def _chiave_sessione() -> bytes:
    # Derivata dal segreto TOTP: cambiando il segreto, tutte le sessioni
    # esistenti decadono subito. Nessuna variabile in più da impostare.
    return hashlib.sha256(b"monoposto-sessione-admin:" + ADMIN_TOTP_SECRET.encode()).digest()


def _crea_sessione(email: str) -> tuple[str, int]:
    scadenza = int(time.time()) + ADMIN_SESSIONE_ORE * 3600
    corpo = base64.urlsafe_b64encode(json.dumps({"e": email, "x": scadenza}).encode()).decode().rstrip("=")
    firma = hmac.new(_chiave_sessione(), corpo.encode(), hashlib.sha256).hexdigest()
    return f"{corpo}.{firma}", scadenza


def _sessione_valida(token: str) -> bool:
    if not token or "." not in token or not ADMIN_TOTP_SECRET or not ADMIN_EMAIL:
        return False
    corpo, firma = token.rsplit(".", 1)
    attesa = hmac.new(_chiave_sessione(), corpo.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(attesa, firma):
        return False
    try:
        dati = json.loads(base64.urlsafe_b64decode(corpo + "=" * (-len(corpo) % 4)))
    except (ValueError, json.JSONDecodeError):
        return False
    return dati.get("e") == ADMIN_EMAIL and int(dati.get("x", 0)) > time.time()


def _richiedi_admin(sessione: str):
    if not _sessione_valida(sessione):
        raise HTTPException(status_code=401, detail="Sessione scaduta o non valida: accedi di nuovo.")


def _email_da_bearer(authorization: str) -> Optional[str]:
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    utente = _utente_netlify_da_token(token)
    if not utente or not utente.get("email"):
        return None
    if not utente.get("confirmed_at"):
        return None
    return utente["email"].strip().lower()


# Limite tentativi: max 5 codici sbagliati ogni 15 minuti (per processo).
_tentativi_falliti: list[float] = []
_lock_tentativi = threading.Lock()


@router.get("/admin/stato")
def stato_admin(authorization: str = Header(default="")):
    """Cosa è configurato e se l'utente loggato è l'amministratore.
    Non rivela l'email abilitata né alcun segreto."""
    email = _email_da_bearer(authorization) if authorization else None
    return {
        "configurato": bool(ADMIN_EMAIL and ADMIN_TOTP_SECRET),
        "email_impostata": bool(ADMIN_EMAIL),
        "totp_impostato": bool(ADMIN_TOTP_SECRET),
        "immagini_attive": bool(GITHUB_TOKEN),
        "e_admin": bool(email and ADMIN_EMAIL and email == ADMIN_EMAIL),
    }


@router.post("/admin/accesso")
def accesso_admin(richiesta: RichiestaAccesso, authorization: str = Header(default="")):
    if not (ADMIN_EMAIL and ADMIN_TOTP_SECRET):
        raise HTTPException(status_code=503, detail="Pannello non ancora configurato su Render.")
    email = _email_da_bearer(authorization)
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Questo account non è abilitato al pannello.")
    with _lock_tentativi:
        adesso = time.time()
        _tentativi_falliti[:] = [t for t in _tentativi_falliti if adesso - t < 900]
        if len(_tentativi_falliti) >= 5:
            raise HTTPException(status_code=429, detail="Troppi codici sbagliati: riprova tra 15 minuti.")
        if not _totp_valido(richiesta.codice):
            _tentativi_falliti.append(adesso)
            raise HTTPException(status_code=401, detail="Codice non valido o scaduto.")
    sessione, scadenza = _crea_sessione(email)
    return {"sessione": sessione, "scadenza": scadenza}


# ---------------------------------------------------------------------------
# Endpoint del pannello
# ---------------------------------------------------------------------------
def _slug_libero(cur, base: str, escludi_id: Optional[int] = None) -> str:
    base = slugify(base)
    if base in SLUG_RISERVATI:
        base = f"{base}-articolo"
    candidato, n = base, 2
    while True:
        cur.execute("SELECT id FROM contenuti WHERE slug = %s", (candidato,))
        riga = cur.fetchone()
        if riga is None or riga["id"] == escludi_id:
            return candidato
        candidato, n = f"{base}-{n}", n + 1


def _valori(dati: DatiContenuto, slug: str) -> dict:
    return {
        "tipo": dati.tipo,
        "slug": slug,
        "titolo": dati.titolo.strip(),
        "sottotitolo": (dati.sottotitolo or "").strip() or None,
        "immagine": json.dumps(dati.immagine.model_dump()) if dati.immagine else None,
        "galleria": json.dumps([i.model_dump() for i in dati.galleria]),
        "corpo_html": dati.corpo_html,
        "stato": dati.stato,
        "data_pubblicazione": dati.data_pubblicazione or datetime.now(timezone.utc),
    }


@router.get("/admin/contenuti")
def admin_elenco(x_admin_sessione: str = Header(default="")):
    _richiedi_admin(x_admin_sessione)
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            id_corrente = _id_primo_piano_corrente(cur)
            cur.execute("SELECT * FROM contenuti ORDER BY data_pubblicazione DESC, id DESC")
            voci = []
            for riga in cur.fetchall():
                voce = _riga_in_dict(riga, completo=False)
                voce["stato"] = riga["stato"]
                voce["in_vetrina"] = riga["id"] == id_corrente
                voci.append(voce)
            return voci
    finally:
        conn.close()


@router.get("/admin/contenuti/{id_contenuto}")
def admin_dettaglio(id_contenuto: int, x_admin_sessione: str = Header(default="")):
    _richiedi_admin(x_admin_sessione)
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM contenuti WHERE id = %s", (id_contenuto,))
            riga = cur.fetchone()
        if riga is None:
            raise HTTPException(status_code=404, detail="Contenuto non trovato.")
        return _riga_in_dict(riga)
    finally:
        conn.close()


@router.post("/admin/contenuti")
def admin_crea(dati: DatiContenuto, x_admin_sessione: str = Header(default="")):
    _richiedi_admin(x_admin_sessione)
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            slug = _slug_libero(cur, dati.slug or dati.titolo)
            v = _valori(dati, slug)
            cur.execute(
                """INSERT INTO contenuti (tipo, slug, titolo, sottotitolo, immagine, galleria, corpo_html, stato, data_pubblicazione)
                   VALUES (%(tipo)s, %(slug)s, %(titolo)s, %(sottotitolo)s, %(immagine)s, %(galleria)s,
                           %(corpo_html)s, %(stato)s, %(data_pubblicazione)s)
                   RETURNING *""",
                v,
            )
            return _riga_in_dict(cur.fetchone())
    finally:
        conn.close()


@router.put("/admin/contenuti/{id_contenuto}")
def admin_aggiorna(id_contenuto: int, dati: DatiContenuto, x_admin_sessione: str = Header(default="")):
    _richiedi_admin(x_admin_sessione)
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            slug = _slug_libero(cur, dati.slug or dati.titolo, escludi_id=id_contenuto)
            v = _valori(dati, slug) | {"id": id_contenuto}
            cur.execute(
                """UPDATE contenuti SET tipo=%(tipo)s, slug=%(slug)s, titolo=%(titolo)s, sottotitolo=%(sottotitolo)s,
                       immagine=%(immagine)s, galleria=%(galleria)s, corpo_html=%(corpo_html)s, stato=%(stato)s,
                       data_pubblicazione=%(data_pubblicazione)s, aggiornato_il=now()
                   WHERE id=%(id)s RETURNING *""",
                v,
            )
            riga = cur.fetchone()
        if riga is None:
            raise HTTPException(status_code=404, detail="Contenuto non trovato.")
        return _riga_in_dict(riga)
    finally:
        conn.close()


@router.delete("/admin/contenuti/{id_contenuto}")
def admin_elimina(id_contenuto: int, x_admin_sessione: str = Header(default="")):
    _richiedi_admin(x_admin_sessione)
    conn = _connessione()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM contenuti WHERE id = %s RETURNING id", (id_contenuto,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Contenuto non trovato.")
        return {"eliminato": id_contenuto}
    finally:
        conn.close()


@router.post("/admin/immagini")
def admin_carica_immagine(richiesta: RichiestaImmagine, x_admin_sessione: str = Header(default="")):
    """Salva un'immagine WebP (già compressa dal browser) nel repository."""
    _richiedi_admin(x_admin_sessione)
    if not GITHUB_TOKEN:
        raise HTTPException(status_code=503, detail="Caricamento immagini non configurato (GITHUB_TOKEN_CONTENUTI su Render).")
    try:
        contenuto = base64.b64decode(richiesta.dati_base64, validate=True)
    except ValueError:
        raise HTTPException(status_code=400, detail="Immagine non leggibile.")
    if len(contenuto) > DIMENSIONE_MASSIMA_IMMAGINE:
        raise HTTPException(status_code=413, detail="Immagine troppo grande anche dopo la compressione (max 3 MB).")
    # WebP dove il browser lo sa produrre; JPEG come ripiego (Safari, per
    # esempio, non comprime in WebP). Nient'altro: niente SVG, niente HTML.
    if contenuto[:4] == b"RIFF" and contenuto[8:12] == b"WEBP":
        estensione = "webp"
    elif contenuto[:3] == b"\xff\xd8\xff":
        estensione = "jpg"
    else:
        raise HTTPException(status_code=400, detail="Sono accettate solo immagini WebP o JPEG prodotte dal pannello.")

    adesso = datetime.now(timezone.utc)
    nome = f"{slugify(richiesta.nome.rsplit('.', 1)[0])[:60]}-{secrets.token_hex(3)}.{estensione}"
    percorso_repo = f"{CARTELLA_IMMAGINI}/{adesso:%Y}/{adesso:%m}/{nome}"
    corpo = json.dumps(
        {
            "message": f"contenuti: immagine {nome} [skip render]",
            "content": base64.b64encode(contenuto).decode(),
            "branch": GITHUB_BRANCH,
        }
    ).encode()
    richiesta_gh = urllib.request.Request(
        f"https://api.github.com/repos/{GITHUB_REPO}/contents/{percorso_repo}",
        data=corpo,
        method="PUT",
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "monoposto-io-pannello",
        },
    )
    try:
        with urllib.request.urlopen(richiesta_gh, timeout=30) as risposta:
            risposta.read()
    except urllib.error.HTTPError as errore:
        dettaglio = {401: "token GitHub non valido o scaduto", 403: "token GitHub senza permesso di scrittura",
                     404: "repository non trovato o token senza accesso"}.get(errore.code, f"errore GitHub {errore.code}")
        raise HTTPException(status_code=502, detail=f"Salvataggio non riuscito: {dettaglio}.")
    except (urllib.error.URLError, TimeoutError, OSError):
        raise HTTPException(status_code=502, detail="GitHub non ha risposto: riprova.")

    url_pubblico = "/" + percorso_repo.removeprefix("frontend/public/")
    return {"src": url_pubblico, "byte": len(contenuto)}
