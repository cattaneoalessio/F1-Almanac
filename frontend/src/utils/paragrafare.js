/**
 * paragrafareBiografia(testo)
 *
 * Le biografie arrivano dal DB come un unico blocco di testo (vedi le
 * patch db/patch_biografie_piloti_*.sql): per la leggibilità le
 * spezziamo in paragrafi di 3-5 frasi l'uno, invece di un unico
 * muro di testo. Divide sulle frasi (., !, ?) seguite da spazio e
 * maiuscola, con qualche cautela per non spezzare sulle abbreviazioni
 * più comuni nei testi biografici (es. "Gran Premio d'Italia 1994."
 * seguito da nuova frase va bene, ma "Dott." o iniziali puntate tipo
 * "G. Villoresi" non devono generare un paragrafo di una parola).
 *
 * Non è un tokenizzatore linguistico perfetto — non serve: l'obiettivo
 * è solo rompere il muro di testo in blocchi leggibili, non un parsing
 * grammaticale rigoroso.
 */
const ABBREVIAZIONI_COMUNI = new Set([
  'sig', 'dott', 'prof', 'dr', 'ing', 'sig.ra', 'ecc', 'n', 'jr', 'sr',
]);

function sembraAbbreviazione(paroleFinali) {
  const ultima = paroleFinali.replace(/[.]+$/, '').split(/\s+/).pop() || '';
  // Una sola lettera maiuscola prima del punto (es. "J. Clark") o
  // un'abbreviazione nota: non è davvero fine frase.
  if (/^[A-ZÀ-Ý]$/.test(ultima)) return true;
  return ABBREVIAZIONI_COMUNI.has(ultima.toLowerCase());
}

export function paragrafareBiografia(testo, frasiMin = 3, frasiMax = 5) {
  if (!testo) return [];

  // Spezza mantenendo il punteggiatura di fine frase, poi ricompone
  // le frasi "false" (abbreviazioni) con la successiva.
  const grezze = testo.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [testo];
  const frasi = [];
  for (const frase of grezze) {
    const precedente = frasi[frasi.length - 1];
    if (precedente && sembraAbbreviazione(precedente.trim())) {
      frasi[frasi.length - 1] = precedente + frase;
    } else {
      frasi.push(frase);
    }
  }

  if (frasi.length <= frasiMax) return [testo.trim()];

  const dimensioneTarget = Math.round((frasiMin + frasiMax) / 2); // 4
  const paragrafi = [];
  let corrente = [];

  for (const frase of frasi) {
    corrente.push(frase);
    if (corrente.length >= dimensioneTarget) {
      paragrafi.push(corrente.join('').trim());
      corrente = [];
    }
  }
  if (corrente.length > 0) {
    // L'ultimo gruppetto: se è troppo corto (sotto frasiMin) e c'è già
    // un paragrafo precedente, lo assorbe invece di lasciare un
    // paragrafo-orfano di una sola frase.
    if (corrente.length < frasiMin && paragrafi.length > 0) {
      paragrafi[paragrafi.length - 1] += ' ' + corrente.join('').trim();
    } else {
      paragrafi.push(corrente.join('').trim());
    }
  }

  return paragrafi;
}
