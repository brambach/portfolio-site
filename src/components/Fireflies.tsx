/**
 * A handful of fireflies for the night end of the day arc. Each one blinks
 * and wanders on its own long clock (12-19s), so the group never reads as
 * a loop - the star-blink rule, taken off the page and into the air.
 * Purely decorative; reduced motion leaves them as faint still points.
 */
const FLIES: ReadonlyArray<{ left: string; top: string; size: number; variant: 'a' | 'b'; delay: number }> = [
  { left: '12%', top: '30%', size: 4, variant: 'a', delay: 0 },
  { left: '46%', top: '62%', size: 3, variant: 'b', delay: 2.5 },
  { left: '70%', top: '22%', size: 3, variant: 'a', delay: 5.5 },
  { left: '88%', top: '55%', size: 4, variant: 'b', delay: 8 },
];

export function Fireflies({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none relative ${className ?? ''}`}>
      {FLIES.map((f, i) => (
        <span
          key={i}
          className={`firefly firefly-${f.variant} absolute rounded-full`}
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
