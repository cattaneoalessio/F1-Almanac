import './AdSlot.css';

/**
 * AdSlot — spazio riservato per Google AdSense, in formato IAB standard.
 * Puro segnaposto visivo (nessun iframe/script pubblicitario incluso):
 * riserva lo spazio nel layout così il vero blocco AdSense potrà essere
 * inserito senza far "saltare" il contenuto attorno (CLS).
 */
export default function AdSlot({ width, height, label = 'Spazio pubblicitario' }) {
  return (
    <div className="ad-slot" style={{ '--ad-w': `${width}px`, '--ad-h': `${height}px` }}>
      <span className="ad-slot__label">{label}</span>
      <span className="ad-slot__size">
        {width} × {height} · Google AdSense
      </span>
    </div>
  );
}
