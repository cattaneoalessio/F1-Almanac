/**
 * metaPagina.js — titolo e descrizione predefiniti di ogni pagina, ricavati
 * dall'indirizzo. Le pagine con dati propri (scheda pilota, circuito, gara…)
 * li affinano con useMetaPagina() appena i dati arrivano.
 *
 * Regola di sicurezza: una pagina NON elencata qui non diventa mai "noindex"
 * per errore: riceve il titolo e la descrizione generici del sito. Il noindex
 * lo decide solo la pagina stessa (404, amministrazione…) — vedi useMetaPagina.
 */
import { SITO, SITO_PUBBLICO, ROBOTS_NON_PUBBLICO } from '../config/sito.js';

const conNome = (titolo) => `${titolo} — ${SITO.nome}`;
const pagina = (titolo, descrizione, tipo = 'website') => ({ titolo: conNome(titolo), descrizione, tipo });

const FISSE = {
  '/': { titolo: `${SITO.nome} — ${SITO.slogan}`, descrizione: SITO.descrizione, tipo: 'website' },
  '/piloti': pagina('Piloti di Formula 1', 'Tutti i piloti della storia della Formula 1: carriera, vittorie, punti e risultati gara per gara, dal 1950 a oggi.'),
  '/scuderie': pagina('Scuderie di Formula 1', 'Le scuderie e i costruttori della Formula 1: piloti, gare disputate, vittorie e punti nella storia del campionato.'),
  '/circuiti': pagina('Circuiti di Formula 1', "I circuiti della Formula 1: tracciato, storia, curve, gare disputate e albo d'oro dei vincitori."),
  '/news': pagina('News Formula 1', 'Le notizie dal paddock della Formula 1, aggiornate automaticamente ogni notte.'),
  '/analisi': pagina('Analisi GP: telemetria e strategie', 'Telemetria comparativa tra piloti, strategie gomme e ritmo gara di ogni Gran Premio, dal 2023 a oggi.'),
  '/arcade': pagina('Arcade: giochi sulla Formula 1', 'Quiz e sfide a tempo sulla storia della Formula 1: metti alla prova le tue conoscenze e scala le classifiche.'),
  '/arcade/chronoquiz': pagina('ChronoQuiz: il quiz sulla storia della F1', 'Trivia storico a scelta multipla sulla Formula 1: 10 domande, 15 secondi a disposizione. La velocità fa la differenza.'),
  '/arcade/time-attack': pagina('Time Attack: giro cronometrato', 'Guida un giro cronometrato su un circuito reale dell\'archivio, scala la classifica e il Campionato Mondiale Virtuale.'),
  '/arcade/driverle': pagina('Driverle: indovina il pilota misterioso', 'Indovina il pilota misterioso della Formula 1 in 6 tentativi: nazione, scuderia, età, numero di gara, debutto e titoli mondiali a ogni prova.'),
  '/idols': pagina('Idols: i piloti leggendari', 'Approfondimenti sui piloti che hanno fatto la storia della Formula 1: Ayrton Senna, Michael Schumacher e Lewis Hamilton.'),
  '/idols/senna': pagina('Ayrton Senna: la leggenda', "La genesi, la mistica della pioggia, lo stile di guida e l'eredità di Ayrton Senna, tre volte campione del mondo.", 'article'),
  '/idols/schumacher': pagina('Michael Schumacher: il Kaiser', "La genesi, la mentalità, lo stile di guida e l'eredità di Michael Schumacher, sette volte campione del mondo.", 'article'),
  '/idols/hamilton': pagina('Lewis Hamilton: il prescelto', "Dal karting all'era Mercedes: la genesi, lo stile di guida e l'eredità di Lewis Hamilton, sette volte campione del mondo.", 'article'),
  '/privacy': pagina('Privacy e cookie', `Informativa sul trattamento dei dati personali e sui cookie di ${SITO.nome}: quali dati raccogliamo, con chi li condividiamo e come esercitare i tuoi diritti.`),
};

/** "/piloti/x/" -> "/piloti/x": senza barra finale, come nel canonical. */
export function normalizzaPercorso(percorso) {
  const senzaQuery = String(percorso).split(/[?#]/)[0] || '/';
  return senzaQuery.replace(/\/+$/, '') || '/';
}

export function metaPerPercorso(percorso) {
  const p = normalizzaPercorso(percorso);
  if (FISSE[p]) return FISSE[p];

  let m = p.match(/^\/archivio\/(\d{4})$/);
  if (m) {
    return pagina(`Formula 1 ${m[1]}: classifica e calendario`, `Classifica piloti e costruttori, calendario e risultati Gran Premio per Gran Premio della stagione ${m[1]} di Formula 1.`);
  }
  m = p.match(/^\/archivio\/(\d{4})\/[^/]+$/);
  if (m) {
    return pagina(`Risultati del Gran Premio ${m[1]}`, `Ordine d'arrivo, punti e commento del Gran Premio della stagione ${m[1]} di Formula 1.`);
  }
  if (/^\/piloti\/[^/]+$/.test(p)) return pagina('Scheda pilota', 'Statistiche di carriera, risultati gara per gara e curiosità del pilota di Formula 1.');
  if (/^\/scuderie\/[^/]+$/.test(p)) return pagina('Scheda scuderia', 'Piloti, gare disputate, vittorie e punti della scuderia nella storia della Formula 1.');
  if (/^\/circuiti\/[^/]+$/.test(p)) return pagina('Scheda circuito', "Tracciato, storia, curve, gare disputate e albo d'oro del circuito di Formula 1.");
  // Pagina non elencata (per esempio nuova): meta generici del sito, MAI noindex.
  return { titolo: SITO.nome, descrizione: SITO.descrizione, tipo: 'website' };
}

/**
 * Valore del meta "robots". Sito non pubblico: sempre noindex e nofollow.
 * Sito pubblico: indicizzabile, salvo le pagine che chiedono "noindex".
 */
export function valoreRobots(robotsPagina) {
  if (!SITO_PUBBLICO) return ROBOTS_NON_PUBBLICO;
  return robotsPagina === 'noindex' ? 'noindex, follow' : 'index, follow, max-image-preview:large';
}

/** Descrizione al massimo di `max` caratteri (le SERP la troncano oltre ~160), senza spezzare le parole. */
export function accorcia(testo, max = 160) {
  const pulito = String(testo).replace(/\s+/g, ' ').trim();
  if (pulito.length <= max) return pulito;
  return `${pulito.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
