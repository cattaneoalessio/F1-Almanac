import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getSchedaCircuito } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './CircuitView.css';

/** Scheda di un circuito: /circuiti/:slug */
export default function CircuitView() {
  const { slug } = useParams();
  const [scheda, setScheda] = useState(null);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | vuoto | errore

  useEffect(() => {
    let annullato = false;
    setStato('caricamento');

    getSchedaCircuito(slug)
      .then((dati) => {
        if (annullato) return;
        if (dati === null) {
          setStato('vuoto');
          return;
        }
        setScheda(dati);
        setStato('pronto');
      })
      .catch((errore) => {
        if (annullato) return;
        console.error('Errore nel caricare la scheda circuito:', errore);
        setStato('errore');
      });

    return () => {
      annullato = true;
    };
  }, [slug]);

  return (
    <main className="main main--historical">
      {stato === 'caricamento' && <p className="historical-standings__stato">Carico la scheda circuito…</p>}

      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'vuoto' && (
        <p className="historical-standings__stato">Nessun circuito trovato con questo indirizzo.</p>
      )}

      {stato === 'pronto' && (
        <>
          <div className="circuit-view__header">
            <CircuitArt size={64} />
            <div>
              <h1 className="circuit-view__nome">{scheda.nome}</h1>
              <p className="circuit-view__sottotitolo">
                <FlagIcon codiceIso2={scheda.nazione_codice} /> {scheda.localita}
                {scheda.lunghezza_km ? ` · ${scheda.lunghezza_km} km` : ''}
              </p>
            </div>
          </div>

          <div className="circuit-view__grid">
            <GlassPanel>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Gare disputate qui
              </h2>
              <div className="historical-standings__table-wrap">
                <table className="historical-standings__table">
                  <thead>
                    <tr>
                      <th scope="col">Anno</th>
                      <th scope="col">Gran Premio</th>
                      <th scope="col">Vincitore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheda.gare.map((gara) => (
                      <tr key={`${gara.anno}-${gara.nome_gp}`}>
                        <td className="tab-num">{gara.anno}</td>
                        <td>
                          <Link to={`/archivio/${gara.anno}/${slug}`}>{gara.nome_gp}</Link>
                        </td>
                        <td>
                          {gara.vincitore_slug ? (
                            <Link to={`/piloti/${gara.vincitore_slug}`}>{gara.vincitore}</Link>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>

            <GlassPanel>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Albo d'oro
              </h2>
              {scheda.albo_oro.length === 0 ? (
                <p className="historical-standings__stato">Nessuna vittoria registrata.</p>
              ) : (
                <div className="historical-standings__table-wrap">
                  <table className="historical-standings__table">
                    <thead>
                      <tr>
                        <th scope="col">Pilota</th>
                        <th scope="col">Vittorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheda.albo_oro.map((voce) => (
                        <tr key={voce.pilota_slug}>
                          <td>
                            <Link to={`/piloti/${voce.pilota_slug}`} className="historical-standings__pilota">
                              <FlagIcon codiceIso2={voce.nazione_codice} />
                              {voce.pilota}
                            </Link>
                          </td>
                          <td className="tab-num">{voce.vittorie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassPanel>
          </div>
        </>
      )}
    </main>
  );
}
