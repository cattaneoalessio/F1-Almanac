import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMetaPagina } from '../hooks/useMetaPagina.js';
import { SpazioAdv } from '../components/AdSlot.jsx';
import { getArticolo } from '../api/contenuti.js';
import { dataLeggibile, htmlSicuro } from '../utils/htmlSicuro.js';
import './ArticoloView.css';

/** Pagina di un articolo (/news/:slug): Primo Piano o news, stessa forma. */
export default function ArticoloView() {
  const { slug } = useParams();
  const [articolo, setArticolo] = useState(null);
  const [stato, setStato] = useState('caricamento');
  const [aperta, setAperta] = useState(null); // indice della foto della galleria aperta

  useEffect(() => {
    let attivo = true;
    setStato('caricamento');
    getArticolo(slug)
      .then((a) => {
        if (!attivo) return;
        setArticolo(a);
        setStato(a ? 'pronto' : 'assente');
      })
      .catch(() => attivo && setStato('errore'));
    return () => {
      attivo = false;
    };
  }, [slug]);

  useMetaPagina(
    stato === 'pronto'
      ? { titolo: articolo.titolo, descrizione: articolo.sottotitolo || undefined, tipo: 'article' }
      : stato === 'assente'
        ? { titolo: 'Articolo non trovato', robots: 'noindex' }
        : {},
  );

  const corpo = useMemo(() => htmlSicuro(articolo?.corpo_html), [articolo]);
  const galleria = articolo?.galleria || [];

  useEffect(() => {
    if (aperta === null) return undefined;
    const tasto = (e) => {
      if (e.key === 'Escape') setAperta(null);
      if (e.key === 'ArrowRight') setAperta((i) => (i + 1) % galleria.length);
      if (e.key === 'ArrowLeft') setAperta((i) => (i - 1 + galleria.length) % galleria.length);
    };
    document.addEventListener('keydown', tasto);
    return () => document.removeEventListener('keydown', tasto);
  }, [aperta, galleria.length]);

  if (stato === 'caricamento') return <main className="main main--historical"><p className="historical-standings__stato">Caricamento…</p></main>;
  if (stato !== 'pronto') {
    return (
      <main className="main main--historical">
        <h1 style={{ fontSize: '1.4rem' }}>{stato === 'assente' ? 'Articolo non trovato' : 'Articolo non disponibile'}</h1>
        <p className="historical-standings__stato">
          {stato === 'assente' ? "L'articolo non esiste o non è più pubblicato." : 'Riprova tra poco.'} <Link to="/news">Vai alle News</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="main main--historical articolo">
      <p className="articolo__torna"><Link to="/news">← News</Link></p>
      <header className="articolo__testa">
        <p className="articolo__data">{dataLeggibile(articolo.data_pubblicazione)}</p>
        <h1 className="articolo__titolo">{articolo.titolo}</h1>
        {articolo.sottotitolo && <p className="articolo__sottotitolo">{articolo.sottotitolo}</p>}
      </header>

      {articolo.immagine?.src && (
        <figure className="articolo__copertina">
          <img src={articolo.immagine.src} alt={articolo.immagine.alt || ''} />
          {articolo.immagine.credito && <figcaption>{articolo.immagine.credito}</figcaption>}
        </figure>
      )}

      <div className="articolo__corpo" dangerouslySetInnerHTML={{ __html: corpo }} />

      {galleria.length > 0 && (
        <section className="articolo__galleria" aria-label="Galleria fotografica">
          <h2 className="section-title">Galleria</h2>
          <div className="articolo__galleria-griglia">
            {galleria.map((foto, i) => (
              <button key={foto.src + i} type="button" className="articolo__miniatura" onClick={() => setAperta(i)}>
                <img src={foto.src} alt={foto.alt || ''} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      <SpazioAdv formato="billboard" />

      {aperta !== null && galleria[aperta] && (
        <div className="articolo__lightbox" role="dialog" aria-modal="true" onClick={() => setAperta(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={galleria[aperta].src} alt={galleria[aperta].alt || ''} />
            <figcaption>
              {galleria[aperta].alt}
              {galleria[aperta].credito && <span> — {galleria[aperta].credito}</span>}
            </figcaption>
          </figure>
          {galleria.length > 1 && (
            <>
              <button type="button" className="articolo__freccia articolo__freccia--sx" aria-label="Foto precedente"
                onClick={(e) => { e.stopPropagation(); setAperta((i) => (i - 1 + galleria.length) % galleria.length); }}>‹</button>
              <button type="button" className="articolo__freccia articolo__freccia--dx" aria-label="Foto successiva"
                onClick={(e) => { e.stopPropagation(); setAperta((i) => (i + 1) % galleria.length); }}>›</button>
            </>
          )}
          <button type="button" className="articolo__chiudi" aria-label="Chiudi" onClick={() => setAperta(null)}>×</button>
        </div>
      )}
    </main>
  );
}
