import './TeamBadge.css';
import { colorForTeam, codeForTeam } from '../data/teamColors.js';

/**
 * <TeamBadge team="Ferrari" size="sm" />
 *
 * Badge scuderia ORIGINALE: colore ufficiale + sigla a 3 lettere,
 * disegnato da noi invece di usare il logo reale della scuderia.
 * I loghi ufficiali sono marchi registrati — usarli senza licenza
 * espone a rischi legali proprio nel momento in cui il sito comincia
 * a generare reddito. Se in futuro ottieni una licenza/partnership,
 * questo componente è il punto giusto dove sostituire il badge con
 * un vero <img>, senza toccare chi lo usa (LiveTimingSidebar, ecc.).
 */
export default function TeamBadge({ team, size = 'md' }) {
  return (
    <span
      className={`team-badge ${size === 'sm' ? 'team-badge--sm' : ''} ${size === 'lg' ? 'team-badge--lg' : ''}`}
      style={{ '--team-color': colorForTeam(team) }}
      title={team}
    >
      {codeForTeam(team)}
    </span>
  );
}
