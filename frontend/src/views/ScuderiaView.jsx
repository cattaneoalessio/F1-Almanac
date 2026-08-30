import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TeamBadge from '../components/TeamBadge.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getSchedaScuderia } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './CircuitView.css';

/** Scheda di una scuderia: /scuderie/:slug */
export default function ScuderiaView() {
  const { slug } = useParams();
  const [scheda, setScheda] = useState(null);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | vuoto | errore

  useEffect(() => {
    let annullato = false;
    setStato('caricamento');

    getSchedaScuderia(slug)
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
        console.error('Errore nel caricare la scheda scuderia:', errore);
        setStato('errore');
      });

    return () => {
      annullato = true;
    };
  }, [slug]);

  return (
    <main className="main main--historical">
      {stato === 'caricamento' && <p className="historical-standings__stato">Carico la scheda scuderia…</p>}

      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'vuoto' && (
        <p className="historical-standings__stato">Nessuna scuderia trovata con questo indirizzo.</p>
      )}

      {stato === 'pronto' && (
        <>
          <div className="circuit-view__header">
            <TeamBadge team={scheda.nome} size="lg" />
            <div>
              <h1 className="circuit-view__nome">{scheda.nome}</h1>
              <p className="circuit-view__sottotitolo">
                <FlagIcon codiceIso2={scheda.nazione_codice} />
                {scheda.gare_totali} {scheda.gare_totali === 1 ? 'gara' : 'gare'} ·{' '}
                {scheda.vittorie_totali} {scheda.vittorie_totali === 1 ? 'vittoria' : 'vittorie'} ·{' '}
                {scheda.punti_totali} punti
              </p>
            </div>
          </div>

          {scheda.gare.length === 0 ? (
            <GlassPanel>
              <p className="historical-standings__stato">
                Nessun risultato ancora importato per questa scuderia.
              </p>
            </GlassPanel>
          ) : (
            <div className="circuit-view__grid">
              <GlassPanel>
                <h2 className="section-title" style={{ marginTop: 0 }}>
                  Gare disputate
                </h2>
                <div className="historical-standings__table-wrap">
                  <table className="historical-standings__table">
                    <thead>
                      <tr>
                        <th scope="col">Anno</th>
                        <th scope="col">Gran Premio</th>
                        <th scope="col">Pos.</th>
                        <th scope="col">Miglior pilota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheda.gare.map((gara) => (
                        <tr key={`${gara.anno}-${gara.nome_gp}`}>
                          <td className="tab-num">{gara.anno}</td>
                          <td>
                            <Link to={`/archivio/${gara.anno}/${gara.circuito}`}>{gara.nome_gp}</Link>
                          </td>
                          <td className="tab-num">
                            {gara.miglior_posizione ?? gara.miglior_posizione_testo ?? 'Rit.'}
                          </td>
                          <td>
                            {gara.miglior_pilota_slug ? (
                              <Link to={`/piloti/${gara.miglior_pilota_slug}`}>{gara.miglior_pilota}</Link>
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
                  Piloti
                </h2>
                <div className="historical-standings__table-wrap">
                  <table className="historical-standings__table">
                    <thead>
                      <tr>
                        <th scope="col">Pilota</th>
                        <th scope="col">Gare</th>
                        <th scope="col">Vittorie</th>
                        <th scope="col">Punti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheda.piloti.map((voce) => (
                        <tr key={voce.pilota_slug}>
                          <td>
                            <Link to={`/piloti/${voce.pilota_slug}`} className="historical-standings__pilota">
                              <FlagIcon codiceIso2={voce.nazione_codice} />
                              {voce.pilota}
                            </Link>
                          </td>
                          <td className="tab-num">{voce.gare}</td>
                          <td className="tab-num">{voce.vittorie}</td>
                          <td className="tab-num">{voce.punti}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            </div>
          )}
        </>
      )}
    </main>
  );
}
