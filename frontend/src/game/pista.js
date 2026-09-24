/**
 * pista.js — geometria della pista generica di gioco ("Monoposto Virtual
 * Arena") e le funzioni pure per usarla: distanza dal centro pista (per
 * l'effetto erba fuori pista) e cattura dei checkpoint.
 *
 * NESSUNA sagoma di circuito reale qui dentro, né altrove nel progetto:
 * per decisione esplicita (CircuitArt/policy anti-invenzione di questo
 * progetto — non esiste una geometria reale nel DB, e non ne inventiamo
 * una noi). La pista è un rettangolo dagli angoli arrotondati (4 curve
 * standard), sempre la stessa; un circuito reale selezionato dall'utente
 * influenza SOLO `fattoreRettilineo` (i due rettilinei orizzontali si
 * allungano un po' per circuiti "lunghi" nella realtà) — mai la forma.
 *
 * Tutte le funzioni qui sono pure (nessun accesso a canvas/DOM/Date.now),
 * apposta per poterle testare con Node senza un vero browser.
 */

export const LARGHEZZA_PISTA = 90; // larghezza drivabile (pavimentata) totale (px)
// Oltre il bordo pista, si può uscire fino a questa frazione della
// larghezza pista SENZA alcuna conseguenza (né rallentamento né
// penalità) — un cordolo/margine tollerato, non ancora erba vera.
export const TOLLERANZA_FUORI_PISTA_FRAZIONE = 0.5;
// Sull'erba vera (oltre la tolleranza) la velocità massima diventa
// questa frazione di quella normale: -80%.
export const RIDUZIONE_VELOCITA_ERBA = 0.2;
export const RAGGIO_CATTURA_CHECKPOINT = 55; // px

const SEMIASSE_X_BASE = 380;
const SEMIASSE_Y_BASE = 230;
const RAGGIO_CURVA = 85;
const PASSO_CAMPIONAMENTO_PX = 8; // un punto di centerline ogni ~8px di pista percorsa

const LUNGHEZZA_KM_RIFERIMENTO_MIN = 3; // ~Monaco
const LUNGHEZZA_KM_RIFERIMENTO_MAX = 7; // ~Spa
const FATTORE_RETTILINEO_MIN = 1;
const FATTORE_RETTILINEO_MAX = 1.8;

function puntoArco(cx, cy, raggio, angoloRad) {
  return { x: cx + raggio * Math.cos(angoloRad), y: cy + raggio * Math.sin(angoloRad) };
}

function campionaSegmentoRetto(da, a, passoPx) {
  const dx = a.x - da.x;
  const dy = a.y - da.y;
  const lunghezza = Math.sqrt(dx * dx + dy * dy);
  const numPunti = Math.max(1, Math.round(lunghezza / passoPx));
  const punti = [];
  for (let i = 0; i < numPunti; i++) {
    const t = i / numPunti;
    punti.push({ x: da.x + dx * t, y: da.y + dy * t });
  }
  return punti;
}

function campionaArco(cx, cy, raggio, angoloIniziale, angoloFinale, passoPx) {
  const lunghezza = raggio * Math.abs(angoloFinale - angoloIniziale);
  const numPunti = Math.max(1, Math.round(lunghezza / passoPx));
  const punti = [];
  for (let i = 0; i < numPunti; i++) {
    const t = i / numPunti;
    const angolo = angoloIniziale + (angoloFinale - angoloIniziale) * t;
    punti.push(puntoArco(cx, cy, raggio, angolo));
  }
  return punti;
}

/**
 * Converte lunghezza_km di un circuito reale (dal DB) in un fattore >=1
 * che allunga i rettilinei della pista generica. Range di riferimento
 * (3-7km) scelto sui valori reali tipici dei circuiti F1 attuali — non è
 * una formula scientifica, solo un modo per dare un "sapore" diverso a
 * ogni circuito senza mapparne la vera geometria. lunghezza_km assente o
 * non positiva -> fattore neutro (1).
 */
export function calcolaFattoreRettilineo(lunghezzaKm) {
  if (!lunghezzaKm || lunghezzaKm <= 0) return FATTORE_RETTILINEO_MIN;
  const clampato = Math.min(LUNGHEZZA_KM_RIFERIMENTO_MAX, Math.max(LUNGHEZZA_KM_RIFERIMENTO_MIN, lunghezzaKm));
  const frazione = (clampato - LUNGHEZZA_KM_RIFERIMENTO_MIN) / (LUNGHEZZA_KM_RIFERIMENTO_MAX - LUNGHEZZA_KM_RIFERIMENTO_MIN);
  return FATTORE_RETTILINEO_MIN + frazione * (FATTORE_RETTILINEO_MAX - FATTORE_RETTILINEO_MIN);
}

/**
 * Genera la centerline della pista: un giro completo in senso orario a
 * partire dal centro del rettilineo superiore (che è anche s=0, la linea
 * del traguardo). Il primo punto dell'array è esattamente il punto di
 * partenza/traguardo.
 */
export function generaCenterline(fattoreRettilineo = 1) {
  const semiX = SEMIASSE_X_BASE * Math.max(1, fattoreRettilineo);
  const semiY = SEMIASSE_Y_BASE;
  const r = RAGGIO_CURVA;
  const p = PASSO_CAMPIONAMENTO_PX;

  const puntiTopDestra = campionaSegmentoRetto({ x: 0, y: -semiY }, { x: semiX - r, y: -semiY }, p);
  const arcoTopDestra = campionaArco(semiX - r, -(semiY - r), r, -Math.PI / 2, 0, p);
  const latoDestro = campionaSegmentoRetto({ x: semiX, y: -(semiY - r) }, { x: semiX, y: semiY - r }, p);
  const arcoBassoDestra = campionaArco(semiX - r, semiY - r, r, 0, Math.PI / 2, p);
  const latoInferiore = campionaSegmentoRetto({ x: semiX - r, y: semiY }, { x: -(semiX - r), y: semiY }, p);
  const arcoBassoSinistra = campionaArco(-(semiX - r), semiY - r, r, Math.PI / 2, Math.PI, p);
  const latoSinistro = campionaSegmentoRetto({ x: -semiX, y: semiY - r }, { x: -semiX, y: -(semiY - r) }, p);
  const arcoTopSinistra = campionaArco(-(semiX - r), -(semiY - r), r, Math.PI, 1.5 * Math.PI, p);
  const puntiTopSinistra = campionaSegmentoRetto({ x: -(semiX - r), y: -semiY }, { x: 0, y: -semiY }, p);

  return [
    ...puntiTopDestra,
    ...arcoTopDestra,
    ...latoDestro,
    ...arcoBassoDestra,
    ...latoInferiore,
    ...arcoBassoSinistra,
    ...latoSinistro,
    ...arcoTopSinistra,
    ...puntiTopSinistra,
  ];
}

/** Punto sulla centerline più vicino a (x,y): distanza (px), il suo
 * indice nell'array, e la frazione di giro (0-1) a cui corrisponde —
 * quest'ultima usata solo per debug/HUD, non per la logica di gioco. */
export function distanzaDalCentro(x, y, centerline) {
  let minDist = Infinity;
  let indiceVicino = 0;
  for (let i = 0; i < centerline.length; i++) {
    const dx = x - centerline[i].x;
    const dy = y - centerline[i].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) {
      minDist = d;
      indiceVicino = i;
    }
  }
  return { distanza: minDist, indiceVicino, frazionePista: indiceVicino / centerline.length };
}

/**
 * true se (x,y) è sull'erba vera e propria — oltre il bordo pista E
 * oltre la zona di tolleranza (TOLLERANZA_FUORI_PISTA_FRAZIONE): fino a
 * quel punto si è ancora considerati "in pista" a tutti gli effetti
 * (velocità piena, nessuna penalità), è un margine tollerato apposta.
 */
export function eSullErba(distanzaDalCentroPista) {
  const bordoConTolleranza = (LARGHEZZA_PISTA / 2) * (1 + TOLLERANZA_FUORI_PISTA_FRAZIONE);
  return distanzaDalCentroPista > bordoConTolleranza;
}

/**
 * I 4 checkpoint del giro, nell'ordine in cui vanno catturati: indice
 * 0/1/2 a 25%/50%/75% del giro, indice 3 = linea del traguardo (coincide
 * col punto di partenza, frazione 0). Stesso schema di
 * backend/api/game.py (CHECKPOINT_PER_GIRO=4) — se cambia qui va
 * cambiato anche lì.
 */
export function generaCheckpoint(centerline) {
  const frazioni = [0.25, 0.5, 0.75, 1];
  return frazioni.map((f) => {
    const indice = Math.floor((f % 1) * centerline.length) % centerline.length;
    return centerline[indice];
  });
}
