import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DriverAvatar from '../components/DriverAvatar.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getElencoPiloti } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './PilotsIndexView.css';

/** Indice di tutti i piloti nel database, con i totali di carriera: /piloti
 *
 * A differenza di /circuiti (poche decine di voci), l'elenco piloti è
 * destinato a crescere molto (già 77 solo con la stagione 1950 importata):
 * per questo c'è un campo di ricerca, filtrato lato client visto che
 * l'elenco intero viene comunque scaricato in un'unica chiamata. Se in
 * futuro l'elenco diventasse troppo grande per scaricarlo tutto insieme,
 * andrà spostato lato server (paginazione/ricerca via API). */
export default function PilotsIndexView() {
  const [piloti, setPiloti] = useState([]);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | errore
  const [ricerca, setRicerca] = useState('');

  useEffect(() => {
    let annullato = false;
    getElencoPiloti()
      .then((dati) => {
        if (!annullato) {
          setPiloti(dati || []);
          setStato('pronto');
        }
      })
      .catch((errore) => {
        if (!annullato) {
          console.error("Errore nel caricare l'elenco piloti:", errore);
          setStato('errore');
        }
      });
    return () => {
      annullato = true;
    };
  }, []);

  const pilotiFiltrati = useMemo(() => {
    const termine = ricerca.trim().toLowerCase();
    if (!termine) return piloti;
    return piloti.filter((p) => p.pilota.toLowerCase().includes(termine));
  }, [piloti, ricerca]);

  return (
    <main className="main main--historical">
      <div className="topbar">
        <div className="topbar__title">
          <DriverAvatar size={34} />
          <h1 style={{ fontSize: '1.4rem' }}>Piloti</h1>
        </div>
        <div className="topbar__meta">{piloti.length} piloti nell'archivio</div>
      </div>

      {stato === 'pronto' && (
        <input
          type="search"
          className="pilots-index__ricerca"
          placeholder="Cerca un pilota per nome…"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          aria-label="Cerca un pilota per nome"
        />
      )}

      {stato === 'caricamento' && <p className="historical-standings__stato">Carico l'elenco…</p>}
      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'pronto' && pilotiFiltrati.length === 0 && (
        <p className="historical-standings__stato">Nessun pilota trovato per &quot;{ricerca}&quot;.</p>
      )}

      {stato === 'pronto' && pilotiFiltrati.length > 0 && (
        <div className="pilots-index__grid">
          {pilotiFiltrati.map((p) => (
            <Link key={p.slug} to={`/piloti/${p.slug}`} className="pilots-index__card-link">
              <GlassPanel className="pilots-index__card">
                <DriverAvatar size={40} />
                <div>
                  <div className="pilots-index__nome">
                    <FlagIcon codiceIso2={p.nazione_codice} /> {p.pilota}
                  </div>
                  <div className="pilots-index__stats">
                    {p.gare_totali} {p.gare_totali === 1 ? 'gara' : 'gare'}
                    {p.vittorie_totali > 0 && (
                      <> · {p.vittorie_totali} {p.vittorie_totali === 1 ? 'vittoria' : 'vittorie'}</>
                    )}
                    {' · '}
                    {p.punti_totali_carriera} pt
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
