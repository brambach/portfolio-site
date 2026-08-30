import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * A handwritten margin note that inks itself in left to right. Caveat only,
 * always tilted, color set by the caller (clay family).
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
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`inline-block font-hand ${className}`}
      style={{ rotate }}
      initial={reduce ? false : { clipPath: 'inset(-20% 100% -20% 0)' }}
      whileInView={{ clipPath: 'inset(-20% -5% -20% 0)' }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.1, ease: [0.6, 0.05, 0.3, 0.95], delay }}
    >
      {children}
    </motion.div>
  );
}
