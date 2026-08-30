import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import DriverAvatar from '../components/DriverAvatar.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getSchedaPilota } from '../api/backend.js';
import '../components/HistoricalStandings.css';
import './DriverView.css';

/** Scheda di carriera di un pilota: /piloti/:slug */
export default function DriverView() {
  const { slug } = useParams();
  const [scheda, setScheda] = useState(null);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | vuoto | errore

  useEffect(() => {
    let annullato = false;
    setStato('caricamento');

    getSchedaPilota(slug)
      .then((dati) => {
        if (annullato) return;
        if (dati === null) {
          setScheda(null);
          setStato('vuoto');
          return;
        }
        setScheda(dati);
        setStato('pronto');
      })
      .catch((errore) => {
        if (annullato) return;
        console.error('Errore nel caricare la scheda pilota:', errore);
        setStato('errore');
      });

    return () => {
      annullato = true;
    };
  }, [slug]);

  return (
    <main className="main main--historical">
      {stato === 'caricamento' && <p className="historical-standings__stato">Carico la scheda pilota…</p>}

      {stato === 'errore' && (
        <p className="historical-standings__stato historical-standings__stato--errore">
          Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
        </p>
      )}

      {stato === 'vuoto' && (
        <p className="historical-standings__stato">Nessun pilota trovato con questo indirizzo.</p>
      )}

      {stato === 'pronto' && (
        <>
          <div className="driver-view__header">
            <DriverAvatar size={64} />
            <div>
              <h1 className="driver-view__nome">
                <FlagIcon codiceIso2={scheda.nazione_codice} /> {scheda.pilota}
              </h1>
              <p className="driver-view__sottotitolo">
                {scheda.punti_totali_carriera} punti in carriera · {scheda.vittorie_totali} vittorie ·{' '}
                {scheda.gare_totali} gare
              </p>
            </div>
          </div>

          <GlassPanel>
            <div className="historical-standings__table-wrap">
              <table className="historical-standings__table">
                <thead>
                  <tr>
                    <th scope="col">Anno</th>
                    <th scope="col">Gran Premio</th>
                    <th scope="col">Costruttore</th>
                    <th scope="col">Posizione</th>
                    <th scope="col">Punti</th>
                  </tr>
                </thead>
                <tbody>
                  {scheda.risultati.map((riga, indice) => (
                    <tr key={`${riga.anno}-${riga.circuito}-${indice}`}>
                      <td className="tab-num">{riga.anno}</td>
                      <td>
                        <Link to={`/archivio/${riga.anno}/${riga.circuito}`}>{riga.nome_gp}</Link>
                      </td>
                      <td>{riga.costruttore}</td>
                      <td className="tab-num">{riga.posizione ?? riga.posizione_testo ?? 'Rit.'}</td>
                      <td className="tab-num">{riga.punti}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </>
      )}
    </main>
  );
}
