import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SpazioAdv } from '../../components/AdSlot.jsx';
import { useMetaPagina } from '../../hooks/useMetaPagina.js';
import { CATEGORIE_VOCABOLARIO, VOCABOLARIO } from '../../data/academy/vocabolario.js';
import './Academy.css';

const normalizza = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** /academy/vocabolario — glossario con ricerca, categorie e indice alfabetico. */
export default function VocabolarioView() {
  useMetaPagina({
    titolo: 'Vocabolario della Formula 1',
    descrizione: `Il dizionario della F1: ${VOCABOLARIO.length} termini italiani e inglesi spiegati, da undercut a Overtake Mode, con esempi d'uso.`,
  });
  const { hash } = useLocation();
  const [cerca, setCerca] = useState('');
  const [categoria, setCategoria] = useState('');

  const voci = useMemo(() => {
    const q = normalizza(cerca.trim());
    return VOCABOLARIO.filter((v) => (!categoria || v.categoria === categoria))
      .filter((v) => !q || normalizza(`${v.termine} ${v.inglese} ${v.definizione}`).includes(q))
      .sort((a, b) => a.termine.localeCompare(b.termine, 'it'));
  }, [cerca, categoria]);

  const lettere = [...new Set(voci.map((v) => normalizza(v.termine)[0].toUpperCase()))];
  let letteraPrec = '';

  return (
    <main className="main main--historical academy">
      <p className="academy__briciole"><Link to="/academy">Academy</Link> / Vocabolario</p>
      <h1>Vocabolario della Formula 1</h1>
      <p className="academy__intro">
        {VOCABOLARIO.length} termini, anche in inglese come li senti in radio e in telecronaca. Le voci tecniche seguono il
        regolamento 2026.
      </p>

      <div className="vocabolario__filtri">
        <input
          type="search"
          placeholder="Cerca un termine, anche in inglese…"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          aria-label="Cerca nel vocabolario"
        />
        <div className="vocabolario__categorie" role="group" aria-label="Categorie">
          <button type="button" className={!categoria ? 'attiva' : ''} onClick={() => setCategoria('')}>Tutte</button>
          {CATEGORIE_VOCABOLARIO.map((c) => (
            <button key={c} type="button" className={categoria === c ? 'attiva' : ''} onClick={() => setCategoria(c)}>{c}</button>
          ))}
        </div>
        {lettere.length > 1 && (
          <nav className="vocabolario__lettere" aria-label="Indice alfabetico">
            {lettere.map((l) => <a key={l} href={`#lettera-${l}`}>{l}</a>)}
          </nav>
        )}
      </div>

      {voci.length === 0 && <p className="historical-standings__stato">Nessun termine trovato.</p>}
      <dl className="vocabolario__lista">
        {voci.map((v, i) => {
          const lettera = normalizza(v.termine)[0].toUpperCase();
          const nuova = lettera !== letteraPrec;
          letteraPrec = lettera;
          return (
            <div key={v.id} id={v.id} className={`vocabolario__voce ${hash === `#${v.id}` ? 'vocabolario__voce--evidenziata' : ''}`}>
              {nuova && <span id={`lettera-${lettera}`} className="vocabolario__lettera">{lettera}</span>}
              <dt>
                {v.termine}
                {v.inglese && <span className="vocabolario__inglese">{v.inglese}</span>}
                <span className="vocabolario__categoria">{v.categoria}</span>
              </dt>
              <dd>
                <p>{v.definizione}</p>
                <p className="vocabolario__esempio">«{v.esempio}»</p>
              </dd>
              {i === 14 && <SpazioAdv formato="rettangolo" />}
            </div>
          );
        })}
      </dl>
    </main>
  );
}
