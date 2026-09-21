import './PhotoBand.css';

/**
 * PhotoBand — banda fotografica compatta usata come sfondo del <div
 * className="topbar"> nelle pagine "tabellari" (Piloti, Circuiti, Gara,
 * Archivio storico). Più bassa dell'hero della Home apposta: queste
 * pagine restano pensate per la consultazione, non per l'effetto
 * rivista — la foto è un accento, non il protagonista.
 */
export default function PhotoBand({ src, objectPosition = 'center', children }) {
  return (
    <div className="photo-band">
      <img className="photo-band__foto" src={src} alt="" aria-hidden="true" style={{ objectPosition }} />
      <div className="photo-band__scrim" />
      <div className="photo-band__content">{children}</div>
    </div>
  );
}
