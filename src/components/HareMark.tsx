/**
 * The engraved hare, in currentColor so the ground decides its ink. Two
 * bounding frames (stretch and gather) make the gallop: a parent with the
 * `hare-gallop` class alternates them flip-book style; everywhere else only
 * the stretch frame shows, so static marks stay still. Sitting is its own
 * drawing, ears up, with the idle flick.
 *
 * HareBody is the bare group (viewBox space 120x70) so the TrailRunner can
 * place it inside its own svg; HareMark wraps it for standalone use.
 */

function RunStretch({ w, thin, hair }: { w: number; thin: number; hair: number }) {
  return (
    <g className="hare-fA">
      <path d="M 12 38 C 22 30 48 26 70 28 C 82 29 90 33 94 38" strokeWidth={w} />
      <path d="M 94 38 C 99 35 104 35 108 38 C 110 40 110 43 108 45 C 105 47 100 47 96 45" strokeWidth={w} />
      <circle cx="102" cy="40" r={hair} fill="currentColor" stroke="none" />
      {/* ears pinned back mid-bound */}
      <path d="M 96 34 C 90 28 84 24 76 22" strokeWidth={thin} />
      <path d="M 99 36 C 94 29 89 25 82 22" strokeWidth={hair} />
      {/* front legs reaching, hind legs trailing */}
      <path d="M 88 43 C 96 47 104 53 112 56" strokeWidth={thin} />
      <path d="M 84 45 C 91 51 98 57 104 61" strokeWidth={hair} />
      <path d="M 20 40 C 12 44 5 50 0 56" strokeWidth={thin} />
      <path d="M 25 43 C 19 49 13 55 8 61" strokeWidth={hair} />
      <path d="M 20 40 C 36 47 60 48 80 45" strokeWidth={hair} />
      <path d="M 12 38 C 9 35 9 31 12 28" strokeWidth={hair} />
    </g>
  );
}

function RunGather({ w, thin, hair }: { w: number; thin: number; hair: number }) {
  return (
    <g className="hare-fB">
      <path d="M 20 44 C 24 28 46 20 66 22 C 78 24 86 30 90 37" strokeWidth={w} />
      <path d="M 90 37 C 95 34 100 34 104 37 C 106 39 106 42 104 44 C 101 46 96 46 92 44" strokeWidth={w} />
      <circle cx="98.5" cy="39" r={hair} fill="currentColor" stroke="none" />
      <path d="M 92 33 C 87 25 81 20 73 17" strokeWidth={thin} />
      <path d="M 95 35 C 91 26 86 21 79 18" strokeWidth={hair} />
      {/* front legs folded, hind legs swinging under for the next hop */}
      <path d="M 84 42 C 83 48 79 53 73 55" strokeWidth={thin} />
      <path d="M 88 43 C 88 49 85 54 80 56" strokeWidth={hair} />
      <path d="M 28 45 C 32 53 40 58 50 59" strokeWidth={thin} />
      <path d="M 23 43 C 25 52 31 58 40 60" strokeWidth={hair} />
      <path d="M 28 45 C 40 50 56 51 68 47" strokeWidth={hair} />
      <path d="M 20 44 C 16 42 14 38 16 34" strokeWidth={hair} />
    </g>
  );
}

function Sitting({ w, thin, hair }: { w: number; thin: number; hair: number }) {
  return (
    <g transform="translate(14, 2)">
      <g className="hare-sit">
      <path d="M 34 62 C 22 58 18 45 26 35 C 31 28 40 25 47 27" strokeWidth={w} />
      <path d="M 47 27 C 50 20 56 16 62 18 C 67 20 68 25 66 29 C 64 33 58 34 54 32" strokeWidth={w} />
      <circle cx="61" cy="23" r={hair * 1.1} fill="currentColor" stroke="none" />
      <g className="hare-ears">
        <path d="M 56 16 C 56 8 59 3 65 1" strokeWidth={thin} />
        <path d="M 60 17 C 62 9 66 4 72 2" strokeWidth={thin} />
      </g>
      <path d="M 47 27 C 52 32 56 40 57 48" strokeWidth={hair} />
      <path d="M 57 48 C 58 53 58 58 56 62" strokeWidth={thin} />
      <path d="M 62 50 C 63 55 63 58 61 62" strokeWidth={hair} />
      <path d="M 34 62 C 42 64 52 64 60 62" strokeWidth={hair} />
      <path d="M 34 62 C 29 61 26 57 27 52" strokeWidth={hair} />
      </g>
    </g>
  );
}

export function HareBody({
  pose = 'running',
  strokeWidth = 2.6,
}: {
  pose?: 'running' | 'sitting';
  strokeWidth?: number;
}) {
  const w = strokeWidth;
  const thin = w * 0.9;
  const hair = w * 0.8;
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      {pose === 'running' ? (
        <>
          <RunStretch w={w} thin={thin} hair={hair} />
          <RunGather w={w} thin={thin} hair={hair} />
        </>
      ) : (
        <Sitting w={w} thin={thin} hair={hair} />
      )}
    </g>
  );
}

export function HareMark({
  pose = 'running',
  className = '',
  strokeWidth = 2.6,
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
