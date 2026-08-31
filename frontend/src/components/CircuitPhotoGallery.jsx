import { useEffect, useState } from 'react';
import CreditedFigure from './CreditedFigure.jsx';
import './CircuitPhotoGallery.css';

/**
 * <CircuitPhotoGallery foto={[...]}> — mostra la prima foto dell'elenco
 * come immagine principale (grande, con didascalia completa) e le
 * eventuali altre come una fila di miniature cliccabili sotto: cliccando
 * una miniatura (o la foto principale) si apre una lightbox a schermo
 * intero con l'immagine ingrandita e la sua didascalia.
 *
 * Ordine dell'array = ordine di importanza: la prima resta sempre quella
 * "principale" (di norma la prima foto verificata e incollata per quel
 * circuito), le successive sono un arricchimento facoltativo.
 */
export default function CircuitPhotoGallery({ foto }) {
  const [indiceLightbox, setIndiceLightbox] = useState(null);

  useEffect(() => {
    if (indiceLightbox === null) return undefined;
    const onKeyDown = (evento) => {
      if (evento.key === 'Escape') setIndiceLightbox(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [indiceLightbox]);

  if (!foto || foto.length === 0) return null;

  const [principale, ...altre] = foto;

  return (
    <div className="circuit-gallery">
      {/* Nota: l'immagine principale è cliccabile per aprire la
          lightbox, ma non può essere un <button> che avvolge tutta la
          didascalia — la didascalia contiene link (autore/fonte/
          licenza) e un link dentro un bottone è HTML non valido e
          rompe il click sui link stessi. Per questo qui il bottone
          avvolge solo l'immagine, la didascalia sta fuori. */}
      <div className="circuit-gallery__principale">
        <button
          type="button"
          className="circuit-gallery__apri-principale"
          onClick={() => setIndiceLightbox(0)}
          aria-label="Ingrandisci l'immagine"
        >
          <img className="credited-figure__img" src={principale.src} alt={principale.alt} loading="lazy" />
        </button>
        <CreditedFigure {...principale} nascondiImmagine />
      </div>

      {altre.length > 0 && (
        <div className="circuit-gallery__miniature">
          {altre.map((foto_, indice) => (
            <button
              key={foto_.src}
              type="button"
              className="circuit-gallery__miniatura"
              onClick={() => setIndiceLightbox(indice + 1)}
            >
              <img src={foto_.src} alt={foto_.alt} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {indiceLightbox !== null && (
        <div
          className="circuit-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setIndiceLightbox(null)}
        >
          <button
            type="button"
            className="circuit-gallery__chiudi"
            onClick={() => setIndiceLightbox(null)}
            aria-label="Chiudi"
          >
            ✕
          </button>
          <div
            className="circuit-gallery__lightbox-contenuto"
            onClick={(evento) => evento.stopPropagation()}
          >
            <img src={foto[indiceLightbox].src} alt={foto[indiceLightbox].alt} />
            <CreditedFigure {...foto[indiceLightbox]} nascondiImmagine />
          </div>
        </div>
      )}
    </div>
  );
}
