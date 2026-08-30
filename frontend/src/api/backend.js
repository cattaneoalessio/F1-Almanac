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
