import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import HomeView from './views/HomeView.jsx';
import LiveTimingView from './views/LiveTimingView.jsx';
import HistoricalView, { ANNO_DI_DEFAULT } from './views/HistoricalView.jsx';
import RaceDetailView from './views/RaceDetailView.jsx';
import DriverView from './views/DriverView.jsx';
import PilotsIndexView from './views/PilotsIndexView.jsx';
import CircuitsIndexView from './views/CircuitsIndexView.jsx';
import CircuitView from './views/CircuitView.jsx';
import ScuderiesIndexView from './views/ScuderiesIndexView.jsx';
import ScuderiaView from './views/ScuderiaView.jsx';
import NewsView from './views/NewsView.jsx';
import ArcadeView from './views/ArcadeView.jsx';
import ChronoQuizView from './views/ChronoQuizView.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import AdSlot from './components/AdSlot.jsx';

const TABS = [
  // "/" è un caso speciale: con startsWith() combacerebbe con QUALSIASI
  // percorso (tutti iniziano per "/"), marcando la Home come attiva anche
  // altrove. Per questa voce sola serve un confronto esatto (vedi sotto).
  { pattern: '/', to: '/', label: 'Home', esatto: true },
  { pattern: '/archivio', to: `/archivio/${ANNO_DI_DEFAULT}`, label: 'Archivio storico' },
  { pattern: '/piloti', to: '/piloti', label: 'Piloti' },
  { pattern: '/scuderie', to: '/scuderie', label: 'Scuderie' },
  { pattern: '/circuiti', to: '/circuiti', label: 'Circuiti' },
  { pattern: '/news', to: '/news', label: 'News' },
  { pattern: '/live', to: '/live', label: 'Live Timing' },
  { pattern: '/arcade', to: '/arcade', label: 'Arcade' },
];

function BarraNavigazione() {
  const location = useLocation();
  const [menuAperto, setMenuAperto] = useState(false);
  const barraRef = useRef(null);

  function isAttiva(tab) {
    return tab.esatto ? location.pathname === tab.pattern : location.pathname.startsWith(tab.pattern);
  }

  // Chiude il menu mobile a ogni cambio di rotta (click su una voce, ma
  // anche indietro/avanti del browser), così non resta aperto sopra la
  // pagina appena caricata.
  useEffect(() => {
    setMenuAperto(false);
  }, [location.pathname]);

  // Chiude il menu mobile con Esc o cliccando fuori dalla barra di
  // navigazione (comportamento atteso da un menu hamburger).
  useEffect(() => {
    if (!menuAperto) return undefined;

    function suClickFuori(evento) {
      if (barraRef.current && !barraRef.current.contains(evento.target)) {
        setMenuAperto(false);
      }
    }
    function suTastoEsc(evento) {
      if (evento.key === 'Escape') setMenuAperto(false);
    }

    document.addEventListener('mousedown', suClickFuori);
    document.addEventListener('keydown', suTastoEsc);
    return () => {
      document.removeEventListener('mousedown', suClickFuori);
      document.removeEventListener('keydown', suTastoEsc);
    };
  }, [menuAperto]);

  return (
    <nav className="app-tabs" aria-label="Sezioni del sito" ref={barraRef}>
      <Link to="/" className="app-tabs__logo">
        <span className="app-tabs__logo-dot" aria-hidden="true" />
        GP Almanac
      </Link>

      {/* Riga orizzontale di link, visibile da tablet in su (≥700px):
          stessa barra di sempre, solo con "Arcade" in più. */}
      <div className="app-tabs__links">
        {TABS.map((tab) => {
          const attiva = isAttiva(tab);
          return (
            <Link
              key={tab.pattern}
              to={tab.to}
              className={`app-tabs__item ${attiva ? 'app-tabs__item--attiva' : ''}`}
              aria-current={attiva ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Hamburger, visibile solo sotto i 700px (vedi App.css): apre/chiude
          il pannello qui sotto, che sostituisce la riga orizzontale su
          schermi stretti invece di farla scorrere lateralmente. */}
      <button
        type="button"
        className={`app-tabs__hamburger ${menuAperto ? 'app-tabs__hamburger--aperto' : ''}`}
        aria-expanded={menuAperto}
        aria-controls="app-tabs-menu-mobile"
        aria-label={menuAperto ? 'Chiudi il menu' : 'Apri il menu'}
        onClick={() => setMenuAperto((aperto) => !aperto)}
      >
        <span className="app-tabs__hamburger-barra" aria-hidden="true" />
        <span className="app-tabs__hamburger-barra" aria-hidden="true" />
        <span className="app-tabs__hamburger-barra" aria-hidden="true" />
      </button>

      <div
        id="app-tabs-menu-mobile"
        className={`app-tabs__mobile-menu ${menuAperto ? 'app-tabs__mobile-menu--aperto' : ''}`}
      >
        {TABS.map((tab) => {
          const attiva = isAttiva(tab);
          return (
            <Link
              key={tab.pattern}
              to={tab.to}
              className={`app-tabs__mobile-item ${attiva ? 'app-tabs__mobile-item--attiva' : ''}`}
              aria-current={attiva ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <BarraNavigazione />

      <div className="rail-ad rail-ad--left" aria-hidden="true">
        <AdSlot width={160} height={600} />
      </div>
      <div className="rail-ad rail-ad--right" aria-hidden="true">
        <AdSlot width={160} height={600} />
      </div>

      <Routes>
        {/* Fase E: la home è ora una pagina dinamica a sé (hero, classifica
            stagione in corso, calendario, focus on prossima gara, news),
            non più un redirect verso l'archivio storico — che resta
            comunque raggiungibile dal tab "Archivio storico". */}
        <Route path="/" element={<HomeView />} />
        <Route path="/archivio/:anno" element={<HistoricalView />} />
        <Route path="/archivio/:anno/:circuito" element={<RaceDetailView />} />
        <Route path="/piloti" element={<PilotsIndexView />} />
        <Route path="/piloti/:slug" element={<DriverView />} />
        <Route path="/circuiti" element={<CircuitsIndexView />} />
        <Route path="/circuiti/:slug" element={<CircuitView />} />
        <Route path="/scuderie" element={<ScuderiesIndexView />} />
        <Route path="/scuderie/:slug" element={<ScuderiaView />} />
        <Route path="/news" element={<NewsView />} />
        <Route path="/live" element={<LiveTimingView />} />
        <Route path="/arcade" element={<ArcadeView />} />
        <Route path="/arcade/chronoquiz" element={<ChronoQuizView />} />
        <Route
          path="*"
          element={
            <main className="main main--historical">
              <p className="historical-standings__stato">
                Pagina non trovata. <Link to={`/archivio/${ANNO_DI_DEFAULT}`}>Torna all'archivio storico</Link>.
              </p>
            </main>
          }
        />
      </Routes>

      <SiteFooter />
    </div>
  );
}
