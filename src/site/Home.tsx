import { useEffect } from 'react';
import Vignette from './home/art/Vignette';
import { EMAIL, HERO } from './home/copy';
import './simple.css';

/* The home page, simple: who he is, the work right under it, a short about, and how to reach him. One page, no pins,
   no scrubbing. The engraving is drawn once, finished, as a quiet ornament. Facts come from the repo's existing copy. */

const PAPER = '#f3eee3';
const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;
/* Read out, not shown: a link that opens a new tab says so. */
/* The space sits outside the hidden span, where a line's end drops it, so the name reads with it and the link looks the same. */
const NewTab = () => <>{' '}<span className="s-vh">(opens in a new tab)</span></>;

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
    id: 'integration-portal', name: 'integration portal', kind: 'employee, 2026',
    what: 'hr and payroll integrations for an hr and payroll consultancy.',
    facts: [
      'it pre-fills the field mappings and says why. nothing reaches payroll until a person confirms it.',
      'employer owned work, so the screens use a made-up cast.',
    ],
    shots: [{ src: '/projects/portal/hub.webp', alt: 'the integration portal’s home screen, with one mapping waiting for review' }],
  },
  {
    id: 'arro', name: 'arro', kind: 'iphone app',
    what: 'a daily movement streak for families who live apart.',
    facts: [
      'a missed day is never public. it says “maya still has today”. maya is a sample name.',
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

export default function Home() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    if (meta) meta.content = PAPER;
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return () => { if (meta && before) meta.content = before; };
  }, []);

  const lead = HERO.line.slice(0, -HERO.italic.length);
  return <div className="home">
    <header className="s-top s-label">
      <a href="/">bryce rambach</a>
      <nav aria-label="site"><a href="#work">work</a><a href="#about">about</a><a href={`mailto:${EMAIL}`}>email</a></nav>
    </header>

    <main>
      <section className="s-hero s-fade" aria-labelledby="hero-line">
        <h1 id="hero-line">{lead}<em>{HERO.italic}</em></h1>
        <p>{HERO.sub}</p>
        <div className="s-links">
          {LINKS.map(l => l.away
            ? <a key={l.href} href={l.href} {...NEW_TAB}>{l.label}<NewTab /></a>
            : <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
      </section>
      <Vignette label={HERO.art} mode="still" />

      <section id="work" className="s-sec" aria-label="work">
        <h2 className="s-label">work</h2>
        <div className="s-grid">
          {WORK.map(w => <article key={w.id} className="s-card">
            <a className={`s-shot${w.phones ? ' is-phones' : ''}`} href={`/projects/${w.id}`} aria-label={`${w.name}, the full story`}>
              {w.shots.map(s => <img key={s.src} src={s.src} alt={s.alt} loading="lazy" decoding="async" />)}
            </a>
            <div className="s-head"><h3>{w.name}</h3><span className="s-label">{w.kind}</span></div>
            <p className="s-what">{w.what}</p>
            <ul className="s-facts">{w.facts.map(f => <li key={f}>{f}</li>)}</ul>
            <div className="s-more">
              <a href={`/projects/${w.id}`}>the full story{' '}<span className="s-vh">about {w.name}</span></a>
              {w.source && <a href={w.source} {...NEW_TAB}><span className="s-vh">{w.name}</span>{' '}source<NewTab /></a>}
            </div>
          </article>)}
        </div>
      </section>

      <section id="about" className="s-sec s-about" aria-label="about">
        <h2 className="s-label">about</h2>
        <p>i was a remote employee at an hr and payroll consultancy, its integrations developer. alongside that, i founded dervo.</p>
        <p>i do my best work on a small team where one person owns a product from the api at the bottom to the words on the buttons.</p>
      </section>
    </main>

    <footer className="s-foot">
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <nav aria-label="elsewhere">
        {LINKS.slice(1).map(l => <a key={l.href} href={l.href} {...NEW_TAB}>{l.label}<NewTab /></a>)}
      </nav>
    </footer>
  </div>;
}
