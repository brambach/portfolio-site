import { useScroll, useMotionValueEvent } from 'motion/react';
import { useState } from 'react';
import { dayClockLabel } from '../lib/day-clock';

/**
 * A small clock in the corner that winds from first light to just before
 * midnight as the reader scrolls: the scroll is one day, named. Ink flips
 * with the day arc, paper over the hero photograph.
 */
export function DayClock() {
  const { scrollY, scrollYProgress } = useScroll();
  const [label, setLabel] = useState(() => dayClockLabel(scrollYProgress.get()));
  const [overPhoto, setOverPhoto] = useState(true);

  useMotionValueEvent(scrollYProgress, 'change', (t) => setLabel(dayClockLabel(t)));
  useMotionValueEvent(scrollY, 'change', (y) => {
    setOverPhoto(y < window.innerHeight * 0.72);
  });

  return (
    <div
      aria-hidden
      title="the scroll is one day"
      className="day-clock fixed bottom-5 left-6 z-40 hidden font-mono text-[10.5px] tracking-[0.2em] md:block"
      data-over-photo={overPhoto || undefined}
    >
      {label}
    </div>
  );
}
