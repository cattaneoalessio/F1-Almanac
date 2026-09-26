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

export const VELOCITA_MASSIMA_BASE = 350 / 3.6; // ≈ 97.2 m/s = 350 km/h (richiesta esplicita dell'utente, era 324 km/h)
export const ACCELERAZIONE = 25; // m/s^2 (0 a velocità massima in ~3.6s in pista libera)
export const FRENO = 40; // m/s^2

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
 * - oltre il cordolo, sull'erba: -40% al secondo
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
  return { zona: 'erba', fattoreRiduzione: 0.4 };
}

/** L'auto non può mai superare lateralmente il muro di contenimento:
 * lo trattiamo come un vincolo rigido sulla posizione (non un rimbalzo
 * fisico, fuori scope per questa prima versione). */
export function limitaXAiMuri(xMetri, semiLarghezzaPista) {
  const muro = semiLarghezzaPista + DISTANZA_MURO_OLTRE_BORDO_PISTA;
  return Math.max(-muro, Math.min(muro, xMetri));
}

export function statoIniziale() {
  return { distanza: 0, x: 0, velocita: 0 };
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
  let { velocita, x } = stato;
  const { distanza } = stato;

  if (input.accelera) {
    velocita += ACCELERAZIONE * dt;
  } else if (input.frena) {
    velocita = Math.max(0, velocita - FRENO * dt);
  }
  // Nessun input: la velocità resta ESATTAMENTE costante (nessuna
  // decelerazione passiva/attrito) — richiesta esplicita dell'utente,
  // sostituisce il comportamento precedente che rallentava da solo.
  velocita = Math.min(velocita, VELOCITA_MASSIMA_BASE); // tetto assoluto — era sparito per errore insieme al vecchio tetto fisso di cordolo/erba, permettendo di accelerare ben oltre (segnalato dall'utente: fino a 500 km/h)

  const { zona, fattoreRiduzione } = statoPosizioneLaterale(x, semiLarghezzaPista);
  if (fattoreRiduzione > 0) {
    // Riduzione proporzionale CONTINUA alla velocità attuale, non un
    // tetto massimo fisso (richiesta esplicita dell'utente — con un
    // tetto fisso, ci si trovava bloccati esattamente a quel valore,
    // es. 65 km/h sull'erba, invece di rallentare "e basta" da lì).
    // (1-fattoreRiduzione)^dt: dopo un secondo pieno sulla superficie,
    // la velocità è scesa esattamente di quella percentuale rispetto a
    // quella con cui vi si è entrati, indipendentemente dal framerate.
    velocita *= (1 - fattoreRiduzione) ** dt;
  }
  velocita = Math.max(velocita, 0); // ridondante con i Math.max sopra, ma esplicito: mai negativa

  // Lo sterzo è proporzionale alla velocità attuale (da fermi girare
  // il volante non sposta la macchina), ma con un minimo garantito:
  // senza, sull'erba (dove la velocità cala progressivamente) sterzare
  // sarebbe via via meno efficace proprio mentre serve di più per
  // rientrare in pista — ci si restava bloccati (segnalato
  // dall'utente: "a fatica si rimette al centro").
  const frazioneVelocita = velocita / VELOCITA_MASSIMA_BASE;
  const frazioneVelocitaSterzo = Math.max(0.35, frazioneVelocita);
  if (input.sterzaSinistra) x -= VELOCITA_STERZO_LATERALE * dt * frazioneVelocitaSterzo;
  if (input.sterzaDestra) x += VELOCITA_STERZO_LATERALE * dt * frazioneVelocitaSterzo;

  // Effetto centrifugo: la curva del tracciato tira l'auto verso
  // l'esterno, più forte quanto più si va veloci. Il segno era
  // invertito: spingeva verso l'INTERNO della curva (nella stessa
  // direzione in cui si sterza istintivamente entrando in curva) — i
  // due effetti si sommavano invece di contrastarsi, mandando l'auto
  // dritta sul muro esterno e bloccandocela (segnalato dall'utente:
  // "premendo la direzione l'auto lampeggia... si fissa a 65km/h").
  // Verificato: con curva=-3,98 (sinistra) e sterzo a sinistra tenuto,
  // x restava fissa esattamente al muro (-16, il limite assoluto) per
  // tutta la curva.
  x -= curvaturaSegmentoCorrente * frazioneVelocita * dt * EFFETTO_CENTRIFUGO;

  x = limitaXAiMuri(x, semiLarghezzaPista);

  return {
    distanza: distanza + velocita * dt,
    x,
    velocita,
    zona,
  };
}
