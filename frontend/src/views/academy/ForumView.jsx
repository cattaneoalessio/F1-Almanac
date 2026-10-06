import { Link } from 'react-router-dom';
import GlassPanel from '../../components/GlassPanel.jsx';
import { useMetaPagina } from '../../hooks/useMetaPagina.js';
import './Academy.css';

/** /academy/forum — segnaposto finché non sono decise regole e moderazione. */
export default function ForumView() {
  useMetaPagina({ titolo: 'Forum — Academy', descrizione: 'Il forum degli appassionati di Monoposto.io: in arrivo.', robots: 'noindex' });
  return (
    <main className="main main--historical academy">
      <p className="academy__briciole"><Link to="/academy">Academy</Link> / Forum</p>
      <h1>Forum</h1>
      <GlassPanel className="academy__presto">
        <p>
          Stiamo preparando il forum: uno spazio per discutere di Formula 1 con gli altri appassionati registrati, sui temi
          proposti dalla redazione.
        </p>
        <p>Nel frattempo puoi esplorare il <Link to="/academy/vocabolario">Vocabolario</Link> e le lezioni di <Link to="/academy/impara">Impara</Link>.</p>
      </GlassPanel>
    </main>
  );
}
