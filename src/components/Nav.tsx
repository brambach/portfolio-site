import { MobileMenu } from './MobileMenu';

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Projects', href: '#projects' },
  { label: 'AI & Tools', href: '#stack' },
  { label: 'Contact', href: '#contact' },
];

export function Nav() {
  return (
    <>
      <nav
        aria-label="Primary"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 48,
          background: 'rgba(0,0,0,0.8)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          backdropFilter: 'saturate(180%) blur(20px)',
          color: '#fff',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 20px',
          fontFamily: 'var(--ff-text)',
          fontSize: 12,
          fontWeight: 400,
        }}
      >
        <a
          href="#hero"
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '-0.22px',
            justifySelf: 'start',
          }}
        >
          Bryce Rambach
        </a>

        <div
          className="nav-links"
          style={{
            gap: 24,
            alignItems: 'center',
            justifySelf: 'center',
          }}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            className="nav-resume"
            href="/Bryce_Rambach_Resume.pdf"
            target="_blank"
            rel="noopener"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Résumé
          </a>
          <span className="nav-mobile"><MobileMenu /></span>
        </div>
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .nav-links  { display: none !important; }
          .nav-resume { display: none !important; }
        }
        @media (min-width: 768px) {
          .nav-links  { display: flex !important; }
          .nav-resume { display: inline-flex !important; }
          .nav-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
