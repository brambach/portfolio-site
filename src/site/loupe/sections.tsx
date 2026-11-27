import { useEffect, useRef, useState, type ReactNode } from 'react';
import { A } from '../cobalt/parts';
import { Arrow, Logos } from './Chrome';
import { ABOUT, EMAIL, FOOTER, LOUPE, NAME, NOW, NUMBERS, OFF } from './copy';
import { finePointer, reduced } from './feel';
import { nn, WORK } from './work';

/* The home's sections below the hero and the reel. Each one moves once, as it arrives, and holds still under reduced
   motion. */

const testing = () => /jsdom/i.test(navigator.userAgent);

/** Adds "in" to an element the first time it's mostly on screen. */
export function useArrive<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') { setIn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** A line of big words that light up one by one as the page scrolls through them. */
export function Scrub({ text, className, as: Tag = 'p' }: { text: string; className?: string; as?: 'p' | 'h2' | 'blockquote' }) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(' ');
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || testing()) return;
    const spans = [...el.querySelectorAll<HTMLElement>('.w')];
    el.classList.add('scrub');
    let raf = 0, lit = -1;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.86 - r.top) / (r.height + vh * 0.36)));
      const n = Math.round(p * spans.length);
      if (n !== lit) { spans.forEach((s, i) => s.classList.toggle('lit', i < n)); lit = n; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    addEventListener('scroll', kick, { passive: true });
    return () => { removeEventListener('scroll', kick); cancelAnimationFrame(raf); };
  }, [text]);
  return <Tag ref={ref as never} className={className}>
    {words.map((w, i) => <span key={i} className="w">{w}{i < words.length - 1 ? ' ' : ''}</span>)}
  </Tag>;
}

export function Statement() {
  const [first, ...rest] = NOW.lead.split(/(?<=\.)\s+/);
  const [ref, inView] = useArrive<HTMLDivElement>(0.2);
  return <section className="lp-statement" aria-label="What I do">
    <div className="lp-wrap">
      <Scrub text={first} className="lp-big" />
      <div ref={ref} className={inView ? 'lp-statement-rest in' : 'lp-statement-rest'}>
        <p className="lp-mono-s lp-open">{LOUPE.open}</p>
        <p>{rest.join(' ')}</p>
      </div>
    </div>
  </section>;
}

/** Every project as a row. On a computer the picture follows the pointer down the list. */
export function Index() {
  const box = useRef<HTMLDivElement>(null), float = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, inView] = useArrive<HTMLElement>(0.1);

  useEffect(() => {
    const el = box.current, f = float.current;
    if (!el || !f || !finePointer() || testing()) return;
    let x = 0, y = 0, fx = 0, fy = 0, vx = 0, raf = 0, on = false;
    const still = reduced();
    const tick = () => {
      raf = 0;
      const dx = x - fx;
      fx += dx * (still ? 1 : 0.16); fy += (y - fy) * (still ? 1 : 0.16);
      vx = vx * 0.8 + dx * 0.2;
      f.style.transform = `translate3d(${fx}px, ${fy}px, 0) translate(-50%, -50%) rotate(${Math.max(-10, Math.min(10, vx * 0.12)).toFixed(2)}deg)`;
      if (on && (Math.abs(dx) > 0.1 || Math.abs(vx) > 0.05)) raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
      if (!on) { on = true; fx = x; fy = y; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => { on = false; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, []);

  return <section className={inView ? 'lp-index in' : 'lp-index'} ref={ref} aria-labelledby="lp-index">
    <div className="lp-wrap">
      <div className="lp-sec"><h2 id="lp-index" className="lp-label">{LOUPE.index.title}</h2><span className="lp-label">{WORK.length}</span></div>
      <div className="lp-index-box" ref={box} onPointerLeave={() => setHover(null)}>
        <div className={hover === null ? 'lp-float' : 'lp-float on'} ref={float} aria-hidden="true">
          {WORK.map((w, i) => <img key={w.id} src={w.img} alt="" loading="lazy" decoding="async" className={hover === i ? 'on' : undefined} />)}
        </div>
        <ul className="lp-rows">
          {WORK.map((w, i) => {
            const body = <>
              <span className="n lp-mono-s">{nn(i)}</span>
              <span className="th" aria-hidden="true"><img src={w.img} alt="" loading="lazy" decoding="async" /></span>
              <span className="nm">{w.name}</span>
              <span className="kd">{w.kind}</span>
              <span className="st lp-mono-s">{w.status}</span>
              <span className="go" aria-hidden="true">{w.href ? <Arrow dir="e" /> : null}</span>
            </>;
            return <li key={w.id} style={{ ['--i' as string]: i }} onPointerEnter={() => setHover(i)}>
              {w.href ? <a href={w.href} className="row" data-cursor="view">{body}</a> : <div className="row">{body}</div>}
            </li>;
          })}
        </ul>
      </div>
    </div>
  </section>;
}

/** A number whose digits roll into place like an odometer the first time it's seen. */
export function Odometer({ value, go }: { value: string; go: boolean }) {
  let d = 0;
  return <span className={go ? 'lp-odo go' : 'lp-odo'} aria-hidden="true">
    {[...value].map((ch, i) => {
      if (!/\d/.test(ch)) return <span key={i} className="sep">{ch}</span>;
      const n = Number(ch), k = d++;
      return <span key={i} className="col" style={{ ['--n' as string]: n, ['--k' as string]: k }}>
        <span className="strip">{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => <span key={x}>{x}</span>)}{/* a full turn first, then the digit */}{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => <span key={`b${x}`}>{x}</span>)}</span>
      </span>;
    })}
  </span>;
}

export function Numbers() {
  const [ref, inView] = useArrive<HTMLElement>(0.3);
  return <section className={inView ? 'lp-numbers in' : 'lp-numbers'} ref={ref} aria-labelledby="lp-num">
    <div className="lp-wrap">
      <div className="lp-sec"><h2 id="lp-num" className="lp-label">{LOUPE.numbers.title}</h2></div>
      <ul className="lp-num-grid">
        {NUMBERS.map((x, i) => {
          const shown = x.n.toLocaleString('en-US');
          return <li key={x.k} style={{ ['--i' as string]: i }}>
            <a href={x.href} className="cell">
              <span className="big"><Odometer value={shown} go={inView} />{x.plus && <span className="plus">+</span>}{x.unit && <span className="unit">{x.unit}</span>}</span>
              <span className="lp-vh">{shown}{x.plus ? '+' : ''}{x.unit ? ` ${x.unit}` : ''}</span>
              <span className="k">{x.k}</span>
            </a>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}

const ICON: Record<(typeof OFF)[number]['k'], ReactNode> = {
  run: <><path d="M4 17.5c3 .6 5.5-.2 7.2-2.6L14 11l3.2 1.6c1 .5 2.1.7 2.8.4" /><path d="M4 20.5h16" /><path d="M10.5 9.5L13 7l3 1" /><circle cx="15.5" cy="4.5" r="1.5" /></>,
  tennis: <><circle cx="12" cy="12" r="8" /><path d="M6.4 6.4c3 2.5 3 8.7 0 11.2M17.6 6.4c-3 2.5-3 8.7 0 11.2" /></>,
  coffee: <><path d="M4.5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2a4.5 4.5 0 0 1-4.5-4.5z" /><path d="M15.5 10.5h1.5a2.5 2.5 0 0 1 0 5h-1.6" /><path d="M8 3.5c-.8 1 .8 2-.1 3M11.5 3.5c-.8 1 .8 2-.1 3" /></>,
  car: <><path d="M3 15.5v-2.2c0-.8.5-1.5 1.2-1.8l2.6-1c1-1.7 2.8-3 5-3h1.4c2.3 0 4.3 1.3 5.3 3.4l1.3.5c.8.3 1.2 1 1.2 1.8v2.3" /><circle cx="7" cy="16" r="2" /><circle cx="17" cy="16" r="2" /><path d="M9 16h6" /></>,
  board: <><path d="M5.5 18.5L18.5 5.5" strokeWidth="3.2" /><path d="M8 13.5l2.5 2.5M13.5 8l2.5 2.5" /></>,
};

/** The portrait sits under a dot screen, and the pointer carries a small lens that shows the photo through it. */
export function About() {
  const pic = useRef<HTMLDivElement>(null);
  const [ref, inView] = useArrive<HTMLElement>(0.2);
  useEffect(() => {
    const el = pic.current;
    if (!el || !finePointer()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    const enter = () => el.classList.add('look'), leave = () => el.classList.remove('look');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); };
  }, []);
  return <section id="about" className={inView ? 'lp-about in' : 'lp-about'} ref={ref} aria-labelledby="lp-about">
    <div className="lp-wrap lp-about-grid">
      <div className="lp-sec"><h2 id="lp-about" className="lp-label">{ABOUT.title}</h2></div>
      <div className="lp-portrait" ref={pic} data-cursor="lens">
        <img className="base" src="/home/headshot.webp" alt={`${NAME}, smiling, in a dark green polo`} width={480} height={480} loading="lazy" decoding="async" />
        <img className="clear" src="/home/headshot.webp" alt="" aria-hidden="true" width={480} height={480} loading="lazy" decoding="async" />
        <span className="ring" aria-hidden="true" />
      </div>
      <div className="lp-about-text">
        <p className="lead">{ABOUT.body[0]}</p>
        {ABOUT.body.slice(1).map(p => <p key={p}>{p}</p>)}
        <div className="lp-off">
          <p className="lp-label">{LOUPE.off}</p>
          <ul>
            {OFF.map((o, i) => <li key={o.k} style={{ ['--i' as string]: i }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICON[o.k]}</svg><span>{o.label}</span>
            </li>)}
          </ul>
        </div>
      </div>
    </div>
  </section>;
}

/** The letters of the name along the very bottom thicken toward the pointer, and breathe on their own on a phone. */
function Wordmark() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || testing()) return;
    const letters = [...el.querySelectorAll<HTMLElement>('span')];
    const fine = finePointer();
    let px = -1e4, raf = 0, visible = false;
    const cur = letters.map(() => 300);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(el);
    const tick = (t: number) => {
      raf = 0;
      if (!visible) return;
      const r = el.getBoundingClientRect();
      let moving = false;
      letters.forEach((s, i) => {
        const b = s.getBoundingClientRect(), cx = b.left + b.width / 2;
        const want = fine
          ? 200 + 700 * Math.exp(-Math.pow((cx - px) / (r.width * 0.11), 2))
          : 200 + 700 * (0.5 + 0.5 * Math.sin(t / 900 - i * 0.55)) ** 3;
        cur[i] += (want - cur[i]) * 0.12;
        if (Math.abs(want - cur[i]) > 0.5) moving = true;
        s.style.fontVariationSettings = `"wght" ${cur[i].toFixed(1)}`;
      });
      if (moving || !fine) raf = requestAnimationFrame(tick);
    };
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    const move = (e: PointerEvent) => { px = e.clientX; kick(); };
    if (fine) addEventListener('pointermove', move, { passive: true });
    return () => { io.disconnect(); removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return <div className="lp-word" ref={ref} aria-hidden="true">
    {[...NAME.toUpperCase()].map((ch, i) => <span key={i}>{ch === ' ' ? ' ' : ch}</span>)}
  </div>;
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const mail = useRef<HTMLAnchorElement>(null);
  const [ref, inView] = useArrive<HTMLElement>(0.2);

  // The address leans toward the pointer when it comes close.
  useEffect(() => {
    const el = mail.current;
    if (!el || !finePointer() || reduced()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, reach = Math.max(r.width, 260) * 0.75;
      const k = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
      el.style.transform = `translate3d(${(dx * 0.12 * k).toFixed(2)}px, ${(dy * 0.22 * k).toFixed(2)}px, 0)`;
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.location.href = `mailto:${EMAIL}`; }
  };

  return <footer id="contact" className={inView ? 'lp-contact in' : 'lp-contact'} ref={ref} aria-labelledby="lp-hello">
    <div className="lp-wrap">
      <h2 id="lp-hello" className="lp-hello">{[...LOUPE.hello].map((ch, i) => <span key={i} style={{ ['--i' as string]: i }}>{ch === ' ' ? ' ' : ch}</span>)}</h2>
      <div className="lp-mailrow">
        <a ref={mail} className="lp-mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <button type="button" className={copied ? 'lp-copy done' : 'lp-copy'} onClick={copy} aria-live="polite" title={LOUPE.copy}>
          {copied
            ? <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg><span className="lp-vh">{LOUPE.copied}</span></>
            : <><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></svg><span className="lp-vh">{LOUPE.copy}</span></>}
        </button>
      </div>
      <Logos />
      <div className="lp-fine">
        <p>{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<A href={l.href}>{l.label}</A></span>)}</p>
        <p>{LOUPE.sign}</p>
        <a href="#top" className="lp-totop"><Arrow dir="n" /><span>{LOUPE.top}</span></a>
      </div>
    </div>
    <Wordmark />
  </footer>;
}
