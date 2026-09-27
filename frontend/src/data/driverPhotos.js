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
};
