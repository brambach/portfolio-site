import { useRef, type ReactNode, type PointerEvent } from 'react';
import { cn } from '../lib/utils';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
};

export function TiltCard({ children, className, maxTilt = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === 'touch') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);

    const rx = (0.5 - y) * maxTilt;
    const ry = (x - 0.5) * maxTilt;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }

  return (
    <div
      ref={ref}
      className={cn('tilt-card', className)}
      style={{ transition: 'transform 0.35s ease', transformStyle: 'preserve-3d' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </div>
  );
}
