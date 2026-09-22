import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  getClassificaCampionato,
  getClassificaTempiCircuito,
  getElencoCircuiti,
  getSchedaCircuito,
  inviaTempoGioco,
} from '../api/backend.js';
import {
  calcolaFattoreRettilineo,
  distanzaDalCentro,
  eFuoriPista,
  generaCenterline,
  generaCheckpoint,
  LARGHEZZA_PISTA,
  RAGGIO_CATTURA_CHECKPOINT,
  RIDUZIONE_VELOCITA_FUORI_PISTA,
} from '../game/pista.js';
import { avanzaFisica, controllaCatturaCheckpoint, statoIniziale, VELOCITA_MASSIMA_BASE } from '../game/fisica.js';
import './GameChampionshipView.css';

const LARGHEZZA_CANVAS = 900;
const ALTEZZA_CANVAS = 600;
const GIRI_PER_SESSIONE = { qualifica: 1, gara: 3 };
const ETICHETTA_SESSIONE = { prove_libere: 'Prove Libere', qualifica: 'Qualifica', gara: 'Gara' };

/**
 * GameChampionshipView — Time Attack asincrono ("Monoposto Virtual Arena")
 * + Campionato Mondiale Virtuale.
 *
 * Flow a 3 fasi: 'selezione' -> 'in-pista' -> 'riepilogo' (torna a
 * 'selezione' dopo, o restando in loop infinito per le Prove Libere, che
 * non hanno una fase 'riepilogo': si esce quando si vuole con "Abbandona").
 *
 * Login sempre facoltativo per GIOCARE (come ChronoQuiz), ma qui è
 * obbligatorio lato server per SALVARE un tempo ufficiale — un
 * campionato richiede un'identità persistente. Le Prove Libere non
 * chiamano mai il backend: girano solo qui, illimitate.
 *
 * La pista è generica ("Monoposto Virtual Arena", 4 curve standard),
 * MAI la sagoma reale di un circuito: nessuna geometria di circuito è
 * salvata nel DB né disegnata qui, per decisione esplicita presa con
 * l'utente (policy anti-invenzione di questo progetto). Il circuito
 * reale selezionato influenza solo la lunghezza dei rettilinei
 * (calcolaFattoreRettilineo, da lunghezza_km) — mai la forma.
 */
export default function GameChampionshipView() {
  const { utente, ottieniToken, apriLogin } = useAuth();

  const [fase, setFase] = useState('selezione'); // selezione | in-pista | riepilogo

  const [circuiti, setCircuiti] = useState([]);
  const [statoCircuiti, setStatoCircuiti] = useState('caricamento');
  const [circuitoSlug, setCircuitoSlug] = useState('');
  const [schedaCircuito, setSchedaCircuito] = useState(null);
  const [statoScheda, setStatoScheda] = useState('inattivo');

  const [tipoSessione, setTipoSessione] = useState('qualifica');

  const [risultatoFinale, setRisultatoFinale] = useState(null); // { tempoTotale }
  const [statoInvio, setStatoInvio] = useState('inattivo'); // inattivo | invio | salvato | non-salvato | login-richiesto | errore
  const [motivoRifiuto, setMotivoRifiuto] = useState(null);
  const [nuovoRecord, setNuovoRecord] = useState(false);

  const [classificaCircuito, setClassificaCircuito] = useState(null);
  const [statoClassificaCircuito, setStatoClassificaCircuito] = useState('inattivo');

  const [campionato, setCampionato] = useState([]);
  const [statoCampionato, setStatoCampionato] = useState('caricamento');

  const [hud, setHud] = useState({ tempoTrascorso: 0, giro: 1, fuoriPista: false, velocitaKmh: 0 });

  const canvasRef = useRef(null);
  const requestIdRef = useRef(null);
  const inputRef = useRef({ accelera: false, frena: false, sterzaSinistra: false, sterzaDestra: false });
  const centerlineRef = useRef([]);
  const checkpointRef = useRef([]);
  const statoAutoRef = useRef(statoIniziale({ x: 0, y: 0 }));
  const checkpointAttesoRef = useRef(0);
  const giroCorrenteRef = useRef(1);
  const telemetriaRef = useRef([]);
  const tempoInizioRef = useRef(0);
  const ultimoAggiornamentoHudRef = useRef(0);

  // Elenco circuiti per il selettore.
  useEffect(() => {
    getElencoCircuiti()
      .then((dati) => {
        setCircuiti(dati || []);
        setStatoCircuiti('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare l\u2019elenco circuiti:', errore);
        setStatoCircuiti('errore');
      });
  }, []);

  // Scheda del circuito selezionato: serve lunghezza_km per il
  // modificatore dei rettilinei (nessun'altra geometria viene letta).
  useEffect(() => {
    if (!circuitoSlug) {
      setSchedaCircuito(null);
      setStatoScheda('inattivo');
      return;
    }
    setStatoScheda('caricamento');
    getSchedaCircuito(circuitoSlug)
      .then((dati) => {
        setSchedaCircuito(dati);
        setStatoScheda(dati ? 'pronto' : 'errore');
      })
      .catch((errore) => {
        console.error('Errore nel caricare la scheda del circuito:', errore);
        setStatoScheda('errore');
      });
  }, [circuitoSlug]);

  // Classifica generale del campionato, precaricata (visibile anche
  // dalla schermata di selezione, non solo dopo aver giocato).
  useEffect(() => {
    getClassificaCampionato()
      .then((dati) => {
        setCampionato(dati || []);
        setStatoCampionato('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare il campionato:', errore);
        setStatoCampionato('errore');
      });
  }, []);

  // Input da tastiera (WASD + frecce), solo mentre si è in pista. Ascolta
  // su window (non sul canvas) così non dipende dal focus dell'elemento.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;

    const TASTI = {
      ArrowUp: 'accelera',
      KeyW: 'accelera',
      ArrowDown: 'frena',
      KeyS: 'frena',
      ArrowLeft: 'sterzaSinistra',
      KeyA: 'sterzaSinistra',
      ArrowRight: 'sterzaDestra',
      KeyD: 'sterzaDestra',
    };

    function suKeyDown(evento) {
      const campo = TASTI[evento.code];
      if (!campo) return;
      evento.preventDefault();
      inputRef.current[campo] = true;
    }
    function suKeyUp(evento) {
      const campo = TASTI[evento.code];
      if (!campo) return;
      inputRef.current[campo] = false;
    }

    window.addEventListener('keydown', suKeyDown);
    window.addEventListener('keyup', suKeyUp);
    return () => {
      window.removeEventListener('keydown', suKeyDown);
      window.removeEventListener('keyup', suKeyUp);
      inputRef.current = { accelera: false, frena: false, sterzaSinistra: false, sterzaDestra: false };
    };
  }, [fase]);

  // Il game loop vero e proprio.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;
    let ultimoTimestamp = null;
    let fermo = false;

    function disegna() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const auto = statoAutoRef.current;
      const offsetX = canvas.width / 2 - auto.x;
      const offsetY = canvas.height / 2 - auto.y;

      ctx.fillStyle = '#16241a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(offsetX, offsetY);

      const cl = centerlineRef.current;
      if (cl.length > 0) {
        ctx.beginPath();
        ctx.moveTo(cl[0].x, cl[0].y);
        for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x, cl[i].y);
        ctx.closePath();
        ctx.strokeStyle = '#2a2d33';
        ctx.lineWidth = LARGHEZZA_PISTA;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cl[0].x, cl[0].y - LARGHEZZA_PISTA / 2);
        ctx.lineTo(cl[0].x, cl[0].y + LARGHEZZA_PISTA / 2);
        ctx.stroke();
      }

      checkpointRef.current.forEach((cp, indice) => {
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = indice === checkpointAttesoRef.current ? '#3fd0ff' : 'rgba(217,164,65,0.35)';
        ctx.fill();
      });

      ctx.save();
      ctx.translate(auto.x, auto.y);
      ctx.rotate(auto.angolo);
      ctx.fillStyle = '#e8432e';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -9);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    function fotogramma(timestamp) {
      if (fermo) return;
      if (ultimoTimestamp === null) ultimoTimestamp = timestamp;
      // dt limitato a 50ms: su una tab in background requestAnimationFrame
      // può accumulare un intervallo enorme al ritorno in primo piano —
      // senza questo limite la fisica farebbe un salto irrealistico.
      const dt = Math.min((timestamp - ultimoTimestamp) / 1000, 0.05);
      ultimoTimestamp = timestamp;

      const { distanza } = distanzaDalCentro(statoAutoRef.current.x, statoAutoRef.current.y, centerlineRef.current);
      const fuoriPista = eFuoriPista(distanza);
      const velocitaMassima = VELOCITA_MASSIMA_BASE * (fuoriPista ? RIDUZIONE_VELOCITA_FUORI_PISTA : 1);
      statoAutoRef.current = avanzaFisica(statoAutoRef.current, inputRef.current, dt, velocitaMassima);

      const nuovoAtteso = controllaCatturaCheckpoint(
        statoAutoRef.current,
        checkpointRef.current,
        checkpointAttesoRef.current,
        RAGGIO_CATTURA_CHECKPOINT
      );
      if (nuovoAtteso !== checkpointAttesoRef.current) {
        const t = performance.now() - tempoInizioRef.current;
        telemetriaRef.current.push({ giro: giroCorrenteRef.current, indice: checkpointAttesoRef.current, t });

        if (checkpointAttesoRef.current === 3) {
          const giriTotali = GIRI_PER_SESSIONE[tipoSessione]; // undefined per prove_libere -> mai completa
          if (giriTotali && giroCorrenteRef.current >= giriTotali) {
            fermo = true;
            concludiSessione(t / 1000);
            return;
          }
          giroCorrenteRef.current += 1;
        }
        checkpointAttesoRef.current = nuovoAtteso;
      }

      disegna();

      if (!ultimoAggiornamentoHudRef.current || timestamp - ultimoAggiornamentoHudRef.current > 150) {
        ultimoAggiornamentoHudRef.current = timestamp;
        setHud({
          tempoTrascorso: (performance.now() - tempoInizioRef.current) / 1000,
          giro: giroCorrenteRef.current,
          fuoriPista,
          // Fattore di conversione arbitrario px/s -> km/h, solo per dare
          // un numero "leggibile" in HUD: non corrisponde a una vera
          // scala fisica del tracciato (che non esiste, è generico).
          velocitaKmh: Math.round((Math.abs(statoAutoRef.current.velocita) / VELOCITA_MASSIMA_BASE) * 320),
        });
      }

      requestIdRef.current = requestAnimationFrame(fotogramma);
    }

    requestIdRef.current = requestAnimationFrame(fotogramma);
    return () => {
      fermo = true;
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  function iniziaSessione(tipo) {
    if (!schedaCircuito) return;
    const fattore = calcolaFattoreRettilineo(schedaCircuito.lunghezza_km);
    const centerline = generaCenterline(fattore);
    const checkpoint = generaCheckpoint(centerline);

    centerlineRef.current = centerline;
    checkpointRef.current = checkpoint;
    statoAutoRef.current = statoIniziale(centerline[0]);
    checkpointAttesoRef.current = 0;
    giroCorrenteRef.current = 1;
    telemetriaRef.current = [];
    tempoInizioRef.current = performance.now();
    ultimoAggiornamentoHudRef.current = 0;

    setTipoSessione(tipo);
    setStatoInvio('inattivo');
    setMotivoRifiuto(null);
    setNuovoRecord(false);
    setRisultatoFinale(null);
    setHud({ tempoTrascorso: 0, giro: 1, fuoriPista: false, velocitaKmh: 0 });
    setFase('in-pista');
  }

  function abbandonaSessione() {
    setFase('selezione');
  }

  function concludiSessione(tempoTotaleSecondi) {
    const telemetria = [...telemetriaRef.current];
    setRisultatoFinale({ tempoTotale: tempoTotaleSecondi });
    setFase('riepilogo');

    if (tipoSessione === 'prove_libere') return; // mai inviato, per scelta

    inviaERicaricaClassifica(tempoTotaleSecondi, telemetria);
  }

  async function inviaERicaricaClassifica(tempoTotaleSecondi, telemetria) {
    setStatoInvio('invio');
    try {
      const token = await ottieniToken();
      const risposta = await inviaTempoGioco(circuitoSlug, tipoSessione, tempoTotaleSecondi, telemetria, token);
      if (risposta.motivo_rifiuto === 'login_richiesto') {
        setStatoInvio('login-richiesto');
      } else {
        setStatoInvio(risposta.salvato ? 'salvato' : 'non-salvato');
        setMotivoRifiuto(risposta.motivo_rifiuto || null);
        setNuovoRecord(Boolean(risposta.record_personale));
      }
    } catch (errore) {
      console.error('Errore nell\u2019inviare il tempo di gioco:', errore);
      setStatoInvio('errore');
    }
    caricaClassificaCircuito();
  }

  function caricaClassificaCircuito() {
    setStatoClassificaCircuito('caricamento');
    getClassificaTempiCircuito(circuitoSlug, 10)
      .then((dati) => {
        setClassificaCircuito(dati);
        setStatoClassificaCircuito(dati ? 'pronto' : 'errore');
      })
      .catch((errore) => {
        console.error('Errore nel caricare la classifica del circuito:', errore);
        setStatoClassificaCircuito('errore');
      });
  }

  function formattaTempo(secondi) {
    const min = Math.floor(secondi / 60);
    const sec = (secondi % 60).toFixed(3).padStart(6, '0');
    return min > 0 ? `${min}:${sec}` : `${sec}s`;
  }

  return <main className="main game-championship-view">{renderContenuto()}</main>;

  function renderContenuto() {
    if (fase === 'in-pista') {
      const giriTotali = GIRI_PER_SESSIONE[tipoSessione];
      return (
        <div className="game-championship-view__in-pista">
          <div className="game-championship-view__hud">
            <span>{schedaCircuito?.nome} &mdash; {ETICHETTA_SESSIONE[tipoSessione]}</span>
            <span className="tab-num">{formattaTempo(hud.tempoTrascorso)}</span>
            <span className="tab-num">{giriTotali ? `Giro ${hud.giro}/${giriTotali}` : `Giro ${hud.giro}`}</span>
            <span className="tab-num">{hud.velocitaKmh} km/h</span>
            <span className={hud.fuoriPista ? 'game-championship-view__fuori-pista' : ''}>
              {hud.fuoriPista ? 'FUORI PISTA' : ''}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={LARGHEZZA_CANVAS}
            height={ALTEZZA_CANVAS}
            className="game-championship-view__canvas"
          />
          <div className="game-championship-view__controlli-info">
            Frecce o WASD per guidare &mdash; accelera, frena/retro, sterza
          </div>
          <button type="button" className="game-championship-view__abbandona" onClick={abbandonaSessione}>
            Abbandona
          </button>
        </div>
      );
    }

    if (fase === 'riepilogo') {
      return (
        <>
          <GlassPanel className="game-championship-view__panel game-championship-view__riepilogo">
            {nuovoRecord && <span className="badge game-championship-view__badge-record">Nuovo record personale!</span>}
            <span className="game-championship-view__riepilogo-etichetta">
              {ETICHETTA_SESSIONE[tipoSessione]} &mdash; {schedaCircuito?.nome}
            </span>
            <span className="game-championship-view__riepilogo-tempo tab-num">
              {risultatoFinale ? formattaTempo(risultatoFinale.tempoTotale) : '--'}
            </span>

            {tipoSessione === 'prove_libere' && (
              <p className="game-championship-view__esito">Prove Libere: nessun tempo salvato, solo allenamento.</p>
            )}
            {statoInvio === 'salvato' && <p className="game-championship-view__esito game-championship-view__esito--ok">Tempo salvato ufficialmente.</p>}
            {statoInvio === 'non-salvato' && (
              <p className="game-championship-view__esito">{motivoRifiuto || 'Tempo non salvato.'}</p>
            )}
            {statoInvio === 'login-richiesto' && (
              <div className="game-championship-view__esito">
                <p>Accedi per salvare i tempi ufficiali e scalare il Campionato.</p>
                <button type="button" className="game-championship-view__link-accedi" onClick={apriLogin}>
                  Accedi
                </button>
              </div>
            )}
            {statoInvio === 'errore' && (
              <p className="game-championship-view__esito game-championship-view__esito--errore">
                Non sono riuscito a salvare il tempo &mdash; riprova più tardi.
              </p>
            )}

            <div className="game-championship-view__riepilogo-azioni">
              <button type="button" className="game-championship-view__bottone-primario" onClick={() => iniziaSessione(tipoSessione)}>
                Rigioca
              </button>
              <button type="button" className="game-championship-view__torna-selezione" onClick={() => setFase('selezione')}>
                &larr; Cambia circuito o sessione
              </button>
            </div>
          </GlassPanel>

          {tipoSessione !== 'prove_libere' && (
            <GlassPanel className="game-championship-view__panel game-championship-view__classifica">
              <h3 className="game-championship-view__classifica-titolo">Classifica &mdash; {schedaCircuito?.nome}</h3>
              {statoClassificaCircuito === 'caricamento' && <p className="game-championship-view__classifica-stato">Carico la classifica...</p>}
              {statoClassificaCircuito === 'errore' && <p className="game-championship-view__classifica-stato">Non riesco a mostrare la classifica ora.</p>}
              {statoClassificaCircuito === 'pronto' && classificaCircuito && (
                <ol className="game-championship-view__classifica-lista">
                  {(classificaCircuito[tipoSessione] || []).map((voce, indice) => (
                    <li key={`${voce.username}-${indice}`} className="game-championship-view__classifica-voce">
                      <span className="tab-num">{indice + 1}</span>
                      <span className="game-championship-view__classifica-nome">{voce.username}</span>
                      <span className="tab-num">{formattaTempo(voce.tempo_totale)}</span>
                    </li>
                  ))}
                  {(classificaCircuito[tipoSessione] || []).length === 0 && (
                    <p className="game-championship-view__classifica-stato">Nessun tempo ancora registrato per questa sessione.</p>
                  )}
                </ol>
              )}
            </GlassPanel>
          )}
        </>
      );
    }

    // fase === 'selezione'
    return (
      <>
        <header className="game-championship-view__header">
          <h1 className="game-championship-view__titolo">
            MONOPOSTO <span className="game-championship-view__titolo-accento">TIME ATTACK</span>
          </h1>
          <p className="game-championship-view__sottotitolo">
            Un giro cronometrato sulla Monoposto Virtual Arena. Scegli un circuito reale dal nostro archivio (ne
            influenza solo la lunghezza dei rettilinei, non la forma) e mettiti alla prova.
          </p>
          <p className="game-championship-view__nota-login">
            {utente
              ? 'Sei connesso: i tempi di Qualifica e Gara verranno salvati e conteranno per il Campionato.'
              : 'Puoi giocare senza account (anche le Prove Libere sono sempre gratuite): accedi dalla barra in alto per salvare tempi ufficiali.'}
          </p>
        </header>

        <GlassPanel className="game-championship-view__panel game-championship-view__selezione">
          <label className="game-championship-view__campo">
            <span>Circuito</span>
            {statoCircuiti === 'caricamento' && <p className="game-championship-view__classifica-stato">Carico i circuiti...</p>}
            {statoCircuiti === 'errore' && <p className="game-championship-view__classifica-stato">Non riesco a caricare l&rsquo;elenco dei circuiti.</p>}
            {statoCircuiti === 'pronto' && (
              <select
                className="game-championship-view__select"
                value={circuitoSlug}
                onChange={(evento) => setCircuitoSlug(evento.target.value)}
              >
                <option value="">Scegli un circuito&hellip;</option>
                {circuiti.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
          </label>

          {statoScheda === 'pronto' && schedaCircuito?.lunghezza_km && (
            <p className="game-championship-view__nota-circuito">
              {schedaCircuito.nome} &mdash; {schedaCircuito.lunghezza_km} km nella realtà: rettilinei più lunghi del
              solito su questa pista.
            </p>
          )}

          <div className="game-championship-view__campo">
            <span>Sessione</span>
            <div className="game-championship-view__sessioni">
              {['prove_libere', 'qualifica', 'gara'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={`game-championship-view__sessione-bottone ${tipoSessione === tipo ? 'game-championship-view__sessione-bottone--attiva' : ''}`}
                  onClick={() => setTipoSessione(tipo)}
                >
                  {ETICHETTA_SESSIONE[tipo]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="game-championship-view__bottone-primario"
            disabled={!schedaCircuito}
            onClick={() => iniziaSessione(tipoSessione)}
          >
            Vai in pista
          </button>
        </GlassPanel>

        <GlassPanel className="game-championship-view__panel game-championship-view__campionato">
          <h3 className="game-championship-view__classifica-titolo">Campionato Mondiale Virtuale</h3>
          {statoCampionato === 'caricamento' && <p className="game-championship-view__classifica-stato">Carico il campionato...</p>}
          {statoCampionato === 'errore' && <p className="game-championship-view__classifica-stato">Non riesco a mostrare il campionato ora.</p>}
          {statoCampionato === 'pronto' && campionato.length === 0 && (
            <p className="game-championship-view__classifica-stato">Nessun GP disputato ancora.</p>
          )}
          {statoCampionato === 'pronto' && campionato.length > 0 && (
            <ol className="game-championship-view__classifica-lista">
              {campionato.map((voce) => (
                <li key={voce.username} className="game-championship-view__classifica-voce">
                  <span className="tab-num">{voce.posizione}</span>
                  <span className="game-championship-view__classifica-nome">{voce.username}</span>
                  <span className="tab-num">{voce.punti_totali} pt</span>
                </li>
              ))}
            </ol>
          )}
        </GlassPanel>

        <p className="game-championship-view__torna-arcade">
          <Link to="/arcade">&larr; Torna all&rsquo;Arcade</Link>
        </p>
      </>
    );
  }
}
