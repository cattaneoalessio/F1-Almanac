/**
 * pubblicita.js — come compaiono gli spazi pubblicitari (AdSense).
 *
 * MODALITA, scelta con la variabile d'ambiente VITE_PUBBLICITA (su Netlify):
 *   'off'        nessuno spazio, nessun riquadro. È il predefinito in PRODUZIONE:
 *                finché AdSense non ha approvato il sito, il sito si mostra
 *                normale, senza caselle vuote "spazio pubblicitario".
 *   'segnaposto' riquadri tratteggiati per vedere e progettare il layout.
 *                Predefinito in sviluppo locale (npm run dev).
 *   'reale'      annunci AdSense veri, ma SOLO negli spazi per cui qui sotto c'è
 *                l'ID dell'unità. Uno spazio senza ID scompare del tutto (colonne
 *                laterali comprese), mai un riquadro rotto.
 *
 * Come si attivano gli annunci veri: PRE-PUBBLICAZIONE.md, sezione "Pubblicità".
 */
export const CLIENT_ADSENSE = 'ca-pub-8142312526608548';

const MODALITA_AMMESSE = ['off', 'segnaposto', 'reale'];
const richiesta = import.meta.env?.VITE_PUBBLICITA;
export const MODALITA = MODALITA_AMMESSE.includes(richiesta) ? richiesta : import.meta.env?.DEV ? 'segnaposto' : 'off';

/**
 * ID delle tre unità pubblicitarie ADATTIVE create nel pannello AdSense
 * (Annunci → Per unità pubblicitaria → Annunci display). È il numero indicato
 * in data-ad-slot nel codice che AdSense mostra per ciascuna unità.
 */
export const UNITA = {
  orizzontale: '2796697413', // "Orizzontale": banner tra i blocchi e in fondo alla pagina
  rettangolo: '8049024091', // "Quadrato": rettangoli tra i blocchi
  verticale: '5965696944', // "Verticale": colonne laterali
};

// Ogni formato degli spazi (vedi components/AdSlot.jsx) usa una delle tre unità.
const UNITA_PER_FORMATO = {
  leaderboard: 'orizzontale',
  billboard: 'orizzontale',
  rettangolo: 'rettangolo',
  'rettangolo-grande': 'rettangolo',
  colonna: 'verticale',
};
// Forma indicata a Google per le unità adattive (data-ad-format).
export const FORMA_ANNUNCIO = { orizzontale: 'horizontal', rettangolo: 'rectangle', verticale: 'vertical' };

export const nomeUnita = (formato) => UNITA_PER_FORMATO[formato];
export const idUnita = (formato) => UNITA[UNITA_PER_FORMATO[formato]] || '';

/** Questo spazio va mostrato con la configurazione attuale? */
export function spazioAttivo(formato) {
  if (MODALITA === 'segnaposto') return true;
  if (MODALITA === 'reale') return Boolean(idUnita(formato));
  return false;
}
