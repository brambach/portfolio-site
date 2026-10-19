import { useEffect, useRef, type CSSProperties } from 'react';
import { WORK } from '../content';
import { PortTile } from './tactile';

/* The work, as three cards on a table. Pick one up and it lifts; drag it and it swings with the pull; let go and it
   slides on with what speed you gave it, nudging the others out of the way, and comes to rest at a new angle. A
   quick press (or tap) opens the project. Pointing at a card tilts it toward you. "Tidy up" springs them back.

   On a touchscreen a sideways drag, or a short hold then any drag, picks a card up; a plain vertical swipe still
   scrolls the page. Keyboard users get a plain link in each card. With reduced motion it's a tidy row. */

const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

type Body = {
  el: HTMLElement; x: number; y: number; vx: number; vy: number; r: number; vr: number; rTo: number;
  lift: number; vl: number; tx: number; ty: number; vtx: number; vty: number; tiltX: number; tiltY: number;
  home: boolean; held: boolean; waiting: boolean; w: number; h: number;
};

const REST = [
  { x: 0.02, y: 0.1, r: -4.5 }, { x: 0.35, y: 0.0, r: 2.5 }, { x: 0.68, y: 0.14, r: -2 },
];
const REST_NARROW = [
  { x: 0.02, y: 0.0, r: -3 }, { x: 0.16, y: 0.335, r: 3 }, { x: 0.05, y: 0.665, r: -2 },
];

export function Table({ still }: { still: boolean }) {
  const table = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  const api = useRef<{ tidy: () => void } | null>(null);

  useEffect(() => {
    const host = table.current;
    if (!host || still) return;
    const narrowNow = () => host.clientWidth < 700;
    const bodies: Body[] = cards.current.map(el => ({
      el, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, rTo: 0, lift: 0, vl: 0, tx: 0, ty: 0, vtx: 0, vty: 0, tiltX: 0, tiltY: 0,
      home: true, held: false, waiting: true, w: el.offsetWidth, h: el.offsetHeight,
    }));
    let z = 3;
    const rest = (i: number) => {
      const spots = narrowNow() ? REST_NARROW : REST, s = spots[i], b = bodies[i];
      return { x: s.x * host.clientWidth, y: s.y * Math.max(0, host.clientHeight - b.h * (narrowNow() ? 0 : 1)) + (narrowNow() ? 0 : 20), r: s.r };
    };
    // Before they're seen the cards hang above the table, so the first look drops them onto it.
    bodies.forEach((b, i) => { const p = rest(i); b.x = p.x + (i - 1) * 30; b.y = p.y - 160 - i * 40; b.r = p.r * 3 + (i - 1) * 8; b.rTo = p.r; b.lift = 1; b.el.style.opacity = '0'; });

    let raf = 0, last = 0, dropped = false;
    const k = (s: number, c: number, x: number, v: number, to: number, dt: number) => v + (-s * (x - to) - c * v) * dt;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - (last || now)) / 1000); last = now;
      const W = host.clientWidth, H = host.clientHeight;
      let busy = false;
      bodies.forEach((b, i) => {
        if (b.waiting) return;
        if (!b.held) {
          if (b.home) {
            const p = rest(i);
            b.vx = k(70, 13, b.x, b.vx, p.x, dt); b.vy = k(70, 13, b.y, b.vy, p.y, dt);
            b.rTo = p.r;
          } else {
            const f = Math.exp(-dt * 4.2);
            b.vx *= f; b.vy *= f;
          }
          b.x += b.vx * dt; b.y += b.vy * dt;
          // The table's edges: a soft bounce back in.
          const maxX = W - b.w * 0.75, minX = -b.w * 0.25, maxY = H - b.h * 0.6, minY = -b.h * 0.1;
          if (!b.home) {
            if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.45; }
            if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.45; }
            if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.45; }
            if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.45; }
          }
        }
        // Rotation: swings with the drag, settles at its resting angle.
        const swing = b.held ? Math.max(-12, Math.min(12, b.vx * 0.012)) : 0;
        b.vr = k(120, 13, b.r, b.vr, b.rTo + swing, dt); b.r += b.vr * dt;
        b.vl = k(200, 20, b.lift, b.vl, b.held ? 1 : 0, dt); b.lift += b.vl * dt;
        b.vtx = k(170, 18, b.tx, b.vtx, b.held ? 0 : b.tiltX, dt); b.tx += b.vtx * dt;
        b.vty = k(170, 18, b.ty, b.vty, b.held ? 0 : b.tiltY, dt); b.ty += b.vty * dt;
        const moving = Math.hypot(b.vx, b.vy) > 2 || Math.abs(b.vr) > 0.05 || Math.abs(b.vl) > 0.002 || Math.abs(b.lift - (b.held ? 1 : 0)) > 0.002
          || Math.abs(b.vtx) > 0.02 || Math.abs(b.vty) > 0.02 || Math.abs(b.tx - b.tiltX) > 0.05 || Math.abs(b.ty - b.tiltY) > 0.05
          || (b.home && (Math.abs(b.x - rest(i).x) > 0.5 || Math.abs(b.y - rest(i).y) > 0.5));
        if (moving || b.held) busy = true;
      });
      // Cards that slide into each other push apart, gently.
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        if ((a.home && b.home) || a.waiting || b.waiting) continue;
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2), d = Math.hypot(dx, dy) || 1, min = a.w * 0.55;
        if (d < min && (Math.hypot(a.vx, a.vy) > 30 || Math.hypot(b.vx, b.vy) > 30 || a.held || b.held)) {
          const push = (min - d) * 6 * dt, ux = dx / d, uy = dy / d;
          if (!a.held) { a.vx -= ux * push * 40; a.vy -= uy * push * 40; }
          if (!b.held) { b.vx += ux * push * 40; b.vy += uy * push * 40; }
          busy = true;
        }
      }
      bodies.forEach(b => {
        b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) perspective(1000px) rotate(${b.r.toFixed(2)}deg) rotateX(${b.tx.toFixed(2)}deg) rotateY(${b.ty.toFixed(2)}deg) scale(${(1 + 0.045 * b.lift).toFixed(4)})`;
        b.el.style.setProperty('--lift', Math.max(0, b.lift).toFixed(3));
      });
      if (busy) raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const toTop = (b: Body) => { b.el.style.zIndex = String(++z); };

    // The first time the table comes into view, the cards drop onto it one after another.
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || dropped) return;
      dropped = true; io.disconnect();
      bodies.forEach((b, i) => window.setTimeout(() => {
        b.el.style.opacity = '1'; b.el.style.transition = 'opacity 0.25s ease-out';
        b.waiting = false; b.vy = 260; b.lift = 1; wake();
      }, i * 140));
    }, { threshold: 0.25 });
    io.observe(host);

    // ---- picking up -------------------------------------------------------------------------------------
    const interactive = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('a, button');
    const open = (b: Body) => { const a = b.el.querySelector<HTMLAnchorElement>('a.c-card__open'); if (a) location.href = a.href; };
    type Grab = { b: Body; ox: number; oy: number; sx: number; sy: number; t0: number; px: number; py: number; pt: number; moved: boolean };
    let grab: Grab | null = null;
    const hostXY = (cx: number, cy: number) => { const r = host.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top }; };
    const begin = (b: Body, cx: number, cy: number) => {
      const p = hostXY(cx, cy);
      grab = { b, ox: p.x - b.x, oy: p.y - b.y, sx: cx, sy: cy, t0: performance.now(), px: cx, py: cy, pt: performance.now(), moved: false };
      b.held = true; b.home = false; b.vx = b.vy = 0; b.tiltX = b.tiltY = 0; toTop(b); host.classList.add('is-holding'); wake();
    };
    const follow = (cx: number, cy: number) => {
      if (!grab) return;
      const g = grab, now = performance.now(), p = hostXY(cx, cy), dt = Math.max(8, now - g.pt) / 1000;
      if (Math.hypot(cx - g.sx, cy - g.sy) > 6) g.moved = true;
      // Velocity from the last few moves, smoothed, for the throw.
      g.b.vx = g.b.vx * 0.6 + ((cx - g.px) / dt) * 0.4; g.b.vy = g.b.vy * 0.6 + ((cy - g.py) / dt) * 0.4;
      g.px = cx; g.py = cy; g.pt = now;
      g.b.x = p.x - g.ox; g.b.y = p.y - g.oy;
      wake();
    };
    const end = () => {
      if (!grab) return;
      const g = grab, b = g.b;
      grab = null; b.held = false; host.classList.remove('is-holding');
      if (performance.now() - g.pt > 90) { b.vx = 0; b.vy = 0; }
      const tap = !g.moved && performance.now() - g.t0 < 400;
      if (tap) { b.home = true; open(b); return; }
      b.rTo = Math.max(-14, Math.min(14, b.r + b.vx * 0.004));
      wake();
    };

    // Mouse and pen.
    const pdown = (e: PointerEvent, b: Body) => {
      if (e.pointerType === 'touch' || e.button !== 0 || interactive(e.target)) return;
      e.preventDefault();
      begin(b, e.clientX, e.clientY);
      const move = (ev: PointerEvent) => follow(ev.clientX, ev.clientY);
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); end(); };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    };
    const hover = (e: PointerEvent, b: Body) => {
      if (e.pointerType !== 'mouse' || b.held || grab) return;
      const r = b.el.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      b.tiltY = (u - 0.5) * 14; b.tiltX = -(v - 0.5) * 10;
      b.el.style.setProperty('--gx', `${(u * 100).toFixed(1)}%`); b.el.style.setProperty('--gy', `${(v * 100).toFixed(1)}%`);
      wake();
    };
    const unhover = (b: Body) => { b.tiltX = b.tiltY = 0; wake(); };

    // Touch: sideways intent or a short hold picks the card up; anything else is a scroll.
    let touch: { b: Body; sx: number; sy: number; t0: number; timer: number; live: boolean; gone: boolean } | null = null;
    const tstart = (e: TouchEvent, b: Body) => {
      if (e.touches.length > 1 || interactive(e.target)) return;
      const t = e.touches[0];
      const st = { b, sx: t.clientX, sy: t.clientY, t0: performance.now(), timer: 0, live: false, gone: false };
      st.timer = window.setTimeout(() => { if (!st.gone && touch === st) { st.live = true; begin(b, st.sx, st.sy); navigator.vibrate?.(8); } }, 260);
      touch = st;
    };
    const tmove = (e: TouchEvent) => {
      const st = touch;
      if (!st || st.gone) return;
      const t = e.touches[0], dx = t.clientX - st.sx, dy = t.clientY - st.sy;
      if (!st.live) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { clearTimeout(st.timer); st.live = true; begin(st.b, st.sx, st.sy); }
        else if (Math.abs(dy) > 10) { clearTimeout(st.timer); st.gone = true; return; }
        else return;
      }
      e.preventDefault();
      follow(t.clientX, t.clientY);
    };
    const tend = (e: TouchEvent) => {
      const st = touch;
      touch = null;
      if (!st) return;
      clearTimeout(st.timer);
      if (st.live) { e.preventDefault(); end(); return; }
      if (!st.gone && performance.now() - st.t0 < 300 && !interactive(e.target)) { e.preventDefault(); open(st.b); }
    };

    const offs: (() => void)[] = [];
    bodies.forEach(b => {
      const d = (e: PointerEvent) => pdown(e, b), h = (e: PointerEvent) => hover(e, b), l = () => unhover(b), ts = (e: TouchEvent) => tstart(e, b);
      b.el.addEventListener('pointerdown', d); b.el.addEventListener('pointermove', h); b.el.addEventListener('pointerleave', l);
      b.el.addEventListener('touchstart', ts, { passive: true });
      b.el.addEventListener('touchmove', tmove, { passive: false });
      b.el.addEventListener('touchend', tend, { passive: false });
      b.el.addEventListener('touchcancel', tend, { passive: false });
      b.el.addEventListener('dragstart', e => e.preventDefault());
      offs.push(() => {
        b.el.removeEventListener('pointerdown', d); b.el.removeEventListener('pointermove', h); b.el.removeEventListener('pointerleave', l);
        b.el.removeEventListener('touchstart', ts); b.el.removeEventListener('touchmove', tmove); b.el.removeEventListener('touchend', tend); b.el.removeEventListener('touchcancel', tend);
      });
    });
    const ro = new ResizeObserver(() => { bodies.forEach(b => { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; }); wake(); });
    ro.observe(host);
    api.current = { tidy: () => { bodies.forEach(b => { b.home = true; }); wake(); } };
    wake();
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); offs.forEach(f => f()); api.current = null; };
  }, [still]);

  return <div className="c-work">
    <div ref={table} className={`c-table${still ? ' is-grid' : ''}`}>
      {WORK.map((work, i) => <article key={work.id} ref={el => { if (el) cards.current[i] = el; }} className={`c-card${work.hero.tall ? ' is-tall' : ''}`} data-card={work.id} style={{ zIndex: 3 - i } as CSSProperties}>
        <div className="c-card__pic">
          {work.hero.port ? <PortTile /> : <img src={work.hero.src} alt={`${work.name}: ${work.hero.title ?? ''}`} draggable={false} loading="lazy" decoding="async" />}
          <i className="c-card__glare" aria-hidden="true" />
        </div>
        <div className="c-card__body">
          <span className="c-card__kind">{work.kind}</span>
          <h3>{work.name}</h3>
          <p>{work.line}</p>
          <small>{work.status}</small>
          <a className="c-card__open" href={`/projects/${work.id}`}>Open {work.name} <span aria-hidden="true">→</span></a>
        </div>
      </article>)}
    </div>
    {!still && <p className="c-work__how"><span>{coarse() ? 'Drag a card sideways, or hold it, to pick it up. A tap opens it.' : 'Pick a card up and throw it. A quick click opens it.'}</span><button onClick={() => api.current?.tidy()}>Tidy up</button></p>}
  </div>;
}
