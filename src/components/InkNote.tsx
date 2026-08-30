import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * A handwritten margin note that inks itself in left to right. Caveat only,
 * always tilted, color set by the caller (clay family).
 *
 * The clip animation lives on an inner element while an unclipped wrapper is
 * observed - a fully clipped element never intersects, so it can't be its
 * own whileInView trigger.
 */
export function InkNote({
  rotate = -2,
  delay = 0.35,
  className = '',
  children,
}: {
  rotate?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className={`inline-block ${className}`} style={{ rotate: `${rotate}deg` }}>
      <motion.div
        className="font-hand"
        initial={reduce ? false : { clipPath: 'inset(-20% 100% -20% 0)' }}
        animate={inView || reduce ? { clipPath: 'inset(-20% -5% -20% 0)' } : undefined}
        transition={{ duration: 1.1, ease: [0.6, 0.05, 0.3, 0.95], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
