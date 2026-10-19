import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { TAGLINE, TAGLINE_PARTS } from '../content';
import { SNAP, resting, spring, step, type Spring } from './spring';

/* The small touchable pieces of Direction C: the tagline whose letters hang on springs, links that lean toward the
   pointer, a picture you pull down like a blind, and Port's ring. */

const fine = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---- the tagline ------------------------------------------------------------------------------------------
/** The tagline, one beat per line. Each letter drops in on load and settles; after that the pointer (or a finger
 *  swiped across it) pushes the letters out of the way and they swing back. */
export function Tagline({ still }: { still: boolean }) {
  const host = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el || still) return;
    const chars = [...el.querySelectorAll<HTMLElement>('[data-ch]')];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const L = chars.map((ch, i) => {
      const x = spring(rand(-14, 14)), y = spring(rand(-150, -80)), r = spring(rand(-28, 28));
      x.to = 0; y.to = 0; r.to = 0;
      return { ch, cx: 0, cy: 0, x, y, r, delay: 180 + i * 24 + rand(0, 40), shown: 0 };
    });
    const measure = () => {
      L.forEach(l => { l.ch.style.transform = 'none'; });
      L.forEach(l => { const b = l.ch.getBoundingClientRect(); l.cx = b.left + b.width / 2; l.cy = b.top + b.height / 2 + scrollY; });
      wake();
    };
    const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, at: -1e9 };
    const reach = () => (innerWidth < 760 ? 90 : 150);
    let raf = 0, last = 0;
    const t0 = performance.now();
    const feel = { k: 230, c: 13 }, turn = { k: 170, c: 11 };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const t = now - t0, R = reach(), near = now - ptr.at < 1200;
      let busy = near;
      for (const l of L) {
        if (t < l.delay) { busy = true; continue; }
        if (l.shown < 1) { l.shown = Math.min(1, (t - l.delay) / 200); l.ch.style.opacity = l.shown.toFixed(3); busy = true; }
        let tx = 0, ty = 0, tr = 0;
        if (near) {
          const dx = l.cx - ptr.x, dy = l.cy - scrollY - ptr.y, d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            const m = (1 - d / R) ** 2 * 46;
            tx = (dx / d) * m; ty = (dy / d) * m; tr = (dx / d) * m * 0.45;
          }
        }
        l.x.to = tx; l.y.to = ty; l.r.to = tr;
        step(l.x, dt, feel); step(l.y, dt, feel); step(l.r, dt, turn);
        l.ch.style.transform = `translate3d(${l.x.x.toFixed(2)}px, ${l.y.x.toFixed(2)}px, 0) rotate(${l.r.x.toFixed(2)}deg)`;
        if (!resting(l.x, 0.05) || !resting(l.y, 0.05) || !resting(l.r, 0.05)) busy = true;
      }
      if (busy) raf = requestAnimationFrame(frame); else last = 0;
    };
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    const move = (e: PointerEvent) => {
      const now = performance.now(), dt = Math.max(8, now - ptr.at);
      if (now - ptr.at < 100) { ptr.vx = (e.clientX - ptr.x) / dt; ptr.vy = (e.clientY - ptr.y) / dt; } else { ptr.vx = ptr.vy = 0; }
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = now;
      // A fast pass flicks the letters it crosses.
      const R = reach();
      for (const l of L) {
        const d = Math.hypot(l.cx - ptr.x, l.cy - scrollY - ptr.y);
        if (d < R * 0.6) { const f = 1 - d / (R * 0.6); l.x.v += ptr.vx * 260 * f; l.y.v += ptr.vy * 260 * f; l.r.v += ptr.vx * 180 * f; }
      }
      wake();
    };
    const zone = el.closest('header') ?? el;
    zone.addEventListener('pointermove', move as EventListener, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    measure();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); zone.removeEventListener('pointermove', move as EventListener); };
  }, [still]);

  let k = 0;
  return <h1 ref={host} className={`c-tag${still ? ' is-still' : ''}`}>
    <span className="lab-sr">{TAGLINE}</span>
    <span aria-hidden="true">
      {TAGLINE_PARTS.map(part => <span key={part} className="c-tag__line">
        {part.split(' ').map((word, w) => <span key={w} className="c-tag__word">
          {[...word].map(ch => <span key={k++} data-ch className="c-ch">{ch}</span>)}
        </span>).flatMap((w, i) => i ? [' ', w] : [w])}
      </span>)}
    </span>
  </h1>;
}

// ---- links that lean toward you --------------------------------------------------------------------------
/** A link that leans toward the pointer while it's near, and springs back when it leaves. */
export function Mag({ href, children, external, className = '' }: { href: string; children: ReactNode; external?: boolean; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !fine() || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const x = spring(), y = spring();
    let raf = 0, last = 0;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      step(x, dt, SNAP); step(y, dt, SNAP);
      el.style.translate = `${x.x.toFixed(2)}px ${y.x.toFixed(2)}px`;
      if (!resting(x, 0.02) || !resting(y, 0.02)) raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      x.to = Math.max(-10, Math.min(10, (e.clientX - (b.left + b.width / 2)) * 0.18));
      y.to = Math.max(-6, Math.min(6, (e.clientY - (b.top + b.height / 2)) * 0.3));
      wake();
    };
    const leave = () => { x.to = 0; y.to = 0; wake(); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);
  return <a ref={ref} href={href} className={`c-link${external ? ' is-ext' : ''} ${className}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

// ---- a picture you pull down -----------------------------------------------------------------------------
/** A picture rolled up like a blind. Pull the cord down (or press it) and the picture unrolls; let go past a third
 *  of the way and it springs open, otherwise it springs shut. */
export function Pull({ id, src, alt, caption, tall, still }: { id: string; src: string; alt: string; caption?: string; tall?: boolean; still: boolean }) {
  const [open, setOpen] = useState(false);
  const [wanted, setWanted] = useState(false);
  const frameEl = useRef<HTMLDivElement>(null), pic = useRef<HTMLDivElement>(null);
  const h = useRef<Spring>(spring(0));
  const raf = useRef(0), last = useRef(0);
  const drag = useRef<{ y0: number; h0: number; moved: boolean; vy: number; t: number; y: number } | null>(null);
  const full = () => pic.current?.offsetHeight ?? 0;

  const paint = () => {
    const el = frameEl.current, f = full();
    if (!el) return;
    el.style.height = `${Math.max(0, h.current.x).toFixed(1)}px`;
    el.style.setProperty('--open', f ? Math.min(1.2, h.current.x / f).toFixed(3) : '0');
  };
  const run = (now: number) => {
    raf.current = 0;
    const dt = Math.min(0.05, (now - (last.current || now)) / 1000); last.current = now;
    step(h.current, dt, { k: 150, c: 15 });
    paint();
    if (!resting(h.current, 0.2)) raf.current = requestAnimationFrame(run); else { last.current = 0; h.current.x = h.current.to; paint(); }
  };
  const settle = (to: boolean) => {
    setOpen(to); setWanted(true);
    h.current.to = to ? full() : 0;
    if (still) { h.current.x = h.current.to; paint(); return; }
    if (!raf.current) raf.current = requestAnimationFrame(run);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (!pic.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (open && !drag.current) { h.current.to = h.current.x = full(); paint(); } });
    ro.observe(pic.current);
    return () => ro.disconnect();
  });

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || still) return;
    setWanted(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(raf.current); raf.current = 0;
    drag.current = { y0: e.clientY, h0: h.current.x, moved: false, vy: 0, t: performance.now(), y: e.clientY };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y0;
    if (Math.abs(dy) > 4) d.moved = true;
    const now = performance.now();
    d.vy = (e.clientY - d.y) / Math.max(8, now - d.t) * 1000; d.t = now; d.y = e.clientY;
    const f = full(), raw = d.h0 + dy;
    // Past either end it gets heavy, like a cord at the end of its travel.
    const v = raw < 0 ? raw * 0.25 : raw > f ? f + (raw - f) * 0.3 : raw;
    h.current.x = h.current.to = v; h.current.v = 0;
    paint();
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) { settle(!open); return; }
    h.current.v = d.vy;
    settle(d.vy > 500 ? true : d.vy < -500 ? false : h.current.x > full() * 0.34);
  };

  return <div className={`c-pull${open ? ' is-open' : ''}`}>
    <button className="c-pull__cord" aria-expanded={open} aria-controls={id}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onClick={e => { if (e.detail === 0 || still) settle(!open); }}>
      <span className="c-pull__knob" aria-hidden="true" />
      <span>{open ? 'Roll it back up' : 'Pull down for the picture'}</span>
    </button>
    <div ref={frameEl} className="c-pull__frame" id={id} role="region" aria-label={alt} aria-hidden={!open}>
      <div ref={pic} className={`c-pull__pic${tall ? ' is-tall' : ''}`}>
        <img src={wanted ? src : undefined} alt={alt} draggable={false} decoding="async" />
        {caption && <p>{caption}</p>}
      </div>
    </div>
  </div>;
}

// ---- Port's ring ------------------------------------------------------------------------------------------
/** Port's picture, as on the live project page: hold the ring for a second and the tile squeezes into a line and
 *  goes quiet. Enter or Space closes it straight away; press again to open. */
export function PortTile() {
  const [phase, setPhase] = useState<'open' | 'holding' | 'closing' | 'closed'>('open');
  const tile = useRef<HTMLDivElement>(null);
  const frame = useRef(0), timer = useRef(0);
  const setP = (v: number) => tile.current?.style.setProperty('--p', v.toFixed(3));
  useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(timer.current); }, []);
  const close = () => {
    cancelAnimationFrame(frame.current); setP(1); setPhase('closing');
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => setPhase('closed'), quick ? 0 : 1100);
  };
  const open = () => { cancelAnimationFrame(frame.current); clearTimeout(timer.current); setP(0); setPhase('open'); };
  const start = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (phase === 'closed') { open(); return; }
    if (phase !== 'open') return;
    setPhase('holding');
    const began = performance.now();
    const grow = (now: number) => {
      const v = Math.min(1, (now - began) / 1000);
      setP(v);
      if (v < 1) frame.current = requestAnimationFrame(grow); else close();
    };
    frame.current = requestAnimationFrame(grow);
  };
  const release = () => { if (phase === 'holding') { cancelAnimationFrame(frame.current); setP(0); setPhase('open'); } };
  const key = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.repeat) return;
    if (phase === 'closed') open(); else if (phase === 'open') close();
  };
  return <div ref={tile} className="c-port" data-phase={phase}>
    <div className="c-port__band">
      <button className="c-port__ring" onPointerDown={start} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
        onTouchStart={e => e.stopPropagation()} onKeyDown={key} onClick={e => e.preventDefault()}
        aria-label={phase === 'closed' ? 'Open Port' : 'Hold to close Port'} style={{ '--p': 0 } as CSSProperties}><i /></button>
      <span>{phase === 'holding' ? 'Keep holding' : 'Hold to close'}</span>
    </div>
    <span className="c-port__quiet" role="status">{phase === 'closed' ? 'Quiet.' : ''}</span>
  </div>;
}
