import { useEffect, useRef, useState } from 'react';
import { markSeen, seenBefore } from '../navigate';
import { Logos, TopBar, useLoupePage } from './Chrome';
import { HERO, LOUPE, NAME } from './copy';
import { reduced } from './feel';
import { mountHero, type Hero } from './hero';
import Reel from './Reel';
import { About, Contact, Index, Numbers, Statement } from './sections';
import './fonts';
import './loupe.css';

/* The home page in the loupe look. A pinned hero where a glass loupe moves over a wall of the work (hero.ts), then
   the page slides up over it: one big line, the work as a fly-through (Reel.tsx), every project as a list, the
   numbers, the about and a way to say hello (sections.tsx). */

export default function Home() {
  const root = useRef<HTMLDivElement>(null), hero = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null), name = useRef<HTMLHeadingElement>(null);
  const [gl, setGl] = useState(false);
  const [again] = useState(() => seenBefore('home'));
  useEffect(() => markSeen('home'), []);
  useLoupePage();

  // The loupe. Only with WebGL2 and a real layout; otherwise the name stays plain on the dark.
  useEffect(() => {
    const c = canvas.current, n = name.current, h = hero.current;
    if (!c || !n || !h || typeof ResizeObserver !== 'function' || /jsdom/i.test(navigator.userAgent)) return;
    let loupe: Hero | null = null, raf = 0, on = true;
    const face = document.fonts?.load ? Promise.race([document.fonts.load(`800 100px "Archivo Variable"`), new Promise(ok => setTimeout(ok, 1200))]) : Promise.resolve();
    void face.then(() => {
      if (!on) return;
      loupe = mountHero({ canvas: c, name: n, reduced: reduced(), onLost: () => setGl(false) });
      if (!loupe) return;
      setGl(true);
      loupe.start();
      onScroll();
      void document.fonts?.ready.then(() => loupe?.name());
    });
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = scrollY / Math.max(1, h.offsetHeight);
        loupe?.exit(p);
        if (p >= 1) loupe?.stop(); else if (!document.hidden) loupe?.start();
      });
    };
    const onVis = () => (document.hidden ? loupe?.stop() : onScroll());
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => { on = false; removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); cancelAnimationFrame(raf); loupe?.destroy(); };
  }, []);

  // Arriving at /#work, /#about or /#contact lands there.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ['work', 'about', 'contact'].includes(hash)) document.getElementById(hash)?.scrollIntoView();
  }, []);

  return <div className={`lp lp-home${gl ? ' gl' : ''}${again ? ' again' : ''}`} ref={root} id="top">
    <TopBar home />
    <section className="lp-hero" ref={hero} aria-labelledby="lp-name" data-cursor="lens">
      <canvas className="lp-gl" ref={canvas} role="img" aria-label={LOUPE.art} />
      <div className="lp-hero-in">
        <h1 className="lp-name" id="lp-name" ref={name} aria-label={NAME}>
          <span className="ln" aria-hidden="true"><span className="tx">{LOUPE.first}</span><i className="bl" /></span>
          <span className="ln" aria-hidden="true"><span className="tx">{LOUPE.last}</span><i className="bl" /></span>
        </h1>
        <div className="lp-hero-foot">
          <p className="lp-role"><span>{LOUPE.role}</span></p>
          <p className="lp-tag">{HERO.line}</p>
          <Logos />
        </div>
      </div>
    </section>

    <main className="lp-main">
      <Statement />
      <Reel />
      <Index />
      <Numbers />
      <About />
    </main>
    <Contact />
  </div>;
}
