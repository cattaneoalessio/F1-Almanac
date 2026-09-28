import { useEffect, useState } from 'react';
import {
  getClassificaPiloti,
  getClassificaScuderie,
  getGareStagione,
  getSchedaCircuito,
} from '../api/backend.js';
import { fetchOpenF1 } from '../api/openf1.js';
import { ordinaCalendario, trovaMeeting, ordinaSessioni } from '../utils/stagione.js';

const IN_CARICAMENTO = { stato: 'carico', dati: null };

/** Trasforma una promessa in { stato: ok | vuoto | errore, dati } senza mai lanciare. */
function comeStato(promessa) {
  return promessa
    .then((dati) => (Array.isArray(dati) && dati.length > 0 ? { stato: 'ok', dati } : { stato: 'vuoto', dati: null }))
    .catch(() => ({ stato: 'errore', dati: null }));
}

/**
 * Dati REALI della stagione: classifica piloti, classifica scuderie e
 * calendario. Ogni blocco ha il suo stato (carico / ok / vuoto / errore), così
 * un problema su uno non nasconde gli altri.
 */
export function useStagioneCorrente(anno) {
  const [piloti, setPiloti] = useState(IN_CARICAMENTO);
  const [scuderie, setScuderie] = useState(IN_CARICAMENTO);
  const [calendario, setCalendario] = useState(IN_CARICAMENTO);

  useEffect(() => {
    let annullato = false;
    const carica = (promessa, imposta) =>
      comeStato(promessa).then((risultato) => {
        if (!annullato) imposta(risultato);
      });
    carica(getClassificaPiloti(anno), setPiloti);
    carica(getClassificaScuderie(anno), setScuderie);
    carica(getGareStagione(anno), setCalendario);
    return () => {
      annullato = true;
    };
  }, [anno]);

  return { piloti, scuderie, calendario };
}

/**
 * Dettagli della prossima gara: scheda del circuito dal nostro database
 * (lunghezza, storia delle edizioni, albo d'oro) e programma del weekend da
 * OpenF1. Il programma è "best effort": se OpenF1 non risponde o non ha ancora
 * le sessioni, si omette senza far fallire il resto.
 */
export function useProssimaGara(gara, anno) {
  const [circuito, setCircuito] = useState(IN_CARICAMENTO);
  const [programma, setProgramma] = useState(null);
  const slug = gara?.circuito;
  const data = gara?.data_gara;

  useEffect(() => {
    if (!slug) return undefined;
    let annullato = false;
    setCircuito(IN_CARICAMENTO);
    setProgramma(null);

    getSchedaCircuito(slug)
      .then((scheda) => {
        if (!annullato) setCircuito(scheda ? { stato: 'ok', dati: scheda } : { stato: 'vuoto', dati: null });
      })
      .catch(() => {
        if (!annullato) setCircuito({ stato: 'errore', dati: null });
      });

    fetchOpenF1('meetings', { year: anno })
      .then((meetings) => {
        const meeting = trovaMeeting(meetings, data);
        return meeting ? fetchOpenF1('sessions', { meeting_key: meeting.meeting_key }) : [];
      })
      .then((sessioni) => {
        const elenco = ordinaSessioni(sessioni);
        if (!annullato && elenco.length > 0) setProgramma(elenco);
      })
      .catch(() => {});

    return () => {
      annullato = true;
    };
  }, [slug, data, anno]);

  return { circuito, programma };
}

export { ordinaCalendario };
