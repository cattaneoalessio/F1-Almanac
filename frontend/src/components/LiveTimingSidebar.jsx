import './LiveTimingSidebar.css';
import StatusBadge from './StatusBadge.jsx';
import TeamBadge from './TeamBadge.jsx';
import { colorForTeam } from '../data/teamColors.js';

/**
 * <LiveTimingSidebar brand="PIT WALL" rows={rows} status="live" />
 *
 * La colonna dei tempi live (spec sezione "A"). `rows` è un array di:
 *   { pos, code, team, gap, fixed }
 * - pos: posizione (numero)
 * - code: sigla a 3 lettere del pilota, es. "VER"
 * - team: nome scuderia esatto come in data/teamColors.js (per il colore)
 * - gap: testo del distacco, es. "+3.821" oppure "LEADER"
 * - fixed: true per il testo grigio fisso (es. il leader), false per il
 *   giallo fluorescente dei distacchi dinamici
 *
 * Pensato per ricevere questi dati da /v1/intervals di OpenF1 (vedi
 * src/api/openf1.js) o dall'endpoint del backend FastAPI del progetto.
 */
export default function LiveTimingSidebar({ brandPrefix = 'PIT', brandSuffix = 'WALL', status = 'live', rows = [] }) {
  return (
    <aside className="rail" aria-label="Live timing">
      <div className="rail__header">
        <span className="wordmark">
          {brandPrefix}
          <span>{brandSuffix}</span>
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <StatusBadge status={status} />
        </span>
      </div>
      <div className="row-list">
        {rows.map((d, i) => (
          <div
            className="row"
            key={d.code}
            style={{ '--team-color': colorForTeam(d.team), '--i': i }}
          >
            <span className="row__pos tab-num">{d.pos}</span>
            <TeamBadge team={d.team} size="sm" />
            <span className="row__driver">
              <span className="row__code">{d.code}</span>
              <span className="row__team">{d.team}</span>
            </span>
            <span className={`row__gap tab-num ${d.fixed ? 'row__gap--fixed' : ''}`}>{d.gap}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
