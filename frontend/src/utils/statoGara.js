/**
 * Utility condivise per mostrare "quando" si disputa una gara — usate sia
 * dall'elenco gare della stagione (HistoricalStandings) sia dalla pagina
 * di dettaglio di una singola gara (RaceDetailView). In un file a parte
 * (invece che esportate da un componente) per non rompere il Fast Refresh
 * di React in sviluppo.
 */

/**
 * Una gara è "Disputata" se la sua data è passata (o è oggi), "Prossima"
 * se è futura. Se manca la data (raro, solo per gare storiche molto
 * vecchie) non mostriamo l'etichetta invece di indovinare.
 */
export function statoGara(dataGaraIso) {
  if (!dataGaraIso) return null;
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const dataGara = new Date(dataGaraIso);
  return dataGara <= oggi ? 'Disputata' : 'Prossima';
}

const FORMATTATORE_DATA_GARA = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Data della gara in formato leggibile ("12 ott 2026"), o null se manca. */
export function formattaDataGara(dataGaraIso) {
  if (!dataGaraIso) return null;
  return FORMATTATORE_DATA_GARA.format(new Date(dataGaraIso));
}
