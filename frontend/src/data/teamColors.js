/**
 * teamColors.js
 * Mappa nome scuderia -> colore ufficiale, usata per bordi, avatar e
 * legenda in tutta l'app. Tenerla in un unico posto evita che ogni
 * componente reinventi la propria versione (e magari diversa) di questi
 * colori.
 *
 * ATTENZIONE: i team cambiano nome/colori tra una stagione e l'altra
 * (sponsor, rebranding...). Questo file va aggiornato a inizio stagione:
 * conviene un'unica fonte di verità invece di colori sparsi nel codice.
 */
export const TEAM_COLORS = {
  Ferrari: '#E10600',
  'Red Bull': '#0600EF',
  Mercedes: '#00D2BE',
  McLaren: '#FF8700',
  'Aston Martin': '#006F62',
  Alpine: '#0090FF',
  Williams: '#005AFF',
  VCARB: '#6692FF',
  Sauber: '#52E252',
  Haas: '#B6BABD',

  // Scuderie storiche (Campionato 1950 e dintorni). Nel 1950 le vetture
  // non avevano ancora livree sponsorizzate: correvano nei "colori
  // nazionali" di corsa del proprio paese (rosso Italia, blu Francia,
  // verde Gran Bretagna...). Qui li usiamo solo come stile distintivo
  // nell'app — non riproducono foto/livree reali, quindi restano
  // coerenti con l'approccio "illustrazione originale" del resto del sito.
  'Alfa Romeo': '#A6051A', // rosso corsa italiano (tono più scuro di Ferrari)
  Maserati: '#C1121F', // rosso corsa italiano (tono più acceso)
  'Talbot-Lago': '#0033A0', // bleu de France
  Simca: '#0033A0', // Simca-Gordini, stessa livrea nazionale francese
  ERA: '#00693E', // British Racing Green
  Alta: '#00693E', // British Racing Green
  Cooper: '#00693E', // British Racing Green
  'Kurtis Kraft': '#4B6584', // telaio USA più diffuso a Indianapolis nel 1950
};

export function colorForTeam(teamName) {
  return TEAM_COLORS[teamName] || '#8d8d8d'; // grigio di fallback per team non mappati
}

/**
 * Sigle per il badge scuderia ORIGINALE (colore + sigla, <TeamBadge>).
 * Non è un logo ufficiale: è un badge disegnato da noi per evitare
 * problemi di marchio, quindi va tenuto sincronizzato a mano con
 * TEAM_COLORS invece di dipendere da un asset/logo esterno.
 */
export const TEAM_CODES = {
  Ferrari: 'FER',
  'Red Bull': 'RBR',
  Mercedes: 'MER',
  McLaren: 'MCL',
  'Aston Martin': 'AMR',
  Alpine: 'ALP',
  Williams: 'WIL',
  VCARB: 'VCA',
  Sauber: 'SAU',
  Haas: 'HAS',
};

export function codeForTeam(teamName) {
  return TEAM_CODES[teamName] || teamName.slice(0, 3).toUpperCase();
}

/** Colori ufficiali delle mescole gomme F1 (Pirelli), usati da <TyreDot />. */
export const TYRE_COLORS = {
  soft: '#e30613',
  medium: '#ffd400',
  hard: '#f2f2f2',
  intermediate: '#43b02a',
  wet: '#0067b1',
};
