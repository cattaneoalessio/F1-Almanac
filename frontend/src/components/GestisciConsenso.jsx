import { useEffect, useRef, useState } from 'react';

/**
 * Pulsante "Gestisci consenso cookie": riapre il messaggio di consenso di
 * Google ("Privacy e messaggi" di AdSense) per cambiare o revocare la scelta.
 * È il modo documentato da Google:
 *   googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => googlefc.showRevocationMessage() })
 *
 * Funziona solo se il messaggio è stato creato e pubblicato dal pannello
 * AdSense e lo script di Google è raggiungibile. Altrimenti (script bloccato
 * da un adblock, messaggio non ancora attivo, Paese dove non serve) non
 * succederebbe nulla: dopo un secondo e mezzo lo si dice all'utente invece di
 * lasciarlo con un pulsante che sembra rotto.
 */
export default function GestisciConsenso({ className = '' }) {
  const [nonDisponibile, setNonDisponibile] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const apri = () => {
    setNonDisponibile(false);
    clearTimeout(timer.current);
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    let eseguito = false;
    window.googlefc.callbackQueue.push({
      CONSENT_DATA_READY: () => {
        eseguito = true;
        window.googlefc.showRevocationMessage();
      },
    });
    timer.current = setTimeout(() => {
      if (!eseguito) setNonDisponibile(true);
    }, 1500);
  };

  return (
    <>
      <button type="button" className={`gestisci-consenso ${className}`} onClick={apri}>
        Gestisci consenso cookie
      </button>
      {nonDisponibile && (
        <span className="gestisci-consenso__avviso" role="status">
          Il modulo di consenso non è disponibile in questo momento (può non essere richiesto nel tuo Paese, oppure
          essere bloccato dal browser o da un'estensione). Puoi gestire gli annunci personalizzati da{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer noopener">
            adssettings.google.com
          </a>
          .
        </span>
      )}
    </>
  );
}
