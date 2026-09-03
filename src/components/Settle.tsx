import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ONCE, settleTransition } from '../lib/motion';

export { EASE_SETTLE as SETTLE_EASE } from '../lib/motion';

/**
 * The one entrance move on the site: a letterpress settle. Slight drop and
 * overshoot on the transform, ink arriving a beat faster than the motion.
 *
 * Rationed. At most one statement move per viewport - the tier only reads as
 * expensive because it is rare. See `lib/motion.ts`.
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
      viewport={ONCE}
      transition={settleTransition(delay)}
    >
      {children}
    </motion.div>
  );
}
