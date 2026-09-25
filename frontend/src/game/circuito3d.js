/**
 * circuito3d.js — geometria e proiezione prospettica del motore
 * pseudo-3D (stile Pole Position/OutRun: pista come sequenza di
 * segmenti con curvatura e altezza, non più punti (x,y) come nel
 * vecchio motore top-down). Pura come lo era pista.js: nessun accesso
 * a canvas/DOM, testabile in isolamento con Node.
 *
 * "Brianza Speed Ring" — liberamente ispirato a Monza (deciso insieme
 * all'utente dopo aver segnalato il conflitto con la policy del
 * progetto contro le geometrie reali): sequenza di curve, ordine e
 * lunghezze DIVERSI dal circuito vero, dislivelli che Monza reale non
 * ha (è pianeggiante — qui ce ne sono apposta, a marcare che non è una
 * ricostruzione fedele), nessun nome di curva reale riutilizzato. Può
 * ricordarlo vagamente (rettilineo lungo, curve veloci), non è una
 * copia.
 */

export const LUNGHEZZA_SEGMENTO = 7; // metri per segmento — deliberatamente NON tarato per avvicinarsi ai 5,79 km reali di Monza
export const LARGHEZZA_PISTA = 12; // metri, larghezza TOTALE della pista (non per lato)
export const CHECKPOINT_PER_GIRO = 4; // stesso schema del vecchio motore (3 intermedi + traguardo) e del backend

function facilitaEntrataUscita(t) {
  // Cubica ease-in/out: transizione morbida tra un tratto e il
  // successivo invece che di scatto o lineare.
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Aggiunge un tratto di `lunghezza` segmenti che porta curva/altezza
 * dal valore corrente (l'ultimo segmento già presente, o 0 se il
 * circuito è vuoto) fino ai target indicati, con transizione smussata.
 * Muta l'array passato (comodo per comporre un circuito con una
 * sequenza di chiamate, vedi costruisciBrianzaSpeedRing).
 */
export function aggiungiTratto(segmenti, { lunghezza, curva = 0, altezza = 0 }) {
  const curvaIniziale = segmenti.length > 0 ? segmenti[segmenti.length - 1].curva : 0;
  const altezzaIniziale = segmenti.length > 0 ? segmenti[segmenti.length - 1].altezza : 0;
  for (let i = 0; i < lunghezza; i++) {
    const progresso = facilitaEntrataUscita((i + 1) / lunghezza);
    segmenti.push({
      indice: segmenti.length,
      curva: curvaIniziale + (curva - curvaIniziale) * progresso,
      altezza: altezzaIniziale + (altezza - altezzaIniziale) * progresso,
    });
  }
  return segmenti;
}

/**
 * Il Brianza Speed Ring: composto da tratti (non punti scritti a mano),
 * un rettilineo principale lungo, una sequenza di curve in ordine e
 * proporzioni proprie, due colline (Monza reale è piatta) e un punto
 * dove il dislivello crea l'effetto cavalcavia richiesto — l'ultimo
 * tratto riporta curva/altezza esattamente a 0 per richiudere il giro
 * senza scatti.
 */
export function costruisciBrianzaSpeedRing() {
  const segmenti = [];
  aggiungiTratto(segmenti, { lunghezza: 65, curva: 0, altezza: 0 }); // rettilineo di partenza/traguardo
  aggiungiTratto(segmenti, { lunghezza: 45, curva: -3.2, altezza: 0 }); // ampia curva a sinistra
  aggiungiTratto(segmenti, { lunghezza: 18, curva: -3.2, altezza: 0 }); // tenuta curva
  aggiungiTratto(segmenti, { lunghezza: 25, curva: 0, altezza: 5 }); // breve rettilineo, si inizia a salire
  aggiungiTratto(segmenti, { lunghezza: 35, curva: 3.6, altezza: 9 }); // curva a destra in salita (crea l'effetto cavalcavia sul rettilineo sottostante)
  aggiungiTratto(segmenti, { lunghezza: 20, curva: 3.6, altezza: 9 }); // tenuta curva, punto più alto
  aggiungiTratto(segmenti, { lunghezza: 30, curva: 0, altezza: 0 }); // discesa verso il rettilineo successivo
  aggiungiTratto(segmenti, { lunghezza: 70, curva: 0, altezza: 0 }); // secondo lungo rettilineo
  aggiungiTratto(segmenti, { lunghezza: 15, curva: -5, altezza: 0 }); // staccata forte, chicane sinistra...
  aggiungiTratto(segmenti, { lunghezza: 12, curva: 5, altezza: 0 }); // ...destra: chicane a doppio cambio di direzione
  aggiungiTratto(segmenti, { lunghezza: 40, curva: 2.4, altezza: -4 }); // curva a destra ampia, leggera discesa
  aggiungiTratto(segmenti, { lunghezza: 22, curva: 2.4, altezza: -4 }); // tenuta curva
  aggiungiTratto(segmenti, { lunghezza: 28, curva: 0, altezza: 0 }); // raccordo, torna in piano
  aggiungiTratto(segmenti, { lunghezza: 32, curva: -2.8, altezza: 0 }); // curva veloce a sinistra
  aggiungiTratto(segmenti, { lunghezza: 55, curva: 0, altezza: 0 }); // rettilineo di raccordo verso l'ultima curva
  aggiungiTratto(segmenti, { lunghezza: 38, curva: 4.2, altezza: 0 }); // ultima curva, a destra, verso il traguardo
  aggiungiTratto(segmenti, { lunghezza: 25, curva: 0, altezza: 0 }); // rientro morbido a 0 prima di richiudere il giro
  return segmenti;
}

/**
 * Il giro, per come è composto (curva a sinistra/destra scelte a mano
 * tratto per tratto), non torna esattamente al punto di partenza in
 * termini di posizione assoluta nel mondo — la CURVATURA si richiude a
 * 0 (verificato altrove), ma la posizione accumulata no, e senza
 * correzione il rendering mostrerebbe un salto laterale netto proprio
 * al traguardo. Questa funzione distribuisce una piccola compensazione
 * su tutti i segmenti già curvi, proporzionale a quanto sono curvi
 * (i rettilinei, curva=0, restano esattamente dritti) — così la somma
 * di tutte le curvature torna a 0 e il giro si chiude anche in
 * posizione, non solo in direzione.
 */
function chiudiIlGiroInPosizione(segmenti) {
  const sommaCurvaTotale = segmenti.reduce((tot, s) => tot + s.curva, 0);
  const sommaCurvaAssoluta = segmenti.reduce((tot, s) => tot + Math.abs(s.curva), 0);
  if (sommaCurvaAssoluta === 0) return segmenti; // pista tutta dritta, niente da chiudere
  for (const segmento of segmenti) {
    const correzione = (sommaCurvaTotale * Math.abs(segmento.curva)) / sommaCurvaAssoluta;
    segmento.curva -= correzione;
  }
  return segmenti;
}

export const BRIANZA_SPEED_RING = chiudiIlGiroInPosizione(costruisciBrianzaSpeedRing());
export const NUMERO_SEGMENTI_TOTALE = BRIANZA_SPEED_RING.length;
export const LUNGHEZZA_CIRCUITO = NUMERO_SEGMENTI_TOTALE * LUNGHEZZA_SEGMENTO;

// Posizione assoluta nel mondo di ogni segmento (accumulo della
// curvatura segmento dopo segmento): il rendering proietta questa,
// non la curvatura grezza — permette di disegnare la pista che si
// piega visivamente, non solo di sapere "quanto" piega lì.
(function precalcolaPosizioniMondo() {
  let mondoX = 0;
  for (const segmento of BRIANZA_SPEED_RING) {
    mondoX += segmento.curva;
    segmento.mondoX = mondoX;
    segmento.mondoY = segmento.altezza;
    segmento.mondoZ = segmento.indice * LUNGHEZZA_SEGMENTO;
  }
})();

const SOGLIA_CURVA_SIGNIFICATIVA = 0.8; // sotto questo valore assoluto di curva, il tratto è considerato "dritto" ai fini dei cartelli

/**
 * Individua, per ogni curva significativa del circuito, i 3 cartelli
 * di velocità consigliata da mostrare a bordo pista avvicinandosi
 * (come i cartelli reali "200/100/50", qui usati per la velocità
 * consigliata invece che per la distanza di frenata — richiesta
 * esplicita dell'utente). Calcolato una sola volta alla costruzione
 * del circuito, non ad ogni fotogramma.
 */
function calcolaCartelliCurva(segmenti) {
  const cartelli = [];
  let i = 0;
  while (i < segmenti.length) {
    if (Math.abs(segmenti[i].curva) < SOGLIA_CURVA_SIGNIFICATIVA) {
      i++;
      continue;
    }
    // Trovato l'inizio di una curva significativa: scandisco in avanti
    // per trovarne il picco di curvatura (la severità) e dove finisce.
    const indiceInizio = i;
    let picco = 0;
    let j = i;
    while (j < segmenti.length && Math.abs(segmenti[j].curva) >= SOGLIA_CURVA_SIGNIFICATIVA) {
      picco = Math.max(picco, Math.abs(segmenti[j].curva));
      j++;
    }
    const direzione = segmenti[indiceInizio].curva > 0 ? 1 : -1; // 1 = destra, -1 = sinistra
    // Più la curva è severa (picco alto), più bassa la velocità
    // consigliata all'apice — intervallo scelto sui picchi reali di
    // questo circuito (~2.4 a ~5), arrotondata alla decina.
    const velocitaApice = Math.round(Math.max(50, Math.min(200, 230 - picco * 34)) / 10) * 10;
    // Tre cartelli scalando all'indietro dall'inizio curva, ai metri
    // indicati, con velocità che scende verso quella dell'apice.
    for (const [metriPrima, deltaVelocita] of [
      [150, 60],
      [90, 30],
      [40, 0],
    ]) {
      const indiceCartello = indiceInizio - Math.round(metriPrima / LUNGHEZZA_SEGMENTO);
      if (indiceCartello < 0) continue; // troppo vicino all'inizio pista, salto (raro, solo per la primissima curva)
      cartelli.push({
        indiceSegmento: ((indiceCartello % segmenti.length) + segmenti.length) % segmenti.length,
        velocita: Math.min(200, velocitaApice + deltaVelocita),
        direzione,
      });
    }
    i = j; // riprendo la scansione dopo la curva appena trovata
  }
  return cartelli;
}

// Mappa indiceSegmento -> cartello, per una ricerca O(1) in fase di
// disegno (calcolata una sola volta, non ad ogni fotogramma).
export const CARTELLI_CURVA = new Map(calcolaCartelliCurva(BRIANZA_SPEED_RING).map((c) => [c.indiceSegmento, c]));

/** Il segmento all'indice dato, con wraparound (il circuito è un
 * anello: oltre l'ultimo segmento si ricomincia dal primo). */
export function segmentoA(indice) {
  const i = ((indice % NUMERO_SEGMENTI_TOTALE) + NUMERO_SEGMENTI_TOTALE) % NUMERO_SEGMENTI_TOTALE;
  return BRIANZA_SPEED_RING[i];
}

/**
 * Indici dei 4 checkpoint del giro (3 intermedi a 25/50/75% + il
 * traguardo a 0%, cioè l'indice 0) — stesso schema CHECKPOINT_PER_GIRO
 * del vecchio motore e del backend (game.py), qui espresso come indici
 * di segmento invece che come punti (x,y).
 */
export function indiciCheckpoint() {
  const frazioni = [0.25, 0.5, 0.75, 1];
  return frazioni.map((f) => Math.floor((f % 1) * NUMERO_SEGMENTI_TOTALE) % NUMERO_SEGMENTI_TOTALE);
}

/**
 * Forma del circuito vista dall'alto, per la minimappa — non è la
 * stessa proiezione usata per il rendering in pista (quella è
 * pseudo-3D: "curva" vi rappresenta una deriva laterale per il
 * disegno, non un vero angolo di svolta dall'alto). Presa alla
 * lettera come angolo vero, la sequenza di curvature di questo
 * tracciato produce una forma che si autointerseca (verificato con
 * più fattori di scala: non è un problema di taratura ma di
 * sequenza — l'angolo cumulativo oscilla avanti e indietro invece di
 * girare in un verso solo). Una forma dall'alto semplice e chiusa
 * richiede che l'angolo cumulativo percorra esattamente un giro
 * completo (360°) in un verso coerente: qui gli angoli di svolta sono
 * scelti apposta per la minimappa (non derivati dalla curvatura),
 * proporzionali alla lunghezza reale di ciascuna curva così che il
 * "peso" visivo di ognuna resti coerente con quanto dura in pista.
 * Le LUNGHEZZE dei tratti restano invece identiche a
 * costruisciBrianzaSpeedRing, cruciale perché un indice di segmento
 * indichi lo stesso punto del giro in entrambe le rappresentazioni
 * (checkpoint, posizione auto). Normalizzata in un quadrato 0..1 (il
 * lato più lungo tocca 0 e 1), un punto per segmento.
 */
function calcolaFormaMinimappa(segmenti) {
  // Stessa somma delle coppie di tratti curvi in
  // costruisciBrianzaSpeedRing: [45+18, 35+20, 15+12, 40+22, 32, 38].
  const LUNGHEZZE_CURVE = [63, 55, 27, 62, 32, 38];
  const sommaLunghezzeCurve = LUNGHEZZE_CURVE.reduce((a, b) => a + b, 0);
  const angoliCurve = LUNGHEZZE_CURVE.map((l) => (360 * l) / sommaLunghezzeCurve);

  const tratti = [
    { lunghezza: 65, angolo: 0 }, // rettilineo partenza/traguardo
    { lunghezza: LUNGHEZZE_CURVE[0], angolo: angoliCurve[0] },
    { lunghezza: 25, angolo: 0 },
    { lunghezza: LUNGHEZZE_CURVE[1], angolo: angoliCurve[1] },
    { lunghezza: 30, angolo: 0 },
    { lunghezza: 70, angolo: 0 }, // secondo rettilineo
    { lunghezza: LUNGHEZZE_CURVE[2], angolo: angoliCurve[2] }, // chicane, trattata come un'unica curva qui
    { lunghezza: LUNGHEZZE_CURVE[3], angolo: angoliCurve[3] },
    { lunghezza: 28, angolo: 0 },
    { lunghezza: LUNGHEZZE_CURVE[4], angolo: angoliCurve[4] },
    { lunghezza: 55, angolo: 0 },
    { lunghezza: LUNGHEZZE_CURVE[5], angolo: angoliCurve[5] }, // ultima curva
    { lunghezza: 25, angolo: 0 }, // rientro
  ];

  let angolo = 0;
  let x = 0;
  let y = 0;
  const punti = [{ x, y }];
  for (const tratto of tratti) {
    const angoloRadTotale = (tratto.angolo * Math.PI) / 180;
    for (let i = 0; i < tratto.lunghezza; i++) {
      angolo += angoloRadTotale / tratto.lunghezza;
      x += Math.cos(angolo);
      y += Math.sin(angolo);
      punti.push({ x, y });
    }
  }
  punti.pop(); // l'ultimo torna a coincidere (quasi esattamente: un giro pieno) col primo — un punto per segmento, non uno in più

  const puntoIniziale = punti[0];
  const puntoFinale = punti[punti.length - 1];
  // Piccola correzione residua (l'angolo torna esatto a 360°, ma un
  // minimo scarto di posizione resta per via degli arrotondamenti):
  // stessa tecnica di chiudiIlGiroInPosizione, distribuita lungo tutto
  // il giro invece che un salto netto al traguardo.
  const deltaX = puntoFinale.x - puntoIniziale.x;
  const deltaY = puntoFinale.y - puntoIniziale.y;
  const puntiChiusi = [];
  for (let i = 0; i < segmenti.length; i++) {
    const t = i / segmenti.length;
    puntiChiusi.push({ x: punti[i].x - deltaX * t, y: punti[i].y - deltaY * t });
  }
  const xs = puntiChiusi.map((p) => p.x);
  const ys = puntiChiusi.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scala = Math.max(maxX - minX, maxY - minY) || 1;
  return puntiChiusi.map((p) => ({ x: (p.x - minX) / scala, y: (p.y - minY) / scala }));
}

export const FORMA_MINIMAPPA = calcolaFormaMinimappa(BRIANZA_SPEED_RING);

/**
 * Il segmento ASSOLUTO (mai wrapped, cresce a ogni giro) a cui si trova
 * il checkpoint `indiceCheckpoint` (0-2 = intermedi, 3 = traguardo) del
 * giro `numeroGiro` (1-based). Il traguardo è un caso a parte: non è
 * "segmento 0 del giro corrente" (sarebbe l'INIZIO, non la fine) ma
 * "numeroGiro interi giri di segmenti" — la vera fine di quel giro.
 */
export function segmentoAssolutoCheckpoint(numeroGiro, indiceCheckpoint) {
  if (indiceCheckpoint === 3) {
    return numeroGiro * NUMERO_SEGMENTI_TOTALE;
  }
  const frazioniIntermedie = [0.25, 0.5, 0.75];
  const base = (numeroGiro - 1) * NUMERO_SEGMENTI_TOTALE;
  return base + Math.floor(frazioniIntermedie[indiceCheckpoint] * NUMERO_SEGMENTI_TOTALE);
}

/**
 * Cattura del checkpoint nel modello a distanza percorsa: a differenza
 * del vecchio motore 2D (cattura per vicinanza a un punto), qui basta
 * che il segmento assoluto attuale abbia raggiunto o superato il
 * target — la distanza percorsa è sempre crescente in marcia avanti,
 * quindi "raggiunto" è un semplice confronto, non serve una soglia di
 * raggio. Ritorna il nuovo indice atteso (invariato se non ancora
 * raggiunto).
 */
export function controllaCatturaCheckpointSegmento(segmentoAssolutoAttuale, numeroGiroCorrente, indiceAtteso) {
  const target = segmentoAssolutoCheckpoint(numeroGiroCorrente, indiceAtteso);
  if (segmentoAssolutoAttuale >= target) {
    return (indiceAtteso + 1) % CHECKPOINT_PER_GIRO;
  }
  return indiceAtteso;
}

/**
 * I prossimi `numeroSegmenti` segmenti visibili dalla telecamera, in
 * coordinate RELATIVE ad essa (pronte per proietta()) — non assolute
 * nel mondo. `camera` è { distanza, mondoX, mondoY } in metri: mondoX
 * è la posizione laterale assoluta della telecamera nel mondo (quella
 * del segmento su cui si trova l'auto + il suo scarto laterale x),
 * mondoY analogo per l'altezza (più l'altezza occhi, decisa dal
 * chiamante). Gestisce da sola il giro successivo (wraparound): un
 * segmento del "prossimo giro" ha la stessa mondoZ precalcolata di
 * quello equivalente del giro corrente (il tracciato è ciclico), va
 * spostata avanti di un giro intero di lunghezza per non sovrapporsi
 * visivamente al segmento "gemello" del giro presente.
 */
export function calcolaSegmentiVisibili(camera, numeroSegmenti) {
  const indiceBase = Math.floor(camera.distanza / LUNGHEZZA_SEGMENTO);
  const risultato = [];
  for (let i = 0; i < numeroSegmenti; i++) {
    const indiceAssoluto = indiceBase + i;
    const segmento = segmentoA(indiceAssoluto);
    const giriAvanti = Math.floor(indiceAssoluto / NUMERO_SEGMENTI_TOTALE);
    const mondoZAssoluto = segmento.mondoZ + giriAvanti * LUNGHEZZA_CIRCUITO;

    risultato.push({
      indiceSegmento: segmento.indice,
      curva: segmento.curva,
      x: segmento.mondoX - camera.mondoX,
      y: segmento.mondoY - camera.mondoY,
      z: mondoZAssoluto - camera.distanza,
    });
  }
  return risultato;
}

/**
 * Ruota un punto (y, z, camera-relativo) di `angoloRadianti` attorno
 * alla telecamera — l'inclinazione (pitch) della visuale. x non
 * cambia (l'inclinazione è solo verticale). Positivo = la telecamera
 * guarda più verso l'orizzonte, mostrando più pista in lontananza —
 * verificato col segno giusto tramite screenshot, non solo a calcolo.
 */
export function inclinaPunto(punto, angoloRadianti) {
  if (!angoloRadianti) return punto;
  const cosA = Math.cos(angoloRadianti);
  const sinA = Math.sin(angoloRadianti);
  return {
    x: punto.x,
    y: punto.y * cosA - punto.z * sinA,
    z: punto.y * sinA + punto.z * cosA,
  };
}

/**
 * Proietta un punto del mondo 3D (x laterale, y altezza, z profondità
 * — tutti relativi alla camera) sullo schermo. Formula prospettica
 * standard (pseudo-3D "Pole Position style"): più lontano (z grande),
 * più la scala si riduce. Ritorna null se il punto è dietro la camera
 * (z <= 0, non proiettabile). `inclinazioneRadianti` (opzionale, 0 di
 * default) applica un'inclinazione verticale della visuale prima di
 * proiettare — vedi inclinaPunto().
 */
export function proietta(punto, profonditaCamera, larghezzaSchermo, altezzaSchermo, inclinazioneRadianti = 0) {
  const p = inclinazioneRadianti ? inclinaPunto(punto, inclinazioneRadianti) : punto;
  if (p.z <= 0) return null;
  const scala = profonditaCamera / p.z;
  return {
    x: larghezzaSchermo / 2 + (scala * p.x * larghezzaSchermo) / 2,
    y: altezzaSchermo / 2 - (scala * p.y * altezzaSchermo) / 2,
    scala,
    larghezzaProiettata: scala * LARGHEZZA_PISTA * larghezzaSchermo,
  };
}
