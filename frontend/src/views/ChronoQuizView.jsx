import { Link } from 'react-router-dom';

/**
 * Placeholder: il gioco ChronoQuiz vero e proprio non è ancora stato
 * costruito, ma la dashboard Arcade linka già a /arcade/chronoquiz.
 * Questa pagina esiste solo per evitare che quel link porti al catch-all
 * "Pagina non trovata" — va sostituita dal componente reale del gioco.
 */
export default function ChronoQuizView() {
  return (
    <main className="main">
      <h1>ChronoQuiz</h1>
      <p>Il gioco è in costruzione — torna presto per metterti alla prova.</p>
      <p>
        <Link to="/arcade">&larr; Torna all'Arcade</Link>
      </p>
    </main>
  );
}
