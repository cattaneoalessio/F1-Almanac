/**
 * loSapevi.js — curiosità per il box "Lo sapevi che" della home.
 *
 * ROTAZIONE: una curiosità al giorno, uguale per tutti i visitatori, che
 * cambia a mezzanotte ora italiana (vedi utils/curiositaDelGiorno.js).
 * L'ordine è mescolato in modo casuale ma riproducibile: ogni ciclo di N
 * giorni (N = numero di voci qui sotto) mostra ogni curiosità una sola
 * volta, poi l'ordine si rimescola per il ciclo successivo.
 *
 * FONTI: le prime 4 voci (stagione 1950) sono state verificate con una
 * query sul database reale. Le altre sono fatti storici ampiamente
 * documentati, scritti senza accesso diretto a Neon: prima di aggiungerne
 * altre, preferire fatti noti e controllabili, evitare cifre che cambiano
 * nel tempo ("record attuale di vittorie", "ultimo campione Ferrari") e
 * frasi che diventano false a fine stagione.
 *
 * LINK: gli slug seguono la regola deterministica dell'import
 * (slugify("Nome Cognome"), circuiti da MAPPA_CIRCUITI). Per controllare
 * che esistano tutti nel database: db/verifica_link_lo_sapevi.sql.
 *
 * Nota deliberata: NON includiamo "chi fu il primo campione del mondo"
 * (Farina, 1950) né classifiche finali delle stagioni con gli scarti
 * (fino al 1990): la classifica del sito, calcolata "a somma di tutti i
 * risultati", per quegli anni può mostrare un ordine diverso dal reale.
 * Fa eccezione prost-senna-1988, che spiega proprio questo meccanismo.
 */
export const FATTI_LO_SAPEVI = [
  {
    id: "primo-gp",
    testo:
      "Il primo Gran Premio della storia del Mondiale di Formula 1 si corse il 13 maggio 1950 a Silverstone: a vincerlo fu Nino Farina su Alfa Romeo.",
    linkTo: "/archivio/1950/silverstone",
    linkLabel: "Rivedi il Gran Premio di Gran Bretagna 1950",
  },
  {
    id: "alfa-romeo-1950",
    testo:
      "Nel 1950 l'Alfa Romeo vinse tutte e sei le gare europee della stagione. L'unica eccezione fu la Indianapolis 500, che quell'anno assegnava punti iridati ma fu vinta da Johnnie Parsons su Kurtis Kraft.",
    linkTo: "/archivio/1950/indianapolis",
    linkLabel: "Rivedi la Indianapolis 500 del 1950",
  },
  {
    id: "monaco-1950-lunga",
    testo:
      "Il Gran Premio di Monaco 1950 fu il più lungo in durata dei sette della stagione: oltre 3 ore e 13 minuti di gara per Juan Manuel Fangio, il vincitore.",
    linkTo: "/archivio/1950/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 1950",
  },
  {
    id: "fangio-farina-compagni",
    testo:
      "Juan Manuel Fangio e Nino Farina, compagni di squadra in Alfa Romeo nel 1950, vinsero insieme sei delle sette gare della stagione inaugurale del Mondiale.",
    linkTo: "/piloti/juan-manuel-fangio",
    linkLabel: "Vai alla scheda di Fangio",
  },
  {
    id: "ferrari-debutto",
    testo:
      "La Ferrari debuttò nel Mondiale al Gran Premio di Monaco 1950, la seconda gara della storia: Alberto Ascari chiuse secondo. È l'unica scuderia presente in ogni stagione del campionato.",
    linkTo: "/archivio/1950/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 1950",
  },
  {
    id: "ferrari-prima-vittoria",
    testo:
      "La prima vittoria della Ferrari nel Mondiale arrivò a Silverstone nel 1951, con l'argentino José Froilán González.",
    linkTo: "/archivio/1951/silverstone",
    linkLabel: "Rivedi il Gran Premio di Gran Bretagna 1951",
  },
  {
    id: "ascari-ultimo-italiano",
    testo:
      "Alberto Ascari, campione nel 1952 e nel 1953 con la Ferrari, è ancora oggi l'ultimo pilota italiano ad aver vinto il Mondiale di Formula 1.",
    linkTo: "/piloti/alberto-ascari",
    linkLabel: "Vai alla scheda di Ascari",
  },
  {
    id: "ascari-porto",
    testo:
      "Al Gran Premio di Monaco 1955 Alberto Ascari perse il controllo della sua Lancia alla chicane e finì in mare, nel porto. Ne uscì a nuoto, quasi illeso.",
    linkTo: "/archivio/1955/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 1955",
  },
  {
    id: "fangio-nurburgring-1957",
    testo:
      "Al Nürburgring 1957 Fangio, attardato da un pit stop lento, batté più volte il record sul giro, superò Collins e Hawthorn e vinse. Fu la sua ultima vittoria e gli valse il quinto titolo.",
    linkTo: "/archivio/1957/nurburgring",
    linkLabel: "Rivedi il Gran Premio di Germania 1957",
  },
  {
    id: "fangio-piu-anziano",
    testo:
      "Fangio conquistò il titolo 1957 a 46 anni: è ancora il campione del mondo più anziano della storia della Formula 1.",
    linkTo: "/piloti/juan-manuel-fangio",
    linkLabel: "Vai alla scheda di Fangio",
  },
  {
    id: "fagioli-vincitore-anziano",
    testo:
      "Luigi Fagioli vinse il Gran Premio di Francia 1951 a 53 anni, dividendo l'auto con Fangio: è il vincitore più anziano di un Gran Premio del Mondiale.",
    linkTo: "/piloti/luigi-fagioli",
    linkLabel: "Vai alla scheda di Fagioli",
  },
  {
    id: "mercedes-reims-1954",
    testo:
      "La Mercedes debuttò in Formula 1 al Gran Premio di Francia 1954 a Reims con la W196 carenata: Fangio e Kling chiusero primo e secondo.",
    linkTo: "/archivio/1954/reims",
    linkLabel: "Rivedi il Gran Premio di Francia 1954",
  },
  {
    id: "pescara-1957",
    testo:
      "Il circuito di Pescara, quasi 26 km di strade pubbliche, è il più lungo mai usato in Formula 1. Ospitò un solo Gran Premio, nel 1957, vinto da Stirling Moss.",
    linkTo: "/archivio/1957/pescara",
    linkLabel: "Rivedi il Gran Premio di Pescara 1957",
  },
  {
    id: "moss-mai-campione",
    testo:
      "Stirling Moss vinse 16 Gran Premi ma non diventò mai campione del mondo: fu secondo in classifica quattro volte di fila, dal 1955 al 1958.",
    linkTo: "/piloti/stirling-moss",
    linkLabel: "Vai alla scheda di Moss",
  },
  {
    id: "hawthorn-1958",
    testo:
      "Nel 1958 Mike Hawthorn batté Moss per un solo punto pur avendo vinto una sola gara. In Portogallo era stato Moss stesso a testimoniare in suo favore, evitandogli la squalifica.",
    linkTo: "/piloti/mike-hawthorn",
    linkLabel: "Vai alla scheda di Hawthorn",
  },
  {
    id: "monza-sopraelevata",
    testo:
      "Negli anni 1955, 1956, 1960 e 1961 il Gran Premio d'Italia si corse sul circuito combinato di Monza, che comprendeva anche l'anello sopraelevato ad alta velocità.",
    linkTo: "/circuiti/monza",
    linkLabel: "Vai alla scheda di Monza",
  },
  {
    id: "phil-hill-1961",
    testo:
      "Phil Hill fu il primo statunitense campione del mondo, nel 1961. Conquistò il titolo a Monza, nella gara in cui morì il compagno di squadra e rivale Wolfgang von Trips.",
    linkTo: "/piloti/phil-hill",
    linkLabel: "Vai alla scheda di Phil Hill",
  },
  {
    id: "clark-1963",
    testo:
      "Nel 1963 Jim Clark vinse sette dei dieci Gran Premi in calendario con la Lotus.",
    linkTo: "/piloti/jim-clark",
    linkLabel: "Vai alla scheda di Clark",
  },
  {
    id: "surtees-due-ruote",
    testo:
      "John Surtees è l'unico campione del mondo sia su due ruote, nel Motomondiale, sia su quattro, in Formula 1 nel 1964.",
    linkTo: "/piloti/john-surtees",
    linkLabel: "Vai alla scheda di Surtees",
  },
  {
    id: "brabham-auto-propria",
    testo:
      "Jack Brabham è l'unico pilota ad aver vinto il Mondiale con un'auto che portava il suo nome: la Brabham, nel 1966.",
    linkTo: "/piloti/jack-brabham",
    linkLabel: "Vai alla scheda di Brabham",
  },
  {
    id: "mclaren-prima-vittoria",
    testo:
      "La prima vittoria della McLaren in Formula 1 la ottenne il suo fondatore, Bruce McLaren, al Gran Premio del Belgio 1968 a Spa.",
    linkTo: "/archivio/1968/spa",
    linkLabel: "Rivedi il Gran Premio del Belgio 1968",
  },
  {
    id: "graham-hill-tripla-corona",
    testo:
      "Graham Hill è l'unico pilota ad aver vinto la cosiddetta Tripla Corona: Gran Premio di Monaco, 500 Miglia di Indianapolis e 24 Ore di Le Mans.",
    linkTo: "/piloti/graham-hill",
    linkLabel: "Vai alla scheda di Graham Hill",
  },
  {
    id: "hill-padre-figlio",
    testo:
      "Graham e Damon Hill sono stati i primi padre e figlio entrambi campioni del mondo. Gli unici altri sono Keke e Nico Rosberg.",
    linkTo: "/piloti/damon-hill",
    linkLabel: "Vai alla scheda di Damon Hill",
  },
  {
    id: "rindt-postumo",
    testo:
      "Jochen Rindt è l'unico campione del mondo postumo: morì nelle prove del Gran Premio d'Italia 1970 e nessuno riuscì più a superarlo in classifica.",
    linkTo: "/piloti/jochen-rindt",
    linkLabel: "Vai alla scheda di Rindt",
  },
  {
    id: "monza-1971",
    testo:
      "Il Gran Premio d'Italia 1971 ebbe l'arrivo più serrato della storia: Peter Gethin vinse con un centesimo di secondo su Ronnie Peterson, e i primi cinque arrivarono in sei decimi.",
    linkTo: "/archivio/1971/monza",
    linkLabel: "Rivedi il Gran Premio d'Italia 1971",
  },
  {
    id: "fittipaldi-giovane",
    testo:
      "Emerson Fittipaldi vinse il titolo 1972 a 25 anni: fu il campione più giovane della storia fino al primo titolo di Fernando Alonso, nel 2005.",
    linkTo: "/piloti/emerson-fittipaldi",
    linkLabel: "Vai alla scheda di Fittipaldi",
  },
  {
    id: "lauda-ritorno",
    testo:
      "Dopo il rogo del Nürburgring 1976, Niki Lauda tornò in pista appena sei settimane più tardi, a Monza, e chiuse quarto.",
    linkTo: "/piloti/niki-lauda",
    linkLabel: "Vai alla scheda di Lauda",
  },
  {
    id: "hunt-1976",
    testo:
      "Il Mondiale 1976 si decise sotto la pioggia del Fuji: James Hunt chiuse con 69 punti, uno in più di Niki Lauda.",
    linkTo: "/piloti/james-hunt",
    linkLabel: "Vai alla scheda di Hunt",
  },
  {
    id: "nordschleife",
    testo:
      "Il vecchio Nürburgring, la Nordschleife, misurava oltre 22 km: la Formula 1 lo abbandonò dopo il 1976.",
    linkTo: "/circuiti/nurburgring",
    linkLabel: "Vai alla scheda del Nürburgring",
  },
  {
    id: "andretti-1978",
    testo:
      "Mario Andretti, campione nel 1978 con la Lotus, è l'ultimo pilota statunitense ad aver vinto il Mondiale. Aveva vinto anche la Indianapolis 500 nel 1969.",
    linkTo: "/piloti/mario-andretti",
    linkLabel: "Vai alla scheda di Andretti",
  },
  {
    id: "scheckter-1979",
    testo:
      "Dopo il titolo di Jody Scheckter nel 1979, la Ferrari attese 21 anni il campione del mondo successivo: Michael Schumacher, nel 2000.",
    linkTo: "/piloti/jody-scheckter",
    linkLabel: "Vai alla scheda di Scheckter",
  },
  {
    id: "rosberg-1982",
    testo:
      "Keke Rosberg vinse il Mondiale 1982 con una sola vittoria in stagione, in una stagione in cui undici piloti diversi salirono sul gradino più alto del podio.",
    linkTo: "/piloti/keke-rosberg",
    linkLabel: "Vai alla scheda di Keke Rosberg",
  },
  {
    id: "lauda-mezzo-punto",
    testo:
      "Il Mondiale 1984 si decise per mezzo punto: Lauda 72, Prost 71,5. Pesò il Gran Premio di Monaco, interrotto per pioggia e con i punti dimezzati.",
    linkTo: "/archivio/1984/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 1984",
  },
  {
    id: "senna-estoril-1985",
    testo:
      "La prima vittoria di Ayrton Senna arrivò sotto il diluvio dell'Estoril, nel Gran Premio del Portogallo 1985, con la Lotus.",
    linkTo: "/archivio/1985/estoril",
    linkLabel: "Rivedi il Gran Premio del Portogallo 1985",
  },
  {
    id: "hungaroring-1986",
    testo:
      "Nel 1986 l'Hungaroring ospitò il primo Gran Premio di Formula 1 oltre la cortina di ferro. Vinse Nelson Piquet.",
    linkTo: "/archivio/1986/hungaroring",
    linkLabel: "Rivedi il Gran Premio d'Ungheria 1986",
  },
  {
    id: "prost-senna-1988",
    testo:
      "Nel 1988 Alain Prost fece più punti di Ayrton Senna, ma il titolo andò a Senna: allora contavano solo gli 11 migliori risultati su 16 gare.",
    linkTo: "/piloti/alain-prost",
    linkLabel: "Vai alla scheda di Prost",
  },
  {
    id: "mclaren-1988-monza",
    testo:
      "Nel 1988 la McLaren vinse 15 gare su 16. L'unica sfuggita fu Monza, vinta da Gerhard Berger con la Ferrari poche settimane dopo la morte di Enzo Ferrari.",
    linkTo: "/archivio/1988/monza",
    linkLabel: "Rivedi il Gran Premio d'Italia 1988",
  },
  {
    id: "senna-monaco",
    testo:
      "Ayrton Senna detiene il record di vittorie al Gran Premio di Monaco: sei, di cui cinque consecutive dal 1989 al 1993.",
    linkTo: "/circuiti/monaco",
    linkLabel: "Vai alla scheda di Monaco",
  },
  {
    id: "mansell-1992",
    testo:
      "Nel 1992 Nigel Mansell vinse nove gare e chiuse il Mondiale già ad agosto, in Ungheria.",
    linkTo: "/piloti/nigel-mansell",
    linkLabel: "Vai alla scheda di Mansell",
  },
  {
    id: "schumacher-spa-1992",
    testo:
      "Michael Schumacher vinse il suo primo Gran Premio a Spa nel 1992, con la Benetton, un anno dopo aver debuttato sullo stesso circuito con la Jordan.",
    linkTo: "/archivio/1992/spa",
    linkLabel: "Rivedi il Gran Premio del Belgio 1992",
  },
  {
    id: "monaco-1996",
    testo:
      "Al Gran Premio di Monaco 1996 solo tre auto tagliarono il traguardo. Vinse Olivier Panis con la Ligier, unica vittoria della sua carriera.",
    linkTo: "/archivio/1996/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 1996",
  },
  {
    id: "villeneuve-1997",
    testo:
      "Jacques Villeneuve vinse il Mondiale 1997 a Jerez, dopo il contatto con Michael Schumacher, che venne poi escluso dalla classifica finale di quella stagione.",
    linkTo: "/piloti/jacques-villeneuve",
    linkLabel: "Vai alla scheda di Jacques Villeneuve",
  },
  {
    id: "schumacher-2002",
    testo:
      "Nel 2002 Michael Schumacher salì sul podio in tutte le 17 gare della stagione, un record mai eguagliato.",
    linkTo: "/piloti/michael-schumacher",
    linkLabel: "Vai alla scheda di Schumacher",
  },
  {
    id: "sette-titoli",
    testo:
      "Michael Schumacher e Lewis Hamilton condividono il record di titoli mondiali: sette a testa.",
    linkTo: "/piloti/michael-schumacher",
    linkLabel: "Vai alla scheda di Schumacher",
  },
  {
    id: "indianapolis-2005",
    testo:
      "Al Gran Premio degli Stati Uniti 2005 a Indianapolis partirono solo sei auto: le squadre gommate Michelin si ritirarono dopo il giro di ricognizione per problemi di sicurezza.",
    linkTo: "/archivio/2005/indianapolis",
    linkLabel: "Rivedi il Gran Premio degli Stati Uniti 2005",
  },
  {
    id: "raikkonen-2007",
    testo:
      "Kimi Räikkönen vinse il Mondiale 2007 con un punto su Hamilton e Alonso, dopo essere stato a 17 punti dal comando con due gare da correre.",
    linkTo: "/piloti/kimi-raikkonen",
    linkLabel: "Vai alla scheda di Räikkönen",
  },
  {
    id: "hamilton-interlagos-2008",
    testo:
      "Lewis Hamilton vinse il titolo 2008 all'ultima curva dell'ultima gara, a Interlagos, superando Timo Glock: chiuse con un punto su Felipe Massa.",
    linkTo: "/archivio/2008/interlagos",
    linkLabel: "Rivedi il Gran Premio del Brasile 2008",
  },
  {
    id: "singapore-notturna",
    testo:
      "Il Gran Premio di Singapore 2008 fu la prima gara in notturna della storia della Formula 1.",
    linkTo: "/circuiti/singapore",
    linkLabel: "Vai alla scheda di Singapore",
  },
  {
    id: "button-brawn",
    testo:
      "Jenson Button vinse il Mondiale 2009 con la Brawn GP, una squadra che corse una sola stagione e vinse entrambi i titoli.",
    linkTo: "/piloti/jenson-button",
    linkLabel: "Vai alla scheda di Button",
  },
  {
    id: "vettel-piu-giovane",
    testo:
      "Sebastian Vettel è il campione del mondo più giovane della storia: vinse il titolo 2010 a 23 anni.",
    linkTo: "/piloti/sebastian-vettel",
    linkLabel: "Vai alla scheda di Vettel",
  },
  {
    id: "rosberg-cina-2012",
    testo:
      "In Cina nel 2012 Nico Rosberg ottenne la sua prima vittoria, la prima della Mercedes come squadra ufficiale dal 1955.",
    linkTo: "/archivio/2012/shanghai",
    linkLabel: "Rivedi il Gran Premio di Cina 2012",
  },
  {
    id: "verstappen-esordio",
    testo:
      "Max Verstappen debuttò in Australia nel 2015 a 17 anni: è il più giovane pilota mai partito in Formula 1, e un anno dopo divenne il più giovane vincitore.",
    linkTo: "/piloti/max-verstappen",
    linkLabel: "Vai alla scheda di Verstappen",
  },
  {
    id: "hamilton-100",
    testo:
      "Lewis Hamilton è stato il primo pilota a raggiungere le 100 vittorie in Formula 1, al Gran Premio di Russia 2021.",
    linkTo: "/piloti/lewis-hamilton",
    linkLabel: "Vai alla scheda di Hamilton",
  },
  {
    id: "abu-dhabi-2021",
    testo:
      "Il Mondiale 2021 si decise all'ultimo giro dell'ultima gara, ad Abu Dhabi: Max Verstappen superò Lewis Hamilton e vinse il suo primo titolo.",
    linkTo: "/archivio/2021/yas-marina",
    linkLabel: "Rivedi il Gran Premio di Abu Dhabi 2021",
  },
  {
    id: "verstappen-2023",
    testo:
      "Nel 2023 Max Verstappen vinse 19 gare su 22, record per una sola stagione, di cui dieci consecutive.",
    linkTo: "/piloti/max-verstappen",
    linkLabel: "Vai alla scheda di Verstappen",
  },
  {
    id: "leclerc-monaco-2024",
    testo:
      "Nel 2024 Charles Leclerc è diventato il primo monegasco a vincere il Gran Premio di Monaco valido per il Mondiale.",
    linkTo: "/archivio/2024/monaco",
    linkLabel: "Rivedi il Gran Premio di Monaco 2024",
  },
  {
    id: "spa-vecchia",
    testo:
      "La vecchia Spa-Francorchamps misurava circa 14 km di strade tra i boschi delle Ardenne. La Formula 1 la lasciò dopo il 1970 e tornò nel 1983 sulla versione accorciata.",
    linkTo: "/circuiti/spa",
    linkLabel: "Vai alla scheda di Spa",
  },
  {
    id: "silverstone-aeroporto",
    testo:
      "Silverstone nacque su un aeroporto militare della RAF usato durante la Seconda guerra mondiale: le prime piste seguivano le vie di rullaggio.",
    linkTo: "/circuiti/silverstone",
    linkLabel: "Vai alla scheda di Silverstone",
  },
  {
    id: "suzuka-otto",
    testo:
      "Suzuka è l'unico circuito del calendario a forma di otto: il tracciato passa sopra sé stesso con un cavalcavia.",
    linkTo: "/circuiti/suzuka",
    linkLabel: "Vai alla scheda di Suzuka",
  },
  {
    id: "montreal-gilles",
    testo:
      "Il circuito di Montréal porta il nome di Gilles Villeneuve, che vi vinse il primo Gran Premio del Canada lì disputato, nel 1978.",
    linkTo: "/circuiti/montreal",
    linkLabel: "Vai alla scheda di Montréal",
  },
];
