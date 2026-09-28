import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CONSENSO } from '../config/consenso.js';
import {
  applicaAdSense, creaRecord, gpcAttivo, leggiConsenso, regionePerFusoOrario, salvaConsenso,
} from '../utils/consenso.js';

const Contesto = createContext(null);

export function useConsenso() {
  const contesto = useContext(Contesto);
  if (!contesto) throw new Error('useConsenso va usato dentro <ConsensoProvider>');
  return contesto;
}

// Pagine dove il banner NON copre il contenuto: l'informativa privacy deve
// poter essere letta prima di scegliere, e l'amministrazione non ha visitatori.
const esente = (percorso) => percorso === '/privacy' || percorso.startsWith('/admin');

/**
 * Stato del consenso ai cookie per tutta l'app. Espone la scelta salvata, la
 * regione (opt-in "eu" o opt-out "us"), se il banner è visibile e le azioni.
 * Ogni cambio di scelta si riflette subito sulle richieste pubblicitarie.
 */
export function ConsensoProvider({ children }) {
  const { pathname } = useLocation();
  const [regione] = useState(() => regionePerFusoOrario(Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [record, setRecord] = useState(() => {
    const salvato = leggiConsenso(window.localStorage);
    if (salvato) return salvato;
    // USA + Global Privacy Control: è già un rifiuto della vendita dei dati, da rispettare senza chiedere.
    if (regione === 'us' && gpcAttivo(window.navigator)) {
      const rifiuto = creaRecord({ regione, pubblicita: false, origine: 'gpc' });
      salvaConsenso(window.localStorage, rifiuto);
      return rifiuto;
    }
    return null;
  });
  const [riaperto, setRiaperto] = useState(false);

  useEffect(() => {
    // Con un sistema di consenso esterno (CONSENSO.PROPRIO=false) le richieste le gestisce lui.
    if (CONSENSO.PROPRIO) applicaAdSense(window, record);
  }, [record]);

  const scegli = useCallback(
    (pubblicita) => {
      const nuovo = creaRecord({ regione, pubblicita });
      salvaConsenso(window.localStorage, nuovo);
      setRecord(nuovo);
      setRiaperto(false);
    },
    [regione],
  );

  const visibile = CONSENSO.PROPRIO && (riaperto || (record === null && !esente(pathname)));

  const valore = useMemo(
    () => ({
      regione,
      record,
      visibile,
      // Bloccante = copre i contenuti finché non si sceglie (prima scelta). Se l'utente riapre
      // il banner da sé, può anche chiuderlo senza cambiare nulla.
      bloccante: visibile && record === null,
      accetta: () => scegli(true),
      rifiuta: () => scegli(false),
      salva: scegli,
      riapri: () => setRiaperto(true),
      chiudi: () => setRiaperto(false),
    }),
    [regione, record, visibile, scegli],
  );

  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}
