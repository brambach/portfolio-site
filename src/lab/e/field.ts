import { hex, lum, type Palette, type RGB } from './palette';
import { coverCrop, LIFE, type Layout, type Photo } from './scenes';

/* The dots, as numbers. Nothing here touches the page, so it's all testable.

   The screen is a grid of cells, one dot per cell, plus a pool of extra dots that only ever become type. A
   formation says, for every dot slot, where it sits, its color, whether it shows and how it lives. Moving from one
   formation to the next means pairing each dot with a slot in the next one. Slots are ranked by tone and then by
   position across the screen, and the dot at each rank goes to the slot at the same rank, so dark dots go to dark
   places and light to light, and each tone sweeps across together instead of scattering. */

export type Grid = { w: number; h: number; cell: number; cols: number; rows: number; cells: number; typeSlots: number; n: number; typeGap: number };

/** One dot per cell. Cells grow on big screens so there are never more than about 30,000 dots, and phones get
 *  fewer. */
export function makeGrid(w: number, h: number, phone: boolean): Grid {
  const budget = phone ? 9000 : 30000;
  const cell = Math.max(phone ? 6.5 : 7, Math.sqrt((w * h) / budget));
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), cells = cols * rows, typeSlots = phone ? 2600 : 5200;
  return { w, h, cell, cols, rows, cells, typeSlots, n: cells + typeSlots, typeGap: cell * (phone ? 0.62 : 0.7) };
}

export type Formation = {
  /** x, y per slot, in CSS pixels. */
  pos: Float32Array;
  /** 0 hidden, 1 a full dot. Type dots are sized against the cell, so theirs is smaller. */
  size: Float32Array;
  col: Float32Array;
  life: Float32Array;
  /** Where the slot ranks. Hidden slots rank below every tone. */
  key: Float32Array;
  order: Uint32Array;
};

/** 4x4 ordered dither, 0 to 1. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** A small seeded random, so a formation comes out the same each time it's built. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

type Tones = { rgb: RGB[]; rank: number[]; paper: number };
const tonesCache = new WeakMap<Palette, Tones>();
/** The palette's tones with the paper last, and each one's rank from dark to light. */
export function tonesOf(p: Palette): Tones {
  let t = tonesCache.get(p);
  if (!t) {
    const rgb = [...p.tones, p.paper].map(hex);
    const byLum = rgb.map((c, i) => [lum(c), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const rank = rgb.map((_, i) => byLum.indexOf(i));
    t = { rgb, rank, paper: rgb.length - 1 };
    tonesCache.set(p, t);
  }
  return t;
}

/** The nearest tone to a color, weighting the channels the way eyes do. */
export function nearest(c: RGB, rgb: RGB[]) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < rgb.length; i++) {
    const t = rgb[i], dr = c[0] - t[0], dg = c[1] - t[1], db = c[2] - t[2], rm = (c[0] + t[0]) / 2;
    const d = (2 + rm) * dr * dr + 4 * dg * dg + (3 - rm) * db * db;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function empty(n: number): Formation {
  return { pos: new Float32Array(n * 2), size: new Float32Array(n), col: new Float32Array(n * 3), life: new Float32Array(n), key: new Float32Array(n), order: new Uint32Array(n) };
}

/** Where a slot ranks: its tone first, then a little by where it sits, mostly left to right. */
const keyOf = (rank: number, x: number, y: number) => rank + 0.98 * (x * 0.85 + y * 0.15);

function sortOrder(f: Formation) {
  const idx = new Uint32Array(f.key.length);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  const k = f.key;
  f.order = idx.sort((a, b) => k[a] - k[b]);
  return f;
}

/** Hidden slots: every cell keeps its own place with no dot, and the type pool waits at random places. */
function base(g: Grid, rand: () => number) {
  const f = empty(g.n);
  for (let i = 0; i < g.cells; i++) {
    const x = ((i % g.cols) + 0.5) * g.cell, y = (Math.floor(i / g.cols) + 0.5) * g.cell;
    f.pos[i * 2] = x; f.pos[i * 2 + 1] = y;
    f.key[i] = keyOf(-1, x / g.w, y / g.h);
  }
  for (let i = g.cells; i < g.n; i++) {
    f.pos[i * 2] = rand() * g.w; f.pos[i * 2 + 1] = rand() * g.h;
    f.key[i] = -2 + rand();
  }
  return f;
}

export type Pixels = { width: number; height: number; data: Uint8ClampedArray | number[] };

/** A photo as dots. `pixels` is the photo already cropped to the layout's rectangle and scaled to about one pixel
 *  per cell (the page does that with a canvas). */
export function photoFormation(g: Grid, layout: Layout, photo: Photo, photoSize: [number, number], pixels: Pixels, palette: Palette, seed = 7): Formation {
  const rand = seeded(seed), f = base(g, rand), tones = tonesOf(palette), paper = tones.rgb[tones.paper];
  const [x0, y0, x1, y1] = layout.rect;
  const rw = (x1 - x0) * g.w, rh = (y1 - y0) * g.h;
  const crop = coverCrop(photoSize[0], photoSize[1], rw, rh, photo.focus);

  // Stretch each photo across the palette's range, so a bright beach and a dark aurora both use all the tones.
  const ls: number[] = [];
  for (let i = 0; i < pixels.width * pixels.height; i += 3) ls.push(lum([pixels.data[i * 4] / 255, pixels.data[i * 4 + 1] / 255, pixels.data[i * 4 + 2] / 255]));
  ls.sort((a, b) => a - b);
  const lo = ls[Math.floor(ls.length * 0.02)] ?? 0, hi = ls[Math.floor(ls.length * 0.98)] ?? 1, span = Math.max(0.08, hi - lo);

  for (let i = 0; i < g.cells; i++) {
    const cx = i % g.cols, cy = Math.floor(i / g.cols);
    const x = f.pos[i * 2] / g.w, y = f.pos[i * 2 + 1] / g.h;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    const u = (x - x0) / (x1 - x0), v = (y - y0) / (y1 - y0);
    const px = Math.min(pixels.width - 1, Math.floor(u * pixels.width)), py = Math.min(pixels.height - 1, Math.floor(v * pixels.height));
    const o = (py * pixels.width + px) * 4;
    const raw: RGB = [pixels.data[o] / 255, pixels.data[o + 1] / 255, pixels.data[o + 2] / 255];
    // On the light palettes the middle tones are lifted, so a photo sits on the page soft, like the reference.
    const l = lum(raw), l2 = Math.min(1, Math.max(0, (l - lo) / span)) ** (palette.dark ? 1.05 : 0.78);
    // Levels, then a little more color, so the nearest tone is picked by hue as well as by light.
    let c = raw.map(ch => Math.min(1, Math.max(0, l2 + (ch - l) * 1.25))) as RGB;
    const w = Math.min(1, Math.max(0, layout.wash(x, y, u, v)));
    c = c.map((ch, k) => ch + (paper[k] - ch) * w * 0.85) as RGB;
    const d = (bayer(cx, cy) - 0.5) * 0.2;
    const t = nearest([c[0] + d, c[1] + d, c[2] + d], tones.rgb);
    // The dissolve: in blocks of three cells, then finer, so the edge breaks up like the reference's.
    const block = bayer(Math.floor(cx / 3), Math.floor(cy / 3)) * 0.72 + bayer(cx, cy) * 0.28;
    if (t === tones.paper || 1 - w < block) continue;
    const rgb = tones.rgb[t];
    f.size[i] = 1;
    f.col[i * 3] = rgb[0]; f.col[i * 3 + 1] = rgb[1]; f.col[i * 3 + 2] = rgb[2];
    f.life[i] = photo.life((crop.sx + u * crop.sw) / photoSize[0], (crop.sy + v * crop.sh) / photoSize[1], raw);
    f.key[i] = keyOf(tones.rank[t], x, y);
  }
  return sortOrder(f);
}

/** The scattered static the page opens on: dots everywhere, in any tone, not yet anywhere in particular. */
export function staticFormation(g: Grid, palette: Palette, seed = 3): Formation {
  const rand = seeded(seed), f = base(g, rand), tones = tonesOf(palette);
  for (let i = 0; i < g.cells; i++) {
    f.pos[i * 2] = rand() * g.w; f.pos[i * 2 + 1] = rand() * g.h;
    if (rand() > 0.5) continue;
    const t = Math.floor(rand() * tones.paper), rgb = tones.rgb[t];
    f.size[i] = 0.55 + rand() * 0.45;
    f.col[i * 3] = rgb[0]; f.col[i * 3 + 1] = rgb[1]; f.col[i * 3 + 2] = rgb[2];
    f.life[i] = LIFE.static;
    f.key[i] = keyOf(tones.rank[t], f.pos[i * 2] / g.w, f.pos[i * 2 + 1] / g.h);
  }
  return sortOrder(f);
}

/** The work: the photos step back so the projects can have the screen, and what's left is a little dust drifting
 *  down through the light. */
export function dustFormation(g: Grid, palette: Palette, seed = 11): Formation {
  const rand = seeded(seed), f = base(g, rand), tones = tonesOf(palette);
  // The tones nearest the paper, so it stays faint.
  const near = tones.rgb.map((c, i) => [Math.abs(lum(c) - lum(tones.rgb[tones.paper])), i]).filter(x => x[1] !== tones.paper).sort((a, b) => a[0] - b[0]).slice(0, 3).map(x => x[1]);
  for (let i = 0; i < g.cells; i++) {
    if (rand() > 0.07) continue;
    const t = near[Math.floor(rand() * near.length)], rgb = tones.rgb[t];
    f.size[i] = 0.5 + rand() * 0.4;
    f.col[i * 3] = rgb[0]; f.col[i * 3 + 1] = rgb[1]; f.col[i * 3 + 2] = rgb[2];
    f.life[i] = LIFE.dust;
    f.key[i] = keyOf(tones.rank[t], f.pos[i * 2] / g.w, f.pos[i * 2 + 1] / g.h);
  }
  return sortOrder(f);
}

export type Glyph = { x: number; y: number; c: RGB };

/** A formation with the type pool set into the shape of some words (points sampled from the type on screen). */
export function withType(g: Grid, f: Formation, glyphs: Glyph[], palette: Palette): Formation {
  const out: Formation = { pos: f.pos.slice(), size: f.size.slice(), col: f.col.slice(), life: f.life.slice(), key: f.key.slice(), order: f.order };
  const tones = tonesOf(palette), rank = tones.rank[nearest(hex(palette.ink), tones.rgb)];
  const s = (g.typeGap / g.cell) * 0.98;
  for (let k = 0; k < Math.min(glyphs.length, g.typeSlots); k++) {
    const i = g.cells + k, gl = glyphs[k];
    out.pos[i * 2] = gl.x; out.pos[i * 2 + 1] = gl.y;
    out.size[i] = s;
    out.col[i * 3] = gl.c[0]; out.col[i * 3 + 1] = gl.c[1]; out.col[i * 3 + 2] = gl.c[2];
    out.life[i] = LIFE.type;
    out.key[i] = keyOf(rank, gl.x / g.w, gl.y / g.h);
  }
  return sortOrder(out);
}

/** Pairs dots with slots: the dot at each rank (by `keys`, the dots' current standing) takes the slot at the same
 *  rank in the next formation. Returns, for each dot, the slot it goes to. */
export function pair(keys: Float32Array, next: Formation): Uint32Array {
  const n = keys.length, dots = new Uint32Array(n);
  for (let i = 0; i < n; i++) dots[i] = i;
  dots.sort((a, b) => keys[a] - keys[b]);
  const to = new Uint32Array(n);
  for (let r = 0; r < n; r++) to[dots[r]] = next.order[r];
  return to;
}

/** Sample a picture of some words into evenly spaced points. `alpha` is the coverage of the words at each pixel of
 *  a w x h canvas laid over the screen from (left, top); `color` gives each point its color. */
export function sampleType(alpha: (x: number, y: number) => number, color: (x: number, y: number) => RGB, w: number, h: number, left: number, top: number, gap: number, limit: number): Glyph[] {
  const out: Glyph[] = [];
  for (let y = gap / 2; y < h; y += gap) {
    // Every other row shifts half a step, so the dots pack like a halftone and read as letters sooner.
    const shift = (Math.round(y / gap) & 1) * gap * 0.5;
    for (let x = gap / 2 + shift; x < w; x += gap) if (alpha(Math.floor(x), Math.floor(y)) > 0.45) out.push({ x: left + x, y: top + y, c: color(Math.floor(x), Math.floor(y)) });
  }
  // Too many for the pool: thin evenly, so the words keep their shape.
  if (out.length <= limit) return out;
  const step = out.length / limit;
  return Array.from({ length: limit }, (_, i) => out[Math.floor(i * step)]);
}
