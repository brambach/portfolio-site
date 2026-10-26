import { useEffect, useRef, type CSSProperties } from 'react';
import { afterPaint } from './home/after-paint';
import { bandRule, borderImage, cameo, medallionRings, waveField } from './home/art/guilloche';
import Vignette from './home/art/Vignette';
import { EMAIL, FOOTER, HERO } from './home/copy';
import CopyEmail, { CopyStatus } from './home/CopyEmail';
import { useMotionMode } from './home/motion-mode';
import { useWatch } from './home/motion/watch';
import Note from './home/Note';
import PrintRow, { Away, type Card } from './home/PrintRow';
import './home/banknote.css';

const PAPER = '#f3eee3';

// --border-ink stays one string in one property: the foil reuses it as its mask.
const GUILLOCHE = {
  '--border-ink': borderImage('#5e2a7e'),
  '--border-cream': borderImage('#efe7d6'),
  '--wave': waveField('#5e2a7e'),
  '--band': bandRule('#5e2a7e'),
} as CSSProperties;

const AWAY = [
  { label: 'github', href: 'https://github.com/brambach' },
  { label: 'x @brycerambach', href: 'https://x.com/brycerambach' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/bryce-rambach/' },
];

const WORK: Card[] = [
  {
    id: 'dervo', serial: '001', name: 'dervo', kind: 'mac app, 2026',
    what: 'a mac app for running claude code and codex side by side, on your machine, under your own logins.',
    facts: [
      '18 beta testers signed on, and it ran 1,500+ agent tasks.',
      'i shipped nested sub-threads first, before claude code had them. then claude shipped something similar, so i stopped building it.',
    ],
    shots: [{ src: '/projects/dervo/catch-up.jpg', alt: 'dervo’s catch up screen: what finished, what’s stuck and what needs you', width: 1512, height: 840 }],
    source: 'https://github.com/brambach/dervo',
  },
  {
    id: 'integration-portal', serial: '002', name: 'integration portal', kind: 'employee, now',
    what: 'hr and payroll integrations for an hr and payroll consultancy.',
    facts: [
      'it pre-fills the field mappings and says why. nothing reaches payroll until a person confirms it.',
      'employer owned work, so the screens use a made-up cast.',
    ],
    shots: [{ src: '/projects/portal/hub.webp', alt: 'the integration portal’s home screen, with one mapping waiting for review', width: 1650, height: 962 }],
  },
  {
    id: 'arro', serial: '003', name: 'arro', kind: 'iphone app',
    what: 'a daily movement streak for families who live apart.',
    facts: [
      'a missed day is never public. it says “maya still has today”. maya is a sample name.',
      'expo, react native and supabase, with 192 pgtap tests. on testflight.',
    ],
    shots: [
      { src: '/projects/arro/today.jpg', alt: 'arro’s today screen with the family streak', width: 780, height: 1688 },
      { src: '/projects/arro/feed.jpg', alt: 'arro’s feed of today’s and yesterday’s workouts', width: 780, height: 1688 },
    ],
    phones: true,
    source: 'https://github.com/brambach/arro',
  },
  {
    id: 'lucid', serial: '004', name: 'lucid', kind: 'web app',
    what: 'an integration workspace that follows a request into scope, specs and delivery.',
    facts: ['every mapped value carries its source.'],
    shots: [{ src: '/projects/lucid/spec.png', alt: 'a lucid specification for a nightly employee sync', width: 1440, height: 1000 }],
  },
];

export default function Home() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    if (meta) meta.content = PAPER;
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return () => { if (meta && before) meta.content = before; };
  }, []);

  // The oval is the slowest piece to draw (about 3ms), so it lands after the first paint.
  const frame = useRef<HTMLSpanElement>(null);
  useEffect(() => afterPaint(() => { if (frame.current) frame.current.innerHTML = cameo(150, 192).svg; }), []);

  const mode = useMotionMode();
  const face = useWatch<HTMLElement>({ oncePerVisit: 'bn-roll' });
  const medal = useRef<HTMLDivElement>(null);
  const back = useWatch<HTMLElement>({ near: () => { if (medal.current) medal.current.innerHTML = medallionRings(260).join(''); } });

  const lead = HERO.line.slice(0, -HERO.italic.length);
  return <div className="home bn" style={GUILLOCHE} data-mode={mode}>
    <CopyStatus>
      <header className="top label">
        <a href="/">bryce rambach</a>
        <nav aria-label="site"><a href="#work">work</a><a href="#about">about</a><a href={`mailto:${EMAIL}`}>email</a></nav>
      </header>

      <main>
        <Note side="face" micro={HERO.line} aria-labelledby="hero-line" ref={face}>
          <div className="note__top">
            <div className="note__text">
              <h1 id="hero-line">{lead}<em>{HERO.italic}</em></h1>
              <p className="hero__sub">{HERO.sub}</p>
              <div className="hero__links">
                <CopyEmail />
                {AWAY.map(l => <Away key={l.href} href={l.href}>{l.label}</Away>)}
              </div>
            </div>
            <div className="cameo" aria-hidden="true">
              <span ref={frame} className="cameo__in" />
              <img className="cameo__art" src="/art/portrait.webp" width={150} height={192} alt="" decoding="async" />
            </div>
          </div>
          <Vignette label={HERO.art} />
        </Note>

        <section id="work" className="sec" aria-label="work">
          <div className="rule"><h2 className="label">work</h2><span className="rule__band" aria-hidden="true" /></div>
          <div className="rows">{WORK.map(w => <PrintRow key={w.id} card={w} />)}</div>
        </section>
      </main>

      <Note side="back" micro={FOOTER.about} id="about" ref={back}>
        <div className="back">
          <div className="back__text">
            <section aria-label="about">
              <h2 className="label">about</h2>
              <p className="back__about">i'm a remote employee at an hr and payroll consultancy. alongside that, i founded dervo.</p>
              <p className="back__about">{FOOTER.about}</p>
            </section>
            <div className="back__links">
              <CopyEmail />
              <nav aria-label="elsewhere">{AWAY.map(l => <Away key={l.href} href={l.href}>{l.label}</Away>)}</nav>
            </div>
          </div>
          <div className="medal" aria-hidden="true" ref={medal} />
          <p className="colophon">{FOOTER.sign}</p>
        </div>
      </Note>
    </CopyStatus>
  </div>;
}
