/**
 * <StatusBadge status="live" /> oppure <StatusBadge status="finished" />
 * Indicatore di stato sessione (spec: "LIVE" lampeggiante in rosso,
 * "FINISHED" grigio opaco). Le classi CSS sono definite una volta sola
 * in src/styles/theme.css.
 */
export default function StatusBadge({ status = 'finished', children }) {
  const isLive = status === 'live';
  const label = children || (isLive ? 'LIVE' : 'FINISHED');
  return (
    <span className={`badge ${isLive ? 'badge--live' : 'badge--finished'}`}>
      {label}
    </span>
  );
}
