import type { ReactNode } from 'react';
import { motion } from 'motion/react';

type Tag = 'div' | 'section' | 'article' | 'header' | 'footer' | 'li';

type FadeInProps = {
  children: ReactNode;
  className?: string;
  as?: Tag;
  delay?: number;
  id?: string;
  'aria-labelledby'?: string;
};

export function FadeIn({
  children,
  className,
  as = 'div',
  delay = 0,
  id,
  'aria-labelledby': ariaLabelledBy,
}: FadeInProps) {
  const Component = motion[as];
  return (
    <Component
      id={id}
      className={className}
      aria-labelledby={ariaLabelledBy}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Component>
  );
}
