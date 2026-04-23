export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--bg-light)',
        color: 'var(--text-muted-on-light)',
        padding: '18px 36px',
        fontFamily: 'var(--ff-text)',
        fontSize: 11,
        letterSpacing: '-0.08px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>© 2026 Bryce Rambach.</span>
      <span>Built with React · the system font</span>
    </footer>
  );
}
