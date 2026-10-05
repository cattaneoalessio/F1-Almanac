"""
multigiocatore.py — gare del Time Attack tra utenti in tempo reale.

Un solo endpoint WebSocket: /game/ws/gara. Tutto lo stato vive in memoria
del processo (un'unica istanza su Render): nessuna tabella nuova.

FLUSSO
1. Il client si collega e manda {"tipo":"entra", "modalita": ..., "token", "livrea", "posto_qualifica"}.
   Modalità (decise col gestore, 5/10/2026):
   - "1v1": appena ci sono 2 piloti in coda, si parte.
   - "multi": si parte quando ci sono almeno 2 piloti e sono passati 20 s
     dall'arrivo del secondo (tempo per far entrare altri), o subito a 20.
   - "multi_completa": si aspetta la griglia piena (20 piloti).
   In ogni modalità l'attesa massima è 3 minuti: poi si parte comunque, e
   i posti vuoti in griglia li riempiono i bot (simulati da ogni client).
2. Ogni secondo, chi aspetta riceve {"tipo":"attesa", "in_attesa", "posti", "secondi_rimasti"}.
3. Alla partenza: {"tipo":"partenza", "stanza", "tuo_id", "griglia":[{id,nome,livrea,posto}], "seme"}.
4. In gara ogni client manda {"tipo":"pos","d","x","v"} ~10 volte al secondo;
   il server rimanda a tutti {"tipo":"stato","auto":[{id,d,x,v}]} ~10 volte al secondo.
   Le auto degli altri UTENTI sono attraversabili: nessun contatto tra utenti
   (il ritardo di rete renderebbe i contatti ingiusti).
5. All'arrivo: {"tipo":"fine","tempo"} -> a tutti {"tipo":"arrivo","id","nome","tempo"}.
   Chi si disconnette: a tutti {"tipo":"uscito","id"}.

Il tempo di gara di ciascuno si salva come sempre con POST /game/submit:
questo modulo non scrive nulla nel database (legge solo il nome utente).
"""
import asyncio
import json
import secrets
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from auth import utente_da_token
from db import get_connection

router = APIRouter()

ATTESA_MASSIMA = 180  # secondi
FINESTRA_MULTI = 20  # secondi dopo l'arrivo del secondo pilota, in modalità "multi"
POSTI_GRIGLIA = 20
MODALITA = {"1v1": 2, "multi": POSTI_GRIGLIA, "multi_completa": POSTI_GRIGLIA}
LIVREE_AMMESSE = {"rosso", "notte", "ciano", "argento"}


class Pilota:
    def __init__(self, ws, nome, livrea, posto_qualifica, modalita):
        self.ws = ws
        self.id = secrets.token_hex(4)
        self.nome = nome
        self.livrea = livrea
        self.posto_qualifica = posto_qualifica
        self.modalita = modalita
        self.entrato = time.monotonic()
        self.stanza = None
        self.stato = None  # ultima posizione inviata: {"d","x","v"}

    async def invia(self, messaggio):
        try:
            await self.ws.send_text(json.dumps(messaggio))
        except Exception:  # connessione già chiusa: se ne accorge il ciclo di ricezione
            pass


class Stanza:
    def __init__(self, piloti):
        self.id = secrets.token_hex(4)
        self.piloti = piloti
        self.seme = secrets.randbelow(2**31)


code = {m: [] for m in MODALITA}
stanze = {}
_ciclo_avviato = False


def assegna_posti(piloti):
    """Posto in griglia: quello della propria qualifica (classifica reale tra
    utenti); senza tempo, in fondo. Due piloti sullo stesso posto: il primo
    arrivato lo tiene, l'altro prende il primo libero più indietro (o, se non
    c'è, il primo libero più avanti). I posti rimasti sono dei bot."""
    liberi = set(range(1, POSTI_GRIGLIA + 1))
    ordinati = sorted(piloti, key=lambda p: (p.posto_qualifica or POSTI_GRIGLIA, p.entrato))
    posti = {}
    for p in ordinati:
        voluto = max(1, min(POSTI_GRIGLIA, p.posto_qualifica or POSTI_GRIGLIA))
        dietro = sorted(x for x in liberi if x >= voluto)
        davanti = sorted((x for x in liberi if x < voluto), reverse=True)
        scelto = dietro[0] if dietro else davanti[0]
        liberi.discard(scelto)
        posti[p.id] = scelto
    return posti


async def avvia_stanza(piloti):
    for p in piloti:
        if p in code[p.modalita]:
            code[p.modalita].remove(p)
    stanza = Stanza(piloti)
    stanze[stanza.id] = stanza
    posti = assegna_posti(piloti)
    griglia = [{"id": p.id, "nome": p.nome, "livrea": p.livrea, "posto": posti[p.id]} for p in piloti]
    for p in piloti:
        p.stanza = stanza
        await p.invia({"tipo": "partenza", "stanza": stanza.id, "tuo_id": p.id, "griglia": griglia, "seme": stanza.seme})


async def ciclo_attese():
    """Ogni secondo: forma le stanze e aggiorna chi aspetta."""
    while True:
        try:
            adesso = time.monotonic()
            for modalita, coda in code.items():
                coda.sort(key=lambda p: p.entrato)
                if modalita == "1v1":
                    while len(coda) >= 2:
                        await avvia_stanza(coda[:2])
                elif modalita == "multi":
                    if len(coda) >= POSTI_GRIGLIA:
                        await avvia_stanza(coda[:POSTI_GRIGLIA])
                    elif len(coda) >= 2 and adesso - coda[1].entrato >= FINESTRA_MULTI:
                        await avvia_stanza(list(coda))
                else:  # multi_completa
                    if len(coda) >= POSTI_GRIGLIA:
                        await avvia_stanza(coda[:POSTI_GRIGLIA])
                # attesa massima superata: si parte con chi c'è (il resto sono bot)
                if coda and adesso - coda[0].entrato >= ATTESA_MASSIMA:
                    await avvia_stanza(list(coda[:POSTI_GRIGLIA]))
                for p in list(coda):
                    await p.invia(
                        {
                            "tipo": "attesa",
                            "in_attesa": len(coda),
                            "posti": MODALITA[modalita],
                            "secondi_rimasti": max(0, int(ATTESA_MASSIMA - (adesso - p.entrato))),
                        }
                    )
        except Exception as errore:  # il ciclo non deve mai morire
            print("multigiocatore: errore nel ciclo attese:", errore)
        await asyncio.sleep(1)


async def ciclo_stati():
    """~10 volte al secondo: posizioni di tutti a tutti, stanza per stanza."""
    while True:
        try:
            for stanza in list(stanze.values()):
                auto = [{"id": p.id, **p.stato} for p in stanza.piloti if p.stato]
                if not auto:
                    continue
                messaggio = {"tipo": "stato", "auto": auto}
                for p in stanza.piloti:
                    await p.invia(messaggio)
        except Exception as errore:
            print("multigiocatore: errore nel ciclo stati:", errore)
        await asyncio.sleep(0.1)


def _nome_da_token(token):
    if not token:
        return None
    conn = get_connection()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            _id, username = utente_da_token(cur, token)
            return username
    finally:
        conn.close()


def _numero(valore, minimo, massimo):
    try:
        v = float(valore)
    except (TypeError, ValueError):
        return None
    if v != v or v < minimo or v > massimo:  # NaN o fuori scala
        return None
    return v


@router.websocket("/game/ws/gara")
async def ws_gara(ws: WebSocket):
    global _ciclo_avviato
    await ws.accept()
    if not _ciclo_avviato:
        _ciclo_avviato = True
        asyncio.create_task(ciclo_attese())
        asyncio.create_task(ciclo_stati())

    pilota = None
    try:
        primo = json.loads(await asyncio.wait_for(ws.receive_text(), timeout=20))
        modalita = primo.get("modalita")
        if primo.get("tipo") != "entra" or modalita not in MODALITA:
            await ws.close(code=1008)
            return
        try:
            nome = await run_in_threadpool(_nome_da_token, primo.get("token"))
        except Exception:
            nome = None
        nome = nome or f"Ospite {secrets.randbelow(900) + 100}"
        livrea = primo.get("livrea") if primo.get("livrea") in LIVREE_AMMESSE else "rosso"
        posto = primo.get("posto_qualifica")
        posto = int(posto) if isinstance(posto, (int, float)) and 1 <= posto <= POSTI_GRIGLIA else None
        pilota = Pilota(ws, nome, livrea, posto, modalita)
        code[modalita].append(pilota)
        await pilota.invia({"tipo": "benvenuto", "id": pilota.id, "nome": nome})

        while True:
            msg = json.loads(await ws.receive_text())
            tipo = msg.get("tipo")
            if tipo == "pos" and pilota.stanza:
                d = _numero(msg.get("d"), -1000, 100000)
                x = _numero(msg.get("x"), -50, 50)
                v = _numero(msg.get("v"), 0, 120)
                if d is not None and x is not None and v is not None:
                    pilota.stato = {"d": round(d, 2), "x": round(x, 2), "v": round(v, 2)}
            elif tipo == "fine" and pilota.stanza:
                tempo = _numero(msg.get("tempo"), 1, 36000)
                if tempo is not None:
                    for p in pilota.stanza.piloti:
                        await p.invia({"tipo": "arrivo", "id": pilota.id, "nome": pilota.nome, "tempo": tempo})
    except (WebSocketDisconnect, asyncio.TimeoutError, json.JSONDecodeError, RuntimeError):
        pass
    finally:
        if pilota is not None:
            if pilota in code.get(pilota.modalita, []):
                code[pilota.modalita].remove(pilota)
            stanza = pilota.stanza
            if stanza is not None:
                stanza.piloti = [p for p in stanza.piloti if p is not pilota]
                for p in stanza.piloti:
                    await p.invia({"tipo": "uscito", "id": pilota.id})
                if not stanza.piloti:
                    stanze.pop(stanza.id, None)
