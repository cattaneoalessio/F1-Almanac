import GlassPanel from '../components/GlassPanel.jsx';
import notizie from '../data/pirelli-news.json';
import './NewsView.css';

const FORMATTATORE_DATA = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

function formattaData(iso) {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return FORMATTATORE_DATA.format(data);
}

/**
 * News (/news) — notizie tecniche Pirelli, aggiornate ogni notte da
 * scripts/fetch-pirelli.js + la GitHub Action .github/workflows/
 * update-pirelli.yml, che scrivono src/data/pirelli-news.json.
 *
 * Solo testo, di proposito: NON mostra le foto del feed stampa Pirelli
 * (soggette a copyright "tutti i diritti riservati", verificato sulle
 * pagine legali di pirelli.com — nessuna licenza Creative Commons).
 * L'estratto è quello fornito da Pirelli stessa nel feed RSS (pensato
 * per essere ripreso da terzi), non un riassunto riscritto: per questo
 * ogni card ha sempre "Fonte: Pirelli" e il link all'articolo integrale,
 * invece di presentare il testo come nostro.
 *
 * Se in futuro vuoi arricchire una notizia con un post Instagram/X/
 * YouTube ufficiale di Pirelli scelto a mano (non automatico), usa
 * <SocialEmbed> dentro la card: l'immagine/video resta ospitato dalla
 * piattaforma d'origine, non va scaricato qui.
 */
export default function NewsView() {
  const notizieItaliane = notizie.filter((n) => n.lingua === 'it');

  return (
    <main className="main main--historical">
      <div className="topbar">
        <div className="topbar__title">
          <h1 style={{ fontSize: '1.4rem' }}>News</h1>
        </div>
        <div className="topbar__meta">Aggiornate automaticamente ogni notte dal feed stampa Pirelli</div>
      </div>

      {notizieItaliane.length === 0 && (
        <p className="historical-standings__stato">
          Nessuna news disponibile al momento: la prima esecuzione automatica del feed non è ancora
          avvenuta, oppure il feed non era raggiungibile durante l'ultimo aggiornamento.
        </p>
      )}

      {notizieItaliane.length > 0 && (
        <div className="news-view__grid">
          {notizieItaliane.map((notizia) => (
            <GlassPanel key={notizia.id} className="news-view__card">
              {formattaData(notizia.data) && <p className="news-view__data">{formattaData(notizia.data)}</p>}
              <h2 className="news-view__titolo">{notizia.titolo}</h2>
              <p className="news-view__estratto">{notizia.estratto}</p>
              <p className="news-view__fonte">
                Fonte: Pirelli —{' '}
                <a href={notizia.link} target="_blank" rel="noreferrer noopener">
                  leggi l'articolo originale ↗
                </a>
              </p>
            </GlassPanel>
          ))}
        </div>
      )}
    </main>
  );
}
