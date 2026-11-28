/* Reading a doodle. No AI: a handful of plain measurements of the line decide what kind of creature it turns into.

   closed       the end came back near the start (a loop, a blob, a face)
   circularity  how round a closed shape is: 1 for a circle, lower for anything long or lumpy
   elongation   how long it is against how wide, from its principal axes
   windings     how many full turns the pen made, signed (a spiral keeps turning one way)
   crossings    how many times the line crosses itself (a scribble crosses a lot)
   corners      sharp turns (a zigzag, a star, a crown)

   and the kinds those make:

   bouncer  a round loop. Bounces everywhere, squashing on every landing.
   walker   any other blob. Two legs (four if it's wide), walks with a little bob.
   stilts   a tall blob. Two long legs, big slow steps, a sway.
   bug      a long flat blob. Six little legs, scurries.
   worm     an open line. A noodle that slithers.
   hopper   anything spiky. Skinny bent legs, hops like a cricket.
   fuzz     a scribble. Rolls around and gets dizzy.
   snail    a spiral. Grows a soft foot and eye stalks, slides along slowly.
   flea     a dot. Tiny, jumps far too high. */

export type Kind = 'bouncer' | 'walker' | 'stilts' | 'bug' | 'worm' | 'hopper' | 'fuzz' | 'snail' | 'flea';
type XY = { x: number; y: number };

export type Reading = {
  kind: Kind;
  closed: boolean;
  circularity: number;
  elongation: number;
  windings: number;
  crossings: number;
  corners: number;
  /** The principal axis, in radians. */
  axis: number;
  length: number;
  size: number;
};

function resample(pts: XY[], step: number): XY[] {
  const out: XY[] = [{ x: pts[0].x, y: pts[0].y }];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    let d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d === 0) continue;
    let t = step - carry;
    while (t <= d) {
      out.push({ x: a.x + ((b.x - a.x) * t) / d, y: a.y + ((b.y - a.y) * t) / d });
      t += step;
    }
    carry = d - (t - step);
    d = 0;
  }
  const last = pts[pts.length - 1];
  if (Math.hypot(out[out.length - 1].x - last.x, out[out.length - 1].y - last.y) > step * 0.4) out.push({ x: last.x, y: last.y });
  return out;
}

const cross = (a: XY, b: XY, c: XY, d: XY) => {
  const d1x = b.x - a.x, d1y = b.y - a.y, d2x = d.x - c.x, d2y = d.y - c.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-9) return false;
  const u = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / den, v = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / den;
  return u > 0 && u < 1 && v > 0 && v < 1;
};

export function read(line: XY[]): Reading {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, len = 0;
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    if (i) len += Math.hypot(p.x - line[i - 1].x, p.y - line[i - 1].y);
  }
  const w = maxX - minX, h = maxY - minY, size = Math.max(w, h, 1);
  const base = { closed: false, circularity: 0, elongation: 1, windings: 0, crossings: 0, corners: 0, axis: 0, length: len, size };
  if (len < 26 || size < 14) return { ...base, kind: 'flea' };

  const pts = resample(line, Math.max(3, len / 140));
  const n = pts.length;

  // Principal axes.
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p.x; cy += p.y; }
  cx /= n; cy /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) { const dx = p.x - cx, dy = p.y - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(1e-6, tr / 2 - disc);
  const elongation = Math.sqrt(l1 / l2);
  const axis = 0.5 * Math.atan2(2 * sxy, sxx - syy);

  // Turning and corners.
  let signed = 0, abs = 0, corners = 0, lastCorner = -99;
  const turn: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
    const b = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    signed += d; abs += Math.abs(d); turn[i] = d;
  }
  // A corner is a sharp turn over a short window that isn't part of a smooth curve.
  // The pen rounds a corner off over a few px, so the turn is summed over about 14px of line.
  const step = len / Math.max(1, n - 1), reach = Math.min(24, Math.max(6, size * 0.15));
  const win = Math.max(1, Math.round(reach / 2 / step)), apart = Math.max(3, win * 2);
  for (let i = win; i < n - win; i++) {
    let s = 0;
    for (let j = i - win + 1; j <= i + win - 1; j++) s += turn[j];
    if (Math.abs(s) > 1.15 && i - lastCorner > apart) { corners++; lastCorner = i; }
  }

  // Crossings.
  let crossings = 0;
  for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n - 1; j++) if (cross(pts[i], pts[i + 1], pts[j], pts[j + 1])) crossings++;

  // Closed: the end came back near the start, or ran past it.
  const gap = Math.hypot(pts[n - 1].x - pts[0].x, pts[n - 1].y - pts[0].y);
  let nearStart = Infinity;
  for (let i = 0; i < Math.floor(n * 0.2); i++) nearStart = Math.min(nearStart, Math.hypot(pts[n - 1].x - pts[i].x, pts[n - 1].y - pts[i].y));
  const closed = gap < Math.max(16, size * 0.24) || nearStart < size * 0.12;

  let circularity = 0;
  if (closed) {
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
    area = Math.abs(area) / 2;
    const perimeter = len + gap;
    circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  }
  const windings = signed / (Math.PI * 2);
  const reading = { ...base, closed, circularity, elongation, windings, crossings, corners, axis };

  // Which kind. Order matters: the most particular shapes are checked first.
  const spiral = !closed && Math.abs(windings) >= 1.25 && crossings <= 1;
  let kind: Kind;
  if (spiral) kind = 'snail';
  else if (crossings >= 4 || (Math.abs(windings) > 2.4 && crossings >= 2) || abs / (Math.PI * 2) > 4.2) kind = 'fuzz';
  else if (corners >= 4 && (closed ? circularity < 0.6 : true)) kind = 'hopper';
  else if (!closed) kind = elongation > 1.7 || Math.abs(windings) < 0.45 ? 'worm' : 'walker';
  else if (circularity > 0.74 && elongation < 1.35) kind = 'bouncer';
  else if (elongation > 1.55) kind = h > w ? 'stilts' : 'bug';
  else kind = 'walker';
  return { ...reading, kind };
}
