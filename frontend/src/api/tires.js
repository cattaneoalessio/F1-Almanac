/**
 * tires.js
 * --------
 * Script di collegamento all'API delle gomme, come richiesto nelle
 * specifiche del progetto (pannello "Strategia gomme" nel mockup).
 *
 * ATTENZIONE — DA VERIFICARE PRIMA DI ANDARE IN PRODUZIONE:
 * OpenF1 espone i dati sulle mescole attraverso l'endpoint /v1/stints
 * (compound, numero di stint, giro di inizio/fine, età della gomma).
 * Non ho potuto verificare in questa sessione la documentazione live
 * su https://openf1.org/#stints (limite di ricerca web raggiunto):
 * prima di collegare questo script a dati reali, apri quella pagina e
 * controlla che i nomi dei campi qui sotto (compound, lap_start,
 * lap_end, stint_number, tyre_age_at_start, driver_number) coincidano
 * ancora con quelli restituiti dall'API. Se sono cambiati, aggiorna
 * solo la funzione normalizeStint(): il resto del file non cambia.
 */

import { fetchOpenF1 } from './openf1.js';
import { TYRE_COLORS } from '../data/teamColors.js';

/**
 * Recupera gli stint gomme per una sessione (e opzionalmente un solo
 * pilota), già "normalizzati" in un formato comodo per la UI.
 *
 * @param {Object} opts
 * @param {string|number} [opts.sessionKey='latest']
 * @param {number} [opts.driverNumber] - se omesso, arrivano tutti i piloti
 * @returns {Promise<Array<{
 *   driverNumber: number,
 *   stintNumber: number,
 *   compound: string,        // es. 'medium' (sempre minuscolo)
 *   compoundColor: string,   // colore ufficiale mescola, da teamColors.js
 *   lapStart: number,
 *   lapEnd: number,
 *   tyreAgeAtStart: number,
 * }>>}
 */
export async function getTyreStints({ sessionKey = 'latest', driverNumber } = {}) {
  const grezzi = await fetchOpenF1('stints', {
    session_key: sessionKey,
    driver_number: driverNumber,
  });
  return grezzi.map(normalizeStint);
}

function normalizeStint(stint) {
  const compound = (stint.compound || '').toLowerCase();
  return {
    driverNumber: stint.driver_number,
    stintNumber: stint.stint_number,
    compound,
    compoundColor: TYRE_COLORS[compound] || '#8d8d8d',
    lapStart: stint.lap_start,
    lapEnd: stint.lap_end,
    tyreAgeAtStart: stint.tyre_age_at_start,
  };
}

/**
 * Dati di esempio per sviluppare/anteprima il componente SENZA rete
 * (usati anche nel mockup pubblicato). Utile finché non hai ancora
 * verificato l'endpoint reale, o se l'app viene aperta senza
 * connessione a OpenF1.
 */
export const SAMPLE_STINTS = [
  { driverNumber: 4, stintNumber: 1, compound: 'medium', compoundColor: TYRE_COLORS.medium, lapStart: 1, lapEnd: 18 },
  { driverNumber: 4, stintNumber: 2, compound: 'hard', compoundColor: TYRE_COLORS.hard, lapStart: 19, lapEnd: 41 },
];
