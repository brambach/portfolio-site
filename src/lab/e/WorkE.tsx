import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { NAME, narrow, SIGN } from '../content';
import { E_WORK_IDS, eWorkHref, hourQuery, type EWorkId } from '../routes';
import { afterFirstPaint, askReturn, paintSnapshot, takeHandoff } from './chrome';
import { makeGrid } from './field';
import { ECursor, ELink, Mark } from './links';
import { paletteFor } from './palette';
import { startWorkE, type WorkMotion } from './work-motion';
import { eWorkById, nextEWork, SHOT_SIZE } from './work';
import './e.css';
import './work.css';

/* A project's page in E's style: E's paper, type and palette, with the project's object drawn in E's dots at the
   top, its words as they're written everywhere else on the site, its screens, and a quiet way on to the next one.
   Reached from E's index (or the project before), the dots arrive already drawn and the page picks them up. */

const pad = (n: number) => String(n).padStart(2, '0');
/** How many letters the longest word of a name has, which sets how big it can be set. */
const longest = (name: string) => ({ '--L': Math.max(4, ...name.split(' ').map(w => w.length)) } as CSSProperties);

/** A part's opening: a rule with a label at each end, the way E's parts open. */
function Rule({ left, right, top = false }: { left: string; right: string; top?: boolean }) {
  return <div className="e-rule" aria-hidden="true"><span>{left}</span><i {...(top ? { 'data-top-rule': '' } : { 'data-rule': '' })} /><span>{right}</span></div>;
}

/** A project's name, set twice so the letters can roll from upright to italic (as on E's index). */
function Roll({ text }: { text: string }) {
  return <span className="e-roll" aria-hidden="true">{[...text].map((c, k) => <span key={k} className="e-roll__c" style={{ '--i': k } as CSSProperties}><span>{c === ' ' ? ' ' : c}</span><span>{c === ' ' ? ' ' : c}</span></span>)}</span>;
}

export default function WorkE({ id }: { id: EWorkId }) {
  const work = eWorkById(id)!, next = nextEWork(id);
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<WorkMotion | null>(null);
  const [phase, setPhase] = useState<'open' | 'holding' | 'closed'>('open');
  const [sound, setSound] = useState(true);
  // The screens further down wait until the page has painted, so they never hold up its first paint.
  const [later, setLater] = useState(false);
  const palette = useMemo(() => paletteFor(location.search), []);
  const search = location.search, home = `/lab/e${hourQuery(search)}`;
  const snap = useRef<HTMLCanvasElement>(null), arriving = useRef(false);

  // Did the page before hand over its dots? If it did, paint them before this page's first frame, where they were,
  // until the real dots take over a moment later.
  useLayoutEffect(() => {
    const dots = root.current?.querySelector<HTMLCanvasElement>('[data-dots]');
    const w = dots?.clientWidth || innerWidth, h = dots?.clientHeight || innerHeight;
    const note = takeHandoff(id, w, h);
    arriving.current = !!note;
    if (note?.dots && snap.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paintSnapshot(snap.current, note.dots, makeGrid(w, h, narrow()));
      snap.current.hidden = false;
    }
  }, [id]);

  useEffect(() => {
    if (!root.current) return;
    const html = document.documentElement, meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content, title = document.title;
    html.dataset.labE = palette.name;
    html.style.setProperty('--e-paper', palette.paper);
    if (meta) meta.content = palette.paper;
    document.title = `${work.name} · Bryce Rambach`;
    window.scrollTo(0, 0);
    const el = root.current;
    const drawn = () => { if (snap.current) snap.current.hidden = true; };
    const cancel = afterFirstPaint(() => { motion.current = startWorkE(el, palette, work, next, { arriving: arriving.current, onHold: setPhase, onDrawn: drawn }); setLater(true); });
    return () => {
      cancel();
      motion.current?.stop(); motion.current = null;
      delete html.dataset.labE;
      html.style.removeProperty('--e-paper');
      html.style.removeProperty('background');
      if (meta && before) meta.content = before;
      document.title = title;
    };
  }, [id, palette, work, next]);

  const plain = (e: MouseEvent) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  /** Back to E's index: the browser's own back when that's where this page was opened from, so E comes back as it
   *  was; otherwise a fresh visit that opens where the visitor left off. */
  const back = (e: MouseEvent<HTMLAnchorElement>) => {
    if (plain(e)) return;
    e.preventDefault();
    askReturn();
    let fromE = false;
    try { const r = new URL(document.referrer); fromE = r.origin === location.origin && r.pathname.replace(/\/$/, '') === '/lab/e'; } catch { /* no referrer */ }
    if (fromE && history.length > 1) history.back(); else location.href = home;
  };
  const toNext = (e: MouseEvent<HTMLAnchorElement>) => {
    if (plain(e)) return;
    e.preventDefault();
    const href = eWorkHref(next.id, search);
    if (motion.current) motion.current.leave(next.id, href); else location.href = href;
  };

  const ring = 'ring' in work.hero;
  const at = E_WORK_IDS.indexOf(id);
  const vars = { '--e-paper': palette.paper, '--e-ink': palette.ink, '--e-accent': palette.accent } as CSSProperties;
  const tall = work.shots.length > 1 && work.shots.every(s => s.tall);
  return <div ref={root} className={`lab-e e-wp is-${palette.name}${palette.dark ? ' is-dark' : ''}${ring ? ' is-ring' : ''}`} style={vars} data-sound={sound ? 'on' : 'off'}>
    <canvas className="e-dots" data-dots aria-hidden="true" />
    <canvas ref={snap} className="e-dots e-snap" aria-hidden="true" hidden />

    <header className="e-head">
      <a className="e-head__name" href={home} onClick={back} data-cursor="Back">{NAME}</a>
      <p className="e-caption" aria-hidden="true">{pad(at + 1)} / {pad(E_WORK_IDS.length)}</p>
    </header>

    <main>
      <section className="e-wp__top" data-part="top" aria-labelledby="wp-title">
        <Rule left={work.category} right="The work" top />
        <h1 id="wp-title" className="e-wp__name" style={longest(work.name)} data-title>{work.name}</h1>
        <p className="e-wp__line" data-lead>{work.line}</p>
        <dl className="e-wp__facts" data-lead>
          <div><dt>Role</dt><dd>{work.role}</dd></div>
          <div><dt>Status</dt><dd>{work.status}</dd></div>
          {work.link && <div><dt>See it</dt><dd><ELink href={work.link.href} away cursor="Read">{work.link.label}</ELink></dd></div>}
        </dl>
        <ELink className="e-wp__back" href={home} onClick={back} back cursor="Back" data-lead>Back to the work</ELink>
        {ring
          ? <div className="e-hold" data-phase={phase}>
              <button className="e-hold__ring" aria-label={phase === 'closed' ? 'Open Port' : 'Hold to close Port'} aria-describedby="e-hold-how"
                onPointerDown={e => { if (e.button === 0) motion.current?.hold.press(); }} onPointerUp={() => motion.current?.hold.release()}
                onPointerLeave={() => motion.current?.hold.release()} onPointerCancel={() => motion.current?.hold.release()}
                onKeyDown={e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); if (e.repeat) return; if (phase === 'closed') motion.current?.hold.open(); else motion.current?.hold.close(); }}
                onClick={e => e.preventDefault()} />
              <p className="e-hold__how"><span id="e-hold-how">{phase === 'holding' ? 'Keep holding' : phase === 'closed' ? 'Quiet.' : 'Hold to close'}</span>
                <button className="e-hold__sound" aria-pressed={sound} onClick={() => setSound(!sound)}>Sound {sound ? 'on' : 'off'}</button></p>
              <span className="lab-sr" role="status">{phase === 'closed' ? 'Quiet.' : ''}</span>
            </div>
          : <span className="lab-sr" role="img" aria-label={`${work.name}, one of its screens drawn in dots`} />}
      </section>

      <section className="e-part e-wp__part" data-part="body" aria-labelledby="wp-what">
        <Rule left="01" right="What it is" />
        <h2 id="wp-what" className="lab-sr">What it is</h2>
        <p className="e-wp__intro" data-quiet>{work.introduction}</p>
      </section>

      {work.shots.length > 0 && <section className={`e-wp__shots${tall ? ' is-tall' : ''}`} aria-label={`Screens from ${work.name}`}>
        {work.shots.map(s => <figure key={s.src} className={`e-shot${s.tall ? ' is-tall' : ''}`} data-quiet>
          <img src={later ? s.src : undefined} alt={s.alt} width={SHOT_SIZE[s.src]?.[0]} height={SHOT_SIZE[s.src]?.[1]} loading="lazy" decoding="async" />
          {(s.title || s.text) && <figcaption>{s.title && <b>{s.title}</b>}{s.text && <span>{s.text}</span>}</figcaption>}
        </figure>)}
      </section>}

      <section className="e-part e-wp__part e-wp__text" aria-label={`How ${work.name} was made`}>
        <div data-quiet><Rule left="02" right="The call" /><p>{work.decision}</p></div>
        <div data-quiet><Rule left="03" right="Under the hood" /><p>{work.engineering}</p></div>
        <div data-quiet><Rule left="04" right="The fine print" /><p className="is-quiet">{work.boundary}</p></div>
      </section>

      <nav className="e-part e-wp__next" data-part="next" aria-label="Next project">
        <Rule left={pad(E_WORK_IDS.indexOf(next.id) + 1)} right="Next" />
        <a className="e-wp__nextlink" href={eWorkHref(next.id, search)} onClick={toNext} data-cursor="Open">
          <span className="e-wp__nextname" style={longest(next.name)}><span className="lab-sr">Next: </span><span className="lab-sr">{next.name}</span><Roll text={next.name} /></span>
          <span className="e-wp__nextline"><Mark way="page" />{next.line}</span>
        </a>
        <p className="e-sign"><span>{SIGN}</span></p>
      </nav>
    </main>

    <ECursor />
  </div>;
}
