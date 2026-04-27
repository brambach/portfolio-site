export function Chrome() {
  return (
    <div className="chrome fixed top-4 inset-x-0 z-50 flex items-center justify-between px-6 pointer-events-none">
      <a
        href="#top"
        className="chrome-mark pointer-events-auto inline-flex items-center gap-2.5 rounded-xl px-3 py-2 font-mono text-[11px] font-medium"
        style={{
          letterSpacing: '0.04em',
          color: 'var(--color-ink-2)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid var(--color-hair-2)',
        }}
      >
        <span
          className="chrome-glyph grid place-items-center w-[18px] h-[18px] rounded-md font-serif italic text-[13px] leading-none text-white"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.5), rgba(255,255,255,0.05))' }}
        >
          BR
        </span>
        BRYCE&nbsp;RAMBACH
      </a>

      <nav
        className="chrome-links pointer-events-auto hidden md:inline-flex gap-1 p-1.5 rounded-[14px] font-mono text-[11px] font-medium"
        style={{
          letterSpacing: '0.04em',
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid var(--color-hair-2)',
        }}
      >
        {[
          ['ARCHIVE', '#archive'],
          ['SYSTEMS', '#systems'],
          ['CONCEPT', '#sidequest'],
          ['CONTACT', '#contact'],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="chrome-link px-2.5 py-1.5 rounded-[9px] transition-colors"
            style={{ color: 'var(--color-ink-2)' }}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
