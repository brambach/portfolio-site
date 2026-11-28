import { INK, clamp, line, noise, quad, rand, ring, stroke, type Pt } from './ink';
import { read, type Kind, type Reading } from './shape';
import { STYLE, ink } from './clean';
import { HELD, arm, back, badge, bubble, headband, held, nightcap, pencil, satchel, sparkle, zzz, type Ink, type Keep, type Pic } from './gear';

export type { Keep, Pic };

/* A creature: a doodle that came to life. It keeps the visitor's own lines as its body and grows what it needs from
   the page's own pen: legs, eyes, sometimes a mouth, a snail's foot. Everything it does is a few springs and some
   gravity, and the same few rules of cartoon motion: it squashes when it lands and stretches when it leaps, it
   crouches before it jumps, it overshoots and settles, it blinks, it looks at whatever moves, and its outline never
   quite holds still. How its line was drawn decides how it gets around (shape.ts). */

/** Somewhere to stand. `fit` caps a creature's size there (a project's stage is smaller than the sheet). */
export type Floor = { x0: number; x1: number; y: number; fit?: number; id?: string };
type XY = { x: number; y: number };

export interface Sounds { pop(size: number): void; boing(size: number): void; land(size: number): void; giggle(size: number): void; squeak(size: number): void; babble?(size: number, syllables: number): void }

export type Env = {
  t: number;
  /** Where something interesting is: the pen, a finger, the mouse. Creatures watch it. */
  eye: XY | null;
  /** The pen moving fast nearby. Creatures that are too close jump out of the way. */
  rush: (XY & { v: number }) | null;
  reduced: boolean;
  sounds: Sounds | null;
  crowd: Creature[];
  /** The visitor's eyes, roughly: where a creature looks when it looks "at you". */
  you: XY;
};

export type Mood = 'calm' | 'happy' | 'surprised' | 'dizzy' | 'sleepy' | 'cold';
type State = 'drawn' | 'wake' | 'ground' | 'air' | 'held' | 'leave' | 'leap';
type Leg = { hx: number; hy: number; fx: number; fy: number; planted: boolean; from: number; to: number; u: number; dur: number; group: number; front: boolean };

const G = 2300;
const TAU = Math.PI * 2;
const ease = (u: number) => u * u * (3 - 2 * u);

/** How each kind gets around. Speeds are px/s, legs are a multiple of the doodle's size. */
const KIND: Record<Kind, { legs: number; leg: [number, number, number]; speed: number; hop?: [number, number]; knee: 1 | -1 }> = {
  walker: { legs: 2, leg: [0.36, 16, 46], speed: 72, knee: 1 },
  stilts: { legs: 2, leg: [0.62, 26, 84], speed: 56, knee: 1 },
  bug: { legs: 6, leg: [0.24, 10, 26], speed: 125, knee: 1 },
  bouncer: { legs: 2, leg: [0.2, 9, 22], speed: 150, hop: [560, 150], knee: 1 },
  hopper: { legs: 2, leg: [0.42, 16, 44], speed: 170, hop: [480, 190], knee: -1 },
  flea: { legs: 2, leg: [0.6, 8, 12], speed: 210, hop: [760, 210], knee: -1 },
  fuzz: { legs: 2, leg: [0.26, 10, 28], speed: 150, knee: 1 },
  worm: { legs: 0, leg: [0, 0, 0], speed: 42, knee: 1 },
  snail: { legs: 0, leg: [0, 0, 0], speed: 17, knee: 1 },
};

let next = 1;

export class Creature {
  readonly id = next++;
  readonly kind: Kind;
  readonly reading: Reading;
  /** The visitor's lines, around the creature's middle. The first is the main one. */
  readonly lines: Pt[][];
  /** Lines the visitor drew as the creature's own eyes: they blink, and no eyes are added. */
  readonly face: number[] = [];
  /** Extra parts the page draws for it (a snail's foot). */
  readonly extra: Pt[][] = [];
  readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number;
  readonly w: number; readonly h: number; readonly size: number;
  readonly base: number;
  readonly closed: boolean;

  x: number; y: number; vx = 0; vy = 0; rot = 0; vr = 0;
  /** Its scale: a huge doodle shrinks a little as it wakes so it has room to move. */
  k = 1; kGoal = 1;
  /** Squash and stretch: below 0 squashed flat, above 0 stretched tall. */
  sq = 0; sqv = 0;
  /** Its legs giving under it when it lands. */
  dip = 0; dipv = 0;
  /** Facing: which way it's walking. `fx` turns over to it like a sheet of paper. */
  facing = 1; fx = 1;
  jelly = 0;
  legs: Leg[] = [];
  legLen = 0; legOut = 0; legGoal = 1;
  readonly knee: 1 | -1;
  eyes: XY[] = []; er = 6; eyePop = 0; eyePopV = 0;
  /** Where the pupils are, as an offset in the eye. */
  px = 0; py = 0;
  blink = 1; private blinkAt = 0; private blinkT = -1; private doubleBlink = false;
  mood: Mood = 'calm'; moodUntil = 0;
  state: State = 'drawn';
  /** Something else is directing it (a project's little scene): it doesn't wander off on its own. */
  script = false;
  /** Walking faster than it likes to, for a chase. */
  hurry = 1;
  shiverUntil = 0;
  /** In a parade: walks left forever, coming back round from the right. */
  parade = false;
  private leap: { fx: number; fy: number; tx: number; ty: number; at: number; dur: number; h: number; floor: Floor } | null = null;
  private stare: XY | null = null; private stareUntil = 0;
  private homeK = 1;
  /** The visitor's sketch, point for point with `lines`, while it melts into the inked line. */
  private rough: Pt[][] | null = null;
  private inkedAt = -1;
  /** Where it's been over the last moment, for an echo that copies its moves a beat late. */
  private past: { t: number; x: number; y: number; sq: number; rot: number; fx: number; dip: number; feet: number[] }[] = [];
  born = 0;
  floor: Floor;
  goal: number | null = null; wait = 0; private cooldown = 0; private crouch = -1; private rolled = 0;
  phase = 0; private gaze: XY | null = null; private gazeUntil = 0; private waving = 0;
  held: { dx: number; dy: number; tx: number; ty: number; vx: number; vy: number } | null = null;
  trail: { x: number; y: number; t: number }[] = [];
  gone = false;
  readonly seed = Math.random() * 100;
  /** What it has picked up on the way: a hat, something behind its ear, something in its hand, what it held before
   *  (in a satchel), a sticker. */
  gear: { head: 'nightcap' | 'headband' | null; ear: boolean; hand: Keep | null; bag: Keep[]; badge: boolean } = { head: null, ear: false, hand: null, bag: [], badge: false };
  private got: Keep[] = [];
  private gotAt = -10; private gotWhat: Keep | null = null;
  /** Projects it has been given something by, so each gives only once. */
  readonly seen = new Set<string>();
  /** A faint copy of itself that follows a beat behind (easeprint's gift). */
  echo = false;
  /** Asleep: eyes shut, legs folded, Zs. */
  asleep = false;
  private pointing: XY | null = null; private pointUntil = 0;
  private bubbleOf: { pic: Pic; at: number; until: number } | null = null;
  private ghost = false;
  /** Where things go on it, in its own coordinates: the top of its head, its front and back at shoulder height, its
   *  brow, a spot for a sticker, a spot for a satchel. */
  private crown: XY = { x: 0, y: 0 }; private front: XY = { x: 0, y: 0 }; private rear: XY = { x: 0, y: 0 };
  private brow: XY[] = []; private sticker: XY = { x: 0, y: 0 }; private bagAt: XY = { x: 0, y: 0 }; private earAt: XY = { x: 0, y: 0 };
  /** A little personality. */
  readonly p = { speed: rand(0.8, 1.25), eye: rand(0.9, 1.25), pupil: rand(0.4, 0.56), blink: rand(0.7, 1.4), curious: rand(0.3, 1), bounce: rand(0.85, 1.15) };

  constructor(world: Pt[][], floor: Floor, kind?: Kind) {
    this.floor = floor;
    const order = world.map((l, i) => ({ l, i, len: l.length })).sort((a, b) => b.len - a.len);
    const main = order[0].l;
    this.reading = read(main);
    this.kind = kind ?? this.reading.kind;
    this.closed = this.reading.closed;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, wsum = 0, wn = 0;
    for (const l of world) for (const p of l) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); wsum += p.w; wn++; }
    this.base = wn ? wsum / wn : 3;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    this.x = cx; this.y = cy;
    let lines = [main, ...order.slice(1).map(o => o.l)].map(l => l.map(p => ({ x: p.x - cx, y: p.y - cy, w: p.w })));

    // A worm lies down along its length: turn its lines so the long way is level, and start it at the angle it was
    // drawn, so it visibly flops over.
    if (this.kind === 'worm') {
      let a = this.reading.axis;
      if (a > Math.PI / 2) a -= Math.PI; if (a < -Math.PI / 2) a += Math.PI;
      const c = Math.cos(-a), s = Math.sin(-a);
      lines = lines.map(l => l.map(p => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c, w: p.w })));
      this.rot = a;
    }
    // Inked: the sketch is redrawn as one clean, bold line (clean.ts), and melts into it as the creature wakes.
    if (STYLE === 'cartoon') {
      const inked = ink(lines, Math.max(maxX - minX, maxY - minY, 4), this.kind === 'hopper');
      this.rough = inked.rough;
      lines = inked.lines;
      this.base = inked.weight;
    }
    this.lines = lines;
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (const l of lines) for (const p of l) { a = Math.min(a, p.x); c = Math.max(c, p.x); b = Math.min(b, p.y); d = Math.max(d, p.y); }
    this.minX = a; this.minY = b; this.maxX = c; this.maxY = d;
    this.w = c - a; this.h = d - b; this.size = Math.max(this.w, this.h, 4);

    // Small lines drawn inside the top of the main shape are its own eyes.
    const mainBox = box(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const bx = box(lines[i]);
      const small = Math.max(bx.w, bx.h) < Math.max(mainBox.w, mainBox.h) * 0.32;
      const inside = bx.cx > mainBox.x0 && bx.cx < mainBox.x1 && bx.cy > mainBox.y0 && bx.cy < mainBox.y0 + mainBox.h * 0.7;
      if (small && inside && this.closed) this.face.push(i);
    }

    const spec = KIND[this.kind];
    this.knee = spec.knee;
    const room = Math.max(120, (floor.x1 - floor.x0) * 0.42);
    this.kGoal = this.kind === 'flea' ? clamp(16 / this.size, 1, 2.2) : Math.min(1, room / this.size, 230 / this.size);
    this.homeK = this.kGoal;
    this.legLen = spec.legs ? clamp(this.size * spec.leg[0], spec.leg[1], spec.leg[2]) / Math.min(1, this.kGoal) : 0;
    if (this.kind === 'flea') this.legLen = spec.leg[1] / this.kGoal;
    this.er = (STYLE === 'cartoon' ? clamp(this.size * 0.105, 5.2, 13.5) : clamp(this.size * 0.085, 4.2, 11)) * this.p.eye / Math.min(1, this.kGoal);
    if (this.kind === 'flea') this.er = 4 / this.kGoal;

    if (this.kind === 'snail') this.makeSnail();
    this.placeLegs(spec.legs);
    this.placeEyes();
    this.placeGear();
  }

  /** Where a hat, a hand, a sticker and a satchel go, from the shape of its main line. */
  private placeGear() {
    const main = this.lines[0], { minX, minY, maxX, maxY, w, h } = this;
    let top = main[0];
    for (const p of main) if (p.y < top.y - 0.5 || (Math.abs(p.y - top.y) <= 0.5 && Math.abs(p.x) < Math.abs(top.x))) top = p;
    // The crown: the top of the head, nudged toward the middle so a hat sits square.
    this.crown = { x: top.x * 0.6, y: top.y + 1 };
    const band = (lo: number, hi: number, pick: (a: Pt, b: Pt) => boolean) => {
      let best: Pt | null = null;
      for (const p of main) if (p.y >= minY + h * lo && p.y <= minY + h * hi && (!best || pick(p, best))) best = p;
      return best;
    };
    const f = band(0.36, 0.7, (a, b) => a.x > b.x), r = band(0.36, 0.7, (a, b) => a.x < b.x);
    this.front = f ? { x: f.x - 1, y: f.y } : { x: maxX, y: minY + h * 0.5 };
    this.rear = r ? { x: r.x + 1, y: r.y } : { x: minX, y: minY + h * 0.5 };
    this.brow = main.filter(p => p.y < minY + h * 0.17).sort((a, b) => a.x - b.x).map(p => ({ x: p.x, y: p.y + h * 0.07 }));
    if (this.brow.length > 24) this.brow = this.brow.filter((_, i) => i % Math.ceil(this.brow.length / 24) === 0);
    this.sticker = { x: minX + w * 0.68, y: minY + h * 0.7 };
    this.bagAt = { x: this.rear.x + w * 0.06, y: Math.min(maxY - h * 0.16, this.rear.y + h * 0.22) };
    this.earAt = { x: minX + w * 0.66, y: minY + h * 0.16 };
    if (!this.closed) { this.sticker = { x: this.crown.x, y: this.crown.y - 6 }; this.bagAt = { x: this.crown.x - w * 0.25, y: this.crown.y - 4 }; }
  }

  /** It has arms when it needs them: to wave, to point, to hold something. */
  get armed() { return this.kind !== 'worm' && this.kind !== 'snail' && this.kind !== 'flea'; }

  /** Given a keepsake: it goes where it belongs, with a little pop. */
  give(k: Keep, t: number) {
    const g = this.gear;
    if (k === 'check') g.badge = true;
    else if (k === 'nightcap' || k === 'headband') g.head = k;
    else if (k === 'pencil') g.ear = true;
    else if (HELD.includes(k)) {
      if (g.hand && g.hand !== k && !g.bag.includes(g.hand)) g.bag.push(g.hand);
      g.hand = k;
    }
    if (!this.got.includes(k)) this.got.push(k);
    this.gotAt = t; this.gotWhat = k;
    this.jelly = Math.max(this.jelly, 0.5);
    this.sqv += 3;
  }
  /** Everything it was carrying last time, put back on without any fuss. */
  wearAll(keeps: Keep[]) { for (const k of keeps) this.give(k, -10); this.gotWhat = null; this.jelly = 0; this.sqv = 0; }
  get keeps() { return [...this.got]; }

  /** Points at something on the page until `until`, turning to face it and looking at it. */
  pointAt(p: XY | null, until: number) {
    this.pointing = p; this.pointUntil = until;
    if (!p) return;
    this.lookAt(p, until);
    if (Math.abs(p.x - this.x) > 10) this.facing = Math.sign(p.x - this.x);
  }

  /** Says something with a little picture in a bubble, and a babble. */
  talk(pic: Pic, seconds: number, t: number, sounds?: Sounds | null) {
    this.bubbleOf = { pic, at: t, until: t + seconds };
    sounds?.babble?.(this.size * this.k, pic === 'heart' ? 3 : pic === 'what' ? 2 : 4);
  }

  /** Nods off, or wakes up with a start. */
  sleep(on: boolean, t: number, sounds?: Sounds | null) {
    if (on === this.asleep) return;
    this.asleep = on;
    if (on) { this.say('sleepy', t + 9999); this.goal = null; this.legGoal = 0.3; this.pointing = null; return; }
    this.say('surprised', t + 0.7);
    this.legGoal = 1;
    this.talk('bang', 1, t, sounds);
    this.sqv += 4; this.jelly = Math.max(this.jelly, 0.4);
    if (this.state === 'ground') { this.vy = -300; this.state = 'air'; }
  }

  /** Back again, already alive: no sketch, no waking up, just there, about to land. */
  appear(t: number) {
    this.state = 'air';
    this.born = t - 5; this.inkedAt = -1; this.rough = null;
    this.eyePop = 1; this.legOut = 1; this.popped = true; this.blinkAt = t + 0.8;
    this.vy = 0; this.vx = 0;
  }

  // ---- building ------------------------------------------------------------------------------------------------

  private placeLegs(n: number) {
    if (!n) return;
    const spread = this.kind === 'stilts' ? 0.34 : this.kind === 'bug' ? 0.78 : this.kind === 'flea' ? 0.5 : this.w > this.h * 1.35 && this.kind === 'walker' ? 0.7 : 0.46;
    const count = this.kind === 'walker' && this.w > this.h * 1.35 ? 4 : n;
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0 : i / (count - 1) - 0.5;
      const hx = u * this.w * spread;
      // The hip sits on the lowest bit of line near that x.
      let hy = -Infinity;
      const near = this.w * 0.07 + 2;
      for (const l of this.lines) for (const p of l) if (Math.abs(p.x - hx) < near && p.y > hy) hy = p.y;
      if (hy === -Infinity) hy = this.maxY;
      this.legs.push({ hx, hy: hy - 1, fx: 0, fy: 0, planted: false, from: 0, to: 0, u: 0, dur: 0.15, group: count === 6 ? (i % 2) : i % 2, front: u > 0 });
    }
  }

  private placeEyes() {
    if (this.face.length) return;
    const r = this.er, gap = r * 2.15;
    const main = this.lines[0];
    if (this.kind === 'snail') return;
    if (this.kind === 'worm' || !this.closed) {
      // On top of the head end (the right end; the creature faces right as drawn).
      let hx = this.maxX, hy = 0, best = -Infinity;
      for (const p of main) if (p.x > best) { best = p.x; hy = p.y; }
      // The top of the line near the head.
      let top = hy;
      for (const p of main) if (p.x > hx - r * 3.5 && p.y < top) top = p.y;
      const ex = hx - r * 1.6;
      this.eyes = [{ x: ex - gap / 2, y: top - r * 0.75 }, { x: ex + gap / 2, y: top - r * 0.95 }];
      return;
    }
    // Inside the shape: the spot in its upper half where a pair of eyes fits best, a little toward the front.
    const poly = main;
    let bestScore = -Infinity, bx = 0, by = this.minY + this.h * 0.35;
    for (let iy = 0; iy <= 8; iy++) {
      const y = this.minY + this.h * (0.18 + iy * 0.05);
      for (let ix = -6; ix <= 6; ix++) {
        const x = ix * this.w * 0.04;
        const a = { x: x - gap / 2, y }, b = { x: x + gap / 2, y };
        if (!inside(poly, a) || !inside(poly, b)) continue;
        const clear = Math.min(edge(poly, a), edge(poly, b));
        if (clear < r * 1.05) continue;
        const score = Math.min(clear, r * 2.2) - Math.abs(y - (this.minY + this.h * 0.3)) * 0.25 + x * 0.06;
        if (score > bestScore) { bestScore = score; bx = x; by = y; }
      }
    }
    if (bestScore === -Infinity) {
      // Too thin for eyes inside: they sit on top, peeking over.
      let top = Infinity, tx = 0;
      for (const p of main) if (p.y < top) { top = p.y; tx = p.x; }
      this.eyes = [{ x: tx - gap / 2, y: top - r * 0.55 }, { x: tx + gap / 2, y: top - r * 0.7 }];
      return;
    }
    const tilt = rand(-0.12, 0.12) * r;
    this.eyes = [{ x: bx - gap / 2, y: by + tilt }, { x: bx + gap / 2, y: by - tilt }];
  }

  private makeSnail() {
    const { minX, maxX, maxY, w, h } = this;
    const lift = h * 0.1, bw = this.base * 1.05;
    const foot = catmull([
      [minX + w * 0.28, maxY - h * 0.02], [minX - w * 0.2, maxY + lift * 0.9], [minX + w * 0.2, maxY + lift * 1.15],
      [maxX + w * 0.2, maxY + lift * 1.1], [maxX + w * 0.52, maxY + lift * 0.2], [maxX + w * 0.46, maxY - h * 0.28],
      [maxX + w * 0.2, maxY - h * 0.3], [maxX - w * 0.04, maxY - h * 0.12],
    ], 6);
    this.extra.push(stroke(foot, bw, 0.5, 0.6));
    // Lift the shell so it sits on the foot.
    for (const l of this.lines) for (const p of l) p.y -= lift * 0.35;
  }

  // ---- the life ------------------------------------------------------------------------------------------------

  wake(t: number) {
    this.state = 'wake';
    this.inkedAt = t;
    this.born = t;
    this.jelly = 1;
    this.sqv = 3.2;
    this.blinkAt = t + 1.4;
  }

  /** Where the bottom of its feet are, below its middle, when standing. */
  private stand() {
    const legs = this.legs.length ? this.legLen * 0.9 * this.legOut : 0;
    // A worm's wave would dip under the floor: it lies on top of it.
    const lift = this.kind === 'worm' ? this.size * 0.062 : 0;
    return (this.maxY + legs + lift) * this.k;
  }

  private halfW() { return (this.w / 2) * this.k; }

  hit(x: number, y: number, pad: number) {
    if (this.state === 'drawn' || this.gone) return false;
    const hw = this.halfW() + pad, top = (this.minY - this.er) * this.k - pad, bottom = this.stand() + pad;
    return x > this.x - hw && x < this.x + hw && y > this.y + top && y < this.y + bottom;
  }

  boop(env: Env) {
    this.say('happy', env.t + 1.1);
    this.sqv -= 6;
    if (this.state === 'ground') { this.vy = -360 * this.p.bounce; this.state = 'air'; }
    this.jelly = Math.max(this.jelly, 0.6);
    env.sounds?.giggle(this.size * this.k);
  }

  grab(x: number, y: number, env: Env) {
    this.state = 'held';
    this.held = { dx: this.x - x, dy: this.y - y, tx: x, ty: y, vx: 0, vy: 0 };
    this.say('surprised', env.t + 99);
    this.jelly = 0.8;
    env.sounds?.squeak(this.size * this.k);
  }

  drag(x: number, y: number, dt: number) {
    if (!this.held) return;
    const h = this.held;
    const vx = (x - h.tx) / Math.max(dt, 1 / 240), vy = (y - h.ty) / Math.max(dt, 1 / 240);
    h.vx += (vx - h.vx) * 0.35; h.vy += (vy - h.vy) * 0.35;
    h.tx = x; h.ty = y;
  }

  drop(env: Env) {
    if (!this.held) return;
    this.vx = clamp(this.held.vx, -2600, 2600);
    this.vy = clamp(this.held.vy, -2600, 2600);
    this.held = null;
    this.state = 'air';
    this.vr = this.vx * 0.004;
    this.say('surprised', env.t + 0.5);
  }

  leave() {
    this.state = this.state === 'held' ? 'air' : this.state;
    this.goal = this.x < (this.floor.x0 + this.floor.x1) / 2 ? this.floor.x0 - 400 : this.floor.x1 + 400;
    this.gone = false;
    this.leaving = true;
  }
  leaving = false;

  wave(seconds: number, t: number) { this.waving = t + seconds; }

  say(m: Mood, until: number) { this.mood = m; this.moodUntil = until; }

  lookAt(p: XY | null, until: number) { this.stare = p; this.stareUntil = until; }

  shiver(until: number) { this.shiverUntil = until; this.say('cold', until); }

  hop(env: Env, dir = 0, v = 330) { if (this.state === 'ground') this.jump(env, dir, v); }

  /** Off to another floor in one big leap: a crouch, an arc, a landing. */
  leapTo(floor: Floor, x: number, t: number) {
    if (this.state === 'held' || this.state === 'drawn' || this.state === 'wake') return false;
    this.kGoal = floor.fit ? Math.min(this.homeK, floor.fit / this.size) : this.homeK;
    const ty = floor.y - this.stand();
    const up = this.y - ty;
    const dur = clamp(0.5 + Math.abs(up) / 1900, 0.55, 1.15);
    const h = up > 0 ? up * 0.55 + 60 : 70;
    this.leap = { fx: this.x, fy: this.y, tx: x, ty, at: t, dur, h, floor };
    this.state = 'leap';
    this.goal = null;
    this.facing = Math.sign(x - this.x) || this.facing;
    this.sqv += 5;
    this.say('happy', t + dur);
    return true;
  }

  /** Stands on a floor from now on, at the size that floor allows. */
  setFloor(f: Floor) {
    this.floor = f;
    this.kGoal = f.fit ? Math.min(this.homeK, f.fit / this.size) : this.homeK;
    this.k = this.kGoal;
  }
  /** The floor it's on, or on its way to. */
  get bound() { return this.leap?.floor ?? this.floor; }
  get leaping() { return this.state === 'leap'; }
  get standing() { return this.state === 'ground'; }
  get awake() { return this.state !== 'drawn' && this.state !== 'wake'; }
  /** The top of its head and its half width, on the page. */
  get top() { return this.y + (this.minY - (this.face.length ? 0 : this.er * 0.4)) * this.k; }
  get half() { return (this.w / 2) * this.k; }
  /** Its main line as it's drawn right now, for tracing over. */
  outline(t: number): Pt[] { return this.mapped(this.lines[0], 98, t).map(p => ({ ...p })); }

  update(dt: number, env: Env) {
    const t = env.t, age = t - this.born;
    if (this.state === 'drawn') return;
    if (this.mood !== 'calm' && t > this.moodUntil) this.mood = 'calm';

    // Springs: squash, the dip in its legs, its scale, its eyes popping in, turning around.
    this.sqv += (-170 * this.sq - 11 * this.sqv) * dt; this.sq += this.sqv * dt;
    this.sq = clamp(this.sq, -0.46, 0.5);
    this.dipv += (-260 * this.dip - 16 * this.dipv) * dt; this.dip += this.dipv * dt;
    this.k += (this.kGoal - this.k) * Math.min(1, dt * 5);
    this.fx += (this.facing - this.fx) * Math.min(1, dt * 13);
    this.jelly *= Math.exp(-dt * 2.6);
    if (env.reduced) this.jelly = 0;
    const eyeOn = this.state === 'wake' ? (age > 0.5 ? 1 : 0) : 1;
    this.eyePopV += (-210 * (this.eyePop - eyeOn) - 13 * this.eyePopV) * dt; this.eyePop += this.eyePopV * dt;
    if (this.state === 'wake' && age > 0.5 && !this.popped) { this.popped = true; env.sounds?.pop(this.size * this.kGoal); }

    // Legs grow in, or tuck away while rolling or resting.
    const legTarget = this.state === 'wake' ? (age > 0.32 ? 1 : 0) : this.legGoal;
    const legRate = this.state === 'wake' ? 3.4 : 7;
    this.legOut += clamp(legTarget - this.legOut, -dt * legRate, dt * legRate);

    this.blinking(t);
    this.looking(dt, env);

    switch (this.state) {
      case 'wake': this.waking(dt, env, age); break;
      case 'air': this.flying(dt, env); break;
      case 'ground': this.living(dt, env); break;
      case 'held': this.dangling(dt); break;
      case 'leap': this.leaping_(dt, env); break;
    }
    this.feet(dt, t);

    if (this.kind === 'snail' && this.state === 'ground') {
      const last = this.trail[this.trail.length - 1], fy = this.floor.y;
      const tail = this.x - this.fx * (this.w * 0.45) * this.k;
      if (!last || Math.abs(last.x - tail) > 5) this.trail.push({ x: tail, y: fy, t });
    }
    while (this.trail.length && t - this.trail[0].t > 7) this.trail.shift();

    if (this.leaving && (this.x < this.floor.x0 - this.w * this.k - 60 || this.x > this.floor.x1 + this.w * this.k + 60)) this.gone = true;
    if (this.parade && this.x < this.floor.x0 - this.w * this.k - 30) { this.x = this.floor.x1 + this.w * this.k + 30; for (const l of this.legs) l.fx += this.floor.x1 - this.floor.x0 + this.w * this.k * 2 + 60; }
    // Its last half second, for an echo.
    this.past.push({ t, x: this.x, y: this.y, sq: this.sq, rot: this.rot, fx: this.fx, dip: this.dip, feet: this.legs.flatMap(l => [l.fx, l.fy]) });
    while (this.past.length > 2 && t - this.past[0].t > 0.6) this.past.shift();
  }
  private popped = false;

  private blinking(t: number) {
    if (this.blinkT < 0 && t > this.blinkAt) { this.blinkT = t; this.doubleBlink = Math.random() < 0.22; }
    if (this.blinkT >= 0) {
      const u = (t - this.blinkT) / 0.15;
      this.blink = u < 0.4 ? 1 - u / 0.4 : u < 1 ? (u - 0.4) / 0.6 : 1;
      if (u >= 1) {
        this.blinkT = -1;
        this.blinkAt = this.doubleBlink ? t + 0.09 : t + rand(1.6, 4.8) / this.p.blink;
        this.doubleBlink = false;
      }
    }
  }

  private looking(dt: number, env: Env) {
    const t = env.t;
    let target: XY | null = null;
    if (this.asleep) { this.px *= 0.9; this.py *= 0.9; return; }
    if (this.mood === 'dizzy') target = { x: this.x + Math.cos(t * 9) * 80, y: this.y + Math.sin(t * 9) * 80 };
    else if (this.stare && t < this.stareUntil) target = this.stare;
    else if (env.eye && Math.hypot(env.eye.x - this.x, env.eye.y - this.y) < 700 && this.p.curious > 0.15) target = env.eye;
    else {
      if (!this.gaze || t > this.gazeUntil) {
        const r = Math.random(), buddy = env.crowd.find(c => c !== this && c.state !== 'drawn' && Math.abs(c.x - this.x) < 260);
        this.gaze = r < 0.3 ? env.you : r < 0.55 && buddy ? buddy : r < 0.8 && this.goal !== null ? { x: this.goal, y: this.floor.y } : { x: this.x + rand(-200, 200), y: this.y + rand(-150, 60) };
        this.gazeUntil = t + rand(0.7, 2.4);
      }
      target = this.gaze;
    }
    const dx = target.x - this.x, dy = target.y - (this.y + ((this.eyes[0]?.y ?? 0) * this.k)), d = Math.hypot(dx, dy) || 1;
    // Looking at you is looking straight out of the page: pupils in the middle.
    const reach = target === env.you ? 0 : this.er * 0.42 * Math.min(1, d / 60);
    const gx = (dx / d) * reach, gy = (dy / d) * reach;
    // Eyes jump to a new target quickly (a saccade) rather than gliding.
    const f = Math.min(1, dt * 22);
    this.px += (gx - this.px) * f; this.py += (gy - this.py) * f;
  }

  private waking(dt: number, env: Env, age: number) {
    // Lift off the paper when the legs come in, then fall if it was drawn in the air.
    const floorY = this.floor.y;
    if (this.kind === 'worm') this.rot += (0 - this.rot) * Math.min(1, dt * (age > 0.25 ? 9 : 0));
    const bottom = this.y + this.stand();
    if (bottom > floorY) this.y = floorY - this.stand();
    const ready = this.legs.length ? this.legOut > 0.7 : age > 0.45;
    if (ready && bottom < floorY - 1) { this.state = 'air'; this.vy = 0; return; }
    if (age > 0.95) {
      this.state = 'ground';
      this.vy = 0;
      this.say('happy', env.t + 0.9);
      this.cooldown = 0.2;
      this.jump(env, 0, 330);
    }
  }

  private jump(env: Env, dir: number, v: number) {
    this.vy = -v * this.p.bounce;
    this.vx = dir;
    this.state = 'air';
    this.sqv += 4.5;
    if (v > 400) env.sounds?.boing(this.size * this.k);
  }

  private flying(dt: number, env: Env) {
    this.vy += G * dt;
    this.vx *= Math.exp(-dt * 0.35);
    this.x += this.vx * dt; this.y += this.vy * dt;
    // Spin settles, except for a ball of fuzz, which keeps rolling through the air.
    if (this.kind === 'fuzz') this.rot += this.vr * dt;
    else { this.rot += this.vr * dt; this.vr *= Math.exp(-dt * 3); this.rot += (0 - this.rot) * Math.min(1, dt * 4); }
    // Stretch along the fall.
    const stretch = clamp(Math.abs(this.vy) / 4200, 0, 0.22);
    this.sq += (stretch - this.sq) * Math.min(1, dt * 10);
    this.walls();
    const bottom = this.y + this.stand();
    if (bottom >= this.floor.y && this.vy > 0) this.land(env, this.vy);
  }

  private walls() {
    const hw = this.halfW(), f = this.floor;
    if (this.leaving) return;
    if (this.x - hw < f.x0 && this.vx < 0) { this.x = f.x0 + hw; this.vx = -this.vx * 0.55; this.sqv += 2; this.vr = -this.vr; }
    if (this.x + hw > f.x1 && this.vx > 0) { this.x = f.x1 - hw; this.vx = -this.vx * 0.55; this.sqv += 2; this.vr = -this.vr; }
  }

  private land(env: Env, impact: number) {
    this.y = this.floor.y - this.stand();
    const hard = clamp(impact / 1400, 0, 1);
    this.sqv -= 2 + hard * 10;
    this.sq = Math.min(this.sq, -0.08 - hard * 0.3);
    this.dipv += impact * 0.06;
    this.jelly = Math.max(this.jelly, hard * 0.5);
    if (impact > 420) env.sounds?.land(this.size * this.k);
    for (const l of this.legs) { l.fx = this.hipX(l) + (Math.random() - 0.5) * 3; l.fy = this.floor.y; l.planted = true; l.u = 0; }
    // A ball keeps some of the bounce.
    if (this.kind === 'bouncer' && impact > 520) { this.vy = -impact * 0.42; this.sqv -= 2; return; }
    if (this.kind === 'fuzz' && this.mood !== 'happy') this.vr *= 0.5;
    this.vy = 0;
    this.state = 'ground';
    if (impact > 1700) { this.say('dizzy', env.t + 1.4); this.wait = 1.6; this.goal = null; }
    else if (this.mood === 'surprised') this.say('calm', env.t);
  }

  private leaping_(dt: number, env: Env) {
    const L = this.leap!, u = clamp((env.t - L.at) / L.dur, 0, 1);
    const px = this.x, py = this.y;
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    this.x = L.fx + (L.tx - L.fx) * (0.35 * u + 0.65 * e);
    this.y = L.fy + (L.ty - L.fy) * u - 4 * L.h * u * (1 - u);
    this.vx = (this.x - px) / Math.max(dt, 1e-3);
    this.vy = (this.y - py) / Math.max(dt, 1e-3);
    this.rot += (clamp(this.vx * 0.00025, -0.25, 0.25) - this.rot) * Math.min(1, dt * 8);
    this.sq += (clamp(Math.abs(this.vy) / 5000, 0, 0.25) - this.sq) * Math.min(1, dt * 10);
    if (u >= 1) {
      this.leap = null;
      this.floor = L.floor;
      this.vx = 0;
      // A ball may bounce off the landing, so it is in the air until land() says otherwise.
      this.state = 'air';
      this.land(env, 950);
    }
  }

  private dangling(dt: number) {
    const h = this.held!;
    const tx = h.tx + h.dx, ty = h.ty + h.dy;
    const px = this.x, py = this.y;
    this.x += (tx - this.x) * Math.min(1, dt * 24);
    this.y += (ty - this.y) * Math.min(1, dt * 24);
    const vx = (this.x - px) / Math.max(dt, 1e-3);
    // Swings under the finger like something hanging.
    this.rot += (clamp(-vx * 0.0007, -0.7, 0.7) - this.rot) * Math.min(1, dt * 10);
    this.sq += (clamp((this.y - py) / Math.max(dt, 1e-3) / -5000, -0.15, 0.25) + 0.06 - this.sq) * Math.min(1, dt * 8);
    this.jelly = Math.max(this.jelly, 0.12);
  }

  /** What it does on the ground: wander, wait, look around, show off a little. */
  private living(dt: number, env: Env) {
    const t = env.t, spec = KIND[this.kind];
    this.y = this.floor.y - this.stand();
    this.rot += ((this.kind === 'fuzz' ? this.rot : 0) - this.rot) * Math.min(1, dt * 8);
    this.cooldown -= dt;

    // Startled by a pen rushing past.
    if (env.rush && this.cooldown < 0 && Math.hypot(env.rush.x - this.x, env.rush.y - this.y) < this.size * this.k * 0.6 + 50 && env.rush.v > 1.2) {
      this.say('surprised', t + 0.8);
      this.asleep = false;
      this.crouch = -1;
      this.jump(env, (this.x > env.rush.x ? 1 : -1) * 160, 430);
      this.cooldown = 1.4;
      return;
    }

    if (this.asleep) { this.vx *= Math.exp(-dt * 10); this.legGoal = 0.3; this.goal = null; return; }
    if (this.waving > t) { this.vx *= Math.exp(-dt * 10); this.legGoal = 1; return; }
    if (this.pointing && t < this.pointUntil && this.goal === null) { this.vx *= Math.exp(-dt * 10); this.legGoal = 1; return; }

    const f = this.floor, margin = this.halfW() + 10;
    if (this.parade) {
      // Single file: wait for whoever is just ahead to get going.
      const ahead = env.crowd.find(c => c !== this && c.parade && c.x < this.x && this.x - c.x < this.half + c.half + 18);
      if (ahead) { this.vx *= Math.exp(-dt * 9); this.legGoal = 1; return; }
      this.goal = this.x - 300;
    }
    if (this.goal === null && this.script) { this.vx *= Math.exp(-dt * 9); this.legGoal = this.mood === 'sleepy' ? 0.45 : 1; return; }
    if (this.goal === null && !this.leaving) {
      this.wait -= dt;
      this.vx *= Math.exp(-dt * 9);
      if (this.wait <= 0) {
        const r = Math.random();
        if (r < 0.14 && spec.legs) { this.wait = rand(1.6, 3.2); this.legGoal = 0.45; this.say('sleepy', t + this.wait); }
        else if (r < 0.26) { this.wait = rand(0.6, 1.2); this.legGoal = 1; this.trick(env); }
        else {
          this.legGoal = 1;
          const span = Math.max(40, f.x1 - f.x0 - margin * 2);
          let g = f.x0 + margin + Math.random() * span;
          if (Math.abs(g - this.x) < 60) g = clamp(this.x + (Math.random() < 0.5 ? -1 : 1) * rand(80, 220), f.x0 + margin, f.x1 - margin);
          this.goal = g;
        }
      }
      return;
    }
    if (this.goal === null) return;
    if (!this.leaving && !this.parade) this.goal = clamp(this.goal, f.x0 + margin, f.x1 - margin);
    const dx = this.goal - this.x, dir = Math.sign(dx) || 1, far = Math.abs(dx);
    if (dir !== this.facing) this.facing = dir;
    const turning = Math.abs(this.fx - this.facing) > 0.6;
    const speed = spec.speed * this.p.speed * (this.leaving ? 1.3 : 1) * this.hurry * (this.parade ? 0.55 : 1);
    if (far < 4) { this.goal = null; this.wait = rand(0.8, 3.4); return; }

    if (spec.hop) {
      // Hoppers crouch, then jump.
      if (this.crouch < 0 && this.cooldown <= 0 && !turning) { this.crouch = t; this.sqv -= 5; }
      if (this.crouch >= 0 && t - this.crouch > 0.11) {
        this.crouch = -1;
        const reach = Math.min(far, spec.hop[1] * 0.55 * this.p.speed);
        const v = spec.hop[0] * (this.kind === 'flea' ? rand(0.7, 1.15) : rand(0.85, 1.05));
        const air = (2 * v) / G;
        this.jump(env, dir * (reach / air), v);
        this.cooldown = this.kind === 'bouncer' ? rand(0.02, 0.12) : rand(0.18, 0.55);
      }
      return;
    }
    // Everything else moves along the ground.
    const want = turning ? 0 : dir * speed * Math.min(1, far / 40 + 0.25);
    this.vx += (want - this.vx) * Math.min(1, dt * (this.kind === 'bug' ? 10 : 5));
    this.x += this.vx * dt;
    this.phase += Math.abs(this.vx) * dt;
    if (this.kind === 'fuzz') {
      const r = ((this.w + this.h) / 4) * this.k;
      this.rot += (this.vx * dt) / Math.max(8, r);
      this.rolled += Math.abs(this.vx * dt);
      this.legGoal = Math.abs(this.vx) > 25 ? 0 : 1;
      if (far < 8 && this.rolled > 380) { this.say('dizzy', t + 1.3); this.rolled = 0; }
    }
  }

  private trick(env: Env) {
    const r = Math.random();
    if (r < 0.5 && this.kind !== 'worm' && this.kind !== 'snail') { this.sqv -= 4; this.say('happy', env.t + 0.7); this.jump(env, 0, 300); }
    else if (r < 0.75) { this.gaze = env.you; this.gazeUntil = env.t + 1.4; this.blinkAt = env.t + 0.2; }
    else { this.facing = -this.facing; }
  }

  private hipX(l: Leg) { return this.x + l.hx * this.k * this.fx; }
  private hipY(l: Leg) { return this.y + this.bodyY(l.hx, l.hy) * this.k; }
  /** A point's height after squash (anchored at its bottom), in local units. */
  private bodyY(_x: number, y: number) { return (y - this.maxY) * (1 + this.sq) + this.maxY + this.dip / Math.max(this.k, 0.01); }

  private feet(dt: number, t: number) {
    const L = this.legLen * this.k * this.legOut;
    const onGround = this.state === 'ground' || this.state === 'wake';
    const stepping = (g: number) => this.legs.some(l => l.group === g && !l.planted);
    const stride = Math.max(8, L * (this.kind === 'stilts' ? 1.05 : 0.85));
    for (let i = 0; i < this.legs.length; i++) {
      const l = this.legs[i];
      const hx = this.hipX(l), hy = this.hipY(l);
      if (!this.armed && this.waving > t && l.front === (this.facing > 0) && i === (this.facing > 0 ? this.legs.length - 1 : 0)) {
        // The front leg waves.
        l.planted = false;
        const wx = hx + this.facing * L * 0.75, wy = hy - L * 0.35 + Math.sin(t * 15) * L * 0.22;
        l.fx += (wx - l.fx) * Math.min(1, dt * 16); l.fy += (wy - l.fy) * Math.min(1, dt * 16);
        continue;
      }
      if (!onGround) {
        // In the air the feet hang (and kick, when held).
        const flail = this.state === 'held' ? Math.sin(t * 21 + i * 2.1) * L * 0.4 : Math.sin(t * 9 + i) * L * 0.08;
        const tuck = this.kind === 'bouncer' || this.kind === 'flea' ? 0.55 : 0.92;
        const tx = hx - this.vx * 0.012 + flail, ty = hy + L * tuck;
        l.fx += (tx - l.fx) * Math.min(1, dt * 20); l.fy += (ty - l.fy) * Math.min(1, dt * 20);
        l.planted = false; l.u = 0;
        continue;
      }
      const ground = this.floor.y;
      if (!l.planted && l.u === 0 && this.state === 'wake') { l.fx = hx; l.fy = ground; l.planted = true; }
      if (l.planted) {
        l.fy = ground;
        const ideal = hx + this.vx * 0.09;
        const off = l.fx - ideal;
        const still = Math.abs(this.vx) < 6;
        if ((Math.abs(off) > stride * 0.55 || (still && Math.abs(off) > Math.max(5, L * 0.3))) && !stepping(1 - l.group)) {
          l.planted = false; l.from = l.fx; l.u = 0.0001;
          l.to = ideal + Math.sign(this.vx || -off) * stride * (still ? 0 : 0.38);
          l.dur = clamp(stride / (Math.abs(this.vx) + 40) * 0.55, 0.08, 0.22);
        }
      } else {
        l.u += dt / l.dur;
        const u = Math.min(1, l.u), e = ease(u);
        l.to = l.to + (hx + this.vx * 0.09 + Math.sign(this.vx) * stride * 0.38 - l.to) * 0.15 * (Math.abs(this.vx) > 6 ? 1 : 0);
        l.fx = l.from + (l.to - l.from) * e;
        l.fy = ground - Math.sin(Math.PI * u) * L * (this.kind === 'bug' ? 0.22 : 0.34);
        if (u >= 1) { l.planted = true; l.u = 0; l.fy = ground; }
      }
    }
    // A walker's body bobs with its steps.
    if (onGround && this.legs.length && this.kind !== 'bouncer') {
      const lifting = this.legs.reduce((m, l) => Math.max(m, l.planted ? 0 : Math.sin(Math.PI * Math.min(1, l.u))), 0);
      this.y -= lifting * L * 0.07;
    }
  }

  // ---- drawing -------------------------------------------------------------------------------------------------

  /** Local to page, with squash, the jelly wobble, a worm's wave and the turn. */
  private map(p: Pt, t: number, out: Pt) {
    let lx = p.x, ly = p.y;
    if (t < this.shiverUntil) lx += Math.sin(t * 75 + ly * 0.2) * 1.1 / Math.max(0.3, this.k);
    if (this.kind === 'worm') {
      const s = (lx - this.minX) / Math.max(1, this.w);
      const moving = Math.min(1, Math.abs(this.vx) / 30);
      const amp = this.size * (0.012 + 0.05 * moving);
      ly += Math.sin(s * TAU * 1.15 + this.phase * 0.09) * amp;
      lx += Math.sin(this.phase * 0.09 + s * 2) * this.size * 0.02 * moving;
    }
    if (this.jelly > 0.01 || this.kind === 'snail') {
      const a = Math.atan2(ly, lx);
      let d = this.jelly * 0.09 * Math.sin(t * 19 + a * 3 + this.seed);
      if (this.kind === 'snail') d += 0.03 * Math.sin(this.phase * 0.25) * (lx > 0 ? 1 : 0.3);
      lx *= 1 + d; ly *= 1 + d;
    }
    const breathe = this.asleep ? 1 + 0.035 * Math.sin(t * 1.5 + this.seed) : 1 + 0.014 * Math.sin(t * 2.3 + this.seed);
    const sy = (1 + this.sq) * breathe, sx = (1 - this.sq * 0.6) / breathe;
    lx *= sx * this.fx;
    ly = (ly - this.maxY) * sy + this.maxY + this.dip / Math.max(this.k, 0.01);
    lx *= this.k; ly *= this.k;
    const c = Math.cos(this.rot), s = Math.sin(this.rot);
    out.x = this.x + lx * c - ly * s;
    out.y = this.y + lx * s + ly * c;
    out.w = p.w * Math.max(0.6, Math.min(1.15, this.k * 1.05 + 0.08));
    return out;
  }

  private buf: Pt[][] = [];
  private mapped(l: Pt[], i: number, t: number, sx = 1, sy = 1, ox = 0, oy = 0, cx = 0, cy = 0) {
    const b = this.buf[i] ?? (this.buf[i] = []);
    b.length = l.length;
    for (let j = 0; j < l.length; j++) {
      const p = l[j], q = b[j] ?? (b[j] = { x: 0, y: 0, w: 0 });
      TMP.x = cx + (p.x - cx) * sx + ox; TMP.y = cy + (p.y - cy) * sy + oy; TMP.w = p.w;
      this.map(TMP, t, q);
    }
    return b;
  }

  draw(ctx: CanvasRenderingContext2D, t: number, reduced: boolean) {
    const cartoon = STYLE === 'cartoon';
    // The line only wanders much when something is happening to it; standing about, it barely breathes.
    const busy = this.jelly > 0.15 || this.state === 'held' || this.state === 'wake' || t < this.shiverUntil;
    const boil = reduced || this.state === 'drawn' ? 0 : cartoon ? (busy ? 0.5 : this.kind === 'fuzz' ? 0.35 : 0.16) : this.kind === 'fuzz' ? 0.7 : 0.5;
    const seed = this.state === 'drawn' ? 0 : Math.floor(t * (cartoon ? 6 : 9)) + this.seed;
    // Melting from the sketch into the inked line, just after it wakes.
    const melt = this.rough ? clamp((t - this.inkedAt) / 0.28, 0, 1) : 1;
    if (this.rough && melt >= 1 && this.inkedAt >= 0) this.rough = null;
    const body = (i: number) => this.rough && melt < 1 ? blend(this.rough[i], this.lines[i], ease(melt)) : this.lines[i];

    // A shadow on the floor under it, smaller the higher it is.
    if (cartoon && this.state !== 'held' && this.state !== 'leap' && this.state !== 'drawn') {
      const lift = Math.max(0, this.floor.y - (this.y + this.stand()));
      const k = 1 / (1 + lift / 90), rx = Math.max(6, this.half * 0.95) * k;
      ctx.save();
      ctx.globalAlpha = 0.11 * k;
      ctx.beginPath(); ctx.ellipse(this.x, this.floor.y + 1.5, rx, Math.max(2, rx * 0.15), 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < this.trail.length; i++) {
        const a = this.trail[i - 1], b = this.trail[i];
        ctx.globalAlpha = clamp(1 - (t - b.t) / 7, 0, 1) * 0.22;
        ctx.fillRect(a.x, b.y - 1.2, b.x - a.x, 1.4);
      }
      ctx.restore();
    }

    // Legs, behind the body.
    const L = this.legLen * this.k * this.legOut;
    if (L > 0.5) {
      for (const l of this.legs) {
        const hx = this.hipX(l), hy = this.hipY(l);
        const c = Math.cos(this.rot), s = Math.sin(this.rot);
        const rx = this.x + (hx - this.x) * c - (hy - this.y) * s, ry = this.y + (hx - this.x) * s + (hy - this.y) * c;
        this.leg(ctx, rx, ry, l.fx, l.fy, L, boil, seed + l.hx);
      }
    }

    // Closed bodies are filled, so they hide what they walk in front of. Inked ones get a flat tone with a darker
    // crescent on the side away from the light (top left), and a little paper texture in it.
    let li = 0;
    if (this.closed && this.kind !== 'fuzz') {
      const b = this.mapped(body(0), 99, t);
      const path = new Path2D();
      for (let j = 0; j < b.length; j++) (j ? path.lineTo(b[j].x, b[j].y) : path.moveTo(b[j].x, b[j].y));
      path.closePath();
      ctx.save();
      if (cartoon && melt > 0.3) {
        const off = Math.max(3, this.size * this.k * 0.1);
        ctx.fillStyle = TONE.shade; ctx.fill(path);
        ctx.clip(path);
        ctx.translate(-off * 0.55, -off);
        ctx.fillStyle = TONE.light; ctx.fill(path);
        ctx.translate(off * 0.55, off);
        if (TONE.texture) {
          ctx.globalAlpha = 0.07;
          ctx.fillStyle = TONE.texture;
          ctx.fillRect(this.x - this.size * this.k, this.y - this.size * this.k, this.size * this.k * 2, this.size * this.k * 2);
        }
      } else { ctx.fillStyle = '#ffffff'; ctx.fill(path); }
      ctx.restore();
    }
    if (this.kind === 'snail') for (const e of this.extra) line(ctx, this.mapped(e, 50 + li++, t), boil, seed + li);

    for (let i = 0; i < this.lines.length; i++) {
      if (this.face.includes(i)) {
        // Their own eyes blink: squeezed toward their middle.
        const bx = box(this.lines[i]);
        const ox = clamp(this.px * 0.35, -2, 2), oy = clamp(this.py * 0.35, -2, 2);
        line(ctx, this.mapped(body(i), i, t, 1, Math.max(0.12, this.asleep ? 0.12 : this.blink), ox, oy, bx.cx, bx.cy), boil, seed + i);
      } else line(ctx, this.mapped(body(i), i, t), boil, seed + i);
    }

    if (this.eyePop > 0.02 && !this.face.length) this.drawFace(ctx, t, boil, seed);
    if (this.face.length && this.eyePop > 0.02 && this.mood !== 'calm' && this.mood !== 'sleepy') this.mouth(ctx, t, boil, seed);
    if (this.state !== 'drawn') this.extras(ctx, t, boil, seed);
  }

  /** Everything it has picked up, its arms, what it's saying. */
  private extras(ctx: CanvasRenderingContext2D, t: number, boil: number, seed: number) {
    const k: Ink = { boil: boil * 0.8, seed: seed + 50 };
    const f = this.fx >= 0 ? 1 : -1, kk = this.k;
    const sk = clamp((this.size * kk) / 90, 0.62, 1.2);
    const grow = (what: Keep) => (this.gotWhat === what ? back((t - this.gotAt) / 0.4) : 1);
    const turn = this.kind === 'fuzz' ? 0 : this.rot;
    const g = this.gear;

    if (g.bag.length) { const p = this.eyeAt(this.bagAt, t); satchel(ctx, p.x, p.y, sk * 0.95, f, g.bag, t, { ...k, seed: k.seed + 1 }); }
    if (g.badge) { const p = this.eyeAt(this.sticker, t); badge(ctx, p.x, p.y, clamp(this.size * kk * 0.085, 4.6, 9.5) * grow('check'), { ...k, seed: k.seed + 2 }); }
    const c = this.eyeAt(this.crown, t);
    let hatTop = c.y;
    if (g.head === 'nightcap') {
      const B = clamp(this.w * kk * 0.6, 20, 62) * grow('nightcap');
      nightcap(ctx, c.x, c.y + 2, B, f, turn, t, { ...k, seed: k.seed + 3 });
      hatTop = c.y - B * 0.6;
    } else if (g.head === 'headband' && this.brow.length > 2) {
      const pts = this.brow.map(p => { const q = this.eyeAt(p, t); return [q.x, q.y] as [number, number]; });
      headband(ctx, pts, f, Math.max(1.6, this.base * 0.75) * grow('headband'), t, { ...k, seed: k.seed + 4 });
    }
    if (g.ear) { const p = this.eyeAt(this.earAt, t); pencil(ctx, p.x, p.y, sk * 0.9 * grow('pencil'), f, { ...k, seed: k.seed + 5 }); }

    // Arms: one to wave, point or hold with; the other takes what it's holding while the first is busy.
    const hand = g.hand;
    const now = this.pointing && t < this.pointUntil ? this.pointing : null;
    const waving = this.waving > t;
    if (this.armed && this.eyePop > 0.3 && this.legOut > 0.2) {
      const A = clamp(this.size * 0.3, 11, 26) * kk;
      const aw = Math.max(2, this.base * 0.85);
      const R = this.eyeAt(this.front, t), Rb = this.eyeAt(this.rear, t);
      const bob = Math.sin(this.phase * 0.12 + t * 2) * A * 0.05;
      if (now) {
        const dx = now.x - R.x, dy = now.y - R.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
        arm(ctx, R.x, R.y, R.x + ux * A * 1.15, R.y + uy * A * 1.15 + bob, aw, { ...k, seed: k.seed + 6 }, [ux * A * 0.42, uy * A * 0.42]);
      } else if (waving) {
        const wv = Math.sin(t * 13);
        arm(ctx, R.x, R.y, R.x + f * A * (0.5 + wv * 0.3), R.y - A * (0.95 - Math.abs(wv) * 0.1), aw, { ...k, seed: k.seed + 6 });
      } else if (hand) {
        const hx = R.x + f * A * 0.62, hy = R.y - A * 0.32 + bob;
        arm(ctx, R.x, R.y, hx, hy, aw, { ...k, seed: k.seed + 6 });
        held(ctx, hand, hx, hy, sk * grow(hand), f, t, { ...k, seed: k.seed + 7 }, this.top, this.x, this.w * kk);
      }
      if (hand && (now || waving)) {
        const hx = Rb.x - f * A * 0.42, hy = Rb.y - A * 0.3 + bob;
        arm(ctx, Rb.x, Rb.y, hx, hy, aw, { ...k, seed: k.seed + 8 });
        held(ctx, hand, hx, hy, sk, -f, t, { ...k, seed: k.seed + 9 }, this.top, this.x, this.w * kk);
      }
    } else if (hand) held(ctx, hand, c.x, c.y - 2, sk * grow(hand), f, t, { ...k, seed: k.seed + 7 }, this.top, this.x, this.w * kk);

    if (this.ghost) return;
    if (this.gotWhat && t - this.gotAt < 0.7) sparkle(ctx, c.x, c.y + this.h * kk * 0.3, this.size * kk * 0.62, (t - this.gotAt) / 0.7, { ...k, seed: k.seed + 10 });
    if (this.asleep) zzz(ctx, c.x - f * this.w * kk * 0.15, hatTop - 4, f, sk, t, { ...k, seed: k.seed + 11 });
    const b = this.bubbleOf;
    if (b && t < b.until) {
      const u = Math.min(back((t - b.at) / 0.26), 1 - clamp((t - (b.until - 0.18)) / 0.18, 0, 1));
      const hold = g.hand === 'umbrella' && !now && !waving ? this.top - clamp(this.w * kk * 1.35, 44, 130) * 0.45 : hatTop;
      bubble(ctx, b.pic, c.x + f * this.w * kk * 0.18, Math.min(hatTop, hold) - 4, f, clamp((this.size * kk) / 80, 0.8, 1.15), u, t, { ...k, seed: k.seed + 12 });
    } else if (b) this.bubbleOf = null;
  }

  /** Itself standing still on a floor at (x, floorY), looking out, for a picture of it. Nothing about it changes. */
  portrait(ctx: CanvasRenderingContext2D, x: number, floorY: number, t: number) {
    const keys = ['x', 'y', 'k', 'sq', 'rot', 'fx', 'dip', 'jelly', 'mood', 'px', 'py', 'blink', 'eyePop', 'legOut', 'state', 'held', 'bubbleOf', 'asleep', 'pointing', 'waving', 'gotWhat'] as const;
    const keep: Record<string, unknown> = {};
    for (const k of keys) keep[k] = (this as unknown as Record<string, unknown>)[k];
    const feet = this.legs.map(l => [l.fx, l.fy, l.planted] as const);
    this.k = this.homeK; this.sq = 0; this.rot = 0; this.fx = 1; this.dip = 0; this.jelly = 0; this.mood = 'happy'; this.px = 0; this.py = 0;
    this.blink = 1; this.eyePop = 1; this.legOut = 1; this.state = 'ground'; this.held = null;
    this.bubbleOf = null; this.asleep = false; this.pointing = null; this.waving = 0; this.gotWhat = null;
    this.x = x; this.y = floorY - this.stand();
    this.legs.forEach((l, i) => { l.fx = this.hipX(l) + (i % 2 ? 1 : -1) * 0.5; l.fy = floorY; });
    this.draw(ctx, t, true);
    for (const k of keys) (this as unknown as Record<string, unknown>)[k] = keep[k];
    this.legs.forEach((l, i) => { l.fx = feet[i][0]; l.fy = feet[i][1]; l.planted = feet[i][2]; });
  }

  /** How big it is standing up, at its own size. */
  get footprint() { return { w: this.w * this.homeK, h: (this.h + this.legLen * 0.9 + this.er) * this.homeK }; }

  /** Its lines, ready to be drawn again somewhere else (a parade, a saved card). */
  get drawing() { return this.lines.map(l => l.map(p => ({ ...p }))); }

  /** Its echo: itself as it was `delay` seconds ago, `dx` to the side, faint. */
  drawEcho(ctx: CanvasRenderingContext2D, t: number, delay: number, dx: number, alpha: number) {
    const then = t - delay;
    let h = this.past[0];
    for (const p of this.past) { if (p.t <= then) h = p; else break; }
    if (!h) return;
    const keep = { x: this.x, y: this.y, sq: this.sq, rot: this.rot, fx: this.fx, dip: this.dip, feet: this.legs.flatMap(l => [l.fx, l.fy]) };
    this.x = h.x + dx; this.y = h.y; this.sq = h.sq; this.rot = h.rot; this.fx = h.fx; this.dip = h.dip;
    this.legs.forEach((l, i) => { if (h.feet.length > i * 2) { l.fx = h.feet[i * 2] + dx; l.fy = h.feet[i * 2 + 1]; } });
    ctx.save();
    ctx.globalAlpha *= alpha;
    this.ghost = true;
    this.draw(ctx, t, false);
    this.ghost = false;
    ctx.restore();
    this.x = keep.x; this.y = keep.y; this.sq = keep.sq; this.rot = keep.rot; this.fx = keep.fx; this.dip = keep.dip;
    this.legs.forEach((l, i) => { l.fx = keep.feet[i * 2]; l.fy = keep.feet[i * 2 + 1]; });
  }

  private leg(ctx: CanvasRenderingContext2D, hx: number, hy: number, fx: number, fy: number, L: number, boil: number, seed: number) {
    const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1;
    // Two even halves, with the knee pushed out the way it bends (forward for most, backward for hoppers).
    const half = L / 2, bend = Math.sqrt(Math.max(0, half * half - (d / 2) * (d / 2)));
    let nx = -dy / d, ny = dx / d;
    const want = this.knee * (this.fx >= 0 ? 1 : -1);
    if (Math.abs(nx) > 0.2 ? Math.sign(nx) !== want : ny > 0) { nx = -nx; ny = -ny; }
    const kx = (hx + fx) / 2 + nx * bend, ky = (hy + fy) / 2 + ny * bend;
    const cxp = 2 * kx - (hx + fx) / 2, cyp = 2 * ky - (hy + fy) / 2;
    const f = this.fx >= 0 ? 1 : -1;
    if (STYLE === 'cartoon') {
      // Rubber hose: one even, bold curve, and a round little foot.
      const w = Math.max(2.2, this.base * 0.92);
      line(ctx, stroke(quad(hx, hy, cxp, cyp, fx, fy, Math.max(6, Math.round(L / 3))), w, 0.95, 1), boil * 0.8, seed);
      const rx = clamp(L * 0.17, 3.2, 8) , ry = rx * 0.62;
      ctx.beginPath(); ctx.ellipse(fx + f * rx * 0.45, fy - ry * 0.55, rx, ry, 0, 0, TAU); ctx.fill();
      return;
    }
    const w = Math.max(1.1, this.base * 0.82);
    line(ctx, stroke(quad(hx, hy, cxp, cyp, fx, fy, Math.max(6, Math.round(L / 3))), w, 0.85, 0.95), boil * 0.8, seed);
    // A little foot pointing forward.
    const toe = Math.max(3, L * 0.2);
    line(ctx, stroke([[fx - f * toe * 0.2, fy], [fx + f * toe * 0.5, fy + 0.3], [fx + f * toe, fy - toe * 0.12]], w * 1.05, 0.55, 1), boil * 0.6, seed + 3);
  }

  private eyeAt(e: XY, t: number) {
    TMP.x = e.x; TMP.y = e.y; TMP.w = 0;
    const out = { x: 0, y: 0, w: 0 };
    // Eyes ride the body but don't spin with a rolling ball of fuzz.
    if (this.kind === 'fuzz') {
      const r = this.rot; this.rot = 0; this.map(TMP, t, out); this.rot = r;
    } else this.map(TMP, t, out);
    return out;
  }

  private drawFace(ctx: CanvasRenderingContext2D, t: number, boil: number, seed: number) {
    let eyes: XY[];
    let r = this.er * this.k * Math.max(0, this.eyePop);
    if (this.kind === 'snail') {
      // Up on stalks at the front of the foot.
      const { maxX, maxY, w, h } = this;
      const sway = Math.sin(t * 2.1 + this.seed) * 0.06;
      const base1 = this.eyeAt({ x: maxX + w * 0.36, y: maxY - h * 0.24 }, t), base2 = this.eyeAt({ x: maxX + w * 0.24, y: maxY - h * 0.26 }, t);
      const tip1 = this.eyeAt({ x: maxX + w * (0.5 + sway), y: maxY - h * 0.62 }, t), tip2 = this.eyeAt({ x: maxX + w * (0.3 + sway), y: maxY - h * 0.66 }, t);
      const sw = Math.max(1, this.base * 0.7);
      line(ctx, stroke([[base1.x, base1.y], [(base1.x + tip1.x) / 2 + 1, (base1.y + tip1.y) / 2], [tip1.x, tip1.y]], sw), boil, seed + 7);
      line(ctx, stroke([[base2.x, base2.y], [(base2.x + tip2.x) / 2 - 1, (base2.y + tip2.y) / 2], [tip2.x, tip2.y]], sw), boil, seed + 8);
      eyes = [tip2, tip1];
      r *= 0.72;
    } else eyes = this.eyes.map(e => this.eyeAt(e, t));
    if (!eyes.length) return;
    const surprised = this.mood === 'surprised';
    if (surprised) r *= 1.12;
    const ring_w = STYLE === 'cartoon' ? Math.max(1.8, this.base * 0.62) : Math.max(1, this.base * 0.55);
    for (let i = 0; i < eyes.length; i++) {
      const e = eyes[i];
      if (this.mood === 'happy') {
        line(ctx, stroke(ring(e.x, e.y + r * 0.35, r * 0.78, r * 0.75, 10, Math.PI * 1.08, Math.PI * 0.84), ring_w * 1.25, 0.7, 0.7), boil, seed + i);
        continue;
      }
      if (this.mood === 'dizzy') {
        const sp: [number, number][] = [];
        for (let j = 0; j <= 18; j++) { const a = j * 0.62 + t * 9 * (i ? 1 : -1), rr = (r * 0.9 * j) / 18; sp.push([e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr]); }
        ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill(); ctx.restore();
        line(ctx, stroke(sp, ring_w, 0.8, 0.6), boil, seed + i);
        continue;
      }
      const lid = this.asleep ? 0.05 : this.mood === 'sleepy' ? Math.min(this.blink, 0.32) : this.mood === 'cold' ? Math.min(this.blink, 0.5) : this.blink;
      const ry = r * Math.max(0.1, lid);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, r, ry, 0, 0, TAU); ctx.fill();
      ctx.restore();
      if (lid < 0.2) {
        line(ctx, stroke([[e.x - r, e.y], [e.x, e.y + r * 0.12], [e.x + r, e.y]], ring_w * 1.3, 0.7, 0.7), boil, seed + i);
        continue;
      }
      line(ctx, stroke(ring(e.x, e.y, r, ry, 16, -Math.PI / 2 + i), ring_w, 1, 1), boil * 0.7, seed + i);
      const pr = r * this.p.pupil * (surprised ? 0.62 : 1);
      const ox = this.px * this.k * (r / Math.max(0.01, this.er * this.k)), oy = this.py * this.k * (r / Math.max(0.01, this.er * this.k)) * lid;
      ctx.beginPath(); ctx.ellipse(e.x + ox, e.y + oy, pr, pr * Math.min(1, lid * 1.2), 0, 0, TAU); ctx.fill();
      // A catchlight. It's what makes a dot feel like it's looking at you.
      if (pr > 1.6) {
        ctx.save(); ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e.x + ox - pr * 0.32, e.y + oy - pr * 0.34 * lid, pr * 0.3, 0, TAU); ctx.fill();
        ctx.restore();
      }
      if (this.mood === 'sleepy') line(ctx, stroke([[e.x - r * 1.05, e.y - ry * 0.9], [e.x + r * 1.05, e.y - ry * 0.9]], ring_w * 1.2, 0.8, 0.8), boil, seed + i + 2);
    }
    this.mouth(ctx, t, boil, seed, eyes, r);
  }

  private mouth(ctx: CanvasRenderingContext2D, t: number, boil: number, seed: number, eyes?: XY[], r = this.er * this.k) {
    if (this.mood !== 'happy' && this.mood !== 'surprised' && this.mood !== 'cold' && !(this.state === 'held')) return;
    let mx: number, my: number;
    if (eyes && eyes.length === 2 && this.kind !== 'snail') { mx = (eyes[0].x + eyes[1].x) / 2; my = Math.max(eyes[0].y, eyes[1].y) + r * 1.45; }
    else if (this.face.length) {
      const b = box(this.lines[this.face[0]]);
      let cy = -Infinity; for (const i of this.face) cy = Math.max(cy, box(this.lines[i]).y1);
      const e = this.eyeAt({ x: b.cx, y: cy + this.er * 1.1 }, t); mx = e.x; my = e.y;
      if (this.face.length > 1) { let sx = 0; for (const i of this.face) sx += box(this.lines[i]).cx; const e2 = this.eyeAt({ x: sx / this.face.length, y: cy + this.er * 1.1 }, t); mx = e2.x; my = e2.y; }
    } else return;
    const w = Math.max(1, this.base * 0.6);
    if (this.mood === 'happy') line(ctx, stroke(ring(mx, my - r * 0.3, r * 0.62, r * 0.5, 9, Math.PI * 0.12, Math.PI * 0.76), w, 0.7, 0.7), boil, seed + 11);
    else if (this.mood === 'cold') {
      // Teeth chattering.
      const z: [number, number][] = [], chat = Math.sin(t * 38) > 0 ? 1 : -1;
      for (let i = 0; i <= 6; i++) z.push([mx - r * 0.7 + (i * r * 1.4) / 6, my - r * 0.15 + (i % 2 ? 1 : -1) * r * 0.14 * chat]);
      line(ctx, stroke(z, w * 0.9, 0.8, 0.8), boil, seed + 13);
    } else {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(mx, my, r * 0.3, r * 0.38, 0, 0, TAU); ctx.fill(); ctx.restore();
      line(ctx, stroke(ring(mx, my, r * 0.3, r * 0.38, 10), w, 1, 1), boil, seed + 12);
    }
  }
}

const TMP: Pt = { x: 0, y: 0, w: 0 };

/** The two greys an inked body is filled with, and a paper texture for it (set by the page once it has one). */
export const TONE: { light: string; shade: string; texture: CanvasPattern | null } = { light: '#fbfaf7', shade: '#e3e1db', texture: null };

function blend(a: Pt[], b: Pt[], u: number): Pt[] {
  const out: Pt[] = new Array(b.length);
  for (let j = 0; j < b.length; j++) { const p = a[Math.min(j, a.length - 1)], q = b[j]; out[j] = { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u, w: p.w + (q.w - p.w) * u }; }
  return out;
}

function box(l: { x: number; y: number }[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of l) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

function inside(poly: XY[], p: XY) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

function edge(poly: XY[], p: XY) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i += 2) d = Math.min(d, Math.hypot(poly[i].x - p.x, poly[i].y - p.y));
  return d;
}

/** A smooth line through points (Catmull-Rom). */
export function catmull(pts: [number, number][], steps: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < steps; j++) {
      const u = j / steps, u2 = u * u, u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export { INK, noise };
