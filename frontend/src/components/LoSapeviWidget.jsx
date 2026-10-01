import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from './GlassPanel.jsx';
import { FATTI_LO_SAPEVI } from '../data/loSapevi.js';
import { indiceDelGiorno } from '../utils/curiositaDelGiorno.js';
import './LoSapeviWidget.css';

function indiceCasuale(escludi) {
  if (FATTI_LO_SAPEVI.length <= 1) return 0;
  let indice = Math.floor(Math.random() * FATTI_LO_SAPEVI.length);
  while (indice === escludi) {
    indice = Math.floor(Math.random() * FATTI_LO_SAPEVI.length);
  }
  return indice;
}

/**
 * <LoSapeviWidget /> — "Lo sapevi che" nella home. All'apertura mostra la
 * curiosità del giorno (uguale per tutti, cambia a mezzanotte ora italiana:
 * utils/curiositaDelGiorno.js); il pulsante "Un'altra curiosità" ne pesca
 * una a caso solo per chi lo preme.
 */
export default function LoSapeviWidget() {
  const [indice, setIndice] = useState(() => indiceDelGiorno(FATTI_LO_SAPEVI.length));
  const fatto = FATTI_LO_SAPEVI[indice];

  return (
    <GlassPanel className="lo-sapevi">
      <p className="lo-sapevi__etichetta">Lo sapevi che…</p>
      <p className="lo-sapevi__testo">{fatto.testo}</p>
      <div className="lo-sapevi__azioni">
        <Link to={fatto.linkTo} className="lo-sapevi__link">
          {fatto.linkLabel} ↗
        </Link>
        {FATTI_LO_SAPEVI.length > 1 && (
          <button
            type="button"
            className="lo-sapevi__altro"
            onClick={() => setIndice((corrente) => indiceCasuale(corrente))}
          >
            Un'altra curiosità ↻
          </button>
        )}
      </div>
    </GlassPanel>
  );
}
