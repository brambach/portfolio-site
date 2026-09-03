import { FirMark } from './FirMark';

const LINKS = [
  ['work', '#work'],
  ['life', '#off-the-clock'],
  ['now', '#vibe-board'],
  ['say hi', '#after-dark'],
] as const;

/**
 * Fixed chrome, four quiet words and the fir. The dawn sky in the hero is
 * cream, so oak ink reads from the first pixel; the ink flips to paper only
 * once the day arc goes dark (the html[data-arc] hook set by DayArc).
 */
export function TopNav() {
  return (
    <header className="topnav fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-12 md:py-7">
      <a href="#hero" aria-label="back to the top" className="transition-colors duration-500">
        <FirMark className="fir-sway h-9 w-[27px]" strokeWidth={2.6} />
      </a>
      <nav className="flex items-center gap-5 text-[13.5px] font-medium tracking-[0.04em] md:gap-7">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className="ink-link transition-colors duration-500">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
