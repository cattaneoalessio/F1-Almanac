/**
 * analisiGrafici.js — costruisce i dati e il layout dei tre grafici della
 * pagina Analisi (telemetria, strategie gomme, tempi sul giro) a partire dai
 * JSON prodotti da analisi-gp/scripts/update_data.py. Funzioni pure, senza
 * React: la vista si limita a passarle a <PlotlyChart>.
 */
import { TYRE_COLORS } from '../data/teamColors.js';

const COLORE_TESTO = '#e8eaed';
const COLORE_GRIGLIA = 'rgba(255, 255, 255, 0.10)';
const COLORE_MESCOLA_SCONOSCIUTA = '#6b7280';

export function coloreMescola(mescola) {
  return TYRE_COLORS[String(mescola || '').toLowerCase()] || COLORE_MESCOLA_SCONOSCIUTA;
}

/** Due compagni di squadra hanno lo stesso colore: senza un segno distintivo
 * le loro linee sarebbero indistinguibili (ed è il confronto più comune).
 * Se i colori coincidono, il secondo pilota è tratteggiato. */
export function trattoSecondoPilota(colore1, colore2) {
  return String(colore1).toLowerCase() === String(colore2).toLowerCase() ? 'dash' : 'solid';
}

function assi(extra = {}) {
  return { gridcolor: COLORE_GRIGLIA, zeroline: false, linecolor: COLORE_GRIGLIA, ...extra };
}

function layoutBase(extra) {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: COLORE_TESTO, size: 12 },
    legend: { orientation: 'h', y: -0.12 },
    hovermode: 'x unified',
    ...extra,
  };
}

// Canali della telemetria, dall'alto in basso. `chiave` = campo del JSON.
export const CANALI_TELEMETRIA = [
  { chiave: 'velocita_kmh', titolo: 'Velocità (km/h)' },
  { chiave: 'acceleratore_pct', titolo: 'Acceleratore (%)' },
  { chiave: 'freno_pct', titolo: 'Freno' },
  { chiave: 'drs_attivo', titolo: 'DRS' },
];

/**
 * Telemetria di due piloti sovrapposta per distanza percorsa: 4 pannelli
 * impilati che condividono l'asse X (zoomare su uno zooma tutti).
 * Ritorna { ok: false, mancante } se uno dei due non ha telemetria.
 */
export function costruisciTelemetria(sessione, pilota1, pilota2) {
  const tel1 = sessione?.piloti?.[pilota1.codice];
  const tel2 = sessione?.piloti?.[pilota2.codice];
  if (!tel1 || !tel2) {
    return { ok: false, mancante: !tel1 ? pilota1.codice : pilota2.codice };
  }

  const tratto = trattoSecondoPilota(pilota1.colore, pilota2.colore);
  const dati = [];
  CANALI_TELEMETRIA.forEach((canale, i) => {
    const n = i === 0 ? '' : String(i + 1);
    dati.push({
      x: tel1.distanza_m, y: tel1[canale.chiave], name: pilota1.codice, legendgroup: pilota1.codice,
      showlegend: i === 0, xaxis: `x${n}`, yaxis: `y${n}`, type: 'scatter', mode: 'lines',
      line: { color: pilota1.colore, width: 2 },
    });
    dati.push({
      x: tel2.distanza_m, y: tel2[canale.chiave], name: pilota2.codice, legendgroup: pilota2.codice,
      showlegend: i === 0, xaxis: `x${n}`, yaxis: `y${n}`, type: 'scatter', mode: 'lines',
      line: { color: pilota2.colore, width: 2, dash: tratto },
    });
  });

  // 4 righe con domini espliciti; l'asse X visibile è solo quello in basso.
  const domini = [[0.77, 1], [0.52, 0.73], [0.27, 0.48], [0.02, 0.23]];
  const layout = layoutBase({ margin: { l: 60, r: 20, t: 10, b: 60 }, legend: { orientation: 'h', y: -0.08 } });
  CANALI_TELEMETRIA.forEach((canale, i) => {
    const n = i === 0 ? '' : String(i + 1);
    const ultimo = i === CANALI_TELEMETRIA.length - 1;
    const asseY = assi({ domain: domini[i], anchor: `x${n}`, title: { text: canale.titolo, font: { size: 11 } } });
    if (canale.chiave === 'drs_attivo') {
      Object.assign(asseY, { tickvals: [0, 1], ticktext: ['Off', 'On'], range: [-0.2, 1.2], fixedrange: true });
    }
    layout[`yaxis${n}`] = asseY;
    layout[`xaxis${n}`] = assi({
      anchor: `y${n}`,
      showticklabels: ultimo,
      ...(i > 0 ? { matches: 'x' } : {}),
      ...(ultimo ? { title: { text: 'Distanza (m)', font: { size: 11 } } } : {}),
    });
  });
  return { ok: true, dati, layout };
}

/**
 * Strategie gomme di tutti i piloti: una barra per stint (lunghezza = giri),
 * colorata per mescola, con i piloti ordinati per posizione finale.
 */
export function costruisciStint(giriGara, pilotiGara) {
  if (!giriGara || giriGara.length === 0) return null;

  const ordine = [...pilotiGara]
    .sort((a, b) => (a.posizione ?? 99) - (b.posizione ?? 99))
    .map((p) => p.codice);

  const stintPerPilota = new Map();
  for (const giro of giriGara) {
    if (giro.stint === null || giro.stint === undefined) continue;
    if (!stintPerPilota.has(giro.pilota)) stintPerPilota.set(giro.pilota, new Map());
    const stint = stintPerPilota.get(giro.pilota);
    const attuale = stint.get(giro.stint);
    if (!attuale) stint.set(giro.stint, { mescola: giro.mescola, inizio: giro.giro, fine: giro.giro });
    else {
      attuale.inizio = Math.min(attuale.inizio, giro.giro);
      attuale.fine = Math.max(attuale.fine, giro.giro);
    }
  }
  if (stintPerPilota.size === 0) return null;

  // Una barra per stint, ma la legenda ha una voce sola per mescola.
  const mescoleInLegenda = new Set();
  const dati = [];
  for (const [pilota, stint] of stintPerPilota) {
    for (const [, s] of [...stint.entries()].sort((a, b) => a[0] - b[0])) {
      const lunghezza = s.fine - s.inizio + 1;
      const nome = s.mescola || 'N/D';
      const inLegenda = mescoleInLegenda.has(nome);
      mescoleInLegenda.add(nome);
      dati.push({
        type: 'bar', orientation: 'h', y: [pilota], x: [lunghezza], base: [s.inizio - 1],
        name: nome, legendgroup: nome, showlegend: !inLegenda,
        marker: { color: coloreMescola(s.mescola), line: { color: '#0b0c10', width: 1 } },
        hovertemplate: `${pilota} — ${nome}<br>Giri ${s.inizio}-${s.fine} (${lunghezza} giri)<extra></extra>`,
      });
    }
  }
  const layout = layoutBase({
    barmode: 'stack',
    hovermode: 'closest',
    margin: { l: 60, r: 20, t: 10, b: 60 },
    xaxis: assi({ title: { text: 'Giro' } }),
    yaxis: assi({ categoryorder: 'array', categoryarray: [...ordine].reverse(), automargin: true }),
  });
  return { dati, layout };
}

/** Tempo di ogni giro di gara per due piloti (asse in minuti:secondi). */
export function costruisciTempiGiro(giriGara, pilota1, pilota2) {
  const tratto = trattoSecondoPilota(pilota1.colore, pilota2.colore);
  const serie = (pilota, dash) => {
    const giri = (giriGara || [])
      .filter((g) => g.pilota === pilota.codice && g.tempo_giro_s !== null && g.tempo_giro_s !== undefined)
      .sort((a, b) => a.giro - b.giro);
    return {
      x: giri.map((g) => g.giro),
      // Plotly formatta bene le date, non i numeri "mm:ss": i secondi diventano
      // un istante (solo per l'asse), senza toccare i dati di origine.
      y: giri.map((g) => new Date(g.tempo_giro_s * 1000)),
      name: pilota.codice, mode: 'lines+markers', type: 'scatter',
      line: { color: pilota.colore, width: 2, ...(dash ? { dash } : {}) }, marker: { size: 4 },
    };
  };
  const dati = [serie(pilota1), serie(pilota2, tratto)];
  const layout = layoutBase({
    margin: { l: 70, r: 20, t: 10, b: 60 },
    xaxis: assi({ title: { text: 'Giro' } }),
    yaxis: assi({ title: { text: 'Tempo sul giro' }, tickformat: '%M:%S', hoverformat: '%M:%S.%L' }),
  });
  return { dati, layout };
}
