import { Pen, type Pt } from './ink';

/* Creatures other people drew, for the parade at the bottom of the page. In this preview they're made here, from
   the same pen a visitor uses, so they look hand drawn; a saved creature of the visitor's own joins them. Real
   drawings from other visitors would replace these once there's somewhere to keep them. */

type XY = [number, number];
const TAU = Math.PI * 2;

function draw(pts: XY[], ms = 9): Pt[] {
  const pen = new Pen(3.2, 'mouse', pts[0][0], pts[0][1], 0, 0.5);
  let t = 0;
  for (let i = 1; i < pts.length; i++) { t += ms * (0.7 + 0.6 * Math.abs(Math.sin(i * 0.7))); pen.add(pts[i][0], pts[i][1], t, 0.5); }
  return pen.finish();
}
const loop = (r: number, rx: number, ry: number, n = 70, wob = 0.08, a0 = -1.9, over = 0.3): XY[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (TAU + over) * (i / n), k = 1 + wob * Math.sin(a * 3 + 1); return [Math.cos(a) * r * rx * k, Math.sin(a) * r * ry * k]; });
const dot = (x: number, y: number): XY[] => [[x, y], [x + 1.6, y + 0.8], [x + 2.4, y + 2.4]];

export function samples(): Pt[][][] {
  return [
    // A round face with its own eyes.
    [draw(loop(26, 1, 0.95)), draw(dot(-8, -6), 30), draw(dot(7, -7), 30)],
    // A snail.
    [draw(Array.from({ length: 80 }, (_, i) => { const a = i * 0.17, r = 3 + i * 0.32; return [Math.cos(a) * r, Math.sin(a) * r] as XY; }))],
    // A star.
    [draw(Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 12 : 30; return [Math.cos(a) * r, Math.sin(a) * r] as XY; }).flatMap((p, i, all) => i ? Array.from({ length: 6 }, (_, j) => [all[i - 1][0] + (p[0] - all[i - 1][0]) * (j + 1) / 6, all[i - 1][1] + (p[1] - all[i - 1][1]) * (j + 1) / 6] as XY) : [p]), 6)],
    // A worm.
    [draw(Array.from({ length: 40 }, (_, i) => [i * 2.6 - 52, Math.sin(i / 4.5) * 7] as XY))],
    // Something tall.
    [draw(loop(36, 0.42, 1, 60, 0.05))],
    // A scribble.
    [draw(Array.from({ length: 110 }, (_, i) => [Math.cos(i * 0.6) * (16 + (i % 5) * 2) + Math.sin(i * 0.11) * 5, Math.sin(i * 0.67) * (15 + (i % 4) * 2)] as XY), 5)],
  ];
}

/** A creature saved on this device last time, so it's in the parade when its owner comes back. */
const KEY = 'scribble-mine';
export function loadMine(): Pt[][] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as number[][][];
    return v.map(l => l.map(([x, y, w]) => ({ x, y, w })));
  } catch { return null; }
}
export function saveMine(lines: Pt[][]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines.map(l => l.map(p => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.w * 100) / 100])))); } catch { /* private mode */ }
}
