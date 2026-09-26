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
  CARTELLI_CURVA,
  FORMA_MINIMAPPA,
  indiciCheckpoint,
  LARGHEZZA_PISTA,
  LUNGHEZZA_SEGMENTO,
  NUMERO_SEGMENTI_TOTALE,
  proietta,
  segmentoA,
  controllaCatturaCheckpointSegmento,
} from '../game/circuito3d.js';
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
const DISTANZA_CAMERA_DIETRO = 10; // metri dietro l'auto lungo il tracciato
const ALTEZZA_CAMERA_SOPRA = 3.4; // metri sopra il piano stradale del punto in cui si trova la telecamera — alzata (era 2.3): con la telecamera bassa l'auto in primo piano copriva troppa pista, rendendo difficile capire quando curvare (segnalato dall'utente, confrontato con foto di riferimento di viste POV reali)
const FATTORE_SEGUI_LATERALE = 0.7; // quanto la telecamera insegue lo scarto laterale dell'auto (0=fissa sul centro pista, 1=insegue in pieno, annullando ogni feedback visivo dello sterzo)
const LARGHEZZA_AUTO_MONDO = 3; // metri, stessa larghezza di fisica3d.js (LARGHEZZA_AUTO)
const CAMPO_VISIVO_GRADI = 100;
const PROFONDITA_CAMERA = 1 / Math.tan((CAMPO_VISIVO_GRADI / 2) * (Math.PI / 180));
// Inclinazione della visuale verso l'orizzonte: alza la prospettiva
// per vedere le curve in anticipo (richiesta esplicita dell'utente,
// verificata col segno giusto tramite screenshot prima di integrarla).
const INCLINAZIONE_CAMERA_GRADI = 30; // richiesto ancora 15 gradi in piu' oltre ai 15 precedenti
const INCLINAZIONE_CAMERA_RADIANTI = (INCLINAZIONE_CAMERA_GRADI * Math.PI) / 180;
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
      canvas.width = Math.round(larghezzaCss * rapportoPixel);
      canvas.height = Math.round(altezzaCss * rapportoPixel);

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

    /** Display digitale: marcia virtuale (1-8, proporzionale alla
     * velocità) e velocità numerica in monospace. */
    function disegnaDisplay(ctx, larghezza, velocitaKmh, frazioneVelocita) {
      const larghezzaBox = Math.max(70, larghezza * 0.13);
      const altezzaBox = larghezzaBox * 0.4;
      const x = larghezza / 2 - larghezzaBox / 2;
      const y = larghezzaBox * 0.42;

      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, larghezzaBox, altezzaBox);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, larghezzaBox, altezzaBox);

      const marcia = Math.max(1, Math.min(8, Math.ceil(frazioneVelocita * 8)));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3fd0ff';
      ctx.font = `700 ${Math.round(altezzaBox * 0.6)}px monospace`;
      ctx.fillText(String(marcia), x + larghezzaBox * 0.2, y + altezzaBox * 0.52);

      ctx.fillStyle = '#d9a441';
      ctx.font = `600 ${Math.round(altezzaBox * 0.3)}px monospace`;
      ctx.fillText(`${Math.round(velocitaKmh)} km/h`, x + larghezzaBox * 0.65, y + altezzaBox * 0.52);
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
      const centroY = altezza * 0.42;
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

    function disegnaScenarioLato(ctx, xBase, yBase, scala, larghezzaSchermo, indiceSegmento, curva, lato) {
      // Bug corretto: mancava la moltiplicazione per larghezzaSchermo
      // (come fa l'auto con LARGHEZZA_AUTO_MONDO) — senza, "scala" da
      // sola è un numero minuscolo (~0.001-0.01) e la dimensione finiva
      // sempre sul minimo, rendendo lo scenario di fatto invisibile
      // oltre pochissimi metri. ~6m: altezza plausibile di un albero o
      // una gradinata bassa.
      const dimensione = Math.max(3, scala * 6 * larghezzaSchermo);
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

    function disegnaCartelloCurva(ctx, xBase, yBase, scala, larghezzaSchermo, cartello) {
      // Stesso bug di disegnaScenarioLato: mancava ×larghezzaSchermo,
      // il cartello non si disegnava MAI (verificato: a 400-500m,
      // "70*scala" restava sempre sotto la soglia minima). ~5.5m:
      // dimensione scelta per essere ben leggibile già alla distanza
      // di comparsa prevista (i cartelli iniziano a ~400-500m prima
      // della curva), non solo quando l'auto è già vicina.
      const dimensione = Math.max(4, scala * 5.5 * larghezzaSchermo);
      if (dimensione < 5) return; // troppo lontano/piccolo per essere leggibile
      const x = xBase - dimensione * 3.4; // fisso sul lato sinistro della pista, oltre lo scenario (2.2), niente sovrapposizioni
      const yBaseCartello = yBase - dimensione * 0.9;
      const largh = dimensione * 1.5;
      const alt = dimensione * 1.05;

      // Palo di sostegno
      ctx.strokeStyle = '#4a4d54';
      ctx.lineWidth = Math.max(1, dimensione * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, yBase);
      ctx.lineTo(x, yBaseCartello + alt / 2);
      ctx.stroke();

      // Tabellone: sfondo chiaro, bordo scuro — leggibile come un vero
      // cartello di velocità consigliata a bordo pista.
      ctx.fillStyle = '#f4f1e8';
      ctx.fillRect(x - largh / 2, yBaseCartello - alt / 2, largh, alt);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = Math.max(1, dimensione * 0.05);
      ctx.strokeRect(x - largh / 2, yBaseCartello - alt / 2, largh, alt);

      // Numero (velocità consigliata)
      ctx.fillStyle = '#c0392b';
      ctx.font = `bold ${Math.round(alt * 0.62)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cartello.velocita), x, yBaseCartello - alt * 0.08);

      // Freccina di direzione sotto il numero
      ctx.fillStyle = '#1a1a1a';
      const puntaX = x + cartello.direzione * largh * 0.22;
      const codaX = x - cartello.direzione * largh * 0.22;
      const yFreccia = yBaseCartello + alt * 0.28;
      ctx.beginPath();
      ctx.moveTo(puntaX, yFreccia);
      ctx.lineTo(codaX, yFreccia - alt * 0.1);
      ctx.lineTo(codaX, yFreccia + alt * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
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

    /**
     * La monoposto vista da dietro, proiettata alla sua posizione nel
     * mondo (non più fissa in basso allo schermo come il vecchio
     * abitacolo in prima persona). `punto` viene da proietta(): usa
     * scala per dimensionarla coerentemente con la pista sotto di
     * essa. `angolo` è una leggera rotazione (radianti) che segue lo
     * sterzo, per dare l'impressione che l'auto stia girando.
     */
    function disegnaAuto(ctx, punto, larghezzaSchermo, angolo) {
      // Scala visiva ridotta (0.72) solo per il disegno: l'auto a piena
      // scala copriva troppa pista in primo piano, rendendo difficile
      // vedere la curva in anticipo (segnalato dall'utente, confrontato
      // con foto di riferimento) — non tocca la fisica/collisioni,
      // solo l'ingombro a schermo.
      const larghezzaAuto = punto.scala * LARGHEZZA_AUTO_MONDO * larghezzaSchermo * 0.72;
      if (larghezzaAuto < 4) return; // troppo lontana/piccola per valere la pena
      const altezzaAuto = larghezzaAuto * 0.42;

      // Ombra: un'ellisse scura sotto l'auto, ancora al terreno (non
      // ruota con l'auto) — evita la sensazione che galleggi sull'asfalto.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(punto.x, punto.y + altezzaAuto * 0.06, larghezzaAuto * 0.42, altezzaAuto * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(punto.x, punto.y);
      // Non una rotazione rigida (sembrava un'inclinazione orizzontale
      // irrealistica, come una moto in piega — segnalato dall'utente):
      // una leggera deformazione a taglio, che sposta la parte alta
      // (ala/muso) lateralmente rispetto alle ruote, che restano
      // ancorate a terra — dà l'idea di vedere un po' la fiancata in
      // curva invece di un banking innaturale.
      ctx.transform(1, 0, angolo * 0.8, 1, 0, 0);

      // Gomme posteriori
      ctx.fillStyle = '#111214';
      const largGomma = larghezzaAuto * 0.2;
      const altGomma = altezzaAuto * 1.05;
      ctx.fillRect(-larghezzaAuto * 0.58, -altGomma, largGomma, altGomma);
      ctx.fillRect(larghezzaAuto * 0.38, -altGomma, largGomma, altGomma);

      // Fiancate: collegano il corpo centrale al bordo interno delle
      // gomme, altrimenti resta un vuoto visibile tra loro (segnalato
      // dall'utente) — dal bordo gomma (±0.38) al bordo corpo (±0.28),
      // nessuno spazio scoperto in mezzo.
      ctx.fillStyle = '#17191d';
      ctx.fillRect(-larghezzaAuto * 0.38, -altezzaAuto * 0.68, larghezzaAuto * 0.1, altezzaAuto * 0.68);
      ctx.fillRect(larghezzaAuto * 0.28, -altezzaAuto * 0.68, larghezzaAuto * 0.1, altezzaAuto * 0.68);

      // Diffusore (sotto il corpo, tra le gomme)
      ctx.strokeStyle = '#3a3d44';
      ctx.lineWidth = Math.max(1, larghezzaAuto * 0.012);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * larghezzaAuto * 0.07, -altezzaAuto * 0.18);
        ctx.lineTo(i * larghezzaAuto * 0.07, 0);
        ctx.stroke();
      }

      // Corpo/pancia centrale
      ctx.fillStyle = '#1a1d22';
      ctx.fillRect(-larghezzaAuto * 0.28, -altezzaAuto * 0.75, larghezzaAuto * 0.56, altezzaAuto * 0.75);

      // Fanalino posteriore
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(-larghezzaAuto * 0.05, -altezzaAuto * 0.42, larghezzaAuto * 0.1, altezzaAuto * 0.1);

      // Ala posteriore: barra + endplate ai due lati + pilone centrale
      const yAla = -altezzaAuto * 1.45;
      ctx.fillStyle = '#0d0e10';
      ctx.fillRect(-larghezzaAuto * 0.56, yAla, larghezzaAuto * 1.12, altezzaAuto * 0.13);
      ctx.fillRect(-larghezzaAuto * 0.6, yAla, larghezzaAuto * 0.06, altezzaAuto * 0.55);
      ctx.fillRect(larghezzaAuto * 0.54, yAla, larghezzaAuto * 0.06, altezzaAuto * 0.55);
      ctx.fillRect(-larghezzaAuto * 0.03, yAla + altezzaAuto * 0.1, larghezzaAuto * 0.06, altezzaAuto * 0.45);

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
      const frazioneVelocitaHud = Math.min(1, auto.velocita / VELOCITA_MASSIMA_BASE);
      const velocitaKmhHud = auto.velocita * 3.6;
      disegnaLedCambio(ctx, W, frazioneVelocitaHud, performance.now());
      disegnaDisplay(ctx, W, velocitaKmhHud, frazioneVelocitaHud);

      const minimappa = minimappaRef.current;
      if (minimappa && minimappa.width > 0 && minimappa.height > 0) {
        const ctxMinimappa = minimappa.getContext('2d');
        const segmentoAutoFrazionale = auto.distanza / LUNGHEZZA_SEGMENTO;
        disegnaMinimappa(ctxMinimappa, minimappa.width, minimappa.height, segmentoAutoFrazionale);
      }

      const segmentoAuto = segmentoA(Math.floor(auto.distanza / LUNGHEZZA_SEGMENTO));
      const distanzaCamera = auto.distanza - DISTANZA_CAMERA_DIETRO;
      const segmentoCamera = segmentoA(Math.floor(distanzaCamera / LUNGHEZZA_SEGMENTO));
      const camera = {
        distanza: distanzaCamera,
        mondoX: segmentoCamera.mondoX + auto.x * FATTORE_SEGUI_LATERALE,
        mondoY: segmentoCamera.mondoY + ALTEZZA_CAMERA_SOPRA,
      };

      const segmenti = calcolaSegmentiVisibili(camera, NUMERO_SEGMENTI_VISIBILI);
      const proiettati = [];
      for (const s of segmenti) {
        const p = proietta(s, PROFONDITA_CAMERA, W, H, INCLINAZIONE_CAMERA_RADIANTI);
        if (p) proiettati.push({ ...s, ...p, y_mondo: s.y });
      }

      // Niente più camera shake: anche smorzato, restava percepito come
      // uno sfarfallio/salto d'immagine (soprattutto in curva) invece
      // che come una vibrazione — rimosso del tutto su richiesta
      // esplicita dell'utente, non solo attenuato.

      for (let i = proiettati.length - 1; i > 0; i--) {
        const lontano = proiettati[i];
        const vicino = proiettati[i - 1];
        // Larghezza minima garantita: senza questo, un segmento molto
        // lontano diventa sub-pixel e la pista sparisce visivamente
        // nel verde ai lati (segnalato dall'utente: "si vede poco in
        // lontananza") — con il minimo, resta sempre tracciabile fino
        // al punto di fuga.
        const semiL = Math.max(lontano.larghezzaProiettata / 2, 1.5);
        const semiV = Math.max(vicino.larghezzaProiettata / 2, 1.5);
        const LIMITE_SEMI_LARGHEZZA = W * 1.3;
        const semiLDisegno = Math.min(semiL, LIMITE_SEMI_LARGHEZZA);
        const semiVDisegno = Math.min(semiV, LIMITE_SEMI_LARGHEZZA);

        if (vicino.z < 900) {
          // Oltre una certa distanza lo scenario laterale (alberi,
          // gradinate) non aggiunge quasi nulla visivamente (diventa
          // minuscolo) ma costa comunque due disegni extra a segmento —
          // con la distanza di rendering ora molto più lunga, tagliarlo
          // presto aiuta le prestazioni senza perdita percepibile.
          disegnaScenarioLato(ctx, vicino.x, vicino.y, vicino.scala, W, vicino.indiceSegmento, vicino.curva, -1);
          disegnaScenarioLato(ctx, vicino.x, vicino.y, vicino.scala, W, vicino.indiceSegmento, vicino.curva, 1);
        }
        const cartello = CARTELLI_CURVA.get(vicino.indiceSegmento);
        if (cartello && vicino.z < 1400) {
          // I cartelli di velocità restano leggibili (e utili per
          // sapere quando rallentare) da più lontano dello scenario
          // puramente decorativo.
          disegnaCartelloCurva(ctx, vicino.x, vicino.y, vicino.scala, W, cartello);
        }

        ctx.fillStyle = vicino.indiceSegmento % 2 === 0 ? '#2f4a2f' : '#28422c';
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiLDisegno * 1.6, lontano.y);
        ctx.lineTo(lontano.x + semiLDisegno * 1.6, lontano.y);
        ctx.lineTo(vicino.x + semiVDisegno * 1.6, vicino.y);
        ctx.lineTo(vicino.x - semiVDisegno * 1.6, vicino.y);
        ctx.closePath();
        ctx.fill();

        const coloreCordolo = Math.floor(vicino.indiceSegmento / SEGMENTI_PER_STRISCIA_CORDOLO) % 2 === 0 ? '#c0392b' : '#e8e8e8';
        ctx.fillStyle = coloreCordolo;
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiLDisegno * 1.15, lontano.y);
        ctx.lineTo(lontano.x + semiLDisegno * 1.15, lontano.y);
        ctx.lineTo(vicino.x + semiVDisegno * 1.15, vicino.y);
        ctx.lineTo(vicino.x - semiVDisegno * 1.15, vicino.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = vicino.indiceSegmento % 2 === 0 ? '#2a2d33' : '#25282e';
        ctx.beginPath();
        ctx.moveTo(lontano.x - semiLDisegno, lontano.y);
        ctx.lineTo(lontano.x + semiLDisegno, lontano.y);
        ctx.lineTo(vicino.x + semiVDisegno, vicino.y);
        ctx.lineTo(vicino.x - semiVDisegno, vicino.y);
        ctx.closePath();
        ctx.fill();

        if (vicino.indiceSegmento % 6 < 3) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(lontano.x - semiLDisegno * 0.02, lontano.y);
          ctx.lineTo(lontano.x + semiLDisegno * 0.02, lontano.y);
          ctx.lineTo(vicino.x + semiVDisegno * 0.02, vicino.y);
          ctx.lineTo(vicino.x - semiVDisegno * 0.02, vicino.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      disegnaLineeVento(ctx, W, H, velocitaKmhHud, performance.now());
      disegnaCavalcavia(ctx, proiettati);

      const puntoAuto = proietta(
        {
          x: segmentoAuto.mondoX + auto.x - camera.mondoX,
          y: segmentoAuto.mondoY - camera.mondoY,
          z: auto.distanza - camera.distanza,
        },
        PROFONDITA_CAMERA,
        W,
        H,
        INCLINAZIONE_CAMERA_RADIANTI
      );
      if (puntoAuto) {
        disegnaAuto(ctx, puntoAuto, W, angoloVolanteRef.current * 0.3);
      }
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
    inputRef.current = { accelera: false, frena: false, sterzaSinistra: false, sterzaDestra: false };
    setPulsantiPremuti({});

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
