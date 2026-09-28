import './AdSlot.css';

/**
 * AdSlot — spazio riservato per Google AdSense, in formati IAB standard.
 * Puro segnaposto visivo (nessun iframe/script pubblicitario incluso):
 * riserva lo spazio nel layout così il vero blocco AdSense potrà essere
 * inserito senza far "saltare" il contenuto attorno (CLS).
 *
 * `formato` sceglie la dimensione, che si adatta allo schermo (vedi AdSlot.css):
 *   'leaderboard'       728×90   (telefono: 320×100)
 *   'billboard'         970×250  (tablet: 728×90, telefono: 300×250)
 *   'rettangolo'        300×250
 *   'rettangolo-grande' 336×280  (telefono stretto: 300×250)
 *   'colonna'           160×600  (schermi ≥1800px: 300×600)
 * `width`/`height` espliciti (vecchia forma) restano supportati.
 *
 * Quando arriveranno gli annunci veri, si sostituisce il contenuto di questo
 * componente con l'unità AdSense (<ins class="adsbygoogle">): la dimensione
 * riservata e tutti i punti in cui è usato restano invariati.
 */
export default function AdSlot({ formato, width, height, label = 'Spazio pubblicitario' }) {
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
 * margine verticale giusto, centrato. Da usare per inserirne di nuovi. */
export function SpazioAdv({ formato }) {
  return (
    <div className="adv-blocco">
      <AdSlot formato={formato} />
    </div>
  );
}
