/**
 * consenso.js — logica pura del consenso ai cookie (senza React), così si può
 * provare da sola: quale regola si applica all'utente, come si salva la sua
 * scelta e cosa cambia nelle richieste pubblicitarie di AdSense.
 */
import { CONSENSO } from '../config/consenso.js';

// Fusi orari degli Stati Uniti: lì vale il modello "opt-out" (l'utente può
// rifiutare la vendita/condivisione dei dati). Ovunque altro, o se il fuso è
// sconosciuto, si applica il modello più severo, quello europeo (consenso
// preventivo): è la scelta prudente, mai il contrario.
const FUSI_USA = new Set([
  'America/New_York', 'America/Detroit', 'America/Chicago', 'America/Menominee', 'America/Denver', 'America/Boise',
  'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Juneau', 'America/Sitka', 'America/Metlakatla',
  'America/Yakutat', 'America/Nome', 'America/Adak', 'Pacific/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain',
  'US/Pacific', 'US/Alaska', 'US/Hawaii', 'US/Arizona', 'US/Michigan', 'US/Aleutian',
]);

/** 'us' (opt-out) oppure 'eu' (opt-in, il modello più severo, anche per tutti gli altri Paesi). */
export function regionePerFusoOrario(fuso) {
  if (!fuso) return 'eu';
  if (FUSI_USA.has(fuso) || fuso.startsWith('America/Indiana/') || fuso.startsWith('America/Kentucky/') || fuso.startsWith('America/North_Dakota/')) {
    return 'us';
  }
  return 'eu';
}

/** Global Privacy Control: segnale del browser con cui l'utente rifiuta la vendita dei dati. */
export function gpcAttivo(nav) {
  return Boolean(nav && nav.globalPrivacyControl === true);
}

export function creaRecord({ regione, pubblicita, origine = 'utente', adesso = new Date() }) {
  const scade = new Date(adesso);
  scade.setMonth(scade.getMonth() + CONSENSO.DURATA_MESI);
  return {
    v: CONSENSO.VERSIONE,
    regione,
    pubblicita: Boolean(pubblicita),
    origine,
    scelto: adesso.toISOString(),
    scade: scade.toISOString(),
  };
}

/** La scelta salvata, se c'è ed è ancora valida (versione corrente, non scaduta). Mai un'eccezione. */
export function leggiConsenso(storage, adesso = new Date()) {
  try {
    const grezzo = storage.getItem(CONSENSO.CHIAVE);
    if (!grezzo) return null;
    const record = JSON.parse(grezzo);
    if (record?.v !== CONSENSO.VERSIONE || typeof record.pubblicita !== 'boolean') return null;
    if (!record.scade || new Date(record.scade) <= adesso) return null;
    return record;
  } catch {
    return null;
  }
}

export function salvaConsenso(storage, record) {
  try {
    storage.setItem(CONSENSO.CHIAVE, JSON.stringify(record));
  } catch {
    // Memoria del browser non disponibile (es. navigazione privata restrittiva):
    // la scelta vale per questa visita ma non viene ricordata.
  }
}

/**
 * Traduce la scelta dell'utente nei comandi di AdSense (procedura indicata da
 * Google: pauseAdRequests e requestNonPersonalizedAds).
 *   - nessuna scelta ancora → richieste in pausa;
 *   - ha accettato → annunci normali;
 *   - ha rifiutato in USA → annunci NON personalizzati;
 *   - ha rifiutato in Europa → nessuna richiesta pubblicitaria.
 */
export function applicaAdSense(win, record) {
  const ads = (win.adsbygoogle = win.adsbygoogle || []);
  if (!record) {
    ads.pauseAdRequests = 1;
  } else if (record.pubblicita) {
    ads.requestNonPersonalizedAds = 0;
    ads.pauseAdRequests = 0;
  } else if (record.regione === 'us') {
    ads.requestNonPersonalizedAds = 1;
    ads.pauseAdRequests = 0;
  } else {
    ads.pauseAdRequests = 1;
  }
}
