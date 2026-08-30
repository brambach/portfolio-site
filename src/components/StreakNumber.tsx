import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const COUNT_MS = 1300;

/**
 * A number that counts up inside a sentence when it enters view. Quiet
 * split-flap feel: cubic ease-out pace, a faint scaleY tick while running.
 */
export function StreakNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(() => (reduce ? value : 0));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    setRunning(true);
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / COUNT_MS);
      setDisplay(Math.round(value * (1 - (1 - f) ** 3)));
      if (f < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setRunning(false);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={`font-mono ${running ? 'ticking' : ''}`}>
      {display.toLocaleString()}
    </span>
  );
}
