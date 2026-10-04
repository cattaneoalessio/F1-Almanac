/**
 * fisica3d.js — fisica del motore pseudo-3D: l'auto ha una `distanza`
 * percorsa lungo il tracciato (scalare, sempre crescente: non si può
 * invertire il senso di marcia, vedi sotto) e una posizione `x`
 * LATERALE, in METRI reali dal centro pista (negativa = a sinistra,
 * positiva = a destra) — non più normalizzata -1..1 come nella prima
 * versione. Tutte le costanti qui sotto sono in metri e metri/secondo:
 * scelta deliberata dopo le specifiche dell'utente su cordoli e muri
 * (date in metri), così i calcoli hanno un senso fisico coerente
 * invece di un fattore di conversione km/h inventato a parte.
 *
 * Pura come pista.js/circuito3d.js: nessun accesso a canvas/DOM/tempo
 * di sistema, testabile in isolamento con Node.
 */

export const VELOCITA_MASSIMA_BASE = 350 / 3.6; // ≈ 97.2 m/s = 350 km/h, tetto assoluto

// --- Motore e aerodinamica (2026-10-04, richiesta: 350 solo in fondo ai
// rettilinei lunghi, mai in curva) ---
// Accelerazione = il minimo tra la trazione (da fermi le gomme non scaricano
// più di tanto) e la spinta del motore, che cala col quadrato della velocità
// per la resistenza dell'aria e tende a VELOCITA_ASINTOTICA senza mai
// raggiungerla. Risultato: 0-100 ≈ 2,5 s, 0-200 ≈ 5 s; da 200 km/h servono
// circa 475 m di rettilineo per toccare i 350 (verificato con una
// simulazione del giro lanciato: i 350 si toccano solo sui due rettilinei
// da ~600 m, a 100-150 m dalla staccata; sugli altri si resta a 250-300).
const VELOCITA_ASINTOTICA = 375 / 3.6;
const ACCELERAZIONE_TRAZIONE = 11; // m/s²
const ACCELERAZIONE_MOTORE = 20; // m/s² a velocità nulla, prima della resistenza dell'aria
// Freno: come in una F1, morde di più ad alta velocità (più carico
// aerodinamico sulle gomme): ~42 m/s² a 350 km/h, ~17 m/s² a 100 km/h.
const FRENO_BASE = 14;
const FRENO_AERO = 30;
// Gas rilasciato: rallenta da sola (aria + freno motore), ~6 m/s² a 350 km/h.
const DECELERAZIONE_RILASCIO_BASE = 0.8;
const DECELERAZIONE_RILASCIO_AERO = 5.5;

// --- Sottosterzo: ogni curva ha una velocità oltre la quale le gomme non
// tengono. Formula allineata ai cartelli (circuito3d.js: 230 − 34·curva
// all'apice), con 20 km/h di margine: chi rispetta i cartelli non scivola.
export function velocitaAderenza(curvatura) {
  const kmh = Math.max(70, 250 - Math.abs(curvatura) * 34);
  return kmh / 3.6;
}
const SPINTA_SOTTOSTERZO = 25; // m/s laterali per ogni 100% oltre l'aderenza
const SPINTA_SOTTOSTERZO_MASSIMA = 20;
const ATTRITO_SOTTOSTERZO = 40; // m/s² di velocità persa per ogni 100% oltre l'aderenza
const ATTRITO_SOTTOSTERZO_MASSIMO = 15;

// Scia: dietro un'altra auto, entro SCIA_DISTANZA metri, si guadagnano
// fino a 10 km/h di velocità (meno resistenza dell'aria, tetto più alto).
export const SCIA_DISTANZA = 50;
const SCIA_BONUS = 10 / 3.6;

/** Accelerazione massima in pieno gas a una data velocità (anche per i bot). */
export function accelerazioneMassima(velocita, scia = 0) {
  const asintoto = VELOCITA_ASINTOTICA + SCIA_BONUS * scia;
  return Math.max(0, Math.min(ACCELERAZIONE_TRAZIONE, ACCELERAZIONE_MOTORE * (1 - (velocita / asintoto) ** 2)));
}
/** Decelerazione in frenata piena a una data velocità (anche per i bot). */
export function frenataMassima(velocita) {
  return FRENO_BASE + FRENO_AERO * (velocita / VELOCITA_ASINTOTICA) ** 2;
}

// Fumo dalle gomme: una frenata iniziata sopra i 300 km/h blocca le
// anteriori finché non si scende sotto i 150 o si rilascia il freno.
const SOGLIA_BLOCCAGGIO = 300 / 3.6;
const FINE_BLOCCAGGIO = 150 / 3.6;

export const LARGHEZZA_AUTO = 3; // metri, dato dall'utente
export const SEMI_LARGHEZZA_AUTO = LARGHEZZA_AUTO / 2;

// Larghezza del cordolo oltre il bordo pista: non specificata
// dall'utente, 1 metro è una scelta ragionevole (i cordoli reali sono
// tipicamente 1-1.5m) — da aggiustare se serve un valore preciso.
export const LARGHEZZA_CORDOLO = 1;

// Muro di contenimento: 10 metri oltre la linea esterna della pista
// (non oltre il cordolo — la misura è esplicita dall'utente, "dalla
// linea esterna della pista").
export const DISTANZA_MURO_OLTRE_BORDO_PISTA = 10;

export const VELOCITA_STERZO_LATERALE = 10; // m/s di spostamento laterale a piena velocità e piena sterzata
export const EFFETTO_CENTRIFUGO = 1.4; // quanto la curvatura del segmento "tira" lateralmente l'auto (m/s a piena velocità) — alla curva più stretta del tracciato (5) dà una spinta di 7, sotto le 10 dello sterzo (VELOCITA_STERZO_LATERALE): prima (3.5) dava 17.5, più dello sterzo anche a fondo, impossibile da controbilanciare (segnalato dall'utente: "scivola sempre troppo rispetto allo sterzo")

/**
 * Zona in cui si trova l'auto in base alla posizione laterale, e la
 * riduzione (proporzionale, continua — non un tetto massimo fisso,
 * vedi avanzaFisica) applicata lì:
 * - completamente in pista: nessuna riduzione
 * - almeno una ruota sul cordolo (bordo esterno o interno dell'auto
 *   oltre il bordo pista, ma non oltre il cordolo): -20% al secondo
 * - oltre il cordolo, sull'erba: -50% al secondo (era -40%, portato a 50
 *   su richiesta del 2026-10-04)
 */
export function statoPosizioneLaterale(xMetri, semiLarghezzaPista) {
  const distanzaCentro = Math.abs(xMetri);
  const bordoVicino = distanzaCentro - SEMI_LARGHEZZA_AUTO; // bordo dell'auto più vicino al centro pista
  const bordoLontano = distanzaCentro + SEMI_LARGHEZZA_AUTO; // bordo dell'auto più lontano (esce per primo)
  const bordoCordolo = semiLarghezzaPista + LARGHEZZA_CORDOLO;

  if (bordoLontano <= semiLarghezzaPista) {
    return { zona: 'pista', fattoreRiduzione: 0 };
  }
  if (bordoVicino <= bordoCordolo) {
    return { zona: 'cordolo', fattoreRiduzione: 0.2 };
  }
  return { zona: 'erba', fattoreRiduzione: 0.5 };
}

/** L'auto non può mai superare lateralmente il muro di contenimento:
 * lo trattiamo come un vincolo rigido sulla posizione (non un rimbalzo
 * fisico, fuori scope per questa prima versione). */
export function limitaXAiMuri(xMetri, semiLarghezzaPista) {
  const muro = semiLarghezzaPista + DISTANZA_MURO_OLTRE_BORDO_PISTA;
  return Math.max(-muro, Math.min(muro, xMetri));
}

export function statoIniziale() {
  return { distanza: 0, x: 0, velocita: 0, bloccaggio: false };
}

/**
 * Avanza la simulazione di un frame. `curvaturaSegmentoCorrente` è la
 * curvatura (positiva = destra, negativa = sinistra) del segmento su
 * cui si trova l'auto in questo istante. `semiLarghezzaPista` in
 * metri (metà larghezza pista, per calcolare cordoli/muri).
 *
 * Niente retromarcia (specifica esplicita dell'utente): frenare e
 * l'attrito passivo non portano mai la velocità sotto 0, si fermano lì.
 */
export function avanzaFisica(stato, input, dt, curvaturaSegmentoCorrente, semiLarghezzaPista) {
  let { velocita, x, bloccaggio = false } = stato;
  const { distanza } = stato;
  const quadratoVelocita = (velocita / VELOCITA_ASINTOTICA) ** 2;

  const scia = input.scia || 0;
  if (input.accelera && !input.frena) {
    velocita += accelerazioneMassima(velocita, scia) * dt;
  } else if (input.frena) {
    if (!bloccaggio && velocita >= SOGLIA_BLOCCAGGIO) bloccaggio = true;
    velocita = Math.max(0, velocita - (FRENO_BASE + FRENO_AERO * quadratoVelocita) * dt);
  } else {
    velocita = Math.max(0, velocita - (DECELERAZIONE_RILASCIO_BASE + DECELERAZIONE_RILASCIO_AERO * quadratoVelocita) * dt);
  }
  if (!input.frena || velocita < FINE_BLOCCAGGIO) bloccaggio = false;
  velocita = Math.min(velocita, VELOCITA_MASSIMA_BASE + SCIA_BONUS * scia);

  // Sottosterzo: oltre la velocità di aderenza della curva l'auto allarga
  // (spinta verso l'esterno) e le gomme che strisciano la rallentano.
  let eccessoAderenza = 0;
  if (Math.abs(curvaturaSegmentoCorrente) > 0.3) {
    eccessoAderenza = Math.max(0, velocita / velocitaAderenza(curvaturaSegmentoCorrente) - 1);
    if (eccessoAderenza > 0) {
      const attrito = Math.min(ATTRITO_SOTTOSTERZO_MASSIMO, eccessoAderenza * ATTRITO_SOTTOSTERZO);
      velocita = Math.max(0, velocita - attrito * dt);
      const spinta = Math.min(SPINTA_SOTTOSTERZO_MASSIMA, eccessoAderenza * SPINTA_SOTTOSTERZO);
      x += Math.sign(curvaturaSegmentoCorrente) * -spinta * dt;
    }
  }

  const { zona, fattoreRiduzione } = statoPosizioneLaterale(x, semiLarghezzaPista);
  if (fattoreRiduzione > 0) {
    // Perdita proporzionale CONTINUA (non un tetto fisso): dopo un secondo
    // sulla superficie la velocità è scesa di quella percentuale.
    velocita *= (1 - fattoreRiduzione) ** dt;
  }
  velocita = Math.max(velocita, 0);

  // Sterzo proporzionale alla velocità, con un minimo garantito per poter
  // rientrare in pista anche piano.
  const frazioneVelocita = velocita / VELOCITA_MASSIMA_BASE;
  const frazioneVelocitaSterzo = Math.max(0.35, frazioneVelocita);
  if (input.sterzaSinistra) x -= VELOCITA_STERZO_LATERALE * dt * frazioneVelocitaSterzo;
  if (input.sterzaDestra) x += VELOCITA_STERZO_LATERALE * dt * frazioneVelocitaSterzo;

  // Effetto centrifugo: la curva tira l'auto verso l'esterno.
  x -= curvaturaSegmentoCorrente * frazioneVelocita * dt * EFFETTO_CENTRIFUGO;

  x = limitaXAiMuri(x, semiLarghezzaPista);

  return {
    distanza: distanza + velocita * dt,
    x,
    velocita,
    zona,
    bloccaggio,
    sottosterzo: eccessoAderenza > 0.05,
  };
}
