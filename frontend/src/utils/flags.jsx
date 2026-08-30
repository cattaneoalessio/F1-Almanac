/**
 * <FlagIcon codiceIso2="IT" />
 *
 * Bandiera nazionale come immagine SVG statica in public/flags/, non
 * come emoji: le emoji bandiera non vengono renderizzate su Windows
 * (Chrome/Edge mostrano solo le due lettere del codice paese), mentre
 * questi SVG sono identici su ogni sistema operativo.
 *
 * Le bandiere nazionali sono simboli di stato, non loghi commerciali:
 * nessun rischio di marchio, a differenza dei loghi delle scuderie (per
 * cui infatti usiamo badge originali, vedi TeamBadge.jsx).
 *
 * I file vengono dalla libreria open-source "flag-icons" (MIT,
 * https://github.com/lipis/flag-icons): ne teniamo copiate solo le
 * bandiere dei paesi presenti nel nostro database (vedi
 * db/schema.sql -> tabella nazioni) invece di importare l'intera
 * libreria (~250 paesi), per non appesantire il sito con bandiere che
 * non verranno mai mostrate. Quando aggiungerai una nuova nazionalità
 * al database, copia anche il relativo file da
 * node_modules/flag-icons/flags/4x3/<codice>.svg in public/flags/.
 */
export function FlagIcon({ codiceIso2, className = '' }) {
  if (!codiceIso2 || codiceIso2.length !== 2) {
    return <span className={`flag-icon-placeholder ${className}`.trim()} aria-hidden="true" />;
  }

  const codice = codiceIso2.toLowerCase();
  return (
    <img
      src={`/flags/${codice}.svg`}
      alt={`Bandiera: ${codiceIso2.toUpperCase()}`}
      className={`flag-icon ${className}`.trim()}
      width={20}
      height={15}
    />
  );
}
