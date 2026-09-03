/**
 * An engraved fir, the site's mark now the forest is the site. Three
 * overlapping bough tiers and a trunk, drawn in the same stroke language
 * as the dream-garage 911. Scales from the nav (small) to a vibe-board
 * card (large); ink comes from currentColor.
 */
export function FirMark({
  className,
  strokeWidth = 1.7,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 40 54"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 20 3 L 11 18 L 29 18 Z" />
      <path d="M 20 12 L 8 31 L 32 31 Z" />
      <path d="M 20 22 L 5 45 L 35 45 Z" />
      <path d="M 20 45 L 20 52" />
    </svg>
  );
}
