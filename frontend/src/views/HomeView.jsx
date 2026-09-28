import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeView.css';
import GlassPanel from '../components/GlassPanel.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import PreviewBadge from '../components/PreviewBadge.jsx';
import LoSapeviWidget from '../components/LoSapeviWidget.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { ANNO_MASSIMO } from '../components/HistoricalStandings.jsx';
import heroFoto from '../assets/hero/home-hero.jpg';
import { CIRCUIT_PHOTOS } from '../data/circuitPhotos.js';
import { MOCK_NEWS } from '../data/homeMock.js';
import { SITO } from '../config/sito.js';
import { FlagIcon } from '../utils/flags.jsx';
import { useStagioneCorrente, useProssimaGara, ordinaCalendario } from '../hooks/useStagioneCorrente.js';
import {
  formattaDataBreve,
  formattaDataLunga,
  formattaPunti,
  riepilogoCircuito,
  testoQuandoGara,
  vantaggiSulSuccessivo,
} from '../utils/stagione.js';

const ANNO_IN_CORSO = ANNO_MASSIMO;
const RIGHE_CLASSIFICA_PILOTI = 10;
const FORMATO_ORARIO = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Dopo qualche secondo di attesa spiega perché: il server gratuito si
 * "addormenta" e al primo accesso può metterci fino a un minuto a ripartire. */
function useAttesaLunga(inCaricamento) {
  const [lunga, setLunga] = useState(false);
  useEffect(() => {
    if (!inCaricamento) {
      setLunga(false);
      return undefined;
    }
    const timer = setTimeout(() => setLunga(true), 8000);
    return () => clearTimeout(timer);
  }, [inCaricamento]);
  return lunga;
}

/** Messaggio per i blocchi non ancora pronti: mai dati finti al loro posto. */
function StatoBlocco({ stato, cosa }) {
  const attesaLunga = useAttesaLunga(stato === 'carico');
  if (stato === 'carico') {
    return (
      <p className="home-stato">
        Carico {cosa}…{attesaLunga && ' Il server si sta avviando, può richiedere fino a un minuto.'}
      </p>
    );
  }
  if (stato === 'errore') {
    return <p className="home-stato home-stato--errore">Non riesco a caricare {cosa} in questo momento. Riprova tra poco.</p>;
  }
  return <p className="home-stato">{cosa[0].toUpperCase() + cosa.slice(1)} non ancora disponibile.</p>;
}

/**
 * HomeView (/) — home dinamica del portale.
 *
 * DATI VERI (dal nostro backend, gli stessi dell'archivio storico):
 *   - classifica piloti e scuderie della stagione in corso, con il vantaggio
 *     in punti sul classificato subito dopo;
 *   - focus sulla prossima gara: scelta in automatico dal calendario (la
 *     prima per data da oggi in avanti), con scheda del circuito e, se OpenF1
 *     lo ha già pubblicato, il programma del weekend in ordine cronologico;
 *   - calendario: prossime gare in alto, le già disputate sotto (le più
 *     vecchie in fondo).
 * Quando un dato non è disponibile si dice, non si inventa.
 *
 * Restano di ESEMPIO, segnate <PreviewBadge>, solo le News (fonte da scegliere).
 * "Lo sapevi che" è contenuto reale verificato sul database (loSapevi.js).
 */
export default function HomeView() {
  const { piloti, scuderie, calendario } = useStagioneCorrente(ANNO_IN_CORSO);
  const { prossime, disputate } = calendario.dati
    ? ordinaCalendario(calendario.dati)
    : { prossime: [], disputate: [] };
  const prossimaGara = prossime[0] || null;
  const { circuito, programma } = useProssimaGara(prossimaGara, ANNO_IN_CORSO);

  const vantaggiPiloti = piloti.dati ? vantaggiSulSuccessivo(piloti.dati) : [];
  const vantaggiScuderie = scuderie.dati ? vantaggiSulSuccessivo(scuderie.dati) : [];

  const scheda = circuito.dati;
  const fatti = scheda ? riepilogoCircuito(scheda) : null;
  const foto = prossimaGara ? (CIRCUIT_PHOTOS[prossimaGara.circuito] || [])[0] : null;

  return (
    <main className="main home-view">
      {/* ---------- HERO ---------- */}
      <section className="home-hero">
        <img className="home-hero__foto" src={heroFoto} alt="" aria-hidden="true" />
        <div className="home-hero__scrim" />
        <div className="home-hero__content">
          <p className="home-hero__kicker">{SITO.nome} — {SITO.slogan}</p>
          <h1 className="home-hero__titolo">Ogni stagione. Ogni pilota. Ogni circuito.</h1>
          <p className="home-hero__sottotitolo">
            Dalle prime gare del 1950 al mondiale in corso: risultati, classifiche e statistiche di Formula 1
            in un unico posto.
          </p>
          <div className="home-hero__azioni">
            <Link to="/archivio/1950" className="home-hero__cta home-hero__cta--primaria">
              Esplora l'archivio storico
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-section--ad">
        <AdSlot formato="leaderboard" />
      </section>

      {/* ---------- LO SAPEVI CHE (contenuto reale, non mockup) ---------- */}
      <section className="home-section">
        <LoSapeviWidget />
      </section>

      {/* ---------- CLASSIFICA ANNO IN CORSO ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Classifica {ANNO_IN_CORSO}</h2>
          <Link to={`/archivio/${ANNO_IN_CORSO}`} className="home-section__vai">
            Classifica completa →
          </Link>
        </div>
        <div className="home-classifiche">
          <GlassPanel className="home-classifiche__col">
            <h3 className="home-classifiche__titolo">Piloti</h3>
            {piloti.stato !== 'ok' ? (
              <StatoBlocco stato={piloti.stato} cosa="la classifica piloti" />
            ) : (
              <>
                <p className="home-classifiche__legenda">Punti · vantaggio sul successivo</p>
                <ol className="home-classifiche__lista">
                  {piloti.dati.slice(0, RIGHE_CLASSIFICA_PILOTI).map((riga, i) => (
                    <li key={riga.pilota_slug}>
                      <span className="tab-num home-classifiche__pos">{i + 1}</span>
                      <Link to={`/piloti/${riga.pilota_slug}`} className="home-classifiche__nome">
                        <FlagIcon codiceIso2={riga.nazione_codice} /> {riga.pilota}
                      </Link>
                      <span className="tab-num home-classifiche__punti">{formattaPunti(riga.punti_totali)}</span>
                      <span
                        className="tab-num home-classifiche__vantaggio"
                        title={
                          vantaggiPiloti[i] === null
                            ? undefined
                            : `${vantaggiPiloti[i]} punti di vantaggio su ${piloti.dati[i + 1].pilota}`
                        }
                      >
                        {vantaggiPiloti[i] === null ? '' : `+${formattaPunti(vantaggiPiloti[i])}`}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </GlassPanel>
          <GlassPanel className="home-classifiche__col">
            <h3 className="home-classifiche__titolo">Scuderie</h3>
            {scuderie.stato !== 'ok' ? (
              <StatoBlocco stato={scuderie.stato} cosa="la classifica scuderie" />
            ) : (
              <>
                <p className="home-classifiche__legenda">Punti · vantaggio sul successivo</p>
                <ol className="home-classifiche__lista">
                  {scuderie.dati.map((riga, i) => (
                    <li key={riga.scuderia_slug}>
                      <span className="tab-num home-classifiche__pos">{i + 1}</span>
                      <Link to={`/scuderie/${riga.scuderia_slug}`} className="home-classifiche__nome">
                        <TeamBadge team={riga.scuderia} size="sm" /> {riga.scuderia}
                      </Link>
                      <span className="tab-num home-classifiche__punti">{formattaPunti(riga.punti_totali)}</span>
                      <span
                        className="tab-num home-classifiche__vantaggio"
                        title={
                          vantaggiScuderie[i] === null
                            ? undefined
                            : `${vantaggiScuderie[i]} punti di vantaggio su ${scuderie.dati[i + 1].scuderia}`
                        }
                      >
                        {vantaggiScuderie[i] === null ? '' : `+${formattaPunti(vantaggiScuderie[i])}`}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </GlassPanel>
        </div>
      </section>

      {/* ---------- FOCUS ON PROSSIMA GARA ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Focus on: prossima gara</h2>
        </div>
        {calendario.stato !== 'ok' && (
          <GlassPanel className="home-focus__vuoto">
            <StatoBlocco stato={calendario.stato} cosa="il calendario" />
          </GlassPanel>
        )}
        {calendario.stato === 'ok' && !prossimaGara && (
          <GlassPanel className="home-focus__vuoto">
            <p className="home-stato">La stagione {ANNO_IN_CORSO} è conclusa: nessuna gara in programma.</p>
          </GlassPanel>
        )}
        {prossimaGara && (
          <GlassPanel className="home-focus">
            {foto && (
              <figure className="home-focus__mappa">
                {/* Sfondo bianco: le mappe sono SVG con linee scure, illeggibili sul tema scuro. */}
                <img className="home-focus__foto" src={foto.src} alt={foto.alt} loading="lazy" />
                <figcaption className="home-focus__credito">
                  Mappa: {foto.autore} /{' '}
                  <a href={foto.fonteUrl} target="_blank" rel="noreferrer noopener">
                    {foto.licenzaLabel}
                  </a>
                </figcaption>
              </figure>
            )}
            <div className="home-focus__corpo">
              <p className="home-focus__data">
                {formattaDataLunga(prossimaGara.data_gara)}
                {testoQuandoGara(prossimaGara.giorni) && (
                  <span className="home-focus__quando"> · {testoQuandoGara(prossimaGara.giorni)}</span>
                )}
              </p>
              <h3 className="home-focus__titolo">{prossimaGara.nome_gp}</h3>
              <p className="home-focus__localita">
                {scheda?.nazione_codice && <FlagIcon codiceIso2={scheda.nazione_codice} />}{' '}
                {scheda?.localita || (circuito.stato === 'carico' ? 'Carico i dettagli del circuito…' : '')}
                {prossimaGara.ha_sprint && <span className="home-focus__sprint">Weekend Sprint</span>}
              </p>

              {fatti && (
                <ul className="home-focus__dati">
                  {fatti.lunghezzaKm && (
                    <li>
                      <strong>{fatti.lunghezzaKm} km</strong> lunghezza pista
                    </li>
                  )}
                  {fatti.curve && (
                    <li>
                      <strong>{fatti.curve}</strong> curve
                    </li>
                  )}
                  {fatti.primaEdizione && (
                    <li>
                      In F1 dal <strong>{fatti.primaEdizione}</strong> · {fatti.edizioni} Gran Premi
                    </li>
                  )}
                  {fatti.ultima && (
                    <li>
                      Ultimo vincitore ({fatti.ultima.anno}):{' '}
                      <Link to={`/piloti/${fatti.ultima.vincitore_slug}`}>
                        <strong>{fatti.ultima.vincitore}</strong>
                      </Link>
                    </li>
                  )}
                  {fatti.record && (
                    <li>
                      Più vittorie:{' '}
                      <Link to={`/piloti/${fatti.record.pilota_slug}`}>
                        <strong>{fatti.record.pilota}</strong>
                      </Link>{' '}
                      ({fatti.record.vittorie})
                    </li>
                  )}
                </ul>
              )}

              {programma && (
                <div className="home-programma">
                  <h4 className="home-programma__titolo">Programma del weekend</h4>
                  <ol className="home-programma__lista">
                    {programma.map((sessione) => (
                      <li key={sessione.chiave}>
                        <span className="home-programma__nome">{sessione.nome}</span>
                        <span className="tab-num home-programma__ora">{FORMATO_ORARIO.format(sessione.inizio)}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="home-programma__nota">
                    Orari nel tuo fuso orario ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
                  </p>
                </div>
              )}

              <Link to={`/circuiti/${prossimaGara.circuito}`} className="home-focus__link">
                Scheda del circuito ↗
              </Link>
            </div>
          </GlassPanel>
        )}
      </section>

      {/* ---------- CALENDARIO ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Calendario {ANNO_IN_CORSO}</h2>
        </div>
        <GlassPanel>
          {calendario.stato !== 'ok' ? (
            <StatoBlocco stato={calendario.stato} cosa="il calendario" />
          ) : (
            <>
              {prossime.length > 0 && (
                <>
                  <h3 className="home-calendario__gruppo">Prossime gare</h3>
                  <ul className="home-calendario">
                    {prossime.map((gara, i) => (
                      <li
                        key={gara.circuito + gara.data_gara}
                        className={`home-calendario__riga home-calendario__riga--${i === 0 ? 'prossima' : 'futura'}`}
                      >
                        <span className="tab-num home-calendario__round">{gara.round}</span>
                        <span className="home-calendario__data">{formattaDataBreve(gara.data_gara)}</span>
                        <Link to={`/circuiti/${gara.circuito}`} className="home-calendario__nome">
                          {gara.nome_gp}
                          {gara.ha_sprint && <span className="home-calendario__sprint">Sprint</span>}
                        </Link>
                        {i === 0 && (
                          <span className="badge badge--live">{gara.giorni === 0 ? 'Oggi' : 'Prossima'}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {disputate.length > 0 && (
                <>
                  <h3 className="home-calendario__gruppo">Gare disputate</h3>
                  <ul className="home-calendario">
                    {disputate.map((gara) => (
                      <li
                        key={gara.circuito + gara.data_gara}
                        className="home-calendario__riga home-calendario__riga--disputato"
                      >
                        <span className="tab-num home-calendario__round">{gara.round}</span>
                        <span className="home-calendario__data">{formattaDataBreve(gara.data_gara)}</span>
                        <Link to={`/archivio/${ANNO_IN_CORSO}/${gara.circuito}`} className="home-calendario__nome">
                          {gara.nome_gp}
                          {gara.ha_sprint && <span className="home-calendario__sprint">Sprint</span>}
                        </Link>
                        <span className="badge badge--finished">Disputata</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </GlassPanel>
      </section>

      <section className="home-section home-section--ad">
        <AdSlot formato="billboard" />
      </section>

      {/* ---------- NEWS ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">News</h2>
          <PreviewBadge>Fonte da definire</PreviewBadge>
        </div>
        <div className="home-news__grid">
          {MOCK_NEWS.map((n) => (
            <GlassPanel key={n.id} className="home-news__card">
              <h3 className="home-news__titolo">{n.titolo}</h3>
              <p className="home-news__estratto">{n.estratto}</p>
              <p className="home-news__fonte">{n.fonteLabel}</p>
            </GlassPanel>
          ))}
        </div>
        <Link to="/news" className="home-news__vai-a-news">
          Vai alla sezione News completa →
        </Link>
      </section>
    </main>
  );
}
