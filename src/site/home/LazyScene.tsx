import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

/* A scene whose code loads later. Its still (a static picture of the scene, the same size as the real one) paints
   with the page, so nothing waits on the scene's JS and nothing moves when it lands. The real scene mounts when the
   section comes within about a viewport and a half, or when the browser is idle after the first paint, whichever
   is first. */

type Loader = () => Promise<{ default: ComponentType }>;

const idle = (fn: () => void) => {
  if (typeof requestIdleCallback === 'function') { const id = requestIdleCallback(fn, { timeout: 4000 }); return () => cancelIdleCallback(id); }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
};

export default function LazyScene({ load, still, className }: { load: Loader; still: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  // If the scene's code can't load (a dropped connection, a deploy mid-visit), its still stays rather than the
  // whole page failing.
  const [Scene] = useState(() => lazy(() => load().catch(() => ({ default: () => <>{still}</> }))));
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near || !box.current) return;
    const go = () => setNear(true);
    let cancelIdle = () => {};
    // Idle only counts after the first frame is on screen.
    const raf = requestAnimationFrame(() => { cancelIdle = idle(go); });
    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) go(); }, { rootMargin: '150% 0px' })
      : null;
    io?.observe(box.current);
    return () => { cancelAnimationFrame(raf); cancelIdle(); io?.disconnect(); };
  }, [near]);

  return <div ref={box} className={className}>
    {near ? <Suspense fallback={still}><Scene /></Suspense> : still}
  </div>;
}
