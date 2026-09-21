import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import CircuitIcon from '../components/CircuitIcon.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import PhotoBand from '../components/PhotoBand.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getElencoCircuiti } from '../api/backend.js';
import fotoTopband from '../assets/topbands/circuiti.jpg';
import '../components/HistoricalStandings.css';
import './CircuitsIndexView.css';

/** Indice di tutti i circuiti nel database: /circuiti */
export default function CircuitsIndexView() {
  const [circuiti, setCircuiti] = useState([]);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | errore
  const [ricerca, setRicerca] = useState('');

  useEffect(() => {
    let annullato = false;
    getElencoCircuiti()
      .then((dati) => {
        if (!annullato) {
          setCircuiti(dati || []);
          setStato('pronto');
        }
      })
      .catch((errore) => {
        if (!annullato) {
          console.error('Errore nel caricare l\'elenco circuiti:', errore);
          setStato('errore');
        }
      });
    return () => {
      annullato = true;
    };
  }, []);

  // Filtro live per nome circuito, nazione o città: confronto senza
  // maiuscole/accenti così "citta" trova anche "Città" e "monaco" trova
  // "Monaco". La lista è già tutta caricata in memoria (max ~80 righe),
  // quindi filtrare lato client a ogni carattere digitato è immediato,
  // niente richieste aggiuntive al backend.
  const normalizza = (testo) =>
    (testo || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();

  const circuitiFiltrati = useMemo(() => {
    const query = normalizza(ricerca.trim());
    if (!query) return circuiti;
    return circuiti.filter((c) =>
      [c.nome, c.nazione_nome, c.localita].some((campo) => normalizza(campo).includes(query))
    );
  }, [circuiti, ricerca]);

  return (
    <main className="main main--historical">
      <PhotoBand src={fotoTopband} objectPosition="left 30%">
        <div className="topbar">
          <div className="topbar__title">
            <CircuitArt size={34} />
            <h1 style={{ fontSize: '1.4rem' }}>Circuiti</h1>
          </div>
          <div className="topbar__meta">Tutti i tracciati presenti nell'archivio</div>
        </div>
      </PhotoBand>

      <div className="main--historical__ad">
        <AdSlot width={300} height={250} />
      </div>

      {stato === 'pronto' && (
        <label className="circuits-index__search">
          <span className="circuits-index__search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Cerca per circuito, nazione o città…"
            value={ricerca}
            onChange={(evento) => setRicerca(evento.target.value)}
            aria-label="Cerca circuito per nome, nazione o città"
          />
        </label>
      )}

      {stato === 'caricamento' && <p className="historical-standings__stato">Carico l'elenco…</p>}
      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'pronto' && circuitiFiltrati.length === 0 && (
        <p className="historical-standings__stato">Nessun circuito trovato per "{ricerca}".</p>
      )}

      {stato === 'pronto' && circuitiFiltrati.length > 0 && (
        <div className="circuits-index__grid">
          {circuitiFiltrati.map((c) => (
            <Link key={c.slug} to={`/circuiti/${c.slug}`} className="circuits-index__card-link">
              <GlassPanel className="circuits-index__card">
                <CircuitIcon slug={c.slug} size={40} />
                <div>
                  <div className="circuits-index__nome">{c.nome}</div>
                  <div className="circuits-index__localita">
                    <FlagIcon codiceIso2={c.nazione_codice} /> {c.localita}
                  </div>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
