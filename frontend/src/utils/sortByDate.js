/**
 * Helper di ordinamento condivisi per le tabelle di gare/risultati:
 * ovunque nel sito, quando mostriamo un elenco di gare, l'ordine
 * richiesto è sempre "più recente in cima" (anno decrescente, e a
 * parità di anno la gara più recente di quella stagione).
 *
 * Array.prototype.sort di JS è stabile (garantito dalla spec ES2019+):
 * se prima invertiamo l'array (che arriva dal backend in ordine
 * cronologico crescente, anno/round) e POI ordiniamo per anno
 * decrescente, le righe con lo stesso anno restano nell'ordine
 * invertito, cioè con il round più alto (la gara più recente di
 * quella stagione) per primo. Non serve un campo round/data per
 * ottenere questo risultato.
 */
export function ordinaDescPerAnno(righe, campoAnno = 'anno') {
  return [...righe].reverse().sort((a, b) => (b[campoAnno] ?? 0) - (a[campoAnno] ?? 0));
}

/**
 * Come sopra, ma quando è disponibile anche una data di gara
 * (campo opzionale, es. GaraCircuito.data_gara): la usiamo come
 * criterio primario perché più precisa di anno+ordine-di-arrivo, e
 * ricadiamo sul solo anno quando la data manca (gare storiche senza
 * data certa importata).
 */
export function ordinaDescPerDataOAnno(righe, campoData = 'data_gara', campoAnno = 'anno') {
  return [...righe].reverse().sort((a, b) => {
    const dataA = a[campoData];
    const dataB = b[campoData];
    if (dataA && dataB) {
      if (dataA !== dataB) return dataA < dataB ? 1 : -1;
      return 0;
    }
    if (dataA && !dataB) return -1;
    if (!dataA && dataB) return 1;
    return (b[campoAnno] ?? 0) - (a[campoAnno] ?? 0);
  });
}
