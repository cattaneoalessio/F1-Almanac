/**
 * Infografiche.jsx — disegni originali (SVG) per le lezioni di «Impara».
 * Nessuna immagine esterna, nessun marchio o livrea reale: sono schemi
 * didattici. I colori vengono dal tema del sito (variabili CSS), quindi
 * restano leggibili in chiaro e in scuro.
 */
import './Infografiche.css';

const C = {
  testo: 'var(--text-primary)',
  grigio: 'var(--text-gray)',
  linea: 'var(--line)',
  rosso: 'var(--accent-red)',
  oro: 'var(--accent-gold)',
  ciano: 'var(--accent-cyan)',
  scocca: 'var(--bg-card-raised)',
};

function Etichetta({ x, y, testo, verso = 'start', dx = 0, dy = 0, x2, y2, colore = C.oro }) {
  return (
    <g>
      {x2 !== undefined && <line x1={x} y1={y} x2={x2} y2={y2} stroke={colore} strokeWidth="1.5" />}
      {x2 !== undefined && <circle cx={x2} cy={y2} r="3.5" fill={colore} />}
      <text x={x + dx} y={y + dy} textAnchor={verso} className="infografica__etichetta">
        {testo}
      </text>
    </g>
  );
}

function Cornice({ titolo, children, viewBox = '0 0 800 420' }) {
  return (
    <figure className="infografica">
      <svg viewBox={viewBox} role="img" aria-label={titolo}>
        <title>{titolo}</title>
        {children}
      </svg>
      <figcaption>{titolo} — illustrazione originale Monoposto.io</figcaption>
    </figure>
  );
}

/** Monoposto vista dall'alto, generica, con le parti principali. */
function Esploso() {
  return (
    <Cornice titolo="Le parti di una monoposto, vista dall'alto">
      {/* ruote */}
      {[
        [210, 95], [210, 265], [560, 85], [560, 275],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={x > 400 ? 90 : 75} height={x > 400 ? 60 : 50} rx="10" fill="#111" stroke={C.linea} />
      ))}
      {/* ala anteriore */}
      <rect x="90" y="110" width="40" height="200" rx="4" fill={C.grigio} opacity="0.7" />
      {/* musetto + scocca */}
      <path d="M130 195 L250 182 L330 170 L470 160 L620 168 L660 180 L660 240 L620 252 L470 260 L330 250 L250 238 L130 225 Z" fill={C.rosso} opacity="0.9" />
      {/* pance */}
      <path d="M360 160 Q420 120 520 125 L560 160 Z" fill={C.rosso} opacity="0.65" />
      <path d="M360 260 Q420 300 520 295 L560 260 Z" fill={C.rosso} opacity="0.65" />
      {/* abitacolo + halo */}
      <ellipse cx="370" cy="210" rx="40" ry="22" fill="#0b0c10" />
      <path d="M335 210 Q350 180 395 186 M335 210 Q350 240 395 234" stroke={C.grigio} strokeWidth="6" fill="none" />
      <circle cx="372" cy="210" r="13" fill={C.oro} />
      {/* power unit */}
      <rect x="450" y="185" width="110" height="50" rx="6" fill="none" stroke={C.ciano} strokeWidth="2" strokeDasharray="6 4" />
      {/* cambio */}
      <rect x="575" y="195" width="60" height="30" rx="4" fill="none" stroke={C.ciano} strokeWidth="2" strokeDasharray="6 4" />
      {/* ala posteriore */}
      <rect x="680" y="140" width="34" height="140" rx="4" fill={C.grigio} opacity="0.7" />
      <Etichetta x={110} y={60} x2={110} y2={110} testo="Ala anteriore" verso="middle" />
      <Etichetta x={250} y={360} x2={250} y2={235} testo="Musetto" verso="middle" />
      <Etichetta x={372} y={60} x2={372} y2={195} testo="Abitacolo e halo" verso="middle" />
      <Etichetta x={470} y={360} x2={470} y2={290} testo="Pance (radiatori)" verso="middle" />
      <Etichetta x={505} y={60} x2={505} y2={185} testo="Power unit" verso="middle" />
      <Etichetta x={605} y={360} x2={605} y2={225} testo="Cambio" verso="middle" />
      <Etichetta x={697} y={60} x2={697} y2={140} testo="Ala posteriore" verso="middle" />
      <text x="400" y="405" textAnchor="middle" className="infografica__nota">
        Passo massimo 3.400 mm · larghezza massima 1.900 mm · peso minimo 768 kg (regole 2026)
      </text>
    </Cornice>
  );
}

/** Potenza: termico contro elettrico, 2025 vs 2026, e flusso dell'energia. */
function PowerUnit() {
  const scala = 0.55; // px per kW
  const barra = (y, etichetta, ice, elettrico) => (
    <g>
      <text x="40" y={y + 22} className="infografica__etichetta">{etichetta}</text>
      <rect x="150" y={y} width={ice * scala} height="34" fill={C.rosso} />
      <rect x={150 + ice * scala} y={y} width={elettrico * scala} height="34" fill={C.ciano} />
      <text x={150 + (ice * scala) / 2} y={y + 23} textAnchor="middle" className="infografica__valore">{ice} kW</text>
      <text x={150 + ice * scala + (elettrico * scala) / 2} y={y + 23} textAnchor="middle" className="infografica__valore infografica__valore--scuro">{elettrico} kW</text>
    </g>
  );
  return (
    <Cornice titolo="Power unit: come si divide la potenza">
      {barra(40, 'Fino al 2025', 540, 120)}
      {barra(95, 'Dal 2026', 400, 350)}
      <rect x="150" y="150" width="14" height="14" fill={C.rosso} />
      <text x="170" y="162" className="infografica__nota">Motore termico V6 1,6 l turbo</text>
      <rect x="400" y="150" width="14" height="14" fill={C.ciano} />
      <text x="420" y="162" className="infografica__nota">Elettrico (MGU-K)</text>
      {/* schema flusso */}
      {[
        [70, 'Carburante sostenibile', C.oro],
        [250, 'Motore termico', C.rosso],
        [430, 'Trasmissione e ruote', C.testo],
      ].map(([x, t, col]) => (
        <g key={t}>
          <rect x={x} y="225" width="150" height="56" rx="8" fill="none" stroke={col} strokeWidth="2" />
          <text x={x + 75} y="258" textAnchor="middle" className="infografica__etichetta">{t}</text>
        </g>
      ))}
      <rect x="430" y="330" width="150" height="56" rx="8" fill="none" stroke={C.ciano} strokeWidth="2" />
      <text x="505" y="363" textAnchor="middle" className="infografica__etichetta">MGU-K</text>
      <rect x="640" y="330" width="130" height="56" rx="8" fill="none" stroke={C.ciano} strokeWidth="2" />
      <text x="705" y="363" textAnchor="middle" className="infografica__etichetta">Batteria</text>
      <defs>
        <marker id="freccia-pu" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={C.grigio} />
        </marker>
      </defs>
      <line x1="220" y1="253" x2="246" y2="253" stroke={C.grigio} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <line x1="400" y1="253" x2="426" y2="253" stroke={C.grigio} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <line x1="490" y1="285" x2="490" y2="326" stroke={C.ciano} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <line x1="520" y1="326" x2="520" y2="285" stroke={C.ciano} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <line x1="583" y1="350" x2="636" y2="350" stroke={C.ciano} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <line x1="636" y1="368" x2="583" y2="368" stroke={C.ciano} strokeWidth="2" markerEnd="url(#freccia-pu)" />
      <text x="420" y="310" textAnchor="end" className="infografica__nota">frenata: recupera</text>
      <text x="530" y="310" className="infografica__nota">accelerazione: spinge</text>
      <text x="40" y="405" className="infografica__nota">MGU-H eliminato dal 2026 · recupero fino a circa 8,5 MJ per giro</text>
    </Cornice>
  );
}

/** Sezione laterale con flussi, carico e le due modalità delle ali. */
function Aerodinamica() {
  return (
    <Cornice titolo="Aerodinamica: carico, effetto suolo e ali attive">
      <line x1="40" y1="300" x2="760" y2="300" stroke={C.grigio} strokeWidth="2" />
      {/* profilo auto laterale */}
      <path d="M90 280 L150 270 L300 255 L340 230 L390 225 L420 250 L600 250 L640 230 L690 230 L700 280 Z" fill={C.rosso} opacity="0.85" />
      <rect x="70" y="270" width="70" height="10" fill={C.grigio} />
      <rect x="660" y="190" width="60" height="10" fill={C.grigio} />
      <rect x="660" y="208" width="60" height="8" fill={C.grigio} opacity="0.7" />
      <circle cx="190" cy="275" r="30" fill="#111" />
      <circle cx="600" cy="272" r="33" fill="#111" />
      {/* flussi */}
      {[150, 175, 200].map((y) => (
        <path key={y} d={`M20 ${y} C 300 ${y - 10}, 500 ${y - 20}, 780 ${y}`} stroke={C.ciano} strokeWidth="1.5" fill="none" opacity="0.6" />
      ))}
      <path d="M20 292 C 250 292, 400 294, 560 292 S 720 270, 780 255" stroke={C.ciano} strokeWidth="2.5" fill="none" />
      <text x="330" y="318" className="infografica__nota">sotto il fondo l'aria accelera: pressione più bassa</text>
      {/* frecce carico */}
      {[160, 380, 690].map((x) => (
        <g key={x}>
          <line x1={x} y1="110" x2={x} y2="165" stroke={C.oro} strokeWidth="4" />
          <path d={`M${x - 9} 160 L${x} 178 L${x + 9} 160 Z`} fill={C.oro} />
        </g>
      ))}
      <text x="400" y="95" textAnchor="middle" className="infografica__etichetta">Carico aerodinamico: spinge l'auto verso l'asfalto</text>
      {/* modalità */}
      <g transform="translate(60 340)">
        <text x="0" y="16" className="infografica__etichetta">Corner Mode</text>
        <path d="M150 20 L230 4" stroke={C.oro} strokeWidth="6" />
        <text x="250" y="16" className="infografica__nota">ali inclinate: più carico in curva</text>
      </g>
      <g transform="translate(60 375)">
        <text x="0" y="16" className="infografica__etichetta">Straight Mode</text>
        <path d="M150 14 L230 12" stroke={C.ciano} strokeWidth="6" />
        <text x="250" y="16" className="infografica__nota">ali più piatte: meno resistenza in rettilineo (dal 2026)</text>
      </g>
    </Cornice>
  );
}

/** Decelerazione e temperatura: F1 contro auto stradale. */
function Freni() {
  const riga = (y, etichetta, f1, auto, max, unita) => (
    <g>
      <text x="40" y={y - 10} className="infografica__etichetta">{etichetta}</text>
      <rect x="40" y={y} width={(f1 / max) * 600} height="26" fill={C.rosso} />
      <text x={50 + (f1 / max) * 600} y={y + 19} className="infografica__valore-esterno">F1: {f1} {unita}</text>
      <rect x="40" y={y + 32} width={(auto / max) * 600} height="26" fill={C.grigio} />
      <text x={50 + (auto / max) * 600} y={y + 51} className="infografica__valore-esterno">Auto stradale: {auto} {unita}</text>
    </g>
  );
  return (
    <Cornice titolo="Freni: quanto frena una F1">
      {riga(70, 'Decelerazione massima (g)', 5, 1, 6, 'g')}
      {riga(210, 'Temperatura dei dischi (indicativa)', 1000, 400, 1200, '°C')}
      <text x="40" y="340" className="infografica__nota">5 g: il pilota è spinto in avanti con una forza pari a cinque volte il suo peso.</text>
      <text x="40" y="365" className="infografica__nota">Dischi e pastiglie in carbonio-carbonio funzionano bene solo molto caldi.</text>
      <text x="40" y="390" className="infografica__nota">Valori indicativi: dipendono da pista, velocità e modello di auto.</text>
    </Cornice>
  );
}

function Cambio() {
  return (
    <Cornice titolo="Cambio: 8 marce senza interruzione di spinta">
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={60 + i * 85} y={260 - i * 26} width="70" height={40 + i * 26} rx="4" fill={i === 7 ? C.oro : C.rosso} opacity={0.5 + i * 0.06} />
          <text x={95 + i * 85} y="330" textAnchor="middle" className="infografica__etichetta">{i + 1}ª</text>
        </g>
      ))}
      <text x="60" y="80" className="infografica__etichetta">Ogni marcia copre un tratto di velocità; l'ottava porta al massimo</text>
      <text x="60" y="370" className="infografica__nota">Palette dietro il volante: destra per salire, sinistra per scendere</text>
      <text x="60" y="395" className="infografica__nota">Seamless: la marcia nuova entra prima che la vecchia esca → nessun buco di spinta</text>
    </Cornice>
  );
}

/** Volante schematico generico (non riproduce quello di nessuna squadra). */
function Volante() {
  return (
    <Cornice titolo="Volante: schema generico dei comandi">
      <path d="M220 110 Q200 100 180 120 L150 300 Q160 340 210 330 L260 300 L540 300 L590 330 Q640 340 650 300 L620 120 Q600 100 580 110 Z" fill={C.scocca} stroke={C.linea} strokeWidth="2" />
      <rect x="330" y="130" width="140" height="80" rx="6" fill="#0b0c10" stroke={C.ciano} />
      <text x="400" y="178" textAnchor="middle" className="infografica__valore">DISPLAY</text>
      {[[260, 140], [260, 190], [540, 140], [540, 190]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="14" fill={C.rosso} />
      ))}
      {[[300, 260], [400, 260], [500, 260]].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="18" fill="none" stroke={C.oro} strokeWidth="3" />
          <line x1={x} y1={y} x2={x} y2={y - 14} stroke={C.oro} strokeWidth="3" />
        </g>
      ))}
      <Etichetta x={720} y={150} x2={472} y2={170} testo="Marcia, tempi, avvisi" verso="end" dy={-8} />
      <Etichetta x={60} y={140} x2={246} y2={140} testo="Radio, box, limitatore" dy={-8} />
      <Etichetta x={720} y={235} x2={518} y2={262} testo="Manopole: freni, energia, motore" verso="end" dy={-8} />
      <Etichetta x={60} y={380} x2={180} y2={300} testo="Impugnature (dietro: palette e frizione)" dy={-8} />
    </Cornice>
  );
}

function Gomme() {
  const gomme = [
    ['Soft', '#e10600', 'più veloce, dura meno'],
    ['Medium', '#f5c400', 'equilibrio'],
    ['Hard', '#f5f5f5', 'più lenta, dura di più'],
    ['Intermedia', '#2e9d4b', 'pista umida'],
    ['Full Wet', '#1e6fd9', 'pioggia forte'],
  ];
  return (
    <Cornice titolo="Gomme: i colori delle mescole">
      {gomme.map(([nome, col, nota], i) => (
        <g key={nome} transform={`translate(${80 + i * 145} 170)`}>
          <circle cx="0" cy="0" r="58" fill="#141414" />
          <circle cx="0" cy="0" r="46" fill="none" stroke={col} strokeWidth="5" />
          <circle cx="0" cy="0" r="30" fill="#2a2a2e" />
          <text x="0" y="95" textAnchor="middle" className="infografica__etichetta">{nome}</text>
          <text x="0" y="118" textAnchor="middle" className="infografica__nota">{nota}</text>
        </g>
      ))}
      <text x="40" y="60" className="infografica__etichetta">Asciutto: 3 mescole per weekend, scelte tra le sei Pirelli (C1–C6)</text>
      <line x1="40" y1="345" x2="420" y2="345" stroke={C.linea} />
      <text x="40" y="380" className="infografica__nota">Slick (lisce) per l'asciutto · scolpite per la pioggia · cerchi da 18"</text>
    </Cornice>
  );
}

function Sicurezza() {
  return (
    <Cornice titolo="Sicurezza: le protezioni del pilota">
      <path d="M120 300 L640 300 L660 250 L520 230 L420 160 L300 160 L250 230 L110 250 Z" fill={C.scocca} stroke={C.linea} strokeWidth="2" />
      <path d="M250 230 L300 160 L420 160 L470 230 Z" fill="none" stroke={C.rosso} strokeWidth="4" />
      <path d="M290 175 Q360 110 450 165" fill="none" stroke={C.grigio} strokeWidth="10" strokeLinecap="round" />
      <circle cx="365" cy="190" r="22" fill={C.oro} />
      <rect x="430" y="120" width="40" height="40" rx="4" fill="none" stroke={C.ciano} strokeWidth="3" />
      <Etichetta x={180} y={110} x2={320} y2={150} testo="Halo in titanio (~7 kg)" verso="end" dy={-8} />
      <Etichetta x={640} y={110} x2={470} y2={130} testo="Roll hoop" dy={-8} />
      <Etichetta x={180} y={360} x2={270} y2={245} testo="Cellula di sopravvivenza" verso="end" dy={-8} />
      <Etichetta x={620} y={360} x2={385} y2={200} testo="Casco e collare HANS" dy={-8} />
      <text x="400" y="400" textAnchor="middle" className="infografica__nota">L'halo regge 116 kN in verticale: circa 12 tonnellate</text>
    </Cornice>
  );
}

function Sospensioni() {
  return (
    <Cornice titolo="Sospensioni: schema push-rod (vista frontale)">
      <rect x="320" y="140" width="160" height="140" rx="10" fill={C.scocca} stroke={C.linea} strokeWidth="2" />
      <rect x="610" y="150" width="70" height="150" rx="12" fill="#141414" />
      <rect x="590" y="190" width="20" height="70" fill={C.grigio} />
      <line x1="480" y1="170" x2="590" y2="195" stroke={C.testo} strokeWidth="5" />
      <line x1="480" y1="250" x2="590" y2="255" stroke={C.testo} strokeWidth="5" />
      <line x1="585" y1="255" x2="470" y2="160" stroke={C.oro} strokeWidth="5" />
      <rect x="395" y="150" width="70" height="22" rx="4" fill={C.ciano} />
      <Etichetta x={720} y={110} x2={540} y2={182} testo="Triangolo superiore" verso="end" dy={-8} />
      <Etichetta x={720} y={340} x2={540} y2={253} testo="Triangolo inferiore" verso="end" dy={-8} />
      <Etichetta x={150} y={120} x2={500} y2={195} testo="Push-rod: spinge" dy={-8} />
      <Etichetta x={150} y={340} x2={420} y2={165} testo="Molla e ammortizzatore, dentro la scocca" dy={-8} />
    </Cornice>
  );
}

const DISEGNI = {
  esploso: Esploso,
  powerUnit: PowerUnit,
  aerodinamica: Aerodinamica,
  freni: Freni,
  cambio: Cambio,
  volante: Volante,
  gomme: Gomme,
  sicurezza: Sicurezza,
  sospensioni: Sospensioni,
};

export default function Infografica({ nome }) {
  const Disegno = DISEGNI[nome];
  return Disegno ? <Disegno /> : null;
}
