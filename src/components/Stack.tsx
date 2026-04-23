import { AI_STACK } from '@/src/lib/content';
import { FadeIn } from './FadeIn';

export function Stack() {
  return (
    <FadeIn as="section" id="stack" aria-labelledby="stack-heading">
      <div
        style={{
          background: 'var(--bg-light)',
          color: 'var(--text-dark)',
          padding: '96px 24px',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: 'var(--ff-text)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.2px',
              textTransform: 'uppercase',
              color: 'var(--link-light)',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            How I work
          </div>
          <h2
            id="stack-heading"
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: 'clamp(24px, 4vw, 30px)',
              fontWeight: 600,
              lineHeight: 1.10,
              letterSpacing: '-0.2px',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            AI &amp; Tools.
          </h2>
          <p
            style={{
              fontFamily: 'var(--ff-text)',
              fontSize: 15,
              color: 'rgba(0,0,0,0.6)',
              textAlign: 'center',
              marginBottom: 36,
              letterSpacing: '-0.22px',
            }}
          >
            Daily infrastructure for shipping.
          </p>

          <div className="stack-rows">
            {AI_STACK.map((tool, i) => (
              <div
                key={tool.name}
                className="stack-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 8,
                  padding: '22px 0',
                  borderTop: '1px solid var(--hairline-light)',
                  borderBottom: i === AI_STACK.length - 1 ? '1px solid var(--hairline-light)' : 'none',
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '-0.2px',
                    color: 'var(--text-dark)',
                  }}
                >
                  {tool.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ff-text)',
                    fontSize: 15,
                    lineHeight: 1.47,
                    letterSpacing: '-0.3px',
                    color: 'rgba(0,0,0,0.72)',
                  }}
                >
                  {tool.use}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .stack-row { grid-template-columns: 34% 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </FadeIn>
  );
}
