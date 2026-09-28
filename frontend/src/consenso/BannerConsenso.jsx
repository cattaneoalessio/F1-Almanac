import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { SITO } from '../config/sito.js';
import { useConsenso } from './ConsensoContext.jsx';
import './BannerConsenso.css';

const FOCUSABILI = 'button, a[href], input:not([disabled])';

function Dialogo() {
  const { regione, record, bloccante, accetta, rifiuta, salva, chiudi } = useConsenso();
  const dialogo = useRef(null);
  const [personalizza, setPersonalizza] = useState(false);
  const [pubblicita, setPubblicita] = useState(record?.pubblicita ?? false);
  const usa = regione === 'us';

  useEffect(() => {
    const precedente = document.activeElement;
    const overflowPrima = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // il sito sotto non scorre
    dialogo.current?.focus();
    return () => {
      document.body.style.overflow = overflowPrima;
      precedente?.focus?.();
    };
  }, []);

  const tastiera = (evento) => {
    if (evento.key === 'Escape' && !bloccante) {
      chiudi();
      return;
    }
    if (evento.key !== 'Tab') return;
    // Il focus resta dentro il banner (finestra di dialogo modale).
    const elementi = [...dialogo.current.querySelectorAll(FOCUSABILI)];
    if (elementi.length === 0) return;
    const primo = elementi[0];
    const ultimo = elementi[elementi.length - 1];
    if (evento.shiftKey && (document.activeElement === primo || document.activeElement === dialogo.current)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primo.focus();
    }
  };

  return (
    <div className="consenso-overlay">
      <div
        ref={dialogo}
        className="consenso-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consenso-titolo"
        aria-describedby="consenso-testo"
        tabIndex={-1}
        onKeyDown={tastiera}
      >
        {!bloccante && (
          <button type="button" className="consenso-chiudi" onClick={chiudi} aria-label="Chiudi senza modificare le scelte">
            ×
          </button>
        )}
        <h2 id="consenso-titolo" className="consenso-titolo">
          {usa ? 'Avviso sulla privacy' : `La tua privacy su ${SITO.nome}`}
        </h2>
        <p id="consenso-testo" className="consenso-testo">
          {usa
            ? 'Usiamo cookie e tecnologie simili, anche di terze parti come Google, per far funzionare il sito e mostrare pubblicità. Se vivi in California o in un altro stato con leggi analoghe, puoi rifiutare la «vendita» o «condivisione» dei tuoi dati personali per la pubblicità mirata. Puoi cambiare scelta in qualsiasi momento dal link in fondo a ogni pagina.'
            : 'Usiamo cookie e tecnologie simili per far funzionare il sito e, con il tuo consenso, per mostrarti pubblicità (Google AdSense), anche personalizzata in base ai tuoi interessi. Puoi accettare, rifiutare o scegliere: rifiutando puoi comunque usare tutto il sito. Puoi cambiare idea in qualsiasi momento da «Gestisci consenso cookie» in fondo a ogni pagina.'}
        </p>

        {personalizza && !usa && (
          <fieldset className="consenso-scelte">
            <legend className="consenso-scelte__legenda">Le tue scelte</legend>
            <label className="consenso-scelta consenso-scelta--fissa">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Necessari</strong>
                <small>Servono al funzionamento del sito e all'accesso con il tuo account. Sempre attivi.</small>
              </span>
            </label>
            <label className="consenso-scelta">
              <input type="checkbox" checked={pubblicita} onChange={(e) => setPubblicita(e.target.checked)} />
              <span>
                <strong>Pubblicità e personalizzazione</strong>
                <small>
                  Google AdSense e i suoi partner possono usare cookie e identificatori per mostrare annunci
                  personalizzati e misurarne l'efficacia.
                </small>
              </span>
            </label>
          </fieldset>
        )}

        <div className="consenso-azioni">
          {personalizza && !usa ? (
            <button type="button" className="consenso-btn consenso-btn--accetta" onClick={() => salva(pubblicita)}>
              Salva le mie scelte
            </button>
          ) : (
            <>
              {/* Stessa dimensione e stessa riga: rifiutare è facile quanto accettare (richiesto dalle
                  autorità europee). Accetta è evidenziato dal colore, non da una posizione o misura diverse. */}
              <button type="button" className="consenso-btn consenso-btn--rifiuta" onClick={rifiuta}>
                {usa ? 'Non vendere né condividere' : 'Rifiuta'}
              </button>
              <button type="button" className="consenso-btn consenso-btn--accetta" onClick={accetta}>
                Accetta
              </button>
            </>
          )}
        </div>

        <div className="consenso-secondarie">
          {!usa && !personalizza && (
            <button type="button" className="consenso-link" onClick={() => setPersonalizza(true)}>
              Personalizza
            </button>
          )}
          <Link to="/privacy#pubblicita" className="consenso-link" onClick={bloccante ? undefined : chiudi}>
            Informativa privacy e cookie
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner di consenso ai cookie: finestra al centro dello schermo che copre i
 * contenuti finché l'utente non sceglie. Due varianti in base alla regione:
 * "eu" (consenso preventivo: Accetta / Rifiuta / Personalizza) e "us"
 * (opt-out: Accetta / Non vendere né condividere i miei dati).
 * Si sceglie in ENTRAMBI i modi per proseguire: rifiutare non chiude l'accesso al sito.
 */
export default function BannerConsenso() {
  const { visibile } = useConsenso();
  if (!visibile) return null;
  return createPortal(<Dialogo />, document.body);
}
