import { Link } from 'react-router-dom';
import './HomeView.css';
import GlassPanel from '../components/GlassPanel.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import PreviewBadge from '../components/PreviewBadge.jsx';
import CircuitArt from '../components/CircuitArt.jsx';
import LoSapeviWidget from '../components/LoSapeviWidget.jsx';
import AdSlot from '../components/AdSlot.jsx';
import heroFoto from '../assets/hero/home-hero.jpg';
import { CIRCUIT_PHOTOS } from '../data/circuitPhotos.js';
import {
  MOCK_CLASSIFICA_PILOTI,
  MOCK_CLASSIFICA_SCUDERIE,
  MOCK_CALENDARIO,
  MOCK_PROSSIMA_GARA,
  MOCK_NEWS,
} from '../data/homeMock.js';

const FORMATTATORE_DATA = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' });

function formattaData(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : FORMATTATORE_DATA.format(d);
}

/**
 * HomeView (/) — home dinamica del portale (Fase E), separata
 * dall'archivio storico che prima viveva su "/" (ora su /archivio/:anno
 * e raggiungibile dal tab "Archivio storico").
 *
 * STATO: MOCKUP per una prima revisione visiva, come concordato — non
 * tutte le sezioni hanno una fonte dati reale dietro:
 *   - Classifica piloti/scuderie "dell'anno in corso", Calendario e
 *     Focus on prossima gara: usano dati di ESEMPIO (src/data/homeMock.js)
 *     perché il sito oggi importa solo stagioni storiche (1950 e a breve
 *     1951-1970) — non esiste ancora nessuna pipeline per i dati della
 *     stagione in corso. Ogni sezione con dati finti mostra <PreviewBadge>
 *     ben visibile, da rimuovere SOLO quando quella sezione passa a una
 *     fonte vera.
 *   - Sezione News: fonte ancora da decidere (il thread Pirelli è in
 *     pausa per un problema di accesso separato): per ora cards di
 *     esempio, stessa logica del resto.
 *   - L'immagine del circuito in "Focus on" invece è vera: viene da
 *     CIRCUIT_PHOTOS (Spa-Francorchamps, uno dei 7 circuiti già
 *     verificati nell'archivio 1950), non da un placeholder generico —
 *     solo la scelta di "quale gara è la prossima" è finta, la foto e
 *     l'attribuzione sono reali.
 *   - "Lo sapevi che" (subito sotto l'hero) è l'eccezione: contenuto
 *     REALE al 100%, verificato contro il database (src/data/loSapevi.js),
 *     non un mockup — per questo è l'unica sezione dinamica senza
 *     <PreviewBadge>. Dà alla home un pezzo di contenuto vero fin da ora,
 *     mentre le sezioni sulla stagione in corso restano in attesa di dati.
 *
 * PRIMA DI PUBBLICARE QUESTA HOME IN PRODUZIONE: sostituire (o quantomeno
 * confermare consapevolmente) le sezioni ancora segnate <PreviewBadge>,
 * altrimenti un visitatore reale del sito vedrebbe una classifica/
 * calendario inventati spacciati per dati della stagione in corso.
 */
export default function HomeView() {
  const prossimaGara = MOCK_PROSSIMA_GARA;
  const fotoProssimaGara = (CIRCUIT_PHOTOS[prossimaGara.slug] || [])[0];

  return (
    <main className="main home-view">
      {/* ---------- HERO ---------- */}
      <section className="home-hero">
        <img className="home-hero__foto" src={heroFoto} alt="" aria-hidden="true" />
        <div className="home-hero__scrim" />
        <CircuitArt watermark className="home-hero__art" />
        <div className="home-hero__content">
          <p className="home-hero__kicker">GP Almanac — L'almanacco della Formula 1</p>
          <h1 className="home-hero__titolo">Ogni stagione. Ogni pilota. Ogni circuito.</h1>
          <p className="home-hero__sottotitolo">
            Dalle prime gare del 1950 al mondiale in corso: risultati, classifiche e statistiche di Formula 1
            in un unico posto.
          </p>
          <div className="home-hero__azioni">
            <Link to="/archivio/1950" className="home-hero__cta home-hero__cta--primaria">
              Esplora l'archivio storico
            </Link>
            <Link to="/live" className="home-hero__cta">
              Live timing
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-section--ad">
        <AdSlot width={728} height={90} />
      </section>

      {/* ---------- LO SAPEVI CHE (contenuto reale, non mockup) ---------- */}
      <section className="home-section">
        <LoSapeviWidget />
      </section>

      {/* ---------- CLASSIFICA ANNO IN CORSO ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Classifica 2026</h2>
          <PreviewBadge>Dati di esempio</PreviewBadge>
        </div>
        <div className="home-classifiche">
          <GlassPanel className="home-classifiche__col">
            <h3 className="home-classifiche__titolo">Piloti</h3>
            <ol className="home-classifiche__lista">
              {MOCK_CLASSIFICA_PILOTI.map((r) => (
                <li key={r.pos}>
                  <span className="tab-num home-classifiche__pos">{r.pos}</span>
                  <span className="home-classifiche__nome">{r.pilota}</span>
                  <TeamBadge team={r.scuderia} size="sm" />
                  <span className="tab-num home-classifiche__punti">{r.punti}</span>
                </li>
              ))}
            </ol>
          </GlassPanel>
          <GlassPanel className="home-classifiche__col">
            <h3 className="home-classifiche__titolo">Scuderie</h3>
            <ol className="home-classifiche__lista">
              {MOCK_CLASSIFICA_SCUDERIE.map((r) => (
                <li key={r.pos}>
                  <span className="tab-num home-classifiche__pos">{r.pos}</span>
                  <TeamBadge team={r.scuderia} size="sm" />
                  <span className="home-classifiche__nome">{r.scuderia}</span>
                  <span className="tab-num home-classifiche__punti">{r.punti}</span>
                </li>
              ))}
            </ol>
          </GlassPanel>
        </div>
      </section>

      {/* ---------- FOCUS ON PROSSIMA GARA ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Focus on: prossima gara</h2>
          <PreviewBadge>Gara di esempio</PreviewBadge>
        </div>
        <GlassPanel className="home-focus">
          {fotoProssimaGara && (
            <img
              className="home-focus__foto"
              src={fotoProssimaGara.src}
              alt={fotoProssimaGara.alt}
              loading="lazy"
            />
          )}
          <div className="home-focus__corpo">
            <p className="home-focus__data">{formattaData(prossimaGara.data)}</p>
            <h3 className="home-focus__titolo">{prossimaGara.nome_gp}</h3>
            <p className="home-focus__localita">{prossimaGara.localita}</p>
            <ul className="home-focus__dati">
              <li>
                <strong>{prossimaGara.lunghezza_km} km</strong> lunghezza pista
              </li>
              <li>
                <strong>{prossimaGara.giri}</strong> giri
              </li>
              <li>
                Prima edizione nel <strong>{prossimaGara.prima_edizione}</strong>
              </li>
            </ul>
            <p className="home-focus__curiosita">{prossimaGara.curiosita}</p>
            <Link to={`/circuiti/${prossimaGara.slug}`} className="home-focus__link">
              Scheda del circuito ↗
            </Link>
          </div>
        </GlassPanel>
      </section>

      {/* ---------- CALENDARIO ---------- */}
      <section className="home-section">
        <div className="home-section__header">
          <h2 className="section-title">Calendario 2026</h2>
          <PreviewBadge>Date di esempio</PreviewBadge>
        </div>
        <GlassPanel>
          <ul className="home-calendario">
            {MOCK_CALENDARIO.map((gara) => (
              <li
                key={gara.round}
                className={`home-calendario__riga home-calendario__riga--${gara.stato}`}
              >
                <span className="tab-num home-calendario__round">{gara.round}</span>
                <span className="home-calendario__data">{formattaData(gara.data)}</span>
                <Link to={`/circuiti/${gara.slug}`} className="home-calendario__nome">
                  {gara.nome_gp}
                </Link>
                {gara.stato === 'prossima' && <span className="badge badge--live">Prossima</span>}
                {gara.stato === 'disputato' && <span className="badge badge--finished">Disputata</span>}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="home-section home-section--ad">
        <AdSlot width={970} height={250} />
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
