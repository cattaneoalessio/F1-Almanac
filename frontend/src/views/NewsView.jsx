import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import { SpazioAdv } from '../components/AdSlot.jsx';
import { getNews } from '../api/contenuti.js';
import { dataLeggibile } from '../utils/htmlSicuro.js';
import './NewsView.css';

const PER_PAGINA = 12;

/**
 * News (/news) — articoli pubblicati dal pannello /admin/contenuti, dal più
 * recente. Comprende anche i vecchi "In Primo Piano": quando ne esce uno
 * nuovo, il precedente compare qui da solo.
 */
export default function NewsView() {
  const [pagina, setPagina] = useState(1);
  const [dati, setDati] = useState(null);
  const [stato, setStato] = useState('caricamento');

  useEffect(() => {
    let attivo = true;
    setStato('caricamento');
    getNews(pagina, PER_PAGINA)
      .then((r) => {
        if (!attivo) return;
        setDati(r);
        setStato('pronto');
      })
      .catch(() => attivo && setStato('errore'));
    return () => {
      attivo = false;
    };
  }, [pagina]);

  const voci = dati?.voci || [];
  const totalePagine = dati ? Math.max(1, Math.ceil(dati.totale / PER_PAGINA)) : 1;

  return (
    <main className="main main--historical">
      <div className="topbar">
        <div className="topbar__title">
          <h1 style={{ fontSize: '1.4rem' }}>News</h1>
        </div>
      </div>

      {stato === 'caricamento' && <p className="historical-standings__stato">Caricamento…</p>}
      {stato === 'errore' && <p className="historical-standings__stato">Le news non sono raggiungibili in questo momento. Riprova tra poco.</p>}
      {stato === 'pronto' && voci.length === 0 && <p className="historical-standings__stato">Nessuna news pubblicata, per ora.</p>}

      {voci.length > 0 && <SpazioAdv formato="leaderboard" />}

      {voci.length > 0 && (
        <div className="news-view__grid">
          {voci.map((v) => (
            <SchedaNews key={v.id} voce={v} />
          ))}
        </div>
      )}
      <Pagination pagina={pagina} totalePagine={totalePagine} onCambiaPagina={(p) => { setPagina(p); window.scrollTo(0, 0); }} />
    </main>
  );
}

export function SchedaNews({ voce }) {
  return (
    <GlassPanel as={Link} to={`/news/${voce.slug}`} className="news-view__card">
      {voce.immagine?.src && (
        <img className="news-view__img" src={voce.immagine.src} alt={voce.immagine.alt || ''} loading="lazy" />
      )}
      <p className="news-view__data">{dataLeggibile(voce.data_pubblicazione)}</p>
      <h2 className="news-view__titolo">{voce.titolo}</h2>
      {voce.sottotitolo && <p className="news-view__estratto">{voce.sottotitolo}</p>}
      <span className="news-view__leggi">Leggi →</span>
    </GlassPanel>
  );
}
