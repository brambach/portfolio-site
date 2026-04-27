import { useEffect, useRef } from 'react';

export function CosmicBackground() {
  const bloomRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (bloomRef.current) bloomRef.current.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
      if (gridRef.current)  gridRef.current.style.transform  = `translate3d(0, ${y * -0.05}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="cosmic-bg fixed inset-0 -z-0 pointer-events-none" aria-hidden="true">
      <div ref={bloomRef} className="cosmic-bloom absolute inset-0" />
      <div ref={gridRef} className="cosmic-grid absolute inset-0" />
      <div className="cosmic-noise absolute inset-0" />
    </div>
  );
}
