import { useEffect, useRef, useState } from 'react';
import { useMotionMode } from '../motion-mode';
import { vignette } from './vignette';
import './vignette.css';

/* The hero's engraving. Its box keeps its size from CSS, so the page doesn't shift when the drawing lands. It's drawn
   after the first paint, at the box's own size, and again if the box changes width. */

/** What the picture is doing. The only thing CSS reads.
 *  still: reduced motion, painted finished, nothing runs.
 *  off: off screen (or never seen yet), every animation paused.
 *  on: on screen, running.
 *  paused: the visitor pressed pause; stays paused on or off screen. */
export type Motion = 'still' | 'off' | 'on' | 'paused';

/* data-drawn: absent until first seen; "" runs the draw-in; "done" paints it finished (reduced motion, or it already
   drew in once this visit). */
type Drawn = '' | 'done' | undefined;

const DRAWN_KEY = 'vig-drawn';

// Blocked storage just means the picture draws in again.
const drewThisVisit = () => { try { return sessionStorage.getItem(DRAWN_KEY) === '1'; } catch { return false; } };

const afterPaint = (fn: () => void) => {
  let t = 0;
  const raf = requestAnimationFrame(() => { t = window.setTimeout(fn); });
  return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
};

export default function Vignette({ label }: { label: string }) {
  const still = useMotionMode() === 'still';
  const plate = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [drawn, setDrawn] = useState<Drawn>(() => (still || drewThisVisit() ? 'done' : undefined));

  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    let width = 0, timer = 0;
    const draw = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || Math.abs(w - width) < 2) return;
      el.innerHTML = vignette(w, h);
      width = w;
    };
    const cancel = afterPaint(draw);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(draw, 150); }) : null;
    ro?.observe(el);
    const io = !still && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([e]) => {
        setOnScreen(e.isIntersecting);
        if (e.isIntersecting) setDrawn(d => d ?? '');
      }, { threshold: 0.25 })
      : null;
    io?.observe(el);
    return () => { cancel(); window.clearTimeout(timer); ro?.disconnect(); io?.disconnect(); };
  }, [still]);

  useEffect(() => {
    if (drawn === '') try { sessionStorage.setItem(DRAWN_KEY, '1'); } catch { /* the next load draws in again */ }
  }, [drawn]);

  const motion: Motion = still ? 'still' : onScreen ? 'on' : 'off';
  return <figure className="vig hero__in">
    <div ref={plate} className="vig__plate" role="img" aria-label={label} data-motion={motion} data-drawn={still ? 'done' : drawn} />
  </figure>;
}
