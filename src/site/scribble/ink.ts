/* Ink: how a line looks. A line is a list of points, each with the width the nib laid down there. It's drawn as one
   filled outline (left edge out, a round cap, right edge back, a round cap), so the width can swell and thin along the
   way the way a real nib does: thick where the hand slowed down, thin where it flicked, a small blot where it touched
   down and lingered, and a taper where it lifted off. Anything alive "boils": its outline is re-jittered a few times a
   second, the way hand drawn animation redraws every frame, so a doodle reads as alive before it has even moved. */

export type Pt = { x: number; y: number; w: number };

export const INK = '#111110';

const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** Smooth value noise in [-1, 1]. */
export const noise = (x: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1;
};
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/* The pen. Points come in from the pointer as fast as the browser hands them over; the pen smooths them a little
   (a hand never moves in straight segments), lays them down at an even spacing, and gives each one a width. A real
   pen's pressure is used when there is one (Apple Pencil, a tablet); a finger, a mouse or a trackpad has none worth
   reading, so the width comes from speed instead, which is how a fountain pen behaves anyway. */

const SPACING = 2.2;

export class Pen {
  pts: Pt[] = [];
  private sx = 0; private sy = 0; private lt = 0; private speed = 0; private w = 0; private started = 0; private moved = false;
  private readonly pressure: boolean;
  constructor(readonly base: number, kind: string, x: number, y: number, t: number, p: number) {
    this.pressure = kind === 'pen' && p > 0 && p < 1;
    this.sx = x; this.sy = y; this.lt = t; this.started = t;
    this.w = this.target(0, p) * 0.8;
    this.pts.push({ x, y, w: this.w });
  }

  private target(speed: number, p: number) {
    if (this.pressure) return this.base * (0.3 + 1.35 * Math.pow(clamp(p, 0, 1), 0.75));
    // px per ms. A slow line is about 1.35x the base, a fast flick about 0.55x.
    return this.base * clamp(1.38 - 0.62 * Math.sqrt(speed), 0.52, 1.38);
  }

  add(x: number, y: number, t: number, p: number) {
    // Streamline: follow the pointer a little behind, which takes the shake out of a finger without feeling laggy.
    const k = this.pressure ? 0.62 : 0.5;
    const nx = this.sx + (x - this.sx) * k, ny = this.sy + (y - this.sy) * k;
    const last = this.pts[this.pts.length - 1];
    const dx = nx - last.x, dy = ny - last.y, d = Math.hypot(dx, dy);
    const dt = Math.max(1, t - this.lt);
    this.speed += (Math.hypot(x - this.sx, y - this.sy) / dt - this.speed) * 0.3;
    this.sx = nx; this.sy = ny; this.lt = t;
    if (d < SPACING) return;
    // A pen that sat still before it moved has bled a little ink where it touched down.
    if (!this.moved) {
      this.moved = true;
      if (t - this.started > 160) this.pts[0].w = this.base * 1.7;
    }
    const steps = Math.floor(d / SPACING), goal = this.target(this.speed, p);
    for (let i = 1; i <= steps; i++) {
      this.w += (goal - this.w) * (this.pressure ? 0.45 : 0.16);
      const u = (i * SPACING) / d;
      this.pts.push({ x: last.x + dx * u, y: last.y + dy * u, w: this.w });
    }
  }

  /** The pen lifts: the line thins out over its last stretch, more when it was moving fast. */
  finish() {
    const n = this.pts.length;
    if (n < 2) return this.pts;
    const run = clamp(this.speed * 26, 6, 30), len = Math.min(run, length(this.pts) * 0.3);
    let acc = 0;
    for (let i = n - 1; i > 0 && acc < len; i--) {
      const u = acc / len;
      this.pts[i].w *= 0.22 + 0.78 * (1 - (1 - u) * (1 - u));
      acc += Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].y - this.pts[i - 1].y);
    }
    // The start eases in over a few points, unless it bled.
    for (let i = 0; i < Math.min(4, n); i++) if (this.pts[i].w < this.base * 1.5) this.pts[i].w *= 0.72 + i * 0.07;
    return this.pts;
  }
}

export const length = (pts: ArrayLike<{ x: number; y: number }>) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return l;
};

/* Drawing a line. `boil` is how far (in px) the outline is allowed to wander and `seed` which wander it's on; the
   creatures change seed about nine times a second. `taper` thins a live line's tip so it reads as a nib while the
   finger is still down. Buffers are reused, so a frame full of creatures allocates nothing. */

let bx = new Float32Array(512), by = new Float32Array(512), bw = new Float32Array(512);
const grow = (n: number) => { if (n > bx.length) { const m = n * 2; bx = new Float32Array(m); by = new Float32Array(m); bw = new Float32Array(m); } };

export function line(ctx: CanvasRenderingContext2D, pts: ArrayLike<Pt>, boil = 0, seed = 0, taper = 0, n = pts.length) {
  if (n === 0) return;
  grow(n);
  const s = seed * 7.31;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    bx[i] = p.x + (boil ? noise(i * 0.19 + s) * boil : 0);
    by[i] = p.y + (boil ? noise(i * 0.19 + s + 41.7) * boil : 0);
    bw[i] = Math.max(0.35, p.w * (boil ? 1 + noise(i * 0.33 + s + 93.1) * 0.13 : 1)) * 0.5;
  }
  if (taper > 0) {
    let acc = 0;
    for (let i = n - 1; i > 0 && acc < taper; i--) {
      bw[i] *= 0.45 + 0.55 * (acc / taper);
      acc += Math.hypot(bx[i] - bx[i - 1], by[i] - by[i - 1]);
    }
  }
  ctx.beginPath();
  if (n < 3 || (n < 6 && Math.hypot(bx[n - 1] - bx[0], by[n - 1] - by[0]) < 2)) {
    // A dot: a slightly squashed blot, never a perfect circle.
    let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, bw[i]);
    const cx = bx[0], cy = by[0];
    ctx.ellipse(cx, cy, r * 1.15, r * 0.95, seed * 0.7, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Left edge out.
  let lx0 = 0, ly0 = 0, nx0 = 0, ny0 = 0, nxe = 0, nye = 0;
  const L: number[] = LBUF, R: number[] = RBUF;
  L.length = 0; R.length = 0;
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1;
    let tx = bx[b] - bx[a], ty = by[b] - by[a];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, w = bw[i];
    L.push(bx[i] + nx * w, by[i] + ny * w);
    R.push(bx[i] - nx * w, by[i] - ny * w);
    if (i === 0) { nx0 = nx; ny0 = ny; }
    if (i === n - 1) { nxe = nx; nye = ny; }
  }
  lx0 = L[0]; ly0 = L[1];
  ctx.moveTo(lx0, ly0);
  for (let i = 1; i < n - 1; i++) {
    ctx.quadraticCurveTo(L[i * 2], L[i * 2 + 1], (L[i * 2] + L[i * 2 + 2]) / 2, (L[i * 2 + 1] + L[i * 2 + 3]) / 2);
  }
  ctx.lineTo(L[(n - 1) * 2], L[(n - 1) * 2 + 1]);
  // Round cap at the end.
  const ae = Math.atan2(nye, nxe);
  ctx.arc(bx[n - 1], by[n - 1], bw[n - 1], ae, ae - Math.PI, true);
  // Right edge back.
  for (let i = n - 2; i > 0; i--) {
    ctx.quadraticCurveTo(R[i * 2], R[i * 2 + 1], (R[i * 2] + R[i * 2 - 2]) / 2, (R[i * 2 + 1] + R[i * 2 - 1]) / 2);
  }
  ctx.lineTo(R[0], R[1]);
  const a0 = Math.atan2(ny0, nx0);
  ctx.arc(bx[0], by[0], bw[0], a0 + Math.PI, a0, true);
  ctx.closePath();
  ctx.fill();
}
const LBUF: number[] = [], RBUF: number[] = [];

/** A quick line through a few control points, for the parts the page draws itself (legs, eyes, props). */
export function stroke(pts: [number, number][], w: number, taperEnd = 0.6, taperStart = 0.85): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1);
    const t = u < 0.15 ? taperStart + (1 - taperStart) * (u / 0.15) : u > 0.7 ? 1 - (1 - taperEnd) * ((u - 0.7) / 0.3) : 1;
    out.push({ x: pts[i][0], y: pts[i][1], w: w * t });
  }
  return out;
}

/** Points along a quadratic curve from a through control c to b. */
export function quad(ax: number, ay: number, cx: number, cy: number, bx_: number, by_: number, steps: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, v = 1 - u;
    out.push([v * v * ax + 2 * v * u * cx + u * u * bx_, v * v * ay + 2 * v * u * cy + u * u * by_]);
  }
  return out;
}

/** Points around an ellipse, starting at angle a0, for hand drawn rings (eyes, mouths). */
export function ring(cx: number, cy: number, rx: number, ry: number, steps: number, a0 = 0, sweep = Math.PI * 2): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (sweep * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

/* Paper grain. A tile of tiny specks, knocked out of the ink once a frame so every line has the dry, slightly broken
   edge of real ink on real paper. The tile is pinned to the page, not the screen, so the grain stays put as things
   move through it, like paper does. */
export function grain(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const S = 220;
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 1400; i++) {
    g.globalAlpha = rand(0.12, 0.6);
    g.fillStyle = '#000';
    const x = Math.random() * S, y = Math.random() * S, r = rand(0.25, 0.85);
    g.beginPath(); g.ellipse(x, y, r, r * rand(0.5, 1), Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
  // A few fibres.
  g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    g.globalAlpha = rand(0.08, 0.25);
    g.lineWidth = rand(0.3, 0.6);
    g.strokeStyle = '#000';
    const x = Math.random() * S, y = Math.random() * S, a = Math.random() * Math.PI, l = rand(3, 9);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
