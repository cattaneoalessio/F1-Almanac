import './TyrePanel.css';
import GlassPanel from './GlassPanel.jsx';

/**
 * <TyrePanel driverCode="NOR" stints={stints} />
 * Mostra la sequenza di mescole usate da un pilota, colorate secondo
 * gli standard Pirelli (vedi data/teamColors.js -> TYRE_COLORS).
 * `stints` arriva già "normalizzato" da api/tires.js (getTyreStints).
 */
export default function TyrePanel({ driverCode, stints = [] }) {
  return (
    <GlassPanel className="tyre-panel">
      <h3>Strategia gomme — {driverCode}</h3>
      <div className="tyre-stints">
        {stints.map((s) => (
          <div className="tyre-stint" key={s.stintNumber}>
            <span className="tyre-dot" style={{ background: s.compoundColor }} />
            {capitalize(s.compound)}
            <span className="tyre-stint__laps tab-num">
              G{s.lapStart}–{s.lapEnd}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function capitalize(testo) {
  return testo ? testo[0].toUpperCase() + testo.slice(1) : '';
}
