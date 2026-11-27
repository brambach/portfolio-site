import { card } from './card';
import { STYLE } from './clean';
import { SCRIBBLE, type StageId } from './copy';
import { Creature, TONE, type Env, type Floor, type Keep } from './creature';
import { Cat } from './follower';
import { leftFor, loadGuide, placed, readStories, saveGuide, visiting, type Saved } from './memory';
import { INK, Pen, clamp, grain, line, noise, quad, stroke, type Pt } from './ink';
import { play, type Play, type Stage } from './reactions';
import { loadMine, samples, saveMine } from './samples';
import { makeSounds, type Voice } from './sounds';

/* The whole page as one sheet of paper.

   At the top: Bryce's name with a pen resting beside it, blinking like a cursor. Shortly after the page opens the
   pen lifts off, draws a little doodle on the sheet and puts itself back; the doodle wakes up, drops onto the floor
   line, looks at you and waves. That's the whole explanation. Whatever the visitor draws after that comes alive the
   same way.

   Further down, each project stands on its own floor like a little stage. The newest creature is the guide: as you
   scroll it leaps from floor to floor to keep up, and when it lands on a project's stage that project plays its
   scene with it (reactions.ts). At the bottom it waves goodbye and can be kept as a card, next to a parade of other
   creatures.

   Drawing: one canvas, about two screens tall, laid over the page and moved down the page as you scroll. Everything
   is drawn on it in the page's own coordinates, so ink scrolls with the page natively and never lags behind it on
   a phone. The sheet at the top takes the pointer: there a finger draws instead of scrolling. */

export type Scene = { destroy(): void; voice: Voice };

type Opts = {
  root: HTMLElement;
  hero: HTMLElement;
  canvas: HTMLCanvasElement;
  paper: HTMLElement;
  park: HTMLElement;
  card: HTMLButtonElement | null;
  reduced: boolean;
};

type StageRec = Stage & { el: HTMLElement; frame: Pt[][]; frameLen: number; ground: Pt[]; openAt: number; play: Play | null; top: number; bottom: number; link: { x: number; y: number; w: number; h: number } | null; ring: Pt[] | null; ringAt: number; path: string | null; tick: Pt[] | null; tickAt: number };

/** What each project gives the guide to keep (gear.ts draws them), or who comes along. */
const GIFT: Record<StageId, Keep | 'cat' | 'echo'> = {
  teammate: 'check', dervo: 'nightcap', psyche: 'flower', receipts: 'receipt', tastepack: 'snapshot',
  trace: 'pencil', easeprint: 'echo', dryline: 'umbrella', comehome: 'cat', arro: 'headband',
};

const MAX = 6;
const TAU = Math.PI * 2;

export function mountScene(o: Opts): Scene {
  const { root, hero, canvas, paper, park } = o;
  const ctx = canvas.getContext('2d')!;
  const voice = makeSounds();
  const cartoon = STYLE === 'cartoon';
  const tile = grain();
  let pattern: CanvasPattern | null = null;
  let W = 0, H = 0, dpr = 1, top = 0, pageH = 0, vh = 0, vt = 0;
  let heroFloor: Floor = { x0: 0, x1: 0, y: 0, id: 'hero' };
  let heroLine: Pt[] = [];
  let endFloor: Floor | null = null, endLine: Pt[] = [];
  let paradeFloor: Floor | null = null, paradeLine: Pt[] = [];
  let parkAt = { x: 0, y: 0 };
  const stages: StageRec[] = [];
  const creatures: Creature[] = [];
  const parade: Creature[] = [];
  let guide: Creature | null = null;
  let pending: { lines: Pt[][]; at: number; x0: number; y0: number; x1: number; y1: number } | null = null;
  let pen: Pen | null = null, penId = -1, penFrom = { x: 0, y: 0, t: 0, type: '' };
  let probe: { id: number; x: number; y: number; at: number; c: Creature; type: string } | null = null;
  let grabbed: { id: number; c: Creature } | null = null;
  let hover: { x: number; y: number; on: boolean; over: Creature | null } = { x: 0, y: 0, on: false, over: null };
  let eye: { x: number; y: number; until: number } | null = null;
  let rush: Env['rush'] = null;
  let lastPen = { x: 0, y: 0, t: 0 };
  let touched = false, firstDone = false;
  let t = 0, last = 0, raf = 0, running = false;
  let want: { floor: Floor; since: number } | null = null;
  let bye: { at: number; shown: boolean } | null = null;
  // The invitation. A new creature looks at you, beckons, and a drawn arrow points down the page. If you don't
  // follow, the first one goes on ahead and waits for you on the first project.
  let invite: { c: Creature; step: 'meet' | 'look' | 'walk' | 'beckon' | 'wait'; at: number; spot: number; hopped: boolean; again: boolean } | null = null;
  let arrow: { x: number; y: number; dir: number; at: number; out: number; fy: number } | null = null;
  let wentAhead = false, aheadWait = false, lastInk = -10;
  // A stage the guide landed on before it was in view: its scene waits until the visitor gets there.
  let due: StageRec | null = null;
  // The cat that comes along once it's found, and when the visitor last did anything (the guide dozes off without them).
  let cat: Cat | null = null;
  let lastInput = 0, dozed = false, lastNudge = -10;
  const read = readStories();

  const isPhone = () => matchMedia('(pointer: coarse)').matches || innerWidth < 640;
  const base = () => (isPhone() ? 3.5 : 3.2);
  const rectOf = (el: Element) => { const R = root.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height }; };

  /** A floor line: long and calm, a little heavier in places, like it was ruled by hand. */
  function ground(x0: number, x1: number, y: number, seed: number, weight = 1): Pt[] {
    const out: Pt[] = [];
    const b = (cartoon ? 2.3 : base() * 0.62) * weight;
    for (let x = x0; x <= x1; x += 3) {
      const u = (x - x0) / Math.max(1, x1 - x0), taper = Math.min(1, u * 10, (1 - u) * 10);
      const wob = cartoon ? noise(x * 0.006 + seed) * 0.6 : noise(x * 0.008 + seed) * 1.1 + noise(x * 0.05 + 9) * 0.25;
      out.push({ x, y: y + 1 + wob, w: b * (cartoon ? 0.9 + 0.15 * noise(x * 0.01 + seed) : 0.75 + 0.35 * noise(x * 0.012 + 3)) * (0.3 + 0.7 * Math.max(0, taper)) });
    }
    return out;
  }

  /** A hand drawn frame round a picture: four strokes that run a little past the corners. */
  function frame(x: number, y: number, w: number, h: number, seed: number): Pt[][] {
    const side = (ax: number, ay: number, bx: number, by: number, k: number): Pt[] => {
      const out: Pt[] = [], L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / 4));
      const nx = -(by - ay) / L, ny = (bx - ax) / L, bow = (noise(seed + k) * 0.5 + 0.5) * Math.min(3, L * 0.006);
      for (let i = 0; i <= n; i++) {
        const u = i / n, b = Math.sin(Math.PI * u) * bow + noise(seed * 3 + k * 7 + u * 4) * 0.5;
        out.push({ x: ax + (bx - ax) * u + nx * b, y: ay + (by - ay) * u + ny * b, w: (cartoon ? 2.1 : 2) * (0.55 + 0.45 * Math.min(1, u * 8, (1 - u) * 8)) });
      }
      return out;
    };
    const o = 5;
    return [side(x - o, y, x + w + 3, y - 1, 1), side(x + w, y - o, x + w + 1, y + h + 3, 2), side(x + w + o, y + h, x - 3, y + h + 1, 3), side(x, y + h + o, x - 1, y - 3, 4)];
  }

  /** A loop drawn round a link, the way you'd circle something on a printout: a bit past where it started. */
  function loop(b: { x: number; y: number; w: number; h: number }, seed: number): Pt[] {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 1, rx = b.w / 2 + 13, ry = b.h / 2 + 9;
    const out: Pt[] = [];
    const a0 = -2.5, sweep = TAU + 0.55, n = 64;
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + sweep * u, wob = 1 + noise(seed + u * 3) * 0.05 + u * 0.06;
      out.push({ x: cx + Math.cos(a) * rx * wob, y: cy + Math.sin(a) * ry * wob - u * 3, w: 2.3 * (0.6 + 0.4 * Math.min(1, u * 6, (1 - u) * 5)) });
    }
    return out;
  }

  /** A tick beside a story the visitor has read: a short stroke down, a longer one up. */
  function tickMark(b: { x: number; y: number; w: number; h: number }, seed: number): Pt[] {
    const x = b.x + b.w + 12, y = b.y + b.h * 0.5;
    const a = { x, y: y - 1 }, m = { x: x + 6, y: y + 7 }, z = { x: x + 21, y: y - 11 };
    const out: Pt[] = [];
    for (let i = 0; i <= 22; i++) {
      const u = i / 22, down = u < 0.3, k = down ? u / 0.3 : (u - 0.3) / 0.7, p = down ? a : m, q = down ? m : z;
      out.push({ x: p.x + (q.x - p.x) * k + noise(seed + u * 4) * 0.8, y: p.y + (q.y - p.y) * k, w: 2.5 * (0.55 + 0.45 * Math.min(1, u * 5, (1 - u) * 3)) });
    }
    return out;
  }

  // ---- layout ---------------------------------------------------------------------------------------------------

  function layout() {
    const R = root.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = R.width; pageH = root.offsetHeight; vh = window.innerHeight;
    H = Math.min(pageH, Math.round(Math.min(vh * 2.2, 3200)));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    pattern = null;
    TONE.texture = null;

    const p = rectOf(paper);
    const inset = Math.min(28, Math.max(16, W * 0.04));
    const was = heroFloor;
    heroFloor = { x0: p.x + inset, x1: p.x + p.w - inset, y: p.y + p.h - (isPhone() ? 8 : 14), id: 'hero' };
    heroLine = ground(heroFloor.x0 - 4, heroFloor.x1 + 4, heroFloor.y, 1);
    const k = rectOf(park);
    parkAt = { x: k.x + 4, y: k.y + k.h * 0.78 };

    const fit = isPhone() ? 74 : 112;
    const old = new Map(stages.map(s => [s.id, s]));
    stages.length = 0;
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((el, i) => {
      const sec = rectOf(el), pic = rectOf(el.querySelector('[data-pic] img') ?? el.querySelector('[data-pic]')!), room = rectOf(el.querySelector('[data-room]')!);
      const id = el.dataset.stage as StageId;
      const floor: Floor = { x0: room.x + 8, x1: room.x + room.w - 8, y: sec.y + sec.h, fit, id };
      const fr = frame(pic.x, pic.y, pic.w, pic.h, i * 13.7 + 2);
      const prev = old.get(id);
      const go = el.querySelector<HTMLElement>('.go');
      const link = go ? rectOf(go) : null;
      const path = go instanceof HTMLAnchorElement ? go.pathname : null;
      stages.push({
        id, el, floor, pic, room: { x0: floor.x0, x1: floor.x1, y0: room.y },
        frame: fr, frameLen: fr.reduce((a, l) => a + l.length, 0), ground: ground(sec.x - 6, sec.x + sec.w + 6, floor.y, i * 3.1),
        openAt: prev?.openAt ?? -1, play: prev?.play ?? null, top: sec.y, bottom: sec.y + sec.h,
        link, ring: link ? loop(link, i * 5.3 + 1) : null, ringAt: prev?.ringAt ?? -1,
        path, tick: link ? tickMark(link, i * 2.9 + 4) : null, tickAt: prev?.tickAt ?? -1,
      });
    });
    const end = root.querySelector('[data-end]'), par = root.querySelector('[data-parade]');
    if (end) { const r = rectOf(end); endFloor = { x0: r.x + 8, x1: r.x + r.w - 8, y: r.y + r.h, fit, id: 'end' }; endLine = ground(r.x - 10, r.x + r.w + 10, endFloor.y, 7); }
    if (par) { const r = rectOf(par); paradeFloor = { x0: r.x, x1: r.x + r.w, y: r.y + r.h, fit: isPhone() ? 46 : 58, id: 'parade' }; paradeLine = ground(r.x - 6, r.x + r.w + 6, paradeFloor.y, 11, 0.85); }

    // Everyone stays on their floor as it moves.
    const floors = [heroFloor, ...stages.map(s => s.floor), endFloor, paradeFloor].filter(Boolean) as Floor[];
    for (const c of [...creatures, ...parade]) {
      const f = floors.find(x => x.id === c.floor.id) ?? heroFloor;
      const dy = f.y - c.floor.y;
      c.floor = f;
      if (c.standing) { c.y += dy; c.x = clamp(c.x, f.x0 + 6, f.x1 - 6); for (const l of c.legs) { l.fy += dy; } }
      else if (c.floor === f && f === heroFloor) c.y += f.y - was.y;
    }
    anchor(true);
  }

  /** Keep the canvas over what's on screen, with room either side to scroll into. */
  function anchor(force = false) {
    const R = root.getBoundingClientRect();
    vt = -R.top; vh = window.innerHeight;
    const margin = Math.max(60, (H - vh) * 0.25);
    if (force || vt < top + 4 || vt + vh > top + H - 4 || (vt < top + margin && top > 0) || (vt + vh > top + H - margin && top + H < pageH)) {
      top = Math.round(clamp(vt - (H - vh) / 2, 0, Math.max(0, pageH - H)));
      canvas.style.transform = `translate3d(0, ${top}px, 0)`;
    }
  }

  // ---- the pen ---------------------------------------------------------------------------------------------------

  /** The pen: where it is, and whether it's resting by the name, on its way somewhere, or in the visitor's hand. */
  const nib = { x: 0, y: 0, mode: 'park' as 'park' | 'fly' | 'hand' | 'hide', from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, at: 0, dur: 0.5, then: null as null | (() => void), alpha: 1, tilt: 0 };

  function fly(to: { x: number; y: number }, dur: number, then?: () => void) {
    nib.mode = 'fly'; nib.from = { x: nib.x, y: nib.y }; nib.to = to; nib.at = t; nib.dur = dur; nib.then = then ?? null;
  }

  function drawNib(x: number, y: number, alpha: number, tilt: number) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(0.62 + tilt);
    ctx.scale(1.05, 1.05);
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
    ctx.beginPath(); ctx.arc(0, -13.6, 1.7, 0, TAU); ctx.fill();
    ctx.fillRect(-6.2, -21.4, 12.4, 0.9);
    ctx.restore();
  }

  // ---- the example ------------------------------------------------------------------------------------------------

  /** The doodle the pen draws by itself: a soft lumpy bean, drawn the way a hand would, a little fast, closing past
   *  where it started. */
  function exampleShape(): [number, number][] {
    const cx = heroFloor.x0 + (heroFloor.x1 - heroFloor.x0) * (W < 640 ? 0.58 : 0.64), cy = heroFloor.y - Math.min(220, (heroFloor.y - parkAt.y) * 0.55);
    const R = clamp(W * 0.06, 30, 44);
    const pts: [number, number][] = [];
    const a0 = -2.2;
    for (let i = 0; i <= 64; i++) {
      const u = i / 64, a = a0 + u * (TAU + 0.32);
      const r = R * (1 + 0.1 * Math.sin(a * 2 + 1.1) + 0.05 * Math.sin(a * 3 + 0.3));
      pts.push([cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 0.92 + (Math.sin(a) > 0 ? r * 0.06 : 0)]);
    }
    return pts;
  }
  let example: { pts: [number, number][]; pen: (Pen & { _i?: number }) | null; at: number; done: boolean; creature?: Creature } | null = null;

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
    const pen = example.pen;
    for (let i = pen._i ?? 1; i <= upto; i++) pen.add(example.pts[i][0], example.pts[i][1], (example.at + (dur * i) / example.pts.length) * 1000, 0.5);
    pen._i = upto + 1;
    const tip = example.pts[upto];
    nib.x = tip[0]; nib.y = tip[1];
    if (u >= 1) {
      example.done = true;
      const c = new Creature([pen.finish()], heroFloor, 'walker');
      example.creature = c;
      creatures.push(c);
      later(0.26, () => { c.wake(t); if (!guide) guide = c; later(1.9, () => { if (c.standing) { c.facing = -1; c.wave(1.7, t); } }); });
      fly(parkAt, 0.55, () => { nib.mode = 'park'; });
    }
  }

  const timers: { at: number; fn: () => void }[] = [];
  function later(s: number, fn: () => void) { timers.push({ at: t + s, fn }); }

  // ---- drawing on the sheet ---------------------------------------------------------------------------------------

  const local = (e: { clientX: number; clientY: number }) => { const R = root.getBoundingClientRect(); return { x: e.clientX - R.left, y: e.clientY - R.top }; };

  function finalize() {
    if (!pending) return;
    const lines = pending.lines;
    pending = null;
    const c = new Creature(lines, heroFloor);
    creatures.push(c);
    c.wake(t);
    // The newest creature is the guide. The one before stays home.
    const was = guide;
    guide = c;
    aheadWait = false;
    if (was && was !== c && was.floor !== heroFloor) send(was, heroFloor);
    beginInvite(c);
    later(1.4, remember);
    const mine = creatures.filter(x => !x.leaving && x.awake);
    if (mine.length > MAX) mine[0].leave();
    if (!firstDone) {
      firstDone = true;
      // The pen's own doodle comes over to say hi.
      const ex = example?.creature;
      if (ex && !ex.leaving && ex.standing && ex.floor === heroFloor) ex.goal = clamp(c.x + (ex.x < c.x ? -1 : 1) * (c.w / 2 + ex.w / 2 + 24), heroFloor.x0 + 30, heroFloor.x1 - 30);
    }
  }

  function down(e: PointerEvent) {
    if (e.button > 0) return;
    touched = true;
    voice.unlock();
    const p = local(e);
    if (example && !example.done) example = null;
    try { paper.setPointerCapture(e.pointerId); } catch { /* fine */ }
    const pad = e.pointerType === 'touch' ? 16 : 6;
    const hit = [...creatures].reverse().find(c => c.hit(p.x, p.y, pad));
    if (hit && !pen) { probe = { id: e.pointerId, x: p.x, y: p.y, at: t, c: hit, type: e.pointerType }; e.preventDefault(); return; }
    if (pen) return;
    if (pending && t - pending.at < 1.2) {
      const near = p.x > pending.x0 - 90 && p.x < pending.x1 + 90 && p.y > pending.y0 - 90 && p.y < pending.y1 + 90;
      if (!near) finalize();
    }
    if (pending) pending.at = Infinity;
    pen = new Pen(base(), e.pointerType, p.x, p.y, e.timeStamp, e.pressure);
    lastInk = t;
    penFrom = { x: p.x, y: p.y, t: e.timeStamp, type: e.pointerType };
    penId = e.pointerId;
    nib.mode = e.pointerType === 'mouse' ? 'hand' : 'hide';
    lastPen = { x: p.x, y: p.y, t: e.timeStamp };
    e.preventDefault();
  }

  function move(e: PointerEvent) {
    const p = local(e);
    if (e.pointerType === 'mouse') hover = { x: p.x, y: p.y, on: true, over: hover.over };
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
    if (!pen || e.pointerId !== penId) return;
    const pts = pen.finish();
    pen = null; penId = -1; rush = null;
    lastInk = t;
    // A quick, straight flick upward with a finger is someone trying to scroll, not draw: take them down the page.
    const end = local(e), dx = end.x - penFrom.x, dy = end.y - penFrom.y;
    if (penFrom.type === 'touch' && e.timeStamp - penFrom.t < 260 && dy < -90 && Math.abs(dx) < Math.abs(dy) * 0.4) {
      const r = hero.getBoundingClientRect();
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

  // ---- the guide ----------------------------------------------------------------------------------------------------

  /** Where a creature should stand on a floor. */
  function spot(f: Floor, c: Creature) {
    const m = c.half + 8;
    if (f === endFloor) return clamp(f.x0 + (f.x1 - f.x0) * 0.4, f.x0 + m, f.x1 - m);
    if (f === heroFloor) return clamp(c.x, f.x0 + m, f.x1 - m);
    return clamp((f.x0 + f.x1) / 2 + (Math.random() - 0.5) * (f.x1 - f.x0) * 0.2, f.x0 + Math.min(m, (f.x1 - f.x0) / 2), f.x1 - Math.min(m, (f.x1 - f.x0) / 2));
  }

  function send(c: Creature, f: Floor) {
    // Leaving a stage mid scene: the scene lets go of it.
    const st = stages.find(s => s.floor === c.floor);
    if (st?.play && !st.play.done) { st.play = null; }
    c.script = false; c.hurry = 1;
    if (c.asleep) c.sleep(false, t, voice);
    c.pointAt(null, 0);
    if (arrow && arrow.out < 0 && !invite) arrow.out = t;
    c.leapTo(f, spot(f, c), t);
  }

  /** The floor nearest to where the visitor is reading. */
  function reading(): Floor | null {
    const line = vt + vh * 0.64;
    let best: Floor | null = null, d = Infinity;
    const all = [heroFloor, ...stages.map(s => s.floor), endFloor].filter(Boolean) as Floor[];
    for (const f of all) {
      if (f.y < vt + vh * 0.22 || f.y > vt + vh + 20) continue;
      const dd = Math.abs(f.y - line);
      if (dd < d) { d = dd; best = f; }
    }
    return best;
  }

  function steer() {
    const g = guide;
    if (!g || !g.awake || g.leaving || g === grabbed?.c || g.state === 'held') return;
    const f = reading();
    if (!f) return;
    // It went on ahead: it waits down there rather than coming back up for a visitor still at the top.
    if (aheadWait) { if (f === heroFloor) return; aheadWait = false; }
    if (invite && invite.c === g && f === heroFloor) return;
    if (!want || want.floor !== f) want = { floor: f, since: t };
    // Wait a beat, so a quick scroll through doesn't send it bouncing off every floor on the way.
    if (f !== g.floor && t - want.since > 0.16) {
      if (g.leaping) { if (g.floor !== f) send(g, f); }
      else send(g, f);
      want = { floor: f, since: Infinity };
    }
  }

  /** Something arrived on a floor: a stage plays its scene, the bottom says goodbye. */
  let lastFloor: Floor | null = null;
  function arrivals(env: Env) {
    const g = guide;
    if (!g) return;
    if (g.standing && g.floor !== lastFloor) {
      lastFloor = g.floor;
      const st = stages.find(s => s.floor === g.floor);
      if (st) due = st;
      if (g.floor === endFloor) goodbye(g, env);
    }
    if (g.leaping) lastFloor = null;
    // A stage plays its scene once the guide is standing on it and the visitor can see it.
    if (due && (g.floor !== due.floor || g.leaving)) due = null;
    if (due && g.standing && due.floor.y < vt + vh - 6 && due.floor.y > vt + vh * 0.25) {
      open(due);
      // Been here before: no need to do it all again, just a hello and a nod at the story.
      if (g.seen.has(due.id)) { const st = due; g.hop(env, 0, 260); later(0.6, () => pointTheWay(st, g)); }
      else due.play = play(due, g, t, { nib: (x, y, a = 1) => drawNib(x, y, a, -0.1), reduced: o.reduced });
      due = null;
    }
    // A scene just finished: a keepsake, then it points at the story.
    for (const st of stages) if (st.play?.done && g.floor === st.floor && !g.seen.has(st.id)) reward(st, g);
  }

  // ---- keepsakes and pointing the way ----------------------------------------------------------------------------

  function reward(st: StageRec, g: Creature) {
    g.seen.add(st.id);
    const gift = GIFT[st.id];
    if (gift === 'cat') {
      const at = st.play?.release?.();
      if (at && !cat) cat = new Cat(at.x, at.y, st.floor);
      g.talk('heart', 1.5, t, voice);
    } else if (gift === 'echo') { g.echo = true; g.talk('note', 1.3, t, voice); }
    else { g.give(gift, t); g.talk('star', 1.2, t, voice); voice.pop(g.size); }
    g.say('happy', t + 1.4);
    remember();
    later(1.5, () => pointTheWay(st, g));
  }

  /** It turns to the story and points at it, and the pen circles the link. */
  function pointTheWay(st: StageRec, g: Creature) {
    if (!st.link || g.floor !== st.floor || !g.standing || g.script) return;
    if (st.path && read.has(st.path)) { pointOn(st, g); return; }
    const L = st.link;
    g.pointAt({ x: L.x + L.w / 2, y: L.y + L.h / 2 }, t + 2.4);
    if (st.ringAt < 0) st.ringAt = t + 0.25;
    lastNudge = t;
  }

  /** A story already read: it ticks it off, and points on down to the next one still to read (or the goodbye). */
  function pointOn(st: StageRec, g: Creature) {
    const first = st.tickAt < 0;
    if (first) st.tickAt = t + 0.2;
    if (first) { g.talk('star', 1.2, t + 0.5, voice); g.say('happy', t + 1.6); }
    let tries = 0;
    const nod = () => {
      if (g.floor !== st.floor || g.script || g !== guide) return;
      // Mid hop: try again once it's back on its feet.
      if (!g.standing) { if (++tries < 8) later(0.25, nod); return; }
      // Down and over toward where the next one is to be read, or toward whichever side has room.
      const i = stages.indexOf(st), next = stages.slice(i + 1).find(s => !(s.path && read.has(s.path)));
      const f = st.floor, nx = next ? (next.floor.x0 + next.floor.x1) / 2 : g.x;
      const dir = Math.abs(nx - g.x) > 60 ? Math.sign(nx - g.x) : (g.x - f.x0 > f.x1 - g.x ? -1 : 1);
      g.pointAt({ x: g.x + dir * 140, y: f.y + 90 }, t + 2.2);
      if (first) { arrow = { x: g.x + dir * (g.half + 8), y: (g.top + f.y) / 2 - 4, dir, at: t, out: -1, fy: f.y }; later(3.4, () => { if (arrow && arrow.out < 0 && arrow.fy === f.y) arrow.out = t; }); }
      voice.giggle(g.size);
    };
    later(first ? 1.2 : 0, nod);
    lastNudge = t;
  }

  function drawTick(st: StageRec) {
    if (!st.tick || t < st.tickAt) return;
    const u = o.reduced ? 1 : clamp((t - st.tickAt) / 0.4, 0, 1), e = 1 - Math.pow(1 - u, 2);
    const n = Math.max(3, Math.ceil(st.tick.length * e));
    line(ctx, st.tick, 0.25, Math.floor(t * 6) + 3, 0, n);
    if (u < 1) { const q = st.tick[n - 1]; drawNib(q.x, q.y, 1, -0.2); }
  }

  function drawRing(st: StageRec) {
    if (!st.ring || st.ringAt < 0 || t < st.ringAt) return;
    const u = o.reduced ? 1 : clamp((t - st.ringAt) / 0.6, 0, 1), e = 1 - Math.pow(1 - u, 2);
    const n = Math.max(3, Math.ceil(st.ring.length * e));
    line(ctx, st.ring, 0.25, Math.floor(t * 6), 0, n);
    if (u < 1) { const q = st.ring[n - 1]; drawNib(q.x, q.y, 1, -0.2); }
  }

  // ---- the invitation ------------------------------------------------------------------------------------------------

  function beginInvite(c: Creature) {
    if (invite && invite.c !== c) invite.c.script = false;
    if (arrow && arrow.out < 0) arrow.out = t;
    invite = { c, step: 'meet', at: t, spot: c.x, hopped: false, again: false };
  }

  function endInvite() {
    if (invite) invite.c.script = false;
    invite = null;
    if (arrow && arrow.out < 0) arrow.out = t;
  }

  function stepInvite(en: Env) {
    const v = invite;
    if (!v) return;
    const c = v.c;
    if (c.leaving || c.gone || c !== guide || c.floor !== heroFloor || vt > 40) { endInvite(); return; }
    // Waking up, mid hop, or in someone's hand: carry on from here once it's back on its feet.
    if (!c.standing) return;
    const e = t - v.at;
    const go = (step: typeof v.step) => { v.step = step; v.at = t; };
    switch (v.step) {
      case 'meet':
        c.script = true;
        c.lookAt(YOU, t + 1.1);
        c.say('happy', t + 1.1);
        go('look');
        break;
      case 'look':
        if (e < 1) break;
        {
          // Off to one side of the middle, so the arrow it points with has room and misses the words below.
          const f = heroFloor, mid = (f.x0 + f.x1) / 2, span = f.x1 - f.x0;
          v.spot = clamp(mid + span * 0.18, f.x0 + c.half + 70, f.x1 - c.half - 12);
          c.goal = v.spot;
          // Anyone standing where it's about to point steps aside, to the far side of the arrow.
          for (const o2 of creatures) {
            if (o2 === c || o2.leaving || o2.floor !== f || !o2.awake) continue;
            const clear = v.spot - c.half - 96 - o2.half;
            if (o2.x + o2.half > clear) o2.goal = clamp(clear, f.x0 + o2.half + 6, f.x1 - o2.half - 6);
          }
        }
        go('walk');
        break;
      case 'walk':
        if (Math.abs(c.x - v.spot) > 8 && e < 3) { if (c.goal === null) c.goal = v.spot; break; }
        c.goal = null;
        c.facing = -1;
        go('beckon');
        break;
      case 'beckon':
        if (e < 0.25) break;
        c.lookAt(YOU, t + 1.5);
        c.wave(1.7, t);
        c.say('happy', t + 1.8);
        voice.giggle(c.size);
        arrow = { x: c.x - c.half - 8, y: (c.top + heroFloor.y) / 2 - 4, dir: -1, at: t, out: -1, fy: heroFloor.y };
        go('wait');
        break;
      case 'wait':
        if (!v.hopped && e > 2) { v.hopped = true; c.lookAt({ x: arrow ? arrow.x - 24 : c.x, y: heroFloor.y + 40 }, t + 0.9); c.hop(en, 0, 300); }
        if (!v.again && e > 3.6) { v.again = true; c.lookAt(YOU, t + 1.4); c.wave(1.3, t); }
        // Nobody followed: the first one goes on ahead, as long as the visitor isn't busy drawing.
        if (e > 4.4 && !wentAhead && stages.length && !pen && !pending && t - lastInk > 3) {
          wentAhead = true; aheadWait = true;
          endInvite();
          send(c, stages[0].floor);
          voice.boing(c.size);
          break;
        }
        if (e > 9) endInvite();
        break;
    }
  }

  /** The arrow a creature points with: one confident curve down past the floor, a little bob at the end. */
  function drawArrow() {
    const a = arrow;
    if (!a) return;
    const age = t - a.at, fade = a.out >= 0 ? 1 - clamp((t - a.out) / 0.35, 0, 1) : 1;
    if (fade <= 0) { arrow = null; return; }
    const bob = age > 0.5 && !o.reduced ? Math.sin((age - 0.5) * 5.5) * 3 : 0;
    const sx = a.x, sy = a.y, ex = sx + a.dir * 30, ey = a.fy + (isPhone() ? 30 : 36) + bob;
    const pts = quad(sx, sy, sx + a.dir * 46, sy + (ey - sy) * 0.3, ex, ey, 22);
    const u = o.reduced ? 1 : clamp(age / 0.42, 0, 1);
    const n = Math.max(3, Math.ceil(pts.length * (1 - Math.pow(1 - u, 2))));
    ctx.save();
    ctx.globalAlpha = fade;
    line(ctx, stroke(pts.slice(0, n), 3.3, 0.95, 0.45), 0.3, Math.floor(t * 7));
    if (u >= 1) {
      const [px, py] = pts[pts.length - 3], tl = Math.hypot(ex - px, ey - py) || 1, tx = (ex - px) / tl, ty = (ey - py) / tl;
      for (const sgn of [-1, 1]) {
        const ang = Math.PI - 0.62 * sgn, hx = tx * Math.cos(ang) - ty * Math.sin(ang), hy = tx * Math.sin(ang) + ty * Math.cos(ang);
        const arm: [number, number][] = [0, 1, 2, 3, 4].map(i => [ex + hx * 13 * (i / 4), ey + hy * 13 * (i / 4)]);
        line(ctx, stroke(arm, 3.3, 0.7, 1), 0.3, Math.floor(t * 7) + sgn);
      }
    }
    ctx.restore();
  }

  function goodbye(g: Creature, env: Env) {
    g.script = true;
    g.lookAt(env.you, t + 2.6);
    later(0.35, () => { if (g.floor === endFloor) { g.wave(2.2, t); g.say('happy', t + 2.4); voice.giggle(g.size); } });
    later(2.8, () => { if (g.floor === endFloor) g.script = false; });
    if (!bye) bye = { at: t, shown: false };
    later(1.2, () => showCard(g));
    later(1.9, () => {
      const b = o.card;
      if (!b || b.hidden || g.floor !== endFloor || !g.standing) return;
      const r = rectOf(b);
      g.pointAt({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, t + 1.8);
      g.talk('heart', 1.6, t + 0.2, voice);
    });
  }

  // ---- the card -----------------------------------------------------------------------------------------------------

  let cardFor: Creature | null = null;
  function showCard(g: Creature) {
    const btn = o.card;
    if (!btn || cardFor === g) return;
    cardFor = g;
    try {
      const thumb = card(g, SCRIBBLE.card, 360, 450, !!cat);
      const img = btn.querySelector('img');
      if (img) img.src = thumb.toDataURL('image/png');
      btn.hidden = false;
      requestAnimationFrame(() => btn.classList.add('in'));
    } catch { /* a canvas that can't be read; no card */ }
  }

  async function saveCard() {
    const g = cardFor;
    if (!g) return;
    const cv = card(g, SCRIBBLE.card, 1080, 1350, !!cat);
    const blob: Blob | null = await new Promise(r => cv.toBlob(r, 'image/png'));
    if (!blob) return;
    const file = new File([blob], 'my-creature.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (isPhone() && nav.canShare?.({ files: [file] })) await nav.share({ files: [file] });
      else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'my-creature.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch { /* the visitor closed the share sheet */ }
    // It joins the parade, and is still in it next time.
    saveMine(g.drawing);
    joinParade(g.drawing, 0.96);
    o.card?.classList.add('saved');
  }
  const onCard = () => void saveCard();
  o.card?.addEventListener('click', onCard);

  // ---- the parade ----------------------------------------------------------------------------------------------------

  /** Someone joins the parade, `at` of the way along it (0 is the left end). */
  function joinParade(lines: Pt[][], at: number) {
    if (!paradeFloor) return;
    const f = paradeFloor;
    const x = f.x0 + at * (f.x1 - f.x0);
    const c = new Creature(lines.map(l => l.map(p => ({ x: p.x + x, y: p.y + f.y - 80, w: p.w }))), f);
    c.kGoal = Math.min(c.kGoal, (f.fit ?? 56) / c.size); c.k = c.kGoal;
    c.parade = true;
    c.wake(t);
    parade.push(c);
  }

  // ---- stages -------------------------------------------------------------------------------------------------------

  function open(st: StageRec) {
    if (st.openAt >= 0) return;
    st.openAt = o.reduced ? t - 10 : t;
    st.el.classList.add('open');
  }

  // ---- the loop ------------------------------------------------------------------------------------------------------

  const YOU = { x: 0, y: 0 };
  const env = (): Env => ({
    t,
    eye: pen ? { x: lastPen.x, y: lastPen.y } : example && !example.done && example.pen ? { x: nib.x, y: nib.y } : eye && t < eye.until ? eye : hover.on ? hover : null,
    rush: pen ? rush : null,
    reduced: o.reduced,
    sounds: voice,
    crowd: creatures,
    you: YOU,
  });

  function tick(now: number) {
    raf = 0;
    if (!running) return;
    const s = now / 1000;
    const dt = last ? Math.min(1 / 30, Math.max(0, s - last)) : 1 / 60;
    last = s; t += dt;
    anchor();
    for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); }
    if (pending && t - pending.at > (isPhone() ? 0.62 : 0.5)) finalize();
    stepExample();

    // Stages open as they come into view, whether or not anything has landed on them yet.
    for (const st of stages) if (st.openAt < 0 && st.pic.y < vt + vh * 0.86) open(st);

    const en = env();
    stepInvite(en);
    steer();
    for (const c of creatures) c.update(dt, en);
    for (let i = creatures.length - 1; i >= 0; i--) if (creatures[i].gone) { if (creatures[i] === guide) guide = null; creatures.splice(i, 1); }
    if (!guide) guide = [...creatures].reverse().find(c => c.awake && !c.leaving) ?? null;
    if (paradeFloor && Math.abs(paradeFloor.y - (vt + vh / 2)) < vh * 1.5) { const pe = { ...en, crowd: parade }; for (const c of parade) c.update(dt, pe); }
    arrivals(en);
    for (const st of stages) if (st.play && !st.play.done) st.play.step(t, en);
    if (grabbed) grabbed.c.drag(grabbed.c.held!.tx, grabbed.c.held!.ty, dt);
    if (cat && guide) cat.update(dt, t, guide, voice);
    idle();

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
    raf = requestAnimationFrame(tick);
  }

  const seen = (y0: number, y1: number) => y1 > top - 40 && y0 < top + H + 40;

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
    if (!pattern) { pattern = ctx.createPattern(tile, 'repeat'); TONE.texture = pattern; }
    ctx.fillStyle = INK;

    if (seen(heroFloor.y - 10, heroFloor.y + 10)) line(ctx, heroLine);
    // The stages: a floor each, and a frame drawn round the picture when it opens.
    for (const st of stages) {
      if (!seen(st.top - 200, st.bottom + 40)) continue;
      line(ctx, st.ground);
      if (st.openAt >= 0) {
        const u = clamp((t - st.openAt) / 0.8, 0, 1), e = 1 - Math.pow(1 - u, 3);
        let left = e * st.frameLen;
        for (const l of st.frame) { if (left <= 0) break; const n = Math.min(l.length, Math.ceil(left)); line(ctx, l, 0, 0, 0, n); left -= l.length; }
      }
    }
    if (endFloor && seen(endFloor.y - 10, endFloor.y + 10)) line(ctx, endLine);
    if (paradeFloor && seen(paradeFloor.y - 120, paradeFloor.y + 10)) { line(ctx, paradeLine); for (const c of parade) c.draw(ctx, t, o.reduced); }

    // A sketch waiting to be inked, and the line being drawn right now: pencil grey until it comes alive.
    ctx.save();
    if (cartoon) ctx.globalAlpha = 0.62;
    if (pending) for (const l of pending.lines) line(ctx, l);
    if (example?.pen && !example.done) line(ctx, example.pen.pts, 0, 0, 5);
    if (pen) line(ctx, pen.pts, 0, 0, 5);
    ctx.restore();

    for (const st of stages) if (st.play && seen(st.top - 300, st.bottom + 60)) st.play.draw(ctx, t);
    for (const st of stages) if (st.ringAt >= 0 && seen(st.top - 40, st.bottom + 40)) drawRing(st);
    for (const st of stages) if (st.tickAt >= 0 && seen(st.top - 40, st.bottom + 40)) drawTick(st);
    if (arrow) drawArrow();
    // easeprint's gift: an echo of the guide, a beat behind it.
    if (guide?.echo && !o.reduced && seen(guide.y - 300, guide.y + 300)) guide.drawEcho(ctx, t, 0.3, -(guide.half * 2 + 14) * guide.fx, 0.22);
    for (const c of creatures) if (c !== grabbed?.c && seen(c.y - 300, c.y + 300)) c.draw(ctx, t, o.reduced);
    if (cat && guide && seen(cat.y - 120, cat.y + 20)) cat.draw(ctx, t, guide);
    if (grabbed) grabbed.c.draw(ctx, t, o.reduced);

    // Rough ink has specks of paper showing through it. Inked lines are solid.
    if (!cartoon && pattern) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, top, W, H);
      ctx.restore();
    }

    // The pen goes on top of everything: it's an object, not ink. Resting by the name it blinks like a cursor,
    // until the visitor has picked it up once.
    const blink = nib.mode === 'park' && !touched ? ((t % 1.06) < 0.6 ? 1 : 0) : 1;
    const drawingExample = !!example && !example.done;
    const showHand = nib.mode !== 'hand' || drawingExample || (hover.on && !hover.over) || pen;
    if (nib.mode !== 'hide' && showHand && seen(nib.y - 30, nib.y + 30)) drawNib(nib.x, nib.y, nib.alpha * blink, nib.tilt);
  }

  function start() {
    if (running || document.hidden) return;
    running = true; last = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  root.classList.add('sc-live');
  layout();
  nib.x = parkAt.x; nib.y = parkAt.y;
  const mine = loadMine();
  const crowd = [...samples().slice(0, isPhone() ? 4 : 6), ...(mine ? [mine] : [])];
  crowd.forEach((l, i) => joinParade(l, (i + 0.5) / crowd.length));
  let relayout = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(relayout); relayout = requestAnimationFrame(layout); });
  ro.observe(root);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  const onResize = () => { cancelAnimationFrame(relayout); relayout = requestAnimationFrame(layout); };
  window.addEventListener('resize', onResize);
  // Pictures that load late move the floors.
  const imgs = Array.from(root.querySelectorAll('img'));
  for (const img of imgs) if (!img.complete) img.addEventListener('load', onResize, { once: true });
  // ---- remembering ----------------------------------------------------------------------------------------------

  function remember() { if (guide && guide.awake && !guide.leaving) saveGuide(guide, !!cat); }

  /** The guide from before, back again. Coming back from a project page, it drops in where you are. On a new visit,
   *  it's asleep on the sheet, and wakes up when you arrive. */
  function restore(sv: Saved, awake: boolean) {
    const f = awake ? reading() ?? heroFloor : heroFloor;
    const x = f === heroFloor ? heroFloor.x0 + (heroFloor.x1 - heroFloor.x0) * (W < 640 ? 0.6 : 0.58) : (f.x0 + f.x1) / 2;
    const c = new Creature(placed(sv, x, f.y - 60), f, sv.kind);
    c.setFloor(f);
    c.wearAll(sv.keeps);
    c.echo = sv.echo;
    for (const st of stages) if (sv.keeps.includes(GIFT[st.id] as Keep) || (GIFT[st.id] === 'cat' && sv.cat) || (GIFT[st.id] === 'echo' && sv.echo)) c.seen.add(st.id);
    c.appear(t);
    creatures.push(c);
    guide = c;
    if (sv.cat) cat = new Cat(x - 50, awake ? vt - 80 : f.y, f);
    if (awake) {
      c.y = vt - 140;
      later(0.9, () => { c.talk('heart', 1.4, t, voice); c.wave(1.4, t); });
      return;
    }
    c.y = f.y - 40;
    c.sleep(true, t);
    // It wakes with a start (oh! you're back), then it's all hearts and waving.
    const rise = () => {
      wakeUp = null;
      if (!c.asleep || guide !== c) return;
      c.sleep(false, t, voice);
      c.lookAt(YOU, t + 2.4);
      c.talk('bang', 0.7, t + 0.05, voice);
      later(0.35, () => { if (c.standing) c.hop(env(), 0, 300); });
      later(1.15, () => { c.talk('heart', 1.5, t, voice); c.wave(1.5, t); voice.giggle(c.size); });
      later(2.9, () => { if (guide === c && c.floor === heroFloor && vt < 40) beginInvite(c); });
    };
    // A moment's nap first, so you catch it asleep, even if the mouse is already moving.
    later(1.2, () => { if (c.asleep) wakeUp = rise; });
    later(3, rise);
  }
  let wakeUp: (() => void) | null = null;

  /** Nobody about: the guide nods off. Anything at all wakes it. */
  function idle() {
    const g = guide;
    if (!g) return;
    const quiet = t - lastInput > 16 && g.standing && !g.script && !invite && !grabbed && !pen && !g.asleep;
    if (quiet && !o.reduced) { g.sleep(true, t); dozed = true; }
    // Standing by a story it has pointed at, it reminds you now and then.
    if (!g.asleep && g.standing && !g.script && t - lastNudge > 11 && t - lastInput < 8) {
      const st = stages.find(s => s.floor === g.floor && (s.ringAt >= 0 || s.tickAt >= 0));
      if (st) pointTheWay(st, g);
    }
  }
  function poke() {
    lastInput = t;
    if (wakeUp) { const f = wakeUp; wakeUp = null; f(); return; }
    if (dozed && guide?.asleep) { guide.sleep(false, t, voice); dozed = false; }
  }
  const onInput = () => poke();
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const) window.addEventListener(ev, onInput, { passive: true });

  // What the visitor points at, it looks at. A story link or a picture next to it gets it excited.
  let lastHop = -10;
  const onOver = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = (e.target as Element).closest?.('.go, [data-pic], .sc-skip, .sc-card, .logos a, .mail');
    const g = guide;
    if (!el || !g || !g.awake || g.asleep) return;
    const r = rectOf(el);
    g.lookAt({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, t + 1.6);
    const st = el.closest('[data-stage]');
    if (st && stages.find(s => s.el === st)?.floor === g.floor && g.standing && !g.script && t - lastHop > 2.2) {
      lastHop = t;
      g.hop(env(), 0, 280);
      g.talk('bang', 0.9, t, voice);
    }
    if (el.classList.contains('sc-card') && g.floor === endFloor && t - lastHop > 2.2) { lastHop = t; g.talk('heart', 1.2, t, voice); }
  };
  root.addEventListener('pointerover', onOver);
  // Off to a project: write it down now, so it's there when the page opens.
  const onLeave = (e: Event) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="/projects/"]');
    if (a) { remember(); leftFor(a.pathname); }
  };
  root.addEventListener('pointerdown', onLeave, true);
  const onHide = () => { if (document.hidden) remember(); };
  document.addEventListener('visibilitychange', onHide);

  start();
  const saved = loadGuide(), again = visiting();
  if (saved) later(0.06, () => { layout(); restore(saved, again); });
  else later(o.reduced ? 0.4 : 1.1, startExample);

  return {
    voice,
    destroy() {
      remember();
      stop(); ro.disconnect();
      for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const) window.removeEventListener(ev, onInput);
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerdown', onLeave, true);
      document.removeEventListener('visibilitychange', onHide);
      root.classList.remove('sc-live');
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      o.card?.removeEventListener('click', onCard);
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
