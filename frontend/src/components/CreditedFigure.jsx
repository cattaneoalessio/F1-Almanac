import './CreditedFigure.css';

/**
 * <CreditedFigure> — <figure>/<figcaption> per immagini d'archivio con
 * licenza Creative Commons (foto storiche, circuiti), con lo spazio
 * per l'attribuzione fatto bene fin dall'inizio: la maggior parte delle
 * licenze CC (comprese CC BY e CC BY-SA) impongono per contratto di
 * indicare autore, fonte e licenza ogni volta che l'immagine viene
 * usata — non è un optional stilistico.
 *
 * Esempio d'uso (immagine da Wikimedia Commons):
 *
 *   <CreditedFigure
 *     src="/assets/circuiti/monza-1955.jpg"
 *     alt="Il rettifilo di Monza durante il GP d'Italia 1955"
 *     autore="Nome Cognome"
 *     fonteUrl="https://commons.wikimedia.org/wiki/File:Esempio.jpg"
 *     fonteLabel="Wikimedia Commons"
 *     licenzaUrl="https://creativecommons.org/licenses/by-sa/4.0/deed.it"
 *     licenzaLabel="CC BY-SA 4.0"
 *   />
 *
 * Se manca uno dei campi di attribuzione (es. l'autore non è indicato
 * sulla pagina della licenza), passa null: la riga "Autore:" non viene
 * mostrata invece di stampare "Autore: null" o un campo vuoto confuso.
 */
export default function CreditedFigure({
  src,
  alt,
  autore,
  autoreUrl,
  fonteUrl,
  fonteLabel = 'Fonte',
  licenzaUrl,
  licenzaLabel,
  didascalia,
}) {
  return (
    <figure className="credited-figure">
      <img className="credited-figure__img" src={src} alt={alt} loading="lazy" />
      <figcaption className="credited-figure__caption">
        {didascalia && <span className="credited-figure__testo">{didascalia} — </span>}
        {autore && (
          <span>
            Autore:{' '}
            {autoreUrl ? (
              <a href={autoreUrl} target="_blank" rel="noreferrer noopener">
                {autore}
              </a>
            ) : (
              autore
            )}
            .{' '}
          </span>
        )}
        {fonteUrl && (
          <span>
            Fonte:{' '}
            <a href={fonteUrl} target="_blank" rel="noreferrer noopener">
              {fonteLabel}
            </a>
            .{' '}
          </span>
        )}
        {licenzaUrl && (
          <span>
            Licenza:{' '}
            <a href={licenzaUrl} target="_blank" rel="noreferrer noopener">
              {licenzaLabel || licenzaUrl}
            </a>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
