import { HEADER, HERO } from '../copy';
import { useMotionMode } from '../motion-mode';
import Vignette from '../art/Vignette';
import Contents from './Contents';

/* The first screen: the line, who's saying it, the engraving with its rising sun, and the contents. The words
   arrive with an 8px rise, 40ms apart, in CSS. Reduced motion paints it all finished, the sun already up. */

export default function Hero() {
  const mode = useMotionMode();
  // The one italic line on the screen is the end of the hero line.
  const lead = HERO.line.slice(0, -HERO.italic.length);
  return <section className="hero" data-motion={mode} aria-labelledby="hero-line">
    <header className="hero__top hero__in">
      <a className="hero__name" href="/">{HEADER.name}</a>
      <nav className="hero__links" aria-label="site">
        {HEADER.links.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
      </nav>
    </header>
    <h1 id="hero-line" className="hero__line hero__in">{lead}<em>{HERO.italic}</em></h1>
    <p className="hero__sub hero__in">{HERO.sub}</p>
    <Vignette label={HERO.art} />
    <Contents />
  </section>;
}
