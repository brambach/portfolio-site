import { PROJECTS, type Project } from '../lib/projects';
import { SectionHead } from './SectionHead';
import { GlassCard } from './GlassCard';
import { TiltCard } from './TiltCard';
import { Reveal } from './Reveal';

const SLOT_CLASS: Record<Project['bentoSlot'], string> = {
  feat: 'md:col-span-8 md:row-span-2',
  tall: 'md:col-span-4 md:row-span-2',
  wide: 'md:col-span-8',
  side: 'md:col-span-4',
  full: 'md:col-span-12',
};

const STATUS_LABEL: Record<Project['status'], string> = {
  'in-production': 'IN PRODUCTION',
  shipping: 'SHIPPING',
  concept: 'LAB',
  recursive: 'RECURSIVE',
};

export function ArchiveSection({ onOpen }: { onOpen: (slug: string) => void }) {
  const archive = PROJECTS.filter((p) => ['FLAGSHIP', 'PRACTICE', 'FLEET', 'META'].includes(p.kind));

  return (
    <section id="archive" aria-labelledby="arch-h" className="relative max-w-[1280px] mx-auto px-6 py-24">
      <SectionHead
        num="01 / Archive"
        title={<>Selected artifacts<br />from the workbench.</>}
        description="// Four production systems — assembled, scaled, and operated by one engineer. Click any artifact to expand its dossier."
        headingId="arch-h"
      />

      <div className="grid gap-5 md:grid-cols-12 md:auto-rows-[280px]">
        {archive.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
            <TiltCard className={SLOT_CLASS[p.bentoSlot]}>
              <GlassCard className="h-full p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>
                  <span>{p.index} — {p.kind}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === 'in-production' ? 'rgb(134,239,172)' : p.status === 'shipping' ? 'rgb(56,189,248)' : 'rgb(245,158,11)' }} />
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>

                <div>
                  <div className="font-mono text-[10.5px]" style={{ color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>
                    {p.kicker}
                  </div>
                  <h3 className="font-serif mt-1.5" style={{ fontSize: 'clamp(22px, 2.6vw, 36px)', lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--color-ink)' }}>
                    {p.title}
                  </h3>
                </div>

                <p className="text-[13.5px] flex-1" style={{ color: 'var(--color-ink-2)', lineHeight: 1.55, maxWidth: '46ch' }}>
                  {p.cardBody}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="font-mono text-[10px] px-2 py-1 rounded-md" style={{ color: 'var(--color-ink-2)', background: 'rgba(255,255,255,0.04)', letterSpacing: '0.04em' }}>
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onOpen(p.slug)}
                  className="self-start inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-md transition"
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', color: 'rgb(186,230,253)', letterSpacing: '0.08em' }}
                >
                  OPEN DOSSIER
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 9 L9 3 M5 3 H9 V7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              </GlassCard>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
