import { Link } from 'react-router-dom';
import { useState } from 'react';
import './IdolSennaView.css';

/**
 * IdolSennaView (/idols/senna) — sottopagina arricchita di Ayrton
 * Senna, prima applicazione concreta del piano editoriale discusso in
 * chat (data journalism + UI/UX per la sezione Idols).
 *
 * TESTO: quello fornito dall'utente per il proprio sito, riportato
 * integralmente (non materiale di terzi da centellinare) — spezzato
 * nei punti individuati per inserire gli elementi visivi.
 *
 * NUMERI: tutti verificati con ricerca prima di scriverli (non a
 * memoria), fonti incrociate Wikipedia/statsF1/siti stats F1 dedicati:
 * - Senna: 161 GP, 41 vittorie, 65 pole, 19 giri veloci, 80 podi, 3
 *   titoli (1988/1990/1991), 614 punti.
 * - Prost: 199 GP, 51 vittorie, 33 pole, 41 giri veloci, 106 podi, 4
 *   titoli (1985/1986/1989/1993), 798.5 punti.
 * - Monaco: record di Senna (6 vittorie) ANCORA attuale nel 2026,
 *   verificato con una ricerca specifica, non dato per scontato.
 * - Donington '93: CORRETTO un errore nel testo originale ("cinque
 *   sorpassi" — le fonti più solide, incluso il sito ufficiale di
 *   Senna, confermano 4 sorpassi, dal 5° al 1° posto).
 * - Paradosso 1988: Prost totalizzò più punti in pista di Senna quel
 *   anno (105 contro 94 grezzi, 87 contro 90 dopo lo scarto dei
 *   risultati peggiori) ma perse il titolo per il minor numero di
 *   vittorie (7 contro 8) — verificato su più fonti indipendenti.
 * - Instituto Ayrton Senna: "36 milioni" di studenti e insegnanti
 *   formati dal 1994 è il numero più solido trovato (fonte RSI,
 *   2024) — non un dato in tempo reale, ma non lasciato vuoto/inventato.
 *
 * FOTO: nessuna, stesso motivo già discusso per la griglia Idols — il
 * progetto verifica le licenze immagine file per file, non è una
 * scelta che si fa dentro a un componente. I punti dove andrebbe
 * un'immagine sono commentati esplicitamente nel JSX sotto.
 */

function BoxStatistica({ numero, etichetta, nota }) {
  return (
    <div className="idol-senna__stat-box">
      <span className="idol-senna__stat-numero">{numero}</span>
      <span className="idol-senna__stat-etichetta">{etichetta}</span>
      {nota && <span className="idol-senna__stat-nota">{nota}</span>}
    </div>
  );
}

function Citazione({ children, attribuzione }) {
  return (
    <figure className="idol-senna__citazione">
      <blockquote>&ldquo;{children}&rdquo;</blockquote>
      {attribuzione && <figcaption>{attribuzione}</figcaption>}
    </figure>
  );
}

function TimelinePercorso() {
  const tappe = [
    { anno: '1984', squadra: 'Toleman', nota: 'Debutto, Monaco sotto la pioggia' },
    { anno: '1985–87', squadra: 'Lotus', nota: '6 vittorie, la consacrazione' },
    { anno: '1988–93', squadra: 'McLaren', nota: '3 titoli, 35 vittorie' },
    { anno: '1994', squadra: 'Williams', nota: 'L’ultima stagione' },
  ];
  return (
    <div className="idol-senna__timeline" role="list" aria-label="Percorso nelle scuderie">
      {tappe.map((tappa) => (
        <div key={tappa.squadra} className="idol-senna__timeline-tappa" role="listitem">
          <span className="idol-senna__timeline-anno">{tappa.anno}</span>
          <span className="idol-senna__timeline-squadra">{tappa.squadra}</span>
          <span className="idol-senna__timeline-nota">{tappa.nota}</span>
        </div>
      ))}
    </div>
  );
}

function SequenzaDonington() {
  const passi = [
    { valore: '4°', etichetta: 'Griglia di partenza' },
    { valore: '5°', etichetta: 'Alla curva 1' },
    { valore: '1°', etichetta: 'Fine primo giro' },
  ];
  return (
    <div className="idol-senna__sequenza">
      {passi.map((passo, indice) => (
        <div key={passo.etichetta} className="idol-senna__sequenza-passo">
          <span className="idol-senna__sequenza-valore">{passo.valore}</span>
          <span className="idol-senna__sequenza-etichetta">{passo.etichetta}</span>
          {indice < passi.length - 1 && <span className="idol-senna__sequenza-freccia" aria-hidden="true">&rarr;</span>}
        </div>
      ))}
    </div>
  );
}

/**
 * Traccia stilizzata, non la mappa geografica reale di Donington Park
 * (quella è materiale con un proprio copyright, stesso principio già
 * seguito da CircuitArt.jsx per non riprodurre le mappe ufficiali dei
 * circuiti) — un tracciato astratto con 4 punti segnati, per evocare
 * la sequenza dei sorpassi senza bisogno di licenze.
 */
function MappaDonington() {
  const [attivo, setAttivo] = useState(null);
  const sorpassi = [
    { id: 1, cx: 90, cy: 70, testo: 'Curva 1 (Redgate): il primo sorpasso' },
    { id: 2, cx: 160, cy: 35, testo: 'Prima serie di curve: supera Schumacher' },
    { id: 3, cx: 230, cy: 65, testo: 'Supera Hill' },
    { id: 4, cx: 280, cy: 110, testo: 'Supera Prost: primo posto' },
  ];
  return (
    <div className="idol-senna__mappa-contenitore">
      <svg viewBox="0 0 340 160" className="idol-senna__mappa-svg" aria-hidden="true">
        <path
          d="M 20 90 C 20 40 60 20 90 70 C 110 105 140 10 160 35 C 180 60 210 20 230 65 C 245 95 260 100 280 110 C 300 118 315 100 310 80"
          fill="none"
          stroke="#3a3d44"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {sorpassi.map((s) => (
          <circle
            key={s.id}
            cx={s.cx}
            cy={s.cy}
            r={attivo === s.id ? 9 : 7}
            fill={attivo === s.id ? 'var(--accent-red)' : 'var(--accent-gold)'}
            stroke="#0b0c10"
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.2s ease' }}
            onMouseEnter={() => setAttivo(s.id)}
            onMouseLeave={() => setAttivo(null)}
            onFocus={() => setAttivo(s.id)}
            onBlur={() => setAttivo(null)}
            tabIndex={0}
            role="button"
            aria-label={s.testo}
          />
        ))}
      </svg>
      <p className="idol-senna__mappa-didascalia">
        {attivo ? sorpassi.find((s) => s.id === attivo).testo : 'Passa il mouse sui punti: i 4 sorpassi del primo giro, Donington 1993.'}
      </p>
    </div>
  );
}

function GraficoTelemetria() {
  return (
    <div className="idol-senna__telemetria">
      <div className="idol-senna__telemetria-riga">
        <span className="idol-senna__telemetria-etichetta">Senna &mdash; parzializzazione</span>
        <svg viewBox="0 0 300 40" className="idol-senna__telemetria-svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,20 Q15,4 30,20 T60,20 T90,20 T120,20 T150,20 T180,20 T210,20 T240,20 T270,20 T300,20" className="idol-senna__telemetria-linea idol-senna__telemetria-linea--senna" />
        </svg>
      </div>
      <div className="idol-senna__telemetria-riga">
        <span className="idol-senna__telemetria-etichetta">Media dell&rsquo;epoca</span>
        <svg viewBox="0 0 300 40" className="idol-senna__telemetria-svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,20 L300,20" className="idol-senna__telemetria-linea idol-senna__telemetria-linea--media" />
        </svg>
      </div>
      <p className="idol-senna__telemetria-nota">
        Illustrazione concettuale, non una telemetria reale: rende l&rsquo;idea della pulsazione ritmica dell&rsquo;acceleratore
        contro un input costante.
      </p>
    </div>
  );
}

const CONFRONTO_NUMERI = [
  { voce: 'Titoli mondiali', senna: '3', prost: '4' },
  { voce: 'GP disputati', senna: '161', prost: '199' },
  { voce: 'Vittorie', senna: '41', prost: '51' },
  { voce: 'Pole position', senna: '65', prost: '33' },
  { voce: 'Giri più veloci', senna: '19', prost: '41' },
  { voce: 'Podi', senna: '80', prost: '106' },
  { voce: '% pole sui GP disputati', senna: '40,4%', prost: '16,6%' },
];

const RIVALITA_EPISODI = [
  {
    anno: '1988',
    titolo: 'Il paradosso dei punti',
    testo:
      'Prost totalizzò più punti in pista di Senna quell’anno (105 contro 94 grezzi). Ma il regolamento contava solo gli 11 risultati migliori: a parità di punteggio dopo lo scarto, vinse chi aveva più vittorie — Senna, 8 a 7. Il pilota più “battuto” in pista quell’anno fu il campione.',
    titolo_vinto: 'Senna',
  },
  {
    anno: '1989',
    titolo: 'La chicane di Suzuka',
    testo:
      'Prost, in testa al mondiale, entra in collisione con Senna alla chicane in curva. Prost si ritira e diventa campione; Senna, squalificato per aver tagliato la chicane rientrando in pista, perde il titolo nonostante il traguardo tagliato per primo.',
    titolo_vinto: 'Prost',
  },
  {
    anno: '1990',
    titolo: 'Suzuka, di nuovo',
    testo:
      'Stessa pista, esito opposto: Senna, in pole, entra deliberatamente in collisione con Prost (ora in Ferrari) alla prima curva. Entrambi si ritirano, Senna è campione per la seconda volta.',
    titolo_vinto: 'Senna',
  },
];

function TabellaConfronto() {
  const [tab, setTab] = useState('numeri');
  return (
    <section className="idol-senna__confronto">
      <h2 className="idol-senna__confronto-titolo">Senna contro Prost, senza filtri</h2>
      <div className="idol-senna__tab-barra" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'numeri'} className={`idol-senna__tab-bottone ${tab === 'numeri' ? 'idol-senna__tab-bottone--attivo' : ''}`} onClick={() => setTab('numeri')}>
          Numeri
        </button>
        <button type="button" role="tab" aria-selected={tab === 'rivalita'} className={`idol-senna__tab-bottone ${tab === 'rivalita' ? 'idol-senna__tab-bottone--attivo' : ''}`} onClick={() => setTab('rivalita')}>
          Rivalità
        </button>
      </div>

      {tab === 'numeri' && (
        <table className="idol-senna__tabella">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Ayrton Senna</th>
              <th scope="col">Alain Prost</th>
            </tr>
          </thead>
          <tbody>
            {CONFRONTO_NUMERI.map((riga) => (
              <tr key={riga.voce}>
                <th scope="row">{riga.voce}</th>
                <td className="tab-num">{riga.senna}</td>
                <td className="tab-num">{riga.prost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'rivalita' && (
        <ol className="idol-senna__rivalita-lista">
          {RIVALITA_EPISODI.map((episodio) => (
            <li key={episodio.anno} className="idol-senna__rivalita-voce">
              <span className="idol-senna__rivalita-anno">{episodio.anno}</span>
              <div>
                <h3 className="idol-senna__rivalita-episodio-titolo">{episodio.titolo}</h3>
                <p className="idol-senna__rivalita-testo">{episodio.testo}</p>
                <span className="badge idol-senna__rivalita-badge">Titolo a {episodio.titolo_vinto}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function IdolSennaView() {
  const anniDalTamburello = new Date().getFullYear() - 1994;

  return (
    <main className="idol-senna">
      {/* IMMAGINE 1: ritratto full-bleed, primissimo piano, non un'azione
          in pista (vedi nota licenze in cima al file: oggi placeholder). */}
      <section className="idol-senna__hero">
        <span className="idol-senna__hero-sfondo" aria-hidden="true" />
        <span className="idol-senna__hero-velo" aria-hidden="true" />
        <div className="idol-senna__hero-contenuto">
          <Link to="/idols" className="idol-senna__indietro">
            &larr; Tutti gli Idols
          </Link>
          <h1 className="idol-senna__hero-nome">Ayrton Senna</h1>
          <p className="idol-senna__hero-payoff">Il misticismo della velocità.</p>
        </div>
      </section>

      <article className="idol-senna__corpo">
        <p className="idol-senna__intro">
          Ci sono piloti che vincono e piloti che riscrivono il motivo per cui corriamo. Ayrton Senna non
          apparteneva alla prima categoria, e nemmeno alla seconda. Ayrton ha trasformato l&rsquo;atto di guidare
          una monoposto in un&rsquo;estensione dell&rsquo;anima, una ricerca spirituale consumata a trecento chilometri
          all&rsquo;ora tra i cordoli del mondo. A trent&rsquo;anni dalla sua scomparsa, il suo nome non evoca solo
          numeri o statistiche, ma un&rsquo;idea millenaria: il superamento del limite umano. Per comprendere
          Senna, bisogna accettare che per lui la pista non era un semplice asfalto su cui competere, ma un
          altare su cui confessarsi.
        </p>

        <h2>L&rsquo;uragano dentro: la genesi di un mito</h2>
        <p>
          Nato tra le pieghe della San Paolo bene, Ayrton Silva si rifugia nel motorsport per dare voce a
          un&rsquo;intensità interiore che faticava a trovare spazio nella realtà quotidiana. Fin dai tempi del
          kart, il suo approccio non è mai stato ludico, ma geometrico e ossessivo. Mentre gli altri piloti
          consideravano il weekend di gara un lavoro o una passione, per Senna era un rituale di purificazione.
        </p>

        {/* IMMAGINE 2: sequenza 3-4 foto delle livree (Toleman/Lotus/
            McLaren/Williams), scroll orizzontale o fade, non gallery pesante. */}
        <TimelinePercorso />

        <p>
          La sua ascesa è stata una marcia implacabile. Dai lampi di genio con la modesta Toleman nel fango di
          Monaco 1984, fino al passaggio in Lotus e poi alla consacrazione in McLaren alla fine degli anni
          &rsquo;80, Ayrton ha ridefinito gli standard di dedizione psicofisica di un atleta. Non voleva solo
          battere gli avversari; sentiva il dovere morale di esplorare aree dell&rsquo;esperienza di guida dove
          nessuno aveva mai avuto il coraggio di guardare. Era un perfezionista tormentato, capace di isolarsi
          dal mondo intero pur di trovare quel centesimo di secondo che separava l&rsquo;eccellenza
          dall&rsquo;immortalità.
        </p>

        <h2>La mistica del Re della Pioggia</h2>
        <p>
          Ciò che rende Senna un&rsquo;icona transgenerazionale è la totale assenza di filtri tra l&rsquo;uomo e la
          macchina. Ayrton parlava apertamente di Dio, di visioni nell&rsquo;abitacolo, di dimensioni ultraterrene
          raggiunte durante una qualifica.
        </p>
        <p>
          Sabato 14 maggio 1988, nelle strade del Principato di Monaco, Senna firma la pole position più
          famosa della storia. Rifila quasi un secondo e mezzo al suo rivale storico Alain Prost, a parità di
          vettura.
        </p>

        <Citazione attribuzione="Ayrton Senna">
          Guidavo per istinto, ero in un tunnel. Ben oltre il limite cosciente. Ho capito in quel momento che
          la pista non era più solo una pista, ma una linea sottile tesa verso l&rsquo;infinito.
        </Citazione>

        <div className="idol-senna__stat-griglia">
          <BoxStatistica numero="40,4%" etichetta="pole su GP disputati" nota="65 pole in 161 partenze" />
          <BoxStatistica numero="6" etichetta="vittorie a Monaco" nota="record tuttora imbattuto, 5 consecutive 1989–93" />
        </div>

        <p>
          La sua leggenda si è cementata nell&rsquo;acqua. Laddove l&rsquo;asfalto perdeva aderenza e il caos prendeva
          il sopravvento, Ayrton trovava la sua massima lucidità. Il primo giro di Donington nel 1993 &mdash;
          quattro sorpassi in meno di due minuti sotto il diluvio, sverniciando campioni del calibro di
          Schumacher, Hill e Prost &mdash; rimane il manifesto di un uomo che vedeva traiettorie invisibili a
          tutti gli altri. Per lui, la pioggia non era un limite visivo, ma un elemento in cui sintonizzarsi.
        </p>

        <SequenzaDonington />
        {/* IMMAGINE 3: qui la mappa interattiva richiesta — tracciato
            astratto (non la mappa ufficiale, stesso principio di
            CircuitArt.jsx), 4 punti per i 4 sorpassi. */}
        <MappaDonington />

        <h2>L&rsquo;effetto ABS umano: lo stile tecnico</h2>
        <p>
          Dietro la mistica, c&rsquo;era però un ingegnere del proprio corpo. Senna ha rivoluzionato la tecnica di
          guida dell&rsquo;era Turbo, applicando un controllo quasi scientifico alla brutalità meccanica delle
          vetture degli anni &rsquo;80 e &rsquo;90.
        </p>
        <p>
          Il suo marchio di fabbrica era la parzializzazione dell&rsquo;acceleratore: una spaventosa e ritmica
          pulsazione del piede destro a centro curva. Una tecnica d&rsquo;alta scuola utilizzata per mantenere la
          turbina del motore Honda costantemente in pressione, evitando il devastante &ldquo;turbo-lag&rdquo;
          dell&rsquo;epoca. Era un ABS umano, controllato solo dalla sensibilità del polpaccio e del tallone, un
          segreto tecnico che lasciava sbigottiti i telemetristi.
        </p>

        {/* IMMAGINE/ELEMENTO 4: qui il grafico sostituisce del tutto la
            foto, come da piano — capitolo tecnico, non evocativo. */}
        <GraficoTelemetria />

        <p>
          A questo si aggiungeva una ferocità millimetrica nel corpo a corpo. Ayrton aggrediva il punto di
          corda con una violenza controllata che costringeva la vettura a ruotare sui propri perni geometrici
          in anticipo rispetto agli avversari, permettendogli di scaricare la potenza e raddrizzare il volante
          prima di chiunque altro.
        </p>

        <h2>L&rsquo;eredità: oltre il cordolo di Imola</h2>
        <p>
          Il 1&deg; maggio 1994, alla curva del Tamburello, il tempo si è fermato. Ma la fine del pilota ha dato
          inizio al mito indistruttibile. L&rsquo;impatto di Senna ha cambiato la storia ben oltre l&rsquo;albo d&rsquo;oro
          della Formula 1.
        </p>
        <p>
          Il suo sacrificio ha imposto una totale riscrittura dei regolamenti medici, dei crash test e della
          progettazione dei circuiti, salvando la vita a decine di piloti nelle tre decadi successive. Oggi,
          ogni moderna cellula di sicurezza in carbonio deve qualcosa a quel tragico weekend di Imola.
        </p>

        {/* IMMAGINE 5: transizione a scroll storica→moderna (Tamburello /
            halo, crash test), non due immagini separate. */}
        <div className="idol-senna__stat-griglia">
          <BoxStatistica numero={`${anniDalTamburello}`} etichetta="anni da Imola" nota="calcolato sull’anno corrente" />
          <BoxStatistica numero="36M" etichetta="studenti e insegnanti formati" nota="Instituto Ayrton Senna, dal 1994 — fonte RSI" />
        </div>

        <p>
          Inoltre, la sua figura vive attraverso l&rsquo;Instituto Ayrton Senna, voluto fortemente dalla sorella
          Viviane. Il suo nome continua a dare istruzione, dignità e futuro a milioni di bambini svantaggiati
          nelle favelas brasiliane. Senna non è stato solo un tre volte campione del mondo.
        </p>

        <Citazione>
          È stato l&rsquo;uomo che ha dimostrato al mondo che la velocità può essere una forma d&rsquo;arte, di
          preghiera e di assoluta e totale libertà.
        </Citazione>
      </article>

      <TabellaConfronto />
    </main>
  );
}
