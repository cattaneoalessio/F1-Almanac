import { Link, useParams } from 'react-router-dom';
import './IdolView.css';

/**
 * IdolView (/idols/:slug) — sottopagina di un singolo Idol.
 *
 * STUB MINIMO, non parte della richiesta originale (solo "la pagina
 * principale" con la griglia): esiste perché senza una destinazione
 * reale le card di IdolsIndexView porterebbero a un vicolo cieco.
 * Stessa lista IDOLI di lì (duplicata qui per ora, dato lo stub): se
 * questa pagina cresce in una vera scheda pilota (carriera, stagioni,
 * foto), conviene spostare IDOLI in un file dati condiviso, es.
 * src/data/idols.js, come già fa src/data/circuitPhotos.js per i
 * circuiti.
 */
const IDOLI = {
  senna: { nome: 'Ayrton Senna', payoff: 'Il misticismo della velocit\u00e0.' },
  schumacher: { nome: 'Michael Schumacher', payoff: 'L\u2019algoritmo della vittoria.' },
  hamilton: { nome: 'Lewis Hamilton', payoff: 'L\u2019arte di riscrivere la storia.' },
};

export default function IdolView() {
  const { slug } = useParams();
  const idolo = IDOLI[slug];

  return (
    <main className="main idol-view">
      <Link to="/idols" className="idol-view__indietro">
        &larr; Tutti gli Idols
      </Link>

      {idolo ? (
        <>
          <h1 className="idol-view__nome">{idolo.nome}</h1>
          <p className="idol-view__payoff">{idolo.payoff}</p>
          <p className="idol-view__nota">Scheda completa in arrivo.</p>
        </>
      ) : (
        <p className="idol-view__nota">Idol non trovato.</p>
      )}
    </main>
  );
}
