import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { A } from '../cobalt/parts';
import { DERVO } from '../cobalt/copy';
import { markSeen, seenBefore } from '../navigate';
import type { Pic } from '../stories';
import { Arrow, LOGOS, TopBar, useLoupePage } from './Chrome';
import { chapter, nextOf, type ChapterData } from './chapters';
import { LOUPE } from './copy';
import { reduced } from './feel';
import { Odometer, Scrub, useArrive } from './sections';
import { nn, WORK } from './work';
import './fonts';
import './loupe.css';
import './chapter.css';

/* A project's page in the loupe look. It opens like a title card: the count, the name rising out of a mask, the line in
   italic, and the cover picture the home handed over (navigate.ts), which settles as the page scrolls. Then the
   project in its own words, what it does, the call that mattered, its pictures and where it stands. The two case
   studies keep the long body Bryce wrote, worn dark. The end of every page is the next project's cover. */

const TeammateBody = lazy(() => import('../block/TeammatePage'));
const PsycheBody = lazy(() => import('../block/PsychePage'));
const DervoDemo = lazy(() => import('./DervoBody'));

const testing = () => /jsdom/i.test(navigator.userAgent);

/** The name letter by letter, each word held together so a narrow screen breaks between words, never inside one. */
function Letters({ text }: { text: string }) {
  let i = 0;
  return <>{text.split(' ').map((word, w) => <span key={w}>
    {w > 0 && ' '}
    <span className="w">{[...word].map(ch => <span key={i} className="ch" style={{ ['--i' as string]: i++ }}>{ch}</span>)}</span>
  </span>)}</>;
}

/** The cover: grows into the frame, and eases from a slight zoom to rest as the page scrolls off it. */
function Cover({ c }: { c: ChapterData }) {
  const box = useRef<HTMLDivElement>(null), img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = box.current, im = img.current;
    if (!el || !im || reduced() || testing()) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, 1 - r.bottom / (vh + r.height)));
      im.style.transform = `translate3d(0, ${(p * 12).toFixed(2)}%, 0) scale(${(1.12 - p * 0.1).toFixed(4)})`;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    addEventListener('scroll', kick, { passive: true });
    return () => { removeEventListener('scroll', kick); cancelAnimationFrame(raf); };
  }, []);
  return <div className="ch-cover" ref={box}>
    <div className="ch-cover-in" data-handover={c.id === 'jared' ? 'ai-teammate' : c.id}>
      <img ref={img} src={c.cover.src} alt={c.cover.alt} decoding="async" fetchPriority="high" />
    </div>
  </div>;
}

/** A picture that opens from a slit as it arrives. */
function Figure({ pic, wide }: { pic: Pic; wide?: boolean }) {
  const [ref, inView] = useArrive<HTMLElement>(0.15);
  return <figure ref={ref} className={`ch-fig${wide ? ' wide' : ''}${inView ? ' in' : ''}`}>
    <div className="ch-fig-in" style={{ aspectRatio: `${pic.w} / ${pic.h}` }}>
      <picture>
        {pic.phone && <source media="(max-width: 640px)" srcSet={pic.phone.src} width={pic.phone.w} height={pic.phone.h} />}
        <img src={pic.src} alt={pic.alt} width={pic.w} height={pic.h} loading="lazy" decoding="async" />
      </picture>
    </div>
    <figcaption className="lp-mono-s">{pic.caption}</figcaption>
  </figure>;
}

function Stats({ stats }: { stats: NonNullable<ChapterData['stats']> }) {
  const [ref, inView] = useArrive<HTMLUListElement>(0.3);
  return <ul ref={ref} className={inView ? 'ch-stats in' : 'ch-stats'} aria-label="By the numbers">
    {stats.map((s, i) => {
      const shown = s.n.toLocaleString('en-US');
      return <li key={s.k} style={{ ['--i' as string]: i }}>
        <span className="big">{s.pre && <span className="pre">{s.pre}</span>}<Odometer value={shown} go={inView} />{s.plus && <span className="plus">+</span>}{s.unit && <span className="unit">{s.unit}</span>}</span>
        <span className="lp-vh">{s.pre}{shown}{s.plus ? '+' : ''}{s.unit ? ` ${s.unit}` : ''}</span>
        <span className="k">{s.k}</span>
      </li>;
    })}
  </ul>;
}

function Reveal({ className, children, as: Tag = 'section', label }: { className: string; children: React.ReactNode; as?: 'section' | 'div'; label?: string }) {
  const [ref, inView] = useArrive<HTMLElement>(0.12);
  return <Tag ref={ref as never} className={`${className}${inView ? ' in' : ''}`} aria-label={label}>{children}</Tag>;
}

function Next({ id }: { id: string }) {
  const n = nextOf(id);
  const at = WORK.indexOf(n);
  return <a href={n.href!} className="ch-next" data-cursor="view">
    <span className="ch-next-top"><span className="lp-label">{LOUPE.next}</span><span className="lp-label">{nn(at)} / {nn(WORK.length - 1)}</span></span>
    <span className="ch-next-name">{n.name}</span>
    <span className="ch-next-pic"><img src={n.img} alt={n.alt} loading="lazy" decoding="async" data-handover={n.id} /></span>
    <span className="ch-next-go"><Arrow dir="e" /></span>
  </a>;
}

export default function Chapter({ id }: { id: string }) {
  const c = chapter(id)!;
  const root = useRef<HTMLDivElement>(null);
  const [again] = useState(() => seenBefore(`p-${c.id}`));
  useEffect(() => markSeen(`p-${c.id}`), [c.id]);
  useLoupePage(c.title);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  return <div className={`lp lp-ch${again ? ' again' : ''}${c.body ? ` ch-${c.body}` : ''}`} ref={root}>
    <TopBar />
    <header className="ch-hero lp-wrap">
      <p className="ch-meta lp-mono-s"><span>{nn(c.n - 1)} / {nn(WORK.length - 1)}</span><span>{c.kind}</span><span>{c.status}</span><span>{c.year}</span></p>
      <h1 className="ch-name" aria-label={c.name}><span aria-hidden="true"><Letters text={c.name} /></span></h1>
      <div className="ch-sub">
        <p className="ch-line">{c.line}</p>
        {c.links.length > 0 && <p className="ch-links">
          {c.links.map(l => <A key={l.href} href={l.href} className={l.kind === 'live' ? 'lp-pill' : 'lp-pill ghost'}>
            {l.kind === 'source' && <svg viewBox="0 0 24 24" aria-hidden="true" className="gh"><path d={LOGOS.GitHub} fill="currentColor" /></svg>}
            <span>{l.label}</span><Arrow dir="ne" />
          </A>)}
        </p>}
      </div>
    </header>

    <Cover c={c} />

    <main className="ch-main">
      <Reveal className="ch-intro lp-wrap">
        <p className="ch-lead">{c.lead}</p>
        <dl className="ch-facts">
          {c.facts.map(f => <div key={f.label}><dt className="lp-label">{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      </Reveal>

      {c.stats && <div className="lp-wrap"><Stats stats={c.stats} /></div>}

      {c.words.length > 0 && <Reveal className="ch-words lp-wrap" label="In my words">
        <p className="lp-label">In my words</p>
        <dl>
          {c.words.map((w, i) => <div key={w.label} style={{ ['--i' as string]: i }} className={w.draft ? 'draft' : undefined}>
            <dt className="lp-label">{w.label}{w.draft && <span className="tag">draft</span>}</dt>
            <dd>{w.text}</dd>
          </div>)}
        </dl>
      </Reveal>}

      {c.body === 'dervo' && <section className="ch-demo lp-wrap" aria-label={DERVO.demo}>
        <Suspense fallback={<div className="ch-demo-hold" />}><DervoDemo /></Suspense>
        <p className="lp-mono-s">{DERVO.demoCaption}</p>
      </section>}

      {c.pics[0] && c.body !== 'dervo' && <div className="lp-wrap"><Figure pic={c.pics[0]} wide /></div>}

      {c.does && <section className="ch-does lp-wrap" aria-labelledby="ch-does">
        <h2 id="ch-does" className="ch-h2">{c.does.title}</h2>
        <ol>
          {c.does.items.map(([h, p], i) => <Reveal key={h} as="div" className="ch-do"><span className="no">{nn(i)}</span><h3>{h}</h3><p>{p}</p></Reveal>)}
        </ol>
      </section>}

      {c.call && <section className="ch-call lp-wrap" aria-label={c.call.title}>
        <p className="lp-label">{c.call.title}</p>
        <Scrub text={c.call.body} className="ch-quote" as="blockquote" />
      </section>}

      {(c.body === 'dervo' ? c.pics[0] : c.pics[1]) && <div className="lp-wrap"><Figure pic={(c.body === 'dervo' ? c.pics[0] : c.pics[1])!} /></div>}

      {c.hood && <Reveal className="ch-plain lp-wrap"><h2 className="ch-h2">{c.hood.title}</h2><div className="ch-plain-body"><p>{c.hood.body}</p></div></Reveal>}

      {c.stands && <Reveal className="ch-plain lp-wrap"><h2 className="ch-h2">{c.stands.title}</h2><div className="ch-plain-body">{c.stands.body.map(p => <p key={p}>{p}</p>)}</div></Reveal>}

      {(c.body === 'teammate' || c.body === 'psyche') && <div className="ch-case">
        <Suspense fallback={<div className="ch-case-hold" />}>{c.body === 'teammate' ? <TeammateBody /> : <PsycheBody />}</Suspense>
      </div>}

      {c.privacy && <p className="ch-privacy lp-wrap lp-mono-s">{c.privacy}</p>}
    </main>

    <footer className="ch-foot lp-wrap">
      <Next id={c.id} />
      <div className="lp-fine">
        <a href="/#work" className="lp-totop"><Arrow dir="w" /><span>{LOUPE.back}</span></a>
        <p>{LOUPE.sign}</p>
      </div>
    </footer>
  </div>;
}
