import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const SETTLE_EASE = [0.16, 1, 0.3, 1.35] as const;

/**
 * The one entrance move on the site: a letterpress settle. Slight drop and
 * overshoot on the transform, ink arriving a beat faster than the motion.
 */
export function Settle({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 1.02 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.75,
        ease: SETTLE_EASE,
        delay,
        opacity: { duration: 0.45, ease: 'easeOut', delay },
      }}
    >
      {children}
    </motion.div>
  );
}
