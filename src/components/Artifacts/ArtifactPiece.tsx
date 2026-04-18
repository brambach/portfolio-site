import { motion, useReducedMotion } from 'motion/react';
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  index: number;
  from?: 'right' | 'top-right' | 'bottom-right';
}>;

export function ArtifactPiece({ index, from = 'right', children }: Props) {
  const reduced = useReducedMotion();

  const offsets = {
    right: { x: 80, y: 0 },
    'top-right': { x: 60, y: -30 },
    'bottom-right': { x: 60, y: 30 },
  }[from];

  if (reduced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.08 * index }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: offsets.x, y: offsets.y, scale: 0.7 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: 0.15 + index * 0.18,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
