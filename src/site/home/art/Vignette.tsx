import { useEffect, useRef } from 'react';
import { vignette } from './vignette';

/* The hero's engraving. Its box keeps its size from CSS (an aspect ratio per width), so the page doesn't shift when
   the drawing lands. It's drawn after the first paint, at the box's own size, and again if the box changes width.
   The sun rises only the first time. The water's glints breathe while the picture is on screen. */

const afterPaint = (fn: () => void) => {
  let t = 0;
  const raf = requestAnimationFrame(() => { t = window.setTimeout(fn); });
  return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
};

export default function Vignette({ label }: { label: string }) {
  const plate = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    let drawn = 0, timer = 0;
    const draw = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || Math.abs(w - drawn) < 2) return;
      if (drawn) el.dataset.risen = '';
      el.innerHTML = vignette(w, h);
      drawn = w;
    };
    const cancel = afterPaint(draw);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(draw, 150); }) : null;
    ro?.observe(el);
    // No ambient motion off screen.
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([e]) => el.toggleAttribute('data-off', !e.isIntersecting)) : null;
    io?.observe(el);
    return () => { cancel(); window.clearTimeout(timer); ro?.disconnect(); io?.disconnect(); };
  }, []);

  return <figure className="vig hero__in" role="img" aria-label={label}>
    <div ref={plate} className="vig__plate" />
  </figure>;
}
