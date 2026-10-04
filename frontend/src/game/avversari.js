/**
 * avversari.js — le altre auto in pista. Puro (niente DOM/canvas/tempo di
 * sistema): testabile in Node, come fisica3d.js e circuito3d.js.
 *
 * QUALIFICA: 10 bot sparsi a caso sul circuito, ognuno con una "bravura"
 * (frazione della velocità ideale) e una traiettoria preferita.
 * GARA: griglia da 20. Gli avversari "veri" ripercorrono le gare
 * registrate da altri utenti (tempi ai checkpoint: 3 intermedi + traguardo
 * per giro); i posti mancanti sono bot.
 *
 * Tra un checkpoint e l'altro il tempo non è distribuito a velocità
 * costante (darebbe auto a 200 km/h in tornante) ma seguendo il PROFILO
 * DI VELOCITÀ IDEALE del circuito: lente in curva, veloci in rettilineo.
 *
 * REGOLE DI CONTATTO (decise con il gestore, 4/10/2026):
 * - le auto non si compenetrano;
 * - se il giocatore tampona un'auto da dietro perde velocità in proporzione
 *   alla botta (differenza di velocità): nulla sotto 10 km/h, al massimo 60%;
 * - bot e avversari non tamponano MAI il giocatore: rallentano o lo girano attorno;
 * - scia: entro 50 m dietro un'auto si guadagnano fino a 10 km/h (fisica3d.js).
 */
import {
  LARGHEZZA_PISTA,
  LUNGHEZZA_CIRCUITO,
  LUNGHEZZA_SEGMENTO,
  NUMERO_SEGMENTI_TOTALE,
  segmentoAssolutoCheckpoint,
  segmentoA,
} from './circuito3d.js';
import {
  accelerazioneMassima,
  frenataMassima,
  LARGHEZZA_AUTO,
  SCIA_DISTANZA,
  velocitaAderenza,
  VELOCITA_MASSIMA_BASE,
} from './fisica3d.js';

export const LUNGHEZZA_AUTO = 5.5; // metri (contatti e distanze di sicurezza)
const SEMI_PISTA = LARGHEZZA_PISTA / 2;
const X_MAX_IN_PISTA = SEMI_PISTA - LARGHEZZA_AUTO / 2; // auto interamente sull'asfalto
const DISTANZA_GRIGLIA = 8; // metri tra una fila e l'altra
const X_GRIGLIA = 2.4;
// Tamponamento (deciso col gestore, 4/10/2026): la perdita dipende dalla
// DIFFERENZA di velocità con l'auto colpita. Sotto 10 km/h nessuna perdita
// (si sfiora soltanto); poi cresce in proporzione fino al 60% massimo,
// raggiunto con 150 km/h di differenza. In ogni caso non si "attraversa"
// l'auto davanti: dopo il contatto non si va più veloci di lei.
const SOGLIA_TAMPONAMENTO = 10 / 3.6;
const DIFFERENZA_PERDITA_MASSIMA = 150 / 3.6;
const PERDITA_MASSIMA = 0.6;
export function perditaTamponamento(differenza) {
  if (differenza < SOGLIA_TAMPONAMENTO) return 0;
  const f = (differenza - SOGLIA_TAMPONAMENTO) / (DIFFERENZA_PERDITA_MASSIMA - SOGLIA_TAMPONAMENTO);
  return PERDITA_MASSIMA * Math.min(1, f);
}
const SCIA_LARGHEZZA = 2.5; // metri di disallineamento laterale ancora "in scia"

// Nomi inventati per i bot (nessun pilota reale) e livree dei bot.
const NOMI_BOT = ['Ferraresi', 'Lindqvist', 'Okafor', 'Moreau', 'Tanaka', 'Valdés', 'Kowalczyk', 'Brandt', 'Novak', 'Ruiz', 'Haddad', 'Sørlie', 'Castelli', 'Ivanova', 'Mbeki', 'Duarte', 'Keller', 'Sato', 'Lefèvre'];
export const LIVREE_AVVERSARI = [
  { base: '#1565c0', luce: '#64b5f6', ombra: '#0d2f66', accento: '#ffffff' },
  { base: '#2e7d32', luce: '#81c784', ombra: '#123d16', accento: '#fdd835' },
  { base: '#f57c00', luce: '#ffb74d', ombra: '#7a3d00', accento: '#212121' },
  { base: '#6a1b9a', luce: '#ba68c8', ombra: '#33094d', accento: '#ffffff' },
  { base: '#fbc02d', luce: '#fff176', ombra: '#7f5f00', accento: '#212121' },
  { base: '#00897b', luce: '#4db6ac', ombra: '#00413a', accento: '#ffffff' },
  { base: '#ad1457', luce: '#f06292', ombra: '#560a2b', accento: '#ffffff' },
  { base: '#455a64', luce: '#90a4ae', ombra: '#1c262b', accento: '#ff7043' },
  { base: '#f5f5f5', luce: '#ffffff', ombra: '#9e9e9e', accento: '#1565c0' },
  { base: '#212121', luce: '#616161', ombra: '#000000', accento: '#00e5ff' },
];

// ---------------------------------------------------------------------------
// Profilo di velocità ideale (una volta sola)
// ---------------------------------------------------------------------------
const N = NUMERO_SEGMENTI_TOTALE;
const L = LUNGHEZZA_CIRCUITO;
const FRENATA_PROFILO = 24; // m/s² medi: un pilota "pulito", non al limite

const VEL_IDEALE = (() => {
  const v = Array.from({ length: N }, () => 0);
  for (let i = 0; i < N; i++) {
    const c = segmentoA(i).curva;
    v[i] = Math.abs(c) > 0.3 ? Math.min(VELOCITA_MASSIMA_BASE, velocitaAderenza(c) * 0.97) : VELOCITA_MASSIMA_BASE;
  }
  // indietro (frenate) e avanti (accelerazioni), due giri per chiudere l'anello
  for (let giro = 0; giro < 2; giro++) {
    for (let i = N - 1; i >= 0; i--) {
      const succ = v[(i + 1) % N];
      v[i] = Math.min(v[i], Math.sqrt(succ * succ + 2 * FRENATA_PROFILO * LUNGHEZZA_SEGMENTO));
    }
    for (let i = 0; i < N; i++) {
      const prec = v[(i - 1 + N) % N];
      v[i] = Math.min(v[i], Math.sqrt(prec * prec + 2 * accelerazioneMassima(prec) * LUNGHEZZA_SEGMENTO));
    }
  }
  return v;
})();

// Tempo ideale cumulato all'inizio di ogni segmento (un giro).
const T_IDEALE = (() => {
  const t = Array.from({ length: N + 1 }, () => 0);
  t[0] = 0;
  for (let i = 0; i < N; i++) {
    const media = (VEL_IDEALE[i] + VEL_IDEALE[(i + 1) % N]) / 2;
    t[i + 1] = t[i] + LUNGHEZZA_SEGMENTO / media;
  }
  return t;
})();
export const TEMPO_GIRO_IDEALE = T_IDEALE[N];

// Lo stesso, ma partendo da fermi (primo giro della gara): senza, un
// avversario registrato "schizzerebbe" via dalla griglia a velocità di gara.
const T_PARTENZA = (() => {
  const v = Array.from({ length: N + 1 }, () => 0);
  v[0] = 0;
  for (let i = 1; i <= N; i++) {
    const prec = v[i - 1];
    v[i] = Math.min(VEL_IDEALE[i % N], Math.sqrt(prec * prec + 2 * accelerazioneMassima(prec) * LUNGHEZZA_SEGMENTO));
  }
  const t = Array.from({ length: N + 1 }, () => 0);
  t[0] = 0;
  for (let i = 0; i < N; i++) t[i + 1] = t[i] + LUNGHEZZA_SEGMENTO / Math.max(0.5, (v[i] + v[i + 1]) / 2);
  return t;
})();

function interpolaTabella(tabella, x) {
  const i = Math.max(0, Math.min(N - 1, Math.floor(x / LUNGHEZZA_SEGMENTO)));
  const f = x / LUNGHEZZA_SEGMENTO - i;
  return tabella[i] + (tabella[i + 1] - tabella[i]) * f;
}
function inversaTabella(tabella, y) {
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tabella[m] <= y) lo = m;
    else hi = m;
  }
  return (lo + (y - tabella[lo]) / (tabella[lo + 1] - tabella[lo])) * LUNGHEZZA_SEGMENTO;
}

/** Velocità ideale (m/s) a una distanza qualsiasi (anche negativa, più giri). */
export function velocitaIdeale(distanza) {
  const i = Math.floor(distanza / LUNGHEZZA_SEGMENTO);
  const f = distanza / LUNGHEZZA_SEGMENTO - i;
  const a = VEL_IDEALE[((i % N) + N) % N];
  const b = VEL_IDEALE[(((i + 1) % N) + N) % N];
  return a + (b - a) * f;
}

/** Tempo ideale per arrivare a `distanza` partendo da 0. */
function tempoIdeale(distanza) {
  const giri = Math.floor(distanza / L);
  const resto = distanza - giri * L;
  const i = Math.min(N - 1, Math.floor(resto / LUNGHEZZA_SEGMENTO));
  const f = resto / LUNGHEZZA_SEGMENTO - i;
  return giri * TEMPO_GIRO_IDEALE + T_IDEALE[i] + (T_IDEALE[i + 1] - T_IDEALE[i]) * f;
}

/** Inversa di tempoIdeale. */
function distanzaIdeale(tempo) {
  const giri = Math.floor(tempo / TEMPO_GIRO_IDEALE);
  const resto = tempo - giri * TEMPO_GIRO_IDEALE;
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T_IDEALE[m] <= resto) lo = m;
    else hi = m;
  }
  const f = (resto - T_IDEALE[lo]) / (T_IDEALE[lo + 1] - T_IDEALE[lo]);
  return giri * L + (lo + f) * LUNGHEZZA_SEGMENTO;
}

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------
function casuale(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distanza lungo pista di b rispetto ad a, riportata in [-L/2, L/2] (per i bot che girano in tondo). */
function delta(a, b, circolare) {
  let d = b - a;
  if (circolare) d = ((((d + L / 2) % L) + L) % L) - L / 2;
  return d;
}

const limitaX = (x) => Math.max(-X_MAX_IN_PISTA, Math.min(X_MAX_IN_PISTA, x));

// ---------------------------------------------------------------------------
// Creazione
// ---------------------------------------------------------------------------
function creaBot(id, rnd, distanza, x, livrea) {
  return {
    id,
    tipo: 'bot',
    nome: NOMI_BOT[id % NOMI_BOT.length],
    livrea,
    distanza,
    x,
    xPreferita: (rnd() - 0.5) * 3,
    velocita: 0,
    bravura: 0.9 + rnd() * 0.08, // 90-98% della velocità ideale
  };
}

/** 10 bot sparsi sul circuito, almeno 60 m lontani dal giocatore e tra loro. */
export function creaBotQualifica(numero = 10, seme = Date.now()) {
  const rnd = casuale(seme);
  const bots = [];
  const occupate = [0];
  for (let i = 0; i < numero; i++) {
    let d = 0;
    for (let tentativo = 0; tentativo < 50; tentativo++) {
      d = 80 + rnd() * (L - 160);
      if (occupate.every((o) => Math.abs(o - d) > 60)) break;
    }
    occupate.push(d);
    const bot = creaBot(i, rnd, d, (rnd() - 0.5) * 4, LIVREE_AVVERSARI[i % LIVREE_AVVERSARI.length]);
    bot.velocita = velocitaIdeale(d) * bot.bravura; // già lanciati: è una sessione in corso
    bots.push(bot);
  }
  return bots;
}

/**
 * Ricostruisce i punti (distanza, tempo in s) di una gara registrata dai
 * suoi checkpoint [{giro, indice, t(ms)}]. Restituisce null se incompleti.
 */
function puntiDaCheckpoint(checkpoint) {
  if (!Array.isArray(checkpoint) || checkpoint.length < 4) return null;
  const punti = [{ d: 0, t: 0 }];
  for (const c of checkpoint) {
    const d = segmentoAssolutoCheckpoint(c.giro, c.indice) * LUNGHEZZA_SEGMENTO;
    const t = c.t / 1000;
    const ultimo = punti[punti.length - 1];
    if (!(d > ultimo.d) || !(t > ultimo.t)) return null;
    punti.push({ d, t });
  }
  return punti;
}

/**
 * Griglia della gara (20 posti). `registrati`: gare di altri utenti
 * [{username, tempo_totale, tempo_qualifica, checkpoint}]; `posizioneGiocatore`:
 * posto in griglia dalla qualifica (1-20), o null = in fondo.
 * Il giocatore parte SEMPRE a distanza 0 (la sua gara misura sempre gli
 * stessi metri, a garanzia della classifica): gli altri sono messi davanti
 * o dietro di lui di conseguenza.
 */
export function creaGriglia(registrati, posizioneGiocatore, seme = Date.now()) {
  const rnd = casuale(seme);
  const altri = [];
  (registrati || []).slice(0, 19).forEach((r, i) => {
    const punti = puntiDaCheckpoint(r.checkpoint);
    if (!punti) return;
    altri.push({
      id: 100 + i,
      tipo: 'fantasma',
      nome: r.username,
      livrea: LIVREE_AVVERSARI[(i + 3) % LIVREE_AVVERSARI.length],
      punti,
      tempoTotale: Number(r.tempo_totale),
      ritmo: Number(r.tempo_qualifica) || Number(r.tempo_totale) / 10,
      ritardo: 0,
      x: 0,
      velocita: 0,
    });
  });
  let k = 0;
  while (altri.length < 19) {
    const bot = creaBot(k, rnd, 0, 0, LIVREE_AVVERSARI[k % LIVREE_AVVERSARI.length]);
    bot.ritmo = TEMPO_GIRO_IDEALE / bot.bravura;
    altri.push(bot);
    k += 1;
  }
  altri.sort((a, b) => a.ritmo - b.ritmo); // i più veloci davanti
  const posto = Math.max(1, Math.min(20, posizioneGiocatore || 20));
  const ordine = [...altri.slice(0, posto - 1), null, ...altri.slice(posto - 1)];
  const latoGiocatore = posto % 2 === 1 ? -1 : 1;
  ordine.forEach((auto, i) => {
    if (!auto) return;
    const offset = (posto - 1 - i) * DISTANZA_GRIGLIA; // davanti = positivo
    const lato = (i + 1) % 2 === 1 ? -1 : 1;
    auto.offsetGriglia = offset;
    auto.distanza = offset;
    auto.x = lato * X_GRIGLIA;
    auto.xPreferita = lato * X_GRIGLIA * 0.5;
  });
  return { avversari: altri, xGiocatore: latoGiocatore * X_GRIGLIA, posto };
}

/** Distanza di un avversario "fantasma" all'istante t (s dal via), senza ritardi. */
function distanzaFantasma(f, t) {
  const p = f.punti;
  if (t <= 0) return 0;
  for (let i = 1; i < p.length; i++) {
    if (t <= p[i].t) {
      const a = p[i - 1];
      const b = p[i];
      if (a.d === 0 && b.d <= L) {
        // primo intermedio: partenza da fermo
        const tb = interpolaTabella(T_PARTENZA, b.d);
        return inversaTabella(T_PARTENZA, ((t - a.t) / (b.t - a.t)) * tb);
      }
      const ta = tempoIdeale(a.d);
      const tb = tempoIdeale(b.d);
      return distanzaIdeale(ta + ((t - a.t) / (b.t - a.t)) * (tb - ta));
    }
  }
  // oltre il traguardo registrato: prosegue al ritmo ideale scalato sul suo
  const ultimo = p[p.length - 1];
  const scala = tempoIdeale(ultimo.d) / ultimo.t;
  return distanzaIdeale(tempoIdeale(ultimo.d) + (t - ultimo.t) * scala);
}

// ---------------------------------------------------------------------------
// Aggiornamento per fotogramma
// ---------------------------------------------------------------------------
/**
 * Muove tutti gli avversari di dt secondi. `giocatore` = {distanza, x, velocita}.
 * `tempoGara` (s dal via) serve ai fantasmi. `circolare` = true in qualifica
 * (bot che girano all'infinito: distanze confrontate "sul giro").
 */
export function aggiornaAvversari(avversari, giocatore, dt, { tempoGara = 0, circolare = false, via = true } = {}) {
  if (!via) return;
  const tutti = [...avversari, { ...giocatore, giocatore: true }];

  for (const a of avversari) {
    // auto più vicina davanti nella stessa "corsia"
    let davanti = null;
    let gapDavanti = Infinity;
    let laterale = { sx: false, dx: false };
    for (const b of tutti) {
      if (b === a || b.id === a.id) continue;
      const d = delta(a.distanza, b.distanza, circolare);
      const dx = b.x - a.x;
      if (d > 0 && d < 40 && Math.abs(dx) < LARGHEZZA_AUTO + 0.3 && d < gapDavanti) {
        davanti = b;
        gapDavanti = d;
      }
      if (Math.abs(d) < LUNGHEZZA_AUTO * 1.6) {
        if (dx < 0 && dx > -(LARGHEZZA_AUTO + 0.6)) laterale.sx = true;
        if (dx > 0 && dx < LARGHEZZA_AUTO + 0.6) laterale.dx = true;
      }
    }

    // traiettoria: preferita, oppure di lato per superare chi è davanti
    let xTarget = a.xPreferita;
    let bloccato = false;
    if (davanti && gapDavanti < 30) {
      const sinistra = limitaX(davanti.x - (LARGHEZZA_AUTO + 0.8));
      const destra = limitaX(davanti.x + (LARGHEZZA_AUTO + 0.8));
      const sxLibera = !laterale.sx && Math.abs(sinistra - davanti.x) >= LARGHEZZA_AUTO;
      const dxLibera = !laterale.dx && Math.abs(destra - davanti.x) >= LARGHEZZA_AUTO;
      if (sxLibera && (!dxLibera || Math.abs(sinistra - a.x) <= Math.abs(destra - a.x))) xTarget = sinistra;
      else if (dxLibera) xTarget = destra;
      else bloccato = true;
    }
    const passoX = 3.5 * dt;
    a.x = limitaX(a.x + Math.max(-passoX, Math.min(passoX, xTarget - a.x)));

    // scia
    const inScia = davanti && gapDavanti < SCIA_DISTANZA && Math.abs(davanti.x - a.x) < SCIA_LARGHEZZA ? 1 : 0;

    if (a.tipo === 'fantasma') {
      // il fantasma segue la sua gara registrata; se è chiuso da chi ha
      // davanti nella stessa traiettoria, accumula ritardo (rallenta) invece di tamponare
      const chiuso = davanti && gapDavanti < LUNGHEZZA_AUTO + 3 && Math.abs(davanti.x - a.x) < LARGHEZZA_AUTO;
      if (chiuso) a.ritardo += dt * 0.6;
      const prima = a.distanza;
      a.distanza = distanzaFantasma(a, tempoGara - a.ritardo) + a.offsetGriglia;
      if (chiuso && davanti) a.distanza = Math.min(a.distanza, davanti.distanza - LUNGHEZZA_AUTO - 1);
      a.velocita = Math.max(0, (a.distanza - prima) / Math.max(dt, 1e-3));
    } else {
      let obiettivo = velocitaIdeale(a.distanza + a.velocita * 0.3) * a.bravura + inScia * (10 / 3.6);
      if (davanti && (bloccato || gapDavanti < LUNGHEZZA_AUTO + 4) && Math.abs(davanti.x - a.x) < LARGHEZZA_AUTO) {
        // dietro a qualcuno senza spazio per passare: si accoda, non tampona mai
        obiettivo = Math.min(obiettivo, davanti.velocita - (gapDavanti < LUNGHEZZA_AUTO + 2 ? 2 : 0));
      }
      if (a.velocita < obiettivo) a.velocita = Math.min(obiettivo, a.velocita + accelerazioneMassima(a.velocita, inScia) * dt);
      else a.velocita = Math.max(obiettivo, a.velocita - frenataMassima(a.velocita) * dt);
      a.velocita = Math.max(0, a.velocita);
      a.distanza += a.velocita * dt;
      if (davanti && gapDavanti < 40) {
        const nuovoGap = delta(a.distanza, davanti.distanza, circolare);
        if (nuovoGap < LUNGHEZZA_AUTO && Math.abs(davanti.x - a.x) < LARGHEZZA_AUTO) a.distanza -= LUNGHEZZA_AUTO - nuovoGap;
      }
    }
  }
}

/**
 * Contatti e scia del GIOCATORE con gli avversari, dopo la sua fisica.
 * Modifica `giocatore` (distanza, x, velocita) e restituisce
 * { scia: 0|1, tamponamento: bool }.
 */
export function interazioniGiocatore(giocatore, avversari, { circolare = false, ultimoTamponamento = -Infinity, adesso = 0 } = {}) {
  let scia = 0;
  let tamponamento = false;
  for (const a of avversari) {
    const d = delta(giocatore.distanza, a.distanza, circolare); // >0: l'avversario è davanti
    const dx = a.x - giocatore.x;
    const sovrapposti = Math.abs(dx) < LARGHEZZA_AUTO;
    if (d > 0 && d < SCIA_DISTANZA && Math.abs(dx) < SCIA_LARGHEZZA) scia = 1;
    if (!sovrapposti) continue;
    if (d > LUNGHEZZA_AUTO * 0.5 && d < LUNGHEZZA_AUTO) {
      // tamponamento: perdita proporzionale alla botta (una volta per contatto) e niente compenetrazione
      const perdita = perditaTamponamento(giocatore.velocita - a.velocita);
      if (perdita > 0 && adesso - ultimoTamponamento > 1) {
        giocatore.velocita *= 1 - perdita;
        tamponamento = true;
      }
      giocatore.velocita = Math.min(giocatore.velocita, a.velocita);
      giocatore.distanza -= LUNGHEZZA_AUTO - d;
    } else if (Math.abs(d) <= LUNGHEZZA_AUTO * 0.5) {
      // affiancati e sovrapposti: ci si separa di lato (metà a testa), senza perdere velocità
      const verso = dx > 0 ? -1 : 1; // direzione in cui si sposta il giocatore
      const sovrapposizione = LARGHEZZA_AUTO - Math.abs(dx);
      const xAvversario = limitaX(a.x - (verso * sovrapposizione) / 2);
      const spostamentoAvversario = Math.abs(xAvversario - a.x);
      a.x = xAvversario;
      giocatore.x += verso * (sovrapposizione - spostamentoAvversario);
    } else if (d < -LUNGHEZZA_AUTO * 0.5 && d > -LUNGHEZZA_AUTO) {
      // un avversario addosso da dietro (es. hai frenato di colpo): è lui a cedere
      // prima prova a scansarti di lato, se c'è spazio; altrimenti arretra
      const verso = dx >= 0 ? 1 : -1;
      const xScanso = limitaX(giocatore.x + verso * (LARGHEZZA_AUTO + 0.2));
      if (Math.abs(xScanso - giocatore.x) >= LARGHEZZA_AUTO) {
        a.x = xScanso;
      } else {
        if (a.tipo === 'fantasma') a.ritardo += 0.05;
        a.distanza -= LUNGHEZZA_AUTO + d; // d è negativo: arretra della sovrapposizione
        a.velocita = Math.min(a.velocita, giocatore.velocita);
      }
    }
  }
  return { scia, tamponamento };
}

/**
 * Ultima rete di sicurezza, dopo ogni fotogramma: nessuna coppia di
 * avversari sovrapposta. Chi sta dietro arretra quanto serve e non va più
 * veloce di chi ha davanti (succede a catena quando un'auto rallenta di colpo).
 */
export function separaAvversari(avversari, circolare = false) {
  for (let passata = 0; passata < 2; passata++) {
    for (let i = 0; i < avversari.length; i++) {
      for (let j = 0; j < avversari.length; j++) {
        if (i === j) continue;
        const a = avversari[i]; // dietro
        const b = avversari[j]; // davanti
        const d = delta(a.distanza, b.distanza, circolare);
        if (d >= 0 && d < LUNGHEZZA_AUTO && Math.abs(b.x - a.x) < LARGHEZZA_AUTO) {
          a.distanza -= LUNGHEZZA_AUTO - d;
          a.velocita = Math.min(a.velocita, b.velocita);
          if (a.tipo === 'fantasma') a.ritardo += 0.02;
        }
      }
    }
  }
}

/**
 * Posizione del giocatore in gara: 1 + quante auto hanno percorso più
 * strada di lui. Chiamata ai passaggi sugli intermedi (come richiesto),
 * equivale a confrontare i tempi a quel checkpoint.
 */
export function posizioneInGara(distanzaGiocatore, avversari) {
  return 1 + avversari.filter((a) => a.distanza > distanzaGiocatore).length;
}

/** Tempo finale stimato di ogni avversario (s), per la classifica di fine gara. */
export function tempoFinaleStimato(a, tempoGara, distanzaGara) {
  if (a.tipo === 'fantasma') return a.tempoTotale + a.ritardo;
  const mancante = distanzaGara - a.distanza;
  if (mancante <= 0) return tempoGara;
  return tempoGara + mancante / Math.max(20, velocitaIdeale(a.distanza) * a.bravura * 0.85);
}

export const _test = { tempoIdeale, distanzaIdeale, distanzaFantasma, puntiDaCheckpoint };
