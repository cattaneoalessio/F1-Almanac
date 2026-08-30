/**
 * <GlassPanel> ... </GlassPanel>
 * Il pannello "vetro" da studio (sfondo semi-trasparente + blur) usato
 * per card di analisi, box statistiche, ecc. È solo un contenitore:
 * il contenuto è deciso da chi lo usa.
 *
 * Esempio:
 *   <GlassPanel className="spotlight">
 *     <h3>Strategia gomme</h3>
 *     ...
 *   </GlassPanel>
 */
export default function GlassPanel({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`sky-panel ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
