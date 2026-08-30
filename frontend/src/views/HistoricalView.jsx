import { useNavigate, useParams } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import HistoricalStandings from '../components/HistoricalStandings.jsx';

const ANNO_DI_DEFAULT = 1950; // prima stagione del Mondiale F1, ed è l'unica con dati reali nell'MVP

/**
 * Pagina "stagione" (Fase D), raggiungibile da /archivio/:anno. L'anno
 * vive nell'URL (non in uno stato interno) così ogni stagione ha un
 * indirizzo proprio, condivisibile e indicizzabile da Google — non solo
 * una tab dentro un'unica pagina.
 */
export default function HistoricalView() {
  const { anno: annoParam } = useParams();
  const navigate = useNavigate();
  const anno = Number(annoParam) || ANNO_DI_DEFAULT;

  return (
    <main className="main main--historical">
      <div className="topbar">
        <div className="topbar__title">
          <CircuitArt size={34} />
          <h1 style={{ fontSize: '1.4rem' }}>Archivio storico</h1>
        </div>
        <div className="topbar__meta">Risultati e classifiche dal 1950 a oggi</div>
      </div>

      <HistoricalStandings anno={anno} onAnnoChange={(nuovoAnno) => navigate(`/archivio/${nuovoAnno}`)} />
    </main>
  );
}

export { ANNO_DI_DEFAULT };
