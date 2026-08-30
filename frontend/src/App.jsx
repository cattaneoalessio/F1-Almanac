import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import LiveTimingView from './views/LiveTimingView.jsx';
import HistoricalView, { ANNO_DI_DEFAULT } from './views/HistoricalView.jsx';
import RaceDetailView from './views/RaceDetailView.jsx';
import DriverView from './views/DriverView.jsx';
import PilotsIndexView from './views/PilotsIndexView.jsx';
import CircuitsIndexView from './views/CircuitsIndexView.jsx';
import CircuitView from './views/CircuitView.jsx';
import ScuderiesIndexView from './views/ScuderiesIndexView.jsx';
import ScuderiaView from './views/ScuderiaView.jsx';

const TABS = [
  { pattern: '/archivio', to: `/archivio/${ANNO_DI_DEFAULT}`, label: 'Archivio storico' },
  { pattern: '/piloti', to: '/piloti', label: 'Piloti' },
  { pattern: '/scuderie', to: '/scuderie', label: 'Scuderie' },
  { pattern: '/circuiti', to: '/circuiti', label: 'Circuiti' },
  { pattern: '/live', to: '/live', label: 'Live Timing' },
];

function BarraNavigazione() {
  const location = useLocation();
  return (
    <nav className="app-tabs" aria-label="Sezioni del sito">
      {TABS.map((tab) => {
        const attiva = location.pathname.startsWith(tab.pattern);
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
    </nav>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <BarraNavigazione />

      <Routes>
        {/* La home rimanda alla stagione più significativa dell'archivio
            storico (il contenuto reale, indicizzabile) invece di essere
            una pagina a parte con lo stesso contenuto duplicato. */}
        <Route path="/" element={<Navigate to={`/archivio/${ANNO_DI_DEFAULT}`} replace />} />
        <Route path="/archivio/:anno" element={<HistoricalView />} />
        <Route path="/archivio/:anno/:circuito" element={<RaceDetailView />} />
        <Route path="/piloti" element={<PilotsIndexView />} />
        <Route path="/piloti/:slug" element={<DriverView />} />
        <Route path="/circuiti" element={<CircuitsIndexView />} />
        <Route path="/circuiti/:slug" element={<CircuitView />} />
        <Route path="/scuderie" element={<ScuderiesIndexView />} />
        <Route path="/scuderie/:slug" element={<ScuderiaView />} />
        <Route path="/live" element={<LiveTimingView />} />
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
    </div>
  );
}
