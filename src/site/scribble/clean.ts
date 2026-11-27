import { clamp, type Pt } from './ink';

/* Inking. A visitor's line is a sketch: every wobble of a finger is in it. When a doodle comes alive the sketch is
   redrawn the way a cartoonist inks over pencil: smoothed into one confident curve, a loop closed cleanly where it
   met itself (the bit that ran past is dropped), and given an even, bold weight that swells a little along the
   bottom, where a brush would press. The sketch is kept at the same number of points so one can melt into the other.

   The page can still show the rough pen instead (?ink), to compare. */

export const STYLE: 'cartoon' | 'ink' = typeof location !== 'undefined' && /[?&]ink\b/.test(location.search) ? 'ink' : 'cartoon';

type XY = { x: number; y: number };

function resample(pts: Pt[], n: number): Pt[] {
  const d: number[] = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const L = d[d.length - 1] || 1, out: Pt[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const at = (i / Math.max(1, n - 1)) * L;
    while (j < d.length - 2 && d[j + 1] < at) j++;
    const span = d[j + 1] - d[j] || 1, u = clamp((at - d[j]) / span, 0, 1), a = pts[j], b = pts[Math.min(j + 1, pts.length - 1)];
    out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, w: a.w + (b.w - a.w) * u });
  }
  return out;
}

const len = (pts: XY[]) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return l; };

/** How heavy the inked line is, for a doodle this size. */
export const weight = (size: number) => clamp(size * 0.042, 3.3, 5.4);

/**
 * Ink a set of lines. `sharp` keeps corners crisper (zigzags, stars). Returns the inked lines and the sketch
 * resampled to match them point for point.
 */
export function ink(lines: Pt[][], size: number, sharp: boolean): { lines: Pt[][]; rough: Pt[][]; weight: number } {
  const W0 = weight(size);
  const outLines: Pt[][] = [], rough: Pt[][] = [];
  let cy = 0, n0 = 0, minY = Infinity, maxY = -Infinity;
  for (const l of lines) for (const p of l) { cy += p.y; n0++; minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  cy /= n0 || 1;
  const half = Math.max(4, (maxY - minY) / 2);

  for (const l of lines) {
    const L = len(l);
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const p of l) { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y); }
    const own = Math.max(bx1 - bx0, by1 - by0);
    // A dot or a tiny mark (drawn eyes, a nose) becomes a fat round dot.
    if (L < 10 || own < 7) {
      const cx = (bx0 + bx1) / 2, cyy = (by0 + by1) / 2, w = Math.max(W0 * 1.25, own + W0 * 0.6);
      const dot = [{ x: cx - 0.6, y: cyy, w }, { x: cx + 0.6, y: cyy, w }];
      outLines.push(dot); rough.push(resample(l, 2));
      continue;
    }
    const n = clamp(Math.round(L / 2.5), 8, 600);
    let pts = resample(l, n);

    // Closed: find where the line came back to its start, and stop there.
    const s = pts[0];
    let close = -1, best = Infinity;
    for (let i = Math.floor(n * 0.7); i < n; i++) { const d = Math.hypot(pts[i].x - s.x, pts[i].y - s.y); if (d < best) { best = d; close = i; } }
    const closed = best < Math.max(14, own * 0.22) && L > 40;
    if (closed && close > 8) pts = resample(pts.slice(0, close + 1), n);

    // Smooth: a gaussian along the line, wrapping round for a loop. Ends of an open line stay put.
    const sigma = (sharp ? 1.1 : clamp(own * 0.022, 1.6, 4.6)) / 2.5;
    const R = Math.max(1, Math.ceil(sigma * 2.5)), wts: number[] = [];
    for (let k = -R; k <= R; k++) wts.push(Math.exp(-(k * k) / (2 * sigma * sigma)));
    const sm: Pt[] = [];
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, t = 0;
      for (let k = -R; k <= R; k++) {
        let j = i + k;
        if (closed) j = (j + n) % n;
        else if (j < 0 || j >= n) continue;
        const wv = wts[k + R];
        x += pts[j].x * wv; y += pts[j].y * wv; t += wv;
      }
      sm.push({ x: x / t, y: y / t, w: 0 });
    }
    if (!closed) { sm[0] = { ...pts[0], w: 0 }; sm[n - 1] = { ...pts[n - 1], w: 0 }; }
    // Weight: even, a touch heavier along the bottom. Open lines taper a little at each end.
    for (let i = 0; i < n; i++) {
      const p = sm[i], down = clamp((p.y - cy) / half, -1, 1);
      let w = W0 * (1 + 0.22 * down);
      if (!closed) { const e = Math.min(i, n - 1 - i) * 2.5; w *= 0.55 + 0.45 * clamp(e / 9, 0, 1); }
      p.w = w;
    }
    if (closed) sm.push({ ...sm[0] });
    outLines.push(sm);
    rough.push(resample(l, sm.length));
  }
  return { lines: outLines, rough, weight: W0 };
}
