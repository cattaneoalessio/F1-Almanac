/**
 * lezioni.js — le lezioni di «Impara» (Academy): com'è fatta una Formula 1,
 * parte per parte, con confronto con un'auto stradale.
 *
 * Ogni lezione: id (anche indirizzo /academy/impara/:id), titolo, sommario,
 * infografica (nome del disegno in components/academy/Infografiche.jsx),
 * sezioni di testo, confronto F1 / auto stradale, foto facoltativa (solo
 * Wikimedia Commons con licenza verificata e credito completo) e fonti.
 *
 * Dati del regolamento 2026 verificati il 6/10/2026 (vedi fonti). I valori
 * delle auto stradali sono ordini di grandezza tipici, non di un modello
 * preciso: per questo sono scritti come «circa» o come intervalli.
 */

const FONTE_FIA_2026 = {
  titolo: 'FIA — Regolamento Formula 1 2026 (presentazione ufficiale)',
  url: 'https://www.fia.com/node/51855',
};
const FONTE_PU_2026 = {
  titolo: 'Honda Racing — Panoramica del regolamento 2026',
  url: 'https://global.honda/en/F1/features/2026_Commentary/regulations/',
};
const FONTE_PEREME = {
  titolo: 'F1Technical — Intervista a Vincent Pereme (FIA) sulle power unit 2026',
  url: 'https://f1technical.net/news/24816',
};

export const LEZIONI = [
  {
    id: 'com-e-fatta',
    titolo: "Com'è fatta una Formula 1",
    sommario: 'Le parti principali di una monoposto e a cosa servono: la mappa per orientarsi nelle altre lezioni.',
    infografica: 'esploso',
    foto: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Formula_one.jpg/1280px-Formula_one.jpg',
      alt: 'Monoposto di Formula 1 in curva al Gran Premio degli Stati Uniti 2003 a Indianapolis',
      autore: 'Rick Dikeman',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Formula_one.jpg',
      licenza: 'CC BY-SA 3.0',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
      didascalia: 'Monoposto del 2003 a Indianapolis: forme diverse da oggi, stessi principi.',
    },
    sezioni: [
      {
        titolo: 'Un prototipo costruito attorno al pilota',
        testo: [
          "Una Formula 1 è un'auto da corsa a ruote scoperte e con un solo posto. Al centro c'è la monoscocca, una «vasca» di fibra di carbonio dove siede il pilota: tutto il resto è fissato a lei. Davanti ci sono musetto e ala anteriore, ai lati le pance con i radiatori, dietro la power unit, il cambio e l'ala posteriore.",
          "Ogni parte ha due lavori allo stesso tempo: quello meccanico e quello aerodinamico. Anche i bracci delle sospensioni o le prese d'aria dei freni sono disegnati per guidare l'aria nel modo giusto.",
        ],
      },
      {
        titolo: 'Le regole del 2026 in breve',
        testo: [
          "Dal 2026 le auto sono più piccole e leggere: passo massimo di 3.400 mm (200 in meno), larghezza massima di 1.900 mm (100 in meno) e peso minimo di 768 kg con il pilota, circa 30 kg in meno della generazione precedente.",
          "Cambiano anche il motore, con metà della potenza che arriva dall'elettrico, e l'aerodinamica, che diventa attiva: le ali cambiano configurazione tra curva e rettilineo.",
        ],
      },
    ],
    confronto: [
      ['Peso', '768 kg minimo, pilota compreso', 'circa 1.100–1.500 kg per un\'auto media'],
      ['Lunghezza tra gli assi (passo)', 'fino a 3,4 m', 'circa 2,5–2,8 m'],
      ['Posti', '1', '4–5'],
      ['Materiale principale', 'fibra di carbonio', 'acciaio e alluminio'],
    ],
    fonti: [FONTE_FIA_2026],
  },
  {
    id: 'power-unit',
    titolo: 'La power unit',
    sommario: 'Un V6 turbo da 1,6 litri e un motore elettrico da 350 kW: come funziona il «motore» ibrido della F1 2026.',
    infografica: 'powerUnit',
    sezioni: [
      {
        titolo: 'Non solo un motore',
        testo: [
          "In F1 non si parla più di «motore» ma di power unit: un motore termico V6 di 1,6 litri con turbocompressore, più un motore-generatore elettrico (MGU-K), una batteria e la centralina che li gestisce.",
          "Dal 2026 la potenza è divisa circa a metà: circa 400 kW (circa 540 CV) dal termico e fino a 350 kW (circa 475 CV) dall'elettrico. Prima l'elettrico si fermava a 120 kW.",
        ],
      },
      {
        titolo: 'Recuperare in frenata, restituire in accelerazione',
        testo: [
          "In frenata la MGU-K lavora come una dinamo: frena le ruote posteriori e trasforma il movimento in elettricità, che va nella batteria. In accelerazione fa il contrario e spinge insieme al motore termico. Dal 2026 si possono recuperare circa 8,5 MJ per giro, quasi il doppio di prima.",
          "Dal 2026 sparisce invece la MGU-H, il generatore collegato al turbo che recuperava energia dai gas di scarico: era molto costoso e poco utile per le auto di tutti i giorni.",
        ],
      },
      {
        titolo: 'Boost, Overtake e ricarica',
        testo: [
          "Gestire l'energia diventa parte della guida. Con il Boost il pilota chiede tutta la spinta elettrica quando vuole; con l'Overtake Mode, chi è entro un secondo dall'auto davanti riceve energia in più per tentare il sorpasso. Ma la batteria va anche ricaricata: chi la svuota troppo presto resta senza spinta in fondo al rettilineo.",
          "Il carburante è 100% sostenibile, cioè non di origine fossile, e il regolamento limita l'energia del carburante usata ogni ora (3.000 MJ/h) invece della sua massa.",
        ],
      },
    ],
    confronto: [
      ['Cilindrata', '1,6 litri, V6 turbo', 'circa 1,0–2,0 litri'],
      ['Potenza totale', 'circa 750 kW (oltre 1.000 CV)', 'circa 70–150 kW (100–200 CV)'],
      ['Parte elettrica', 'fino a 350 kW', 'ibride comuni: circa 30–100 kW'],
      ['Giri motore massimi', '15.000 al minuto', 'circa 6.000–7.000 al minuto'],
      ['Durata', 'pochi componenti per tutta la stagione', 'centinaia di migliaia di km'],
    ],
    fonti: [FONTE_PU_2026, FONTE_PEREME],
  },
  {
    id: 'aerodinamica',
    titolo: "L'aerodinamica",
    sommario: "Perché una F1 curva molto più forte di qualsiasi auto: carico aerodinamico, effetto suolo e ali attive.",
    infografica: 'aerodinamica',
    sezioni: [
      {
        titolo: "Un'ala d'aereo al contrario",
        testo: [
          "Le ali di un aereo sono disegnate per sollevarlo. Quelle di una F1 sono capovolte: spingono l'auto verso il basso. Questa forza si chiama carico aerodinamico (downforce) e cresce con la velocità: più l'auto va forte, più è schiacciata a terra e più aderenza hanno le gomme.",
          "Il prezzo da pagare è la resistenza (drag): l'aria frena l'auto e ne limita la velocità massima. Per questo su piste veloci come Monza le squadre usano ali più «scariche».",
        ],
      },
      {
        titolo: 'Il fondo fa il lavoro più grande',
        testo: [
          "Dal 2022 gran parte del carico viene dal fondo: sotto l'auto ci sono canali (tunnel Venturi) che si stringono e poi si allargano. L'aria accelera, la pressione sotto l'auto scende e la vettura viene «risucchiata» verso l'asfalto. È l'effetto suolo, e ha il vantaggio di sporcare meno l'aria per chi segue.",
          "Il diffusore, la parte finale del fondo, rallenta l'aria in uscita e completa il lavoro. Se l'auto è troppo bassa, il flusso si interrompe e riparte di continuo: è il porpoising, il saltellamento visto nel 2022.",
        ],
      },
      {
        titolo: 'Ali attive dal 2026',
        testo: [
          "Dal 2026 ala anteriore e posteriore hanno parti mobili. In curva restano nella configurazione ad alto carico (Corner Mode); sui rettilinei indicati il pilota le porta nella configurazione a bassa resistenza (Straight Mode) per andare più forte. Il vecchio DRS, usato dal 2011 al 2025 solo per sorpassare, è stato eliminato.",
        ],
      },
    ],
    confronto: [
      ['Effetto dell\'aria ad alta velocità', 'schiaccia l\'auto a terra', 'tende a sollevarla leggermente'],
      ['Ali', 'anteriore e posteriore, mobili dal 2026', 'nessuna, o uno spoiler'],
      ['Fondo', 'sagomato per generare carico', 'piatto o con protezioni'],
      ['Accelerazione laterale in curva', 'circa 5–6 g nelle curve più veloci', 'circa 0,8–1 g al limite'],
    ],
    fonti: [FONTE_FIA_2026],
  },
  {
    id: 'freni',
    titolo: 'I freni',
    sommario: 'Dischi in carbonio a 1.000 °C, decelerazioni da 5 g e un sistema che frena e ricarica la batteria insieme.',
    infografica: 'freni',
    sezioni: [
      {
        titolo: 'Carbonio che lavora rovente',
        testo: [
          "I freni di una F1 sono in carbonio-carbonio: dischi e pastiglie leggerissimi che funzionano bene solo ad alta temperatura e in frenata possono superare i 1.000 °C. Da freddi frenano poco: per questo nei giri lenti il pilota deve tenerli in temperatura.",
          "La frenata è violentissima: nelle staccate più dure il pilota subisce oltre 5 g, cioè una spinta in avanti pari a più di cinque volte il proprio peso. Il carico aerodinamico aiuta: ad alta velocità le gomme sono schiacciate a terra e possono frenare di più.",
        ],
      },
      {
        titolo: 'Brake-by-wire: freno e dinamo insieme',
        testo: [
          "Al posteriore la frenata è divisa tra i freni veri e la MGU-K, che frena recuperando energia. Un'elettronica (brake-by-wire) dosa le due parti in modo che il pilota senta sempre lo stesso pedale. Con il 2026 il recupero conta ancora di più, perché la batteria va ricaricata molto.",
          "Dal volante il pilota regola anche la ripartizione di frenata tra anteriore e posteriore, persino curva per curva.",
        ],
      },
    ],
    confronto: [
      ['Materiale dei dischi', 'carbonio-carbonio', 'ghisa o acciaio (carboceramica sulle sportive)'],
      ['Temperatura di lavoro', 'oltre 1.000 °C nelle staccate', 'qualche centinaio di gradi'],
      ['Decelerazione massima', 'oltre 5 g', 'circa 1 g'],
      ['Da 200 a 0 km/h', 'circa 3 secondi', 'circa 5 secondi per un\'auto sportiva'],
      ['Recupero di energia', 'sì, fino a 350 kW', 'sulle ibride ed elettriche, molto meno'],
    ],
    fonti: [FONTE_PU_2026],
  },
  {
    id: 'cambio',
    titolo: 'Il cambio',
    sommario: 'Otto marce, cambiate in pochi millesimi di secondo e nessuna interruzione di spinta.',
    infografica: 'cambio',
    sezioni: [
      {
        titolo: 'Otto marce senza pause',
        testo: [
          "Il cambio di una F1 ha 8 marce avanti più la retromarcia. È semiautomatico: il pilota cambia con due palette dietro il volante (destra per salire, sinistra per scendere) e la frizione si usa quasi solo alla partenza.",
          "È un cambio seamless: inserisce la marcia successiva prima di liberare quella precedente, così la spinta non si interrompe mai. Una cambiata dura pochi millesimi di secondo.",
        ],
      },
      {
        titolo: 'Fa parte del telaio',
        testo: [
          "La scatola del cambio non è solo trasmissione: è un pezzo della struttura dell'auto. A lei sono attaccate le sospensioni posteriori e la struttura d'urto posteriore. Anche il cambio, come la power unit, deve durare molte gare: sostituirlo troppo spesso costa posizioni in griglia.",
        ],
      },
    ],
    confronto: [
      ['Marce avanti', '8', '5–8 (o automatico)'],
      ['Comando', 'palette al volante', 'leva e pedale della frizione, o automatico'],
      ['Tempo di cambiata', 'pochi millesimi di secondo', 'circa mezzo secondo con il manuale'],
      ['Interruzione della spinta', 'nessuna (seamless)', 'sì, durante la cambiata'],
    ],
    fonti: [FONTE_FIA_2026],
  },
  {
    id: 'volante',
    titolo: 'Il volante',
    sommario: 'Più un computer che un volante: display, pulsanti e manopole per controllare tutta l\'auto in corsa.',
    infografica: 'volante',
    sezioni: [
      {
        titolo: 'Un cruscotto da tenere in mano',
        testo: [
          "Il volante di una F1 è una piccola plancia di comando in fibra di carbonio, con un display e decine di pulsanti e manopole. Non è rotondo: è rettangolare, perché lo sterzo gira poco e al pilota servono spazio per le mani e accesso ai comandi.",
          "Dietro ci sono le palette del cambio e la leva della frizione. Ogni volante è costruito su misura per le mani del suo pilota e si sfila per entrare e uscire dall'abitacolo.",
        ],
      },
      {
        titolo: 'Cosa si comanda',
        testo: [
          "Radio, limitatore di velocità per la corsia dei box, ripartizione di frenata, differenziale, mappature del motore e, dal 2026, gestione dell'energia elettrica e delle modalità Boost e Overtake. Il pilota cambia impostazioni anche più volte in un giro, a oltre 300 km/h.",
          "Ogni squadra disegna il proprio volante: posizione e nome dei comandi cambiano da una all'altra. L'illustrazione qui sopra è uno schema generico.",
        ],
      },
    ],
    confronto: [
      ['Forma', 'rettangolare, con impugnature', 'rotonda'],
      ['Comandi', 'decine di pulsanti e manopole', 'pochi pulsanti (radio, cruise control)'],
      ['Display', 'integrato nel volante', 'nel cruscotto'],
      ['Rotazione dello sterzo', 'molto limitata: le mani non lasciano mai il volante', 'ampia, con più giri da un lato all\'altro'],
    ],
    fonti: [FONTE_FIA_2026],
  },
  {
    id: 'gomme',
    titolo: 'Le gomme',
    sommario: 'Sei mescole da asciutto, due da bagnato e colori per riconoscerle: il punto di contatto tra auto e pista.',
    infografica: 'gomme',
    sezioni: [
      {
        titolo: 'Un fornitore, tante mescole',
        testo: [
          "Le gomme di F1 sono fornite da Pirelli a tutte le squadre. Per l'asciutto ci sono sei mescole, da C1 (la più dura) a C6 (la più morbida): in ogni weekend Pirelli ne sceglie tre, che diventano Hard (banda bianca), Medium (gialla) e Soft (rossa). Per la pioggia ci sono le Intermedie (verdi) e le Full Wet (blu).",
          "Le gomme da asciutto sono slick, cioè lisce: senza scolpitura c'è più gomma appoggiata a terra e quindi più aderenza. I cerchi sono da 18 pollici dal 2022.",
        ],
      },
      {
        titolo: 'Morbida o dura: un compromesso',
        testo: [
          "Una gomma morbida aderisce di più e fa girare più forte, ma si consuma prima. Una dura è più lenta ma dura di più. Su questo si gioca la strategia: in una gara asciutta ogni pilota deve usare almeno due mescole diverse.",
          "La gomma funziona solo nella sua finestra di temperatura: troppo fredda scivola e fa graining, troppo calda fa blistering e si degrada in fretta.",
        ],
      },
    ],
    confronto: [
      ['Battistrada sull\'asciutto', 'liscio (slick)', 'scolpito'],
      ['Durata', 'da qualche decina a qualche centinaio di km', 'decine di migliaia di km'],
      ['Temperatura ideale', 'molto alta, si scaldano con termocoperte', 'temperatura ambiente'],
      ['Cerchio', '18 pollici', 'circa 15–19 pollici'],
    ],
    fonti: [FONTE_FIA_2026],
  },
  {
    id: 'telaio-sicurezza',
    titolo: 'Telaio e sicurezza',
    sommario: 'Monoscocca in carbonio, halo in titanio, crash test: come una F1 protegge il pilota.',
    infografica: 'sicurezza',
    foto: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/F1_Carbon_Fibre_Halo_at_Formula_1_Exhibition%2C_London.jpg/1280px-F1_Carbon_Fibre_Halo_at_Formula_1_Exhibition%2C_London.jpg',
      alt: "Monoscocca in fibra di carbonio di una F1 con la base dell'halo, esposta in una mostra a Londra",
      autore: 'Hullian111',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:F1_Carbon_Fibre_Halo_at_Formula_1_Exhibition,_London.jpg',
      licenza: 'CC BY-SA 4.0',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      didascalia: "Una monoscocca in carbonio con l'attacco dell'halo, esposta alla Formula 1 Exhibition di Londra.",
    },
    sezioni: [
      {
        titolo: 'La monoscocca',
        testo: [
          "Il cuore dell'auto è la monoscocca, una struttura in fibra di carbonio che contiene il pilota e il serbatoio. Prima di correre deve superare i crash test della FIA: urti frontali, laterali e prove di carico sul roll hoop, la struttura sopra la testa del pilota. Dal 2026 i carichi di prova del roll hoop sono saliti da 16 a 20 g e la protezione laterale è stata rinforzata.",
          "Davanti, dietro e ai lati ci sono strutture d'urto che si deformano per assorbire l'energia di un incidente, mentre la cellula di sopravvivenza attorno al pilota resta intatta.",
        ],
      },
      {
        titolo: "L'halo",
        testo: [
          "Dal 2018 sopra l'abitacolo c'è l'halo, un arco di titanio di circa 7 kg che protegge la testa del pilota da ruote, detriti e altre auto. Nei test deve reggere un carico verticale di 116 kN, circa 12 tonnellate, come se un autobus a due piani gli fosse appoggiato sopra.",
          "All'inizio era criticato per l'aspetto. Poi incidenti come quello di Romain Grosjean in Bahrain nel 2020, quando l'auto ha sfondato il guard-rail, hanno mostrato quanto sia importante.",
        ],
      },
      {
        titolo: 'Il pilota',
        testo: [
          "Il pilota indossa tuta, guanti e sottotuta ignifughi, un casco in carbonio omologato e il collare HANS, che collega casco e spalle e limita i movimenti della testa negli urti. Il sedile è stampato sul suo corpo e si estrae con lui dentro in caso di soccorso.",
        ],
      },
    ],
    confronto: [
      ['Struttura', 'monoscocca in fibra di carbonio', 'scocca in acciaio e alluminio'],
      ['Cinture', 'a sei punti', 'a tre punti'],
      ['Protezione della testa', 'halo, casco, HANS', 'airbag e poggiatesta'],
      ['Omologazione', 'crash test FIA per ogni telaio', 'crash test per il modello (es. Euro NCAP)'],
    ],
    fonti: [
      FONTE_FIA_2026,
      { titolo: 'Autocar — Halo: come è stato progettato', url: 'https://www.autocar.co.uk/car-news/motorsport-news/formula-1-halo-devices-grosjean-crash-proves-theyre-here-stay' },
    ],
  },
  {
    id: 'sospensioni',
    titolo: 'Le sospensioni',
    sommario: 'Bracci in carbonio, push-rod e pull-rod: tenere le ruote a terra e il fondo alla giusta altezza.',
    infografica: 'sospensioni',
    sezioni: [
      {
        titolo: 'Più rigide di quanto immagini',
        testo: [
          "Le sospensioni collegano le ruote al telaio con bracci in fibra di carbonio a forma di triangolo. Molle e ammortizzatori non sono vicino alle ruote, come nelle auto stradali, ma dentro la carrozzeria: un'asta li collega alla ruota. Se l'asta lavora spingendo si parla di push-rod, se lavora tirando di pull-rod.",
          "Con l'effetto suolo il fondo deve restare a un'altezza da terra molto precisa: per questo le sospensioni sono rigidissime e il comfort non esiste. Sui cordoli il pilota viene scosso con forza.",
        ],
      },
      {
        titolo: "L'assetto",
        testo: [
          "Altezza da terra, rigidità, barre antirollio, campanatura e convergenza delle ruote formano l'assetto, che si adatta a ogni pista. Dopo la qualifica, in regime di parco chiuso, l'assetto non si può più cambiare.",
        ],
      },
    ],
    confronto: [
      ['Bracci', 'in fibra di carbonio', 'in acciaio o alluminio'],
      ['Molle e ammortizzatori', 'dentro la carrozzeria, comandati da aste', 'vicino alle ruote'],
      ['Escursione', 'pochi centimetri', 'molti centimetri'],
      ['Obiettivo', 'piattaforma stabile per l\'aerodinamica', 'comfort e tenuta di strada'],
    ],
    fonti: [FONTE_FIA_2026],
  },
];

export const lezioneDaId = (id) => LEZIONI.find((l) => l.id === id) || null;
