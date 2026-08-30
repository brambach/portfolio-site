/**
 * The engraved hare, in currentColor so the ground decides its ink. Running
 * pose for motion and the nav mark; sitting pose for rest stops and the end
 * of the trail. Paths come from the Oak and Clay artboards.
 *
 * HareBody is the bare path group (viewBox space 120x70) so the TrailRunner
 * can place it inside its own svg; HareMark wraps it for standalone use.
 */
export function HareBody({
  pose = 'running',
  strokeWidth = 1.5,
}: {
  pose?: 'running' | 'sitting';
  strokeWidth?: number;
}) {
  const w = strokeWidth;
  const thin = w * 0.93;
  const hair = w * 0.87;
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      {/* body and head */}
      <path d="M 22 42 C 30 30 52 26 68 30 C 80 33 88 40 90 46" strokeWidth={w} />
      <path d="M 90 46 C 94 42 100 40 106 42 C 110 43 112 46 111 49 C 108 52 102 52 98 52" strokeWidth={w} />
      {/* ears, flickable at rest */}
      <g className={pose === 'sitting' ? 'hare-ears' : undefined}>
        <path d="M 96 41 C 100 32 106 24 114 20" strokeWidth={thin} />
        <path d="M 100 44 C 106 37 112 31 118 28" strokeWidth={thin} />
      </g>
      {/* legs: stretched mid-stride, or tucked under */}
      {pose === 'running' ? (
        <>
          <path d="M 28 44 C 20 48 10 54 4 60" strokeWidth={thin} />
          <path d="M 84 48 C 92 54 100 58 108 62" strokeWidth={thin} />
        </>
      ) : (
        <>
          <path d="M 28 44 C 24 52 24 58 26 64" strokeWidth={thin} />
          <path d="M 84 48 C 86 54 86 60 84 66" strokeWidth={thin} />
        </>
      )}
      {/* belly and tail */}
      <path d="M 28 44 C 40 52 60 54 76 50" strokeWidth={hair} />
      <path d="M 22 42 C 18 40 16 37 17 33" strokeWidth={hair} />
      <circle cx="104" cy="45" r={hair} fill="currentColor" stroke="none" />
    </g>
  );
}

export function HareMark({
  pose = 'running',
  className = '',
  strokeWidth = 1.5,
}: {
  pose?: 'running' | 'sitting';
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden>
      <HareBody pose={pose} strokeWidth={strokeWidth} />
    </svg>
  );
}
