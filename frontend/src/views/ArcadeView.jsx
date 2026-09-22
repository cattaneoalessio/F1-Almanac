import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { leggiPunteggioSalvato } from '../utils/arcadeStorage.js';
import './ArcadeView.css';

/**
 * Elenco dei giochi dell'Arcade. Per aggiungere un nuovo gioco basta
 * aggiungere un oggetto qui (e, quando è pronto, mettere `attivo: true`
 * + il suo `path`): nessun'altra riga del componente va toccata.
 *
 * `tipo` per Driverle/ApexGrid è preso testualmente dalla richiesta;
 * per ApexTrace/Telemetry/Line Splicer non era specificato un'etichetta
 * di tipo — assegnata qui in modo coerente con la loro descrizione
 * (deduzione visiva, confronto statistico, scommessa over/under).
 */
const GIOCHI = [
  {
    slug: 'chronoquiz',
    nome: 'ChronoQuiz',
    descrizione:
      'Trivia storico a scelta multipla. 10 domande, 15 secondi a disposizione. La velocità fa la differenza.',
    tipo: 'Tempo',
    attivo: true,
    path: '/arcade/chronoquiz',
  },
  {
    slug: 'time-attack',
    nome: 'Time Attack',
    descrizione:
      'Guida un giro cronometrato sulla Monoposto Virtual Arena. Scegli un circuito reale dall\u2019archivio, scala la classifica e il Campionato Mondiale Virtuale.',
    tipo: 'Guida',
    attivo: true,
    path: '/arcade/time-attack',
  },
  {
    slug: 'driverle',
    nome: 'Driverle',
    descrizione:
      'Indovina il pilota misterioso del giorno. Ricevi indizi statistici su nazionalità, scuderie ed epoca a ogni tentativo.',
    tipo: 'Deduzione Giornaliera',
    attivo: false,
  },
  {
    slug: 'apexgrid',
    nome: 'ApexGrid',
    descrizione: 'Completa la griglia logica 3x3 incrociando scuderie, piloti e record storici.',
    tipo: 'Logica',
    attivo: false,
  },
  {
    slug: 'apextrace',
    nome: 'ApexTrace',
    descrizione:
      'Riconosci il circuito o la sua evoluzione storica partendo solo dalla sagoma in bianco e nero del tracciato.',
    tipo: 'Deduzione Visiva',
    attivo: false,
  },
  {
    slug: 'telemetry',
    nome: 'Telemetry',
    descrizione:
      'La sfida statistica definitiva. Guarda due record a confronto e indovina se il secondo è più alto o più basso.',
    tipo: 'Statistica',
    attivo: false,
  },
  {
    slug: 'line-splicer',
    nome: 'Line Splicer',
    descrizione:
      "Gioca contro il banco: indovina se un record o un dato storico ha superato (Over) o meno (Under) la soglia decimale.",
    tipo: 'Over/Under',
    attivo: false,
  },
];

const CHIAVE_RECORD_CHRONOQUIZ = 'monoposto_chronoquiz_high';

/**
 * Soglie di punti totali → Livello Pilota (in ordine decrescente: vince
 * la prima soglia superata). Valori scelti come punto di partenza
 * ragionevole, da ritarare quando si conoscerà il punteggio medio reale
 * di una partita a ChronoQuiz.
 */
const LIVELLI_PILOTA = [
  { soglia: 1000, nome: 'Campione del Mondo' },
  { soglia: 500, nome: 'Collaudatore' },
  { soglia: 200, nome: 'Meccanico' },
  { soglia: 0, nome: 'Rookie' },
];

/**
 * Punti totali del pilota. Oggi coincide col record di ChronoQuiz perché
 * è l'unico gioco attivo: quando gli altri giochi salveranno un proprio
 * punteggio (es. chiavi `monoposto_<slug>_totale`), questa è l'unica
 * funzione da estendere per sommarli — il resto del componente non
 * dipende da come i punti totali vengono calcolati.
 */
function calcolaPuntiTotali(recordChronoQuiz) {
  return recordChronoQuiz;
}

function livelloPilota(puntiTotali) {
  return LIVELLI_PILOTA.find((livello) => puntiTotali >= livello.soglia).nome;
}

export default function ArcadeView() {
  const [recordChronoQuiz, setRecordChronoQuiz] = useState(0);

  useEffect(() => {
    setRecordChronoQuiz(leggiPunteggioSalvato(CHIAVE_RECORD_CHRONOQUIZ));
  }, []);

  const giochiAttivi = useMemo(() => GIOCHI.filter((gioco) => gioco.attivo).length, []);
  const puntiTotali = calcolaPuntiTotali(recordChronoQuiz);
  const livello = livelloPilota(puntiTotali);

  return (
    <main className="main">
      <header className="arcade-view__header">
        <h1 className="arcade-view__titolo">
          MONOPOSTO <span className="arcade-view__titolo-accento">ARCADE</span>
        </h1>
        <p className="arcade-view__sottotitolo">
          Metti alla prova quanto conosci davvero la storia delle corse: rispondi, deduci,
          confronta i record — accumula punti e scopri fino a che livello puoi arrivare.
        </p>
      </header>

      <section className="arcade-view__stats" aria-label="Le tue statistiche">
        <GlassPanel className="arcade-view__stat-panel">
          <span className="arcade-view__stat-label">Giochi Attivi</span>
          <span className="arcade-view__stat-valore tab-num">
            {giochiAttivi}/{GIOCHI.length}
          </span>
        </GlassPanel>

        <GlassPanel className="arcade-view__stat-panel">
          <span className="arcade-view__stat-label">Record ChronoQuiz</span>
          <span className="arcade-view__stat-valore tab-num">{recordChronoQuiz} pts</span>
        </GlassPanel>

        <GlassPanel className="arcade-view__stat-panel">
          <span className="arcade-view__stat-label">Livello Pilota</span>
          <span className="arcade-view__stat-valore arcade-view__stat-valore--livello">
            {livello}
          </span>
        </GlassPanel>
      </section>

      <section className="arcade-view__grid" aria-label="Giochi disponibili">
        {GIOCHI.map((gioco) => (
          <GlassPanel
            key={gioco.slug}
            className={`arcade-view__card ${gioco.attivo ? '' : 'arcade-view__card--bloccata'}`}
          >
            <div className="arcade-view__card-testa">
              <h2 className="arcade-view__card-nome">{gioco.nome}</h2>
              <span className="badge arcade-view__badge-tipo">{gioco.tipo}</span>
            </div>

            <p className="arcade-view__card-descrizione">{gioco.descrizione}</p>

            {!gioco.attivo && (
              <span className="badge badge--finished arcade-view__badge-stato">IN ARRIVO</span>
            )}

            <div className="arcade-view__card-piede">
              {gioco.attivo ? (
                <>
                  <span className="arcade-view__card-record">
                    Record: <strong className="tab-num">{recordChronoQuiz} pts</strong>
                  </span>
                  <Link to={gioco.path} className="arcade-view__gioca">
                    Scendi in pista
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  className="arcade-view__gioca arcade-view__gioca--bloccato"
                  disabled
                  aria-disabled="true"
                >
                  Locked
                </button>
              )}
            </div>
          </GlassPanel>
        ))}
      </section>
    </main>
  );
}
