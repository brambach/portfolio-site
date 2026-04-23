import type { CSSProperties } from 'react';
import { AppleButton } from './AppleButton';
import { FadeIn } from './FadeIn';

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '12px 0',
  borderBottom: '1px solid var(--hairline-dark)',
  fontSize: 13,
  gap: 12,
};

const labelStyle: CSSProperties = {
  color: 'var(--text-muted-on-dark)',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  fontSize: 11,
  fontWeight: 600,
  flexShrink: 0,
};

const valueStyle: CSSProperties = {
  color: '#fff',
  textAlign: 'right',
  wordBreak: 'break-word',
  fontWeight: 400,
};

export function Contact() {
  return (
    <FadeIn as="section" id="contact" aria-labelledby="contact-heading">
      <div
        style={{
          background: 'var(--bg-dark)',
          color: 'var(--text-light)',
          padding: '96px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 32,
          }}
          className="contact-grid"
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--ff-text)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.2px',
                textTransform: 'uppercase',
                color: 'var(--link-dark)',
                marginBottom: 14,
              }}
            >
              Contact
            </div>
            <h2
              id="contact-heading"
              style={{
                fontFamily: 'var(--ff-display)',
                fontSize: 'clamp(32px, 6vw, 44px)',
                fontWeight: 600,
                lineHeight: 1.07,
                letterSpacing: '-0.28px',
                marginBottom: 16,
              }}
            >
              Let's talk.
            </h2>
            <p
              style={{
                fontFamily: 'var(--ff-text)',
                fontSize: 15,
                lineHeight: 1.47,
                letterSpacing: '-0.3px',
                color: 'rgba(255,255,255,0.78)',
                maxWidth: '44ch',
                marginBottom: 24,
              }}
            >
              Open to Solutions Engineer or Full-Stack roles at early-stage startups. Relocating to a new city summer 2026.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AppleButton variant="primary" href="mailto:bryce.rambach@gmail.com">
                Email me
              </AppleButton>
              <AppleButton
                variant="ghost"
                href="/Bryce_Rambach_Resume.pdf"
                target="_blank"
                rel="noopener"
              >
                Résumé
              </AppleButton>
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--ff-text)',
              borderTop: '1px solid var(--hairline-dark)',
            }}
          >
            <div style={rowStyle}>
              <span style={labelStyle}>Email</span>
              <a style={valueStyle} href="mailto:bryce.rambach@gmail.com">bryce.rambach@gmail.com</a>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Phone</span>
              <a style={valueStyle} href="tel:+18312361922">(831) 236-1922</a>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>LinkedIn</span>
              <a style={valueStyle} href="https://linkedin.com/in/bryce-rambach" target="_blank" rel="noopener">/in/bryce-rambach</a>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>GitHub</span>
              <a style={valueStyle} href="https://github.com/brambach" target="_blank" rel="noopener">@brambach</a>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Based</span>
              <span style={{ ...valueStyle, color: 'rgba(255,255,255,0.72)' }}>home → a new city</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: minmax(0, 1fr) 260px !important; gap: 40px !important; }
        }
      `}</style>
    </FadeIn>
  );
}
