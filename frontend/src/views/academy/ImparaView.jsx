import { Link, useParams } from 'react-router-dom';
import GlassPanel from '../../components/GlassPanel.jsx';
import CreditedFigure from '../../components/CreditedFigure.jsx';
import Infografica from '../../components/academy/Infografiche.jsx';
import { SpazioAdv } from '../../components/AdSlot.jsx';
import { useMetaPagina } from '../../hooks/useMetaPagina.js';
import { LEZIONI, lezioneDaId } from '../../data/academy/lezioni.js';
import './Academy.css';

/** /academy/impara — elenco delle lezioni. */
export function ImparaIndice() {
  useMetaPagina({
    titolo: "Impara: com'è fatta una Formula 1",
    descrizione: 'Power unit, aerodinamica, freni, cambio, volante, gomme e sicurezza: lezioni con infografiche e confronto con le auto di tutti i giorni.',
  });
  return (
    <main className="main main--historical academy">
      <p className="academy__briciole"><Link to="/academy">Academy</Link> / Impara</p>
      <h1>Impara: com&rsquo;è fatta una Formula 1</h1>
      <p className="academy__intro">Una parte alla volta, con infografiche e il confronto con un&rsquo;auto di tutti i giorni.</p>
      <ol className="impara__indice">
        {LEZIONI.map((l, i) => (
          <li key={l.id}>
            <GlassPanel as={Link} to={`/academy/impara/${l.id}`} className="impara__scheda">
              <span className="impara__numero">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <strong>{l.titolo}</strong>
                <span className="impara__sommario">{l.sommario}</span>
              </span>
            </GlassPanel>
          </li>
        ))}
      </ol>
    </main>
  );
}

/** /academy/impara/:id — una lezione. */
export function LezioneView() {
  const { id } = useParams();
  const lezione = lezioneDaId(id);
  const indice = LEZIONI.findIndex((l) => l.id === id);
  useMetaPagina(
    lezione
      ? { titolo: `${lezione.titolo} — Impara la F1`, descrizione: lezione.sommario, tipo: 'article' }
      : { titolo: 'Lezione non trovata', robots: 'noindex' },
  );
  if (!lezione) {
    return (
      <main className="main main--historical academy">
        <h1>Lezione non trovata</h1>
        <p><Link to="/academy/impara">Torna alle lezioni</Link></p>
      </main>
    );
  }
  const precedente = LEZIONI[indice - 1];
  const successiva = LEZIONI[indice + 1];
  return (
    <main className="main main--historical academy lezione">
      <p className="academy__briciole">
        <Link to="/academy">Academy</Link> / <Link to="/academy/impara">Impara</Link>
      </p>
      <p className="academy__occhiello">Lezione {indice + 1} di {LEZIONI.length}</p>
      <h1>{lezione.titolo}</h1>
      <p className="academy__intro">{lezione.sommario}</p>

      <Infografica nome={lezione.infografica} />

      {lezione.sezioni.map((sez, i) => (
        <section key={sez.titolo} className="lezione__sezione">
          <h2>{sez.titolo}</h2>
          {sez.testo.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          {i === 0 && lezione.foto && (
            <CreditedFigure
              src={lezione.foto.src}
              alt={lezione.foto.alt}
              autore={lezione.foto.autore}
              fonteUrl={lezione.foto.fonteUrl}
              fonteLabel="Wikimedia Commons"
              licenzaUrl={lezione.foto.licenzaUrl}
              licenzaLabel={lezione.foto.licenza}
              didascalia={lezione.foto.didascalia}
            />
          )}
        </section>
      ))}

      <section className="lezione__sezione">
        <h2>F1 contro auto di tutti i giorni</h2>
        <div className="lezione__tabella-wrap">
          <table className="lezione__confronto">
            <thead>
              <tr><th scope="col"></th><th scope="col">Formula 1</th><th scope="col">Auto stradale</th></tr>
            </thead>
            <tbody>
              {lezione.confronto.map(([voce, f1, auto]) => (
                <tr key={voce}><th scope="row">{voce}</th><td>{f1}</td><td>{auto}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lezione__nota">I valori delle auto stradali sono indicativi: cambiano molto da modello a modello.</p>
      </section>

      <SpazioAdv formato="billboard" />

      {lezione.fonti?.length > 0 && (
        <section className="lezione__fonti">
          <h2>Fonti</h2>
          <ul>
            {lezione.fonti.map((f) => (
              <li key={f.url}><a href={f.url} target="_blank" rel="noreferrer noopener">{f.titolo}</a></li>
            ))}
          </ul>
        </section>
      )}

      <nav className="lezione__navigazione">
        {precedente ? <Link to={`/academy/impara/${precedente.id}`}>← {precedente.titolo}</Link> : <span />}
        {successiva && <Link to={`/academy/impara/${successiva.id}`}>{successiva.titolo} →</Link>}
      </nav>
    </main>
  );
}
