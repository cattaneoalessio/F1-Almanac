import CircuitArt from './CircuitArt.jsx';
import { CIRCUIT_PHOTOS } from '../data/circuitPhotos.js';
import './CircuitIcon.css';

/**
 * <CircuitIcon slug="monza" size={40} />
 *
 * Icona per UN circuito specifico: mostra in piccolo la mappa REALE del
 * tracciato (la stessa immagine, con la stessa licenza e attribuzione,
 * già usata nella galleria foto della scheda circuito — CIRCUIT_PHOTOS,
 * SVG Wikimedia Commons CC-BY-SA) quando è disponibile per quello slug.
 *
 * Se il circuito non ha una foto in CIRCUIT_PHOTOS (i pochi mancanti tra
 * i 78 circuiti moderni, o i circuiti pre-1950/non ufficiali rimossi su
 * richiesta), ricade sul simbolo astratto CircuitArt — "meglio vuoto
 * (l'astratto generico) che inventato (una mappa non verificata)".
 *
 * A differenza di CircuitArt, questo componente è legato a un circuito
 * preciso: da usare solo dove lo slug è noto (elenco circuiti, scheda
 * circuito), non come logo generico di sezione.
 */
export default function CircuitIcon({ slug, size = 40, className = '' }) {
  const foto = CIRCUIT_PHOTOS[slug]?.[0];

  if (!foto) {
    return <CircuitArt size={size} className={className} />;
  }

  return (
    <span
      className={`circuit-icon ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <img src={foto.src} alt="" aria-hidden="true" loading="lazy" />
    </span>
  );
}
