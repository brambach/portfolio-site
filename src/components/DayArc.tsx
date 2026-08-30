import { useScroll, useMotionValueEvent } from 'motion/react';
import { useEffect } from 'react';
import { dayArcColor, isDarkAt } from '../lib/day-arc';

/**
 * Drives document.body's background through the day as you scroll. Renders
 * nothing. Also stamps html[data-arc="light"|"dark"] so fixed chrome (nav,
 * trail ink) can restyle without prop-drilling scroll state.
 */
export function DayArc() {
  const { scrollYProgress } = useScroll();

  const apply = (t: number) => {
    document.body.style.backgroundColor = dayArcColor(t);
    document.documentElement.dataset.arc = isDarkAt(t) ? 'dark' : 'light';
  };

  useMotionValueEvent(scrollYProgress, 'change', apply);

  useEffect(() => {
    apply(scrollYProgress.get());
    return () => {
      document.body.style.backgroundColor = '';
      delete document.documentElement.dataset.arc;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
