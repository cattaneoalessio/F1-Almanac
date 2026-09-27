import { Link } from 'react-router-dom';
import { useState } from 'react';
import CreditedFigure from '../components/CreditedFigure.jsx';
import { DRIVER_PHOTOS } from '../data/driverPhotos.js';
import './IdolHamiltonView.css';

/**
 * IdolHamiltonView (/idols/hamilton) — sottopagina arricchita di Lewis
 * Hamilton, stesso trattamento di IdolSennaView.jsx (data journalism +
 * UI/UX discusso in chat, poi replicato su richiesta esplicita per
 * Hamilton).
 *
 * TESTO: quello fornito dall'utente per il proprio sito, con UNA
 * correzione fattuale (vedi sotto) — non materiale di terzi da
 * centellinare.
 *
 * NUMERI: tutti verificati con ricerca prima di scriverli (non a
 * memoria), fonti incrociate Wikipedia/F1.com/Mercedes AMG F1/F1 Daily
 * Brief, aggiornati a fine settembre 2026:
 * - Hamilton: 106 vittorie, 104 pole, 207 podi, 7 titoli (2008, 2014,
 *   2015, 2017, 2018, 2019, 2020) — vittorie, pole e podi sono TUTTI
 *   record assoluti della storia della F1 (non solo "oltre le 100").
 * - Striscia di piazzamenti a punti consecutivi: 48 gare, dal GP di
 *   Gran Bretagna 2018 al GP del Bahrein 2020 — record assoluto,
 *   interrotta dal Covid (Hamilton dovette saltare il GP di Sakhir),
 *   non da un risultato negativo in pista.
 * - CORREZIONE: il testo originale dice "un Lewis dodicenne" per
 *   l'incontro con Ron Dennis — tutte le fonti incrociate (Wikipedia,
 *   Sky Sports, F1.com, le parole dello stesso padre di Hamilton)
 *   confermano che aveva DIECI anni, agli Autosport Awards del 1995.
 *   Corretto nel testo sotto, e la citazione esatta (non parafrasata)
 *   usata nel callout.
 * - Rivalità con Rosberg (2013-2016, compagni di squadra in Mercedes):
 *   78 gare insieme, 54 vittorie combinate (69%), testa a testa in
 *   qualifica 42-36 per Hamilton, margine punti finale di oltre 100 a
 *   favore di Hamilton, titoli 2014 e 2015 a Hamilton, 2016 a Rosberg
 *   (che si ritirò pochi giorni dopo) — nel primo anno insieme (2013)
 *   fu invece Rosberg ad avere più vittorie individuali.
 * - "Still I Rise": motto personale reale di Hamilton (tatuato sulla
 *   schiena, presente anche nel design del casco), tratto dalla
 *   poesia di Maya Angelou "And Still I Rise" (1978) — attribuito
 *   correttamente all'autrice, non presentato come coniato da lui.
 *
 * FOTO: 4 immagini vere da Wikimedia Commons, elenco e attribuzione
 * forniti e verificati dall'utente — stessa convenzione già in uso
 * per Senna (vedi src/data/driverPhotos.js), Wikimedia bloccato per
 * il fetch da questo ambiente di lavoro.
 */

function BoxStatistica({ numero, etichetta, nota }) {
  return (
    <div className="idol-hamilton__stat-box">
      <span className="idol-hamilton__stat-numero">{numero}</span>
      <span className="idol-hamilton__stat-etichetta">{etichetta}</span>
      {nota && <span className="idol-hamilton__stat-nota">{nota}</span>}
    </div>
  );
}

function Citazione({ children, attribuzione }) {
  return (
    <figure className="idol-hamilton__citazione">
      <blockquote>&ldquo;{children}&rdquo;</blockquote>
      {attribuzione && <figcaption>{attribuzione}</figcaption>}
    </figure>
  );
}

function TimelinePercorso() {
  const tappe = [
    { anno: '2007–12', squadra: 'McLaren', nota: 'Debutto, titolo 2008' },
    { anno: '2013–24', squadra: 'Mercedes', nota: '6 titoli, l’era dominante' },
    { anno: '2025–', squadra: 'Ferrari', nota: 'La nuova scommessa' },
  ];
  return (
    <div className="idol-hamilton__timeline" role="list" aria-label="Percorso nelle scuderie">
      {tappe.map((tappa) => (
        <div key={tappa.squadra} className="idol-hamilton__timeline-tappa" role="listitem">
          <span className="idol-hamilton__timeline-anno">{tappa.anno}</span>
          <span className="idol-hamilton__timeline-squadra">{tappa.squadra}</span>
          <span className="idol-hamilton__timeline-nota">{tappa.nota}</span>
        </div>
      ))}
    </div>
  );
}

function GraficoTrailBraking() {
  return (
    <div className="idol-hamilton__telemetria">
      <div className="idol-hamilton__telemetria-riga">
        <span className="idol-hamilton__telemetria-etichetta">Pressione freno</span>
        <svg viewBox="0 0 300 40" className="idol-hamilton__telemetria-svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,6 C60,6 90,10 130,20 C170,30 210,36 300,37" className="idol-hamilton__telemetria-linea idol-hamilton__telemetria-linea--freno" />
        </svg>
      </div>
      <div className="idol-hamilton__telemetria-riga">
        <span className="idol-hamilton__telemetria-etichetta">Angolo di sterzo</span>
        <svg viewBox="0 0 300 40" className="idol-hamilton__telemetria-svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,37 C60,37 90,32 130,22 C170,12 210,7 300,6" className="idol-hamilton__telemetria-linea idol-hamilton__telemetria-linea--sterzo" />
        </svg>
      </div>
      <p className="idol-hamilton__telemetria-nota">
        Illustrazione concettuale del <em>trail braking</em>: il freno si rilascia gradualmente MENTRE lo sterzo aumenta,
        non prima — le due curve si sovrappongono invece di susseguirsi.
      </p>
    </div>
  );
}

const CONFRONTO_NUMERI = [
  { voce: 'Titoli mondiali', valore: '7', nota: 'record assoluto, a pari merito con Schumacher' },
  { voce: 'Vittorie', valore: '106', nota: 'record assoluto' },
  { voce: 'Pole position', valore: '104', nota: 'record assoluto' },
  { voce: 'Podi', valore: '207', nota: 'record assoluto' },
  { voce: 'GP disputati', valore: '393', nota: '' },
  { voce: '% vittorie sui GP disputati', valore: '27,0%', nota: '' },
  { voce: 'Striscia punti consecutivi', valore: '48 gare', nota: 'record assoluto, GB 2018 → Bahrein 2020' },
];

const RIVALITA_EPISODI = [
  {
    anno: '2013',
    titolo: 'Il primo anno, alla pari',
    testo:
      'Primo anno insieme in Mercedes. Sorprendentemente è Rosberg ad avere più vittorie individuali (Monaco, Silverstone) contro l’unica di Hamilton, in Ungheria — prima che la Mercedes diventasse la macchina dominante che sarà dal 2014.',
    titolo_vinto: null,
  },
  {
    anno: '2014–15',
    titolo: 'Il dominio di Hamilton',
    testo:
      'Con l’arrivo dell’era ibrida, Hamilton prende il comando della rivalità e vince due titoli consecutivi. Nei quattro anni insieme, i due si spartiscono 54 vittorie su 78 gare (69%) — ma il testa a testa in qualifica, alla fine, sarà 42 a 36 per Hamilton.',
    titolo_vinto: 'Hamilton',
  },
  {
    anno: '2016',
    titolo: 'La rivincita di Rosberg',
    testo:
      'Rosberg si prende il titolo che gli era sempre sfuggito — e si ritira dalla Formula 1 appena cinque giorni dopo averlo conquistato, chiudendo la rivalità nel modo più inaspettato.',
    titolo_vinto: 'Rosberg',
  },
];

function TabellaConfronto() {
  const [tab, setTab] = useState('numeri');
  return (
    <section className="idol-hamilton__confronto">
      <h2 className="idol-hamilton__confronto-titolo">L’era Mercedes, numero per numero</h2>
      <div className="idol-hamilton__tab-barra" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'numeri'} className={`idol-hamilton__tab-bottone ${tab === 'numeri' ? 'idol-hamilton__tab-bottone--attivo' : ''}`} onClick={() => setTab('numeri')}>
          Numeri
        </button>
        <button type="button" role="tab" aria-selected={tab === 'rivalita'} className={`idol-hamilton__tab-bottone ${tab === 'rivalita' ? 'idol-hamilton__tab-bottone--attivo' : ''}`} onClick={() => setTab('rivalita')}>
          Rivalità con Rosberg
        </button>
      </div>

      {tab === 'numeri' && (
        <table className="idol-hamilton__tabella">
          <thead>
            <tr>
              <th scope="col">Record di carriera</th>
              <th scope="col">Lewis Hamilton</th>
            </tr>
          </thead>
          <tbody>
            {CONFRONTO_NUMERI.map((riga) => (
              <tr key={riga.voce}>
                <th scope="row">
                  {riga.voce}
                  {riga.nota && <span className="idol-hamilton__tabella-nota"> — {riga.nota}</span>}
                </th>
                <td className="tab-num">{riga.valore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'rivalita' && (
        <ol className="idol-hamilton__rivalita-lista">
          {RIVALITA_EPISODI.map((episodio) => (
            <li key={episodio.anno} className="idol-hamilton__rivalita-voce">
              <span className="idol-hamilton__rivalita-anno">{episodio.anno}</span>
              <div>
                <h3 className="idol-hamilton__rivalita-episodio-titolo">{episodio.titolo}</h3>
                <p className="idol-hamilton__rivalita-testo">{episodio.testo}</p>
                {episodio.titolo_vinto && <span className="badge idol-hamilton__rivalita-badge">Titolo a {episodio.titolo_vinto}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function IdolHamiltonView() {
  const fotoEroe = DRIVER_PHOTOS.hamilton.eroe;

  return (
    <main className="idol-hamilton">
      {/* IMMAGINE 1: ritratto full-bleed, foto vera verificata dall'utente
          su Wikimedia Commons (vedi src/data/driverPhotos.js). */}
      <section className="idol-hamilton__hero" style={{ '--idol-hamilton-hero-foto': `url(${fotoEroe.src})` }}>
        <span className="idol-hamilton__hero-sfondo" aria-hidden="true" />
        <span className="idol-hamilton__hero-velo" aria-hidden="true" />
        <div className="idol-hamilton__hero-contenuto">
          <Link to="/idols" className="idol-hamilton__indietro">
            &larr; Tutti gli Idols
          </Link>
          <h1 className="idol-hamilton__hero-nome">Lewis Hamilton</h1>
          <p className="idol-hamilton__hero-payoff">L&rsquo;arte di riscrivere la storia.</p>
        </div>
        <p className="idol-hamilton__hero-credito">
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

      <article className="idol-hamilton__corpo">
        <p className="idol-hamilton__intro">
          Ci sono piloti che si adattano al mondo della Formula 1 e piloti che costringono la Formula 1 ad
          allargare i propri confini. Lewis Hamilton non ha semplicemente collezionato record su record; ha
          preso uno sport storicamente elitario, rigido ed monocromatico e lo ha trasformato in una piattaforma
          globale di espressione, cultura e cambiamento. Il ragazzo di Stevenage, arrivato nel Circus con il
          peso delle aspettative e il fuoco del talento puro, ha riscritto le regole di cosa significhi essere
          un campione. Con 7 Titoli Mondiali e una bacheca che sfida le leggi della statistica, Hamilton ha
          dimostrato che la velocità non è solo una questione di millesimi di secondo, ma un&rsquo;incredibile
          estensione del proprio vissuto, dei propri valori e della propria voce.
        </p>

        <h2>La genesi del prescelto: dal karting di provincia a Melbourne</h2>
        <p>
          La parabola di Lewis Hamilton inizia sulle piste di kart britanniche, dove un giovanissimo pilota e
          suo padre Anthony sacrificano ogni risorsa disponibile per competere contro i budget illimitati della
          concorrenza. È la storia di un&rsquo;ostinazione feroce. La svolta arriva quando un Lewis di appena
          dieci anni si avvicina a Ron Dennis, ai Autosport Awards del 1995, per chiedergli un autografo.
        </p>

        <Citazione attribuzione="Lewis Hamilton, dieci anni, a Ron Dennis (1995) — la risposta di Dennis: «Phone me in nine years»">
          Hi. I&rsquo;m Lewis Hamilton. I won the British Championship and one day I want to be racing your cars.
        </Citazione>

        <p>
          Promessa mantenuta, nove anni dopo. Quando Hamilton debutta al Gran Premio d&rsquo;Australia nel 2007
          al volante della McLaren, non si comporta da esordiente. Aggredisce il compagno di squadra e campione
          in carica Fernando Alonso fin dalla prima curva, dando vita a una delle stagioni di debutto più
          devastanti e tese della storia del motorsport.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.hamilton.genesi.src}
          alt={DRIVER_PHOTOS.hamilton.genesi.alt}
          autore={DRIVER_PHOTOS.hamilton.genesi.autore}
          fonteUrl={DRIVER_PHOTOS.hamilton.genesi.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.hamilton.genesi.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.hamilton.genesi.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.hamilton.genesi.licenzaLabel}
          didascalia="La McLaren MP4-23, GP del Canada 2008: l’anno del primo titolo"
        />

        <p>
          Il Mondiale sfiorato nel 2007 e conquistato all&rsquo;ultimo respiro nel 2008 a Interlagos sono stati
          solo il prologo. La vera svolta avviene nel 2013: la scelta, derisa da molti all&rsquo;epoca, di
          lasciare la McLaren per scommettere sul nascente progetto Mercedes. Fu il passaggio chiave che diede
          inizio alla dinastia tecnologica più dominante che lo sport abbia mai conosciuto.
        </p>

        <TimelinePercorso />

        <h2>L&rsquo;equilibrio perfetto tra moda, attivismo e asfalto</h2>
        <p>
          Ciò che rende Hamilton un&rsquo;icona assoluta, capace di trascendere il motorsport come solo Senna
          aveva fatto prima di lui, è la sua capacità di disconnettersi dal paddock per rigenerarsi. Mentre la
          vecchia scuola esigeva un isolamento totale e una focalizzazione monocordica sulle corse, Lewis ha
          dimostrato che frequentare le sfilate di alta moda a New York o registrare musica in studio non
          toglieva un solo centesimo di secondo alle sue prestazioni in pista. Al contrario, lo alimentava.
        </p>
        <p>
          Dal 2020 in poi, la sua figura ha assunto una dimensione politica e sociale senza precedenti. Hamilton
          ha usato la sua visibilità globale per accendere i riflettori sulla diversità nel motorsport,
          promuovendo la <em>Hamilton Commission</em> e spingendo la Formula 1 stessa a interrogarsi sulle
          proprie barriere d&rsquo;accesso. In pista, questa consapevolezza si è tradotta in una maturità
          agonistica micidiale. Gare come Silverstone 2021 o la rimonta leggendaria di Brasile 2021 rimangono
          impresse non solo come trionfi sportivi, ma come risposte di pura resilienza mentale a scenari
          apparentemente compromessi.
        </p>

        <h2>Lo stile di guida: l&rsquo;assoluta sensibilità del limite</h2>
        <p>
          Tecnicamente, Hamilton incarna la perfetta evoluzione tra la guida d&rsquo;istinto e la gestione
          scientifica delle moderne monoposto ibride.
        </p>
        <p>
          <strong>La frenata profonda e il rilascio della pressione:</strong> il punto di forza assoluto di
          Lewis è l&rsquo;ingresso in curva. Riesce a frenare incredibilmente tardi, mantenendo una pressione
          millimetrica sul pedale del freno mentre inizia a girare il volante (la tecnica del{' '}
          <em>trail braking</em>). Questo gli permette di portare una velocità minima altissima al centro
          della curva senza bloccare le ruote anteriori.
        </p>

        <GraficoTrailBraking />

        <p>
          <strong>La gestione termica degli pneumatici:</strong> Hamilton ha sviluppato una sensibilità quasi
          simbiotica con le mescole Pirelli. Riusciva, e riesce tuttora, a firmare giri veloci con gomme
          teoricamente finite, modificando le proprie traiettorie curva dopo curva per minimizzare il
          surriscaldamento e lo scivolamento.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.hamilton.stileTecnico.src}
          alt={DRIVER_PHOTOS.hamilton.stileTecnico.alt}
          autore={DRIVER_PHOTOS.hamilton.stileTecnico.autore}
          fonteUrl={DRIVER_PHOTOS.hamilton.stileTecnico.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.hamilton.stileTecnico.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.hamilton.stileTecnico.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.hamilton.stileTecnico.licenzaLabel}
          didascalia="La Mercedes W10 in piena piega, GP di Francia 2019"
        />

        <div className="idol-hamilton__stat-griglia">
          <BoxStatistica numero="106" etichetta="vittorie" nota="record assoluto" />
          <BoxStatistica numero="104" etichetta="pole position" nota="record assoluto" />
          <BoxStatistica numero="207" etichetta="podi" nota="record assoluto" />
          <BoxStatistica numero="48" etichetta="gare consecutive a punti" nota="record assoluto, 2018–20" />
        </div>

        <h2>L&rsquo;eredità: un nuovo paradigma per il futuro</h2>
        <p>
          La sua transizione verso la Ferrari per la stagione 2025 ha rappresentato l&rsquo;ennesimo terremoto
          mediatico e culturale dello sport, a dimostrazione di una fame di sfide che non si è mai placata.
        </p>

        <Citazione attribuzione="dalla poesia «And Still I Rise» di Maya Angelou (1978) — tatuata sulla schiena di Hamilton e presente nel design del suo casco">
          Still I Rise.
        </Citazione>

        <p>
          L&rsquo;impatto di Lewis Hamilton sul motorsport è profondo e irreversibile. Ha dimostrato che un
          pilota può essere un atleta d&rsquo;élite, un&rsquo;icona di stile e un attivista sociale nello stesso
          identico momento. Ha aperto le porte a una nuova generazione di piloti, più liberi di esprimersi e
          meno vincolati agli stereotipi del passato.
        </p>

        <CreditedFigure
          src={DRIVER_PHOTOS.hamilton.eredita.src}
          alt={DRIVER_PHOTOS.hamilton.eredita.alt}
          autore={DRIVER_PHOTOS.hamilton.eredita.autore}
          fonteUrl={DRIVER_PHOTOS.hamilton.eredita.fonteUrl}
          fonteLabel={DRIVER_PHOTOS.hamilton.eredita.fonteLabel}
          licenzaUrl={DRIVER_PHOTOS.hamilton.eredita.licenzaUrl}
          licenzaLabel={DRIVER_PHOTOS.hamilton.eredita.licenzaLabel}
          didascalia="Nel paddock coi tifosi, GP d’Austria 2022"
        />

        <p>
          Hamilton non ha semplicemente collezionato più pole position e vittorie di chiunque altro; ha
          allargato il significato stesso della parola Campione.
        </p>
      </article>

      <TabellaConfronto />
    </main>
  );
}
