import './PreviewBadge.css';

/**
 * <PreviewBadge>Classifica</PreviewBadge>
 *
 * Etichetta ben visibile per marcare una sezione con dati di ESEMPIO,
 * non reali. Nata per la home dinamica (Fase E): finché non esiste una
 * pipeline dati per la stagione in corso, mostriamo un layout completo
 * con numeri plausibili, ma nessuna sezione con dati inventati deve
 * poter essere scambiata per un dato vero — nemmeno da uno screenshot
 * isolato o da una versione pubblicata per sbaglio. Va tolto sezione per
 * sezione, solo quando quella sezione passa a una fonte dati reale.
 */
export default function PreviewBadge({ children = 'Dati di esempio' }) {
  return <span className="preview-badge">{children}</span>;
}
