/**
 * circuitPhotos.js — foto storiche di dominio pubblico o Creative
 * Commons per le schede circuito, con l'attribuzione già pronta.
 *
 * Ogni voce è verificata a mano (autore, licenza e link presi
 * direttamente dalla pagina del file su Wikimedia Commons, non
 * indovinati): aggiungerne una nuova richiede solo di ripetere lo
 * stesso controllo — vedi le istruzioni lasciate in chat/README su
 * dove trovare autore/licenza/link sulla pagina "File:" di Commons —
 * e aggiungere una riga qui sotto, con lo slug del circuito come
 * chiave. Nessuna modifica a CircuitView.jsx è necessaria.
 *
 * "src" punta direttamente al file su Wikimedia (hotlink): per
 * contenuti di pubblico dominio o CC è una pratica comune e accettata,
 * non serve scaricare e rihostare la foto sul nostro server.
 */
export const CIRCUIT_PHOTOS = {
  monza: [
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Monza_1950.jpg',
      alt: "Immagine storica dell'Autodromo di Monza, 1950",
      autore: 'Jiří Žemlička',
      autoreUrl: 'https://cs.wikipedia.org/wiki/User:Ji%C5%99%C3%AD_%C5%BDemli%C4%8Dka',
      fonteUrl: 'https://commons.wikimedia.org/wiki/File:Monza_1950.jpg',
      fonteLabel: 'Wikimedia Commons',
      // Dominio pubblico: l'autore l'ha rilasciata senza condizioni,
      // quindi non c'è un "deed" CC a cui linkare come per una CC BY-SA
      // — si linka alla voce Wikipedia che spiega cosa significa.
      licenzaUrl: 'https://en.wikipedia.org/wiki/Public_domain',
      licenzaLabel: 'Dominio pubblico',
    },
  ],
};
