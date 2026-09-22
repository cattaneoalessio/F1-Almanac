import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { getClassificaArcade, getDomandeChronoQuiz, inviaPunteggioArcade } from '../api/backend.js';
import { salvaPunteggioSeRecord } from '../utils/arcadeStorage.js';
import { useAuth } from '../auth/AuthContext.jsx';
import './ChronoQuizView.css';

const CHIAVE_RECORD = 'monoposto_chronoquiz_high';
const DURATA_DOMANDA_SECONDI = 15;
const PAUSA_RIVELAZIONE_MS = 1500;

/**
 * ChronoQuiz — trivia storico a tempo, primo gioco della sezione Arcade.
 *
 * Flow a 3 schermate (fase): 'regole' -> 'gioco' -> 'finale'. Le domande
 * vengono precaricate già durante la schermata delle regole (fetch in
 * useEffect al mount) così che, quando il giocatore preme "Inizia a
 * giocare"/"Salta regole", il più delle volte sono già pronte; se non lo
 * sono ancora, la fase 'gioco' mostra un piccolo stato di caricamento
 * invece di far apparire il pulsante come rotto.
 *
 * Il numero di domande mostrate ("Domanda X di N") segue la lunghezza
 * REALE dell'array ricevuto dal backend, non un 10 fisso: il backend
 * applica la policy "meglio vuoto che inventato" e può restituire meno
 * di 10 domande se i dati nel DB non bastano.
 */
export default function ChronoQuizView() {
  const { utente, ottieniToken, apriLogin } = useAuth();
  const [fase, setFase] = useState('regole'); // regole | gioco | finale
  const [statoDomande, setStatoDomande] = useState('caricamento'); // caricamento | pronto | errore
  const [domande, setDomande] = useState([]);
  const [indiceDomanda, setIndiceDomanda] = useState(0);
  const [faseDomanda, setFaseDomanda] = useState('in-corso'); // in-corso | rivelata
  const [opzioneSelezionata, setOpzioneSelezionata] = useState(null);
  const [punteggioTotale, setPunteggioTotale] = useState(0);
  const [risposteCorrette, setRisposteCorrette] = useState(0);
  const [nuovoRecord, setNuovoRecord] = useState(false);
  // Esito dell'invio del punteggio al backend, mostrato in fondo alla
  // schermata finale: 'non-salvato' non è un errore, è il caso normale
  // di chi ha giocato senza login (facoltativo in questo progetto).
  const [statoInvio, setStatoInvio] = useState('inattivo'); // inattivo | invio | salvato | non-salvato | errore
  const [usernameSalvato, setUsernameSalvato] = useState(null);
  const [classifica, setClassifica] = useState([]);
  const [statoClassifica, setStatoClassifica] = useState('inattivo'); // inattivo | caricamento | pronto | errore

  // Valori "autorevoli" del punteggio/risposte corrette, aggiornati in
  // modo sincrono (a differenza dello state, che si aggiorna al prossimo
  // render): servono a concludiPartita(), chiamata dentro un setTimeout
  // innescato dall'ultima domanda, per non leggere un punteggioTotale
  // "vecchio" catturato prima che l'ultimo punteggio fosse sommato.
  const punteggioRef = useRef(0);
  const risposteCorretteRef = useRef(0);
  const inizioDomandaRef = useRef(0);
  const gestitoRef = useRef(false); // evita doppio conteggio se click e timeout arrivano quasi insieme
  const timeoutScadenzaRef = useRef(null);
  const timeoutAvanzamentoRef = useRef(null);

  function caricaDomande() {
    setStatoDomande('caricamento');
    getDomandeChronoQuiz()
      .then((dati) => {
        if (dati && dati.length > 0) {
          setDomande(dati);
          setStatoDomande('pronto');
        } else {
          setStatoDomande('errore');
        }
      })
      .catch((errore) => {
        console.error('Errore nel caricare le domande di ChronoQuiz:', errore);
        setStatoDomande('errore');
      });
  }

  // Precarica le domande già durante la schermata delle regole.
  useEffect(() => {
    caricaDomande();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer dei 15 secondi per la domanda corrente: riparte a ogni cambio
  // di indiceDomanda, si pulisce da solo se il componente cambia fase o
  // viene smontato prima.
  useEffect(() => {
    if (fase !== 'gioco' || statoDomande !== 'pronto') return undefined;
    if (indiceDomanda >= domande.length) return undefined;

    gestitoRef.current = false;
    inizioDomandaRef.current = Date.now();
    const idTimeout = setTimeout(() => {
      gestisciRisposta(null);
    }, DURATA_DOMANDA_SECONDI * 1000);
    timeoutScadenzaRef.current = idTimeout;

    return () => clearTimeout(idTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, statoDomande, indiceDomanda, domande.length]);

  // Pulisce eventuali timeout pendenti se il componente viene smontato
  // (es. il giocatore torna all'Arcade a metà partita).
  useEffect(() => {
    return () => {
      if (timeoutScadenzaRef.current) clearTimeout(timeoutScadenzaRef.current);
      if (timeoutAvanzamentoRef.current) clearTimeout(timeoutAvanzamentoRef.current);
    };
  }, []);

  function gestisciRisposta(indiceOpzione) {
    if (gestitoRef.current) return; // già gestita (click dopo lo scadere, o doppio click)
    gestitoRef.current = true;
    if (timeoutScadenzaRef.current) clearTimeout(timeoutScadenzaRef.current);

    // Toglie il focus dal bottone appena cliccato: altrimenti il cerchio
    // di focus nativo del browser (visibile al click col mouse, non solo
    // da tastiera) può restare visivamente "attaccato" a quella posizione.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const domandaCorrente = domande[indiceDomanda];
    const secondiTrascorsi = (Date.now() - inizioDomandaRef.current) / 1000;
    const secondiRimasti = Math.max(0, DURATA_DOMANDA_SECONDI - secondiTrascorsi);
    const corretta = indiceOpzione !== null && indiceOpzione === domandaCorrente.correct_option_index;
    // 100 punti base + (secondi rimasti * 10), come da specifica.
    const puntiDomanda = corretta ? 100 + Math.round(secondiRimasti * 10) : 0;

    punteggioRef.current += puntiDomanda;
    if (corretta) risposteCorretteRef.current += 1;

    setOpzioneSelezionata(indiceOpzione);
    setFaseDomanda('rivelata');
    setPunteggioTotale(punteggioRef.current);
    setRisposteCorrette(risposteCorretteRef.current);

    timeoutAvanzamentoRef.current = setTimeout(avanzaDomanda, PAUSA_RIVELAZIONE_MS);
  }

  function avanzaDomanda() {
    const prossimoIndice = indiceDomanda + 1;
    if (prossimoIndice < domande.length) {
      setIndiceDomanda(prossimoIndice);
      setFaseDomanda('in-corso');
      setOpzioneSelezionata(null);
    } else {
      concludiPartita();
    }
  }

  function concludiPartita() {
    const record = salvaPunteggioSeRecord(CHIAVE_RECORD, punteggioRef.current);
    setNuovoRecord(record);
    setFase('finale');
    inviaEsitoPartita(punteggioRef.current);
  }

  // Invia il punteggio al backend (se il giocatore è loggato: senza
  // login il backend risponde comunque, semplicemente con salvato:false,
  // vedi backend.js) e carica sempre la classifica subito dopo, così è
  // visibile anche a chi non era loggato — solo in lettura, per motivarlo
  // ad accedere la prossima volta.
  async function inviaEsitoPartita(punti) {
    setStatoInvio('invio');
    try {
      const token = await ottieniToken();
      const risposta = await inviaPunteggioArcade('chronoquiz', punti, token);
      setStatoInvio(risposta.salvato ? 'salvato' : 'non-salvato');
      setUsernameSalvato(risposta.username ?? null);
    } catch (errore) {
      console.error('Errore nel salvare il punteggio ChronoQuiz:', errore);
      setStatoInvio('errore');
    }
    caricaClassifica();
  }

  function caricaClassifica() {
    setStatoClassifica('caricamento');
    getClassificaArcade('chronoquiz', 10)
      .then((dati) => {
        setClassifica(dati || []);
        setStatoClassifica('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare la classifica ChronoQuiz:', errore);
        setStatoClassifica('errore');
      });
  }

  function resetPartita() {
    punteggioRef.current = 0;
    risposteCorretteRef.current = 0;
    gestitoRef.current = false;
    setPunteggioTotale(0);
    setRisposteCorrette(0);
    setIndiceDomanda(0);
    setFaseDomanda('in-corso');
    setOpzioneSelezionata(null);
    setNuovoRecord(false);
    setStatoInvio('inattivo');
    setUsernameSalvato(null);
    setStatoClassifica('inattivo');
  }

  function iniziaPartita() {
    resetPartita();
    setFase('gioco');
  }

  function rigioca() {
    resetPartita();
    caricaDomande(); // set di domande nuovo, non le stesse 10 di prima
    setFase('gioco');
  }

  function renderContenuto() {
    if (fase === 'regole') {
      return (
        <GlassPanel className="chronoquiz-view__panel chronoquiz-view__regole">
          <div className="chronoquiz-view__regole-testa">
            <h1 className="chronoquiz-view__titolo">ChronoQuiz</h1>
            <button type="button" className="chronoquiz-view__salta" onClick={iniziaPartita}>
              Salta regole &rarr;
            </button>
          </div>

          <ul className="chronoquiz-view__regole-lista">
            <li>10 domande di trivia storica sulla Formula 1, generate in modo diverso ogni volta.</li>
            <li>Hai 15 secondi per rispondere a ciascuna: la barra ciano segna il tempo che ti resta.</li>
            <li>Risposta corretta: 100 punti base, più un bonus fino a 150 punti in base a quanto sei stato veloce.</li>
            <li>Risposta sbagliata o tempo scaduto: 0 punti per quella domanda, si va avanti comunque.</li>
          </ul>

          <p className="chronoquiz-view__regole-nota">
            {utente
              ? 'Sei connesso: il punteggio finale verrà salvato in classifica in automatico.'
              : 'Puoi giocare senza account: accedi dalla barra in alto se vuoi salvare il punteggio in classifica.'}
          </p>

          <button type="button" className="chronoquiz-view__bottone-primario" onClick={iniziaPartita}>
            Inizia a giocare
          </button>
        </GlassPanel>
      );
    }

    if (fase === 'gioco') {
      if (statoDomande === 'caricamento') {
        return (
          <GlassPanel className="chronoquiz-view__panel chronoquiz-view__stato">
            <p>Stiamo preparando le domande...</p>
          </GlassPanel>
        );
      }

      if (statoDomande === 'errore' || domande.length === 0) {
        return (
          <GlassPanel className="chronoquiz-view__panel chronoquiz-view__stato">
            <p>Non riesco a generare le domande in questo momento.</p>
            <button type="button" className="chronoquiz-view__bottone-primario" onClick={caricaDomande}>
              Riprova
            </button>
          </GlassPanel>
        );
      }

      const domandaCorrente = domande[indiceDomanda];
      const rivelata = faseDomanda === 'rivelata';

      return (
        <>
          <div className="chronoquiz-view__intestazione">
            <span className="chronoquiz-view__progresso">
              Domanda {indiceDomanda + 1} di {domande.length}
            </span>
            <span className="chronoquiz-view__punteggio-corrente tab-num">{punteggioTotale} pts</span>
          </div>

          <div className="chronoquiz-view__barra-contenitore">
            <div
              key={indiceDomanda}
              className={`chronoquiz-view__barra ${rivelata ? 'chronoquiz-view__barra--ferma' : ''}`}
            />
          </div>

          <GlassPanel className="chronoquiz-view__panel">
            <h2 className="chronoquiz-view__domanda-testo">{domandaCorrente.text}</h2>

            <div className="chronoquiz-view__opzioni">
              {domandaCorrente.options.map((opzione, indice) => {
                let modificatore = '';
                if (rivelata) {
                  if (indice === domandaCorrente.correct_option_index) {
                    modificatore = 'chronoquiz-view__opzione--corretta';
                  } else if (indice === opzioneSelezionata) {
                    modificatore = 'chronoquiz-view__opzione--sbagliata';
                  } else {
                    modificatore = 'chronoquiz-view__opzione--neutra';
                  }
                }
                return (
                  <button
                    key={`${domandaCorrente.id}-${indice}`}
                    type="button"
                    className={`chronoquiz-view__opzione ${modificatore}`.trim()}
                    onClick={() => gestisciRisposta(indice)}
                    disabled={rivelata}
                  >
                    {opzione}
                  </button>
                );
              })}
            </div>
          </GlassPanel>
        </>
      );
    }

    // fase === 'finale'
    return (
      <>
        <GlassPanel className="chronoquiz-view__panel chronoquiz-view__finale">
          {nuovoRecord && <span className="badge chronoquiz-view__badge-record">Nuovo record!</span>}
          <span className="chronoquiz-view__finale-etichetta">Punteggio finale</span>
          <span className="chronoquiz-view__finale-punteggio tab-num">{punteggioTotale}</span>
          <p className="chronoquiz-view__finale-dettaglio">
            {risposteCorrette} risposte corrette su {domande.length}
          </p>

          {statoInvio === 'salvato' && (
            <p className="chronoquiz-view__esito-invio chronoquiz-view__esito-invio--ok">
              Punteggio salvato in classifica come {usernameSalvato}.
            </p>
          )}
          {statoInvio === 'non-salvato' && (
            <div className="chronoquiz-view__esito-invio">
              <p>Accedi per salvare questo punteggio in classifica.</p>
              <button type="button" className="chronoquiz-view__link-accedi" onClick={apriLogin}>
                Accedi
              </button>
            </div>
          )}
          {statoInvio === 'errore' && (
            <p className="chronoquiz-view__esito-invio chronoquiz-view__esito-invio--errore">
              Non sono riuscito a salvare il punteggio — riprova più tardi.
            </p>
          )}

          <div className="chronoquiz-view__finale-azioni">
            <button type="button" className="chronoquiz-view__bottone-primario" onClick={rigioca}>
              Rigioca
            </button>
            <Link to="/arcade" className="chronoquiz-view__torna-arcade">
              &larr; Torna all'Arcade
            </Link>
          </div>
        </GlassPanel>

        <GlassPanel className="chronoquiz-view__panel chronoquiz-view__classifica">
          <h3 className="chronoquiz-view__classifica-titolo">Classifica ChronoQuiz</h3>
          {statoClassifica === 'caricamento' && <p className="chronoquiz-view__classifica-stato">Carico la classifica...</p>}
          {statoClassifica === 'errore' && (
            <p className="chronoquiz-view__classifica-stato">Non riesco a mostrare la classifica in questo momento.</p>
          )}
          {statoClassifica === 'pronto' && classifica.length === 0 && (
            <p className="chronoquiz-view__classifica-stato">Nessun punteggio salvato ancora: sii il primo.</p>
          )}
          {statoClassifica === 'pronto' && classifica.length > 0 && (
            <ol className="chronoquiz-view__classifica-lista">
              {classifica.map((voce, indice) => (
                <li key={`${voce.username}-${voce.creato_il}-${indice}`} className="chronoquiz-view__classifica-voce">
                  <span className="chronoquiz-view__classifica-posizione tab-num">{indice + 1}</span>
                  <span className="chronoquiz-view__classifica-nome">{voce.username}</span>
                  <span className="chronoquiz-view__classifica-punti tab-num">{voce.punti} pts</span>
                </li>
              ))}
            </ol>
          )}
        </GlassPanel>
      </>
    );
  }

  return <main className="main">{renderContenuto()}</main>;
}
