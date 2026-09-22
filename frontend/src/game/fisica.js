/**
 * fisica.js — fisica 2D top-down della monoposto e cattura dei checkpoint.
 * Pura come pista.js: `avanzaFisica` prende lo stato corrente e restituisce
 * il nuovo stato, nessun accesso a canvas/DOM/tempo di sistema al suo
 * interno (il chiamante passa `dt`, i secondi trascorsi dall'ultimo
 * frame) — così è testabile in isolamento con Node.
 */

export const ACCELERAZIONE = 260; // px/s^2
export const FRENO = 420; // px/s^2 (decelerazione attiva, tasto freno)
export const ATTRITO = 140; // px/s^2 (decelerazione passiva, nessun input)
export const VELOCITA_MASSIMA_BASE = 320; // px/s, in pista
export const VELOCITA_MASSIMA_RETROMARCIA = 120; // px/s
export const VELOCITA_STERZO = 2.6; // rad/s alla velocità piena
export const SOGLIA_VELOCITA_STERZO = 12; // px/s, sotto questa lo sterzo non ha effetto (macchina ferma)

/** Stato iniziale della monoposto: ferma, alla linea di partenza,
 * orientata lungo il rettilineo (verso destra, angolo 0). */
export function statoIniziale(puntoPartenza) {
  return { x: puntoPartenza.x, y: puntoPartenza.y, angolo: 0, velocita: 0 };
}

/**
 * Avanza la simulazione di un frame. `input` = { accelera, frena,
 * sterzaSinistra, sterzaDestra } (booleani). `velocitaMassimaCorrente` è
 * decisa dal chiamante in base a dentro/fuori pista (vedi
 * pista.eFuoriPista + RIDUZIONE_VELOCITA_FUORI_PISTA).
 */
export function avanzaFisica(stato, input, dt, velocitaMassimaCorrente) {
  let { velocita } = stato;
  const { x, y, angolo: angoloAttuale } = stato;
  let angolo = angoloAttuale;

  if (input.accelera) {
    velocita += ACCELERAZIONE * dt;
  } else if (input.frena) {
    velocita -= FRENO * dt;
  } else if (velocita > 0) {
    velocita = Math.max(0, velocita - ATTRITO * dt);
  } else if (velocita < 0) {
    velocita = Math.min(0, velocita + ATTRITO * dt);
  }

  velocita = Math.min(velocita, velocitaMassimaCorrente);
  velocita = Math.max(velocita, -VELOCITA_MASSIMA_RETROMARCIA);

  if (Math.abs(velocita) > SOGLIA_VELOCITA_STERZO) {
    // In retromarcia lo sterzo si inverte, come in un'auto vera.
    const direzioneSterzo = velocita >= 0 ? 1 : -1;
    if (input.sterzaSinistra) angolo -= VELOCITA_STERZO * dt * direzioneSterzo;
    if (input.sterzaDestra) angolo += VELOCITA_STERZO * dt * direzioneSterzo;
  }

  const nuovaX = x + Math.cos(angolo) * velocita * dt;
  const nuovaY = y + Math.sin(angolo) * velocita * dt;

  return { x: nuovaX, y: nuovaY, angolo, velocita };
}

/**
 * Controlla se la posizione attuale ha catturato il prossimo checkpoint
 * atteso (in sequenza: catturare un checkpoint fuori ordine non conta,
 * stessa regola applicata lato server — vedi backend/api/game.py). Torna
 * il nuovo indice atteso (invariato se non è stato catturato nulla).
 */
export function controllaCatturaCheckpoint(posizioneAuto, checkpoint, indiceAtteso, raggioCattura) {
  const cp = checkpoint[indiceAtteso];
  if (!cp) return indiceAtteso;
  const dx = posizioneAuto.x - cp.x;
  const dy = posizioneAuto.y - cp.y;
  const distanza = Math.sqrt(dx * dx + dy * dy);
  if (distanza <= raggioCattura) {
    return (indiceAtteso + 1) % checkpoint.length;
  }
  return indiceAtteso;
}
