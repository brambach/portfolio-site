import { ReactLenis } from 'lenis/react';
import { useEffect, useState, type ReactNode } from 'react';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  return (
    <ReactLenis
      root
      options={{ lerp: 0.08, duration: 1.4, smoothWheel: !reduced, anchors: !reduced }}
    >
      {children}
    </ReactLenis>
  );
}
