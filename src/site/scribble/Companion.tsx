import { useEffect, useRef } from 'react';
import { mountCompanion } from './companion';
import { SCRIBBLE } from './copy';
import './companion.css';

/* The creature the visitor drew on the home page, along with them on a project page (companion.ts). If they never
   drew one, there's nothing here. */
export default function Companion() {
  const canvas = useRef<HTMLCanvasElement>(null), button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!canvas.current || !button.current || /jsdom/i.test(navigator.userAgent)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // It's a bonus: if anything about it goes wrong, the page carries on without it.
    let b: ReturnType<typeof mountCompanion> = null;
    try { b = mountCompanion({ canvas: canvas.current, button: button.current, reduced }); } catch { b = null; }
    return () => b?.destroy();
  }, []);
  return <div className="sc-buddy">
    <canvas ref={canvas} aria-hidden="true" />
    <button ref={button} type="button" hidden aria-label={SCRIBBLE.buddy} title={SCRIBBLE.buddy} />
  </div>;
}
