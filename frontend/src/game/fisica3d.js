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

export const VELOCITA_MASSIMA_BASE = 90; // m/s ≈ 324 km/h
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
export const EFFETTO_CENTRIFUGO = 3.5; // quanto la curvatura del segmento "tira" lateralmente l'auto (m/s a piena velocità)

/**
 * Zona in cui si trova l'auto in base alla posizione laterale, e il
 * fattore che riduce la velocità massima lì — sistema a ruote, dalle
 * specifiche dell'utente:
 * - completamente in pista: nessuna riduzione
 * - 1 ruota sul cordolo (il bordo esterno dell'auto ha superato il
 *   bordo pista, quello interno no): -10%
 * - 2 ruote sul cordolo (entrambi i bordi dell'auto hanno superato il
 *   bordo pista, ma quello interno è ancora entro il cordolo): -25%
 * - più di 2 ruote oltre cordoli/pista (il bordo interno dell'auto ha
 *   superato anche il cordolo): -80%
 */
export function statoPosizioneLaterale(xMetri, semiLarghezzaPista) {
  const distanzaCentro = Math.abs(xMetri);
  const bordoVicino = distanzaCentro - SEMI_LARGHEZZA_AUTO; // bordo dell'auto più vicino al centro pista
  const bordoLontano = distanzaCentro + SEMI_LARGHEZZA_AUTO; // bordo dell'auto più lontano (esce per primo)
  const bordoCordolo = semiLarghezzaPista + LARGHEZZA_CORDOLO;

  if (bordoLontano <= semiLarghezzaPista) {
    return { zona: 'pista', fattoreVelocita: 1 };
  }
  if (bordoVicino <= semiLarghezzaPista) {
    return { zona: 'cordolo-una-ruota', fattoreVelocita: 0.9 };
  }
  if (bordoVicino <= bordoCordolo) {
    return { zona: 'cordolo-due-ruote', fattoreVelocita: 0.75 };
  }
  return { zona: 'erba', fattoreVelocita: 0.2 };
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

  const { zona, fattoreVelocita } = statoPosizioneLaterale(x, semiLarghezzaPista);
  const velocitaMassimaCorrente = VELOCITA_MASSIMA_BASE * fattoreVelocita;
  velocita = Math.min(velocita, velocitaMassimaCorrente);
  velocita = Math.max(velocita, 0); // ridondante con i Math.max sopra, ma esplicito: mai negativa

  // Lo sterzo è proporzionale alla velocità attuale: da fermi girare il
  // volante non sposta la macchina.
  const frazioneVelocita = velocita / VELOCITA_MASSIMA_BASE;
  if (input.sterzaSinistra) x -= VELOCITA_STERZO_LATERALE * dt * frazioneVelocita;
  if (input.sterzaDestra) x += VELOCITA_STERZO_LATERALE * dt * frazioneVelocita;

  // Effetto centrifugo: la curva del tracciato tira l'auto verso
  // l'esterno, più forte quanto più si va veloci.
  x += curvaturaSegmentoCorrente * frazioneVelocita * dt * EFFETTO_CENTRIFUGO;

  x = limitaXAiMuri(x, semiLarghezzaPista);

  return {
    distanza: distanza + velocita * dt,
    x,
    velocita,
    zona,
  };
}
