import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CONTACT, DAY_BEATS, INTRO, NAME, SIDE_QUESTS, SIGN, SKILLS, SUB, WORK } from '../content';
import { clockAt, dayFromScroll, readLocal, remap, scrollFromDay, startNote, startOf, type Anchor } from './day';
import { startSky, type Sky } from './sky';
import { CALM, SNAP, spring, springEasing, step } from './spring';
import { Table } from './Table';
import { Mag, Pull, Tagline } from './tactile';
import './c.css';

/* Direction C: tactile. A sky you can touch, and a day that starts at your own time.

   The sky is a halftone field drawn in WebGL behind the whole page (sky.ts). It answers the pointer, ripples where
   you tap it, and its sun is a body on a spring. The day it shows starts at the visitor's clock (day.ts): every
   section has its hour in what's left of that day, the page's scroll position moves the sky between them, and the
   dial in the corner moves the scroll by the hour and snaps to each section. */

const pad = (n: number) => String(n).padStart(2, '0');
const reducedNow = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const liteNow = () => typeof window !== 'undefined' && (document.documentElement.clientWidth < 760 || matchMedia('(pointer: coarse)').matches);
const SPRING_CSS = springEasing(SNAP);
const SOFT_CSS = springEasing({ k: 140, c: 16 });

/** A picture for a skill, from the project pages, with its caption. */
function pictureFor(src: string) {
  for (const work of WORK) for (const pic of [work.hero, ...work.gallery]) if (pic.src === src) return { work, pic };
  return null;
}

export default function DirectionC() {
  const [still] = useState(reducedNow);
  const [lite] = useState(liteNow);
  const local = useMemo(() => readLocal(), []);
  const start = useMemo(() => startOf(local), [local]);
  // The first beat is wherever the visitor's day starts, so it's named for that.
  const beats = useMemo(() => DAY_BEATS.map(b => ({ ...b, label: b.id === 'hero' && start.kind !== 'night' ? 'Your time' : b.label as string, D: remap(start.D, b.at), clock: clockAt(remap(start.D, b.at)) })), [start]);
  const beat = (id: string) => beats.find(b => b.id === id)!;

  const canvas = useRef<HTMLCanvasElement>(null), wash = useRef<HTMLDivElement>(null);
  const sky = useRef<Sky | null>(null);
  const anchors = useRef<Anchor[]>([]);
  const knob = useRef<SVGGElement>(null), dialTime = useRef<HTMLSpanElement>(null), dialWhat = useRef<HTMLSpanElement>(null), dial = useRef<HTMLDivElement>(null);
  const glide = useRef<{ s: ReturnType<typeof spring>; raf: number; last: number }>({ s: spring(0), raf: 0, last: 0 });
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no');

  // ---- the sky, and the day it shows ---------------------------------------------------------------------
  useEffect(() => {
    if (!canvas.current || !wash.current) return;
    const s = startSky(canvas.current, { reduced: still, lite, fallback: wash.current });
    sky.current = s;
    const measure = () => {
      const end = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      let prev = -1;
      anchors.current = beats.map((b, i) => {
        const el = document.querySelector<HTMLElement>(`[data-beat="${b.id}"]`);
        let y = i === 0 ? 0 : i === beats.length - 1 ? end : el ? el.getBoundingClientRect().top + scrollY - innerHeight * 0.32 : prev;
        y = Math.min(end, Math.max(prev + 1, y));
        prev = y;
        return { y, D: b.D };
      });
      onScroll();
    };
    let frame = 0, lastBeat = -1;
    const place = () => {
      frame = 0;
      const D = dayFromScroll(anchors.current, scrollY);
      s.setDay(D);
      // The dial: the sun on its arc, the time, and which part of the page it is.
      const a = Math.PI * (1 - D);
      knob.current?.setAttribute('transform', `translate(${(70 + 56 * Math.cos(a)).toFixed(2)} ${(66 - 56 * Math.sin(a)).toFixed(2)})`);
      if (dialTime.current) dialTime.current.textContent = clockAt(D);
      let i = 0;
      while (i < beats.length - 1 && D >= beats[i + 1].D - 0.004) i++;
      if (i !== lastBeat && dialWhat.current) { dialWhat.current.textContent = beats[i].label; lastBeat = i; }
      dial.current?.setAttribute('aria-valuenow', D.toFixed(3));
      dial.current?.setAttribute('aria-valuetext', `${clockAt(D)}, ${beats[i].label}`);
    };
    function onScroll() { if (!frame) frame = requestAnimationFrame(place); }
    addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    measure();
    // Snap the first frame to the start, then let the sun rise out of the water.
    s.setDay(dayFromScroll(anchors.current, scrollY));
    const rise = window.setTimeout(() => s.rise(), 150);

    // The pointer moves the light; a press on the sky itself drops a ripple.
    const busy = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('a, button, input, [data-card], [role="slider"], .c-tag');
    const move = (e: PointerEvent) => s.pointer(e.clientX, e.clientY, e.pointerType);
    const down = (e: PointerEvent) => { if (e.pointerType === 'touch') s.pointer(e.clientX, e.clientY, 'touch'); if (!busy(e.target)) s.ripple(e.clientX, e.clientY); };
    const up = (e: PointerEvent) => { if (e.pointerType === 'touch') s.leave(); };
    const out = (e: MouseEvent) => { if (!e.relatedTarget) s.leave(); };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down, { passive: true });
    addEventListener('pointerup', up, { passive: true });
    addEventListener('pointercancel', up, { passive: true });
    document.addEventListener('mouseout', out);
    return () => {
      clearTimeout(rise); cancelAnimationFrame(frame); ro.disconnect(); s.stop(); sky.current = null;
      removeEventListener('scroll', onScroll); removeEventListener('pointermove', move); removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up); removeEventListener('pointercancel', up); document.removeEventListener('mouseout', out);
    };
  }, [beats, still, lite]);

  // ---- the dial ----------------------------------------------------------------------------------------
  /** Scroll there on a spring (or straight there, with reduced motion). Any wheel, touch or key takes over. */
  const glideTo = (y: number) => {
    const g = glide.current;
    cancelAnimationFrame(g.raf); g.raf = 0;
    if (still) { scrollTo(0, y); return; }
    g.s.x = scrollY; g.s.to = y; g.last = 0;
    const stopGlide = () => { cancelAnimationFrame(g.raf); g.raf = 0; removeEventListener('wheel', stopGlide); removeEventListener('touchstart', stopGlide); removeEventListener('keydown', stopGlide); };
    addEventListener('wheel', stopGlide, { passive: true }); addEventListener('touchstart', stopGlide, { passive: true }); addEventListener('keydown', stopGlide);
    const run = (now: number) => {
      const dt = Math.min(0.05, (now - (g.last || now)) / 1000); g.last = now;
      step(g.s, dt, { k: CALM.k * 0.6, c: 2 * Math.sqrt(CALM.k * 0.6) });
      scrollTo(0, g.s.x);
      if (Math.abs(g.s.x - g.s.to) < 0.5 && Math.abs(g.s.v) < 1) { scrollTo(0, g.s.to); stopGlide(); return; }
      g.raf = requestAnimationFrame(run);
    };
    g.raf = requestAnimationFrame(run);
  };
  const nearest = (D: number) => beats.reduce((best, b, i) => Math.abs(b.D - D) < Math.abs(beats[best].D - D) ? i : best, 0);
  const currentD = () => dayFromScroll(anchors.current, scrollY);
  const dialDrag = useRef<{ id: number } | null>(null);
  const dayFromDial = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).querySelector('svg')!.getBoundingClientRect();
    const cx = r.left + (70 / 140) * r.width, cy = r.top + (66 / 80) * r.height;
    const a = Math.atan2(cy - e.clientY, e.clientX - cx);
    const ang = a < -Math.PI / 2 ? Math.PI : Math.max(0, Math.min(Math.PI, a));
    const lo = beats[0].D;
    return Math.max(lo, 1 - ang / Math.PI);
  };
  const dialDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dialDrag.current = { id: e.pointerId };
    cancelAnimationFrame(glide.current.raf);
    e.currentTarget.classList.add('is-held');
    scrollTo(0, scrollFromDay(anchors.current, dayFromDial(e)));
  };
  const dialMove = (e: React.PointerEvent) => { if (dialDrag.current) scrollTo(0, scrollFromDay(anchors.current, dayFromDial(e))); };
  const dialUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dialDrag.current) return;
    dialDrag.current = null;
    e.currentTarget.classList.remove('is-held');
    glideTo(anchors.current[nearest(currentD())].y);
  };
  const dialKey = (e: React.KeyboardEvent) => {
    const i = nearest(currentD());
    const to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? beats.length - 1 : null;
    if (to == null) return;
    e.preventDefault();
    e.stopPropagation();
    glideTo(anchors.current[Math.max(0, Math.min(beats.length - 1, to))].y);
  };

  // ---- copy the email ---------------------------------------------------------------------------------
  const email = CONTACT[0];
  const copy = async () => {
    try { await navigator.clipboard.writeText(email.name); setCopied('yes'); }
    catch { setCopied('failed'); }
    window.setTimeout(() => setCopied('no'), 2400);
  };

  const Hour = ({ id }: { id: string }) => <span className="c-hour"><i aria-hidden="true" style={{ '--d': beat(id).D } as CSSProperties} />{beat(id).clock}</span>;
  const vars = { '--c-spring': SPRING_CSS.easing, '--c-spring-ms': `${SPRING_CSS.ms}ms`, '--c-soft': SOFT_CSS.easing, '--c-soft-ms': `${SOFT_CSS.ms}ms` } as CSSProperties;

  return <div className={`c-page${still ? ' is-still' : ''}${lite ? ' is-lite' : ''}`} style={vars}>
    <div ref={wash} className="c-wash" aria-hidden="true" />
    <canvas ref={canvas} className="c-sky" aria-hidden="true" />

    <header className="c-hero" data-beat="hero">
      <p className="c-name">{NAME}</p>
      <Tagline still={still} />
      <p className="c-sub">{SUB}</p>
      <p className="c-now">{startNote(local, start)}</p>
      <p className="c-hint" aria-hidden="true">{lite ? 'Swipe across the letters. Tap the sky.' : 'Push the letters around. Click the sky.'}</p>
    </header>

    <main className="c-main">
      <section className="c-sec c-intro" data-beat="intro" aria-label="About">
        <Hour id="intro" />
        <p className="c-lede">{INTRO.before}<Mag href={INTRO.link.to}>{INTRO.link.label}</Mag>{INTRO.after}</p>
        <p>{INTRO.second}</p>
      </section>

      {SKILLS.map((skill, n) => {
        const found = skill.picture.src ? pictureFor(skill.picture.src) : null;
        return <section key={skill.id} id={skill.id} className="c-sec c-skill" data-beat={skill.id} aria-labelledby={`c-${skill.id}`}>
          <Hour id={skill.id} />
          <h2 id={`c-${skill.id}`}><span className="c-no">{pad(n + 1)}</span>{skill.name}</h2>
          <p className="c-line">{skill.line}</p>
          {skill.body.map((text, i) => <p key={i}>{text}</p>)}
          {found && <Pull id={`c-pic-${skill.id}`} src={skill.picture.src} tall={skill.picture.tall} still={still}
            alt={`${found.work.name}: ${found.pic.title ?? skill.line}`} caption={found.pic.title} />}
          <ul className="c-proof">
            {skill.evidence.map(item => <li key={item.name}>
              {item.to ? <Mag href={item.to}>{item.name}</Mag> : item.href ? <Mag href={item.href} external>{item.name}</Mag> : <b>{item.name} <small>Private</small></b>}
              <span>{item.note}</span>
            </li>)}
          </ul>
        </section>;
      })}

      <section className="c-sec c-worksec" data-beat="work" aria-labelledby="c-work">
        <Hour id="work" />
        <h2 id="c-work">The work</h2>
        <Table still={still} />
        <h3 className="c-sub-h">Side quests</h3>
        <ul className="c-proof c-quests">
          {SIDE_QUESTS.map(q => <li key={q.name}><Mag href={q.href} external={q.external}>{q.name}</Mag><span>{q.note}</span></li>)}
        </ul>
      </section>
    </main>

    <footer className="c-sec c-foot" data-beat="contact" aria-labelledby="c-hello">
      <Hour id="contact" />
      <h2 id="c-hello">Say hello</h2>
      <ul className="c-proof c-contact">
        {CONTACT.map((c, i) => <li key={c.name}>
          <Mag href={c.href} external={c.external}>{c.name}</Mag>
          {i === 0
            ? <span className="c-copy-wrap"><button className="c-copy" onClick={copy}>Copy</button><span className={`c-toast${copied !== 'no' ? ' is-on' : ''}`} role="status">{copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Couldn’t copy it' : ''}</span></span>
            : <span>{c.note}</span>}
        </li>)}
      </ul>
      <p className="c-sign">{SIGN}</p>
      <p className="c-water-hint" aria-hidden="true">{lite ? 'Tap the water.' : 'Click the water.'}</p>
    </footer>

    <div ref={dial} className="c-dial" role="slider" tabIndex={0} aria-label="Time of day" aria-valuemin={beats[0].D} aria-valuemax={1}
      onPointerDown={dialDown} onPointerMove={dialMove} onPointerUp={dialUp} onPointerCancel={dialUp} onKeyDown={dialKey}>
      <svg viewBox="0 0 140 80" aria-hidden="true">
        <path d="M14 66 A56 56 0 0 1 126 66" className="c-dial__arc" />
        <line x1="4" y1="66" x2="136" y2="66" className="c-dial__sea" />
        {beats.map(b => { const a = Math.PI * (1 - b.D); return <Fragment key={b.id}><circle cx={70 + 56 * Math.cos(a)} cy={66 - 56 * Math.sin(a)} r="1.6" className="c-dial__tick" /></Fragment>; })}
        <g ref={knob}><circle r="9" className="c-dial__glow" /><circle r="5.5" className="c-dial__sun" /></g>
      </svg>
      <span className="c-dial__read"><span ref={dialTime} className="c-dial__time">{beats[0].clock}</span><span ref={dialWhat} className="c-dial__what">{beats[0].label}</span></span>
    </div>
  </div>;
}
