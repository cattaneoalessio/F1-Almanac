import { useNavigate, useParams } from 'react-router-dom';
import CircuitArt from '../components/CircuitArt.jsx';
import PhotoBand from '../components/PhotoBand.jsx';
import AdSlot from '../components/AdSlot.jsx';
import HistoricalStandings, { ANNO_MASSIMO } from '../components/HistoricalStandings.jsx';
import fotoTopband from '../assets/topbands/archivio.jpg';

// Di default si apre sull'ultima stagione disponibile (oggi il 2026),
// non più sul 1950: quel valore risale all'MVP quando era l'unica
// stagione con dati reali. ANNO_MASSIMO vive in HistoricalStandings.jsx
// (stesso file che genera il menu a tendina) così i due restano
// sincronizzati: quando si importerà il 2027 basterà aggiornare un
// solo punto invece di due.
const ANNO_DI_DEFAULT = ANNO_MASSIMO;

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
      <PhotoBand src={fotoTopband} objectPosition="right 35%">
        <div className="topbar">
          <div className="topbar__title">
            <CircuitArt size={34} />
            <h1 style={{ fontSize: '1.4rem' }}>Archivio storico</h1>
          </div>
          <div className="topbar__meta">Risultati e classifiche dal 1950 a oggi</div>
        </div>
      </PhotoBand>

      <div className="main--historical__ad">
        <AdSlot width={728} height={90} />
      </div>

      <HistoricalStandings anno={anno} onAnnoChange={(nuovoAnno) => navigate(`/archivio/${nuovoAnno}`)} />
    </main>
  );
}

export { ANNO_DI_DEFAULT };
