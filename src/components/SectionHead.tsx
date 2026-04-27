import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

type SectionHeadProps = {
  num: string;
  title: ReactNode;
  description: string;
  headingId: string;
};

export function SectionHead({ num, title, description, headingId }: SectionHeadProps) {
  return (
    <Reveal>
      <div className="section-head grid gap-7 mb-8 md:grid-cols-[80px_1fr] md:gap-7 md:items-baseline">
        <div
          className="section-num font-mono text-[10.5px] font-medium uppercase"
          style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}
        >
          {num}
        </div>
        <div>
          <h2
            id={headingId}
            className="font-serif"
            style={{
              fontSize: 'clamp(28px, 4vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--color-ink)',
            }}
          >
            {title}
          </h2>
          <p
            className="mt-3 font-mono text-[12px]"
            style={{ color: 'var(--color-ink-3)', letterSpacing: '0.04em' }}
          >
            {description}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
