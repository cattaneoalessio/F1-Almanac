/**
 * homeMock.js — dati di ESEMPIO per la nuova home dinamica, in attesa di
 * una vera pipeline per la stagione in corso (classifica live, calendario
 * reale, prossima gara). Vedi la nota nella cima di HomeView.jsx per il
 * perché: al momento il sito importa solo stagioni storiche (1950, e a
 * breve 1951-1970), non esiste ancora nessuna fonte per i dati "live"
 * della stagione in corso.
 *
 * REGOLA SEGUITA QUI, DI PROPOSITO: nessun punteggio o risultato inventato
 * accanto al nome di un pilota reale e vivente (sarebbe un dato falso
 * attribuito a una persona reale, anche solo per un mockup). I nomi
 * scuderia sono reali (sono entità, non persone, e la lista che segue è
 * solo un ordine di esempio, non una classifica vera); i nomi pilota sono
 * placeholder ("Pilota 1", "Pilota 2", ...). Il calendario usa nomi e
 * circuiti reali del calendario F1 (informazione strutturale, non un
 * risultato), ma le DATE sono di esempio, non le date ufficiali 2026.
 */

export const MOCK_CLASSIFICA_PILOTI = [
  { pos: 1, pilota: 'Pilota 1', scuderia: 'McLaren', punti: 412 },
  { pos: 2, pilota: 'Pilota 2', scuderia: 'Ferrari', punti: 388 },
  { pos: 3, pilota: 'Pilota 3', scuderia: 'Red Bull', punti: 356 },
  { pos: 4, pilota: 'Pilota 4', scuderia: 'Mercedes', punti: 301 },
  { pos: 5, pilota: 'Pilota 5', scuderia: 'Aston Martin', punti: 244 },
];

export const MOCK_CLASSIFICA_SCUDERIE = [
  { pos: 1, scuderia: 'McLaren', punti: 720 },
  { pos: 2, scuderia: 'Ferrari', punti: 654 },
  { pos: 3, scuderia: 'Red Bull', punti: 601 },
  { pos: 4, scuderia: 'Mercedes', punti: 512 },
  { pos: 5, scuderia: 'Aston Martin', punti: 388 },
];

// Struttura di un calendario F1 reale (ordine e circuiti plausibili),
// date segnaposto. "slug" punta a /circuiti/:slug: dove il circuito è già
// presente nell'archivio (es. spa, monza, silverstone) il link porta a
// una scheda vera; altrove porterà a una scheda ancora da popolare.
export const MOCK_CALENDARIO = [
  { round: 1, nome_gp: 'Gran Premio del Bahrain', slug: 'bahrain', data: '2026-03-08', stato: 'disputato' },
  { round: 2, nome_gp: "Gran Premio dell'Arabia Saudita", slug: 'jeddah', data: '2026-03-15', stato: 'disputato' },
  { round: 3, nome_gp: "Gran Premio d'Australia", slug: 'albert-park', data: '2026-03-29', stato: 'disputato' },
  { round: 4, nome_gp: 'Gran Premio di Giappone', slug: 'suzuka', data: '2026-04-12', stato: 'disputato' },
  { round: 5, nome_gp: 'Gran Premio di Monaco', slug: 'monaco', data: '2026-05-24', stato: 'disputato' },
  { round: 6, nome_gp: "Gran Premio del Belgio", slug: 'spa', data: '2026-08-30', stato: 'prossima' },
  { round: 7, nome_gp: "Gran Premio d'Italia", slug: 'monza', data: '2026-09-06', stato: 'futura' },
  { round: 8, nome_gp: 'Gran Premio di Singapore', slug: 'singapore', data: '2026-09-20', stato: 'futura' },
  { round: 9, nome_gp: 'Gran Premio degli Stati Uniti', slug: 'austin', data: '2026-10-25', stato: 'futura' },
  { round: 10, nome_gp: 'Gran Premio di Abu Dhabi', slug: 'yas-marina', data: '2026-12-06', stato: 'futura' },
];

// La "prossima gara" per la sezione Focus On: presa dal calendario sopra
// (prima voce con stato "prossima"). Il circuito (spa) è uno dei 7 già
// verificati nell'archivio reale, così la foto/mappa che compare qui è
// una foto vera con attribuzione vera, non un placeholder generico.
export const MOCK_PROSSIMA_GARA = {
  nome_gp: 'Gran Premio del Belgio',
  slug: 'spa',
  data: '2026-08-30',
  localita: 'Stavelot, Belgio',
  lunghezza_km: 7.004,
  giri: 44,
  prima_edizione: 1950,
  curiosita:
    "Uno dei 7 circuiti della stagione 1950 già presenti nell'archivio storico del sito: la stessa pista, 76 anni dopo.",
};

export const MOCK_NEWS = [
  {
    id: 'mock-1',
    titolo: 'Titolo di esempio: anteprima del weekend di gara',
    estratto:
      'Testo segnaposto: qui comparirà un estratto reale una volta scelta la fonte per la sezione News (da decidere insieme).',
    fonteLabel: 'Fonte da definire',
  },
  {
    id: 'mock-2',
    titolo: 'Titolo di esempio: aggiornamento tecnico',
    estratto: 'Testo segnaposto: seconda card di esempio per mostrare come si comporta la griglia con più notizie.',
    fonteLabel: 'Fonte da definire',
  },
  {
    id: 'mock-3',
    titolo: 'Titolo di esempio: analisi post-gara',
    estratto: 'Testo segnaposto: terza card di esempio, utile per verificare che il layout regga anche con testi di lunghezza diversa tra loro.',
    fonteLabel: 'Fonte da definire',
  },
];
