import { useScroll, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef } from 'react';
import { DAY_STOPS, arcStops, dayArcColor, isDarkAt, type ArcStops } from '../lib/day-arc';

/**
 * Drives document.body's background through the day as you scroll. Renders
 * nothing. The color stops are measured from where the chapters actually sit
 * (section ids in HOUR_BY_SECTION), so the light reaches each hour exactly
 * when its section does. Also stamps html[data-arc="light"|"dark"] so fixed
 * chrome (nav, trail ink) can restyle without prop-drilling scroll state.
 */
export function DayArc() {
  const { scrollYProgress } = useScroll();
  const stopsRef = useRef<ArcStops>(DAY_STOPS);

  const apply = (t: number) => {
    document.body.style.backgroundColor = dayArcColor(t, stopsRef.current);
    document.documentElement.dataset.arc = isDarkAt(t, stopsRef.current) ? 'dark' : 'light';
  };

  useMotionValueEvent(scrollYProgress, 'change', apply);

  useEffect(() => {
    const measure = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const positions: Record<string, number> = {};
      for (const el of document.querySelectorAll<HTMLElement>('main section[id]')) {
        const rect = el.getBoundingClientRect();
        const middle = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
        positions[el.id] = Math.min(1, Math.max(0, middle / maxScroll));
      }
      stopsRef.current = arcStops(positions);
      apply(scrollYProgress.get());
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      document.body.style.backgroundColor = '';
      delete document.documentElement.dataset.arc;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
