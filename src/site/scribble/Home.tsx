import { useEffect, useRef, useState } from 'react';
import { EMAIL, NAME } from '../cobalt/copy';
import { A } from '../cobalt/parts';
import { useEntrance } from '../useEntrance';
import { ROWS, SOCIAL, BLOCK } from '../block/copy';
import { mountScene, type Scene } from './scene';
import { SCRIBBLE, stageId } from './copy';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import '../motion.css';
import './scribble.css';

/* The scribble home. A white sheet with Bryce's name at the top and a pen resting beside it. The pen draws a little
   doodle that comes alive; then it's the visitor's turn. Everything they draw wakes up, grows legs and eyes and gets
   on with its life (scene.ts, creature.ts). Under the sheet, the work, plainly. */

const LOGOS: Record<string, string> = {
  X: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.225 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
};

function Logos({ className }: { className: string }) {
  return <nav className={className} aria-label="elsewhere">
    {SOCIAL.map(s => <A key={s.label} href={s.href} className="logo" title={s.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={LOGOS[s.label]} fill="currentColor" /></svg><span className="sc-vh">{s.label}</span>
    </A>)}
    <a className="logo" href={`mailto:${EMAIL}`} title="Email">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="4.5" width="20" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 6.5l9 6.5 9-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><span className="sc-vh">Email</span>
    </a>
  </nav>;
}

/** A little speaker, drawn. Crossed out when quiet. */
function Speaker({ quiet }: { quiet: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.2 9.6c-.2 1.6-.2 3.2.1 4.8l3.6.2 4.6 3.7c.4-3.9.4-8.6-.1-12.6L7.8 9.4z" />
    {quiet ? <path d="M15.8 9.4l4.4 5.2M20.1 9.3l-4.2 5.4" /> : <><path d="M15.6 9.7c.9 1.4.9 3.2 0 4.7" /><path d="M18.2 7.4c2 2.7 2 6.6-.1 9.3" /></>}
  </svg>;
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null), hero = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const paper = useRef<HTMLDivElement>(null), park = useRef<HTMLSpanElement>(null), keep = useRef<HTMLButtonElement>(null), scene = useRef<Scene | null>(null);
  const [quiet, setQuiet] = useState(false);
  useEntrance(root, 'Inter Tight Variable');

  // The browser bar wears the paper while the page is up.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'), before = meta?.content;
    if (meta) meta.content = '#ffffff';
    return () => { if (meta && before) meta.content = before; };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver !== 'function' || typeof IntersectionObserver !== 'function' || /jsdom/i.test(navigator.userAgent)) return;
    if (!root.current || !hero.current || !canvas.current || !paper.current || !park.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = scene.current = mountScene({ root: root.current, hero: hero.current, canvas: canvas.current, paper: paper.current, park: park.current, card: keep.current, reduced });
    setQuiet(s.voice.muted);
    return () => { s.destroy(); scene.current = null; };
  }, []);

  const toggle = () => { const s = scene.current; if (!s) return; s.voice.setMuted(!s.voice.muted); setQuiet(s.voice.muted); if (!s.voice.muted) s.voice.unlock(); };

  return <div className="sc" ref={root}>
    <section className="sc-hero" ref={hero} aria-label={SCRIBBLE.paper}>
      <header className="sc-top" data-enter>
        <div className="sc-who">
          <h1 className="sc-name">{NAME}<span className="sc-park" ref={park} aria-hidden="true" /></h1>
          <p className="sc-role">{BLOCK.role}</p>
        </div>
        <button type="button" className="sc-sound" onClick={toggle} aria-pressed={!quiet} aria-label={quiet ? SCRIBBLE.soundOn : SCRIBBLE.soundOff} title={quiet ? SCRIBBLE.soundOn : SCRIBBLE.soundOff}><Speaker quiet={quiet} /></button>
      </header>
      <div className="sc-paper" ref={paper} />
      <div className="sc-under">
        <a className="sc-skip" href="#work" data-enter style={{ ['--d' as string]: '.5s' }}>{SCRIBBLE.skip}<svg width="11" height="11" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
      </div>
    </section>

    <main id="work" className="sc-work" aria-labelledby="sc-work-h">
      <h2 id="sc-work-h" className="sc-vh">{SCRIBBLE.work}</h2>
      {ROWS.map((r, i) => <section key={r.name} className={i % 2 ? 'sc-stage flip' : 'sc-stage'} data-stage={stageId(r.name)} aria-label={r.name}>
        <div className={r.portrait ? 'sc-pic tall' : 'sc-pic'} data-pic>
          {r.href ? <A href={r.href} tabIndex={-1} aria-hidden="true"><img src={r.img} alt="" loading="lazy" decoding="async" /></A> : <img src={r.img} alt={r.alt} loading="lazy" decoding="async" />}
        </div>
        <div className="sc-txt">
          <h3><span className="nm">{r.name}</span><span className="kd">{r.kind}</span></h3>
          <p>{r.line}</p>
          {r.href && r.go && <A href={r.href} className="go">{r.go}<span className="sc-vh"> about {r.name}</span><svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></A>}
        </div>
        <div className="sc-room" data-room aria-hidden="true" />
      </section>)}
    </main>

    <footer className="sc-foot">
      <div className="sc-bye">
        <div className="sc-bye-txt">
          <h2 className="sc-h">{BLOCK.hello}</h2>
          <a className="mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <Logos className="logos" />
        </div>
        <div className="sc-room sc-end" data-end aria-hidden="true" />
        <button type="button" className="sc-card" ref={keep} hidden aria-label={SCRIBBLE.save} title={SCRIBBLE.save}><img alt="" /><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" /></svg></button>
      </div>
      <div className="sc-room sc-parade" data-parade aria-hidden="true" />
      <p className="fine">{BLOCK.sign}</p>
    </footer>
    <canvas className="sc-ink" ref={canvas} aria-hidden="true" />
  </div>;
}
