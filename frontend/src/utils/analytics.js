/**
 * analytics.js — Google Analytics 4 in "Consent Mode BASE" (scelta del
 * gestore, 5/10/2026): lo script di Google NON viene nemmeno scaricato finché
 * il visitatore non dà il consenso. Nessun dato, neanche anonimo, parte prima.
 *
 * Il consenso arriva dal sistema certificato di Google già usato per la
 * pubblicità ("Privacy e messaggi" di AdSense, standard TCF): lo leggiamo con
 * l'interfaccia __tcfapi. Analytics si accende solo se il visitatore ha
 * accettato la finalità 1 ("archiviare e/o accedere a informazioni sul
 * dispositivo") e il fornitore Google (id 755).
 * - Se il messaggio GDPR dice che il GDPR non si applica (visitatore fuori da
 *   UE/Regno Unito), Analytics si accende.
 * - Se l'interfaccia del consenso non c'è (messaggio non ancora pubblicato in
 *   AdSense, blocco degli annunci...), nel dubbio si applica la regola più
 *   prudente: per chi ha un fuso orario non statunitense Analytics resta spento.
 * - Se il visitatore ritira il consenso, i cookie di Analytics vengono negati
 *   da quel momento (consent update "denied").
 *
 * Pagine viste: il sito è una single-page app, quindi ogni cambio di pagina
 * è inviato a mano (paginaVista, chiamata da App.jsx).
 * Eventi del gioco: traccia(nome, parametri), ignorata senza consenso.
 */
import { regionePerFusoOrario } from './consenso.js';

export const ID_MISURAZIONE = import.meta.env?.VITE_GA_ID || 'G-HKCTH3GBCQ';
const VENDOR_GOOGLE = 755;

let attivo = false; // script caricato e consenso dato
let avviato = false;

function gtag() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function accendi() {
  if (attivo) {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  attivo = true;
  gtag('consent', 'update', { analytics_storage: 'granted' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ID_MISURAZIONE}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  // page_view lo mandiamo noi a ogni cambio pagina (SPA): niente invio automatico
  gtag('config', ID_MISURAZIONE, { send_page_view: false });
  paginaVista(window.location.pathname + window.location.search);
}

function spegni() {
  if (!attivo) return;
  gtag('consent', 'update', { analytics_storage: 'denied' });
}

function consensoDaTcf(dati) {
  if (!dati) return null;
  if (dati.gdprApplies === false) return true;
  if (dati.eventStatus !== 'tcloaded' && dati.eventStatus !== 'useractioncomplete') return null; // non ha ancora scelto
  const finalita = Boolean(dati.purpose?.consents?.[1]);
  const fornitore = Boolean(dati.vendor?.consents?.[VENDOR_GOOGLE]);
  return finalita && fornitore;
}

/** Da chiamare una volta all'avvio dell'app. */
export function avviaAnalytics() {
  if (avviato || typeof window === 'undefined' || !ID_MISURAZIONE) return;
  avviato = true;
  window.dataLayer = window.dataLayer || [];
  // Consent Mode: tutto negato di default (lo script comunque non è ancora caricato).
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  let tentativi = 0;
  const aspettaTcf = () => {
    if (typeof window.__tcfapi === 'function') {
      window.__tcfapi('addEventListener', 2, (dati, ok) => {
        if (!ok) return;
        const consenso = consensoDaTcf(dati);
        if (consenso === true) accendi();
        else if (consenso === false) spegni();
      });
      return;
    }
    tentativi += 1;
    if (tentativi < 20) {
      setTimeout(aspettaTcf, 250); // il sistema di consenso arriva con lo script di AdSense
      return;
    }
    // nessun sistema di consenso dopo 5 s: regola prudente
    const regione = regionePerFusoOrario(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (regione === 'us') accendi();
  };
  aspettaTcf();
}

/** Pagina vista (single-page app): chiamata a ogni cambio di percorso. */
export function paginaVista(percorso) {
  if (!attivo) return;
  gtag('event', 'page_view', {
    page_path: percorso,
    page_location: window.location.origin + percorso,
    page_title: document.title,
  });
}

/** Evento personalizzato (es. del gioco). Senza consenso non fa nulla. */
export function traccia(nome, parametri = {}) {
  if (!attivo) return;
  gtag('event', nome, parametri);
}
