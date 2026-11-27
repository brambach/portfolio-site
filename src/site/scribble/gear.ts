import { INK, clamp, line, noise, ring, stroke } from './ink';

/* The little things a creature picks up on its way down the page, and the ways it talks without words.

   Every project gives it a keepsake (scene.ts decides which): something to wear on its head, something to hold, a
   sticker. Things it held before go in a little satchel at its back. It talks in drawn bubbles: a heart, a "!", a
   "?", a note, a little house. All of it is drawn with the same pen as everything else on the page: white paper
   inside, ink round the edge, the line boiling a little. */

export type Keep = 'check' | 'nightcap' | 'flower' | 'receipt' | 'snapshot' | 'pencil' | 'umbrella' | 'headband';
export type Pic = 'heart' | 'bang' | 'what' | 'note' | 'home' | 'star';
export const HELD: Keep[] = ['flower', 'receipt', 'snapshot', 'umbrella'];

type XY = [number, number];
const TAU = Math.PI * 2;
export const back = (u: number) => { const c = 1.9, v = clamp(u, 0, 1) - 1; return 1 + (c + 1) * v * v * v + c * v * v; };

/** Points along each straight run, so short strokes draw as lines, not dots. */
function dense(pts: XY[], step = 3): XY[] {
  const out: XY[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let j = 1; j <= n; j++) out.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  return out;
}

export type Ink = { boil: number; seed: number };

/** One stroke of the pen. */
export function pen(ctx: CanvasRenderingContext2D, pts: XY[], w: number, k: Ink, end = 0.8, start = 0.85) {
  if (pts.length < 2) return;
  line(ctx, stroke(pts.length < 14 ? dense(pts) : pts, w, end, start), k.boil, k.seed);
}

/** A closed shape: paper inside, ink round it. */
export function shape(ctx: CanvasRenderingContext2D, pts: XY[], w: number, k: Ink, fill = '#ffffff') {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  pen(ctx, [...pts, pts[0], pts[1] ?? pts[0]], w, k, 1, 1);
}

/** A way of placing local drawings: origin, scale, which way it faces (1 or -1), and a turn. */
export function place(x: number, y: number, s: number, f: number, rot = 0) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return (lx: number, ly: number): XY => { const ax = lx * f * s, ay = ly * s; return [x + ax * c - ay * sn, y + ax * sn + ay * c]; };
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.08, r * 0.94, 0.3, 0, TAU); ctx.fill(); }

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, w: number, k: Ink, fill = '#ffffff') {
  const pts: XY[] = [];
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + k.seed * 0.1; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  shape(ctx, pts, w, k, fill);
}

function heartPts(x: number, y: number, s: number): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * TAU;
    out.push([x + s * 0.06 * 16 * Math.pow(Math.sin(a), 3), y - s * 0.06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]);
  }
  return out;
}

// ---- on its head ------------------------------------------------------------------------------------------------

/** A floppy nightcap with a bobble, sitting on the crown, the tip flopping toward its back. */
export function nightcap(ctx: CanvasRenderingContext2D, x: number, y: number, B: number, f: number, rot: number, t: number, k: Ink) {
  const P = place(x, y, 1, f, rot);
  const sway = Math.sin(t * 2.2) * B * 0.04;
  const tip: XY = [-B * 0.66 + sway, -B * 0.42 + Math.abs(sway) * 0.5];
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, v = 1 - u;
    left.push([v * v * (-B * 0.48) + 2 * v * u * (-B * 0.36) + u * u * tip[0], v * v * (B * 0.1) + 2 * v * u * (-B * 0.72) + u * u * tip[1]]);
    right.push([v * v * (B * 0.48) + 2 * v * u * (B * 0.12) + u * u * tip[0], v * v * (B * 0.1) + 2 * v * u * (-B * 0.95) + u * u * tip[1]]);
  }
  const cone = [...left, ...right.reverse()].map(([a, b]) => P(a, b));
  shape(ctx, cone, 2.4, k);
  // A stripe round it.
  pen(ctx, [P(-B * 0.36, -B * 0.32), P(-B * 0.05, -B * 0.42), P(B * 0.2, -B * 0.4)], 1.8, { ...k, seed: k.seed + 3 });
  // The band, rolled up thick.
  const band: XY[] = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12 - 0.5; band.push(P(u * B * 1.04, B * 0.1 - Math.cos(u * Math.PI) * B * 0.06)); }
  pen(ctx, band, Math.max(5, B * 0.16), { ...k, seed: k.seed + 4 }, 1, 1);
  ctx.save(); ctx.fillStyle = '#ffffff'; pen(ctx, band.slice(1, -1), Math.max(2.2, B * 0.08), { ...k, seed: k.seed + 5 }, 1, 1); ctx.restore();
  const [bx, by] = P(tip[0] - B * 0.02, tip[1] + B * 0.04);
  circle(ctx, bx, by, B * 0.12, 2, { ...k, seed: k.seed + 6 });
}

/** A sweatband across its forehead, tails flapping behind. `band` is the line of its brow, back to front. */
export function headband(ctx: CanvasRenderingContext2D, band: XY[], f: number, w: number, t: number, k: Ink) {
  if (band.length < 2) return;
  pen(ctx, band, w * 2.6, k, 1, 1);
  ctx.save(); ctx.fillStyle = '#ffffff'; pen(ctx, band, w * 0.9, { ...k, seed: k.seed + 1 }, 0.9, 0.9); ctx.restore();
  const [ex, ey] = band[0];
  for (const j of [0, 1]) {
    const tail: XY[] = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6; tail.push([ex - f * u * w * 5.5, ey + u * w * (1.6 + j * 1.8) + Math.sin(t * 9 + u * 4 + j) * u * w * 0.9]); }
    pen(ctx, tail, w * 1.1, { ...k, seed: k.seed + 2 + j }, 0.5, 1);
  }
}

/** A pencil tucked behind where an ear would be. */
export function pencil(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, f: number, k: Ink) {
  const P = place(x, y, s, f, -0.95 * f);
  const L = 26, W = 3.2;
  const body: XY[] = [P(-L * 0.5, -W), P(L * 0.28, -W), P(L * 0.5, 0), P(L * 0.28, W), P(-L * 0.5, W)];
  shape(ctx, body, 1.7, k);
  pen(ctx, [P(L * 0.28, -W), P(L * 0.28, W)], 1.4, { ...k, seed: k.seed + 2 });
  const [tx, ty] = P(L * 0.47, 0); dot(ctx, tx, ty, 1.5 * s);
  ctx.save(); const e = [P(-L * 0.5, -W), P(-L * 0.36, -W), P(-L * 0.36, W), P(-L * 0.5, W)]; ctx.beginPath(); e.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); ctx.restore();
}

/** A round sticker with a tick on it. */
export function badge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k: Ink) {
  circle(ctx, x, y, r, 1.8, k);
  pen(ctx, [[x - r * 0.48, y + r * 0.02], [x - r * 0.1, y + r * 0.4], [x + r * 0.52, y - r * 0.42]], Math.max(1.6, r * 0.32), { ...k, seed: k.seed + 1 }, 0.9, 0.9);
}

// ---- in its hand ------------------------------------------------------------------------------------------------

/** Something held in a hand at (x, y). `top` is the top of its head, for an umbrella to go over it; `cx` its middle. */
export function held(ctx: CanvasRenderingContext2D, what: Keep, x: number, y: number, s: number, f: number, t: number, k: Ink, top: number, cx: number, wide: number) {
  if (what === 'umbrella') {
    const cw = clamp(wide * 1.35, 44, 130), ch = cw * 0.4;
    const sway = Math.sin(t * 1.7) * 0.03;
    const canopyY = Math.min(y - 18 * s, top - ch * 0.35 - 6 * s);
    const ux = cx + f * cw * 0.08;
    // The handle hooks under the hand, the shaft leans over its head.
    pen(ctx, [[x + f * 3.5 * s, y + 6 * s], [x + f * 3 * s, y + 9 * s], [x, y + 9.5 * s], [x - f * 1.5 * s, y + 7 * s]], 2, k);
    pen(ctx, [[x, y + 6 * s], [ux, canopyY]], 2.1, { ...k, seed: k.seed + 1 }, 1, 1);
    const dome: XY[] = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; dome.push([ux + Math.cos(a) * cw * 0.5, canopyY + Math.sin(a) * ch + Math.sin(a * 2 + t) * sway * cw]); }
    // Scalloped edge, from the right tip back to the left.
    const n = 4;
    for (let i = 0; i < n; i++) {
      const u0 = 0.5 - i / n, u1 = 0.5 - (i + 1) / n;
      for (let j = 1; j <= 5; j++) { const u = u0 + ((u1 - u0) * j) / 5; dome.push([ux + u * cw, canopyY - Math.sin((j / 5) * Math.PI) * ch * 0.16]); }
    }
    shape(ctx, dome, 2.3, { ...k, seed: k.seed + 2 });
    for (let i = 1; i < n; i++) { const u = i / n - 0.5; pen(ctx, [[ux, canopyY - ch], [ux + u * cw * 0.72, canopyY - ch * 0.5], [ux + u * cw, canopyY - ch * 0.1]], 1.5, { ...k, seed: k.seed + 3 + i }, 0.7, 1); }
    pen(ctx, [[ux, canopyY - ch], [ux, canopyY - ch - 6 * s]], 2, { ...k, seed: k.seed + 9 });
    return;
  }
  if (what === 'flower') {
    const P = place(x, y, s, f, Math.sin(t * 1.8) * 0.08);
    const head = P(3, -19);
    pen(ctx, [P(0, 2), P(-1, -6), P(1.5, -13), head], 1.7, k, 1, 1);
    shape(ctx, [P(0, -8), P(5, -11), P(8, -9), P(4, -6)], 1.3, { ...k, seed: k.seed + 1 });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + t * 0.4; circle(ctx, head[0] + Math.cos(a) * 4.6 * s, head[1] + Math.sin(a) * 4.6 * s, 3.5 * s, 1.4, { ...k, seed: k.seed + 2 + i }); }
    dot(ctx, head[0], head[1], 2.4 * s);
    return;
  }
  if (what === 'receipt') {
    const P = place(x, y, s, f, -0.12);
    const paper: XY[] = [P(-2, 3), P(10, 3), P(10, -15)];
    for (let i = 0; i <= 6; i++) paper.push(P(10 - (i * 12) / 6, -15 - (i % 2 ? 2 : 0)));
    shape(ctx, paper, 1.6, k);
    pen(ctx, [P(0.5, -10), P(3, -10.6), P(5.5, -9.6)], 1.2, { ...k, seed: k.seed + 1 });
    pen(ctx, [P(0.5, -5.5), P(3, -6.1), P(5.5, -5.1)], 1.2, { ...k, seed: k.seed + 2 });
    pen(ctx, [P(6.5, -6), P(7.6, -4.6), P(9.2, -7.4)], 1.3, { ...k, seed: k.seed + 3 });
    return;
  }
  if (what === 'snapshot') {
    const P = place(x, y, s, f, 0.16);
    shape(ctx, [P(-3, 3), P(13, 3), P(13, -15), P(-3, -15)], 1.6, k);
    ctx.save(); ctx.fillStyle = '#d9d7d0'; const q = [P(-0.6, -12.6), P(10.6, -12.6), P(10.6, -2.2), P(-0.6, -2.2)]; ctx.beginPath(); q.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); ctx.restore();
    pen(ctx, [P(0, -3), P(3.5, -8), P(6, -5), P(8, -7.5), P(10.5, -3)], 1.2, { ...k, seed: k.seed + 1 }, 1, 1);
  }
}

/** A satchel at its back with the things it held before peeking out. */
export function satchel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, f: number, items: Keep[], t: number, k: Ink) {
  const P = place(x, y, s, f, 0.06);
  // What's inside pokes out the top first, so the bag hides the rest.
  items.slice(-2).forEach((it, i) => {
    const ox = -3 + i * 6;
    if (it === 'flower') { const h = P(ox, -15); pen(ctx, [P(ox, -6), h], 1.3, { ...k, seed: k.seed + 10 + i }); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU; circle(ctx, h[0] + Math.cos(a) * 3 * s, h[1] + Math.sin(a) * 3 * s, 2.3 * s, 1.1, { ...k, seed: k.seed + 12 + j }); } dot(ctx, h[0], h[1], 1.5 * s); }
    else if (it === 'umbrella') pen(ctx, [P(ox, -4), P(ox + 1, -16), P(ox + 3.5, -17.5), P(ox + 5, -15.5)], 1.7, { ...k, seed: k.seed + 10 + i });
    else shape(ctx, [P(ox - 3, -4), P(ox + 4, -4), P(ox + 4.6, -13), P(ox - 2.4, -13.4)], 1.3, { ...k, seed: k.seed + 10 + i });
  });
  const bag: XY[] = [P(-9, -6), P(9, -6), P(9.5, 4), P(7, 7), P(-7, 7), P(-9.5, 4)];
  shape(ctx, bag, 1.8, k, '#f1efe9');
  pen(ctx, [P(-9, -6), P(-6, 0.5), P(6, 0.5), P(9, -6)], 1.5, { ...k, seed: k.seed + 1 }, 1, 1);
  const [bx, by] = P(0, 1.4); dot(ctx, bx, by, 1.4 * s);
  void t;
}

// ---- arms -------------------------------------------------------------------------------------------------------

/** A rubber hose arm from the shoulder to the hand, a round little hand, and a finger if it's pointing. */
export function arm(ctx: CanvasRenderingContext2D, sx: number, sy: number, hx: number, hy: number, w: number, k: Ink, finger: XY | null = null) {
  const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1;
  const sag = Math.min(8, d * 0.22);
  const cx = (sx + hx) / 2 + (-dy / d) * sag * Math.sign(dx || 1), cy = (sy + hy) / 2 + Math.abs(dx / d) * sag;
  const pts: XY[] = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8, v = 1 - u; pts.push([v * v * sx + 2 * v * u * cx + u * u * hx, v * v * sy + 2 * v * u * cy + u * u * hy]); }
  pen(ctx, pts, w, k, 1, 1);
  if (finger) pen(ctx, [[hx, hy], [hx + finger[0], hy + finger[1]]], w * 0.95, { ...k, seed: k.seed + 1 }, 0.8, 1);
  dot(ctx, hx, hy, w * 1.05);
}

// ---- talking ----------------------------------------------------------------------------------------------------

/** A speech bubble over (x, y), on side `f`, with a little picture in it. `u` is how far it has popped in. */
export function bubble(ctx: CanvasRenderingContext2D, pic: Pic, x: number, y: number, f: number, s: number, u: number, t: number, k: Ink) {
  if (u <= 0.01) return;
  const W = 34 * s * u, H = 28 * s * u;
  const cx = x + f * (W * 0.42 + 4 * s), cy = y - H * 0.5 - 10 * s * u;
  const out: XY[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    out.push([cx + Math.cos(a) * W * 0.5 * (1 + 0.04 * Math.sin(a * 3 + k.seed)), cy + Math.sin(a) * H * 0.5]);
  }
  // The tail points down at the head.
  const tail: XY[] = [[cx - f * W * 0.24, cy + H * 0.34], [x + f * 2 * s, y - 2 * s * u], [cx - f * W * 0.02, cy + H * 0.44]];
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); out.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill();
  ctx.beginPath(); tail.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill();
  ctx.restore();
  // The outline, then paper over where the tail joins it, then the tail.
  pen(ctx, [...out, out[0], out[1]], 2.1, k, 1, 1);
  ctx.save(); ctx.fillStyle = '#ffffff'; pen(ctx, [tail[0], tail[2]], 3.6, { ...k, seed: k.seed + 2 }, 1, 1); ctx.restore();
  pen(ctx, [tail[0], tail[1], tail[2]], 2, { ...k, seed: k.seed + 1 }, 1, 1);
  picture(ctx, pic, cx, cy, Math.min(W, H) * 0.62, t, { ...k, seed: k.seed + 5 });
}

/** The little pictures a creature says things with. */
export function picture(ctx: CanvasRenderingContext2D, pic: Pic, x: number, y: number, S: number, t: number, k: Ink) {
  const w = Math.max(1.6, S * 0.13);
  if (pic === 'heart') {
    const beat = 1 + Math.max(0, Math.sin(t * 9)) * 0.08;
    const h = heartPts(x, y + S * 0.05, S * 0.62 * beat);
    ctx.beginPath(); h.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill();
    return;
  }
  if (pic === 'bang') {
    pen(ctx, [[x, y - S * 0.46], [x + S * 0.02, y - S * 0.1], [x, y + S * 0.16]], w * 1.4, k, 0.45, 1);
    dot(ctx, x, y + S * 0.38, w * 0.85);
    return;
  }
  if (pic === 'what') {
    const q: XY[] = ring(x, y - S * 0.2, S * 0.26, S * 0.24, 10, Math.PI * 1.05, Math.PI * 1.35) as XY[];
    q.push([x + S * 0.02, y + S * 0.02], [x, y + S * 0.16]);
    pen(ctx, q, w * 1.2, k, 0.8, 0.9);
    dot(ctx, x, y + S * 0.38, w * 0.8);
    return;
  }
  if (pic === 'note') {
    const bob = Math.sin(t * 6) * S * 0.04;
    ctx.beginPath(); ctx.ellipse(x - S * 0.14, y + S * 0.28 + bob, S * 0.15, S * 0.11, -0.4, 0, TAU); ctx.fill();
    pen(ctx, [[x, y + S * 0.26 + bob], [x, y - S * 0.42 + bob]], w, k, 1, 1);
    pen(ctx, [[x, y - S * 0.42 + bob], [x + S * 0.2, y - S * 0.26 + bob], [x + S * 0.24, y - S * 0.06 + bob]], w, { ...k, seed: k.seed + 1 }, 0.6, 1);
    return;
  }
  if (pic === 'home') {
    const h = S * 0.36;
    shape(ctx, [[x - h, y + h * 0.95], [x - h, y - h * 0.15], [x + h, y - h * 0.15], [x + h, y + h * 0.95]], w, k, '#ffffff');
    pen(ctx, [[x - h * 1.3, y - h * 0.02], [x, y - h * 1.1], [x + h * 1.3, y - h * 0.02]], w * 1.1, { ...k, seed: k.seed + 1 }, 0.9, 0.9);
    ctx.fillRect(x - h * 0.22, y + h * 0.3, h * 0.44, h * 0.65);
    return;
  }
  // A star, filled.
  const pts: XY[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? S * 0.2 : S * 0.48; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill();
}

/** Zs drifting up from a sleeping head. */
export function zzz(ctx: CanvasRenderingContext2D, x: number, y: number, f: number, s: number, t: number, k: Ink) {
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.45 + i / 3) % 1);
    const zx = x - f * (4 + u * 16) * s + Math.sin(u * 5 + i) * 3 * s, zy = y - u * 34 * s, z = (4 + u * 5) * s;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, u * 4) * (1 - u);
    pen(ctx, [[zx - z, zy - z], [zx + z, zy - z], [zx - z, zy + z], [zx + z, zy + z]], 1.8, { ...k, seed: k.seed + i }, 0.9, 0.9);
    ctx.restore();
  }
}

/** A little burst of lines round something new. */
export function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, u: number, k: Ink) {
  if (u <= 0 || u >= 1) return;
  const a0 = noise(k.seed) * 3;
  for (let i = 0; i < 6; i++) {
    const a = a0 + (i / 6) * TAU, r0 = r * (0.7 + u * 0.8), r1 = r0 + r * 0.45 * (1 - u);
    pen(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], 2 * (1 - u) + 0.6, { ...k, seed: k.seed + i }, 0.8, 0.8);
  }
}

export { INK };
