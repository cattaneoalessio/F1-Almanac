import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  getClassificaCampionato,
  getClassificaTempiCircuito,
  getGrigliaPartenza,
  getMioRecord,
  inviaTempoGioco,
} from '../api/backend.js';
import {
  calcolaSegmentiVisibili,
  LARGHEZZA_PISTA,
  LUNGHEZZA_SEGMENTO,
  proietta,
  segmentoA,
  controllaCatturaCheckpointSegmento,
} from '../game/circuito3d.js';
import { avanzaFisica, statoIniziale } from '../game/fisica3d.js';
import { coloreGiro, estraiCheckpointDelGiro, trovaMigliorGiroValido } from '../game/sessione.js';
import './GameChampionshipView.css';

// Circuito fisso, hardcoded: non più una scelta tra i circuiti reali
// dell'archivio (Fase D) — quelli restano per la pagina /circuiti del
// sito, ma il gioco ora gira solo sul suo tracciato pseudo-3D dedicato.
// 'brianza-speed-ring' è una riga a sé nella tabella circuiti
// (fittizio=true), invisibile all'archivio pubblico, vedi main.py.
const CIRCUITO_SLUG = 'brianza-speed-ring';
const CIRCUITO_NOME = 'Brianza Speed Ring';

const GIRI_GARA = 10; // richiesta esplicita dell'utente
const LIMITE_TEMPO_QUALIFICA_SECONDI = 180;
const ETICHETTA_SESSIONE = { prove_libere: 'Prove Libere', qualifica: 'Qualifica', gara: 'Gara' };
const ETICHETTA_ZONA = { 'cordolo-una-ruota': 'CORDOLO', 'cordolo-due-ruote': 'CORDOLO', erba: "SULL'ERBA" };

// Semaforo di partenza — stessa logica del vecchio motore 2D (confermata
// esplicitamente dall'utente: "la logica del semaforo rimane").
const NUMERO_LUCI = 5;
const INTERVALLO_LUCE_MS = 400;
const ATTESA_EXTRA_MIN_MS = 1000;
const ATTESA_EXTRA_MAX_MS = 3000;
const DURATA_FLASH_VIA_MS = 700;

// Rendering pseudo-3D
const NUMERO_SEGMENTI_VISIBILI = 160;
const ALTEZZA_OCCHI = 1.2; // metri sopra il piano stradale
const CAMPO_VISIVO_GRADI = 100;
const PROFONDITA_CAMERA = 1 / Math.tan((CAMPO_VISIVO_GRADI / 2) * (Math.PI / 180));
const SEGMENTI_PER_STRISCIA_CORDOLO = 4;
const SEMI_LARGHEZZA_PISTA = LARGHEZZA_PISTA / 2;

/**
 * GameChampionshipView — Time Attack pseudo-3D in prima persona
 * ("Brianza Speed Ring"), motore rifatto da zero rispetto alla prima
 * versione top-down 2D (decisione esplicita dell'utente: "in 2d
 * l'esperienza è pessima... sarà un primo rifacimento, poi metteremo
 * altri dettagli").
 *
 * Circuito fisso e hardcoded (non più una scelta tra i circuiti reali
 * dell'archivio): liberamente ispirato a Monza, non una ricostruzione
 * fedele (curve riordinate, lunghezza diversa — 4 km contro i 5,79 km
 * reali — dislivelli che Monza reale non ha), deciso insieme all'utente
 * dopo aver segnalato il conflitto con la policy del progetto contro le
 * geometrie reali. Vedi game/circuito3d.js per la geometria.
 *
 * Sistema fuori-pista (cordoli/erba/muri) alle specifiche esatte
 * dell'utente — vedi game/fisica3d.js. Il sistema di PENALITÀ a tempo
 * per taglio curva (quello della prima versione 2D) non è ancora
 * riportato in questo motore: qui c'è solo il rallentamento fisico
 * (cordoli/erba), non ancora la penalità di +5s né i colori
 * verde/viola nella cronologia giri — rimandato a un giro successivo,
 * come concordato ("poi metteremo altri dettagli").
 *
 * Login sempre facoltativo per giocare; Qualifica e Gara salvano un
 * tempo ufficiale solo se loggato (stesso schema del vecchio motore).
 * Prove Libere non chiamano mai il backend.
 */
export default function GameChampionshipView() {
  const { utente, ottieniToken, apriLogin } = useAuth();

  const [fase, setFase] = useState('selezione'); // selezione | in-pista | riepilogo
  const [tipoSessione, setTipoSessione] = useState('qualifica');

  const [risultatoFinale, setRisultatoFinale] = useState(null);
  const [statoInvio, setStatoInvio] = useState('inattivo');
  const [motivoRifiuto, setMotivoRifiuto] = useState(null);
  const [nuovoRecord, setNuovoRecord] = useState(false);

  const [classificaCircuito, setClassificaCircuito] = useState(null);
  const [statoClassificaCircuito, setStatoClassificaCircuito] = useState('inattivo');

  const [campionato, setCampionato] = useState([]);
  const [statoCampionato, setStatoCampionato] = useState('caricamento');

  const [hud, setHud] = useState({ tempoTrascorso: 0, giro: 1, velocitaKmh: 0, zona: 'pista' });

  const [numeroLuciAccese, setNumeroLuciAccese] = useState(0);
  const [semaforoVia, setSemaforoVia] = useState(false);
  const [mostraVia, setMostraVia] = useState(false);

  const [giriCompletati, setGiriCompletati] = useState([]);

  const [grigliaInfo, setGrigliaInfo] = useState(null);
  const [statoGriglia, setStatoGriglia] = useState('inattivo');

  const [schermoIntero, setSchermoIntero] = useState(false);
  const [orientamentoPortrait, setOrientamentoPortrait] = useState(false);
  const [haTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestIdRef = useRef(null);
  const inputRef = useRef({ accelera: false, frena: false, sterzaSinistra: false, sterzaDestra: false });
  const statoAutoRef = useRef(statoIniziale());
  const checkpointAttesoRef = useRef(0);
  const giroCorrenteRef = useRef(1);
  const telemetriaRef = useRef([]);
  const tempoInizioRef = useRef(0);
  const inizioGiroRef = useRef(0);
  const giriCompletatiRef = useRef([]);
  const viaRef = useRef(false);
  const mioRecordRef = useRef({ qualifica: null, gara: null });
  const ultimoAggiornamentoHudRef = useRef(0);
  const angoloVolanteRef = useRef(0);

  // Classifica generale del campionato, precaricata.
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

  // Input da tastiera, solo mentre si è in pista. Attivo anche durante
  // il semaforo: i tasti non fanno nulla finché viaRef non è true.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;
    const TASTI = {
      ArrowUp: 'accelera', KeyW: 'accelera',
      ArrowDown: 'frena', KeyS: 'frena',
      ArrowLeft: 'sterzaSinistra', KeyA: 'sterzaSinistra',
      ArrowRight: 'sterzaDestra', KeyD: 'sterzaDestra',
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

  // Stato fullscreen: sul CONTENITORE del gioco, non su tutta la
  // pagina — così la UI del sito (barra di navigazione, footer) sparisce
  // da sola, senza doverla nascondere a mano. Su mobile, tenta anche il
  // blocco dell'orientamento landscape (fallisce silenziosamente su
  // iOS Safari, che non lo supporta — l'utente l'ha accettato).
  useEffect(() => {
    function suCambioFullscreen() {
      const attivo = document.fullscreenElement === containerRef.current;
      setSchermoIntero(attivo);
      if (attivo && haTouch && typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // iOS Safari e altri: nessun blocco possibile, va bene così
          // (mostriamo comunque l'invito a ruotare se serve, vedi sotto).
        });
      }
    }
    document.addEventListener('fullscreenchange', suCambioFullscreen);
    return () => document.removeEventListener('fullscreenchange', suCambioFullscreen);
  }, [haTouch]);

  // Rileva l'orientamento del dispositivo, per l'invito a ruotare su
  // iOS (dove non possiamo forzarlo via API).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(orientation: portrait)');
    function aggiorna() {
      setOrientamentoPortrait(query.matches);
    }
    aggiorna();
    query.addEventListener('change', aggiorna);
    return () => query.removeEventListener('change', aggiorna);
  }, []);

  // Il canvas segue le dimensioni reali con cui è mostrato (responsive,
  // cambia in fullscreen): il buffer di disegno deve combaciare o il
  // rendering risulta sfocato o tagliato.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;
    function ridimensiona() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rapportoPixel = Math.min(window.devicePixelRatio || 1, 2);
      const larghezzaCss = canvas.clientWidth;
      const altezzaCss = canvas.clientHeight;
      if (larghezzaCss === 0 || altezzaCss === 0) return;
      canvas.width = Math.round(larghezzaCss * rapportoPixel);
      canvas.height = Math.round(altezzaCss * rapportoPixel);
    }
    ridimensiona();
    window.addEventListener('resize', ridimensiona);
    const idTimeout = setTimeout(ridimensiona, 50); // dopo il cambio fullscreen, le dimensioni CSS si assestano con un frame di ritardo
    return () => {
      window.removeEventListener('resize', ridimensiona);
      clearTimeout(idTimeout);
    };
  }, [fase, schermoIntero]);

  // Sequenza del semaforo — stessa logica del vecchio motore 2D, non
  // toccata (l'utente ha chiesto esplicitamente di mantenerla).
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;
    setSemaforoVia(false);
    setMostraVia(false);
    setNumeroLuciAccese(0);
    viaRef.current = false;

    const idTimeout = [];
    for (let i = 1; i <= NUMERO_LUCI; i++) {
      idTimeout.push(setTimeout(() => setNumeroLuciAccese(i), i * INTERVALLO_LUCE_MS));
    }
    const attesaExtra = ATTESA_EXTRA_MIN_MS + Math.random() * (ATTESA_EXTRA_MAX_MS - ATTESA_EXTRA_MIN_MS);
    const ritardoTotaleMs = NUMERO_LUCI * INTERVALLO_LUCE_MS + attesaExtra;
    idTimeout.push(
      setTimeout(() => {
        const adesso = performance.now();
        viaRef.current = true;
        tempoInizioRef.current = adesso;
        inizioGiroRef.current = adesso;
        setSemaforoVia(true);
        setMostraVia(true);
        idTimeout.push(setTimeout(() => setMostraVia(false), DURATA_FLASH_VIA_MS));
      }, ritardoTotaleMs)
    );
    return () => idTimeout.forEach(clearTimeout);
  }, [fase]);

  // Il game loop: fisica + rendering pseudo-3D.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;
    let ultimoTimestamp = null;
    let fermo = false;

    function disegnaSfondo(ctx, larghezza, altezza) {
      const orizzonte = altezza * 0.42;
      const cielo = ctx.createLinearGradient(0, 0, 0, orizzonte);
      cielo.addColorStop(0, '#0b0c10');
      cielo.addColorStop(1, '#3a2e1a');
      ctx.fillStyle = cielo;
      ctx.fillRect(0, 0, larghezza, orizzonte);
      ctx.fillStyle = '#16241a';
      ctx.fillRect(0, orizzonte, larghezza, altezza - orizzonte);
    }

    function disegnaScenarioLato(ctx, xBase, yBase, scala, indiceSegmento, curva, lato) {
      const dimensione = Math.max(3, 55 * scala);
      if (dimensione < 3.5) return;
      const x = xBase + lato * dimensione * 2.2;
      if (Math.abs(curva) > 1.2) {
        ctx.fillStyle = '#1d3a1f';
        ctx.beginPath();
        ctx.moveTo(x, yBase - dimensione * 1.7);
        ctx.lineTo(x - dimensione * 0.55, yBase);
        ctx.lineTo(x + dimensione * 0.55, yBase);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5c3d24';
        ctx.fillRect(x - dimensione * 0.08, yBase, dimensione * 0.16, dimensione * 0.3);
      } else {
        ctx.fillStyle = '#23262c';
        ctx.fillRect(x - dimensione * 0.65, yBase - dimensione * 0.9, dimensione * 1.3, dimensione * 0.9);
        if (indiceSegmento % 3 === 0) {
          ctx.fillStyle = 'rgba(217,164,65,0.55)';
          ctx.fillRect(x - dimensione * 0.65, yBase - dimensione * 0.9, dimensione * 1.3, dimensione * 0.22);
        }
      }
    }

    function disegnaCavalcavia(ctx, proiettati) {
      // Punto in cui la pista è più alta (la curva in salita del tratto
      // 4 in circuito3d.js): decorazione con piloni verticali, dà
      // l'impressione di un cavalcavia senza richiedere un vero
      // incrocio geometrico auto-intersecante del tracciato.
      for (const p of proiettati) {
        if (p.y_mondo > 6 && p.scala > 0.05) {
          const semiLarghezza = p.larghezzaProiettata / 2;
          ctx.strokeStyle = '#4a4d54';
          ctx.lineWidth = Math.max(1, 4 * p.scala);
          ctx.beginPath();
          ctx.moveTo(p.x - semiLarghezza * 1.3, p.y);
          ctx.lineTo(p.x - semiLarghezza * 1.3, p.y + 40 * p.scala);
          ctx.moveTo(p.x + semiLarghezza * 1.3, p.y);
          ctx.lineTo(p.x + semiLarghezza * 1.3, p.y + 40 * p.scala);
          ctx.stroke();
        }
      }
    }

    function disegnaAbitacolo(ctx, larghezza, altezza) {
      const centroX = larghezza / 2;
      const baseY = altezza;

      ctx.fillStyle = '#14161a';
      ctx.beginPath();
      ctx.ellipse(centroX, baseY + altezza * 0.1, larghezza * 0.24, altezza * 0.22, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#3fd0ff';
      ctx.lineWidth = Math.max(2, altezza * 0.008);
      ctx.beginPath();
      ctx.ellipse(centroX, baseY + altezza * 0.1, larghezza * 0.24, altezza * 0.22, 0, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();

      const raggioVolante = larghezza * 0.085;
      ctx.save();
      ctx.translate(centroX, baseY - altezza * 0.01);
      ctx.rotate(angoloVolanteRef.current);
      ctx.strokeStyle = '#0b0c10';
      ctx.lineWidth = raggioVolante * 0.38;
      ctx.beginPath();
      ctx.arc(0, 0, raggioVolante, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#e8432e';
      ctx.lineWidth = raggioVolante * 0.16;
      ctx.beginPath();
      ctx.moveTo(-raggioVolante * 0.9, 0);
      ctx.lineTo(raggioVolante * 0.9, 0);
      ctx.moveTo(0, -raggioVolante * 0.9);
      ctx.lineTo(0, raggioVolante * 0.15);
      ctx.stroke();
      ctx.restore();
    }

    function disegna() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) return;

      disegnaSfondo(ctx, W, H);

      const auto = statoAutoRef.current;
      const segmentoCorrente = segmentoA(Math.floor(auto.distanza / LUNGHEZZA_SEGMENTO));
      const camera = {
        distanza: auto.distanza,
        mondoX: segmentoCorrente.mondoX + auto.x,
        mondoY: segmentoCorrente.mondoY + ALTEZZA_OCCHI,
      };

      const segmenti = calcolaSegmentiVisibili(camera, NUMERO_SEGMENTI_VISIBILI);
      const proiettati = [];
      for (const s of segmenti) {
        const p = proietta(s, PROFONDITA_CAMERA, W, H);
        if (p) proiettati.push({ ...p, ...s, y_mondo: s.y });
      }

      for (let i = proiettati.length - 1; i > 0; i--) {
        const lontano = proiettati[i];
        const vicino = proiettati[i - 1];
        const semiL = lontano.larghezzaProiettata / 2;
        const semiV = vicino.larghezzaProiettata / 2;
        if (semiV < 0.5) continue;

        disegnaScenarioLato(ctx, vicino.x, vicino.y, vicino.scala, vicino.indiceSegmento, vicino.curva, -1);
        disegnaScenarioLato(ctx, vicino.x, vicino.y, vicino.scala, vicino.indiceSegmento, vicino.curva, 1);

        ctx.fillStyle = vicino.indiceSegmento % 2 === 0 ? '#2f4a2f' : '#28422c';
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiL * 1.6, lontano.y);
        ctx.lineTo(lontano.x + semiL * 1.6, lontano.y);
        ctx.lineTo(vicino.x + semiV * 1.6, vicino.y);
        ctx.lineTo(vicino.x - semiV * 1.6, vicino.y);
        ctx.closePath();
        ctx.fill();

        const coloreCordolo = Math.floor(vicino.indiceSegmento / SEGMENTI_PER_STRISCIA_CORDOLO) % 2 === 0 ? '#c0392b' : '#e8e8e8';
        ctx.fillStyle = coloreCordolo;
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiL * 1.15, lontano.y);
        ctx.lineTo(lontano.x + semiL * 1.15, lontano.y);
        ctx.lineTo(vicino.x + semiV * 1.15, vicino.y);
        ctx.lineTo(vicino.x - semiV * 1.15, vicino.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = vicino.indiceSegmento % 2 === 0 ? '#2a2d33' : '#25282e';
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiL, lontano.y);
        ctx.lineTo(lontano.x + semiL, lontano.y);
        ctx.lineTo(vicino.x + semiV, vicino.y);
        ctx.lineTo(vicino.x - semiV, vicino.y);
        ctx.closePath();
        ctx.fill();

        if (vicino.indiceSegmento % 6 < 3) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(lontano.x - semiL * 0.02, lontano.y);
          ctx.lineTo(lontano.x + semiL * 0.02, lontano.y);
          ctx.lineTo(vicino.x + semiV * 0.02, vicino.y);
          ctx.lineTo(vicino.x - semiV * 0.02, vicino.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      disegnaCavalcavia(ctx, proiettati);
      disegnaAbitacolo(ctx, W, H);
    }

    function fotogramma(timestamp) {
      if (fermo) return;
      if (ultimoTimestamp === null) ultimoTimestamp = timestamp;
      const dt = Math.min((timestamp - ultimoTimestamp) / 1000, 0.05);
      ultimoTimestamp = timestamp;

      if (!viaRef.current) {
        disegna();
        requestIdRef.current = requestAnimationFrame(fotogramma);
        return;
      }

      const segmentoAttuale = segmentoA(Math.floor(statoAutoRef.current.distanza / LUNGHEZZA_SEGMENTO));
      statoAutoRef.current = avanzaFisica(statoAutoRef.current, inputRef.current, dt, segmentoAttuale.curva, SEMI_LARGHEZZA_PISTA);

      const angoloTarget = (inputRef.current.sterzaDestra ? 1 : 0) - (inputRef.current.sterzaSinistra ? 1 : 0);
      angoloVolanteRef.current += (angoloTarget * 0.6 - angoloVolanteRef.current) * Math.min(1, dt * 8);

      const adesso = performance.now();
      const segmentoAssolutoAttuale = Math.floor(statoAutoRef.current.distanza / LUNGHEZZA_SEGMENTO);
      const nuovoAtteso = controllaCatturaCheckpointSegmento(segmentoAssolutoAttuale, giroCorrenteRef.current, checkpointAttesoRef.current);
      if (nuovoAtteso !== checkpointAttesoRef.current) {
        const tSessione = adesso - tempoInizioRef.current;
        telemetriaRef.current.push({ giro: giroCorrenteRef.current, indice: checkpointAttesoRef.current, t: tSessione });

        if (checkpointAttesoRef.current === 3) {
          const numeroGiroCompletato = giroCorrenteRef.current;
          const tempoGiroSecondi = (adesso - inizioGiroRef.current) / 1000;
          const inizioGiroRelativoASessione = inizioGiroRef.current - tempoInizioRef.current;
          const checkpointDiQuestoGiro = estraiCheckpointDelGiro(telemetriaRef.current, numeroGiroCompletato, inizioGiroRelativoASessione);

          giriCompletatiRef.current = [
            ...giriCompletatiRef.current,
            { numero: numeroGiroCompletato, tempo: tempoGiroSecondi, valido: true, checkpoint: checkpointDiQuestoGiro },
          ];
          setGiriCompletati(giriCompletatiRef.current);
          inizioGiroRef.current = adesso;

          if (tipoSessione === 'gara' && giroCorrenteRef.current >= GIRI_GARA) {
            fermo = true;
            concludiGara(tSessione / 1000);
            return;
          }
          giroCorrenteRef.current += 1;
        }
        checkpointAttesoRef.current = nuovoAtteso;
      }

      if (tipoSessione === 'qualifica') {
        const trascorsiSecondi = (adesso - tempoInizioRef.current) / 1000;
        if (trascorsiSecondi >= LIMITE_TEMPO_QUALIFICA_SECONDI) {
          fermo = true;
          concludiQualifica();
          return;
        }
      }

      disegna();

      if (!ultimoAggiornamentoHudRef.current || timestamp - ultimoAggiornamentoHudRef.current > 150) {
        ultimoAggiornamentoHudRef.current = timestamp;
        setHud({
          tempoTrascorso: (performance.now() - tempoInizioRef.current) / 1000,
          giro: giroCorrenteRef.current,
          velocitaKmh: Math.round(statoAutoRef.current.velocita * 3.6),
          zona: statoAutoRef.current.zona,
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
  }, [fase, tipoSessione]);

  function iniziaSessione(tipo) {
    statoAutoRef.current = statoIniziale();
    checkpointAttesoRef.current = 0;
    giroCorrenteRef.current = 1;
    telemetriaRef.current = [];
    giriCompletatiRef.current = [];
    ultimoAggiornamentoHudRef.current = 0;
    angoloVolanteRef.current = 0;

    setTipoSessione(tipo);
    setStatoInvio('inattivo');
    setMotivoRifiuto(null);
    setNuovoRecord(false);
    setRisultatoFinale(null);
    setGiriCompletati([]);
    setHud({ tempoTrascorso: 0, giro: 1, velocitaKmh: 0, zona: 'pista' });

    mioRecordRef.current = { qualifica: null, gara: null };
    ottieniToken()
      .then((token) => getMioRecord(CIRCUITO_SLUG, token))
      .then((dati) => {
        mioRecordRef.current = dati;
      })
      .catch((errore) => console.error('Errore nel caricare il mio record personale:', errore));

    if (tipo === 'gara') {
      setStatoGriglia('caricamento');
      ottieniToken()
        .then((token) => getGrigliaPartenza(CIRCUITO_SLUG, token))
        .then((dati) => {
          setGrigliaInfo(dati);
          setStatoGriglia('pronto');
        })
        .catch((errore) => {
          console.error('Errore nel caricare la griglia di partenza:', errore);
          setStatoGriglia('errore');
        });
    } else {
      setGrigliaInfo(null);
      setStatoGriglia('inattivo');
    }

    setFase('in-pista');
  }

  function abbandonaSessione() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setFase('selezione');
  }

  function attivaSchermoIntero() {
    const elemento = containerRef.current;
    if (elemento && elemento.requestFullscreen) {
      elemento.requestFullscreen().catch((errore) => console.error('Errore entrando in fullscreen:', errore));
    }
  }
  function disattivaSchermoIntero() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function gestoriPulsanteControllo(campo) {
    const imposta = (valore) => (evento) => {
      evento.preventDefault();
      inputRef.current[campo] = valore;
    };
    return {
      onTouchStart: imposta(true),
      onTouchEnd: imposta(false),
      onTouchCancel: imposta(false),
      onMouseDown: imposta(true),
      onMouseUp: imposta(false),
      onMouseLeave: imposta(false),
    };
  }

  function concludiGara(tempoTotaleSecondi) {
    const telemetria = [...telemetriaRef.current];
    setRisultatoFinale({ tempoTotale: tempoTotaleSecondi });
    setFase('riepilogo');
    inviaERicaricaClassifica(tempoTotaleSecondi, telemetria);
  }

  function concludiQualifica() {
    const migliore = trovaMigliorGiroValido(giriCompletatiRef.current);
    setFase('riepilogo');
    if (migliore === null) {
      setRisultatoFinale({ tempoTotale: null });
      setStatoInvio('nessun-tempo');
      caricaClassificaCircuito();
      return;
    }
    setRisultatoFinale({ tempoTotale: migliore.tempo });
    inviaERicaricaClassifica(migliore.tempo, migliore.checkpoint);
  }

  async function inviaERicaricaClassifica(tempoTotaleSecondi, checkpoint) {
    if (tipoSessione === 'prove_libere') return;

    setStatoInvio('invio');
    try {
      const token = await ottieniToken();
      const risposta = await inviaTempoGioco(CIRCUITO_SLUG, tipoSessione, tempoTotaleSecondi, checkpoint, token);
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
    getClassificaTempiCircuito(CIRCUITO_SLUG, 10)
      .then((dati) => {
        setClassificaCircuito(dati);
        setStatoClassificaCircuito(dati ? 'pronto' : 'errore');
      })
      .catch((errore) => {
        console.error('Errore nel caricare la classifica:', errore);
        setStatoClassificaCircuito('errore');
      });
  }

  function formattaTempo(secondi) {
    if (secondi === null || secondi === undefined) return '--';
    const min = Math.floor(secondi / 60);
    const sec = (secondi % 60).toFixed(3).padStart(6, '0');
    return min > 0 ? `${min}:${sec}` : `${sec}s`;
  }

  return <main className="main game-championship-view">{renderContenuto()}</main>;

  function renderContenuto() {
    if (fase === 'in-pista') {
      const tempoRimastoQualifica = Math.max(0, LIMITE_TEMPO_QUALIFICA_SECONDI - hud.tempoTrascorso);
      const desktopFullscreenImmersivo = schermoIntero && !haTouch;

      return (
        <div
          ref={containerRef}
          className={`game-championship-view__pov-container ${schermoIntero ? 'game-championship-view__pov-container--schermo-intero' : ''}`}
        >
          <canvas ref={canvasRef} className="game-championship-view__canvas-3d" />

          {!desktopFullscreenImmersivo && (
            <div className="game-championship-view__hud-pov">
              <span>{CIRCUITO_NOME} &mdash; {ETICHETTA_SESSIONE[tipoSessione]}</span>
              {tipoSessione === 'qualifica' ? (
                <span className="tab-num">Tempo rimasto: {formattaTempo(tempoRimastoQualifica)}</span>
              ) : (
                <span className="tab-num">{formattaTempo(hud.tempoTrascorso)}</span>
              )}
              <span className="tab-num">{tipoSessione === 'gara' ? `Giro ${hud.giro}/${GIRI_GARA}` : `Giro ${hud.giro}`}</span>
              <span className="tab-num">{hud.velocitaKmh} km/h</span>
              {hud.zona !== 'pista' && (
                <span className="game-championship-view__zona-avviso">{ETICHETTA_ZONA[hud.zona]}</span>
              )}
            </div>
          )}

          {!semaforoVia && (
            <div className="game-championship-view__semaforo-overlay-pov">
              <div className="game-championship-view__semaforo-pov">
                {Array.from({ length: NUMERO_LUCI }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className={`game-championship-view__luce-pov ${n <= numeroLuciAccese ? 'game-championship-view__luce-pov--accesa' : ''}`}
                  />
                ))}
              </div>
              {tipoSessione === 'gara' && (
                <p className="game-championship-view__griglia-info-pov">
                  {statoGriglia === 'pronto' && grigliaInfo && (
                    grigliaInfo.posizione
                      ? `Griglia: P${grigliaInfo.posizione} di ${grigliaInfo.piloti_totali}`
                      : 'Nessun tempo di qualifica: parti dal fondo dello schieramento'
                  )}
                  {' \u2014 '}{GIRI_GARA} giri
                </p>
              )}
              {tipoSessione === 'qualifica' && (
                <p className="game-championship-view__griglia-info-pov">
                  Hai {formattaTempo(LIMITE_TEMPO_QUALIFICA_SECONDI)} per il tuo giro migliore
                </p>
              )}
            </div>
          )}
          {mostraVia && <div className="game-championship-view__via-flash-pov">VIA!</div>}

          {!desktopFullscreenImmersivo && giriCompletati.length > 0 && (
            <div className="game-championship-view__giri-lista-pov-contenitore">
              <ol className="game-championship-view__giri-lista-pov">
                {giriCompletati.slice(-5).map((giro) => {
                  const colore = coloreGiro(giro, giriCompletati, mioRecordRef.current?.[tipoSessione]);
                  return (
                    <li
                      key={giro.numero}
                      className={`game-championship-view__giro-voce-pov ${colore ? `game-championship-view__giro-voce-pov--${colore}` : ''}`}
                    >
                      <span className="tab-num">G{giro.numero}</span>
                      <span className="tab-num">{formattaTempo(giro.tempo)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {haTouch && (
            <div className="game-championship-view__touch-pov">
              <div className="game-championship-view__touch-pov-dpad">
                <button type="button" className="game-championship-view__pulsante-pov" aria-label="Sterza a sinistra" {...gestoriPulsanteControllo('sterzaSinistra')}>&larr;</button>
                <button type="button" className="game-championship-view__pulsante-pov" aria-label="Sterza a destra" {...gestoriPulsanteControllo('sterzaDestra')}>&rarr;</button>
              </div>
              <div className="game-championship-view__touch-pov-pedali">
                <button type="button" className="game-championship-view__pulsante-pov game-championship-view__pulsante-pov--freno" aria-label="Freno" {...gestoriPulsanteControllo('frena')}>&darr;</button>
                <button type="button" className="game-championship-view__pulsante-pov game-championship-view__pulsante-pov--gas" aria-label="Accelera" {...gestoriPulsanteControllo('accelera')}>&uarr;</button>
              </div>
            </div>
          )}

          {!desktopFullscreenImmersivo && (
            <div className="game-championship-view__controlli-pov">
              {!schermoIntero && (
                <button type="button" className="game-championship-view__bottone-fullscreen" onClick={attivaSchermoIntero}>
                  Schermo intero
                </button>
              )}
              {schermoIntero && haTouch && (
                <button type="button" className="game-championship-view__bottone-fullscreen" onClick={disattivaSchermoIntero}>
                  Esci da schermo intero
                </button>
              )}
              <button type="button" className="game-championship-view__abbandona" onClick={abbandonaSessione}>
                Abbandona
              </button>
            </div>
          )}

          {schermoIntero && haTouch && orientamentoPortrait && (
            <div className="game-championship-view__invito-ruotare">Ruota il telefono in orizzontale per giocare</div>
          )}
        </div>
      );
    }

    if (fase === 'riepilogo') {
      return (
        <>
          <GlassPanel className="game-championship-view__panel game-championship-view__riepilogo">
            {nuovoRecord && <span className="badge game-championship-view__badge-record">Nuovo record personale!</span>}
            <span className="game-championship-view__riepilogo-etichetta">
              {ETICHETTA_SESSIONE[tipoSessione]} &mdash; {CIRCUITO_NOME}
            </span>
            <span className="game-championship-view__riepilogo-tempo tab-num">
              {formattaTempo(risultatoFinale?.tempoTotale)}
            </span>

            {tipoSessione === 'prove_libere' && (
              <p className="game-championship-view__esito">Prove Libere: nessun tempo salvato, solo allenamento.</p>
            )}
            {statoInvio === 'nessun-tempo' && (
              <p className="game-championship-view__esito">Nessun giro completato entro il tempo limite &mdash; riprova.</p>
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
                &larr; Cambia sessione
              </button>
            </div>
          </GlassPanel>

          {tipoSessione !== 'prove_libere' && (
            <GlassPanel className="game-championship-view__panel game-championship-view__classifica">
              <h3 className="game-championship-view__classifica-titolo">Classifica &mdash; {CIRCUITO_NOME}</h3>
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
            <span className="game-championship-view__titolo-accento">BRIANZA SPEED RING</span> TIME ATTACK
          </h1>
          <p className="game-championship-view__sottotitolo">
            Un giro in prima persona sul Brianza Speed Ring, liberamente ispirato a Monza (non una ricostruzione
            fedele). Consigliato lo schermo intero, soprattutto da mobile.
          </p>
          <p className="game-championship-view__nota-login">
            {utente
              ? 'Sei connesso: i tempi di Qualifica e Gara verranno salvati e conteranno per il Campionato.'
              : 'Puoi giocare senza account (le Prove Libere sono sempre gratuite): accedi dalla barra in alto per salvare tempi ufficiali.'}
          </p>
        </header>

        <GlassPanel className="game-championship-view__panel game-championship-view__selezione">
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

          <ul className="game-championship-view__regole-lista">
            <li>Un cordolo sotto una ruota rallenta del 10%, sotto due ruote del 25%.</li>
            <li>Oltre i cordoli con più di due ruote sei sull&rsquo;erba: -80% di velocità.</li>
            <li>Muri di contenimento oltre l&rsquo;erba: l&rsquo;auto non può uscirne. Niente retromarcia.</li>
            {tipoSessione === 'qualifica' && (
              <li>
                Qualifica: hai <strong>{formattaTempo(LIMITE_TEMPO_QUALIFICA_SECONDI)}</strong> dal semaforo verde per
                il tuo giro migliore.
              </li>
            )}
            {tipoSessione === 'gara' && <li>Gara: {GIRI_GARA} giri, si parte in griglia secondo il tempo di Qualifica.</li>}
          </ul>

          <button
            type="button"
            className="game-championship-view__bottone-primario"
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
