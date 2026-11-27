import { Creature, type Env, type Floor } from './creature';
import { INK, Pen, clamp, grain, line, noise, rand, stroke, type Pt } from './ink';
import { makeSounds, type Voice } from './sounds';

/* The first screen: a sheet of paper with a floor line, and a pen. The pen rests at the end of Bryce's name, blinking
   like a cursor. Shortly after the page opens it lifts off, draws a little doodle on the paper, and puts itself back;
   the doodle wakes up, drops onto the floor, looks at you and waves. That's the whole explanation. Whatever the
   visitor draws after that comes alive the same way.

   One canvas covers the first screen and everything is drawn on it in the page's own coordinates (CSS px from the
   top left of that screen), so ink never lags behind the page on a phone. The paper takes the pointer: on a phone it
   doesn't scroll, so a finger can draw, and everything around it scrolls as usual. */

export type Scene = { destroy(): void; voice: Voice; creatures: () => Creature[] };

type Opts = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  paper: HTMLElement;
  park: HTMLElement;
  reduced: boolean;
  /** Called once, when the first creature the visitor drew comes alive. */
  onFirst?: () => void;
};

const MAX = 6;

export function mountScene(o: Opts): Scene {
  const { root, canvas, paper, park } = o;
  const ctx = canvas.getContext('2d')!;
  const voice = makeSounds();
  const tile = grain();
  let pattern: CanvasPattern | null = null;
  let W = 0, H = 0, dpr = 1;
  let floor: Floor = { x0: 0, x1: 0, y: 0 };
  let floorLine: Pt[] = [];
  let parkAt = { x: 0, y: 0 };
  const creatures: Creature[] = [];
  let pending: { lines: Pt[][]; at: number; x0: number; y0: number; x1: number; y1: number } | null = null;
  let pen: Pen | null = null, penId = -1, penFrom = { x: 0, y: 0, t: 0, type: '' };
  let probe: { id: number; x: number; y: number; at: number; c: Creature; type: string } | null = null;
  let grabbed: { id: number; c: Creature } | null = null;
  let hover: { x: number; y: number; on: boolean; over: Creature | null } = { x: 0, y: 0, on: false, over: null };
  let eye: { x: number; y: number; until: number } | null = null;
  let rush: (Env['rush']) = null;
  let lastPen = { x: 0, y: 0, t: 0 };
  let touched = false, firstDone = false;
  let t = 0, last = 0, raf = 0, running = false, visible = true;

  const isPhone = () => matchMedia('(pointer: coarse)').matches;
  const base = () => (isPhone() ? 3.5 : 3.2);

  // ---- layout ---------------------------------------------------------------------------------------------------

  function layout() {
    const r = root.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    const p = paper.getBoundingClientRect();
    const inset = Math.min(28, Math.max(16, W * 0.04));
    floor = { x0: p.left - r.left + inset, x1: p.right - r.left - inset, y: p.bottom - r.top - (isPhone() ? 8 : 14) };
    for (const c of creatures) {
      c.floor = floor;
      if (c.state === 'ground') c.x = clamp(c.x, floor.x0 + 10, floor.x1 - 10);
    }
    // The floor: one long, calm line, a little heavier in places, like it was ruled by hand.
    floorLine = [];
    const b = base() * 0.62;
    for (let x = floor.x0 - 4; x <= floor.x1 + 4; x += 3) {
      const u = (x - floor.x0) / Math.max(1, floor.x1 - floor.x0);
      const taper = Math.min(1, u * 9, (1 - u) * 9);
      floorLine.push({ x, y: floor.y + 1 + noise(x * 0.008) * 1.1 + noise(x * 0.05 + 9) * 0.25, w: b * (0.75 + 0.35 * noise(x * 0.012 + 3)) * (0.35 + 0.65 * Math.max(0, taper)) });
    }
    const k = park.getBoundingClientRect();
    parkAt = { x: k.left - r.left + 4, y: k.top - r.top + k.height * 0.78 };
    pattern = null;
  }

  // ---- the pen ---------------------------------------------------------------------------------------------------

  /** The pen: where it is, and whether it's resting by the name, on its way somewhere, or in the visitor's hand. */
  const nib = { x: 0, y: 0, mode: 'park' as 'park' | 'fly' | 'hand' | 'hide', from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, at: 0, dur: 0.5, then: null as null | (() => void), alpha: 1, tilt: 0 };

  function fly(to: { x: number; y: number }, dur: number, then?: () => void) {
    nib.mode = 'fly'; nib.from = { x: nib.x, y: nib.y }; nib.to = to; nib.at = t; nib.dur = dur; nib.then = then ?? null;
  }

  function drawNib(x: number, y: number, a: number, alpha: number, tilt: number) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(0.62 + tilt);
    const s = 1.05;
    ctx.scale(s, s);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(7.6, -6, 6.7, -15);
    ctx.lineTo(5.5, -26);
    ctx.lineTo(-5.5, -26);
    ctx.lineTo(-6.7, -15);
    ctx.quadraticCurveTo(-7.6, -6, 0, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-0.45, -12.5, 0.9, 11);
    ctx.beginPath(); ctx.arc(0, -13.6, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-6.2, -21.4, 12.4, 0.9);
    ctx.restore();
    void a;
  }

  // ---- the example ------------------------------------------------------------------------------------------------

  /** The doodle the pen draws by itself: a soft lumpy bean, drawn the way a hand would, a little fast, closing past
   *  where it started. */
  function exampleShape(): [number, number][] {
    const cx = floor.x0 + (floor.x1 - floor.x0) * (W < 640 ? 0.58 : 0.64), cy = floor.y - Math.min(220, (floor.y - parkAt.y) * 0.55);
    const R = clamp(W * 0.06, 30, 44);
    const pts: [number, number][] = [];
    const a0 = -2.2;
    for (let i = 0; i <= 64; i++) {
      const u = i / 64, a = a0 + u * (Math.PI * 2 + 0.32);
      const r = R * (1 + 0.1 * Math.sin(a * 2 + 1.1) + 0.05 * Math.sin(a * 3 + 0.3));
      pts.push([cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 0.92 + (Math.sin(a) > 0 ? r * 0.06 : 0)]);
    }
    return pts;
  }
  let example: { pts: [number, number][]; pen: Pen | null; at: number; done: boolean; creature?: Creature } | null = null;

  function startExample() {
    if (touched || example) return;
    const pts = exampleShape();
    example = { pts, pen: null, at: 0, done: false };
    fly({ x: pts[0][0], y: pts[0][1] }, 0.6, () => { if (example) { example.at = t; example.pen = new Pen(base(), 'mouse', pts[0][0], pts[0][1], t * 1000, 0.5); nib.mode = 'hand'; } });
  }

  function stepExample() {
    if (!example || !example.pen || example.done) return;
    const dur = 0.95, u = clamp((t - example.at) / dur, 0, 1);
    // A hand speeds up into a loop and slows as it closes it.
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const upto = Math.floor(e * (example.pts.length - 1));
    const pen = example.pen as Pen & { _i?: number };
    for (let i = pen._i ?? 1; i <= upto; i++) pen.add(example.pts[i][0], example.pts[i][1], (example.at + (dur * i) / example.pts.length) * 1000, 0.5);
    pen._i = upto + 1;
    const tip = example.pts[upto];
    nib.x = tip[0]; nib.y = tip[1];
    if (u >= 1) {
      example.done = true;
      const lines = [pen.finish()];
      const c = new Creature(lines, floor, 'walker');
      example.creature = c;
      creatures.push(c);
      later(0.26, () => { c.wake(t); later(1.9, () => { if (c.state === 'ground') { c.facing = -1; c.wave(1.7, t); } }); });
      fly(parkAt, 0.55, () => { nib.mode = 'park'; });
    }
  }

  const timers: { at: number; fn: () => void }[] = [];
  function later(s: number, fn: () => void) { timers.push({ at: t + s, fn }); }

  // ---- drawing ---------------------------------------------------------------------------------------------------

  const local = (e: PointerEvent) => { const r = root.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  function finalize() {
    if (!pending) return;
    const lines = pending.lines;
    pending = null;
    const c = new Creature(lines, floor);
    creatures.push(c);
    c.wake(t);
    const mine = creatures.filter(x => !x.leaving && x.state !== 'drawn');
    if (mine.length > MAX) mine[0].leave();
    if (!firstDone) {
      firstDone = true;
      later(1.2, () => o.onFirst?.());
      // The pen's own doodle comes over to say hi.
      const ex = example?.creature;
      if (ex && !ex.leaving && ex.state === 'ground') { ex.goal = clamp(c.x + (ex.x < c.x ? -1 : 1) * (c.w / 2 + ex.w / 2 + 24), floor.x0 + 30, floor.x1 - 30); }
    }
  }

  function down(e: PointerEvent) {
    if (e.button > 0) return;
    touched = true;
    voice.unlock();
    const p = local(e);
    if (example && !example.done) { example = null; }
    try { paper.setPointerCapture(e.pointerId); } catch { /* fine */ }
    const pad = e.pointerType === 'touch' ? 16 : 6;
    const hit = [...creatures].reverse().find(c => c.hit(p.x, p.y, pad));
    if (hit && !pen) { probe = { id: e.pointerId, x: p.x, y: p.y, at: t, c: hit, type: e.pointerType }; e.preventDefault(); return; }
    if (pen) return;
    if (pending && t - pending.at < 1.2) {
      const near = p.x > pending.x0 - 90 && p.x < pending.x1 + 90 && p.y > pending.y0 - 90 && p.y < pending.y1 + 90;
      if (!near) finalize();
    }
    pending && (pending.at = Infinity);
    pen = new Pen(base(), e.pointerType, p.x, p.y, e.timeStamp, e.pressure);
    penFrom = { x: p.x, y: p.y, t: e.timeStamp, type: e.pointerType };
    penId = e.pointerId;
    nib.mode = e.pointerType === 'mouse' ? 'hand' : 'hide';
    lastPen = { x: p.x, y: p.y, t: e.timeStamp };
    e.preventDefault();
  }

  function move(e: PointerEvent) {
    const p = local(e);
    if (e.pointerType === 'mouse') { hover = { x: p.x, y: p.y, on: true, over: hover.over }; }
    eye = { x: p.x, y: p.y, until: t + (e.pointerType === 'mouse' ? 0.6 : 1.2) };
    if (probe && probe.id === e.pointerId) {
      if (Math.hypot(p.x - probe.x, p.y - probe.y) > 7) { grabbed = { id: e.pointerId, c: probe.c }; probe.c.grab(p.x, p.y, env()); probe = null; }
      return;
    }
    if (grabbed && grabbed.id === e.pointerId) { grabbed.c.drag(p.x, p.y, Math.max(1 / 240, (e.timeStamp - lastPen.t) / 1000)); lastPen = { x: p.x, y: p.y, t: e.timeStamp }; return; }
    if (pen && e.pointerId === penId) {
      const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const c of list.length ? list : [e]) { const q = local(c); pen.add(q.x, q.y, c.timeStamp, c.pressure); }
      const dt = Math.max(1, e.timeStamp - lastPen.t), v = Math.hypot(p.x - lastPen.x, p.y - lastPen.y) / dt;
      rush = { x: p.x, y: p.y, v };
      lastPen = { x: p.x, y: p.y, t: e.timeStamp };
      e.preventDefault();
      return;
    }
    if (e.pointerType === 'mouse') {
      const over = [...creatures].reverse().find(c => c.hit(p.x, p.y, 6)) ?? null;
      hover.over = over;
      paper.style.cursor = over ? 'grab' : 'none';
    }
  }

  function up(e: PointerEvent) {
    if (probe && probe.id === e.pointerId) { probe.c.boop(env()); probe = null; return; }
    if (grabbed && grabbed.id === e.pointerId) { grabbed.c.drop(env()); grabbed = null; return; }
    if (pen && e.pointerId === penId) {
      const pts = pen.finish();
      pen = null; penId = -1; rush = null;
      // A quick, straight flick upward with a finger is someone trying to scroll, not draw: take them down the page.
      const end = local(e), dx = end.x - penFrom.x, dy = end.y - penFrom.y;
      if (penFrom.type === 'touch' && e.timeStamp - penFrom.t < 260 && dy < -90 && Math.abs(dx) < Math.abs(dy) * 0.4) {
        const r = root.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.bottom - 8, behavior: o.reduced ? 'auto' : 'smooth' });
        return;
      }
      if (pts.length < 2 && e.type === 'pointercancel') return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const q of pts) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
      if (!pending) pending = { lines: [], at: t, x0, y0, x1, y1 };
      pending.lines.push(pts);
      pending.at = t;
      pending.x0 = Math.min(pending.x0, x0); pending.y0 = Math.min(pending.y0, y0); pending.x1 = Math.max(pending.x1, x1); pending.y1 = Math.max(pending.y1, y1);
      if (e.pointerType !== 'mouse') { nib.mode = 'hide'; later(1.1, () => { if (!pen && nib.mode === 'hide') { nib.x = parkAt.x; nib.y = parkAt.y; nib.mode = 'park'; nib.alpha = 0; } }); }
    }
  }

  function leavePaper(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || pen) return;
    hover.on = false;
    if (nib.mode === 'hand') { nib.mode = 'park'; nib.x = parkAt.x; nib.y = parkAt.y; nib.alpha = 0; }
  }
  function enterPaper(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    if (example && !example.done) return;
    nib.mode = 'hand';
  }

  // iOS: no magnifier, no text selection, no double tap zoom while drawing. Pointer events still arrive.
  const noTouch = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
  const noForce = (e: Event) => e.preventDefault();

  paper.addEventListener('pointerdown', down);
  paper.addEventListener('pointermove', move);
  paper.addEventListener('pointerup', up);
  paper.addEventListener('pointercancel', up);
  paper.addEventListener('pointerleave', leavePaper);
  paper.addEventListener('pointerenter', enterPaper);
  paper.addEventListener('touchstart', noTouch, { passive: false });
  paper.addEventListener('touchmove', noTouch, { passive: false });
  paper.addEventListener('webkitmouseforcewillbegin', noForce);
  paper.addEventListener('contextmenu', noForce);

  // ---- the loop --------------------------------------------------------------------------------------------------

  const env = (): Env => ({
    t,
    eye: pen ? { x: lastPen.x, y: lastPen.y } : example && !example.done && example.pen ? { x: nib.x, y: nib.y } : eye && t < eye.until ? eye : hover.on ? hover : null,
    rush: pen ? rush : null,
    reduced: o.reduced,
    sounds: voice,
    crowd: creatures,
    you: YOU,
  });
  const YOU = { x: 0, y: 0 };

  function frame(now: number) {
    raf = 0;
    if (!running) return;
    const s = now / 1000;
    const dt = last ? Math.min(1 / 30, Math.max(0, s - last)) : 1 / 60;
    last = s; t += dt;
    for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); }
    if (pending && t - pending.at > (isPhone() ? 0.62 : 0.5)) finalize();
    stepExample();

    const en = env();
    for (const c of creatures) c.update(dt, en);
    for (let i = creatures.length - 1; i >= 0; i--) if (creatures[i].gone) creatures.splice(i, 1);
    if (grabbed) grabbed.c.drag(grabbed.c.held!.tx, grabbed.c.held!.ty, dt);

    // The pen in flight.
    if (nib.mode === 'fly') {
      const u = clamp((t - nib.at) / nib.dur, 0, 1), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const lift = Math.sin(Math.PI * u) * 46;
      nib.x = nib.from.x + (nib.to.x - nib.from.x) * e;
      nib.y = nib.from.y + (nib.to.y - nib.from.y) * e - lift;
      nib.tilt = Math.sin(Math.PI * u) * 0.25 * Math.sign(nib.to.x - nib.from.x);
      nib.alpha = 1;
      if (u >= 1) { nib.mode = 'park'; const f = nib.then; nib.then = null; f?.(); }
    } else if (nib.mode === 'park') {
      nib.x = parkAt.x; nib.y = parkAt.y + Math.sin(t * 2) * 0.8; nib.tilt = 0;
      nib.alpha = Math.min(1, nib.alpha + dt * 3);
    } else if (nib.mode === 'hand') {
      if (!example || example.done) { nib.x = pen ? lastPen.x : hover.x; nib.y = pen ? lastPen.y : hover.y; }
      nib.tilt += ((pen ? -0.08 : 0) - nib.tilt) * Math.min(1, dt * 10);
      nib.alpha = 1;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK;
    line(ctx, floorLine);
    if (pending) for (const l of pending.lines) line(ctx, l);
    if (example?.pen && !example.done) line(ctx, example.pen.pts, 0, 0, 5);
    for (const c of creatures) if (c !== grabbed?.c) c.draw(ctx, t, o.reduced);
    if (grabbed) grabbed.c.draw(ctx, t, o.reduced);
    if (pen) line(ctx, pen.pts, 0, 0, 5);

    // Grain: specks of paper showing through the ink.
    if (!pattern) pattern = ctx.createPattern(tile, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // The pen goes on top of everything, untextured: it's an object, not ink.
    // Resting by the name it blinks like a cursor, until the visitor has picked it up once.
    const blink = nib.mode === 'park' && !touched ? ((t % 1.06) < 0.6 ? 1 : 0) : 1;
    const drawingExample = !!example && !example.done;
    const showHand = nib.mode !== 'hand' || drawingExample || (hover.on && !hover.over) || pen;
    if (nib.mode !== 'hide' && showHand) drawNib(nib.x, nib.y, 0, nib.alpha * blink, nib.tilt);
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  layout();
  nib.x = parkAt.x; nib.y = parkAt.y;
  const ro = new ResizeObserver(() => layout());
  ro.observe(root);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); });
  io.observe(root);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  start();
  later(o.reduced ? 0.4 : 1.1, startExample);
  void rand; void stroke;

  return {
    voice,
    creatures: () => creatures,
    destroy() {
      stop(); ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      paper.removeEventListener('pointerdown', down);
      paper.removeEventListener('pointermove', move);
      paper.removeEventListener('pointerup', up);
      paper.removeEventListener('pointercancel', up);
      paper.removeEventListener('pointerleave', leavePaper);
      paper.removeEventListener('pointerenter', enterPaper);
      paper.removeEventListener('touchstart', noTouch);
      paper.removeEventListener('touchmove', noTouch);
      paper.removeEventListener('webkitmouseforcewillbegin', noForce);
      paper.removeEventListener('contextmenu', noForce);
    },
  };
}
