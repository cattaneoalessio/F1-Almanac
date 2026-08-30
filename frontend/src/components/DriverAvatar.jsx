import './DriverAvatar.css';
import { colorForTeam } from '../data/teamColors.js';

/**
 * <DriverAvatar team="McLaren" size={56} />
 *
 * Silhouette illustrata di un casco da corsa, colorata con il colore
 * ufficiale della scuderia — NON una foto reale del pilota.
 *
 * Perché un'illustrazione e non una foto: una foto di un pilota reale
 * comporta due questioni distinte da risolvere prima di pubblicarla su
 * un sito monetizzato — la licenza dei diritti d'autore sull'immagine
 * (va comprata da un'agenzia o dal fotografo) e, separatamente, il
 * diritto all'immagine della persona ritratta. Una silhouette originale
 * evita entrambe, e in più si adatta a QUALSIASI pilota semplicemente
 * cambiando il colore — utile per un sito che copre tanti piloti/anni.
 */
export default function DriverAvatar({ team, size = 56 }) {
  return (
    <svg
      className="driver-avatar"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ '--team-color': colorForTeam(team) }}
      aria-label="Silhouette casco pilota"
    >
      <path
        className="driver-avatar__shell"
        d="M8 34 C8 16 22 6 34 6 C48 6 58 16 58 30 C58 40 50 46 40 48 L40 54 C40 58 36 60 32 60 C26 60 22 57 20 52 L14 50 C10 48 8 44 8 34 Z"
      />
      <path
        className="driver-avatar__visor"
        d="M13 29 C13 24 21 21 31 21 C43 21 52 24 54 30 L54 35 C40 30 24 30 13 35 Z"
      />
      <path
        className="driver-avatar__stripe"
        d="M10 38 C20 35 40 35 56 39 L56 41 C40 37 20 37 10 40 Z"
      />
    </svg>
  );
}
