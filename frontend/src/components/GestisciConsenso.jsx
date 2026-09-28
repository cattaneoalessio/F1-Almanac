import { useEffect, useRef, useState } from 'react';
import { CONSENSO } from '../config/consenso.js';
import { useConsenso } from '../consenso/ConsensoContext.jsx';

/**
 * Pulsante che riapre la scelta di consenso (piè di pagina e pagina privacy):
 * la revoca deve essere facile quanto il consenso.
 *   - Con il banner proprio (CONSENSO.PROPRIO) riapre quello. In USA il testo è
 *     quello richiesto dalle leggi statali: «Non vendere né condividere i miei
 *     dati personali».
 *   - Se un giorno si passa a un sistema di consenso esterno certificato da
 *     Google (PROPRIO=false), riapre quello di Google col metodo documentato:
 *       googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => googlefc.showRevocationMessage() })
 *     e, se il modulo non c'è (adblock, non ancora attivo), lo dice dopo 1,5 s
 *     invece di restare muto.
 */
export default function GestisciConsenso({ className = '' }) {
  const { regione, riapri } = useConsenso();
  const [nonDisponibile, setNonDisponibile] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const apriEsterno = () => {
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

  const etichetta = regione === 'us' ? 'Non vendere né condividere i miei dati personali' : 'Gestisci consenso cookie';

  return (
    <>
      <button type="button" className={`gestisci-consenso ${className}`} onClick={CONSENSO.PROPRIO ? riapri : apriEsterno}>
        {etichetta}
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
