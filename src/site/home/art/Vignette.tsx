import { useEffect, useRef } from 'react';
import { afterPaint } from '../after-paint';
import { timeFrames } from '../motion-mode';
import { drawing } from './vignette';
import './vignette.css';

/* The hero's engraving. Its box keeps its size from CSS, so the page doesn't shift when the drawing lands. It's drawn
   after the first paint, at the box's own size, and again if the box changes width. */

export default function Vignette({ label }: { label: string }) {
  const roll = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plate.current, rolling = roll.current;
    if (!el || !rolling) return;
    let width = 0, timer = 0, cancel = () => {};
    // The drawing is the most script the page runs, so it's worked out a step at a time, each after a paint, and a
    // drawing still being worked out gives way to one at a newer width. A redraw makes a new sun, and its rise would
    // play again, so vignette.css lets only the first drawing's sun rise.
    const draw = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || Math.abs(w - width) < 2) return;
      cancel();
      width = w;
      const steps = drawing(w, h);
      const step = () => {
        const next = steps.next();
        if (!next.done) return void (cancel = afterPaint(step));
        if (el.firstChild) el.dataset.redrawn = '';
        el.innerHTML = next.value;
      };
      step();
    };
    cancel = afterPaint(draw);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(draw, 150); }) : null;
    ro?.observe(el);
    // Frames are timed while the roll plays, so a device that drops them gets the lite page. Only the roll's own start
    // counts: .roll__in starts at the same moment and its event bubbles here too.
    let stopTiming = () => {};
    const time = (e: Event) => { if (e.target === rolling) { stopTiming(); stopTiming = timeFrames(); } };
    rolling.addEventListener('animationstart', time);
    return () => { cancel(); stopTiming(); window.clearTimeout(timer); ro?.disconnect(); rolling.removeEventListener('animationstart', time); };
  }, []);

  return <figure className="vig hero__in">
    <div ref={roll} className="roll"><div className="roll__in">
      <div ref={plate} className="vig__plate" role="img" aria-label={label} />
    </div></div>
  </figure>;
}
