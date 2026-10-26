import { useEffect } from 'react';
import { useWatch } from '../motion/watch';
import { vignette } from './vignette';
import './vignette.css';

/* The hero's engraving. Its box keeps its size from CSS, so the page doesn't shift when the drawing lands. It's drawn
   after the first paint, at the box's own size, and again if the box changes width. */

const afterPaint = (fn: () => void) => {
  let t = 0;
  const raf = requestAnimationFrame(() => { t = window.setTimeout(fn); });
  return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
};

export default function Vignette({ label }: { label: string }) {
  const plate = useWatch<HTMLDivElement>({ oncePerVisit: 'vig-drawn' });

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
    // vignette.css runs the draw-in off data-drawn, so it follows data-seen until the glow's end marks it done. The
    // draw-in starts a frame late, so the drawing's heavy first render happens while its parts are still hidden.
    let flip = () => {};
    const mirror = () => {
      if (el.dataset.seen === 'done') el.dataset.drawn = 'done';
      else if (el.dataset.seen === '') flip = afterPaint(() => { el.dataset.drawn ??= ''; });
    };
    const mo = new MutationObserver(mirror);
    mo.observe(el, { attributeFilter: ['data-seen'] });
    mirror();
    return () => { cancel(); flip(); window.clearTimeout(timer); ro?.disconnect(); mo.disconnect(); };
  }, []);

  return <figure className="vig hero__in">
    {/* The glow fades in last, so its end is the end of the draw-in. */}
    <div ref={plate} className="vig__plate" role="img" aria-label={label}
      onAnimationEnd={e => { if ((e.target as Element).classList.contains('vig__halo')) e.currentTarget.dataset.drawn = 'done'; }} />
  </figure>;
}
