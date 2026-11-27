import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NOW } from '../cobalt/copy';
import { A } from '../cobalt/parts';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import { BLOCK, ROWS, SOCIAL } from './copy';
import { mountBlock, type Block } from './city';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import '../motion.css';
import './block.css';

/* The home page in black and white: a calm column of words on the left, and on the right a tall framed etching of a
   city block that keeps you company down the page (city.ts). The work is a list of rows that open in place to show
   each picture; hovering one lights a window in the drawing. The block follows the visitor's clock and the season,
   gets its wreaths, lights and tree stand in the holidays, and parallaxes gently as you scroll. On a phone the
   drawing sits on top. */

/** Which window in the drawing each work row lights up. */
const WINDOWS = [0, 4, 7, 2, 9, 12, 5, 19, 22, 10, 23, 3];

const LOGOS: Record<string, string> = {
  X: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.225 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
};

function Logos({ className }: { className: string }) {
  return <nav className={className} aria-label="elsewhere">
    {SOCIAL.map(s => <A key={s.label} href={s.href} className="logo" title={s.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={LOGOS[s.label]} fill="currentColor" /></svg><span className="bk-vh">{s.label}</span>
    </A>)}
    <a className="logo" href={`mailto:${EMAIL}`} title="Email">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="4.5" width="20" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 6.5l9 6.5 9-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><span className="bk-vh">Email</span>
    </a>
  </nav>;
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), block = useRef<Block | null>(null);
  const [again] = useState(() => seenBefore('home'));
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => markSeen('home'), []);
  useEntrance(root, 'Inter Variable');

  // The browser bar wears the paper while the page is up.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'), before = meta?.content;
    if (meta) meta.content = '#ffffff';
    return () => { if (meta && before) meta.content = before; };
  }, []);

  // The drawing. Only where there's a canvas to draw on and a size to draw it at (not in tests).
  useEffect(() => {
    if (typeof ResizeObserver !== 'function' || !art.current || /jsdom/i.test(navigator.userAgent)) return;
    const b = block.current = mountBlock(art.current);
    b.start();
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; b.scroll(max > 0 ? Math.min(1, scrollY / max) : 0); }); };
    const onVis = () => (document.hidden ? b.stop() : b.start());
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => { removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); cancelAnimationFrame(raf); b.destroy(); block.current = null; };
  }, []);

  // Arriving at /#work or /#about lands there.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === 'work' || hash === 'about') document.getElementById(hash)?.scrollIntoView();
  }, []);

  const light = (i: number, on: boolean) => block.current?.highlight(WINDOWS[i % WINDOWS.length], on);
  const toggle = (i: number) => {
    if (open !== null && open !== i) light(open, false);
    light(i, open !== i);
    setOpen(open === i ? null : i);
  };

  return <div className={again ? 'bk again' : 'bk'} ref={root}>
    <div className="bk-cols">
      <div className="bk-text">
        <header className="bk-head" data-enter>
          <h1 className="bi" style={{ ['--d' as string]: '.15s' }}>{NAME}</h1>
          <p className="role bi" style={{ ['--d' as string]: '.22s' }}>{BLOCK.role}</p>
          <div className="bi" style={{ ['--d' as string]: '.28s' }}><Logos className="logos" /></div>
        </header>

        <main>
          <p className="line bi" style={{ ['--d' as string]: '.32s' }} data-enter>{HERO.line}</p>
          <p className="lead bi" style={{ ['--d' as string]: '.38s' }} data-enter>{NOW.lead}</p>

          <section id="work" className="work" aria-labelledby="bk-work">
            <div className="sec bi" style={{ ['--d' as string]: '.46s' }} data-enter><h2 id="bk-work">Selected work</h2><span>2026</span></div>
            <ul className="rows">
              {ROWS.map((r, i) => {
                const isOpen = open === i, id = `bk-row${i}`;
                return <li key={r.name} className={isOpen ? 'open' : undefined} onPointerEnter={() => light(i, true)} onPointerLeave={() => { if (open !== i) light(i, false); }}>
                  <h3>
                    <button type="button" aria-expanded={isOpen} aria-controls={id} onClick={() => toggle(i)}>
                      <span className="nm">{r.name}</span><span className="kd">{r.kind}</span><span className="pm" aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="more" id={id} role="region" aria-label={r.name} inert={!isOpen || undefined}>
                    <div><div className="in">
                      <div className={r.portrait ? 'ph tall' : 'ph'} data-handover={r.href?.startsWith('/projects/') ? r.href.slice(10) : undefined}><img src={r.img} alt={r.alt} loading="lazy" decoding="async" /></div>
                      <p>{r.line}</p>
                      <p className="cap">{r.caption}</p>
                      {r.href && r.go && <A href={r.href} className="go">{r.go}<svg className="arrow" width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></A>}
                    </div></div>
                  </div>
                </li>;
              })}
            </ul>
          </section>

          <section id="about" className="about" aria-labelledby="bk-about">
            <div className="sec"><h2 id="bk-about">{ABOUT.title}</h2></div>
            {ABOUT.body.map(p => <p key={p}>{p}</p>)}
            <p className="off">{ABOUT.off}</p>
          </section>
        </main>

        <footer className="bk-foot">
          <div className="sec"><p className="h">{BLOCK.hello}</p></div>
          <a className="mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <Logos className="logos" />
          <p className="fine">{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<a href={l.href}>{l.label}</a></span>)}</p>
          <p className="fine">{BLOCK.sign}</p>
        </footer>
      </div>

      <div className="bk-art" ref={art} role="img" aria-label={BLOCK.art} data-enter>
        <div className="lay" style={{ ['--d' as string]: '.45s' }} aria-hidden="true"><div className="px" style={{ ['--k' as string]: '46px' }}><canvas className="cv-sky" /><svg className="ov-sky" /></div></div>
        <div className="lay" style={{ ['--d' as string]: '.6s' }} aria-hidden="true"><div className="px" style={{ ['--k' as string]: '30px' }}><canvas className="cv-far" /></div></div>
        <div className="lay" style={{ ['--d' as string]: '.75s' }} aria-hidden="true"><div className="px" style={{ ['--k' as string]: '16px' }}><canvas className="cv-near" /></div></div>
        <canvas className="pt pt-far" aria-hidden="true" />
        <div className="lay" style={{ ['--d' as string]: '.9s' }} aria-hidden="true"><div className="px" style={{ ['--k' as string]: '0px' }}><canvas className="cv-front" /><svg className="ov-front" /></div></div>
        <canvas className="pt pt-near" aria-hidden="true" />
      </div>
    </div>
  </div>;
}
