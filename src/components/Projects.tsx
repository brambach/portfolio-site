import { PROJECTS } from '@/src/lib/content';
import { FadeIn } from './FadeIn';

function ProjectStage({ index }: { index: number }) {
  const p = PROJECTS[index];
  const number = String(index + 1).padStart(2, '0');
  return (
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
  );
}

export function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-light)',
      }}
    >
      <FadeIn>
        <div style={{ padding: '96px 24px 32px', textAlign: 'left', maxWidth: 720, margin: '0 auto' }}>
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
              fontWeight: 400,
              color: 'rgba(255,255,255,0.72)',
              letterSpacing: '-0.2px',
              margin: '0 0 24px',
            }}
          >
            Four I'm proud of.
          </p>
          <div style={{ height: 1, background: 'var(--hairline-dark)', marginBottom: 0 }} />
        </div>
      </FadeIn>
      {PROJECTS.map((_, i) => (
        <FadeIn key={PROJECTS[i].id}>
          <ProjectStage index={i} />
        </FadeIn>
      ))}
    </section>
  );
}
