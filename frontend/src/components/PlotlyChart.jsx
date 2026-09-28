import { useEffect, useRef } from 'react';

// Plotly pesa parecchio (anche nella versione "basic"): si scarica solo la
// prima volta che una pagina con un grafico viene aperta (import dinamico),
// non insieme al resto del sito. La promessa è condivisa: se più grafici
// compaiono insieme, la libreria viene caricata una volta sola.
let promessaPlotly = null;
function caricaPlotly() {
  if (!promessaPlotly) {
    promessaPlotly = import('plotly.js-basic-dist-min').then((modulo) => modulo.default || modulo);
  }
  return promessaPlotly;
}

const CONFIGURAZIONE = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
};

/**
 * <PlotlyChart dati={[...]} layout={{...}} altezza={420} etichetta="..." />
 *
 * Contenitore React per un grafico Plotly (zoom e pan inclusi). `dati` e
 * `layout` vanno passati stabili (useMemo): il grafico si ridisegna solo
 * quando cambiano davvero.
 */
export default function PlotlyChart({ dati, layout, altezza = 400, etichetta = 'Grafico' }) {
  const contenitore = useRef(null);

  useEffect(() => {
    let annullato = false;
    caricaPlotly().then((Plotly) => {
      if (!annullato && contenitore.current) {
        Plotly.react(contenitore.current, dati, layout, CONFIGURAZIONE);
      }
    });
    return () => {
      annullato = true;
    };
  }, [dati, layout]);

  // Alla chiusura della pagina si libera la memoria del grafico.
  useEffect(() => {
    const nodo = contenitore.current;
    return () => {
      caricaPlotly().then((Plotly) => Plotly.purge(nodo));
    };
  }, []);

  return <div ref={contenitore} role="img" aria-label={etichetta} style={{ width: '100%', minHeight: altezza }} />;
}
