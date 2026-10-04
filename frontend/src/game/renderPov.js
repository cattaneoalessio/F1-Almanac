/**
 * renderPov.js — grafica del Time Attack in visuale ONBOARD (camera sopra
 * l'halo, come le riprese TV di riferimento). Solo primitive Canvas 2D,
 * gradienti e matematica: nessuna immagine esterna.
 *
 * PROIEZIONE: camera "pinhole" con orizzonte fisso a FRAZIONE_ORIZZONTE
 * dell'altezza. Un punto (x laterale, y altezza, z profondità — metri,
 * relativi alla camera) va a schermo in
 *     sx = W/2 + f·x/z      sy = orizzonte − f·y/z
 * con la stessa focale f in orizzontale e verticale (pixel quadrati).
 * La monoposto è descritta in metri NELLO STESSO SPAZIO della camera e
 * proiettata con la stessa formula: musetto, ruote e alettone sono
 * coerenti con la prospettiva della pista, non disegnati "a occhio".
 *
 * SCALA AUTO: la fisica considera l'auto larga 3 m (fisica3d.js), più di
 * una F1 vera (~2 m). Tutta la monoposto e l'altezza della camera sono
 * moltiplicate per SCALA_AUTO: l'immagine dell'auto resta identica, ma
 * le ruote toccano il cordolo a schermo quando la fisica lo segnala.
 *
 * PRESTAZIONI (60 fps): cielo, montagne, nuvole, sprite (alberi,
 * cartelloni) e le parti fisse della monoposto sono disegnati UNA volta
 * in canvas fuori schermo e ricopiati con drawImage a ogni fotogramma.
 * Per ogni fotogramma restano solo pista, scenario e ruote anteriori
 * (che sterzano). I dettagli lontani sotto il pixel vengono saltati.
 */

import { LARGHEZZA_PISTA } from './circuito3d.js';

export const FRAZIONE_ORIZZONTE = 0.2;
const SCALA_AUTO = 1.4;
export const ALTEZZA_CAMERA = 1.15 * SCALA_AUTO; // metri sopra l'asfalto
const SEMI_PISTA = LARGHEZZA_PISTA / 2;
const LARGHEZZA_CORDOLO = 1; // come fisica3d.js
const X_BARRIERA = SEMI_PISTA + 10; // muro: 10 m oltre il bordo (fisica3d.js)

/** Livree inventate: nessun riferimento a squadre o sponsor reali. */
export const LIVREE = [
  { id: 'rosso', nome: 'Rosso Corsa', base: '#e10600', luce: '#ff5a47', ombra: '#7a0300', accento: '#ffffff', casco: '#ffffff', striscia: '#e10600' },
  { id: 'notte', nome: 'Notte e Oro', base: '#16181d', luce: '#3a3f4a', ombra: '#050506', accento: '#d9a441', casco: '#d9a441', striscia: '#16181d' },
  { id: 'ciano', nome: 'Ciano Elettrico', base: '#0a6f8a', luce: '#3fd0ff', ombra: '#03303d', accento: '#f5f7fa', casco: '#3fd0ff', striscia: '#0b0c10' },
  { id: 'argento', nome: 'Argento Brianza', base: '#c9ced6', luce: '#f4f6f9', ombra: '#6c737e', accento: '#e8432e', casco: '#e8432e', striscia: '#c9ced6' },
];
export const livreaDaId = (id) => LIVREE.find((l) => l.id === id) || LIVREE[0];

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------
function hash(n) {
  // pseudo-casuale stabile per indice di segmento (stesso albero, stesso posto, a ogni giro)
  let x = (n * 374761393 + 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function creaVista(W, H) {
  const f = W / 2; // campo visivo orizzontale 90°
  const oy = H * FRAZIONE_ORIZZONTE;
  const cx = W / 2;
  return {
    W,
    H,
    f,
    oy,
    cx,
    p(x, y, z) {
      const zz = Math.max(z, 0.05);
      return [cx + (f * x) / zz, oy - (f * y) / zz];
    },
  };
}

function poligono(ctx, punti) {
  ctx.beginPath();
  ctx.moveTo(punti[0][0], punti[0][1]);
  for (let i = 1; i < punti.length; i++) ctx.lineTo(punti[i][0], punti[i][1]);
  ctx.closePath();
}

/** Inviluppo convesso (monotone chain) — per la sagoma della ruota sterzata. */
function inviluppo(punti) {
  const p = punti.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const croce = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const giu = [];
  for (const q of p) {
    while (giu.length >= 2 && croce(giu[giu.length - 2], giu[giu.length - 1], q) <= 0) giu.pop();
    giu.push(q);
  }
  const su = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (su.length >= 2 && croce(su[su.length - 2], su[su.length - 1], q) <= 0) su.pop();
    su.push(q);
  }
  return giu.slice(0, -1).concat(su.slice(0, -1));
}

// ---------------------------------------------------------------------------
// Livelli preparati una volta sola
// ---------------------------------------------------------------------------
function gradienteCielo(g, H) {
  const oy = H * FRAZIONE_ORIZZONTE;
  const gr = g.createLinearGradient(0, 0, 0, oy);
  gr.addColorStop(0, '#2196f3');
  gr.addColorStop(0.65, '#90caf9');
  gr.addColorStop(1, '#bbdefb');
  return gr;
}

/** Striscia di montagne e nuvole larga 2W, ripetibile in orizzontale (parallasse). */
function preparaMontagne(crea, W, H) {
  const oy = Math.ceil(H * FRAZIONE_ORIZZONTE) + 2;
  const largh = W * 2;
  const c = crea(largh, oy);
  const g = c.getContext('2d');
  // nuvole
  g.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 9; i++) {
    const x = hash(i + 11) * largh;
    const y = oy * (0.12 + hash(i + 31) * 0.38);
    const r = oy * (0.05 + hash(i + 51) * 0.05);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(x + (k - 1.5) * r * 1.1, y + (k % 2) * r * 0.25, r * (1.1 - Math.abs(k - 1.5) * 0.2), r * 0.6, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // due catene di colline: somma di sinusoidi con periodo intero sulla larghezza → si ripete senza giunture
  const catena = (colore, altezzaMax, fasi) => {
    g.fillStyle = colore;
    g.beginPath();
    g.moveTo(0, oy);
    for (let x = 0; x <= largh; x += 4) {
      const t = (x / largh) * Math.PI * 2;
      const h = fasi.reduce((s, [k, a, ph]) => s + a * Math.sin(k * t + ph), 0);
      g.lineTo(x, oy - altezzaMax * (0.55 + 0.45 * h));
    }
    g.lineTo(largh, oy);
    g.closePath();
    g.fill();
  };
  catena('#b3d4f5', oy * 0.3, [[3, 0.5, 0.3], [7, 0.3, 1.1], [13, 0.2, 2.0]]);
  catena('#90caf9', oy * 0.2, [[4, 0.5, 2.2], [9, 0.3, 0.4], [17, 0.2, 1.3]]);
  return c;
}

function preparaAlbero(crea, variante) {
  const w = 128;
  const h = 192;
  const c = crea(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#5d4037';
  g.fillRect(w * 0.45, h * 0.62, w * 0.1, h * 0.38);
  const verdi = variante % 2 ? ['#2e7d32', '#388e3c', '#43a047', '#66bb6a'] : ['#1b5e20', '#2e7d32', '#388e3c', '#4caf50'];
  if (variante < 2) {
    // chioma tonda: cerchi sovrapposti
    const cerchi = [[0.5, 0.42, 0.34], [0.3, 0.52, 0.22], [0.7, 0.52, 0.22], [0.42, 0.3, 0.22], [0.6, 0.28, 0.2]];
    cerchi.forEach(([x, y, r], i) => {
      g.fillStyle = verdi[i % verdi.length];
      g.beginPath();
      g.arc(w * x, h * y, w * r, 0, Math.PI * 2);
      g.fill();
    });
  } else {
    // conifera: triangoli sovrapposti
    [[0.62, 0.46], [0.46, 0.38], [0.3, 0.3]].forEach(([yBase, semi], i) => {
      g.fillStyle = verdi[i + 1];
      g.beginPath();
      g.moveTo(w * 0.5, h * (yBase - 0.34));
      g.lineTo(w * (0.5 - semi), h * yBase);
      g.lineTo(w * (0.5 + semi), h * yBase);
      g.closePath();
      g.fill();
    });
  }
  return c;
}

function preparaCartellone(crea, variante) {
  const w = 320;
  const h = 96;
  const c = crea(w, h);
  const g = c.getContext('2d');
  const sfondo = variante === 0 ? '#3fd0ff' : variante === 1 ? '#0b0c10' : '#d9a441';
  const testo = variante === 0 ? '#0b0c10' : variante === 1 ? '#3fd0ff' : '#0b0c10';
  g.fillStyle = '#4a4d54';
  g.fillRect(0, 0, w, h);
  g.fillStyle = sfondo;
  g.fillRect(6, 6, w - 12, h - 12);
  g.fillStyle = testo;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${Math.round(h * 0.56)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
  g.fillText('MONOPOSTO', w * 0.43, h * 0.53);
  g.fillStyle = variante === 1 ? '#e8432e' : '#e10600';
  g.fillText('.IO', w * 0.85, h * 0.53);
  return c;
}

// ---------------------------------------------------------------------------
// Monoposto (spazio camera, metri; moltiplicati per SCALA_AUTO)
// ---------------------------------------------------------------------------
const S = SCALA_AUTO;
const Y_TERRA = -ALTEZZA_CAMERA;
const RUOTA = { x: 0.8 * S, z: 1.95 * S, r: 0.36 * S, w: 0.38 * S };

function strokeTubo(ctx, v, a, b, raggio, colore) {
  const pa = v.p(...a);
  const pb = v.p(...b);
  const zMedio = (a[2] + b[2]) / 2;
  ctx.strokeStyle = colore;
  ctx.lineWidth = Math.max(1, (v.f * raggio * 2) / zMedio);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pa[0], pa[1]);
  ctx.lineTo(pb[0], pb[1]);
  ctx.stroke();
}

/** Parti DIETRO le ruote: alettone anteriore, piloni, sospensioni. */
function disegnaAutoDietro(g, v, livrea) {
  const t = (y) => Y_TERRA + y * S; // altezza da terra -> spazio camera
  // Alettone: tre profili sovrapposti (dal più basso/avanti al più alto/dietro)
  const profili = [
    { z0: 3.12, z1: 3.5, y: 0.09, x0: 0, x1: 0.98, colore: '#3b3e46' },
    { z0: 2.98, z1: 3.16, y: 0.17, x0: 0.16, x1: 0.97, colore: '#5a5e68' },
    { z0: 2.86, z1: 2.99, y: 0.25, x0: 0.28, x1: 0.96, colore: livrea.base },
  ];
  for (const pr of profili) {
    for (const lato of [-1, 1]) {
      const pts = [
        v.p(lato * pr.x0 * S, t(pr.y), pr.z1 * S),
        v.p(lato * pr.x1 * S, t(pr.y + 0.02), pr.z1 * S),
        v.p(lato * pr.x1 * S, t(pr.y + 0.04), pr.z0 * S),
        v.p(lato * pr.x0 * S, t(pr.y + 0.02), pr.z0 * S),
      ];
      g.fillStyle = pr.colore;
      poligono(g, pts);
      g.fill();
      // bordo d'uscita più chiaro: stacca il profilo dall'asfalto
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = Math.max(1, v.W * 0.0012);
      g.beginPath();
      g.moveTo(pts[3][0], pts[3][1]);
      g.lineTo(pts[2][0], pts[2][1]);
      g.stroke();
    }
  }
  // paratie laterali (endplate)
  for (const lato of [-1, 1]) {
    const x = lato * 0.98 * S;
    g.fillStyle = '#121316';
    poligono(g, [v.p(x, t(0.02), 3.54 * S), v.p(x, t(0.34), 3.48 * S), v.p(x, t(0.36), 2.84 * S), v.p(x, t(0.06), 2.82 * S)]);
    g.fill();
  }
  // piloni che reggono l'alettone sotto la punta del musetto
  for (const lato of [-1, 1]) {
    g.fillStyle = '#18191d';
    poligono(g, [
      v.p(lato * 0.07 * S, t(0.34), 2.82 * S),
      v.p(lato * 0.07 * S, t(0.34), 3.02 * S),
      v.p(lato * 0.07 * S, t(0.11), 3.24 * S),
      v.p(lato * 0.07 * S, t(0.11), 3.04 * S),
    ]);
    g.fill();
  }
  // sospensioni: triangoli superiore e inferiore, tirante dello sterzo, puntone
  const mozzo = t(0.36);
  for (const lato of [-1, 1]) {
    const xr = lato * (RUOTA.x - RUOTA.w * 0.45);
    const r = (x, y, z) => [x, y, z];
    strokeTubo(g, v, r(lato * 0.16 * S, t(0.5), 1.55 * S), r(xr, mozzo + 0.12 * S, RUOTA.z), 0.022 * S, '#212121');
    strokeTubo(g, v, r(lato * 0.13 * S, t(0.44), 2.3 * S), r(xr, mozzo + 0.12 * S, RUOTA.z), 0.022 * S, '#212121');
    strokeTubo(g, v, r(lato * 0.14 * S, t(0.3), 1.5 * S), r(xr, mozzo - 0.1 * S, RUOTA.z), 0.022 * S, '#212121');
    strokeTubo(g, v, r(lato * 0.11 * S, t(0.3), 2.4 * S), r(xr, mozzo - 0.1 * S, RUOTA.z), 0.022 * S, '#212121');
    strokeTubo(g, v, r(lato * 0.15 * S, t(0.42), 1.75 * S), r(xr, mozzo, RUOTA.z - 0.12 * S), 0.016 * S, '#3a3a3a');
  }
}

/** Parti DAVANTI alle ruote: musetto, telaio, pance, specchietti, halo, casco. */
function disegnaAutoDavanti(g, v, livrea) {
  const t = (y) => Y_TERRA + y * S;
  const { W, H } = v;
  const grVert = (y0, y1, stop) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    stop.forEach(([o, col]) => gr.addColorStop(o, col));
    return gr;
  };

  // --- Pance laterali (in basso ai lati, oltre l'halo)
  for (const lato of [-1, 1]) {
    const pts = [
      v.p(lato * 0.28 * S, t(0.66), 1.25 * S),
      v.p(lato * 0.62 * S, t(0.6), 1.02 * S),
      v.p(lato * 0.8 * S, t(0.57), 0.6 * S),
      v.p(lato * 0.82 * S, t(0.55), 0.18 * S),
      v.p(lato * 0.3 * S, t(0.7), 0.18 * S),
    ];
    g.fillStyle = grVert(H * 0.55, H, [[0, livrea.base], [1, livrea.ombra]]);
    poligono(g, pts);
    g.fill();
    // bordo superiore lucido della pancia
    g.strokeStyle = livrea.luce;
    g.lineWidth = Math.max(1, W * 0.0025);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    g.lineTo(pts[1][0], pts[1][1]);
    g.lineTo(pts[2][0], pts[2][1]);
    g.stroke();
  }

  // --- Musetto: dal telaio (z 1.25) alla punta (z 3.0), superficie + fianchi
  const punta = 3.0 * S;
  const base = 1.25 * S;
  const top = [v.p(-0.1 * S, t(0.38), punta), v.p(0.1 * S, t(0.38), punta), v.p(0.27 * S, t(0.66), base), v.p(-0.27 * S, t(0.66), base)];
  for (const lato of [-1, 1]) {
    g.fillStyle = livrea.ombra;
    poligono(g, [v.p(lato * 0.1 * S, t(0.38), punta), v.p(lato * 0.27 * S, t(0.66), base), v.p(lato * 0.29 * S, t(0.42), base), v.p(lato * 0.11 * S, t(0.26), punta)]);
    g.fill();
  }
  const xs = top.map((q) => q[0]);
  const grMuso = g.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
  grMuso.addColorStop(0, livrea.ombra);
  grMuso.addColorStop(0.28, livrea.base);
  grMuso.addColorStop(0.5, livrea.luce);
  grMuso.addColorStop(0.72, livrea.base);
  grMuso.addColorStop(1, livrea.ombra);
  g.fillStyle = grMuso;
  poligono(g, top);
  g.fill();
  g.fillStyle = livrea.accento;
  poligono(g, [v.p(-0.025 * S, t(0.385), punta), v.p(0.025 * S, t(0.385), punta), v.p(0.055 * S, t(0.665), base), v.p(-0.055 * S, t(0.665), base)]);
  g.fill();
  const pp = v.p(0, t(0.35), punta + 0.03 * S);
  g.fillStyle = livrea.base;
  g.beginPath();
  g.ellipse(pp[0], pp[1], (v.f * 0.1 * S) / punta, (v.f * 0.04 * S) / punta, 0, 0, Math.PI * 2);
  g.fill();

  // --- Telaio attorno all'abitacolo (tra il musetto e il casco)
  g.fillStyle = grVert(v.p(0, t(0.66), base)[1], H, [[0, livrea.luce], [0.3, livrea.base], [1, livrea.ombra]]);
  poligono(g, [v.p(-0.27 * S, t(0.66), base), v.p(0.27 * S, t(0.66), base), v.p(0.4 * S, t(0.72), 0.18 * S), v.p(-0.4 * S, t(0.72), 0.18 * S)]);
  g.fill();
  g.fillStyle = '#0a0a0b';
  poligono(g, [v.p(-0.18 * S, t(0.72), 0.7 * S), v.p(0.18 * S, t(0.72), 0.7 * S), v.p(0.25 * S, t(0.74), 0.2 * S), v.p(-0.25 * S, t(0.74), 0.2 * S)]);
  g.fill();

  // --- Specchietti, su supporti che partono dalle pance
  for (const lato of [-1, 1]) {
    const cx = lato * 0.6 * S;
    const z = 1.05 * S;
    strokeTubo(g, v, [lato * 0.45 * S, t(0.6), 1.05 * S], [cx - lato * 0.04 * S, t(0.7), z], 0.014 * S, livrea.ombra);
    g.fillStyle = livrea.base;
    poligono(g, [v.p(cx - 0.1 * S, t(0.77), z), v.p(cx + 0.1 * S, t(0.77), z), v.p(cx + 0.1 * S, t(0.69), z), v.p(cx - 0.1 * S, t(0.69), z)]);
    g.fill();
    const vetro = [v.p(cx - 0.088 * S, t(0.765), z), v.p(cx + 0.088 * S, t(0.765), z), v.p(cx + 0.088 * S, t(0.7), z), v.p(cx - 0.088 * S, t(0.7), z)];
    const grVetro = g.createLinearGradient(vetro[0][0], vetro[0][1], vetro[2][0], vetro[2][1]);
    grVetro.addColorStop(0, '#b8c8d8');
    grVetro.addColorStop(0.5, '#3b4654');
    grVetro.addColorStop(1, '#6a7b8d');
    g.fillStyle = grVetro;
    poligono(g, vetro);
    g.fill();
  }

  // --- Halo: tubo in carbonio visto dall'alto (pianta ellittica) + montante centrale
  const yHalo = t(0.9);
  const arco = (raggioExtra) => {
    const out = [];
    for (let a = -Math.PI * 0.42; a <= Math.PI * 0.42 + 1e-6; a += Math.PI / 48) {
      const rx = 0.42 * S + raggioExtra;
      const rz = 0.6 * S + raggioExtra;
      out.push([Math.sin(a) * rx, yHalo - (1 - Math.cos(a)) * 0.06 * S, 0.02 * S + Math.cos(a) * rz]);
    }
    return out;
  };
  const spessore = 0.07 * S;
  // montante centrale: dalla cima dell'halo al telaio
  const m0 = v.p(0, yHalo, 0.62 * S);
  const m1 = v.p(0, t(0.68), 1.05 * S);
  g.fillStyle = '#1b1c1f';
  poligono(g, [
    [m0[0] - (v.f * 0.035 * S) / (0.62 * S), m0[1]],
    [m0[0] + (v.f * 0.035 * S) / (0.62 * S), m0[1]],
    [m1[0] + (v.f * 0.05 * S) / (1.05 * S), m1[1]],
    [m1[0] - (v.f * 0.05 * S) / (1.05 * S), m1[1]],
  ]);
  g.fill();
  const esterno = arco(spessore / 2).map((q) => v.p(...q));
  const interno = arco(-spessore / 2).map((q) => v.p(...q));
  g.fillStyle = '#17181b';
  poligono(g, esterno.concat(interno.reverse()));
  g.fill();
  // riflesso lungo il tubo
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = Math.max(1, W * 0.002);
  g.beginPath();
  arco(spessore * 0.15).forEach((q, i) => {
    const pq = v.p(q[0], q[1] + 0.012 * S, q[2]);
    if (i === 0) g.moveTo(pq[0], pq[1]);
    else g.lineTo(pq[0], pq[1]);
  });
  g.stroke();

  // --- Casco del pilota (in basso al centro, colori della livrea)
  const cxC = W / 2;
  const cyC = H * 1.04;
  const rx = W * 0.14;
  const ry = H * 0.2;
  const grCasco = g.createRadialGradient(cxC - rx * 0.3, cyC - ry * 0.6, ry * 0.1, cxC, cyC, rx * 1.1);
  grCasco.addColorStop(0, '#ffffff');
  grCasco.addColorStop(0.35, livrea.casco);
  grCasco.addColorStop(1, '#202227');
  g.fillStyle = grCasco;
  g.beginPath();
  g.ellipse(cxC, cyC, rx, ry, 0, Math.PI, Math.PI * 2);
  g.fill();
  g.fillStyle = livrea.striscia;
  g.beginPath();
  g.ellipse(cxC, cyC, rx * 0.2, ry * 0.98, 0, Math.PI, Math.PI * 2);
  g.fill();
}

/** Ruota anteriore (sterza): cilindro proiettato, battistrada + spalla interna. */
function disegnaRuota(ctx, v, lato, sterzo) {
  const cosS = Math.cos(sterzo);
  const sinS = Math.sin(sterzo);
  const cx = lato * RUOTA.x;
  const cz = RUOTA.z;
  const cy = Y_TERRA + RUOTA.r;
  const N = 18;
  const facce = [];
  const tutte = [];
  for (const dx of [-RUOTA.w / 2, RUOTA.w / 2]) {
    const punti = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const ly = Math.sin(a) * RUOTA.r;
      const lz = Math.cos(a) * RUOTA.r;
      // rotazione attorno all'asse verticale (sterzo)
      const q = v.p(cx + dx * cosS + lz * sinS, cy + ly, cz - dx * sinS + lz * cosS);
      punti.push(q);
      tutte.push(q);
    }
    // la spalla è visibile se la sua normale guarda verso la camera
    const centro = [cx + dx * cosS, cy, cz - dx * sinS];
    const normale = [Math.sign(dx) * cosS, 0, -Math.sign(dx) * sinS];
    const visibile = -(normale[0] * centro[0] + normale[2] * centro[2]) > 0;
    facce.push({ punti, visibile });
  }
  ctx.fillStyle = '#141414';
  poligono(ctx, inviluppo(tutte));
  ctx.fill();
  for (const { punti, visibile } of facce) {
    if (!visibile) continue;
    ctx.fillStyle = '#1c1c1c';
    poligono(ctx, punti);
    ctx.fill();
    const centro = punti.reduce((s2, q) => [s2[0] + q[0] / N, s2[1] + q[1] / N], [0, 0]);
    const scala = (k) => punti.map((q) => [centro[0] + (q[0] - centro[0]) * k, centro[1] + (q[1] - centro[1]) * k]);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = Math.max(1, (v.f * 0.018 * S) / cz);
    poligono(ctx, scala(0.86));
    ctx.stroke();
    ctx.fillStyle = '#2a2a2e';
    poligono(ctx, scala(0.6));
    ctx.fill();
    ctx.fillStyle = '#4b4d55';
    poligono(ctx, scala(0.22));
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
/**
 * creaRendererPov(creaCanvas) — creaCanvas(w, h) restituisce un canvas
 * fuori schermo (nel browser: document.createElement('canvas')).
 * Restituisce { disegna(ctx, W, H, scena), invalida() }.
 */
export function creaRendererPov(creaCanvas) {
  let cache = null;

  function prepara(W, H, livrea) {
    const chiave = `${W}x${H}:${livrea.id}`;
    if (cache && cache.chiave === chiave) return cache;
    const v = creaVista(W, H);
    const sprite = cache?.sprite || {
      alberi: [0, 1, 2, 3].map((i) => preparaAlbero(creaCanvas, i)),
      cartelloni: [0, 1, 2].map((i) => preparaCartellone(creaCanvas, i)),
    };
    const dietro = creaCanvas(W, H);
    disegnaAutoDietro(dietro.getContext('2d'), v, livrea);
    const davanti = creaCanvas(W, H);
    disegnaAutoDavanti(davanti.getContext('2d'), v, livrea);
    cache = {
      chiave,
      v,
      cielo: null, // gradiente creato sul contesto di disegno (vedi disegna)
      montagne: preparaMontagne(creaCanvas, W, H),
      sprite,
      dietro,
      davanti,
    };
    return cache;
  }

  /**
   * scena = {
   *   segmenti: output di calcolaSegmentiVisibili (x,y,z relativi alla camera),
   *   livrea, sterzo (radianti, + = destra), offsetSfondo (pixel di parallasse),
   *   tratti: Map indiceSegmento -> 'tribuna' | 'cartelloni' (dove mettere cosa)
   * }
   */
  let cartelliScena = null;

  function disegna(ctx, W, H, scena) {
    const c = prepara(W, H, scena.livrea);
    cartelliScena = scena.cartelli || null;
    const v = c.v;
    const { f, oy, cx } = v;

    // Cielo + montagne con parallasse
    if (!c.cielo || c.ctxCielo !== ctx) {
      c.cielo = gradienteCielo(ctx, H);
      c.ctxCielo = ctx;
    }
    ctx.fillStyle = c.cielo;
    ctx.fillRect(0, 0, W, Math.ceil(oy) + 1);
    const lm = c.montagne.width;
    let off = ((scena.offsetSfondo % lm) + lm) % lm;
    ctx.drawImage(c.montagne, -off, 0);
    ctx.drawImage(c.montagne, lm - off, 0);
    // Prato di base
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(0, Math.floor(oy), W, H - oy);

    const seg = scena.segmenti;
    // proiezione dei bordi di ogni segmento (una sola volta)
    const P = [];
    for (const s of seg) {
      if (s.z <= 0.5) continue;
      const k = f / s.z;
      P.push({ s, k, x: cx + s.x * k, y: oy - s.y * k });
    }

    const limite = W * 4;
    const clampX = (x) => (x < -limite ? -limite : x > limite ? limite : x);
    const quad = (a, b, x0, x1, colore) => {
      ctx.fillStyle = colore;
      ctx.beginPath();
      ctx.moveTo(clampX(a.x + x0 * a.k), a.y);
      ctx.lineTo(clampX(a.x + x1 * a.k), a.y);
      ctx.lineTo(clampX(b.x + x1 * b.k), b.y + 0.5);
      ctx.lineTo(clampX(b.x + x0 * b.k), b.y + 0.5);
      ctx.closePath();
      ctx.fill();
    };

    let accumulato = null; // tratti lontani sotto il pixel: si uniscono in un'unica striscia
    for (let i = P.length - 1; i > 0; i--) {
      const b = P[i - 1]; // vicino
      const idx = b.s.indiceSegmento;
      if (b.y - P[i].y < -1) {
        accumulato = null;
        continue; // tratto nascosto da un dosso più vicino
      }
      if (b.y - (accumulato || P[i]).y < 1 && i > 1) {
        if (!accumulato) accumulato = P[i];
        if (b.s.z < 900) disegnaScenario(ctx, c, P[i], b, idx, scena.tratti.get(idx), Math.abs(b.s.curva));
        continue;
      }
      const a = accumulato || P[i]; // lontano
      accumulato = null;
      const alto = b.y - a.y; // pixel di altezza del tratto

      // prato a bande alternate
      if (alto > 0.6) quad(a, b, -90, 90, Math.floor(idx / 2) % 2 ? '#43a047' : '#4caf50');

      // barriera/muro ai bordi
      if (alto > 0.4 && b.s.z < 700) {
        for (const lato of [-1, 1]) {
          const x0 = lato * X_BARRIERA;
          const hB = 1.1;
          ctx.fillStyle = idx % 2 ? '#cfd8dc' : '#b0bec5';
          ctx.beginPath();
          ctx.moveTo(a.x + x0 * a.k, a.y);
          ctx.lineTo(b.x + x0 * b.k, b.y);
          ctx.lineTo(b.x + x0 * b.k, b.y - hB * b.k);
          ctx.lineTo(a.x + x0 * a.k, a.y - hB * a.k);
          ctx.closePath();
          ctx.fill();
        }
      }

      // asfalto, cordoli, linee
      const semi = SEMI_PISTA;
      if (alto > 2.5) {
        // cordolo in due blocchi per segmento (≈3,5 m l'uno)
        const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, k: (a.k + b.k) / 2 };
        const pari = idx % 2 === 0;
        for (const lato of [-1, 1]) {
          const x0 = lato * semi;
          const x1 = lato * (semi + LARGHEZZA_CORDOLO);
          quad(a, m, x0, x1, pari ? '#d32f2f' : '#ffffff');
          quad(m, b, x0, x1, pari ? '#ffffff' : '#d32f2f');
        }
      } else if (alto > 0.3) {
        for (const lato of [-1, 1]) quad(a, b, lato * semi, lato * (semi + LARGHEZZA_CORDOLO), '#e57373');
      }
      quad(a, b, -semi, semi, idx % 2 ? '#4b4b4b' : '#474747');
      if (alto > 0.8) {
        quad(a, b, -1.6, 1.6, 'rgba(0,0,0,0.13)'); // traiettoria gommata
        quad(a, b, -semi, -semi + 0.15, '#f5f5f5'); // linea bianca di bordo pista
        quad(a, b, semi - 0.15, semi, '#f5f5f5');
      }

      // scenario (dal più lontano al più vicino, insieme alla pista)
      if (b.s.z < 900) disegnaScenario(ctx, c, a, b, idx, scena.tratti.get(idx), Math.abs(b.s.curva));
    }

    // monoposto: dietro -> ruote -> davanti
    // copia solo la fascia dello schermo occupata da ciascun livello
    const y0d = Math.floor(H * 0.35);
    ctx.drawImage(c.dietro, 0, y0d, W, Math.ceil(H * 0.45), 0, y0d, W, Math.ceil(H * 0.45));
    const sterzo = scena.sterzo || 0;
    disegnaRuota(ctx, v, -1, sterzo);
    disegnaRuota(ctx, v, 1, sterzo);
    const y0a = Math.floor(H * 0.36);
    ctx.drawImage(c.davanti, 0, y0a, W, H - y0a, 0, y0a, W, H - y0a);
  }

  function disegnaScenario(ctx, c, a, b, idx, tratto, curvaAss) {
    const k = b.k;
    const sprite = (img, xMondo, larghezzaMondo, altezzaMondo, yMondo = 0) => {
      const w = larghezzaMondo * k;
      if (w < 2) return;
      const h = altezzaMondo * k;
      const x = b.x + xMondo * k;
      if (x + w / 2 < 0 || x - w / 2 > c.v.W) return;
      ctx.drawImage(img, x - w / 2, b.y - yMondo * k - h, w, h);
    };

    const cartello = cartelliScena && cartelliScena.get(idx);
    if (cartello && b.s.z < 1400) disegnaCartello(ctx, b, cartello);
    if (tratto === 'tribuna') {
      disegnaTribunaSlice(ctx, a, b, idx);
      return;
    }
    if (curvaAss > 1.2) {
      // alberi oltre la barriera, densi e variati
      // da lontano bastano meno alberi: stessa sensazione di bosco, molti meno disegni
      if (idx % (b.s.z > 350 ? 6 : 2) === 0) {
        const r = hash(idx);
        const lato = r < 0.5 ? -1 : 1;
        sprite(c.sprite.alberi[Math.floor(r * 8) % 4], lato * (X_BARRIERA + 5 + r * 14), 6 + r * 4, 9 + r * 6);
        const r2 = hash(idx + 977);
        sprite(c.sprite.alberi[Math.floor(r2 * 8) % 4], -lato * (X_BARRIERA + 4 + r2 * 18), 6 + r2 * 4, 9 + r2 * 6);
      }
    } else if (idx % 5 === 0) {
      // cartelloni sui rettilinei, appena oltre la barriera
      const lato = idx % 10 === 0 ? -1 : 1;
      sprite(c.sprite.cartelloni[Math.floor(idx / 10) % 3], lato * (X_BARRIERA + 2.5), 7, 2.1);
    }
    if (curvaAss <= 1.2 && idx % 7 === 3 && b.s.z < 500) {
      const r = hash(idx + 31);
      sprite(c.sprite.alberi[Math.floor(r * 8) % 4], (r < 0.5 ? -1 : 1) * (X_BARRIERA + 22 + r * 25), 7, 11);
    }
  }

  /** Cartello di velocità consigliata prima delle curve (bordo sinistro). */
  function disegnaCartello(ctx, b, cartello) {
    const k = b.k;
    const larg = 2.6 * k;
    if (larg < 6) return;
    const alt = 1.9 * k;
    const x = b.x - (SEMI_PISTA + LARGHEZZA_CORDOLO + 2.5) * k;
    const yBase = b.y - 1.4 * k;
    ctx.fillStyle = '#4a4d54';
    ctx.fillRect(x - 0.08 * k, yBase, 0.16 * k, 1.4 * k);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(x - larg / 2, yBase - alt, larg, alt);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = Math.max(1, 0.12 * k);
    ctx.strokeRect(x - larg / 2, yBase - alt, larg, alt);
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(alt * 0.55)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
    ctx.fillText(String(cartello.velocita), x, yBase - alt * 0.6);
    const yF = yBase - alt * 0.2;
    const dir = cartello.direzione;
    ctx.beginPath();
    ctx.moveTo(x + dir * larg * 0.22, yF);
    ctx.lineTo(x - dir * larg * 0.22, yF - alt * 0.1);
    ctx.lineTo(x - dir * larg * 0.22, yF + alt * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  /** Una "fetta" di tribuna (tra due segmenti consecutivi): gradinata
   * inclinata continua, tetto e pubblico a puntini colorati. */
  function disegnaTribunaSlice(ctx, a, b, idx) {
    const lato = Math.floor(idx / 200) % 2 ? 1 : -1;
    const xF = lato * (X_BARRIERA + 4);
    const xR = lato * (X_BARRIERA + 16);
    const hF = 1.5;
    const hR = 12;
    const P = (q, x, h) => [q.x + x * q.k, q.y - h * q.k];
    const aF = P(a, xF, hF);
    const bF = P(b, xF, hF);
    const aR = P(a, xR, hR);
    const bR = P(b, xR, hR);
    if (Math.max(aF[0], bF[0], aR[0], bR[0]) < 0 || Math.min(aF[0], bF[0], aR[0], bR[0]) > ctx.canvas.width) return;
    // muretto frontale
    ctx.fillStyle = '#9e9e9e';
    poligono(ctx, [P(a, xF, 0), P(b, xF, 0), bF, aF]);
    ctx.fill();
    // gradinata
    ctx.fillStyle = idx % 2 ? '#e0e0e0' : '#d6d6d6';
    poligono(ctx, [aF, bF, bR, aR]);
    ctx.fill();
    // pubblico (stabile: posizioni ricavate dall'indice del segmento)
    const area = Math.abs((bR[0] - aF[0]) * (bF[1] - aR[1]));
    const n = Math.min(70, Math.max(2, Math.floor(area / 160)));
    const colori = ['#e53935', '#ffffff', '#00bcd4', '#fdd835', '#1e88e5', '#212121'];
    const dot = Math.max(1, 0.5 * b.k);
    for (let j = 0; j < n; j++) {
      const u = 0.08 + hash(idx * 131 + j) * 0.84; // lungo la pendenza
      const w = hash(idx * 197 + j * 7); // lungo la pista
      const fx = aF[0] + (bF[0] - aF[0]) * w;
      const fy = aF[1] + (bF[1] - aF[1]) * w;
      const rx = aR[0] + (bR[0] - aR[0]) * w;
      const ry = aR[1] + (bR[1] - aR[1]) * w;
      ctx.fillStyle = colori[(j + idx) % colori.length];
      ctx.fillRect(fx + (rx - fx) * u - dot / 2, fy + (ry - fy) * u - dot, dot, dot);
    }
    // tetto
    ctx.fillStyle = '#78909c';
    poligono(ctx, [aR, bR, P(b, xR - lato * 3, hR + 2.5), P(a, xR - lato * 3, hR + 2.5)]);
    ctx.fill();
  }

  return {
    disegna,
    invalida: () => {
      cache = null;
    },
  };
}

/**
 * Dove mettere le tribune: nei rettilinei lunghi (≥ 40 segmenti con curva
 * quasi nulla), per 30 segmenti a metà rettilineo. Calcolato una volta.
 */
export function calcolaTratti(numeroSegmenti, curvaDi) {
  const tratti = new Map();
  let inizio = null;
  for (let i = 0; i <= numeroSegmenti; i++) {
    const dritto = i < numeroSegmenti && Math.abs(curvaDi(i)) < 0.3;
    if (dritto && inizio === null) inizio = i;
    if (!dritto && inizio !== null) {
      const lunghezza = i - inizio;
      if (lunghezza >= 40) {
        const centro = inizio + Math.floor(lunghezza / 2);
        for (let j = centro - 15; j < centro + 15; j++) tratti.set(j, 'tribuna');
      }
      inizio = null;
    }
  }
  return tratti;
}
