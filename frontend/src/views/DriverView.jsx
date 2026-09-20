import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import DriverAvatar from '../components/DriverAvatar.jsx';
import Pagination from '../components/Pagination.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getSchedaPilota } from '../api/backend.js';
import { ordinaDescPerAnno } from '../utils/sortByDate.js';
import { paragrafareBiografia } from '../utils/paragrafare.js';
import usePagination from '../hooks/usePagination.js';
import '../components/HistoricalStandings.css';
import '../components/Pagination.css';
import './CircuitView.css';
import './DriverView.css';

function formatAnni(dataNascita, dataMorte) {
  const anno = (iso) => (iso ? iso.slice(0, 4) : null);
  const nascita = anno(dataNascita);
  const morte = anno(dataMorte);
  if (!nascita && !morte) return null;
  if (nascita && morte) return `${nascita}–${morte}`;
  if (nascita) return `n. ${nascita}`;
  return `† ${morte}`;
}

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

  // Entrambe le tabelle vanno mostrate in ordine decrescente per anno
  // (la gara più recente in cima), poi paginate a 10 righe per pagina.
  const risultatiOrdinati = useMemo(
    () => (scheda ? ordinaDescPerAnno(scheda.risultati) : []),
    [scheda]
  );
  const vittorie = useMemo(
    () => ordinaDescPerAnno(risultatiOrdinati.filter((r) => r.posizione === 1)),
    [risultatiOrdinati]
  );

  const paginazionePiazzamenti = usePagination(risultatiOrdinati, 10);
  const paginazioneVittorie = usePagination(vittorie, 10);

  const paragrafiBiografia = useMemo(
    () => (scheda ? paragrafareBiografia(scheda.biografia) : []),
    [scheda]
  );

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
            <DriverAvatar size={64} team={scheda.ultima_scuderia} />
            <div>
              <h1 className="driver-view__nome">
                <FlagIcon codiceIso2={scheda.nazione_codice} /> {scheda.pilota}
                {formatAnni(scheda.data_nascita, scheda.data_morte) && (
                  <span className="driver-view__anni">{formatAnni(scheda.data_nascita, scheda.data_morte)}</span>
                )}
              </h1>
              <p className="driver-view__sottotitolo">
                {scheda.punti_totali_carriera} punti in carriera · {scheda.vittorie_totali} vittorie ·{' '}
                {scheda.gare_totali} gare
                {scheda.ultima_scuderia ? ` · ultima scuderia: ${scheda.ultima_scuderia}` : ''}
              </p>
              {scheda.url_wikipedia && (
                <p className="driver-view__wiki">
                  <a href={scheda.url_wikipedia} target="_blank" rel="noreferrer">
                    Approfondisci su Wikipedia ↗
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="circuit-view__grid">
            <GlassPanel>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Biografia
              </h2>
              {scheda.biografia ? (
                paragrafiBiografia.map((paragrafo, indice) => (
                  <p className="driver-view__testo" key={`bio-par-${indice}`}>
                    {paragrafo}
                  </p>
                ))
              ) : (
                <p className="historical-standings__stato">
                  Non abbiamo ancora abbastanza fonti pubbliche affidabili per una biografia di questo pilota:
                  qui sotto trovi comunque tutti i suoi dati di gara reali.
                </p>
              )}
            </GlassPanel>

            <GlassPanel>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Curiosità
              </h2>
              {scheda.curiosita ? (
                <p className="driver-view__testo">{scheda.curiosita}</p>
              ) : (
                <p className="historical-standings__stato">Nessuna curiosità verificata disponibile per ora.</p>
              )}
            </GlassPanel>
          </div>

          <GlassPanel style={{ marginTop: '1.2rem' }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              Vittorie
            </h2>
            {vittorie.length === 0 ? (
              <p className="historical-standings__stato">Nessuna vittoria registrata.</p>
            ) : (
              <div className="historical-standings__table-wrap">
                <table className="historical-standings__table">
                  <thead>
                    <tr>
                      <th scope="col">Anno</th>
                      <th scope="col">Gran Premio</th>
                      <th scope="col">Costruttore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginazioneVittorie.righePagina.map((riga, indice) => (
                      <tr key={`vittoria-${riga.anno}-${riga.circuito}-${indice}`}>
                        <td className="tab-num">{riga.anno}</td>
                        <td>
                          <Link to={`/archivio/${riga.anno}/${riga.circuito}`}>{riga.nome_gp}</Link>
                        </td>
                        <td>{riga.costruttore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  pagina={paginazioneVittorie.pagina}
                  totalePagine={paginazioneVittorie.totalePagine}
                  onCambiaPagina={paginazioneVittorie.setPagina}
                />
              </div>
            )}
          </GlassPanel>

          <GlassPanel style={{ marginTop: '1.2rem' }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              Piazzamenti
            </h2>
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
                  {paginazionePiazzamenti.righePagina.map((riga, indice) => (
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
              <Pagination
                pagina={paginazionePiazzamenti.pagina}
                totalePagine={paginazionePiazzamenti.totalePagine}
                onCambiaPagina={paginazionePiazzamenti.setPagina}
              />
            </div>
          </GlassPanel>
        </>
      )}
    </main>
  );
}
