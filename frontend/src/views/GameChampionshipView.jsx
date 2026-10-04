import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  getClassificaCampionato,
  getClassificaTempiCircuito,
  getAvversariGara,
  getGrigliaPartenza,
  getMioRecord,
  inviaTempoGioco,
} from '../api/backend.js';
import {
  calcolaSegmentiVisibili,
  CARTELLI_CURVA,
  FORMA_MINIMAPPA,
  indiciCheckpoint,
  LARGHEZZA_PISTA,
  LUNGHEZZA_CIRCUITO,
  LUNGHEZZA_SEGMENTO,
  NUMERO_SEGMENTI_TOTALE,
  segmentoA,
  controllaCatturaCheckpointSegmento,
} from '../game/circuito3d.js';
import {
  aggiornaAvversari,
  creaBotQualifica,
  creaGriglia,
  interazioniGiocatore,
  posizioneInGara,
  separaAvversari,
  tempoFinaleStimato,
} from '../game/avversari.js';
import { ALTEZZA_CAMERA, calcolaTratti, creaRendererPov, FRAZIONE_ORIZZONTE, LIVREE, livreaDaId, segmentiDietro } from '../game/renderPov.js';
import { avanzaFisica, statoIniziale, VELOCITA_MASSIMA_BASE } from '../game/fisica3d.js';
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
const ETICHETTA_ZONA = { cordolo: 'CORDOLO', erba: "SULL'ERBA" };

// Semaforo di partenza — stessa logica del vecchio motore 2D (confermata
// esplicitamente dall'utente: "la logica del semaforo rimane").
const NUMERO_LUCI = 5;
const INTERVALLO_LUCE_MS = 400;
const ATTESA_EXTRA_MIN_MS = 1000;
const ATTESA_EXTRA_MAX_MS = 3000;
const DURATA_FLASH_VIA_MS = 700;

// Rendering pseudo-3D
const NUMERO_SEGMENTI_VISIBILI = 300; // ~2100m di pista visibile (7m/segmento) — prima 160 (~1120m) lasciava un vuoto visibile in lontananza, specie con la prospettiva alzata
// Telecamera in terza persona, dietro e sopra l'auto (cambio deciso
// insieme all'utente dopo aver visto un riferimento fotografico: non
// più la vista "dentro l'abitacolo" della prima stesura).
// Visuale ONBOARD (camera sopra l'halo): proiezione, monoposto e scenario
// sono in game/renderPov.js. La camera segue in pieno lo scarto laterale
// dell'auto: è il pilota a guardare, la pista scorre ai lati.
const PIXEL_RATIO_MASSIMO = 1.5; // oltre, su telefoni ad alta densità, si paga in fps senza vedere differenze
const CHIAVE_LIVREA = 'monoposto_livrea';
// Tribune sui rettilinei lunghi: calcolate una volta per tutto il tracciato.
const TRATTI_SCENARIO = calcolaTratti(NUMERO_SEGMENTI_TOTALE, (i) => segmentoA(i).curva);
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
  // Record personale mostrato nella schermata di SELEZIONE (prima di
  // giocare) — stato React, non il ref mioRecordRef (quello è per il
  // colore dei giri durante la guida e non aggiorna la UI da solo).
  const [mioRecordSelezione, setMioRecordSelezione] = useState({ prove_libere: null, qualifica: null, gara: null });
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
  // Feedback visivo "premuto" dei pulsanti touch, gestito a mano in
  // stato React invece di affidarsi solo a :active CSS: con due
  // pulsanti tenuti insieme (es. direzione + gas), su alcuni browser
  // mobile :active si accende solo su uno dei due, rendendo poco
  // chiaro se entrambi gli input sono davvero attivi (segnalato
  // dall'utente).
  const [pulsantiPremuti, setPulsantiPremuti] = useState({});
  // L'icona ora si mostra sempre (un pre-controllo di supporto si è
  // rivelato inaffidabile su mobile — segnalato dall'utente): il
  // tentativo vero al click decide, con un fallback su tutta la
  // pagina se il contenitore da solo non funziona (vedi
  // attivaSchermoIntero).
  const modoFullscreenPaginaInteraRef = useRef(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const minimappaRef = useRef(null);
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
  const offsetSfondoRef = useRef(0);
  const avversariRef = useRef([]); // bot (Qualifica) o griglia (Gara); vuoto in Prove Libere
  const sciaRef = useRef(0);
  const ultimoTamponamentoRef = useRef(-Infinity);
  const [posizioneGara, setPosizioneGara] = useState(null);
  const ultimoDtRef = useRef(0); // per le particelle di fumo, che vivono nel renderer
  const rendererRef = useRef(null);
  if (rendererRef.current === null && typeof document !== 'undefined') {
    rendererRef.current = creaRendererPov((w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    });
  }
  const [livrea, setLivrea] = useState(() => {
    try {
      return livreaDaId(window.localStorage.getItem(CHIAVE_LIVREA)).id;
    } catch {
      return LIVREE[0].id;
    }
  });
  const livreaRef = useRef(livrea);
  useEffect(() => {
    livreaRef.current = livrea;
    try {
      window.localStorage.setItem(CHIAVE_LIVREA, livrea);
    } catch {
      /* navigazione privata: la scelta vale solo per questa visita */
    }
  }, [livrea]);
  // I cartelloni usano Big Shoulders Display: quando il font è pronto si
  // ridisegnano gli elementi preparati in anticipo, così non restano col font di ripiego.
  useEffect(() => {
    document.fonts?.ready?.then(() => rendererRef.current?.invalida());
  }, []);
  // Tempi intermedi (S1/S2/S3) del giro IN CORSO, per la minimappa —
  // aggiornati solo quando un checkpoint viene catturato, non ad ogni
  // fotogramma (vedi il punto in cui telemetriaRef viene aggiornato).
  const tempiIntermediGiroRef = useRef([null, null, null]);
  const [tempiIntermedi, setTempiIntermedi] = useState([null, null, null]);

  // Sicurezza: se si naviga via mentre si è nel fallback fullscreen su
  // tutta la pagina, la classe sul body non deve restare appiccicata.
  useEffect(() => {
    return () => {
      document.body.classList.remove('gioco-fullscreen-pagina-intera');
    };
  }, []);

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

  // Record personale (Prove Libere/Qualifica/Gara) e classifica del
  // circuito, precaricati per la schermata di SELEZIONE — prima ancora
  // di giocare, non solo dopo (richiesta esplicita dell'utente: "in
  // ogni scheda gioco deve esserci record personale e record
  // assoluto"). Rieseguito anche se l'utente accede/esce a sessione in
  // corso, così il record personale compare/sparisce di conseguenza.
  useEffect(() => {
    ottieniToken()
      .then((token) => getMioRecord(CIRCUITO_SLUG, token))
      .then((dati) => setMioRecordSelezione(dati))
      .catch((errore) => console.error('Errore nel caricare il mio record personale:', errore));
    caricaClassificaCircuito();
  }, [utente]);

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
    function elementoFullscreenCorrente() {
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null
      );
    }
    function suCambioFullscreen() {
      const elementoAttuale = elementoFullscreenCorrente();
      const attivo = elementoAttuale === containerRef.current || elementoAttuale === document.documentElement;
      setSchermoIntero(attivo);
      if (!attivo) {
        // Uscita da fullscreen per qualunque via (icona, tasto ESC,
        // gesto di sistema su mobile): ripulisco sempre la classe di
        // fallback, non solo quando si esce dal pulsante dedicato.
        document.body.classList.remove('gioco-fullscreen-pagina-intera');
        modoFullscreenPaginaInteraRef.current = false;
      }
      if (attivo && haTouch && typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // iOS Safari e altri: nessun blocco possibile, va bene così
          // (mostriamo comunque l'invito a ruotare se serve, vedi sotto).
        });
      }
    }
    const EVENTI_FULLSCREEN = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    EVENTI_FULLSCREEN.forEach((nome) => document.addEventListener(nome, suCambioFullscreen));
    return () => EVENTI_FULLSCREEN.forEach((nome) => document.removeEventListener(nome, suCambioFullscreen));
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
      const rapportoPista = Math.min(rapportoPixel, PIXEL_RATIO_MASSIMO);
      canvas.width = Math.round(larghezzaCss * rapportoPista);
      canvas.height = Math.round(altezzaCss * rapportoPista);

      const minimappa = minimappaRef.current;
      if (minimappa && minimappa.clientWidth > 0 && minimappa.clientHeight > 0) {
        minimappa.width = Math.round(minimappa.clientWidth * rapportoPixel);
        minimappa.height = Math.round(minimappa.clientHeight * rapportoPixel);
      }
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

    /**
     * 7 LED del cambio (shift lights), sempre in cima al canvas: 3
     * verdi, 2 rossi, 2 ciano lampeggianti vicino alla velocità
     * massima — il momento ideale di cambiata. `frazioneVelocita` è
     * velocità attuale / velocità massima (0-1).
     */
    function disegnaLedCambio(ctx, larghezza, frazioneVelocita, adesso) {
      const numeroLed = 7;
      const raggio = Math.max(3, larghezza * 0.007);
      const spaziatura = raggio * 2.8;
      const centroX = larghezza / 2;
      const y = raggio * 2.4;
      const ledAccesi = Math.floor(frazioneVelocita * numeroLed);
      const lampeggia = Math.floor(adesso / 150) % 2 === 0;

      for (let i = 0; i < numeroLed; i++) {
        const x = centroX + (i - (numeroLed - 1) / 2) * spaziatura;
        const acceso = i < ledAccesi;
        let colore = 'rgba(255,255,255,0.1)';
        if (acceso) {
          if (i < 3) colore = '#4ade80';
          else if (i < 5) colore = '#e8432e';
          else colore = lampeggia ? '#3fd0ff' : '#0d5266';
        }
        ctx.fillStyle = colore;
        ctx.beginPath();
        ctx.arc(x, y, raggio, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /** Display digitale in cima al cielo: marcia (ciano) e velocità (oro)
     * in Big Shoulders Display, su un riquadro scuro arrotondato. */
    function disegnaDisplay(ctx, larghezza, velocitaKmh, frazioneVelocita) {
      const larghezzaBox = Math.max(120, larghezza * 0.17);
      const altezzaBox = larghezzaBox * 0.36;
      const x = larghezza / 2 - larghezzaBox / 2;
      const y = larghezzaBox * 0.2;

      ctx.fillStyle = 'rgba(11,12,16,0.78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, larghezzaBox, altezzaBox, altezzaBox * 0.22);
      else ctx.rect(x, y, larghezzaBox, altezzaBox);
      ctx.fill();
      ctx.strokeStyle = 'rgba(63,208,255,0.45)';
      ctx.lineWidth = Math.max(1, larghezza * 0.0012);
      ctx.stroke();

      const marcia = Math.max(1, Math.min(8, Math.ceil(frazioneVelocita * 8)));
      const font = '"Big Shoulders Display", "Share Tech Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3fd0ff';
      ctx.font = `800 ${Math.round(altezzaBox * 0.78)}px ${font}`;
      ctx.fillText(String(marcia), x + larghezzaBox * 0.17, y + altezzaBox * 0.54);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + larghezzaBox * 0.32, y + altezzaBox * 0.2, Math.max(1, larghezza * 0.001), altezzaBox * 0.6);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#d9a441';
      ctx.font = `800 ${Math.round(altezzaBox * 0.62)}px ${font}`;
      ctx.fillText(String(Math.round(velocitaKmh)), x + larghezzaBox * 0.78, y + altezzaBox * 0.54);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `700 ${Math.round(altezzaBox * 0.26)}px ${font}`;
      ctx.fillText('KM/H', x + larghezzaBox * 0.8, y + altezzaBox * 0.6);
      ctx.textBaseline = 'alphabetic';
    }

    /**
     * Minimappa: sagoma del circuito (FORMA_MINIMAPPA, vista dall'alto
     * stilizzata), partenza/traguardo, i 3 checkpoint intermedi e la
     * posizione live dell'auto — su un canvas SEPARATO dal 3D
     * principale (più semplice: niente da mescolare con la
     * prospettiva del gioco).
     */
    function disegnaMinimappa(ctx, larghezza, altezza, segmentoAutoFrazionale) {
      ctx.clearRect(0, 0, larghezza, altezza);
      const pad = larghezza * 0.14;
      const scalaX = larghezza - pad * 2;
      const scalaY = altezza - pad * 2;
      const puntoSchermo = (p) => ({ x: pad + p.x * scalaX, y: pad + p.y * scalaY });

      ctx.fillStyle = 'rgba(8,10,14,0.6)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(0, 0, larghezza, altezza, larghezza * 0.12);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, larghezza, altezza);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, larghezza * 0.022);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      FORMA_MINIMAPPA.forEach((p, i) => {
        const s = puntoSchermo(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.stroke();

      const checkpoints = indiciCheckpoint();
      ctx.fillStyle = '#d9a441';
      for (let i = 0; i < 3; i++) {
        const s = puntoSchermo(FORMA_MINIMAPPA[checkpoints[i]]);
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(2, larghezza * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }

      const sPartenza = puntoSchermo(FORMA_MINIMAPPA[0]);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sPartenza.x, sPartenza.y, Math.max(2.5, larghezza * 0.034), 0, Math.PI * 2);
      ctx.fill();

      const i0 = Math.floor(segmentoAutoFrazionale) % NUMERO_SEGMENTI_TOTALE;
      const i1 = (i0 + 1) % NUMERO_SEGMENTI_TOTALE;
      const frazione = segmentoAutoFrazionale - Math.floor(segmentoAutoFrazionale);
      const p0 = FORMA_MINIMAPPA[i0];
      const p1 = FORMA_MINIMAPPA[i1];
      const sAuto = puntoSchermo({ x: p0.x + (p1.x - p0.x) * frazione, y: p0.y + (p1.y - p0.y) * frazione });
      ctx.fillStyle = '#ff3b30';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(1, larghezza * 0.012);
      ctx.beginPath();
      ctx.arc(sAuto.x, sAuto.y, Math.max(3, larghezza * 0.045), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    /** Linee del vento: oltre 200 km/h virtuali, segmenti bianchi
     * semi-trasparenti che convergono verso il punto di fuga
     * (l'orizzonte), per accentuare la percezione di velocità. */
    function disegnaLineeVento(ctx, larghezza, altezza, velocitaKmh, adesso) {
      if (velocitaKmh < 200) return;
      const centroX = larghezza / 2;
      const centroY = altezza * FRAZIONE_ORIZZONTE;
      const numeroLinee = 14;
      const ciclo = 800;

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < numeroLinee; i++) {
        const lato = i % 2 === 0 ? -1 : 1;
        const raggioIniziale = larghezza * (0.35 + (i % 5) * 0.05);
        const altezzaIniziale = altezza * (0.55 + ((i * 53) % 100) / 250);
        const fase = ((adesso + i * (ciclo / numeroLinee)) % ciclo) / ciclo;
        const faseCoda = Math.max(0, fase - 0.08);

        const puntoA = {
          x: centroX + lato * raggioIniziale * (1 - fase),
          y: altezzaIniziale + (centroY - altezzaIniziale) * fase,
        };
        const puntoB = {
          x: centroX + lato * raggioIniziale * (1 - faseCoda),
          y: altezzaIniziale + (centroY - altezzaIniziale) * faseCoda,
        };
        ctx.beginPath();
        ctx.moveTo(puntoA.x, puntoA.y);
        ctx.lineTo(puntoB.x, puntoB.y);
        ctx.stroke();
      }
    }

    /**
     * Posizione (mondoX, mondoY) interpolata con continuità fra un
     * segmento e il successivo, in base alla distanza esatta (non
     * arrotondata al segmento). BUG TROVATO E CORRETTO: usare
     * direttamente segmentoA(...).mondoX (un valore "a gradini", fisso
     * per tutto il segmento da 7m) per la posizione dell'auto E per
     * quella della telecamera dava due "scalini" che non scattavano
     * mai esattamente nello stesso istante (la telecamera guarda un
     * punto diverso, 10m indietro) — la differenza fra i due (che
     * determina dove l'auto appare a schermo) faceva un salto ogni
     * volta che UNO dei due passava al segmento successivo mentre
     * l'altro no, tanto più grande quanto più la curva è stretta.
     * Verificato con un log dedicato: la posizione a schermo dell'auto
     * oscillava fra due valori fissi (differenza ~245px) frame dopo
     * frame, anche ad auto ferma lateralmente e senza alcun input —
     * era questo, non lo scuotimento (già rimosso), a dare l'idea di
     * "saltella/vibra" segnalata dall'utente.
     */
    function posizioneMondoInterpolata(distanza) {
      const indiceEsatto = distanza / LUNGHEZZA_SEGMENTO;
      const indiceBase = Math.floor(indiceEsatto);
      const frazione = indiceEsatto - indiceBase;
      const segA = segmentoA(indiceBase);
      const segB = segmentoA(indiceBase + 1);
      return {
        mondoX: segA.mondoX + (segB.mondoX - segA.mondoX) * frazione,
        mondoY: segA.mondoY + (segB.mondoY - segA.mondoY) * frazione,
      };
    }

    function disegna() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) return;

      const auto = statoAutoRef.current;
      const frazioneVelocitaHud = Math.min(1, auto.velocita / VELOCITA_MASSIMA_BASE);
      const velocitaKmhHud = auto.velocita * 3.6;

      // Camera onboard: dove si trova l'auto, all'altezza dell'halo.
      const posizioneAutoMondo = posizioneMondoInterpolata(auto.distanza);
      const camera = {
        distanza: auto.distanza,
        mondoX: posizioneAutoMondo.mondoX + auto.x,
        mondoY: posizioneAutoMondo.mondoY + ALTEZZA_CAMERA,
      };
      rendererRef.current.disegna(ctx, W, H, {
        segmenti: calcolaSegmentiVisibili(camera, NUMERO_SEGMENTI_VISIBILI),
        livrea: livreaDaId(livreaRef.current),
        sterzo: angoloVolanteRef.current * 0.4,
        offsetSfondo: offsetSfondoRef.current * (W / 1000),
        fumo: auto.bloccaggio ? 1 : 0,
        velocita: auto.velocita,
        dt: ultimoDtRef.current,
        // specchietti con vista posteriore solo in Qualifica e Gara (decisione del 4/10)
        dietro: tipoSessione === 'prove_libere' ? null : segmentiDietro(camera),
        auto: avversariRef.current.map((a) => {
          let dz = a.distanza - auto.distanza;
          if (tipoSessione === 'qualifica') dz = ((((dz + LUNGHEZZA_CIRCUITO / 2) % LUNGHEZZA_CIRCUITO) + LUNGHEZZA_CIRCUITO) % LUNGHEZZA_CIRCUITO) - LUNGHEZZA_CIRCUITO / 2;
          return { dz, x: a.x, livrea: a.livrea, nome: a.tipo === 'fantasma' ? a.nome : null };
        }),
        tratti: TRATTI_SCENARIO,
        cartelli: CARTELLI_CURVA,
      });

      disegnaLineeVento(ctx, W, H, velocitaKmhHud, performance.now());
      disegnaLedCambio(ctx, W, frazioneVelocitaHud, performance.now());
      if (viaRef.current) disegnaDisplay(ctx, W, velocitaKmhHud, frazioneVelocitaHud); // durante il semaforo quel posto è delle luci

      const minimappa = minimappaRef.current;
      if (minimappa && minimappa.width > 0 && minimappa.height > 0) {
        const ctxMinimappa = minimappa.getContext('2d');
        const segmentoAutoFrazionale = auto.distanza / LUNGHEZZA_SEGMENTO;
        disegnaMinimappa(ctxMinimappa, minimappa.width, minimappa.height, segmentoAutoFrazionale);
      }
    }

    function fotogramma(timestamp) {
      if (fermo) return;
      if (ultimoTimestamp === null) ultimoTimestamp = timestamp;
      const dt = Math.min((timestamp - ultimoTimestamp) / 1000, 0.05);
      ultimoTimestamp = timestamp;

      ultimoDtRef.current = viaRef.current ? dt : 0;
      if (!viaRef.current) {
        disegna();
        requestIdRef.current = requestAnimationFrame(fotogramma);
        return;
      }

      const segmentoAttuale = segmentoA(Math.floor(statoAutoRef.current.distanza / LUNGHEZZA_SEGMENTO));
      statoAutoRef.current = avanzaFisica(
        statoAutoRef.current,
        { ...inputRef.current, scia: sciaRef.current },
        dt,
        segmentoAttuale.curva,
        SEMI_LARGHEZZA_PISTA
      );

      // Avversari: si muovono, poi contatti e scia col giocatore.
      if (avversariRef.current.length > 0) {
        const circolare = tipoSessione === 'qualifica';
        const secondi = (performance.now() - tempoInizioRef.current) / 1000;
        aggiornaAvversari(avversariRef.current, statoAutoRef.current, dt, { tempoGara: secondi, circolare });
        const giocatore = { ...statoAutoRef.current };
        const esito = interazioniGiocatore(giocatore, avversariRef.current, {
          circolare,
          ultimoTamponamento: ultimoTamponamentoRef.current,
          adesso: secondi,
        });
        separaAvversari(avversariRef.current, circolare);
        statoAutoRef.current = { ...statoAutoRef.current, distanza: giocatore.distanza, x: giocatore.x, velocita: giocatore.velocita };
        sciaRef.current = esito.scia;
        if (esito.tamponamento) ultimoTamponamentoRef.current = secondi;
      }

      // Parallasse delle montagne: in curva lo sfondo scorre in senso opposto alla piega.
      offsetSfondoRef.current += segmentoAttuale.curva * statoAutoRef.current.velocita * dt * 0.35;

      const angoloTarget = (inputRef.current.sterzaDestra ? 1 : 0) - (inputRef.current.sterzaSinistra ? 1 : 0);
      angoloVolanteRef.current += (angoloTarget * 0.6 - angoloVolanteRef.current) * Math.min(1, dt * 8);

      const adesso = performance.now();
      const segmentoAssolutoAttuale = Math.floor(statoAutoRef.current.distanza / LUNGHEZZA_SEGMENTO);
      const nuovoAtteso = controllaCatturaCheckpointSegmento(segmentoAssolutoAttuale, giroCorrenteRef.current, checkpointAttesoRef.current);
      if (nuovoAtteso !== checkpointAttesoRef.current) {
        const tSessione = adesso - tempoInizioRef.current;
        telemetriaRef.current.push({ giro: giroCorrenteRef.current, indice: checkpointAttesoRef.current, t: tSessione });

        if (tipoSessione === 'gara' && avversariRef.current.length > 0) {
          // posizione aggiornata ai passaggi sugli intermedi (e al traguardo)
          setPosizioneGara(posizioneInGara(statoAutoRef.current.distanza, avversariRef.current));
        }

        if (checkpointAttesoRef.current < 3) {
          // S1/S2/S3 di QUESTO giro (indice 3 è il traguardo, gestito
          // sotto come fine giro, non come intermedio): tempo dal via
          // di questo giro, per il riquadro accanto alla minimappa.
          const inizioGiroRelativoASessione = inizioGiroRef.current - tempoInizioRef.current;
          tempiIntermediGiroRef.current = [...tempiIntermediGiroRef.current];
          tempiIntermediGiroRef.current[checkpointAttesoRef.current] = (tSessione - inizioGiroRelativoASessione) / 1000;
          setTempiIntermedi(tempiIntermediGiroRef.current);
        }

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
          tempiIntermediGiroRef.current = [null, null, null]; // nuovo giro, nuovi intermedi
          setTempiIntermedi(tempiIntermediGiroRef.current);

          if (tipoSessione === 'prove_libere') {
            // Le Prove Libere non hanno un limite di tempo che le
            // concluda (a differenza della Qualifica): ogni giro
            // completato è di per sé un'occasione di record, inviato
            // subito senza uscire dalla sessione (richiesta esplicita
            // dell'utente: il miglior tempo in Prove Libere deve
            // salvarsi come per Qualifica e Gara).
            inviaERicaricaClassifica(tempoGiroSecondi, checkpointDiQuestoGiro);
          }

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
          sottosterzo: Boolean(statoAutoRef.current.sottosterzo),
          contatto: (performance.now() - tempoInizioRef.current) / 1000 - ultimoTamponamentoRef.current < 1.2,
          scia: sciaRef.current > 0,
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
    inputRef.current = { accelera: false, frena: false, sterzaSinistra: false, sterzaDestra: false };
    setPulsantiPremuti({});

    setTipoSessione(tipo);
    setStatoInvio('inattivo');
    setMotivoRifiuto(null);
    setNuovoRecord(false);
    setRisultatoFinale(null);
    setGiriCompletati([]);
    setHud({ tempoTrascorso: 0, giro: 1, velocitaKmh: 0, zona: 'pista' });

    mioRecordRef.current = { prove_libere: null, qualifica: null, gara: null };
    ottieniToken()
      .then((token) => getMioRecord(CIRCUITO_SLUG, token))
      .then((dati) => {
        mioRecordRef.current = dati;
      })
      .catch((errore) => console.error('Errore nel caricare il mio record personale:', errore));

    avversariRef.current = [];
    sciaRef.current = 0;
    ultimoTamponamentoRef.current = -Infinity;
    setPosizioneGara(null);
    if (tipo === 'qualifica') avversariRef.current = creaBotQualifica(10);

    if (tipo === 'gara') {
      // griglia provvisoria di soli bot (si parte dal fondo), sostituita appena
      // arrivano griglia e gare registrate, se arrivano prima del via
      const applica = (griglia) => {
        avversariRef.current = griglia.avversari;
        statoAutoRef.current = { ...statoAutoRef.current, x: griglia.xGiocatore };
        setPosizioneGara(griglia.posto);
        setGrigliaInfo({ posizione: griglia.posto, piloti_totali: 20 });
      };
      applica(creaGriglia([], null));
      setStatoGriglia('caricamento');
      ottieniToken()
        .then((token) => Promise.all([getGrigliaPartenza(CIRCUITO_SLUG, token), getAvversariGara(CIRCUITO_SLUG, token).catch(() => [])]))
        .then(([dati, registrati]) => {
          if (!viaRef.current) applica(creaGriglia(registrati, dati.posizione));
          setStatoGriglia('pronto');
        })
        .catch((errore) => {
          console.error('Errore nel caricare la griglia di partenza:', errore);
          setStatoGriglia('pronto'); // si corre comunque, dal fondo, contro i bot
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

  /**
   * Fullscreen sull'INTERA pagina. Confermato (verificato a settembre
   * 2026, non per assunzione): iOS Safari su iPhone non implementa
   * affatto la Fullscreen API sugli elementi (solo su <video>, e solo
   * su iPad — mai su iPhone, un bug WebKit aperto da anni senza
   * soluzione). Nessun codice può aggirarlo. Per questo il CSS scatta
   * SEMPRE, subito, indipendentemente dall'API nativa: il gioco riempie
   * comunque lo schermo (menu/footer del sito nascosti), anche dove
   * l'API non esiste proprio — resta solo la barra di Safari in alto,
   * rimovibile solo installando il sito come app ("Condividi -> Aggiungi
   * alla schermata Home"). Dove l'API nativa ESISTE, viene comunque
   * tentata in aggiunta (un solo tentativo sincrono, nello stesso giro
   * del click: molti browser la concedono solo così).
   */
  function attivaSchermoIntero() {
    document.body.classList.add('gioco-fullscreen-pagina-intera');
    modoFullscreenPaginaInteraRef.current = true;
    setSchermoIntero(true); // impostato subito: dove l'API nativa non esiste (iPhone), nessun evento fullscreenchange arriverebbe mai a farlo al posto nostro

    const richiedi =
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.mozRequestFullScreen ||
      document.documentElement.msRequestFullscreen;
    if (!richiedi) return; // API assente (es. iPhone): il CSS sopra è già tutto quello che si può ottenere
    try {
      const risultato = richiedi.call(document.documentElement);
      if (risultato && risultato.catch) {
        risultato.catch((errore) => {
          console.error('Errore entrando in fullscreen nativo (il gioco resta comunque a schermo intero via CSS):', errore);
        });
      }
    } catch (errore) {
      console.error('Errore chiamando requestFullscreen (il gioco resta comunque a schermo intero via CSS):', errore);
    }
  }

  function disattivaSchermoIntero() {
    const esci =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (esci) {
      const risultato = esci.call(document);
      if (risultato && risultato.catch) {
        risultato.catch(() => {});
      }
    }
    document.body.classList.remove('gioco-fullscreen-pagina-intera');
    modoFullscreenPaginaInteraRef.current = false;
    setSchermoIntero(false); // impostato subito, stesso motivo di sopra (nessun evento nativo su iPhone)
  }

  function gestoriPulsanteControllo(campo) {
    const imposta = (valore) => (evento) => {
      evento.preventDefault();
      inputRef.current[campo] = valore;
      setPulsantiPremuti((precedente) => ({ ...precedente, [campo]: valore }));
    };
    return {
      onPointerDown: (evento) => {
        // Aggancia il tocco al pulsante: senza, se il dito si sposta
        // anche di poco durante la pressione (normale tenendo premuto
        // a lungo), alcuni browser possono considerare il tocco
        // "uscito" dal pulsante e non registrare più l'input come
        // attivo, dando la sensazione di dover premere e rilasciare
        // in continuazione (segnalato dall'utente).
        try {
          evento.currentTarget.setPointerCapture(evento.pointerId);
        } catch {
          // Non disponibile in questo contesto: nessun problema, il
          // comportamento resta quello precedente (senza cattura).
        }
        imposta(true)(evento);
      },
      onPointerUp: imposta(false),
      onPointerCancel: imposta(false),
    };
  }

  function concludiGara(tempoTotaleSecondi) {
    const telemetria = [...telemetriaRef.current];
    const distanzaGara = GIRI_GARA * LUNGHEZZA_CIRCUITO;
    const posizioneFinale =
      1 + avversariRef.current.filter((a) => tempoFinaleStimato(a, tempoTotaleSecondi, distanzaGara) < tempoTotaleSecondi).length;
    setRisultatoFinale({ tempoTotale: tempoTotaleSecondi, posizione: avversariRef.current.length ? posizioneFinale : null });
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

          <div className="game-championship-view__minimappa-riquadro">
            <canvas ref={minimappaRef} className="game-championship-view__minimappa" />
            <div className="game-championship-view__tempi-intermedi">
              {['S1', 'S2', 'S3'].map((etichetta, i) => (
                <span key={etichetta}>
                  {etichetta} {tempiIntermedi[i] !== null ? tempiIntermedi[i].toFixed(1) : '--.-'}
                </span>
              ))}
            </div>
          </div>

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
              {hud.sottosterzo && hud.zona === 'pista' && (
                <span className="game-championship-view__zona-avviso">SOTTOSTERZO</span>
              )}
              {hud.contatto && <span className="game-championship-view__zona-avviso">CONTATTO</span>}
              {hud.scia && !hud.contatto && <span className="game-championship-view__scia">SCIA</span>}
              {tipoSessione === 'gara' && posizioneGara && <span className="tab-num game-championship-view__posizione">P{posizioneGara}/20</span>}
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
                <button
                  type="button"
                  className={`game-championship-view__pulsante-pov ${pulsantiPremuti.sterzaSinistra ? 'game-championship-view__pulsante-pov--premuto' : ''}`}
                  aria-label="Sterza a sinistra"
                  {...gestoriPulsanteControllo('sterzaSinistra')}
                >
                  &larr;
                </button>
                <button
                  type="button"
                  className={`game-championship-view__pulsante-pov ${pulsantiPremuti.sterzaDestra ? 'game-championship-view__pulsante-pov--premuto' : ''}`}
                  aria-label="Sterza a destra"
                  {...gestoriPulsanteControllo('sterzaDestra')}
                >
                  &rarr;
                </button>
              </div>
              <div className="game-championship-view__touch-pov-pedali">
                <button
                  type="button"
                  className={`game-championship-view__pulsante-pov game-championship-view__pulsante-pov--freno ${pulsantiPremuti.frena ? 'game-championship-view__pulsante-pov--premuto' : ''}`}
                  aria-label="Freno"
                  {...gestoriPulsanteControllo('frena')}
                >
                  &darr;
                </button>
                <button
                  type="button"
                  className={`game-championship-view__pulsante-pov game-championship-view__pulsante-pov--gas ${pulsantiPremuti.accelera ? 'game-championship-view__pulsante-pov--premuto' : ''}`}
                  aria-label="Accelera"
                  {...gestoriPulsanteControllo('accelera')}
                >
                  &uarr;
                </button>
              </div>
            </div>
          )}

          {!desktopFullscreenImmersivo && (
            <div className="game-championship-view__controlli-pov">
              {!schermoIntero && (
                <button
                  type="button"
                  className="game-championship-view__icona-controllo"
                  onClick={attivaSchermoIntero}
                  aria-label="Schermo intero"
                  title="Schermo intero"
                >
                  &#x26F6;
                </button>
              )}
              <button
                type="button"
                className="game-championship-view__icona-controllo game-championship-view__icona-controllo--abbandona"
                onClick={schermoIntero ? disattivaSchermoIntero : abbandonaSessione}
                aria-label={schermoIntero ? 'Esci da schermo intero' : 'Abbandona la sessione'}
                title={schermoIntero ? 'Esci da schermo intero' : 'Abbandona'}
              >
                &#x2715;
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
            {risultatoFinale?.posizione && (
              <span className="game-championship-view__riepilogo-posizione">
                Arrivo: P{risultatoFinale.posizione} su 20
              </span>
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
                    {indice === 0 && <span className="badge game-championship-view__badge-record-assoluto">Record assoluto</span>}
                  </li>
                ))}
                {(classificaCircuito[tipoSessione] || []).length === 0 && (
                  <p className="game-championship-view__classifica-stato">Nessun tempo ancora registrato per questa sessione.</p>
                )}
              </ol>
            )}
          </GlassPanel>
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
              ? 'Sei connesso: il tuo miglior tempo in Prove Libere, Qualifica e Gara viene salvato, e Qualifica/Gara contano per il Campionato.'
              : 'Puoi giocare senza account: accedi dalla barra in alto per salvare il tuo miglior tempo (anche in Prove Libere) e vederlo qui accanto al record assoluto del circuito.'}
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

          <div className="game-championship-view__campo">
            <span>Livrea</span>
            <div className="game-championship-view__livree" role="radiogroup" aria-label="Livrea della monoposto">
              {LIVREE.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={livrea === l.id}
                  className={`game-championship-view__livrea ${livrea === l.id ? 'game-championship-view__livrea--attiva' : ''}`}
                  onClick={() => setLivrea(l.id)}
                >
                  <span
                    className="game-championship-view__livrea-campione"
                    style={{ background: `linear-gradient(135deg, ${l.luce} 0%, ${l.base} 45%, ${l.ombra} 100%)`, borderColor: l.accento }}
                    aria-hidden="true"
                  >
                    <span style={{ background: l.accento }} />
                  </span>
                  {l.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="game-championship-view__record-riepilogo">
            <div className="game-championship-view__record-voce">
              <span className="game-championship-view__record-etichetta">Il tuo record</span>
              <span className="tab-num">
                {utente ? formattaTempo(mioRecordSelezione[tipoSessione]) : 'Accedi per vederlo'}
              </span>
            </div>
            <div className="game-championship-view__record-voce">
              <span className="game-championship-view__record-etichetta">Record assoluto</span>
              <span className="tab-num">
                {statoClassificaCircuito === 'caricamento' && 'Carico...'}
                {statoClassificaCircuito === 'errore' && '--'}
                {statoClassificaCircuito === 'pronto' && classificaCircuito && (
                  (classificaCircuito[tipoSessione] || []).length > 0
                    ? `${formattaTempo(classificaCircuito[tipoSessione][0].tempo_totale)} — ${classificaCircuito[tipoSessione][0].username}`
                    : 'Nessuno ancora'
                )}
              </span>
            </div>
          </div>

          <ul className="game-championship-view__regole-lista">
            <li>Il cordolo riduce la velocità del 20% al secondo, l&rsquo;erba del 40% al secondo.</li>
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
