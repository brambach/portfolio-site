import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

type SectionHeadProps = { num: string; title: ReactNode; description: string; headingId: string };

export function SectionHead({ num, title, description, headingId }: SectionHeadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start center'] });
  const x = useTransform(scrollYProgress, [0, 1], [-12, 0]);

  return (
    <Reveal>
      <div ref={ref} className="section-head grid gap-7 mb-8 md:grid-cols-[80px_1fr] md:gap-7 md:items-baseline">
        <motion.div
          style={{ x, color: 'var(--color-ink-3)', letterSpacing: '0.16em' }}
          className="section-num font-mono text-[10.5px] font-medium uppercase"
        >
          {num}
        </motion.div>
        <div>
          <h2 id={headingId} className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
            {title}
          </h2>
          <p className="mt-3 font-mono text-[12px]" style={{ color: 'var(--color-ink-3)', letterSpacing: '0.04em' }}>
            {description}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
