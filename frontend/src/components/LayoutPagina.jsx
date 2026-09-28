import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdSlot from './AdSlot.jsx';
import { spazioAttivo } from '../config/pubblicita.js';

// Larghezza minima (px) per affiancare le colonne al contenuto: deve coincidere con
// il min-width della regola .adv-colonna in App.css.
const LARGHEZZA_COLONNE = 1280;

/** true se la finestra è larga abbastanza per le colonne, e si aggiorna se cambia. */
function useSchermoLargo() {
  const domanda = `(min-width: ${LARGHEZZA_COLONNE}px)`;
  const [largo, setLargo] = useState(() => window.matchMedia(domanda).matches);
  useEffect(() => {
    const media = window.matchMedia(domanda);
    const aggiorna = () => setLargo(media.matches);
    media.addEventListener('change', aggiorna);
    return () => media.removeEventListener('change', aggiorna);
  }, [domanda]);
  return largo;
}

/**
 * Layout delle pagine CON pubblicità (la regola: ogni pagina di contenuto).
 * Si applica una volta sola, a un intero gruppo di rotte in App.jsx, quindi
 * una pagina nuova aggiunta a quel gruppo ha AUTOMATICAMENTE:
 *   - le due colonne verticali ai lati (dai 1280px in su; sotto non c'è
 *     spazio per affiancarle al contenuto, standard per tutti i siti);
 *   - un banner orizzontale in fondo, prima del piè di pagina.
 * Gli spazi "tra un blocco e l'altro" dentro la pagina si aggiungono a mano
 * con <SpazioAdv formato="..." /> (vedi components/AdSlot.jsx).
 *
 * Se la pubblicità non è attiva (config/pubblicita.js: modalità 'off', o
 * 'reale' senza l'ID dell'unità di quel formato), colonne e banner non ci sono
 * e la pagina torna al layout centrato normale, senza colonne vuote.
 */
export function LayoutConAdv() {
  // Le colonne esistono SOLO se si vedono: un annuncio vero in uno spazio nascosto (larghezza
  // zero) darebbe errori e richieste inutili a Google.
  const schermoLargo = useSchermoLargo();
  const colonne = spazioAttivo('colonna') && schermoLargo;
  const fondo = spazioAttivo('leaderboard');
  return (
    <div className={colonne ? 'app-body app-body--adv' : 'app-body'}>
      {colonne && (
        <aside className="adv-colonna adv-colonna--sx" aria-label="Pubblicità">
          <AdSlot formato="colonna" />
        </aside>
      )}
      <div className="app-content">
        <Outlet />
        {fondo && (
          <div className="adv-fondo">
            <AdSlot formato="leaderboard" />
          </div>
        )}
      </div>
      {colonne && (
        <aside className="adv-colonna adv-colonna--dx" aria-label="Pubblicità">
          <AdSlot formato="colonna" />
        </aside>
      )}
    </div>
  );
}

/**
 * Layout delle pagine SENZA pubblicità. Sono solo quelle in cui le regole di
 * AdSense vietano gli annunci: pagina "non trovata", area di amministrazione,
 * pagine legali (privacy) e schede ancora vuote ("in arrivo"). Google non
 * ammette annunci su schermate senza contenuto proprio.
 */
export function LayoutSenzaAdv() {
  return (
    <div className="app-body">
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
