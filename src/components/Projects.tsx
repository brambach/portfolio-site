import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PROJECTS } from '@/src/lib/content';
import { FadeIn } from './FadeIn';
import { getStageState } from '@/src/lib/projects-progress';

const STAGES = 4;
const PIN_VH = 100 * STAGES; // 400vh pin

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function StageContent({
  index,
  opacity,
}: {
  index: number;
  opacity: number | ReturnType<typeof useTransform>;
}) {
  const p = PROJECTS[index];
  const number = String(index + 1).padStart(2, '0');
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            fontFamily: 'var(--ff-text)',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.48)',
            letterSpacing: '0.4px',
            marginBottom: 18,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {number} / 04
        </div>
        <div
          aria-hidden="true"
          style={{
            fontFamily: 'var(--ff-display)',
            fontSize: 'clamp(56px, 12vw, 80px)',
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: '-2.2px',
            color: 'rgba(255,255,255,0.18)',
            marginBottom: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {number}
        </div>
        <h3
          style={{
            fontFamily: 'var(--ff-display)',
            fontSize: 'clamp(28px, 5vw, 36px)',
            fontWeight: 600,
            lineHeight: 1.07,
            letterSpacing: '-0.2px',
            margin: '0 0 8px',
          }}
        >
          {p.title}.
        </h3>
        <p
          style={{
            fontFamily: 'var(--ff-text)',
            fontSize: 14,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '-0.22px',
            marginBottom: 18,
          }}
        >
          {p.subtitle}
        </p>
        <p
          style={{
            fontFamily: 'var(--ff-text)',
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.47,
            letterSpacing: '-0.3px',
            color: 'rgba(255,255,255,0.88)',
            maxWidth: '58ch',
            marginBottom: 22,
          }}
        >
          {p.body}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {p.tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: 'var(--ff-text)',
                fontSize: 12,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.72)',
                padding: '4px 10px',
                borderRadius: 'var(--r-pill)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Static version used for mobile + reduced-motion. */
function StackFallback() {
  return (
    <>
      {PROJECTS.map((p, i) => {
        const number = String(i + 1).padStart(2, '0');
        return (
          <FadeIn key={p.id}>
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '64px 24px',
              }}
            >
              <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
                <div
                  style={{
                    fontFamily: 'var(--ff-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.48)',
                    letterSpacing: '0.4px',
                    marginBottom: 18,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {number} / 04
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: 'clamp(56px, 12vw, 80px)',
                    fontWeight: 600,
                    lineHeight: 0.95,
                    letterSpacing: '-2.2px',
                    color: 'rgba(255,255,255,0.18)',
                    marginBottom: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {number}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: 'clamp(28px, 5vw, 36px)',
                    fontWeight: 600,
                    lineHeight: 1.07,
                    letterSpacing: '-0.2px',
                    margin: '0 0 8px',
                  }}
                >
                  {p.title}.
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--ff-text)',
                    fontSize: 14,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '-0.22px',
                    marginBottom: 18,
                  }}
                >
                  {p.subtitle}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--ff-text)',
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: 1.47,
                    letterSpacing: '-0.3px',
                    color: 'rgba(255,255,255,0.88)',
                    maxWidth: '58ch',
                    marginBottom: 22,
                  }}
                >
                  {p.body}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: 'var(--ff-text)',
                        fontSize: 12,
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.72)',
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        );
      })}
    </>
  );
}

function PinnedStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });

  const [announceIndex, setAnnounceIndex] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      const { activeIndex } = getStageState(v, STAGES);
      setAnnounceIndex((prev) => (prev === activeIndex ? prev : activeIndex));
    });
    return () => unsub();
  }, [scrollYProgress]);

  // Derive per-stage opacity transforms from scroll progress
  const opacities = Array.from({ length: STAGES }, (_, i) =>
    useTransform(scrollYProgress, (v) => getStageState(v, STAGES).opacities[i]),
  );
  const tickFills = Array.from({ length: STAGES }, (_, i) =>
    useTransform(scrollYProgress, (v) => getStageState(v, STAGES).tickFills[i]),
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: `${PIN_VH}vh` }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Pinned header */}
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            padding: '0 24px',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: 'var(--ff-text)',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '-0.08px',
                marginBottom: 10,
              }}
            >
              Projects
            </div>
            <h2
              id="projects-heading"
              style={{
                fontFamily: 'var(--ff-display)',
                fontSize: 30,
                fontWeight: 600,
                lineHeight: 1.10,
                letterSpacing: '-0.2px',
                margin: '0 0 4px',
              }}
            >
              Projects.
            </h2>
            <p
              style={{
                fontFamily: 'var(--ff-text)',
                fontSize: 15,
                color: 'rgba(255,255,255,0.72)',
                letterSpacing: '-0.2px',
                margin: '0 0 12px',
              }}
            >
              Four I'm proud of.
            </p>
            <div style={{ height: 1, background: 'var(--hairline-dark)' }} />
          </div>
        </div>

        {/* Swapping stage content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            paddingTop: 200,
          }}
        >
          {opacities.map((op, i) => (
            <StageContent key={i} index={i} opacity={op} />
          ))}
        </div>

        {/* Progress ticks (bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            padding: '0 24px',
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              display: 'flex',
              gap: 6,
            }}
          >
            {tickFills.map((fill, i) => (
              <motion.div
                key={i}
                style={{
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.2)',
                }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    background: '#fff',
                    scaleX: fill,
                    transformOrigin: '0% 50%',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* aria-live region for stage changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        Project {announceIndex + 1} of {STAGES}: {PROJECTS[announceIndex].title}
      </div>
    </div>
  );
}

export function Projects() {
  const isDesktop = useMatchMedia('(min-width: 768px)');
  const reducedMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
  const usePinned = isDesktop && !reducedMotion;

  return (
    <section
      id="projects"
      aria-labelledby={usePinned ? 'projects-heading' : 'projects-heading-fallback'}
      style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-light)',
      }}
    >
      {usePinned ? (
        <PinnedStage />
      ) : (
        <>
          <FadeIn>
            <div
              style={{
                padding: '96px 24px 32px',
                maxWidth: 720,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--ff-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '-0.08px',
                  marginBottom: 10,
                }}
              >
                Projects
              </div>
              <h2
                id="projects-heading-fallback"
                style={{
                  fontFamily: 'var(--ff-display)',
                  fontSize: 30,
                  fontWeight: 600,
                  lineHeight: 1.10,
                  letterSpacing: '-0.2px',
                  margin: '0 0 4px',
                }}
              >
                Projects.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--ff-text)',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.72)',
                  margin: '0 0 24px',
                }}
              >
                Four I'm proud of.
              </p>
              <div style={{ height: 1, background: 'var(--hairline-dark)' }} />
            </div>
          </FadeIn>
          <StackFallback />
        </>
      )}
    </section>
  );
}
