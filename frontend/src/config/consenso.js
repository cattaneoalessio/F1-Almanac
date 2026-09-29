/**
 * consenso.js — impostazioni del banner dei cookie (src/consenso/).
 *
 * PROPRIO: false = affida il consenso al sistema certificato di Google
 * ("Privacy e messaggi" di AdSense, messaggio GDPR): il banner scritto per
 * questo sito non compare più, e il pulsante nel piè di pagina riapre quello
 * di Google (vedi GestisciConsenso.jsx). È lo stato attuale, scelto perché
 * per mostrare annunci PERSONALIZZATI a utenti di UE e Regno Unito Google
 * richiede un sistema certificato e integrato con lo standard TCF — il
 * banner fatto in casa non basta. Un messaggio "GDPR" creato in AdSense
 * (Privacy e messaggi → GDPR → Crea messaggio) è già di per sé riservato
 * agli utenti di SEE e Regno Unito: corretto per un sito solo in italiano
 * come questo, oggi. Il resto del mondo (compresi gli USA) al momento non
 * riceve nessun messaggio di consenso: da rivedere se il pubblico cambierà
 * (vedi FASE-2-INGLESE.md).
 *
 * PROPRIO: true = usa di nuovo il banner scritto per questo sito (gestisce
 * sia il modello UE sia quello USA, vedi ConsensoContext.jsx): la logica
 * resta nel codice, spenta ma pronta, per tornare indietro se un giorno si
 * scegliesse di non usare il sistema di Google.
 */
export const CONSENSO = {
  PROPRIO: false,
  CHIAVE: 'monoposto-consenso', // nome della voce salvata nel browser
  VERSIONE: 1, // aumentalo se cambiano le finalità: tutti dovranno scegliere di nuovo
  DURATA_MESI: 12, // dopo quanto tempo si richiede la scelta
};
