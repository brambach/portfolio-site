import { useEffect } from 'react';
import Vignette from './home/art/Vignette';
import { EMAIL, HERO } from './home/copy';
import './simple.css';

/* The home page, simple: who he is, the work right under it, a short about, and how to reach him. One page, no pins,
   no scrubbing. The engraving is drawn once, finished, as a quiet ornament. Facts come from the repo's existing copy. */

const PAPER = '#f3eee3';
const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;

const LINKS = [
  { label: EMAIL, href: `mailto:${EMAIL}` },
  { label: 'github', href: 'https://github.com/brambach', away: true },
  { label: 'x @brycerambach', href: 'https://x.com/brycerambach', away: true },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/bryce-rambach/', away: true },
];

type Card = {
  id: string; name: string; kind: string; what: string; facts: string[];
  shots: { src: string; alt: string }[]; phones?: boolean;
  source?: string;
};

const WORK: Card[] = [
  {
    id: 'dervo', name: 'dervo', kind: 'mac app, 2026',
    what: 'a mac app for running claude code and codex side by side, on your machine, under your own logins.',
    facts: [
      '18 beta testers signed on, and it ran 1,500+ agent tasks.',
      'i shipped nested sub-threads first, before claude code had them. then claude shipped something similar, so i stopped building it.',
    ],
    shots: [{ src: '/projects/dervo/catch-up.jpg', alt: 'dervo’s catch up screen: what finished, what’s stuck and what needs you' }],
    source: 'https://github.com/brambach/dervo',
  },
  {
    id: 'integration-portal', name: 'integration portal', kind: 'contract, jul to oct 2026',
    what: 'hr and payroll integrations for an hr and payroll consultancy.',
    facts: [
      'it pre-fills the field mappings and says why. nothing reaches payroll until a person confirms it.',
      'employer owned work, so the screens use a made-up cast.',
    ],
    shots: [{ src: '/projects/portal/hub.png', alt: 'the integration portal’s home screen, with one mapping waiting for review' }],
  },
  {
    id: 'arro', name: 'arro', kind: 'iphone app',
    what: 'a daily movement streak for families who live apart.',
    facts: [
      'a missed day is never public. it says “maya still has today”.',
      'expo, react native and supabase, with 192 pgtap tests. on testflight.',
    ],
    shots: [
      { src: '/projects/arro/today.jpg', alt: 'arro’s today screen with the family streak' },
      { src: '/projects/arro/feed.jpg', alt: 'arro’s feed of today’s and yesterday’s workouts' },
    ],
    phones: true,
    source: 'https://github.com/brambach/arro',
  },
  {
    id: 'lucid', name: 'lucid', kind: 'web app',
    what: 'an integration workspace that follows a request into scope, specs and delivery.',
    facts: ['every mapped value carries its source.'],
    shots: [{ src: '/projects/lucid/spec.png', alt: 'a lucid specification for a nightly employee sync' }],
  },
];

/* port has no screenshot to show, so it gets a quieter row under the cards: the words, and a way to try the hold. */
const PORT = {
  id: 'port', name: 'port', kind: 'swiftui prototype',
  what: 'an iphone app for putting your phone down at night. hold for a second and the screen folds into a line.',
  fact: 'its page lets you try the hold in your browser, with the app’s sound.',
  source: 'https://github.com/brambach/port',
};

export default function Home() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    if (meta) meta.content = PAPER;
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return () => { if (meta && before) meta.content = before; };
  }, []);

  const lead = HERO.line.slice(0, -HERO.italic.length);
  return <main className="home">
    <header className="s-top s-label">
      <a href="/">bryce rambach</a>
      <nav aria-label="site"><a href="#work">work</a><a href="#about">about</a><a href={`mailto:${EMAIL}`}>email</a></nav>
    </header>

    <section className="s-hero s-fade" aria-labelledby="hero-line">
      <h1 id="hero-line">{lead}<em>{HERO.italic}</em></h1>
      <p>{HERO.sub}</p>
      <div className="s-links">
        {LINKS.map(l => <a key={l.href} href={l.href} {...(l.away ? NEW_TAB : {})}>{l.label}</a>)}
      </div>
    </section>
    <Vignette label={HERO.art} mode="still" />

    <section id="work" className="s-sec" aria-label="work">
      <span className="s-label">work</span>
      <div className="s-grid">
        {WORK.map(w => <article key={w.id} className="s-card">
          <a className={`s-shot${w.phones ? ' is-phones' : ''}`} href={`/projects/${w.id}`} aria-label={`${w.name}, the full story`}>
            {w.shots.map(s => <img key={s.src} src={s.src} alt={s.alt} loading="lazy" decoding="async" />)}
          </a>
          <div className="s-head"><h3>{w.name}</h3><span className="s-label">{w.kind}</span></div>
          <p className="s-what">{w.what}</p>
          <ul className="s-facts">{w.facts.map(f => <li key={f}>{f}</li>)}</ul>
          <div className="s-more">
            <a href={`/projects/${w.id}`}>the full story</a>
            {w.source && <a href={w.source} {...NEW_TAB}>source</a>}
          </div>
        </article>)}
      </div>
      <article className="s-small">
        <div className="s-head"><h3>{PORT.name}</h3><span className="s-label">{PORT.kind}</span></div>
        <div>
          <p className="s-what">{PORT.what}</p>
          <p className="s-facts">{PORT.fact}</p>
        </div>
        <div className="s-more">
          <a href={`/projects/${PORT.id}`}>the full story</a>
          <a href={PORT.source} {...NEW_TAB}>source</a>
        </div>
      </article>
    </section>

    <section id="about" className="s-sec s-about" aria-label="about">
      <span className="s-label">about</span>
      <p>i’m 22 and i finished a cs degree in may 2026. from july to october i built hr and payroll integrations on contract, and before that i founded dervo.</p>
      <p>i do my best work on a small team where one person owns a product from the api at the bottom to the words on the buttons. i’m looking for a founding or product engineer role at an early stage ai startup. open to moving.</p>
    </section>

    <footer className="s-foot">
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <nav aria-label="elsewhere">
        {LINKS.slice(1).map(l => <a key={l.href} href={l.href} {...NEW_TAB}>{l.label}</a>)}
      </nav>
    </footer>
  </main>;
}
