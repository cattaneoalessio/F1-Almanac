import { useMemo, useState } from 'react';

/**
 * usePagination(righe, dimensionePagina)
 *
 * Paginazione lato client per le tabelle del sito (10 righe a pagina
 * di default, come richiesto per piazzamenti/vittorie/gare). Le righe
 * passate devono già essere nell'ordine finale desiderato (di solito
 * più recente prima, vedi utils/sortByDate.js): questo hook si limita
 * ad affettarle in pagine.
 *
 * Torna alla pagina 1 automaticamente quando cambia l'insieme di righe
 * (es. l'utente naviga da un pilota all'altro): senza questo reset si
 * rischierebbe di restare "bloccati" su una pagina 4 che non esiste
 * più per il nuovo pilota. Il reset avviene durante il render stesso
 * (confrontando l'identità dell'array con quella vista l'ultima
 * volta), non in un useEffect: è il pattern raccomandato da React per
 * "derivare" stato da una prop che cambia, evita un giro di render in
 * più rispetto a un effetto equivalente. Funziona perché i chiamanti
 * ricalcolano `righe` con useMemo — nuovo array (nuova identità) solo
 * quando i dati sorgente cambiano davvero, stessa identità altrimenti.
 */
export default function usePagination(righe, dimensionePagina = 10) {
  const [righeVisteUltimoRender, setRigheVisteUltimoRender] = useState(righe);
  const [paginaState, setPaginaState] = useState(1);

  let pagina = paginaState;
  if (righe !== righeVisteUltimoRender) {
    setRigheVisteUltimoRender(righe);
    setPaginaState(1);
    pagina = 1;
  }

  const totalePagine = Math.max(1, Math.ceil(righe.length / dimensionePagina));
  const paginaSicura = Math.min(pagina, totalePagine);

  const righePagina = useMemo(() => {
    const inizio = (paginaSicura - 1) * dimensionePagina;
    return righe.slice(inizio, inizio + dimensionePagina);
  }, [righe, paginaSicura, dimensionePagina]);

  return {
    pagina: paginaSicura,
    totalePagine,
    righePagina,
    setPagina: setPaginaState,
    haRigheMultiplePagine: righe.length > dimensionePagina,
  };
}
