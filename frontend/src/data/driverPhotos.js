/**
 * driverPhotos.js — foto storiche dei piloti "Idols" da Wikimedia
 * Commons, con l'attribuzione già pronta. Stesso schema e stessa
 * convenzione di circuitPhotos.js.
 *
 * SENNA: voci originarie, verificate dall'utente su Commons con URL
 * esatti fin dal primo giro — confermate corrette in produzione.
 *
 * SCHUMACHER e HAMILTON: le voci originarie sono risultate quasi tutte
 * inesistenti (0/8 URL forniti da uno strumento esterno dell'utente
 * corrispondevano a file reali, verificato con un controllo offline
 * sull'hash MD5 del nome file — Wikimedia calcola la cartella di
 * upload come le prime cifre esadecimali di md5(nome_file), algoritmo
 * confermato via documentazione ufficiale MediaWiki). Le 8 voci qui
 * sotto sono state trovate/verificate una per una: alcune via ricerca
 * web diretta (con licenza/autore confermati dalla pagina Commons
 * stessa), altre fornite dall'utente come URL upload.wikimedia.org
 * diretti e poi verificate con lo stesso controllo hash prima di
 * essere accettate. Due foto coprono un evento leggermente diverso da
 * quello originariamente pianificato (indicato nel commento della
 * singola voce) — le didascalie nei componenti sono state adattate.
 *
 * "src" punta a un indirizzo Special:Redirect/file/... o, se già
 * disponibile, all'indirizzo upload.wikimedia.org diretto — entrambi
 * funzionano come hotlink in un tag <img> o in un background-image,
 * senza bisogno di scaricare o rihostare l'immagine sul nostro server.
 * Wikimedia risulta bloccato per il fetch da questo ambiente di
 * lavoro: nessuna di queste URL è stata ricaricata visivamente da
 * Claude, solo verificata come spiegato sopra.
 */
export const DRIVER_PHOTOS = {
  senna: {
    // 1. Immagine eroe/card di copertina — ritratto in primo piano.
    eroe: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ayrton_Senna_8_-_Cropped.jpg',
      alt: 'Ritratto di Ayrton Senna',
      autore: 'Instituto Ayrton Senna / Flickr',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Ayrton_Senna_8_-_Cropped.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/deed.it',
      licenzaLabel: 'CC BY 2.0',
    },
    // 2. Sezione Genesi — debutto Toleman, GP di Gran Bretagna 1984.
    genesi: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ayrton_Senna_Toleman_TG184_1984_British_GP_Brands_Hatch_001.jpg',
      alt: 'Ayrton Senna sulla Toleman TG184 al GP di Gran Bretagna 1984, Brands Hatch',
      autore: 'Trackspeed1 / Stuart Dent',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Ayrton_Senna_Toleman_TG184_1984_British_GP_Brands_Hatch_001.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 3. Sezione Mistica & Pioggia — McLaren, 1988.
    pioggia: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ayrton_Senna_in_1988.jpg',
      alt: 'Ayrton Senna con la McLaren nel 1988',
      autore: 'Instituto Ayrton Senna',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Ayrton_Senna_in_1988.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/deed.it',
      licenzaLabel: 'CC BY 2.0',
    },
    // 4. Sezione Stile Tecnico — cordoli di Monaco, 1991.
    stileTecnico: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ayrton_Senna_1991_Monaco.jpg',
      alt: 'Ayrton Senna al GP di Monaco 1991',
      autore: 'Jmex60 (ritagliata/ritoccata da Morio)',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Ayrton_Senna_1991_Monaco.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
      licenzaLabel: 'CC BY-SA 3.0',
    },
  },
  hamilton: {
    // 1. Immagine eroe/card di copertina — GP d'Austria 2022.
    // Trovata via ricerca (categoria "2022 Austrian Grand Prix" su
    // Commons); autore non confermato con "author name string"
    // esplicito nei risultati di ricerca, usato quello indicato
    // dall'utente fin dall'inizio (Lukas Raich), coerente con la
    // serie di foto FIA di quell'evento.
    eroe: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/FIA_F1_Austria_2022_Nr._44_Hamilton.jpg',
      alt: 'Ritratto di Lewis Hamilton, GP d\u2019Austria 2022',
      autore: 'Lukas Raich',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:FIA_F1_Austria_2022_Nr._44_Hamilton.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
    // 2. Sezione Genesi — 2008, McLaren MP4-23. URL fornito
    // dall'utente (upload.wikimedia.org diretto), verificato con
    // controllo hash MD5: combacia. Lo stesso ID Flickr dell'autore
    // risulta collegato anche a una foto del GP del Canada 2008 dello
    // stesso soggetto — coerente con l'evento originariamente previsto.
    genesi: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Lewis_Hamilton_2008.jpg',
      alt: 'Lewis Hamilton con la McLaren MP4-23 nel 2008',
      autore: 'Mark McArdle',
      autoreUrl: 'https://www.flickr.com/people/12169388@N05',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_2008.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 3. Sezione Stile Tecnico — Mercedes W10. URL fornito dall'utente,
    // verificato con controllo hash MD5: combacia. ATTENZIONE: è il
    // GP d'UNGHERIA 2019, non di Francia come originariamente previsto
    // (stessa vettura/stessa epoca comunque) — didascalia adattata nel
    // componente.
    stileTecnico: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Lewis_Hamilton_during_Hungarian_Formula_1_GP.jpg',
      alt: 'Lewis Hamilton con la Mercedes W10 al GP d\u2019Ungheria 2019',
      autore: 'Micha\u0142 Obrochta',
      autoreUrl: 'https://commons.wikimedia.org/wiki/user:Rzober89',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_during_Hungarian_Formula_1_GP.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
    // 4. Sezione Eredità — GP d'Austria 2022 (variante "side 2" della
    // stessa serie della foto eroe). URL fornito dall'utente,
    // verificato con controllo hash MD5: combacia. Come per la foto
    // eroe, autore non confermato con "author name string" esplicito
    // nei risultati di ricerca.
    eredita: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/FIA_F1_Austria_2022_Nr._44_Hamilton_%28side_2%29.jpg',
      alt: 'Lewis Hamilton al GP d\u2019Austria 2022',
      autore: 'Lukas Raich',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:FIA_F1_Austria_2022_Nr._44_Hamilton_(side_2).jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
  },
  schumacher: {
    // 1. Immagine eroe/card di copertina — GP degli Stati Uniti 2004.
    // Trovata via ricerca (pagina Commons con categoria "2004 United
    // States Grand Prix" confermata esplicitamente).
    eroe: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_Ferrari_2004.jpg',
      alt: 'Ritratto di Michael Schumacher, GP degli Stati Uniti 2004',
      autore: 'Rick Dikeman',
      autoreUrl: 'https://commons.wikimedia.org/wiki/user:RickDikeman',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_Ferrari_2004.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
      licenzaLabel: 'CC BY-SA 3.0',
    },
    // 2. Sezione Genesi — Benetton B194, GP di Gran Bretagna 1994
    // (Silverstone). Trovata via ricerca, categoria "Benetton B194 of
    // Michael Schumacher" + "1994 British Grand Prix" confermate.
    genesi: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_1994_Silverstone_2.jpg',
      alt: 'Michael Schumacher con la Benetton B194 al GP di Gran Bretagna 1994',
      autore: 'Martin Lee',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_1994_Silverstone_2.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 3. Sezione Mentalità & Strategia. URL fornito dall'utente,
    // verificato con controllo hash MD5: combacia. ATTENZIONE: è il
    // GP degli STATI UNITI 2002, non del Belgio/Spa come
    // originariamente previsto — didascalia adattata nel componente.
    // Autore non determinabile con certezza dai risultati di ricerca
    // (categorie Commons indicano "Self-published work").
    mentalita: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Michael_Schumacher_2002.jpg',
      alt: 'Michael Schumacher con la Ferrari, GP degli Stati Uniti 2002',
      autore: 'Autore su Wikimedia Commons',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_2002.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
      licenzaLabel: 'CC BY-SA 3.0',
    },
    // 4. Sezione Stile Tecnico — GP del Bahrein 2010 (debutto Mercedes).
    // URL fornito dall'utente, verificato con controllo hash MD5:
    // combacia. Autore confermato incrociando lo stesso ID Flickr su
    // un'altra foto della stessa categoria/weekend ("Alonso Bahrain
    // 2010.jpg", che mostra esplicitamente "author name string: Derek
    // Morrison" per questo stesso ID).
    stileTecnico: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Michael_Schumacher_2010_Bahrain.jpg',
      alt: 'Michael Schumacher con la Mercedes al GP del Bahrein 2010',
      autore: 'Derek Morrison',
      autoreUrl: 'https://www.flickr.com/people/68248628@N00',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_2010_Bahrain.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/deed.it',
      licenzaLabel: 'CC BY 2.0',
    },
  },
};
