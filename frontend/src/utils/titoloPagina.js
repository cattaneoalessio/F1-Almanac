/**
 * titoloPagina.js — titolo della scheda del browser in base alla pagina.
 * Prima tutto il sito si chiamava "Pit Wall — Live Timing" (il vecchio nome).
 */
const NOME_SITO = 'Monoposto.ai';

const SEZIONI = [
  ['/archivio', 'Archivio storico'],
  ['/piloti', 'Piloti'],
  ['/scuderie', 'Scuderie'],
  ['/circuiti', 'Circuiti'],
  ['/news', 'News'],
  ['/live', 'Live Timing'],
  ['/analisi', 'Analisi GP'],
  ['/arcade', 'Arcade'],
  ['/idols', 'Idols'],
  ['/privacy', 'Privacy e cookie'],
];

export function titoloPerPercorso(percorso) {
  if (percorso === '/') return `${NOME_SITO} — L'almanacco della Formula 1`;
  const sezione = SEZIONI.find(([prefisso]) => percorso === prefisso || percorso.startsWith(`${prefisso}/`));
  return sezione ? `${sezione[1]} — ${NOME_SITO}` : NOME_SITO;
}
