import { Link } from 'react-router-dom';
import GlassPanel from '../../components/GlassPanel.jsx';
import { SpazioAdv } from '../../components/AdSlot.jsx';
import { useMetaPagina } from '../../hooks/useMetaPagina.js';
import { VOCABOLARIO } from '../../data/academy/vocabolario.js';
import { LEZIONI } from '../../data/academy/lezioni.js';
import './Academy.css';

/** /academy — ingresso della sezione: Vocabolario, Impara, Forum. */
export default function AcademyView() {
  useMetaPagina({
    titolo: 'Academy: impara la Formula 1',
    descrizione: 'Vocabolario dei termini della Formula 1, lezioni su come è fatta una monoposto e, presto, il forum degli appassionati.',
  });
  const sezioni = [
    {
      to: '/academy/vocabolario',
      titolo: 'Vocabolario',
      testo: `${VOCABOLARIO.length} termini della Formula 1, italiani e inglesi, con significato ed esempio d'uso.`,
      azione: 'Sfoglia il vocabolario',
    },
    {
      to: '/academy/impara',
      titolo: 'Impara',
      testo: `${LEZIONI.length} lezioni su com'è fatta una F1: power unit, aerodinamica, freni, cambio, volante, gomme e sicurezza, con infografiche e confronti con un'auto di tutti i giorni.`,
      azione: 'Inizia a imparare',
    },
    {
      to: '/academy/forum',
      titolo: 'Forum',
      testo: 'Discussioni tra appassionati registrati sui temi scelti dalla redazione.',
      azione: 'In arrivo',
      prossimamente: true,
    },
  ];
  return (
    <main className="main main--historical academy">
      <header className="academy__testa">
        <p className="academy__occhiello">Academy</p>
        <h1>Impara la Formula 1</h1>
        <p className="academy__intro">
          Dalle parole che senti in telecronaca a come funziona una monoposto: tutto quello che serve per capire davvero
          una gara.
        </p>
      </header>
      <div className="academy__griglia">
        {sezioni.map((s) => (
          <GlassPanel key={s.to} as={Link} to={s.to} className={`academy__scheda ${s.prossimamente ? 'academy__scheda--presto' : ''}`}>
            <h2>{s.titolo}</h2>
            <p>{s.testo}</p>
            <span className="academy__azione">{s.azione} {s.prossimamente ? '' : '→'}</span>
          </GlassPanel>
        ))}
      </div>
      <SpazioAdv formato="leaderboard" />
    </main>
  );
}
