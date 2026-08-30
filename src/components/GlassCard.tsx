import { createElement, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/utils';

type GlassCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

export function GlassCard({ children, as: Tag = 'div', className, ...rest }: GlassCardProps) {
  return createElement(
    Tag,
    {
      className: cn(
        'glass-card relative overflow-hidden rounded-[20px] border transition-all duration-300',
        className,
      ),
      style: {
        background: 'var(--color-glass)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        borderColor: 'var(--color-hair-2)',
        boxShadow: '0 0 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      ...rest,
    },
    children,
  );
}
