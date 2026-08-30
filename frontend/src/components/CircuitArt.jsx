/**
 * <CircuitArt size={34} watermark />
 *
 * Illustrazione ORIGINALE in stile "circuit art": una traccia astratta
 * disegnata da noi, non la riproduzione precisa di un tracciato reale.
 * Le mappe ufficiali dei circuiti (quelle esatte, geograficamente
 * corrette) sono materiale su cui FIA/Formula 1 rivendica diritti: per
 * un'illustrazione decorativa non serve replicarle, basta evocare
 * l'idea di un circuito. Quando vorrai la mappa precisa di un circuito
 * specifico (con licenza), questo è il componente da sostituire.
 */
export default function CircuitArt({ size = 34, watermark = false, className = '' }) {
  return (
    <svg
      className={`circuit-art ${watermark ? 'circuit-art--watermark' : ''} ${className}`.trim()}
      width={watermark ? undefined : size}
      height={watermark ? undefined : size}
      viewBox="0 0 90 90"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 70 C10 70 6 60 10 50 C14 40 30 42 34 34 C38 26 30 18 40 12 C52 4 72 8 78 20 C84 32 74 36 66 34 C58 32 54 40 60 48 C68 58 60 70 48 72 C38 74 30 74 20 70 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!watermark && <circle cx="20" cy="70" r="3.2" fill="currentColor" />}
    </svg>
  );
}
