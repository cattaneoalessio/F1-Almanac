/**
 * openf1.js
 * ---------
 * Piccolo helper per interrogare OpenF1 (https://openf1.org), l'API
 * gratuita di dati F1 in tempo reale citata nelle specifiche del
 * progetto. Non serve una chiave: è sufficiente una fetch HTTP.
 *
 * Tutti gli altri file che parlano con OpenF1 (es. tires.js) passano
 * da qui, così la gestione di URL/errori/parametri è scritta una volta
 * sola.
 */

const BASE_URL = 'https://api.openf1.org/v1';

/**
 * Chiama un endpoint OpenF1 e restituisce l'array JSON di risultati.
 *
 * @param {string} endpoint - es. "sessions", "intervals", "stints"
 * @param {Record<string, string|number>} params - filtri querystring,
 *        es. { session_key: 'latest', driver_number: 4 }
 */
export async function fetchOpenF1(endpoint, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  const url = `${BASE_URL}/${endpoint}${query ? `?${query}` : ''}`;

  const risposta = await fetch(url);
  if (!risposta.ok) {
    throw new Error(`OpenF1 ha risposto ${risposta.status} per ${url}`);
  }
  return risposta.json();
}

/** Sessione più recente/in corso: comodo per popolare la UI live. */
export function getLatestSession() {
  return fetchOpenF1('sessions', { session_key: 'latest' });
}

/** Distacchi tra i piloti nella sessione indicata (per la sidebar). */
export function getIntervals(sessionKey = 'latest') {
  return fetchOpenF1('intervals', { session_key: sessionKey });
}
