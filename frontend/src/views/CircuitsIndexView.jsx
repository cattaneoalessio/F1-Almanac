import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getElencoCircuiti } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './CircuitsIndexView.css';

/** Indice di tutti i circuiti nel database: /circuiti */
export default function CircuitsIndexView() {
  const [circuiti, setCircuiti] = useState([]);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | errore

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

  return (
    <main className="main main--historical">
      <div className="topbar">
        <div className="topbar__title">
          <CircuitArt size={34} />
          <h1 style={{ fontSize: '1.4rem' }}>Circuiti</h1>
        </div>
        <div className="topbar__meta">Tutti i tracciati presenti nell'archivio</div>
      </div>

      {stato === 'caricamento' && <p className="historical-standings__stato">Carico l'elenco…</p>}
      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'pronto' && (
        <div className="circuits-index__grid">
          {circuiti.map((c) => (
            <Link key={c.slug} to={`/circuiti/${c.slug}`} className="circuits-index__card-link">
              <GlassPanel className="circuits-index__card">
                <CircuitArt size={40} />
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
