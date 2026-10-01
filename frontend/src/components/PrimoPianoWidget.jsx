import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPrimoPiano } from '../api/contenuti.js';
import { dataLeggibile } from '../utils/htmlSicuro.js';
import './PrimoPianoWidget.css';

/** "In Primo Piano" in home: l'ultimo articolo pubblicato come Primo Piano.
 * Se non ce n'è nessuno (o l'API non risponde) la sezione non compare. */
export default function PrimoPianoWidget() {
  const [articolo, setArticolo] = useState(null);

  useEffect(() => {
    let attivo = true;
    getPrimoPiano()
      .then((a) => attivo && setArticolo(a))
      .catch(() => {});
    return () => {
      attivo = false;
    };
  }, []);

  if (!articolo) return null;

  return (
    <section className="home-section">
      <div className="home-section__header">
        <h2 className="section-title">In Primo Piano</h2>
      </div>
      <Link to={`/news/${articolo.slug}`} className={`primo-piano ${articolo.immagine?.src ? '' : 'primo-piano--senza-foto'}`}>
        {articolo.immagine?.src && (
          <img className="primo-piano__img" src={articolo.immagine.src} alt={articolo.immagine.alt || ''} />
        )}
        <div className="primo-piano__testo">
          <p className="primo-piano__data">{dataLeggibile(articolo.data_pubblicazione)}</p>
          <h3 className="primo-piano__titolo">{articolo.titolo}</h3>
          {articolo.sottotitolo && <p className="primo-piano__sottotitolo">{articolo.sottotitolo}</p>}
          <span className="primo-piano__leggi">Leggi l'approfondimento →</span>
        </div>
      </Link>
    </section>
  );
}
