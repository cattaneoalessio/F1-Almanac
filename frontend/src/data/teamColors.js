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
