import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TeamBadge from '../components/TeamBadge.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getElencoScuderie } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './ScuderiesIndexView.css';

/** Indice di tutte le scuderie nel database: /scuderie */
export default function ScuderiesIndexView() {
  const [scuderie, setScuderie] = useState([]);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | errore

  useEffect(() => {
    let annullato = false;
    getElencoScuderie()
      .then((dati) => {
        if (!annullato) {
          setScuderie(dati || []);
          setStato('pronto');
        }
      })
      .catch((errore) => {
        if (!annullato) {
          console.error("Errore nel caricare l'elenco scuderie:", errore);
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
          <h1 style={{ fontSize: '1.4rem' }}>Scuderie</h1>
        </div>
        <div className="topbar__meta">Tutte le scuderie presenti nell'archivio</div>
      </div>

      {stato === 'caricamento' && <p className="historical-standings__stato">Carico l'elenco…</p>}
      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'pronto' && (
        <div className="scuderie-index__grid">
          {scuderie.map((s) => (
            <Link key={s.slug} to={`/scuderie/${s.slug}`} className="scuderie-index__card-link">
              <GlassPanel className="scuderie-index__card">
                <TeamBadge team={s.nome} />
                <div>
                  <div className="scuderie-index__nome">{s.nome}</div>
                  {s.nazione_codice && (
                    <div className="scuderie-index__nazione">
                      <FlagIcon codiceIso2={s.nazione_codice} />
                    </div>
                  )}
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
