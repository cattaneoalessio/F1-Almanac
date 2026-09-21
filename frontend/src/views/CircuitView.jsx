import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CircuitIcon from '../components/CircuitIcon.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import CircuitPhotoGallery from '../components/CircuitPhotoGallery.jsx';
import Pagination from '../components/Pagination.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { getSchedaCircuito } from '../api/backend.js';
import { CIRCUIT_PHOTOS } from '../data/circuitPhotos.js';
import { ordinaDescPerDataOAnno } from '../utils/sortByDate.js';
import usePagination from '../hooks/usePagination.js';
import '../components/HistoricalStandings.css';
import '../components/Pagination.css';
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

  // Gare in ordine decrescente (la più recente in cima), paginate a
  // 10 righe come richiesto. scheda è null finché non è "pronto", ma
  // useMemo va chiamato sempre nello stesso ordine ad ogni render:
  // per questo gira su un array vuoto invece di essere condizionato.
  const gareOrdinate = useMemo(
    () => (scheda ? ordinaDescPerDataOAnno(scheda.gare) : []),
    [scheda]
  );
  const paginazioneGare = usePagination(gareOrdinate, 10);

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
            <CircuitIcon slug={slug} size={64} />
            <div>
              <h1 className="circuit-view__nome">{scheda.nome}</h1>
              <p className="circuit-view__sottotitolo">
                <FlagIcon codiceIso2={scheda.nazione_codice} /> {scheda.localita}
                {scheda.lunghezza_km ? ` · ${scheda.lunghezza_km} km` : ''}
              </p>
            </div>
          </div>

          {(scheda.indirizzo || scheda.capienza || scheda.google_maps_url) && (
            <GlassPanel style={{ marginBottom: '1.2rem' }}>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Informazioni
              </h2>
              <ul className="circuit-view__info-list">
                {scheda.indirizzo && (
                  <li>
                    <strong>Indirizzo:</strong> {scheda.indirizzo}
                    {scheda.google_maps_url && (
                      <>
                        {' '}
                        (<a href={scheda.google_maps_url} target="_blank" rel="noreferrer">apri su Google Maps ↗</a>)
                      </>
                    )}
                  </li>
                )}
                {scheda.capienza && (
                  <li>
                    <strong>Capienza:</strong> circa {scheda.capienza.toLocaleString('it-IT')} spettatori
                  </li>
                )}
                {scheda.lunghezza_km && (
                  <li>
                    <strong>Lunghezza:</strong> {scheda.lunghezza_km} km
                  </li>
                )}
              </ul>
            </GlassPanel>
          )}

          {/* BUG REALE trovato dall'utente dopo l'import 1951-1970 del
              2026-09-20: questo pannello era condizionato SOLO a
              scheda.storia (il testo di storia scritto a mano, presente
              solo per i 7 circuiti del 1950 arricchiti manualmente) —
              quindi la mappa/foto del circuito (CIRCUIT_PHOTOS[slug],
              già pronta per tutti i 78 circuiti reali) non veniva mai
              mostrata per nessuno dei circuiti creati dall'import, pur
              avendo una foto disponibile. Non era un problema di slug:
              i dati c'erano, il pannello semplicemente non si apriva.
              Corretto condizionando il pannello alla presenza di UNA
              QUALSIASI delle due cose (foto O testo storico), e
              rendendo il testo storico stesso facoltativo al suo
              interno. */}
          {(scheda.storia || CIRCUIT_PHOTOS[slug]) && (
            <GlassPanel style={{ marginBottom: '1.2rem' }}>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                {scheda.storia ? 'Storia' : 'Mappa del tracciato'}
              </h2>
              <CircuitPhotoGallery foto={CIRCUIT_PHOTOS[slug]} />
              {scheda.storia && <p className="circuit-view__testo">{scheda.storia}</p>}
            </GlassPanel>
          )}

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
                    {paginazioneGare.righePagina.map((gara) => (
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
                <Pagination
                  pagina={paginazioneGare.pagina}
                  totalePagine={paginazioneGare.totalePagine}
                  onCambiaPagina={paginazioneGare.setPagina}
                />
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

          {scheda.curve.length > 0 && (
            <GlassPanel style={{ marginTop: '1.2rem' }}>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Curve e rettilinei
              </h2>
              <div className="historical-standings__table-wrap">
                <table className="historical-standings__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Nome</th>
                      <th scope="col">Nome nel 1950</th>
                      <th scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheda.curve.map((curva) => (
                      <tr key={curva.ordine}>
                        <td className="tab-num">{curva.ordine}</td>
                        <td>
                          {curva.nome_moderno ?? <em>non più esistente</em>}
                          {curva.anno_intitolazione && (
                            <span className="circuit-view__nota-inline"> (dal {curva.anno_intitolazione})</span>
                          )}
                        </td>
                        <td>{curva.nome_1950 ?? (curva.nome_moderno ? '—' : '')}</td>
                        <td className="circuit-view__nota">{curva.nota ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          )}

          {scheda.configurazioni.length > 0 && (
            <GlassPanel style={{ marginTop: '1.2rem' }}>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Configurazioni nel tempo
              </h2>
              <div className="historical-standings__table-wrap">
                <table className="historical-standings__table">
                  <thead>
                    <tr>
                      <th scope="col">Periodo</th>
                      <th scope="col">Lunghezza</th>
                      <th scope="col">Descrizione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheda.configurazioni.map((conf) => (
                      <tr key={conf.anno_da}>
                        <td className="tab-num">
                          {conf.anno_da}–{conf.anno_a ?? 'oggi'}
                        </td>
                        <td className="tab-num">{conf.lunghezza_km ? `${conf.lunghezza_km} km` : '—'}</td>
                        <td className="circuit-view__nota">{conf.descrizione}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          )}
        </>
      )}
    </main>
  );
}
