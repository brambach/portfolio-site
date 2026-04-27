import { motion, useInView } from 'motion/react';
import { useRef, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
};

const EASE = [0.2, 0.7, 0.2, 1] as const;

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 14 }}
      animate={inView ? { opacity: 1, filter: 'blur(0px)', y: 0 } : undefined}
      transition={{ duration: 1.2, ease: EASE, delay: delay * 0.08 }}
    >
      {children}
    </motion.div>
  );
}
