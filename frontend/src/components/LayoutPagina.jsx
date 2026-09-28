import { Outlet } from 'react-router-dom';
import AdSlot from './AdSlot.jsx';

/**
 * Layout delle pagine CON pubblicità (la regola: ogni pagina di contenuto).
 * Si applica una volta sola, a un intero gruppo di rotte in App.jsx, quindi
 * una pagina nuova aggiunta a quel gruppo ha AUTOMATICAMENTE:
 *   - le due colonne verticali ai lati (dai 1280px in su; sotto non c'è
 *     spazio per affiancarle al contenuto, standard per tutti i siti);
 *   - un banner orizzontale in fondo, prima del piè di pagina.
 * Gli spazi "tra un blocco e l'altro" dentro la pagina si aggiungono a mano
 * con <SpazioAdv formato="..." /> (vedi components/AdSlot.jsx).
 */
export function LayoutConAdv() {
  return (
    <div className="app-body app-body--adv">
      <aside className="adv-colonna adv-colonna--sx" aria-label="Pubblicità">
        <AdSlot formato="colonna" />
      </aside>
      <div className="app-content">
        <Outlet />
        <div className="adv-fondo">
          <AdSlot formato="leaderboard" />
        </div>
      </div>
      <aside className="adv-colonna adv-colonna--dx" aria-label="Pubblicità">
        <AdSlot formato="colonna" />
      </aside>
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
