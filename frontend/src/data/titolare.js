/**
 * titolare.js — dati del titolare del trattamento mostrati nella pagina
 * Privacy (/privacy). L'informativa privacy DEVE indicare chi è il titolare e
 * come contattarlo.
 *
 * DA VERIFICARE prima della pubblicazione (vedi PRE-PUBBLICAZIONE.md): nome e
 * indirizzo email sono quelli indicati provvisoriamente dal gestore. Se il sito
 * verrà gestito tramite una ditta, un'associazione o una società, qui va la
 * denominazione corretta (con sede, P.IVA se dovuta).
 */
import { SITO } from '../config/sito.js';

export const TITOLARE = {
  nome: 'Alessio Cattaneo',
  email: SITO.email,
};

/** Data dell'ultima revisione del testo: aggiornala quando modifichi la privacy. */
export const PRIVACY_AGGIORNATA_IL = '28 settembre 2026';
