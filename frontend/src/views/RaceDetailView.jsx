import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import PhotoBand from '../components/PhotoBand.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { getRisultatiGara } from '../api/backend.js';
import { statoGara, formattaDataGara } from '../utils/statoGara.js';
import fotoTopband from '../assets/topbands/gara.jpg';
import '../components/HistoricalStandings.css';
import './RaceDetailView.css';

/** Pagina di una singola gara storica: /archivio/:anno/:circuito */
export default function RaceDetailView() {
  const { anno, circuito } = useParams();
  const [gara, setGara] = useState(null);
  const [stato, setStato] = useState('caricamento'); // caricamento | pronto | vuoto | errore (stato di CARICAMENTO della pagina)

  useEffect(() => {
    let annullato = false;
    setStato('caricamento');

    getRisultatiGara(Number(anno), circuito)
      .then((dati) => {
        if (annullato) return;
        if (dati === null) {
          setGara(null);
          setStato('vuoto');
          return;
        }
        setGara(dati);
        setStato('pronto');
      })
      .catch((errore) => {
        if (annullato) return;
        console.error('Errore nel caricare i risultati della gara:', errore);
        setStato('errore');
      });

    return () => {
      annullato = true;
    };
  }, [anno, circuito]);

  return (
    <main className="main main--historical">
      <PhotoBand src={fotoTopband} objectPosition="center 42%">
        <div className="topbar">
          <div className="topbar__title">
            <CircuitArt size={34} />
            <h1 style={{ fontSize: '1.4rem' }}>{gara ? gara.nome_gp : 'Gara'}</h1>
          </div>
          <div className="topbar__meta">
            <Link to={`/archivio/${anno}`}>&larr; Torna alla stagione {anno}</Link>
            {' · '}
            <Link to={`/circuiti/${circuito}`}>Scheda circuito</Link>
          </div>
        </div>
      </PhotoBand>

      <div className="main--historical__ad">
        <AdSlot width={300} height={250} />
      </div>

      {gara && (() => {
        // statoQuando: quando si è disputata (o si disputerà) la gara —
        // riusa la stessa logica Disputata/Prossima già usata nell'elenco
        // gare della stagione, per coerenza in tutto il sito.
        const statoQuando = statoGara(gara.data_gara);
        const dataFormattata = formattaDataGara(gara.data_gara);
        if (!statoQuando || !dataFormattata) return null;
        return (
          <p className="race-detail__quando">
            {statoQuando === 'Disputata' ? 'Disputata il' : 'Si disputerà il'} {dataFormattata}
          </p>
        );
      })()}

      {gara && gara.commento && <p className="race-detail__commento">{gara.commento}</p>}

      <GlassPanel>
        {stato === 'caricamento' && <p className="historical-standings__stato">Carico i risultati…</p>}

        {stato === 'errore' && (
          <p className="historical-standings__stato historical-standings__stato--errore">
            Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
          </p>
        )}

        {stato === 'vuoto' && (
          <p className="historical-standings__stato">
            Nessuna gara trovata per {circuito} nella stagione {anno}.
          </p>
        )}

        {stato === 'pronto' && (
          <div className="historical-standings__table-wrap">
            <table className="historical-standings__table race-detail__table">
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Pilota</th>
                  <th scope="col">Costruttore</th>
                  <th scope="col">Giri</th>
                  <th scope="col">Tempo/Distacco</th>
                  <th scope="col">Punti</th>
                </tr>
              </thead>
              <tbody>
                {gara.risultati.map((riga) => (
                  <tr key={riga.pilota_slug}>
                    <td className="tab-num">{riga.posizione ?? riga.posizione_testo ?? 'Rit.'}</td>
                    <td>
                      <Link to={`/piloti/${riga.pilota_slug}`} className="historical-standings__pilota">
                        {riga.pilota}
                      </Link>
                      {riga.motivo_ritiro && (
                        <div className="race-detail__motivo">{riga.motivo_ritiro}</div>
                      )}
                    </td>
                    <td>{riga.costruttore}</td>
                    <td className="tab-num">{riga.giri_completati ?? '—'}</td>
                    <td className="tab-num">{riga.tempo ?? '—'}</td>
                    <td className="tab-num">{riga.punti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {stato === 'pronto' && gara.risultati_sprint && gara.risultati_sprint.length > 0 && (
        <GlassPanel style={{ marginTop: '1.2rem' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Sprint Race
          </h2>
          <div className="historical-standings__table-wrap">
            <table className="historical-standings__table race-detail__table">
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Pilota</th>
                  <th scope="col">Costruttore</th>
                  <th scope="col">Giri</th>
                  <th scope="col">Tempo/Distacco</th>
                  <th scope="col">Punti</th>
                </tr>
              </thead>
              <tbody>
                {gara.risultati_sprint.map((riga) => (
                  <tr key={`sprint-${riga.pilota_slug}`}>
                    <td className="tab-num">{riga.posizione ?? riga.posizione_testo ?? 'Rit.'}</td>
                    <td>
                      <Link to={`/piloti/${riga.pilota_slug}`} className="historical-standings__pilota">
                        {riga.pilota}
                      </Link>
                      {riga.motivo_ritiro && (
                        <div className="race-detail__motivo">{riga.motivo_ritiro}</div>
                      )}
                    </td>
                    <td>{riga.costruttore}</td>
                    <td className="tab-num">{riga.giri_completati ?? '—'}</td>
                    <td className="tab-num">{riga.tempo ?? '—'}</td>
                    <td className="tab-num">{riga.punti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}
    </main>
  );
}
