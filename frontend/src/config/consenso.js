/**
 * consenso.js — impostazioni del banner dei cookie (src/consenso/).
 *
 * PROPRIO: true = usa il banner scritto per questo sito. Impostalo a false
 * quando si passa a un sistema di consenso certificato da Google (es. "Privacy
 * e messaggi" di AdSense, o iubenda/Cookiebot): il banner proprio non compare
 * più e il pulsante nel piè di pagina riapre quello di Google. Motivo: per
 * mostrare annunci PERSONALIZZATI agli utenti di UE, Regno Unito e Svizzera,
 * Google richiede un sistema certificato e integrato con lo standard TCF
 * (vedi PRE-PUBBLICAZIONE.md).
 */
export const CONSENSO = {
  PROPRIO: true,
  CHIAVE: 'monoposto-consenso', // nome della voce salvata nel browser
  VERSIONE: 1, // aumentalo se cambiano le finalità: tutti dovranno scegliere di nuovo
  DURATA_MESI: 12, // dopo quanto tempo si richiede la scelta
};
