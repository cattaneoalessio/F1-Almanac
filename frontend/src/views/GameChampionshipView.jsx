import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  getClassificaCampionato,
  getClassificaTempiCircuito,
  getElencoCircuiti,
  getGrigliaPartenza,
  getMioRecord,
  getSchedaCircuito,
  inviaTempoGioco,
} from '../api/backend.js';
import {
  calcolaFattoreRettilineo,
  distanzaDalCentro,
  eSullErba,
  generaCenterline,
  generaCheckpoint,
  LARGHEZZA_PISTA,
  RAGGIO_CATTURA_CHECKPOINT,
  RIDUZIONE_VELOCITA_ERBA,
  TOLLERANZA_FUORI_PISTA_FRAZIONE,
} from '../game/pista.js';
import { avanzaFisica, controllaCatturaCheckpoint, statoIniziale, VELOCITA_MASSIMA_BASE } from '../game/fisica.js';
import {
  coloreGiro,
  estraiCheckpointDelGiro,
  PENALITA_TAGLIO_CURVA_SECONDI,
  trovaMigliorGiroValido,
} from '../game/sessione.js';
import './GameChampionshipView.css';

const LARGHEZZA_CANVAS = 900;
const ALTEZZA_CANVAS = 600;
const GIRI_GARA = 3; // solo la Gara ha un numero di giri fisso: Qualifica e Prove Libere no (vedi sotto)
const ETICHETTA_SESSIONE = { prove_libere: 'Prove Libere', qualifica: 'Qualifica', gara: 'Gara' };

// Semaforo di partenza: 5 luci si accendono una alla volta, poi dopo
// un'attesa in più (in totale un ritardo casuale di 3-5s dall'inizio
// della sequenza) si spengono tutte insieme — è quello il momento in
// cui il tempo parte davvero, per tutte e 3 le sessioni.
const NUMERO_LUCI = 5;
const INTERVALLO_LUCE_MS = 400;
const ATTESA_EXTRA_MIN_MS = 1000;
const ATTESA_EXTRA_MAX_MS = 3000;
const DURATA_FLASH_VIA_MS = 700;

// Tempo limite di una sessione di Qualifica: puoi fare tutti i giri che
// vuoi finché non scade, conta il migliore VALIDO. Prove Libere e Gara
// non hanno questo limite (Gara si conclude dopo GIRI_GARA giri,
// Prove Libere non si conclude mai da sola).
const LIMITE_TEMPO_QUALIFICA_SECONDI = 180;

/**
 * GameChampionshipView — Time Attack asincrono ("Monoposto Virtual Arena")
 * + Campionato Mondiale Virtuale.
 *
 * Flow: 'selezione' -> 'in-pista' (che al suo interno parte sempre con
 * la sequenza del semaforo, poi il tempo/i comandi si sbloccano al
 * verde) -> 'riepilogo' (torna a 'selezione', o resta in loop infinito
 * per le Prove Libere, che non hanno una fase 'riepilogo' automatica:
 * si esce quando si vuole con "Abbandona").
 *
 * Login sempre facoltativo per GIOCARE (come ChronoQuiz), ma qui è
 * obbligatorio lato server per SALVARE un tempo ufficiale — un
 * campionato richiede un'identità persistente. Le Prove Libere non
 * chiamano mai il backend per salvare: girano solo qui, illimitate.
 *
 * La pista è generica ("Monoposto Virtual Arena", 4 curve standard),
 * MAI la sagoma reale di un circuito: nessuna geometria di circuito è
 * salvata nel DB né disegnata qui, per decisione esplicita presa con
 * l'utente (policy anti-invenzione di questo progetto). Il circuito
 * reale selezionato influenza solo la lunghezza dei rettilinei
 * (calcolaFattoreRettilineo, da lunghezza_km) — mai la forma.
 *
 * QUALIFICA — come funziona con un tempo limite invece di un giro solo:
 * si possono fare quanti giri si vuole entro LIMITE_TEMPO_QUALIFICA_SECONDI,
 * ognuno segnato come valido o no (non valido se l'auto è uscita pista
 * anche solo un istante durante quel giro). Alla scadenza del tempo (o
 * comunque solo alla fine), il MIGLIOR giro valido viene inviato al
 * backend come se fosse l'unico giro di una sessione da 1 giro — stesso
 * formato già validato lato server (game.py: GIRI_PER_SESSIONE['qualifica']=1),
 * quindi non serve alcuna modifica al backend: i checkpoint di quel
 * giro vengono semplicemente ritemporizzati da 0, come se il giro
 * migliore fosse stato l'unico giocato.
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

  const [risultatoFinale, setRisultatoFinale] = useState(null); // { tempoTotale } | null
  const [statoInvio, setStatoInvio] = useState('inattivo'); // inattivo | invio | salvato | non-salvato | login-richiesto | errore | nessun-tempo
  const [motivoRifiuto, setMotivoRifiuto] = useState(null);
  const [nuovoRecord, setNuovoRecord] = useState(false);

  const [classificaCircuito, setClassificaCircuito] = useState(null);
  const [statoClassificaCircuito, setStatoClassificaCircuito] = useState('inattivo');

  const [campionato, setCampionato] = useState([]);
  const [statoCampionato, setStatoCampionato] = useState('caricamento');

  const [hud, setHud] = useState({ tempoTrascorso: 0, giro: 1, suErba: false, velocitaKmh: 0 });

  // Semaforo di partenza.
  const [numeroLuciAccese, setNumeroLuciAccese] = useState(0);
  const [semaforoVia, setSemaforoVia] = useState(false);
  const [mostraVia, setMostraVia] = useState(false);

  // Cronologia giri della sessione corrente (Qualifica/Prove Libere/Gara,
  // per tutte e 3: "segnare i giri fatti" vale per tutte).
  const [giriCompletati, setGiriCompletati] = useState([]);

  // Griglia di partenza (solo per la Gara).
  const [grigliaInfo, setGrigliaInfo] = useState(null);
  const [statoGriglia, setStatoGriglia] = useState('inattivo');

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
  const inizioGiroRef = useRef(0);
  const giroPenalizzatoRef = useRef(false);
  const giriCompletatiRef = useRef([]);
  const viaRef = useRef(false);
  const mioRecordRef = useRef({ qualifica: null, gara: null });
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
  // Attivo anche durante il semaforo: i tasti non fanno nulla finché
  // viaRef non è true (vedi fotogramma), così non c'è un "falso
  // partenza" possibile tenendo premuto in anticipo.
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

  // Sequenza del semaforo: riparte ogni volta che si entra in pista
  // (sia il primo "Vai in pista" sia un "Rigioca"). Il ritardo totale
  // prima del verde è casuale tra 3 e 5 secondi (le prime NUMERO_LUCI *
  // INTERVALLO_LUCE_MS accendono le luci una a una, il resto è
  // un'attesa in più a tutte le luci accese) — comportamento identico
  // per Qualifica, Prove Libere e Gara.
  useEffect(() => {
    if (fase !== 'in-pista') return undefined;

    setSemaforoVia(false);
    setMostraVia(false);
    setNumeroLuciAccese(0);
    viaRef.current = false;

    const idTimeout = [];
    for (let i = 1; i <= NUMERO_LUCI; i++) {
      idTimeout.push(
        setTimeout(() => {
          setNumeroLuciAccese(i);
        }, i * INTERVALLO_LUCE_MS)
      );
    }

    const attesaExtra = ATTESA_EXTRA_MIN_MS + Math.random() * (ATTESA_EXTRA_MAX_MS - ATTESA_EXTRA_MIN_MS);
    const ritardoTotaleMs = NUMERO_LUCI * INTERVALLO_LUCE_MS + attesaExtra; // totale: 3-5s

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Prima del verde: l'auto resta ferma alla partenza, si disegna
      // comunque (per far vedere dove si parte) ma niente fisica/tempo.
      if (!viaRef.current) {
        disegna();
        requestIdRef.current = requestAnimationFrame(fotogramma);
        return;
      }

      const { distanza } = distanzaDalCentro(statoAutoRef.current.x, statoAutoRef.current.y, centerlineRef.current);
      const suErba = eSullErba(distanza);
      if (suErba) giroPenalizzatoRef.current = true; // basta un istante sull'erba per penalizzare il giro
      const velocitaMassima = VELOCITA_MASSIMA_BASE * (suErba ? RIDUZIONE_VELOCITA_ERBA : 1);
      statoAutoRef.current = avanzaFisica(statoAutoRef.current, inputRef.current, dt, velocitaMassima);

      // Un solo timestamp per tutto il fotogramma (telemetria, durata
      // giro, tempo limite di Qualifica): prima era ricalcolato dentro
      // il blocco del checkpoint e quindi non esisteva più fuori da lì —
      // bug vero, faceva crashare ogni sessione di Qualifica al primo
      // fotogramma senza cattura di un checkpoint (trovato testando).
      const adesso = performance.now();

      const nuovoAtteso = controllaCatturaCheckpoint(
        statoAutoRef.current,
        checkpointRef.current,
        checkpointAttesoRef.current,
        RAGGIO_CATTURA_CHECKPOINT
      );
      if (nuovoAtteso !== checkpointAttesoRef.current) {
        const tSessione = adesso - tempoInizioRef.current;
        telemetriaRef.current.push({ giro: giroCorrenteRef.current, indice: checkpointAttesoRef.current, t: tSessione });

        if (checkpointAttesoRef.current === 3) {
          // Giro completato: si registra SEMPRE (Qualifica, Prove Libere
          // e Gara) — è sempre "valido" in senso stretto (ha passato
          // tutti i checkpoint, altrimenti non saremmo arrivati qui),
          // ma può essere penalizzato (+5s) se è finito sull'erba anche
          // solo per un istante durante il giro.
          const numeroGiroCompletato = giroCorrenteRef.current;
          const tempoBaseSecondi = (adesso - inizioGiroRef.current) / 1000;
          const penalizzato = giroPenalizzatoRef.current;
          const tempoConPenalita = tempoBaseSecondi + (penalizzato ? PENALITA_TAGLIO_CURVA_SECONDI : 0);

          // Checkpoint di QUESTO giro soltanto, ritemporizzati da 0: è il
          // formato che serve per un'eventuale invio come "giro singolo"
          // (Qualifica invia solo il suo giro migliore, non l'intera
          // sessione — vedi commento in cima al file). NON includono la
          // penalità: sono i timestamp reali dei checkpoint, la
          // penalità si somma solo al tempo finale (vedi anche il
          // backend, game.py, che ammette questa differenza).
          const inizioGiroRelativoASessione = inizioGiroRef.current - tempoInizioRef.current;
          const checkpointDiQuestoGiro = estraiCheckpointDelGiro(
            telemetriaRef.current,
            numeroGiroCompletato,
            inizioGiroRelativoASessione
          );

          giriCompletatiRef.current = [
            ...giriCompletatiRef.current,
            {
              numero: numeroGiroCompletato,
              tempo: tempoConPenalita,
              penalizzato,
              valido: true,
              checkpoint: checkpointDiQuestoGiro,
            },
          ];
          setGiriCompletati(giriCompletatiRef.current);

          giroPenalizzatoRef.current = false; // si riparte "puliti" dal prossimo giro
          inizioGiroRef.current = adesso;

          if (tipoSessione === 'gara' && giroCorrenteRef.current >= GIRI_GARA) {
            fermo = true;
            // Il tempo totale di Gara somma anche le penalità di TUTTI i
            // giri appena registrati (incluso quest'ultimo): tSessione è
            // il tempo "grezzo" di guida, senza penalità.
            const penalitaTotali = giriCompletatiRef.current.reduce(
              (totale, g) => totale + (g.penalizzato ? PENALITA_TAGLIO_CURVA_SECONDI : 0),
              0
            );
            concludiGara(tSessione / 1000 + penalitaTotali);
            return;
          }
          giroCorrenteRef.current += 1;
        }
        checkpointAttesoRef.current = nuovoAtteso;
      }

      // Tempo limite di Qualifica: controllato a ogni fotogramma, non
      // solo al giro completato — scade anche a metà di un giro (che
      // in quel caso va semplicemente perso, non viene registrato).
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
          suErba,
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
    giriCompletatiRef.current = [];
    giroPenalizzatoRef.current = false;
    ultimoAggiornamentoHudRef.current = 0;
    // tempoInizioRef/inizioGiroRef vengono impostati quando scatta il
    // verde (vedi l'effetto della sequenza semaforo), non qui.

    setTipoSessione(tipo);
    setStatoInvio('inattivo');
    setMotivoRifiuto(null);
    setNuovoRecord(false);
    setRisultatoFinale(null);
    setGiriCompletati([]);
    setHud({ tempoTrascorso: 0, giro: 1, suErba: false, velocitaKmh: 0 });

    // Il mio record personale su questo circuito, per colorare di viola
    // un giro che lo batte (non blocca l'avvio: se non è ancora
    // arrivato quando parte il primo giro, semplicemente quel giro non
    // viene evidenziato in viola finché la risposta non arriva).
    mioRecordRef.current = { qualifica: null, gara: null };
    ottieniToken()
      .then((token) => getMioRecord(circuitoSlug, token))
      .then((dati) => {
        mioRecordRef.current = dati;
      })
      .catch((errore) => console.error('Errore nel caricare il mio record personale:', errore));

    if (tipo === 'gara') {
      setStatoGriglia('caricamento');
      ottieniToken()
        .then((token) => getGrigliaPartenza(circuitoSlug, token))
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
    setFase('selezione');
  }

  /**
   * Collega un pulsante su schermo allo stesso inputRef già usato dalla
   * tastiera: stesso "campo" (accelera/frena/sterzaSinistra/sterzaDestra),
   * quindi la fisica non sa né le importa da dove arriva l'input. Gestisce
   * sia touch che mouse (comodo anche su desktop, e utile per testare):
   * preventDefault evita che il touch generi anche un click sintetico
   * dopo, che raddoppierebbe l'input, e blocca lo scroll/zoom della pagina
   * mentre si tocca il pulsante.
   */
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

  // Gara: comportamento invariato da prima — esattamente GIRI_GARA giri,
  // tempo totale = somma di tutti, sempre inviato (se loggato).
  function concludiGara(tempoTotaleSecondi) {
    const telemetria = [...telemetriaRef.current];
    setRisultatoFinale({ tempoTotale: tempoTotaleSecondi });
    setFase('riepilogo');
    inviaERicaricaClassifica(tempoTotaleSecondi, telemetria);
  }

  // Qualifica: il tempo limite è scaduto (o si può chiamare comunque a
  // fine sessione). Prende il MIGLIOR giro valido tra quelli fatti e lo
  // invia come se fosse l'unico giro della sessione — se non c'è
  // nessun giro valido, non c'è nulla da inviare (esito "nessun-tempo",
  // non un errore: è normale se non si completa nemmeno un giro pulito
  // entro il tempo limite).
  function concludiQualifica() {
    const migliore = trovaMigliorGiroValido(giriCompletatiRef.current);

    setFase('riepilogo');
    if (migliore === null) {
      setRisultatoFinale({ tempoTotale: null });
      setStatoInvio('nessun-tempo');
      caricaClassificaCircuito(); // niente da inviare, ma la classifica va comunque mostrata
      return;
    }
    setRisultatoFinale({ tempoTotale: migliore.tempo });
    inviaERicaricaClassifica(migliore.tempo, migliore.checkpoint);
  }

  async function inviaERicaricaClassifica(tempoTotaleSecondi, checkpoint) {
    if (tipoSessione === 'prove_libere') return; // mai inviato, per scelta

    setStatoInvio('invio');
    try {
      const token = await ottieniToken();
      const risposta = await inviaTempoGioco(circuitoSlug, tipoSessione, tempoTotaleSecondi, checkpoint, token);
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
    if (secondi === null || secondi === undefined) return '--';
    const min = Math.floor(secondi / 60);
    const sec = (secondi % 60).toFixed(3).padStart(6, '0');
    return min > 0 ? `${min}:${sec}` : `${sec}s`;
  }

  return <main className="main game-championship-view">{renderContenuto()}</main>;

  function renderContenuto() {
    if (fase === 'in-pista') {
      const tempoRimastoQualifica = Math.max(0, LIMITE_TEMPO_QUALIFICA_SECONDI - hud.tempoTrascorso);
      return (
        <div className="game-championship-view__in-pista">
          <div className="game-championship-view__hud">
            <span>{schedaCircuito?.nome} &mdash; {ETICHETTA_SESSIONE[tipoSessione]}</span>
            {tipoSessione === 'qualifica' ? (
              <span className="tab-num">Tempo rimasto: {formattaTempo(tempoRimastoQualifica)}</span>
            ) : (
              <span className="tab-num">{formattaTempo(hud.tempoTrascorso)}</span>
            )}
            <span className="tab-num">{tipoSessione === 'gara' ? `Giro ${hud.giro}/${GIRI_GARA}` : `Giro ${hud.giro}`}</span>
            <span className="tab-num">{hud.velocitaKmh} km/h</span>
            <span className={hud.suErba ? 'game-championship-view__su-erba' : ''}>
              {hud.suErba ? 'SULL\u2019ERBA' : ''}
            </span>
          </div>

          <div className="game-championship-view__area-pista">
            <canvas
              ref={canvasRef}
              width={LARGHEZZA_CANVAS}
              height={ALTEZZA_CANVAS}
              className="game-championship-view__canvas"
            />

            {!semaforoVia && (
              <div className="game-championship-view__semaforo-overlay">
                <div className="game-championship-view__semaforo">
                  {Array.from({ length: NUMERO_LUCI }, (_, indice) => indice + 1).map((n) => (
                    <span
                      key={n}
                      className={`game-championship-view__luce ${n <= numeroLuciAccese ? 'game-championship-view__luce--accesa' : ''}`}
                    />
                  ))}
                </div>
                {tipoSessione === 'gara' && (
                  <p className="game-championship-view__griglia-info">
                    {statoGriglia === 'caricamento' && 'Carico la griglia di partenza...'}
                    {statoGriglia === 'pronto' && grigliaInfo && (
                      grigliaInfo.posizione
                        ? `Griglia: P${grigliaInfo.posizione} di ${grigliaInfo.piloti_totali}`
                        : 'Nessun tempo di qualifica qui: parti dal fondo dello schieramento'
                    )}
                    {' \u2014 '}
                    {GIRI_GARA} giri da percorrere
                  </p>
                )}
                {tipoSessione === 'qualifica' && (
                  <p className="game-championship-view__griglia-info">
                    Hai {Math.round(LIMITE_TEMPO_QUALIFICA_SECONDI / 60)} minuti per il tuo giro migliore
                  </p>
                )}
              </div>
            )}

            {mostraVia && <div className="game-championship-view__via-flash">VIA!</div>}
          </div>

          {giriCompletati.length > 0 && (
            <div className="game-championship-view__giri-lista-contenitore">
              <p className="game-championship-view__giri-lista-titolo">Giri</p>
              <ol className="game-championship-view__giri-lista">
                {giriCompletati.map((giro) => {
                  const colore = coloreGiro(giro, giriCompletati, mioRecordRef.current?.[tipoSessione]);
                  return (
                    <li
                      key={giro.numero}
                      className={`game-championship-view__giro-voce ${colore ? `game-championship-view__giro-voce--${colore}` : ''}`}
                    >
                      <span className="tab-num">Giro {giro.numero}</span>
                      <span className="game-championship-view__giro-tempo">
                        <span className="tab-num">{formattaTempo(giro.tempo)}</span>
                        {giro.penalizzato && (
                          <span className="game-championship-view__giro-penalita">+{PENALITA_TAGLIO_CURVA_SECONDI}s taglio curva</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="game-championship-view__istruzioni-controlli">
            <p className="game-championship-view__istruzioni-titolo">Comandi da tastiera</p>
            <ul className="game-championship-view__istruzioni-lista">
              <li>
                <kbd>&uarr;</kbd> <kbd>W</kbd> <span>Accelera</span>
              </li>
              <li>
                <kbd>&darr;</kbd> <kbd>S</kbd> <span>Frena (retromarcia se sei già fermo)</span>
              </li>
              <li>
                <kbd>&larr;</kbd> <kbd>A</kbd> <span>Sterza a sinistra</span>
              </li>
              <li>
                <kbd>&rarr;</kbd> <kbd>D</kbd> <span>Sterza a destra</span>
              </li>
            </ul>
            <p className="game-championship-view__istruzioni-touch-nota">
              Da mobile o tablet: usa i pulsanti qui sotto al posto della tastiera.
            </p>
          </div>

          <div className="game-championship-view__controlli-touch">
            <div className="game-championship-view__controlli-touch-gruppo">
              <button
                type="button"
                className="game-championship-view__pulsante-touch"
                aria-label="Sterza a sinistra"
                {...gestoriPulsanteControllo('sterzaSinistra')}
              >
                &larr;
              </button>
              <button
                type="button"
                className="game-championship-view__pulsante-touch"
                aria-label="Sterza a destra"
                {...gestoriPulsanteControllo('sterzaDestra')}
              >
                &rarr;
              </button>
            </div>
            <div className="game-championship-view__controlli-touch-gruppo">
              <button
                type="button"
                className="game-championship-view__pulsante-touch game-championship-view__pulsante-touch--freno"
                aria-label="Frena o retromarcia"
                {...gestoriPulsanteControllo('frena')}
              >
                &darr;
              </button>
              <button
                type="button"
                className="game-championship-view__pulsante-touch game-championship-view__pulsante-touch--gas"
                aria-label="Accelera"
                {...gestoriPulsanteControllo('accelera')}
              >
                &uarr;
              </button>
            </div>
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
              {formattaTempo(risultatoFinale?.tempoTotale)}
            </span>

            {tipoSessione === 'prove_libere' && (
              <p className="game-championship-view__esito">Prove Libere: nessun tempo salvato, solo allenamento.</p>
            )}
            {statoInvio === 'nessun-tempo' && (
              <p className="game-championship-view__esito">
                Nessun giro valido entro il tempo limite &mdash; riprova, magari con più calma sui cordoli.
              </p>
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

          <ul className="game-championship-view__regole-lista">
            <li>
              Puoi uscire di pista fino al {Math.round(TOLLERANZA_FUORI_PISTA_FRAZIONE * 100)}% della larghezza
              della strada senza conseguenze.
            </li>
            <li>Oltre quel margine sei sull&rsquo;erba: velocità massima ridotta dell&rsquo;{Math.round((1 - RIDUZIONE_VELOCITA_ERBA) * 100)}%.</li>
            <li>
              Un giro è valido se passi tutti i checkpoint; se durante il giro finisci sull&rsquo;erba (taglio di
              curva), quel giro riceve una penalità di +{PENALITA_TAGLIO_CURVA_SECONDI}s.
            </li>
            {tipoSessione === 'qualifica' && (
              <li>
                Qualifica: hai <strong>{formattaTempo(LIMITE_TEMPO_QUALIFICA_SECONDI)}</strong> a partire dal semaforo
                verde per fare tutti i giri che vuoi — conta solo il migliore (tempo di penalità incluso).
              </li>
            )}
          </ul>

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
