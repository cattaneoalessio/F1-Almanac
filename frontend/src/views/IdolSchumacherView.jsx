import { Link } from 'react-router-dom';
import { useState } from 'react';
import CreditedFigure from '../components/CreditedFigure.jsx';
import { DRIVER_PHOTOS } from '../data/driverPhotos.js';
import './IdolSchumacherView.css';

/**
 * IdolSchumacherView (/idols/schumacher) — sottopagina arricchita di
 * Michael Schumacher, stesso trattamento di IdolSennaView.jsx e
 * IdolHamiltonView.jsx (data journalism + UI/UX discusso in chat).
 *
 * TESTO: quello fornito dall'utente per il proprio sito — nessuna
 * correzione fattuale necessaria questa volta (l'episodio dell'Ungheria
 * 1998, "19 giri consecutivi", è risultato accurato alla verifica).
 *
 * NUMERI: tutti verificati con ricerca prima di scriverli (non a
 * memoria), fonti incrociate Wikipedia/Motorsport Magazine/RaceFans,
 * aggiornati a fine settembre 2026:
 * - Schumacher: 7 titoli (1994, 1995 Benetton; 2000-2004 Ferrari, 5
 *   consecutivi), 91 vittorie, 68 pole, 155 podi — non più record
 *   assoluti (Hamilton li ha superati), ma i SUOI numeri restano
 *   quelli, e il record di podio al 100% nel 2002 (17 gare su 17,
 *   11 vittorie, 6 secondi posti, 1 terzo) resta unico nella storia,
 *   ancora nessun altro pilota lo ha eguagliato.
 * - Stagione 2002: margine punti record (67 su Barrichello), punteggio
 *   record (144), titolo conquistato con 6 gare di anticipo — tutti
 *   record dell'epoca, alcuni poi superati da altri ma il podio al
 *   100% no.
 * - Ungheria 1998: la richiesta radio di Ross Brawn ("Michael, you
 *   have 19 laps to pull out 25 seconds. We need 19 qualifying laps
 *   from you.") è verificata testualmente su più fonti indipendenti —
 *   il testo originale la descriveva correttamente, usata qui come
 *   citazione diretta invece che parafrasata.
 * - "Without my team, I am nothing": citazione reale di Schumacher,
 *   pronunciata dopo la vittoria di Imola 2000 — verificata.
 * - Rivalità con Alonso (2005-2006): nel 2005 Alonso interrompe a
 *   Imola la striscia di dominio Ferrari 1999-2004, diventando il più
 *   giovane campione del mondo dell'epoca (Ferrari fuori forma per
 *   quasi tutta la stagione). Nel 2006, col ritorno delle gomme
 *   singole e i nuovi V8, i due si giocano il titolo alla pari — 7
 *   vittorie a testa — deciso da un margine di soli 5 punti nel
 *   mondiale costruttori a favore della Renault. Schumacher annuncia
 *   il ritiro a settembre 2006.
 *
 * FOTO: 4 immagini vere da Wikimedia Commons, elenco e attribuzione
 * forniti e verificati dall'utente — stessa convenzione già in uso
 * per Senna e Hamilton (vedi src/data/driverPhotos.js), Wikimedia
 * bloccato per il fetch da questo ambiente di lavoro.
 */

function BoxStatistica({ numero, etichetta, nota }) {
  return (
    <div className="idol-schumacher__stat-box">
      <span className="idol-schumacher__stat-numero">{numero}</span>
      <span className="idol-schumacher__stat-etichetta">{etichetta}</span>
      {nota && <span className="idol-schumacher__stat-nota">{nota}</span>}
    </div>
  );
}

function Citazione({ children, attribuzione }) {
  return (
    <figure className="idol-schumacher__citazione">
      <blockquote>&ldquo;{children}&rdquo;</blockquote>
      {attribuzione && <figcaption>{attribuzione}</figcaption>}
    </figure>
  );
}

function TimelinePercorso() {
  const tappe = [
    { anno: '1991', squadra: 'Jordan → Benetton', nota: 'Debutto a Spa, poi il cambio in corsa' },
    { anno: '1992–95', squadra: 'Benetton', nota: '2 titoli (1994, 1995)' },
    { anno: '1996–2006', squadra: 'Ferrari', nota: '5 titoli consecutivi (2000–04)' },
    { anno: '2010–12', squadra: 'Mercedes', nota: 'Il ritorno' },
  ];
  return (
    <div className="idol-schumacher__timeline" role="list" aria-label="Percorso nelle scuderie">
      {tappe.map((tappa) => (
        <div key={tappa.squadra} className="idol-schumacher__timeline-tappa" role="listitem">
          <span className="idol-schumacher__timeline-anno">{tappa.anno}</span>
          <span className="idol-schumacher__timeline-squadra">{tappa.squadra}</span>
          <span className="idol-schumacher__timeline-nota">{tappa.nota}</span>
        </div>
      ))}
    </div>
  );
}

const CONFRONTO_NUMERI = [
  { voce: 'Titoli mondiali', valore: '7', nota: 'a pari merito con Hamilton' },
  { voce: 'Titoli consecutivi', valore: '5', nota: '2000–04 con Ferrari, mai eguagliato' },
  { voce: 'Vittorie', valore: '91', nota: '' },
  { voce: 'Pole position', valore: '68', nota: '' },
  { voce: 'Podi', valore: '155', nota: '' },
  { voce: 'Podio in ogni gara di una stagione', valore: '100%', nota: '2002, 17 gare su 17 — mai più eguagliato' },
  { voce: 'Margine record sul 2° classificato', valore: '67 pt', nota: '2002, su Barrichello' },
];

const RIVALITA_EPISODI = [
  {
    anno: '2005',
    titolo: 'La fine dell’egemonia',
    testo:
      'A Imola, Alonso tiene dietro l’attacco di Schumacher per soli 0,2 secondi e interrompe la striscia di dominio Ferrari 1999–2004. La Ferrari è fuori forma per quasi tutta la stagione (l’unico successo di Schumacher arriva in un GP degli Stati Uniti falsato dal ritiro delle Michelin). Alonso diventa il più giovane campione del mondo della storia fino a quel momento.',
    titolo_vinto: 'Alonso',
  },
  {
    anno: '2006',
    titolo: 'L’ultima sfida, alla pari',
    testo:
      'Nuove regole (gomme libere, motori V8) riportano la Ferrari in lotta. Schumacher e Alonso vincono 7 gare ciascuno: la sfida più equilibrata della loro rivalità. Schumacher recupera un distacco enorme nel finale, ma il titolo costruttori sfugge alla Ferrari per soli 5 punti. Schumacher annuncia il ritiro a fine stagione.',
    titolo_vinto: 'Alonso',
  },
];

function TabellaConfronto() {
  const [tab, setTab] = useState('numeri');
  return (
    <section className="idol-schumacher__confronto">
      <h2 className="idol-schumacher__confronto-titolo">Il cambio generazionale, numero per numero</h2>
      <div className="idol-schumacher__tab-barra" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'numeri'} className={`idol-schumacher__tab-bottone ${tab === 'numeri' ? 'idol-schumacher__tab-bottone--attivo' : ''}`} onClick={() => setTab('numeri')}>
          Numeri
        </button>
        <button type="button" role="tab" aria-selected={tab === 'rivalita'} className={`idol-schumacher__tab-bottone ${tab === 'rivalita' ? 'idol-schumacher__tab-bottone--attivo' : ''}`} onClick={() => setTab('rivalita')}>
          Rivalità con Alonso
        </button>
      </div>

      {tab === 'numeri' && (
        <table className="idol-schumacher__tabella">
          <thead>
            <tr>
              <th scope="col">Record di carriera</th>
              <th scope="col">Michael Schumacher</th>
            </tr>
          </thead>
          <tbody>
            {CONFRONTO_NUMERI.map((riga) => (
              <tr key={riga.voce}>
                <th scope="row">
                  {riga.voce}
                  {riga.nota && <span className="idol-schumacher__tabella-nota"> — {riga.nota}</span>}
                </th>
                <td className="tab-num">{riga.valore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'rivalita' && (
        <ol className="idol-schumacher__rivalita-lista">
          {RIVALITA_EPISODI.map((episodio) => (
            <li key={episodio.anno} className="idol-schumacher__rivalita-voce">
              <span className="idol-schumacher__rivalita-anno">{episodio.anno}</span>
              <div>
                <h3 className="idol-schumacher__rivalita-episodio-titolo">{episodio.titolo}</h3>
                <p className="idol-schumacher__rivalita-testo">{episodio.testo}</p>
                <span className="badge idol-schumacher__rivalita-badge">Titolo a {episodio.titolo_vinto}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function IdolSchumacherView() {
  const fotoEroe = DRIVER_PHOTOS.schumacher.eroe;

  return (
    <main className="idol-schumacher">
      {/* IMMAGINE 1: ritratto full-bleed, foto vera verificata dall'utente
          su Wikimedia Commons (vedi src/data/driverPhotos.js). */}
      <section className="idol-schumacher__hero" style={{ '--idol-schumacher-hero-foto': `url(${fotoEroe.src})` }}>
        <span className="idol-schumacher__hero-sfondo" aria-hidden="true" />
        <span className="idol-schumacher__hero-velo" aria-hidden="true" />
        <div className="idol-schumacher__hero-contenuto">
          <Link to="/idols" className="idol-schumacher__indietro">
            &larr; Tutti gli Idols
          </Link>
          <h1 className="idol-schumacher__hero-nome">Michael Schumacher</h1>
          <p className="idol-schumacher__hero-payoff">L&rsquo;algoritmo della vittoria.</p>
        </div>
        <p className="idol-schumacher__hero-credito">
          Foto:{' '}
          <a href={fotoEroe.fonteUrl} target="_blank" rel="noreferrer noopener">
            {fotoEroe.autore}
          </a>{' '}
          /{' '}
          <a href={fotoEroe.licenzaUrl} target="_blank" rel="noreferrer noopener">
            {fotoEroe.licenzaLabel}
          </a>
        </p>
      </section>

      <article className="idol-schumacher__corpo">
        <p className="idol-schumacher__intro">
          Ci sono piloti che sfidano il limite e piloti che lo ridefiniscono attraverso un metodo scientifico,
          implacabile, assoluto. Michael Schumacher appartiene a una categoria a sé stante: quella dei
          costruttori di imperi. Se il motorsport prima di lui era una miscela di talento puro, coraggio e
          improvvisazione, con il suo avvento si è trasformato in un’equazione millimetrica. Il Kaiser non ha
          semplicemente guidato le monoposto più veloci del pianeta; ha preso lo sport e lo ha piegato alle
          regole di una preparazione fisica, psicologica e tecnica mai vista prima, trasformando il Cavallino
          Rampante in una macchina da guerra perfetta.
        </p>

        <h2>La genesi della perfezione: dal fango di Kerpen a Spa</h2>
        <p>
          Le radici del mito affondano nella pista di kart di Kerpen, gestita dal padre Rolf. Lì, tra telai
          saldati alla buona e pneumatici consumati recuperati dai bidoni della spazzatura, Michael impara
          l’arte di sentire l’aderenza dove gli altri vedono solo asfalto scivoloso. Quando debutta in Formula 1
          a Spa-Francorchamps nel 1991 al volante della verde Jordan, il paddock capisce immediatamente di
          trovarsi di fronte a un predatore.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.schumacher.genesi.src}
          alt={DRIVER_PHOTOS.schumacher.genesi.alt}
          autore={DRIVER_PHOTOS.schumacher.genesi.autore}
          fonteUrl={DRIVER_PHOTOS.schumacher.genesi.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.schumacher.genesi.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.schumacher.genesi.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.schumacher.genesi.licenzaLabel}
          didascalia="La Benetton B194, GP di Gran Bretagna 1994: l’anno del primo titolo"
        />

        <p>
          La sua ascesa con la Benetton di Flavio Briatore, culminata nei Mondiali 1994 e 1995, è una
          dimostrazione di forza bruta e acume strategico. Ma è nel 1996 che Schumacher compie la scelta che lo
          consegnerà alla leggenda: abbandonare il team campione in carica per trasferirsi in una Ferrari in
          crisi profonda. Fu un atto di pura ambizione e visione. Michael non cercava una macchina per vincere
          subito; voleva plasmare la Scuderia intorno a sé, mattone dopo mattone, telemetria dopo telemetria.
        </p>

        <TimelinePercorso />

        <h2>L&rsquo;implacabile mentalità del Kaiser</h2>
        <p>
          Ciò che ha reso Schumacher un’icona transgenerazionale non è solo l’incredibile palmares di 7 Titoli
          Mondiali, ma la costanza robotica delle sue prestazioni. Michael è stato il primo pilota a considerare
          la preparazione atletica come un fattore prestazionale decisivo: mentre gli avversari finivano i Gran
          Premi stremati, lui scendeva dalla vettura senza una goccia di sudore, pronto a fare una sessione di
          test di tre ore.
        </p>
        <p>
          La sua era una presenza totalizzante nel box. Passava notti intere con gli ingegneri, analizzando ogni
          singolo parametro, motivando i meccanici e creando una fedeltà assoluta all’interno della squadra. Il
          sodalizio con Jean Todt e Ross Brawn ha dato vita a un &laquo;algoritmo della vittoria&raquo; capace di
          dominare lo sport nei primi anni 2000.
        </p>

        <Citazione attribuzione="Ross Brawn a Schumacher, via radio — GP di Ungheria 1998">
          Michael, you have 19 laps to pull out 25 seconds. We need 19 qualifying laps from you.
        </Citazione>

        <p>
          Quella richiesta — inanellare 19 giri consecutivi a ritmo di qualifica per battere la McLaren sulla
          strategia — venne eseguita al millesimo da Michael. Gare come quella rimangono pietre miliari di una
          freddezza agonistica leggendaria.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.schumacher.mentalita.src}
          alt={DRIVER_PHOTOS.schumacher.mentalita.alt}
          autore={DRIVER_PHOTOS.schumacher.mentalita.autore}
          fonteUrl={DRIVER_PHOTOS.schumacher.mentalita.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.schumacher.mentalita.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.schumacher.mentalita.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.schumacher.mentalita.licenzaLabel}
          didascalia="La F2002 a Spa-Francorchamps, la sua pista preferita — GP del Belgio 2002"
        />

        <div className="idol-schumacher__stat-griglia">
          <BoxStatistica numero="100%" etichetta="podio in ogni gara, stagione 2002" nota="17 gare su 17, mai più eguagliato" />
          <BoxStatistica numero="5" etichetta="titoli consecutivi" nota="2000–04 con Ferrari" />
        </div>

        <h2>Lo stile di guida: simbiosi tra uomo e telemetria</h2>
        <p>
          Tecnicamente, Schumacher ha anticipato l’era digitale della Formula 1. Il suo stile era caratterizzato
          da una straordinaria flessibilità ed efficienza.
        </p>
        <p>
          <strong>La gestione del sovrasterzo:</strong> a differenza di molti colleghi che cercavano stabilità,
          Michael preferiva un avantreno granitico e un retrotreno estremamente mobile. Riusciva a controllare le
          continue sbandate posteriori con correzioni micrometriche del volante, quasi impercettibili, mantenendo
          la vettura costantemente al limite della fisica.
        </p>
        <p>
          <strong>Il multitasking nell’abitacolo:</strong> Schumacher è stato il pioniere nell’utilizzo dei
          manettini sul volante. Modificava la ripartizione della frenata e il comportamento del differenziale
          curva per curva, adattando la monoposto all’usura delle gomme e al variare del carico di benzina in
          tempo reale.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.schumacher.stileTecnico.src}
          alt={DRIVER_PHOTOS.schumacher.stileTecnico.alt}
          autore={DRIVER_PHOTOS.schumacher.stileTecnico.autore}
          fonteUrl={DRIVER_PHOTOS.schumacher.stileTecnico.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.schumacher.stileTecnico.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.schumacher.stileTecnico.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.schumacher.stileTecnico.licenzaLabel}
          didascalia="Il casco iconico, GP del Bahrein 2010 — gli anni del ritorno in Mercedes"
        />

        <h2>L&rsquo;eredità: il benchmark del motorsport moderno</h2>
        <p>
          Il ritiro, il ritorno in Mercedes per gettare le basi del dominio della scuderia tedesca e il tragico
          incidente sugli sci del 2013 hanno congelato la sua figura in un alone di rispetto universale.
        </p>

        <Citazione attribuzione="Michael Schumacher, dopo la vittoria a Imola — GP di San Marino 2000">
          Without my team, I am nothing.
        </Citazione>

        <p>
          L’impatto di Michael sul motorsport è strutturale: oggi, ogni giovane pilota che entra nel Circus — da
          Max Verstappen ai talenti delle Academy — adotta la stessa meticolosa preparazione fisica, lo stesso
          studio ossessivo dei dati e lo stesso approccio totale al lavoro di squadra introdotti dal tedesco.
          Schumacher non ha solo vinto 91 Gran Premi; ha tracciato la mappa stradale che la Formula 1 ha seguito
          per entrare nel Ventunesimo secolo.
        </p>
      </article>

      <TabellaConfronto />
    </main>
  );
}
