import { useEffect, useRef } from 'react';
import { CLIENT_ADSENSE, FORMA_ANNUNCIO, MODALITA, idUnita, nomeUnita, spazioAttivo } from '../config/pubblicita.js';
import './AdSlot.css';

/**
 * AdSlot — spazio pubblicitario in formati IAB standard. Cosa mostra dipende
 * da config/pubblicita.js (variabile VITE_PUBBLICITA):
 *   off        → niente (predefinito in produzione, in attesa dell'approvazione);
 *   segnaposto → riquadro tratteggiato che riserva lo spazio (layout in sviluppo);
 *   reale      → annuncio AdSense vero, se per quel formato c'è l'ID dell'unità.
 *
 * `formato` sceglie la dimensione, che si adatta allo schermo (vedi AdSlot.css):
 *   'leaderboard'       728×90   (telefono: 320×100)
 *   'billboard'         970×250  (tablet: 728×90, telefono: 300×250)
 *   'rettangolo'        300×250
 *   'rettangolo-grande' 336×280  (telefono stretto: 300×250)
 *   'colonna'           160×600  (schermi ≥1800px: 300×600)
 * `width`/`height` espliciti (vecchia forma) valgono solo per il segnaposto.
 */
function AnnuncioReale({ formato }) {
  const rif = useRef(null);

  useEffect(() => {
    const ins = rif.current;
    // Un solo push per ogni <ins>: chiederne due dà l'errore "All ins elements
    // already have ads" (React in sviluppo esegue gli effetti due volte).
    if (!ins || ins.dataset.richiesto) return;
    ins.dataset.richiesto = '1';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Script di Google non caricabile (adblock): la pagina funziona lo stesso.
    }
  }, []);

  return (
    <div className={`ad-slot ad-slot--reale ad-slot--${formato}`} role="group" aria-label="Pubblicità">
      <ins
        ref={rif}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ADSENSE}
        data-ad-slot={idUnita(formato)}
        data-ad-format={FORMA_ANNUNCIO[nomeUnita(formato)]}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default function AdSlot({ formato, width, height, label = 'Spazio pubblicitario' }) {
  if (MODALITA === 'off') return null;
  if (MODALITA === 'reale') return spazioAttivo(formato) ? <AnnuncioReale formato={formato} /> : null;

  const esplicito = !formato && width && height;
  return (
    <div
      className={`ad-slot ${formato ? `ad-slot--${formato}` : ''}`}
      data-ad-formato={formato || `${width}x${height}`}
      role="group"
      aria-label="Pubblicità"
      style={esplicito ? { '--ad-w': `${width}px`, '--ad-h': `${height}px`, '--ad-dim': `"${width} × ${height}"` } : undefined}
    >
      <span className="ad-slot__label">{label}</span>
      <span className="ad-slot__size" />
    </div>
  );
}

/** Spazio pubblicitario "tra un blocco e l'altro" di una pagina: AdSlot con il
 * margine verticale giusto, centrato. Se lo spazio non è attivo non lascia
 * nemmeno il margine. Da usare per inserirne di nuovi. */
export function SpazioAdv({ formato }) {
  if (!spazioAttivo(formato)) return null;
  return (
    <div className="adv-blocco">
      <AdSlot formato={formato} />
    </div>
  );
}
