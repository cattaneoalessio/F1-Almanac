/**
 * sessione.js — logica pura di bookkeeping per una sessione di gioco
 * (Qualifica/Prove Libere/Gara): quale giro è il migliore valido, come
 * si colora un giro nella cronologia (viola/verde/nessuno), come si
 * ricostruiscono i checkpoint di un singolo giro per un invio "come se
 * fosse l'unica sessione" (Qualifica invia solo il suo giro migliore,
 * non l'intera sessione multi-giro — vedi GameChampionshipView.jsx).
 *
 * Pura come pista.js/fisica.js: nessun accesso a DOM/canvas/tempo di
 * sistema, testabile in isolamento con Node.
 */

// Stesso valore usato lato backend (backend/api/game.py,
// PENALITA_TAGLIO_CURVA_SECONDI) — se cambia uno va cambiato anche
// l'altro, o il backend respingerà giri legittimamente penalizzati
// come "tempo_totale troppo superiore alla telemetria".
export const PENALITA_TAGLIO_CURVA_SECONDI = 5;

/** Il miglior giro VALIDO tra quelli fatti (tempo più basso — il tempo
 * già include un'eventuale penalità), o null se nessuno è valido
 * (compreso l'elenco vuoto). */
export function trovaMigliorGiroValido(giri) {
  return giri
    .filter((g) => g.valido)
    .reduce((migliore, g) => (migliore === null || g.tempo < migliore.tempo ? g : migliore), null);
}

/**
 * Colore da dare a un giro nella cronologia:
 * - null se il giro non è valido (si mostra "Non valido", non un colore)
 * - 'viola' se il tempo batte recordAssoluto (il proprio record già
 *   salvato su questo circuito/sessione — null/undefined se non esiste
 *   ancora un record, nel qual caso "viola" non può mai scattare)
 * - 'verde' se è il migliore valido di QUESTA sessione ma non batte il
 *   record assoluto
 * - null altrimenti (nessun colore, tempo "normale")
 */
export function coloreGiro(giro, elencoGiri, recordAssoluto) {
  if (!giro.valido) return null;
  if (recordAssoluto !== null && recordAssoluto !== undefined && giro.tempo < recordAssoluto) {
    return 'viola';
  }
  const validi = elencoGiri.filter((g) => g.valido);
  if (validi.length === 0) return null;
  const migliorTempoSessione = Math.min(...validi.map((g) => g.tempo));
  return giro.tempo === migliorTempoSessione ? 'verde' : null;
}

/**
 * Ricostruisce i checkpoint di UN giro (numeroGiro) presi dalla
 * telemetria dell'intera sessione, ritemporizzati da 0 rispetto
 * all'inizio di quel giro (inizioGiroMs, in millisecondi relativi
 * all'inizio DELLA SESSIONE, non del giro) — il "giro" nel risultato è
 * sempre 1, come se fosse l'unico di una sessione a sé.
 */
export function estraiCheckpointDelGiro(telemetriaSessione, numeroGiro, inizioGiroMs) {
  return telemetriaSessione
    .filter((c) => c.giro === numeroGiro)
    .map((c) => ({ giro: 1, indice: c.indice, t: c.t - inizioGiroMs }));
}
