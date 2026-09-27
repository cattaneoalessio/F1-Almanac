/**
 * driverPhotos.js — foto storiche dei piloti "Idols" da Wikimedia
 * Commons, con l'attribuzione già pronta. Stesso schema e stessa
 * convenzione di circuitPhotos.js.
 *
 * Ogni voce è stata verificata dall'utente su Wikimedia Commons
 * (autore, pagina del file, licenza) e non è stata controllata di
 * nuovo da Claude in questa sessione: i domini Wikimedia risultano
 * bloccati per il fetch da questo ambiente di lavoro (verificato di
 * nuovo ora, stesso esito già documentato in circuitPhotos.js). "src"
 * punta a un indirizzo Special:Redirect/file/... su
 * commons.wikimedia.org, che reindirizza al file vero e proprio:
 * funziona come hotlink diretto in un tag <img> o in un
 * background-image, senza bisogno di scaricare o rihostare
 * l'immagine sul nostro server.
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
    eroe: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lewis_Hamilton_2022_F1_Austria.jpg',
      alt: 'Ritratto di Lewis Hamilton, GP d\u2019Austria 2022',
      autore: 'Lukas Raich',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_2022_F1_Austria.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
    // 2. Sezione Genesi — debutto McLaren MP4-23, GP del Canada 2008.
    genesi: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lewis_Hamilton_2008_Canada.jpg',
      alt: 'Lewis Hamilton con la McLaren MP4-23 al GP del Canada 2008',
      autore: 'George Thomas',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_2008_Canada.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 3. Sezione Stile Tecnico — Mercedes W10, GP di Francia 2019.
    stileTecnico: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lewis_Hamilton_2019_French_GP.jpg',
      alt: 'Lewis Hamilton con la Mercedes W10 al GP di Francia 2019',
      autore: 'motorsport.publications',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_2019_French_GP.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/deed.it',
      licenzaLabel: 'CC BY 2.0',
    },
    // 4. Sezione Eredità — nel paddock coi tifosi, GP d'Austria 2022.
    eredita: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lewis_Hamilton_2022_F1_Austria_2.jpg',
      alt: 'Lewis Hamilton saluta i tifosi nel paddock, GP d\u2019Austria 2022',
      autore: 'Lukas Raich',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_2022_F1_Austria_2.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
  },
  schumacher: {
    // 1. Immagine eroe/card di copertina — GP degli Stati Uniti 2004.
    eroe: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_-_2004_United_States_Grand_Prix.jpg',
      alt: 'Ritratto di Michael Schumacher, GP degli Stati Uniti 2004',
      autore: 'Kevin Decherf',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_-_2004_United_States_Grand_Prix.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 2. Sezione Genesi — Benetton B194, GP di Gran Bretagna 1994.
    genesi: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_1994_Great_Britain_2.jpg',
      alt: 'Michael Schumacher con la Benetton B194 al GP di Gran Bretagna 1994',
      autore: 'Trackspeed1 / Stuart Dent',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_1994_Great_Britain_2.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.it',
      licenzaLabel: 'CC BY-SA 2.0',
    },
    // 3. Sezione Mentalità & Strategia — F2002 a Spa-Francorchamps 2002.
    mentalita: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_2002_Belgie.jpg',
      alt: 'Michael Schumacher con la Ferrari F2002 al GP del Belgio 2002',
      autore: 'Willem Van De Kerkhof',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_2002_Belgie.jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
      licenzaLabel: 'CC BY-SA 4.0',
    },
    // 4. Sezione Stile Tecnico — casco e abitacolo, Mercedes, GP del Bahrein 2010.
    stileTecnico: {
      src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Michael_Schumacher_2010_Bahrain_GP_(cropped).jpg',
      alt: 'Primo piano del casco di Michael Schumacher, GP del Bahrein 2010',
      autore: 'Andrew Ferraro / LAT Photographic',
      autoreUrl: null,
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher_2010_Bahrain_GP_(cropped).jpg',
      fonteLabel: 'Wikimedia Commons',
      licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/deed.it',
      licenzaLabel: 'CC BY 2.0',
    },
  },
};
