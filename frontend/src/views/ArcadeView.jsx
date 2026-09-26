import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { getClassificaArcade, getLivelloPilota, getMioRecordArcade } from '../api/backend.js';
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

/**
 * Soglie di punti totali → Livello Pilota, usate SOLO come fallback per
 * chi non è loggato (nessuna identità server a cui agganciare un
 * calcolo unificato). Da loggati, il livello arriva invece dal backend
 * (GET /arcade/livello), che somma ChronoQuiz + Time Attack — queste
 * stesse soglie sono duplicate lato server in main.py: se le cambi qui,
 * cambiale anche lì per coerenza.
 */
const LIVELLI_PILOTA = [
  { soglia: 1000, nome: 'Campione del Mondo' },
  { soglia: 500, nome: 'Collaudatore' },
  { soglia: 200, nome: 'Meccanico' },
  { soglia: 0, nome: 'Rookie' },
];

/** Punti totali per il fallback quando non si è loggati: senza un
 * account non c'è più nulla da sommare (il record non vive più nel
 * browser) — resta semplicemente Rookie finché non si accede. */
function calcolaPuntiTotaliLocale() {
  return 0;
}

function livelloPilotaLocale(puntiTotali) {
  return LIVELLI_PILOTA.find((livello) => puntiTotali >= livello.soglia).nome;
}

export default function ArcadeView() {
  const { utente, ottieniToken } = useAuth();
  const [livelloServer, setLivelloServer] = useState(null); // { puntiTotali, livello } | null
  const [statoLivelloServer, setStatoLivelloServer] = useState('inattivo'); // inattivo | caricamento | pronto | errore
  // Record personale (legato all'account) e assoluto di ChronoQuiz,
  // mostrati sia nel pannello statistiche sia sulla scheda del gioco —
  // stessa dinamica di Time Attack, non più localStorage.
  const [mioRecordChronoQuiz, setMioRecordChronoQuiz] = useState({ punti: null });
  const [statoMioRecordChronoQuiz, setStatoMioRecordChronoQuiz] = useState('inattivo');
  const [recordAssolutoChronoQuiz, setRecordAssolutoChronoQuiz] = useState(null); // { username, punti } | null
  const [statoRecordAssolutoChronoQuiz, setStatoRecordAssolutoChronoQuiz] = useState('inattivo');

  useEffect(() => {
    setStatoMioRecordChronoQuiz('caricamento');
    ottieniToken()
      .then((token) => getMioRecordArcade('chronoquiz', token))
      .then((dati) => {
        setMioRecordChronoQuiz(dati);
        setStatoMioRecordChronoQuiz('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare il mio record ChronoQuiz:', errore);
        setStatoMioRecordChronoQuiz('errore');
      });

    setStatoRecordAssolutoChronoQuiz('caricamento');
    getClassificaArcade('chronoquiz', 1)
      .then((dati) => {
        setRecordAssolutoChronoQuiz(dati && dati.length > 0 ? dati[0] : null);
        setStatoRecordAssolutoChronoQuiz('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare il record assoluto ChronoQuiz:', errore);
        setStatoRecordAssolutoChronoQuiz('errore');
      });
  }, [utente, ottieniToken]);

  // Livello unificato (ChronoQuiz + Time Attack) da loggati; senza login
  // resta il fallback locale calcolato più sotto, l'unico possibile senza
  // un'identità server a cui riferirsi.
  useEffect(() => {
    if (!utente) {
      setLivelloServer(null);
      setStatoLivelloServer('inattivo');
      return;
    }
    setStatoLivelloServer('caricamento');
    ottieniToken()
      .then((token) => getLivelloPilota(token))
      .then((dati) => {
        setLivelloServer(dati);
        setStatoLivelloServer('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare il livello pilota dal server:', errore);
        setStatoLivelloServer('errore');
      });
  }, [utente, ottieniToken]);

  const giochiAttivi = useMemo(() => GIOCHI.filter((gioco) => gioco.attivo).length, []);

  const puntiTotaliLocale = calcolaPuntiTotaliLocale();
  const usaLivelloServer = statoLivelloServer === 'pronto' && livelloServer !== null;
  const puntiTotali = usaLivelloServer ? livelloServer.punti_totali : puntiTotaliLocale;
  const livello = usaLivelloServer ? livelloServer.livello : livelloPilotaLocale(puntiTotaliLocale);

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
          <span className="arcade-view__stat-label">Il tuo record ChronoQuiz</span>
          <span className="arcade-view__stat-valore tab-num">
            {!utente && 'Accedi per vederlo'}
            {utente && statoMioRecordChronoQuiz !== 'pronto' && '...'}
            {utente && statoMioRecordChronoQuiz === 'pronto' && `${mioRecordChronoQuiz.punti ?? 0} pts`}
          </span>
        </GlassPanel>

        <GlassPanel className="arcade-view__stat-panel">
          <span className="arcade-view__stat-label">Livello Pilota</span>
          <span className="arcade-view__stat-valore arcade-view__stat-valore--livello">
            {livello}
          </span>
          {usaLivelloServer && (
            <span className="arcade-view__stat-sotto">{puntiTotali} pt totali (ChronoQuiz + Time Attack)</span>
          )}
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
                  {gioco.slug === 'chronoquiz' && (
                    <span className="arcade-view__card-record">
                      Il tuo record:{' '}
                      <strong className="tab-num">
                        {utente && statoMioRecordChronoQuiz === 'pronto' ? `${mioRecordChronoQuiz.punti ?? 0} pts` : '--'}
                      </strong>
                      {' · '}
                      Assoluto:{' '}
                      <strong className="tab-num">
                        {statoRecordAssolutoChronoQuiz === 'pronto' && recordAssolutoChronoQuiz
                          ? `${recordAssolutoChronoQuiz.punti} pts (${recordAssolutoChronoQuiz.username})`
                          : '--'}
                      </strong>
                    </span>
                  )}
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
