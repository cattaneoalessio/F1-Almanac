/**
 * loSapevi.js — curiosità REALI per la sezione "Lo sapevi che" della home,
 * a differenza di homeMock.js: ogni fatto qui è stato verificato
 * direttamente con una query sul database reale (stagione 1950, l'unica
 * già completamente importata e arricchita) prima di essere scritto qui,
 * non inventato o dedotto. Query di verifica (per riferimento futuro,
 * se si aggiungono altri fatti quando arriveranno le stagioni 1951-1970):
 *
 *   SELECT gp.nome_gp, gp.data_gara, p.nome, p.cognome, co.nome, r.tempo_totale
 *   FROM risultati_gara r
 *   JOIN gran_premi gp ON gp.id = r.gran_premio_id
 *   JOIN stagioni s ON s.id = gp.stagione_id
 *   JOIN piloti p ON p.id = r.pilota_id
 *   JOIN costruttori co ON co.id = r.costruttore_id
 *   WHERE s.anno = 1950 AND r.posizione_finale = 1
 *   ORDER BY gp.data_gara;
 *
 * Nota deliberata: NON includiamo qui "chi fu il primo campione del
 * mondo" — che storicamente fu Nino Farina — perché la NOSTRA classifica
 * calcolata "a somma" (/classifica/piloti) lo mostra dietro a Fagioli:
 * un artefatto del nostro criterio "a somma di tutti i risultati", non
 * la regola reale dell'epoca (che contava solo i migliori 4 risultati su
 * 7). Aspettiamo di avere in tabella classifica_ufficiale_piloti (vedi
 * db/patch_stagioni_1951_1970.sql) anche il 1950, per non rischiare di
 * mostrare come "curiosità" un fatto che la nostra stessa classifica
 * sembra smentire.
 */
export const FATTI_LO_SAPEVI = [
  {
    id: 'primo-gp',
    testo:
      'Il primo Gran Premio della storia del Mondiale di Formula 1 si corse il 13 maggio 1950 a Silverstone: a vincerlo fu Nino Farina su Alfa Romeo.',
    linkTo: '/archivio/1950/silverstone',
    linkLabel: 'Rivedi il Gran Premio di Gran Bretagna 1950',
  },
  {
    id: 'alfa-romeo-1950',
    testo:
      "Nel 1950 l'Alfa Romeo vinse tutte e sei le gare europee della stagione. L'unica eccezione fu la Indianapolis 500, che quell'anno assegnava punti iridati ma fu vinta da Johnnie Parsons su Kurtis Kraft.",
    linkTo: '/archivio/1950/indianapolis',
    linkLabel: "Rivedi la Indianapolis 500 del 1950",
  },
  {
    id: 'monaco-1950-lunga',
    testo:
      'Il Gran Premio di Monaco 1950 fu il più lungo in durata dei sette della stagione: oltre 3 ore e 13 minuti di gara per Juan Manuel Fangio, il vincitore.',
    linkTo: '/archivio/1950/monaco',
    linkLabel: 'Rivedi il Gran Premio di Monaco 1950',
  },
  {
    id: 'fangio-farina-compagni',
    testo:
      'Juan Manuel Fangio e Nino Farina, compagni di squadra in Alfa Romeo nel 1950, vinsero insieme sei delle sette gare della stagione inaugurale del Mondiale.',
    linkTo: '/piloti/juan-manuel-fangio',
    linkLabel: 'Vai alla scheda di Fangio',
  },
];
