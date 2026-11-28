import { useEffect, useRef, useState } from 'react';
import { Arrow } from './Chrome';
import { LOUPE } from './copy';
import { reduced } from './feel';
import { nn, WORK } from './work';

/* The work as a fly-through. The section is tall and its stage stays pinned while it passes, so scrolling pulls each
   project out of the dark to the front, holds it there a beat, then flies it past you. The cards are plain HTML in
   3D, so each one stays a real link with a real picture, and the picture can grow into its page when it opens
   (navigate.ts). The big name, the count and the line follow whichever card is in front.

   Under reduced motion, or without layout (tests), it's a plain list of the same cards. */

const N = WORK.length;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inout = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export default function Reel() {
  const track = useRef<HTMLDivElement>(null), cards = useRef<(HTMLElement | null)[]>([]), bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [still, setStill] = useState(true);

  useEffect(() => {
    if (reduced() || /jsdom/i.test(navigator.userAgent)) return;
    setStill(false);
  }, []);

  useEffect(() => {
    if (still) return;
    const el = track.current!;
    let raf = 0, cur = 0, shown = -1, alive = true;
    const wide = () => innerWidth > 760;

    const target = () => {
      const r = el.getBoundingClientRect(), span = r.height - innerHeight;
      const p = clamp(-r.top / Math.max(1, span));
      const raw = p * (N - 1 + 0.6) - 0.3;
      const k = Math.floor(raw), f = raw - k;
      return clamp(k + inout(clamp((f - 0.42) / 0.58)), 0, N - 1);
    };

    const place = () => {
      const w = wide();
      cards.current.forEach((c, i) => {
        if (!c) return;
        const rel = i - cur;
        if (rel < -0.7 || rel > 4.6) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = 'visible';
        let x, y, z, ry, op, veil;
        if (rel < 0) {
          // Flying past: toward you, down a little, fading out fast.
          x = rel * (w ? -60 : -20); y = -rel * (w ? 80 : 50); z = -rel * 900; ry = rel * 6; op = clamp(1 + rel * 1.6); veil = 0;
        } else {
          // Waiting: further back, up and off to the right, dimmer the further back it is.
          x = rel * (w ? 250 : 34); y = -rel * (w ? 74 : 52); z = -rel * (w ? 620 : 440); ry = -rel * (w ? 9 : 3); op = clamp(1.3 - rel * 0.3); veil = clamp(rel * 0.34, 0, 0.8);
        }
        c.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg)`;
        c.style.opacity = String(op);
        c.style.zIndex = String(rel < 0 ? 200 : 100 - Math.round(rel * 10));
        c.style.setProperty('--veil', veil.toFixed(3));
        c.style.pointerEvents = Math.abs(rel) < 0.35 ? 'auto' : 'none';
      });
      const now = Math.round(cur);
      if (now !== shown) { shown = now; setActive(now); }
      if (bar.current) bar.current.style.transform = `scaleX(${(cur / (N - 1)).toFixed(4)})`;
    };

    const tick = () => {
      raf = 0;
      if (!alive) return;
      const t = target();
      cur += (t - cur) * 0.14;
      if (Math.abs(t - cur) < 0.0008) cur = t;
      place();
      if (cur !== t) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    cur = target();
    place();
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('scroll', kick); removeEventListener('resize', kick); };
  }, [still]);

  /** Jumps the page to the spot where card i is in front (the ticks along the bottom, and keyboard focus). */
  const goTo = (i: number, smoothly = true) => {
    const el = track.current;
    if (!el) return;
    const span = el.offsetHeight - innerHeight;
    const p = (i + 0.3 + 0.21) / (N - 1 + 0.6);
    const top = el.getBoundingClientRect().top + scrollY + clamp(p) * span;
    window.scrollTo({ top, behavior: smoothly && !reduced() ? 'smooth' : 'auto' });
  };

  const w = WORK[active];
  return <section id="work" className={still ? 'lp-reel still' : 'lp-reel'} aria-labelledby="lp-work">
    <div className="lp-reel-track" ref={track} style={{ ['--n' as string]: N }}>
      <div className="lp-reel-stage">
        <div className="lp-reel-head">
          <h2 id="lp-work" className="lp-label">{LOUPE.work.title}</h2>
          <p className="lp-count" aria-hidden="true"><span className="lp-roll" key={active}>{nn(active)}</span><span className="of">/ {nn(N - 1)}</span></p>
        </div>

        <ol className="lp-reel-space">
          {WORK.map((p, i) => {
            const inner = <>
              <span className="lp-card-img"><img src={p.img} alt={p.alt} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" data-handover={p.href ? p.id : undefined} /></span>
              <span className="lp-card-veil" aria-hidden="true" />
              <span className="lp-card-tag" aria-hidden="true"><span>{nn(i)}</span><span>{p.kind}</span></span>
            </>;
            return <li key={p.id} className={i === active ? 'lp-card on' : 'lp-card'} ref={el => { cards.current[i] = el; }}>
              {p.href
                ? <a href={p.href} className="lp-card-a" data-cursor="view" onFocus={() => { if (!still) goTo(i, false); }} aria-label={`${p.name}, ${p.kind}. ${p.line}`}>{inner}</a>
                : <div className="lp-card-a" tabIndex={0} onFocus={() => { if (!still) goTo(i, false); }} aria-label={`${p.name}, ${p.kind}, ${p.status}. ${p.line}`}>{inner}</div>}
              {still && <div className="lp-still-copy"><h3>{p.name}</h3><p>{p.line}</p><p className="lp-mono-s">{p.kind} · {p.status}</p></div>}
            </li>;
          })}
        </ol>

        {!still && <div className="lp-reel-names" aria-hidden="true">
          {WORK.map((p, i) => <p key={p.id} className={i === active ? 'nm on' : i < active ? 'nm was' : 'nm'}>
            {[...p.name].map((ch, j) => <span key={j} style={{ ['--i' as string]: j }}>{ch === ' ' ? '\u00a0' : ch}</span>)}
          </p>)}
        </div>}
        {!still && <div className="lp-reel-line" key={active} aria-hidden="true">
          <p className="lp-mono-s"><span>{w.kind}</span><span>{w.status}</span><span>{w.year}</span></p>
          <p className="ln">{w.line}</p>
          {w.href && <a href={w.href} className="lp-pill" tabIndex={-1} data-cursor="view"><span>Read the story</span><Arrow dir="e" /></a>}
        </div>}

        {!still && <div className="lp-ticks" aria-hidden="true">
          <span className="lp-ticks-bar"><span ref={bar} /></span>
          {WORK.map((p, i) => <button key={p.id} type="button" tabIndex={-1} className={i === active ? 'on' : undefined} onClick={() => goTo(i)} title={p.name}><i /></button>)}
        </div>}
      </div>
    </div>
  </section>;
}
