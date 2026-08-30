import { useScroll, useMotionValueEvent } from 'motion/react';
import { useState } from 'react';
import { HareMark } from './HareMark';

const LINKS = [
  ['work', '#work'],
  ['life', '#off-the-clock'],
  ['now', '#vibe-board'],
  ['say hi', '#after-dark'],
] as const;

/**
 * Fixed chrome, four quiet words and the hare. Ink flips to paper while the
 * nav sits over the hero photograph or once the day arc goes dark (the
 * html[data-arc] hook set by DayArc).
 */
export function TopNav() {
  const { scrollY } = useScroll();
  const [overPhoto, setOverPhoto] = useState(true);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setOverPhoto(y < window.innerHeight * 0.72);
  });

  return (
    <header
      className="topnav fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-12 md:py-7"
      data-over-photo={overPhoto || undefined}
    >
      <a href="#hero" aria-label="back to the top" className="transition-colors duration-500">
        <HareMark pose="running" className="h-9 w-[58px]" strokeWidth={3.4} />
      </a>
      <nav className="flex items-center gap-5 text-[13.5px] font-medium tracking-[0.04em] md:gap-7">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className="transition-colors duration-500">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
