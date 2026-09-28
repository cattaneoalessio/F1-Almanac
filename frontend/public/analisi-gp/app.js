// app.js — Dashboard "Analisi GP". Nessun bundler, nessuna dipendenza
// oltre a Plotly (caricato via <script> in index.html): file pensato per
// essere servito così com'è da GitHub Pages, senza build.

// ---------------------------------------------------------------------
// Stato
// ---------------------------------------------------------------------

/** @type {Array<{id:string, anno:number, round:number, nome_evento:string, paese:string, data:string}>} */
let indiceGp = [];

/** Dati del GP attualmente selezionato: meta, laps, telemetry — ricaricati
 * solo al cambio di Gran Premio, non al cambio di pilota (i due selettori
 * pilota si limitano a ridisegnare i grafici sugli stessi dati già in
 * memoria). */
let datiCorrenti = null;

/** 'gara' | 'qualifica' — quale sessione mostrare nel grafico telemetria. */
let sessioneTelemetria = "gara";

const elementi = {
  selettoreGp: document.getElementById("selezione-gp"),
  selettorePilota1: document.getElementById("selezione-pilota-1"),
  selettorePilota2: document.getElementById("selezione-pilota-2"),
  messaggioStato: document.getElementById("messaggio-stato"),
  contenutoGp: document.getElementById("contenuto-gp"),
  nomeEvento: document.getElementById("riepilogo-nome-evento"),
  dettagliEvento: document.getElementById("riepilogo-dettagli"),
  podio: document.getElementById("riepilogo-podio"),
  bottoniSessione: document.querySelectorAll(".bottone-sessione"),
};

// ---------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------

async function recuperaJson(url) {
  const risposta = await fetch(url);
  if (!risposta.ok) {
    throw new Error(`Impossibile caricare ${url} (HTTP ${risposta.status})`);
  }
  return risposta.json();
}

function mostraMessaggio(testo) {
  elementi.messaggioStato.textContent = testo;
  elementi.messaggioStato.hidden = false;
  elementi.contenutoGp.hidden = true;
}

function nascondiMessaggio() {
  elementi.messaggioStato.hidden = true;
  elementi.contenutoGp.hidden = false;
}

/** Colori standard delle mescole Pirelli, riconoscibili a chi segue la F1
 * — le stesse variabili CSS usate nel foglio di stile, lette qui per
 * tenerle in un unico posto invece di duplicare i valori esadecimali. */
const stileRadice = getComputedStyle(document.documentElement);
const COLORE_MESCOLA = {
  SOFT: stileRadice.getPropertyValue("--mescola-soft").trim(),
  MEDIUM: stileRadice.getPropertyValue("--mescola-medium").trim(),
  HARD: stileRadice.getPropertyValue("--mescola-hard").trim(),
  INTERMEDIATE: stileRadice.getPropertyValue("--mescola-intermediate").trim(),
  WET: stileRadice.getPropertyValue("--mescola-wet").trim(),
};
function coloreMescola(mescola) {
  return COLORE_MESCOLA[mescola] || stileRadice.getPropertyValue("--mescola-sconosciuta").trim();
}

/** Layout Plotly comune a tutti i grafici: sfondo trasparente (eredita il
 * carbon-1 del pannello sotto), testo chiaro. Passato come base e poi
 * esteso da ogni grafico coi propri assi/titoli. */
function layoutBase(extra) {
  return Object.assign({
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f4f4f6", size: 12 },
    margin: { l: 55, r: 20, t: 30, b: 45 },
    legend: { orientation: "h", y: -0.15 },
    hovermode: "x unified",
  }, extra);
}

const CONFIG_PLOTLY = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

// ---------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------

async function avvia() {
  try {
    indiceGp = await recuperaJson("data/index.json");
  } catch (errore) {
    console.error(errore);
    mostraMessaggio(
      "I dati non sono ancora disponibili: verranno caricati automaticamente dopo il prossimo Gran Premio."
    );
    return;
  }

  if (indiceGp.length === 0) {
    mostraMessaggio("Nessun Gran Premio disponibile ancora: i dati vengono caricati automaticamente dopo ogni gara.");
    return;
  }

  popolaSelettoreGp();
  elementi.selettoreGp.addEventListener("change", () => caricaGp(elementi.selettoreGp.value));
  elementi.selettorePilota1.addEventListener("change", ridisegnaTutto);
  elementi.selettorePilota2.addEventListener("change", ridisegnaTutto);
  elementi.bottoniSessione.forEach((bottone) => {
    bottone.addEventListener("click", () => {
      sessioneTelemetria = bottone.dataset.sessione;
      elementi.bottoniSessione.forEach((b) => b.classList.toggle("bottone-sessione--attivo", b === bottone));
      disegnaTelemetria();
    });
  });

  // L'indice è già ordinato dal più recente (vedi update_data.py,
  // aggiorna_indice): il primo elemento è l'ultimo GP disputato, il
  // default richiesto.
  await caricaGp(indiceGp[0].id);
}

function popolaSelettoreGp() {
  elementi.selettoreGp.innerHTML = "";
  for (const gp of indiceGp) {
    const opzione = document.createElement("option");
    opzione.value = gp.id;
    opzione.textContent = `${gp.nome_evento} (${gp.data})`;
    elementi.selettoreGp.appendChild(opzione);
  }
}

// ---------------------------------------------------------------------
// Caricamento di un GP
// ---------------------------------------------------------------------

async function caricaGp(id) {
  mostraMessaggio("Carico i dati del Gran Premio…");
  elementi.selettoreGp.value = id;

  try {
    const [meta, laps, telemetry] = await Promise.all([
      recuperaJson(`data/${id}/meta.json`),
      recuperaJson(`data/${id}/laps.json`),
      recuperaJson(`data/${id}/telemetry.json`),
    ]);
    datiCorrenti = { meta, laps, telemetry };
  } catch (errore) {
    console.error(errore);
    mostraMessaggio(`Errore nel caricare i dati di questo Gran Premio: ${errore.message}`);
    return;
  }

  disegnaRiepilogo();
  popolaSelettorePiloti();
  nascondiMessaggio();
  ridisegnaTutto();
}

function disegnaRiepilogo() {
  const { meta } = datiCorrenti;
  elementi.nomeEvento.textContent = meta.nome_evento;
  elementi.dettagliEvento.textContent = `${meta.localita}, ${meta.paese} — ${meta.data}`;

  elementi.podio.innerHTML = "";
  const primiTre = meta.piloti_gara.filter((p) => p.posizione !== null && p.posizione <= 3);
  for (const pilota of primiTre) {
    const voce = document.createElement("li");
    voce.innerHTML = `<span class="pos">P${pilota.posizione}</span> ${pilota.codice}`;
    voce.style.borderLeft = `3px solid ${pilota.colore_scuderia}`;
    elementi.podio.appendChild(voce);
  }
}

/** Popola i due menu piloti con l'elenco della GARA (è la sessione di
 * riferimento per il podio/posizioni), selezionando come default P1 e P2
 * come richiesto — a meno che i piloti scelti in precedenza esistano
 * ancora in questo nuovo GP, nel qual caso restano quelli (così cambiare
 * GP non fa perdere un confronto già impostato, se i piloti coincidono). */
function popolaSelettorePiloti() {
  const piloti = datiCorrenti.meta.piloti_gara;
  const precedente1 = elementi.selettorePilota1.value;
  const precedente2 = elementi.selettorePilota2.value;

  for (const select of [elementi.selettorePilota1, elementi.selettorePilota2]) {
    select.innerHTML = "";
    for (const pilota of piloti) {
      const opzione = document.createElement("option");
      opzione.value = pilota.codice;
      const posizione = pilota.posizione !== null ? `P${pilota.posizione}` : pilota.classificato;
      opzione.textContent = `${posizione} — ${pilota.nome}`;
      select.appendChild(opzione);
    }
  }

  const codici = piloti.map((p) => p.codice);
  const p1Default = piloti.find((p) => p.posizione === 1)?.codice ?? piloti[0]?.codice;
  const p2Default = piloti.find((p) => p.posizione === 2)?.codice ?? piloti[1]?.codice;

  elementi.selettorePilota1.value = codici.includes(precedente1) ? precedente1 : p1Default;
  elementi.selettorePilota2.value = codici.includes(precedente2) ? precedente2 : p2Default;
}

function pilotaSelezionato(numero) {
  const codice = numero === 1 ? elementi.selettorePilota1.value : elementi.selettorePilota2.value;
  const info =
    datiCorrenti.meta.piloti_gara.find((p) => p.codice === codice) ||
    datiCorrenti.meta.piloti_qualifica.find((p) => p.codice === codice);
  return { codice, colore: info?.colore_scuderia || "#cccccc", nome: info?.nome || codice };
}

/** Due compagni di squadra hanno lo stesso colore: senza un segno distintivo
 * le loro linee sarebbero indistinguibili (e confrontare due compagni è il
 * caso più comune). Se i colori coincidono, il secondo pilota è tratteggiato. */
function trattoSecondoPilota(pilota1, pilota2) {
  return pilota1.colore.toLowerCase() === pilota2.colore.toLowerCase() ? "dash" : "solid";
}

function ridisegnaTutto() {
  disegnaTelemetria();
  disegnaStint();
  disegnaTempiGiro();
}

// ---------------------------------------------------------------------
// 1. Telemetria comparativa (Velocità / Acceleratore / Freno / DRS)
// ---------------------------------------------------------------------

const CANALI_TELEMETRIA = [
  { chiave: "velocita_kmh", titolo: "Velocità (km/h)" },
  { chiave: "acceleratore_pct", titolo: "Acceleratore (%)" },
  { chiave: "freno_pct", titolo: "Freno" },
  { chiave: "drs_attivo", titolo: "DRS" },
];

function disegnaTelemetria() {
  const contenitoreId = "grafico-telemetria";
  const contenitore = document.getElementById(contenitoreId);
  const pilota1 = pilotaSelezionato(1);
  const pilota2 = pilotaSelezionato(2);
  const datiSessione = datiCorrenti.telemetry[sessioneTelemetria];

  const tel1 = datiSessione?.piloti?.[pilota1.codice];
  const tel2 = datiSessione?.piloti?.[pilota2.codice];

  if (!tel1 || !tel2) {
    Plotly.purge(contenitoreId);
    const mancante = !tel1 ? pilota1.codice : pilota2.codice;
    contenitore.innerHTML = `<p style="color:#9aa0ab;padding:2rem;text-align:center;">
      Telemetria non disponibile per ${mancante} in questa sessione.
    </p>`;
    return;
  }

  // 4 grafici impilati con lo stesso asse X (Distanza): i subplot Plotly
  // con "matches" sull'asse x fanno sì che zoomare su uno zoomi tutti
  // sullo stesso tratto di pista, come richiesto ("sovrapposti sul
  // grafico della distanza del circuito").
  const tracce = [];
  CANALI_TELEMETRIA.forEach((canale, indice) => {
    const suffisso = indice === 0 ? "" : String(indice + 1);
    tracce.push({
      x: tel1.distanza_m, y: tel1[canale.chiave], name: pilota1.codice,
      legendgroup: pilota1.codice, showlegend: indice === 0,
      xaxis: `x${suffisso}`, yaxis: `y${suffisso}`,
      line: { color: pilota1.colore, width: 2 }, type: "scattergl", mode: "lines",
    });
    tracce.push({
      x: tel2.distanza_m, y: tel2[canale.chiave], name: pilota2.codice,
      legendgroup: pilota2.codice, showlegend: indice === 0,
      xaxis: `x${suffisso}`, yaxis: `y${suffisso}`,
      line: { color: pilota2.colore, width: 2, dash: trattoSecondoPilota(pilota1, pilota2) }, type: "scattergl", mode: "lines",
    });
  });

  const layout = layoutBase({
    grid: { rows: 4, columns: 1, pattern: "coupled" },
    margin: { l: 55, r: 20, t: 10, b: 45 },
  });
  CANALI_TELEMETRIA.forEach((canale, indice) => {
    const suffisso = indice === 0 ? "" : String(indice + 1);
    const asseY = { title: { text: canale.titolo, font: { size: 11 } } };
    if (canale.chiave === "drs_attivo") {
      asseY.tickvals = [0, 1];
      asseY.ticktext = ["Off", "On"];
      asseY.range = [-0.2, 1.2];
      asseY.fixedrange = true;
    }
    layout[`yaxis${suffisso}`] = asseY;
    layout[`xaxis${suffisso}`] =
      indice === CANALI_TELEMETRIA.length - 1
        ? { title: { text: "Distanza (m)", font: { size: 11 } }, matches: "x" }
        : { matches: "x", showticklabels: false };
  });

  Plotly.react(contenitoreId, tracce, layout, CONFIG_PLOTLY);
}

// ---------------------------------------------------------------------
// 2. Strategie gomme (tutti i piloti, stint come barre orizzontali)
// ---------------------------------------------------------------------

function disegnaStint() {
  const contenitoreId = "grafico-stint";
  const giriGara = datiCorrenti.laps.gara;
  if (!giriGara || giriGara.length === 0) {
    Plotly.purge(contenitoreId);
    return;
  }

  // Raggruppo i giri per pilota+stint, per ricavare lunghezza e mescola di
  // ciascuno stint. L'ordine dei piloti sull'asse Y segue la posizione
  // finale in gara (il vincitore in alto), non l'ordine alfabetico.
  const ordinePiloti = [...datiCorrenti.meta.piloti_gara]
    .sort((a, b) => (a.posizione ?? 99) - (b.posizione ?? 99))
    .map((p) => p.codice);

  const stintPerPilota = new Map();
  for (const giro of giriGara) {
    if (giro.stint === null) continue;
    if (!stintPerPilota.has(giro.pilota)) stintPerPilota.set(giro.pilota, new Map());
    const stints = stintPerPilota.get(giro.pilota);
    if (!stints.has(giro.stint)) {
      stints.set(giro.stint, { mescola: giro.mescola, giroInizio: giro.giro, giroFine: giro.giro });
    } else {
      const s = stints.get(giro.stint);
      s.giroInizio = Math.min(s.giroInizio, giro.giro);
      s.giroFine = Math.max(s.giroFine, giro.giro);
    }
  }

  // Un trace "bar" orizzontale per mescola (non uno per stint): così la
  // legenda mostra al massimo 5 voci (le mescole) invece di una voce per
  // ogni singolo cambio gomme di ogni pilota.
  const mescoleViste = new Set();
  const tracce = [];
  for (const [pilota, stints] of stintPerPilota) {
    for (const [numeroStint, info] of [...stints.entries()].sort((a, b) => a[0] - b[0])) {
      const lunghezza = info.giroFine - info.giroInizio + 1;
      const giaInLegenda = mescoleViste.has(info.mescola);
      mescoleViste.add(info.mescola);
      tracce.push({
        type: "bar",
        orientation: "h",
        y: [pilota],
        x: [lunghezza],
        base: [info.giroInizio - 1],
        name: info.mescola,
        legendgroup: info.mescola,
        showlegend: !giaInLegenda,
        marker: { color: coloreMescola(info.mescola), line: { color: "#0b0d10", width: 1 } },
        hovertemplate: `${pilota} — ${info.mescola}<br>Giri ${info.giroInizio}-${info.giroFine} (${lunghezza} giri)<extra></extra>`,
      });
    }
  }

  const layout = layoutBase({
    barmode: "stack",
    xaxis: { title: { text: "Giro" } },
    yaxis: { categoryorder: "array", categoryarray: [...ordinePiloti].reverse(), automargin: true },
    margin: { l: 70, r: 20, t: 10, b: 45 },
  });

  Plotly.react(contenitoreId, tracce, layout, CONFIG_PLOTLY);
}

// ---------------------------------------------------------------------
// 3. Confronto tempi sul giro — Gara
// ---------------------------------------------------------------------

function disegnaTempiGiro() {
  const contenitoreId = "grafico-giri";
  const pilota1 = pilotaSelezionato(1);
  const pilota2 = pilotaSelezionato(2);
  const giriGara = datiCorrenti.laps.gara;

  function serieDiTempi(codice) {
    const giriPilota = giriGara
      .filter((g) => g.pilota === codice && g.tempo_giro_s !== null)
      .sort((a, b) => a.giro - b.giro);
    return { x: giriPilota.map((g) => g.giro), y: giriPilota.map((g) => g.tempo_giro_s) };
  }

  const serie1 = serieDiTempi(pilota1.codice);
  const serie2 = serieDiTempi(pilota2.codice);

  const tracce = [
    { ...serie1, name: pilota1.codice, mode: "lines+markers", line: { color: pilota1.colore, width: 2 }, marker: { size: 4 } },
    { ...serie2, name: pilota2.codice, mode: "lines+markers", line: { color: pilota2.colore, width: 2, dash: trattoSecondoPilota(pilota1, pilota2) }, marker: { size: 4 } },
  ];

  const layout = layoutBase({
    xaxis: { title: { text: "Giro" } },
    // I tempi sul giro F1 vanno tipicamente da poco più di un minuto a
    // due minuti: mostriamo come mm:ss invece dei secondi grezzi, molto
    // più leggibile per chi guarda il grafico.
    yaxis: {
      title: { text: "Tempo sul giro" },
      tickformat: "%M:%S",
      // Plotly formatta date/orari, non numeri puri: i secondi vanno
      // convertiti in un timestamp (qui: giorno 0 + N secondi) solo per
      // la visualizzazione dell'asse, senza toccare i dati sorgente.
    },
  });
  tracce.forEach((traccia) => {
    traccia.y = traccia.y.map((secondi) => new Date(secondi * 1000));
  });

  Plotly.react(contenitoreId, tracce, layout, CONFIG_PLOTLY);
}

// ---------------------------------------------------------------------

avvia();
