import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import HomeView from './views/HomeView.jsx';
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
import IdolsIndexView from './views/IdolsIndexView.jsx';
import AnalisiView from './views/AnalisiView.jsx';
import IdolSennaView from './views/IdolSennaView.jsx';
import IdolSchumacherView from './views/IdolSchumacherView.jsx';
import IdolHamiltonView from './views/IdolHamiltonView.jsx';
import IdolView from './views/IdolView.jsx';
import ChronoQuizView from './views/ChronoQuizView.jsx';
import DriverleView from './views/DriverleView.jsx';
import GameChampionshipView from './views/GameChampionshipView.jsx';
import AdminGpView from './views/AdminGpView.jsx';

// Il pannello contenuti (editor compreso) si scarica solo quando serve:
// i visitatori non pagano il peso dell'editor.
const AdminContenutiView = lazy(() => import('./views/admin/AdminContenutiView.jsx'));
import SiteFooter from './components/SiteFooter.jsx';
import { ConsensoProvider, useConsenso } from './consenso/ConsensoContext.jsx';
import { avviaAnalytics, paginaVista } from './utils/analytics.js';
import BannerConsenso from './consenso/BannerConsenso.jsx';
import { LayoutConAdv, LayoutSenzaAdv } from './components/LayoutPagina.jsx';
import PrivacyView from './views/PrivacyView.jsx';
import { SITO } from './config/sito.js';
import { applicaMeta } from './utils/meta.js';
import { metaPerPercorso } from './utils/metaPagina.js';
import { useMetaPagina } from './hooks/useMetaPagina.js';
import { AuthProvider } from './auth/AuthContext.jsx';
import MenuUtente from './components/MenuUtente.jsx';
import ArticoloView from './views/ArticoloView.jsx';
import monopostoIcona from './assets/monoposto-nav-icon.png';

// Ordine deciso con il gestore (1/10/2026). Niente voce "Home": è già il logo.
const TABS = [
  { pattern: '/idols', to: '/idols', label: 'Idols' },
  { pattern: '/piloti', to: '/piloti', label: 'Piloti' },
  { pattern: '/analisi', to: '/analisi', label: 'Analisi' },
  { pattern: '/circuiti', to: '/circuiti', label: 'Circuiti' },
  { pattern: '/scuderie', to: '/scuderie', label: 'Scuderie' },
  { pattern: '/arcade', to: '/arcade', label: 'Arcade' },
  { pattern: '/news', to: '/news', label: 'News' },
  { pattern: '/archivio', to: `/archivio/${ANNO_DI_DEFAULT}`, label: 'Archivio' },
];

function BarraNavigazione() {
  const location = useLocation();
  const [menuAperto, setMenuAperto] = useState(false);
  const barraRef = useRef(null);

  function isAttiva(tab) {
    return location.pathname.startsWith(tab.pattern);
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
        <img src={monopostoIcona} alt="" className="app-tabs__logo-icona" aria-hidden="true" />
        Monoposto<span className="app-tabs__logo-suffisso">.io</span>
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
      <div className="app-tabs__destra">
        <MenuUtente />
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
      </div>

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

// Pagina "non trovata": non ha contenuto proprio, quindi senza pubblicità.
function PaginaNonTrovata() {
  useMetaPagina({ titolo: `Pagina non trovata — ${SITO.nome}`, descrizione: `La pagina cercata non esiste o è stata spostata. Torna alla home di ${SITO.nome} per proseguire.`, robots: 'noindex' });
  return (
    <main className="main main--historical">
      <h1 style={{ fontSize: '1.4rem' }}>Pagina non trovata</h1>
      <p className="historical-standings__stato">
        La pagina cercata non esiste. <Link to={`/archivio/${ANNO_DI_DEFAULT}`}>Torna all'archivio storico</Link>.
      </p>
    </main>
  );
}

function ContenutoApp() {
  const { pathname, search } = useLocation();
  // Google Analytics (Consent Mode base: parte solo dopo il consenso, vedi utils/analytics.js)
  useEffect(() => {
    avviaAnalytics();
  }, []);
  useEffect(() => {
    paginaVista(pathname + search);
  }, [pathname, search]);
  const { bloccante } = useConsenso();
  // Meta tag di base della pagina (titolo, descrizione, canonical, Open Graph, robots).
  // useLayoutEffect: scatta PRIMA degli effetti delle pagine, che poi li affinano
  // con i loro dati (useMetaPagina) senza essere sovrascritti.
  useLayoutEffect(() => {
    applicaMeta({ percorso: pathname, ...metaPerPercorso(pathname) });
  }, [pathname]);

  return (
    <>
      {/* inert: mentre il banner è aperto, il sito sotto non è né cliccabile né raggiungibile con Tab. */}
      <div className="app-shell" inert={bloccante || undefined}>
        <BarraNavigazione />

        <Routes>
          {/* ====================================================================
              PAGINE CON PUBBLICITÀ — colonne laterali + banner in fondo, in
              automatico. Ogni nuova pagina di contenuto va aggiunta QUI.
              ==================================================================== */}
          <Route element={<LayoutConAdv />}>
            {/* La home è una pagina dinamica a sé (hero, classifica stagione in
                corso, calendario, focus sulla prossima gara, news); l'archivio
                storico resta raggiungibile dal tab "Archivio storico". */}
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
            <Route path="/news/:slug" element={<ArticoloView />} />
            <Route path="/analisi" element={<AnalisiView />} />
            <Route path="/arcade" element={<ArcadeView />} />
            <Route path="/arcade/chronoquiz" element={<ChronoQuizView />} />
            <Route path="/arcade/driverle" element={<DriverleView />} />
            <Route path="/arcade/time-attack" element={<GameChampionshipView />} />
            <Route path="/idols" element={<IdolsIndexView />} />
            <Route path="/idols/senna" element={<IdolSennaView />} />
            <Route path="/idols/schumacher" element={<IdolSchumacherView />} />
            <Route path="/idols/hamilton" element={<IdolHamiltonView />} />
          </Route>

          {/* ====================================================================
              PAGINE SENZA PUBBLICITÀ — solo dove le policy AdSense la vietano:
              schermate senza contenuto proprio (404, scheda idol "in arrivo"),
              amministrazione, pagine legali.
              ==================================================================== */}
          <Route element={<LayoutSenzaAdv />}>
            <Route path="/privacy" element={<PrivacyView />} />
            <Route path="/idols/:slug" element={<IdolView />} />
            <Route path="/admin/chiudi-gp" element={<AdminGpView />} />
            <Route
              path="/admin/contenuti/*"
              element={
                <Suspense fallback={<main className="main main--historical"><p className="historical-standings__stato">Caricamento…</p></main>}>
                  <AdminContenutiView />
                </Suspense>
              }
            />
            <Route path="*" element={<PaginaNonTrovata />} />
          </Route>
        </Routes>

        <SiteFooter />
      </div>
      <BannerConsenso />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConsensoProvider>
        <ContenutoApp />
      </ConsensoProvider>
    </AuthProvider>
  );
}
