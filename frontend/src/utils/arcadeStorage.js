/**
 * arcadeStorage.js — helper condivisi per i punteggi dei giochi Arcade
 * salvati in localStorage (per dispositivo/browser: qui non c'è un
 * account utente). Ogni gioco ha la propria chiave, es.
 * 'monoposto_chronoquiz_high'.
 */

export function leggiPunteggioSalvato(chiave) {
  try {
    const numero = Number(window.localStorage.getItem(chiave));
    return Number.isFinite(numero) && numero > 0 ? numero : 0;
  } catch {
    // localStorage non disponibile (es. navigazione privata): degrada a 0
    // invece di far fallire il rendering.
    return 0;
  }
}

/** Salva `punteggio` sotto `chiave` solo se batte il record esistente.
 * Restituisce true se è un nuovo record (utile per un messaggio "Nuovo
 * record!" nella UI), false altrimenti (compreso il caso in cui
 * localStorage non è disponibile). */
export function salvaPunteggioSeRecord(chiave, punteggio) {
  if (punteggio <= leggiPunteggioSalvato(chiave)) return false;
  try {
    window.localStorage.setItem(chiave, String(punteggio));
    return true;
  } catch {
    return false;
  }
}
