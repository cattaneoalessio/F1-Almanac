/**
 * backend.js — helper per parlare con la nostra API FastAPI (Fase C),
 * non con OpenF1 (quella è in api/openf1.js, dati live esterni).
 *
 * L'indirizzo del backend è configurabile via variabile d'ambiente Vite
 * (VITE_API_BASE_URL, da mettere in un file .env del frontend), con un
 * default sensato per lo sviluppo in locale. Così, quando il backend
 * verrà pubblicato online, basterà cambiare quella variabile: nessun
 * indirizzo va scritto a mano nei componenti.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function fetchBackend(percorso, parametri = {}) {
  const url = new URL(percorso, BASE_URL);
  Object.entries(parametri).forEach(([chiave, valore]) => {
    if (valore !== undefined && valore !== null && valore !== '') {
      url.searchParams.set(chiave, valore);
    }
  });

  const risposta = await fetch(url);

  if (risposta.status === 404) {
    // Caso normale (non un errore di rete): nessun dato per quell'anno/
    // circuito. Il chiamante decide cosa mostrare (es. "nessuna gara
    // trovata"), invece di far esplodere il componente.
    return null;
  }

  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} chiamando ${url.pathname}`);
  }

  return risposta.json();
}

/** Classifica piloti di una stagione. Restituisce `null` se l'anno non esiste nel database. */
export function getClassificaPiloti(anno) {
  return fetchBackend('/classifica/piloti', { anno });
}

/** Classifica scuderie di una stagione (punteggio "a somma"). `null` se l'anno non esiste. */
export function getClassificaScuderie(anno) {
  return fetchBackend('/classifica/scuderie', { anno });
}

/** Ordine di arrivo completo di una gara. Restituisce `null` se non trovata. */
export function getRisultatiGara(anno, circuito) {
  return fetchBackend('/gare/risultati', { anno, circuito });
}

/** Elenco delle gare di una stagione (per i link cliccabili). `null` se l'anno non esiste. */
export function getGareStagione(anno) {
  return fetchBackend('/gare', { anno });
}

/** Scheda di carriera di un pilota. `null` se lo slug non esiste. */
export function getSchedaPilota(slug) {
  return fetchBackend(`/piloti/${encodeURIComponent(slug)}`);
}

/** Indice di tutti i piloti nel database, con i totali di carriera. */
export function getElencoPiloti() {
  return fetchBackend('/piloti');
}

/** Indice di tutti i circuiti nel database. */
export function getElencoCircuiti() {
  return fetchBackend('/circuiti');
}

/** Scheda di un circuito (info, gare disputate, albo d'oro). `null` se lo slug non esiste. */
export function getSchedaCircuito(slug) {
  return fetchBackend(`/circuiti/${encodeURIComponent(slug)}`);
}

/** Indice di tutte le scuderie nel database. */
export function getElencoScuderie() {
  return fetchBackend('/scuderie');
}

/** Scheda di una scuderia (gare disputate, piloti). `null` se lo slug non esiste. */
export function getSchedaScuderia(slug) {
  return fetchBackend(`/scuderie/${encodeURIComponent(slug)}`);
}

/** 10 domande generate a caso per una partita a ChronoQuiz (Arcade).
 * Può restituire meno di 10 elementi se il DB non ha abbastanza dati
 * per generarne di più (mai domande inventate, vedi il backend). */
export function getDomandeChronoQuiz() {
  return fetchBackend('/arcade/chronoquiz/questions');
}

/** Invia un punteggio Arcade al backend. `token` è il JWT di Netlify
 * Identity (o `null`/`undefined` se non loggato): senza un token valido
 * il backend risponde comunque con successo ma `salvato: false` — non è
 * un errore, è il caso normale di chi gioca senza account. */
export async function inviaPunteggioArcade(gioco, punti, token) {
  const url = new URL('/arcade/punteggi', BASE_URL);
  const risposta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ gioco, punti }),
  });

  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} inviando il punteggio a ${url.pathname}`);
  }

  return risposta.json();
}

/** Classifica di un gioco Arcade (una riga per partita, non solo il
 * record di ciascun utente). */
export function getClassificaArcade(gioco, limite = 10) {
  return fetchBackend('/arcade/classifica', { gioco, limite });
}

/** Invia un tempo di Time Attack. A differenza di inviaPunteggioArcade,
 * qui il login NON è facoltativo lato server: senza token valido la
 * risposta è un 401 (fetchBackend lo propaga come eccezione, il
 * chiamante lo intercetta per mostrare "accedi per salvare"). */
export async function inviaTempoGioco(circuitoSlug, tipoSessione, tempoTotale, checkpoint, token) {
  const url = new URL('/game/submit', BASE_URL);
  const risposta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      circuito_slug: circuitoSlug,
      tipo_sessione: tipoSessione,
      tempo_totale: tempoTotale,
      checkpoint,
    }),
  });

  if (risposta.status === 401) {
    return { salvato: false, motivo_rifiuto: 'login_richiesto' };
  }
  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} inviando il tempo a ${url.pathname}`);
  }
  return risposta.json();
}

/** Classifica Qualifica/Gara di Time Attack per un circuito. `null` se lo slug non esiste. */
export function getClassificaTempiCircuito(slug, limite = 10) {
  return fetchBackend(`/game/leaderboard/${encodeURIComponent(slug)}`, { limite });
}

/** Classifica generale del Campionato Mondiale Virtuale. */
export function getClassificaCampionato() {
  return fetchBackend('/game/campionato');
}

/** Il mio record personale (Qualifica e Gara) su un circuito — usato
 * per colorare di viola un giro che batte il proprio record assoluto.
 * Login facoltativo: senza token risponde comunque con entrambi i
 * campi null, non è un errore. */
export async function getMioRecord(slug, token) {
  const url = new URL(`/game/mio-record/${encodeURIComponent(slug)}`, BASE_URL);
  const risposta = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} chiamando ${url.pathname}`);
  }
  return risposta.json();
}

/** Posizione di partenza in griglia per la Gara, basata sulla classifica
 * Qualifica del circuito. Login facoltativo: senza token o senza un
 * tempo di qualifica lì, posizione è null (si parte comunque, dal
 * fondo, come in F1). */
export async function getGrigliaPartenza(slug, token) {
  const url = new URL(`/game/griglia/${encodeURIComponent(slug)}`, BASE_URL);
  const risposta = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} chiamando ${url.pathname}`);
  }
  return risposta.json();
}

/** Livello Pilota unificato (ChronoQuiz + Time Attack), calcolato lato
 * server. Richiede login: senza token lancia — il chiamante controlla
 * se c'è un utente prima di invocarla (vedi ArcadeView.jsx). */
export async function getLivelloPilota(token) {
  const url = new URL('/arcade/livello', BASE_URL);
  const risposta = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!risposta.ok) {
    throw new Error(`Errore ${risposta.status} chiamando ${url.pathname}`);
  }
  return risposta.json();
}

/** Chiude il GP di un circuito (assegna i punti Campionato in base alla
 * classifica Gara), richiede la chiave admin nell'header X-Admin-Key.
 * Non usa fetchBackend: 403/404/409 sono esiti distinti che il
 * chiamante deve poter distinguere, non un'unica eccezione generica. */
export async function chiudiGp(slug, chiaveAdmin) {
  const url = new URL(`/game/close-gp/${encodeURIComponent(slug)}`, BASE_URL);
  const risposta = await fetch(url, {
    method: 'POST',
    headers: { 'X-Admin-Key': chiaveAdmin },
  });
  const corpo = await risposta.json().catch(() => null);
  return { ok: risposta.ok, status: risposta.status, corpo };
}
