import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <ReactLenis
      root
      options={{ lerp: 0.08, duration: 1.4, smoothWheel: !reduced, anchors: !reduced }}
    >
      {children}
    </ReactLenis>
  );
}
