/**
 * curiositaDelGiorno.js — sceglie la curiosità "del giorno" per il box
 * "Lo sapevi che". Nessun server, nessun database: il risultato dipende
 * solo dalla data (fuso Europe/Rome), quindi è identico per tutti i
 * visitatori e cambia a mezzanotte ora italiana.
 *
 * Ogni ciclo di N giorni è una permutazione casuale (ma fissa, seminata col
 * numero del ciclo) delle N curiosità: in un ciclo nessuna si ripete.
 */

/** Numero del giorno (giorni dal 1/1/1970) secondo il calendario italiano. */
export function giornoItaliano(data = new Date()) {
  const [anno, mese, giorno] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(data)
    .split('-')
    .map(Number);
  return Math.floor(Date.UTC(anno, mese - 1, giorno) / 86400000);
}

/** Generatore pseudo-casuale semplice e riproducibile (mulberry32). */
function generatore(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Indice (0..totale-1) della curiosità da mostrare nel giorno dato. */
export function indiceDelGiorno(totale, data = new Date()) {
  if (totale <= 1) return 0;
  const giorno = giornoItaliano(data);
  const ciclo = Math.floor(giorno / totale);
  const ordine = Array.from({ length: totale }, (_, i) => i);
  const casuale = generatore(ciclo * 2654435761);
  for (let i = totale - 1; i > 0; i -= 1) {
    const j = Math.floor(casuale() * (i + 1));
    [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
  }
  return ordine[giorno % totale];
}
