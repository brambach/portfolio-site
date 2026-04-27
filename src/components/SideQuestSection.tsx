import { SectionHead } from './SectionHead';
import { GlassCard } from './GlassCard';
import { TiltCard } from './TiltCard';
import { Reveal } from './Reveal';
import { PROJECTS } from '../lib/projects';

export function SideQuestSection({ onOpen }: { onOpen: (slug: string) => void }) {
  const sq = PROJECTS.find((p) => p.slug === 'sidequest')!;

  return (
    <section id="sidequest" aria-labelledby="sq-h" className="relative max-w-[1280px] mx-auto px-6 py-24">
      <SectionHead
        num="03 / Concept"
        title={<>SideQuest —<br />the quest engine.</>}
        description="// A spatial AI concept exploring how intent becomes an itinerary. Conversational input, spatial output, agentic execution."
        headingId="sq-h"
      />
      <Reveal>
        <TiltCard>
          <GlassCard className="relative p-8 md:p-12 min-h-[420px] overflow-hidden">
            <div className="absolute inset-0 sq-depth-field" aria-hidden="true" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_220px] items-center">
              <div>
                <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.16em' }}>
                  <span style={{ color: 'rgb(56,189,248)' }}>SPATIAL · AI · CONCEPT</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'rgb(245,158,11)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(245,158,11)' }} /> LAB
                  </span>
                </div>
                <h3 className="font-serif mt-3" style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.05, color: 'var(--color-ink)' }}>
                  A quest engine for<br />real-world&nbsp;intent.
                </h3>
                <p className="mt-4 text-[14px] max-w-[60ch]" style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
                  {sq.dossier.overview.split('\n\n')[0]}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sq.tags.map((t) => (
                    <span key={t} className="font-mono text-[10px] px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-ink-2)' }}>{t}</span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen('sidequest')}
                  className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-md"
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', color: 'rgb(186,230,253)', letterSpacing: '0.08em' }}
                >
                  OPEN CONCEPT DOSSIER
                </button>
              </div>

              <div className="sq-shape relative h-[200px]" aria-hidden="true">
                <div className="ring r1" />
                <div className="ring r2" />
                <div className="ring r3" />
                <div className="core" />
              </div>
            </div>
          </GlassCard>
        </TiltCard>
      </Reveal>
    </section>
  );
}
