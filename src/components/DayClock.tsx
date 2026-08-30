import { useScroll, useMotionValueEvent } from 'motion/react';
import { useRef } from 'react';
import { dayClockLabel } from '../lib/day-clock';

/**
 * A small clock in the corner that winds from first light to just before
 * midnight as the reader scrolls: the scroll is one day, named. Ink
 * follows html[data-arc] only - the corner never overlaps the hero
 * photograph, and at load it sits on the paper strip, where oak ink
 * reads and paper ink vanished. Text is written straight to the node so
 * scrolling never commits a React render.
 */
export function DayClock() {
  const { scrollYProgress } = useScroll();
  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollYProgress, 'change', (t) => {
    if (ref.current) ref.current.textContent = dayClockLabel(t);
  });

  return (
    <div
      ref={ref}
      aria-hidden
      title="the scroll is one day"
      className="day-clock fixed bottom-5 left-6 z-40 hidden font-mono text-[10.5px] tracking-[0.2em] md:block"
    >
      {dayClockLabel(scrollYProgress.get())}
    </div>
  );
}
