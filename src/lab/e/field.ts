import { hex, lum, type Palette, type RGB } from './palette';
import { containBox, LIFE, type Art, type Layout } from './scenes';

/* The dots, as numbers. Nothing here touches the page, so it's all testable.

   The screen is a grid of cells, one dot per cell, plus a pool of extra dots that only ever become type. A
   formation says, for every dot slot, where it sits, its color, whether it shows and how it lives. Moving from one
   formation to the next means pairing each dot with a slot in the next one. Slots are ranked by tone and then by
   position across the screen, and the dot at each rank goes to the slot at the same rank, so dark dots go to dark
   places and light to light, and each tone sweeps across together instead of scattering. */

export type Grid = { w: number; h: number; cell: number; cols: number; rows: number; cells: number; typeSlots: number; n: number; typeGap: number; drips: number };

/** One dot per cell, plus the pool. Cells are big enough that the objects read as bold, crisp dots (9px on a
 *  laptop, 7 on a phone), and grow on big screens so there are never more than about 30,000 dots, and phones get
 *  fewer. The tagline's dots keep their own finer spacing, so the words stay sharp. The last few dots of the pool
 *  are the ones that drip off the hero's picture. */
export function makeGrid(w: number, h: number, phone: boolean): Grid {
  const budget = phone ? 9000 : 30000, fine = Math.max(phone ? 6.5 : 7, Math.sqrt((w * h) / budget));
  const cell = Math.max(phone ? 7 : 9, fine);
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), cells = cols * rows, typeSlots = phone ? 2600 : 5200;
  return { w, h, cell, cols, rows, cells, typeSlots, n: cells + typeSlots, typeGap: fine * (phone ? 0.62 : 0.7), drips: phone ? 18 : 28 };
}

export type Formation = {
  /** x, y per slot, in CSS pixels. */
  pos: Float32Array;
  /** 0 hidden, 1 a full dot. Type dots are sized against the cell, so theirs is smaller. */
  size: Float32Array;
  col: Float32Array;
  life: Float32Array;
  /** Two numbers per slot that go with its life (see LIFE in scenes.ts). */
  aux: Float32Array;
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

/** The palette's four object tones with the paper last. A tone's rank is its place in the art (navy, teal,
 *  peach, cream), so a morph sends navy to navy, cream to cream, whatever the palette makes of them. */
export function objectTonesOf(p: Palette): Tones {
  const rgb = [...p.object, p.paper].map(hex);
  return { rgb, rank: [0, 1, 2, 3, 4], paper: 4 };
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
  return { pos: new Float32Array(n * 2), size: new Float32Array(n), col: new Float32Array(n * 3), life: new Float32Array(n), aux: new Float32Array(n * 2), key: new Float32Array(n), order: new Uint32Array(n) };
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

/** A photo as dots, for the portrait. `pixels` is the photo already cropped to the layout's rectangle and scaled
 *  to about one pixel per cell (the page does that with a canvas). It's dithered into the same four tones as the
 *  objects, so the morphs in and out of it pair navy with navy, and its edges dissolve in blocks. */
export function photoFormation(g: Grid, layout: Layout, art: Art, pixels: Pixels, palette: Palette, seed = 7): Formation {
  const rand = seeded(seed), f = base(g, rand), tones = objectTonesOf(palette);
  const [x0, y0, x1, y1] = layout.rect;

  // Stretch the photo across the tones' range, so it uses all four.
  const ls: number[] = [];
  for (let i = 0; i < pixels.width * pixels.height; i += 3) ls.push(lum([pixels.data[i * 4] / 255, pixels.data[i * 4 + 1] / 255, pixels.data[i * 4 + 2] / 255]));
  ls.sort((a, b) => a - b);
  const lo = ls[Math.floor(ls.length * 0.02)] ?? 0, hi = ls[Math.floor(ls.length * 0.98)] ?? 1, span = Math.max(0.08, hi - lo);
  // The four tones from dark to light, whatever the palette, so the photo keeps its light and shade at night too.
  const ladder = [0, 1, 2, 3].sort((a, b) => lum(tones.rgb[a]) - lum(tones.rgb[b]));

  for (let i = 0; i < g.cells; i++) {
    const cx = i % g.cols, cy = Math.floor(i / g.cols);
    const x = f.pos[i * 2] / g.w, y = f.pos[i * 2 + 1] / g.h;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    const u = (x - x0) / (x1 - x0), v = (y - y0) / (y1 - y0);
    const px = Math.min(pixels.width - 1, Math.floor(u * pixels.width)), py = Math.min(pixels.height - 1, Math.floor(v * pixels.height));
    const o = (py * pixels.width + px) * 4;
    const raw: RGB = [pixels.data[o] / 255, pixels.data[o + 1] / 255, pixels.data[o + 2] / 255];
    const l = Math.min(1, Math.max(0, (lum(raw) - lo) / span));
    const w = Math.min(1, Math.max(0, layout.wash(x, y, u, v)));
    // The dissolve: in blocks of three cells, then finer, so the edge breaks up like the reference's.
    const block = bayer(Math.floor(cx / 3), Math.floor(cy / 3)) * 0.72 + bayer(cx, cy) * 0.28;
    if (1 - w < block) continue;
    // Light picks the step on the ladder, dithered. The step nearest the paper is left as paper, so the face has
    // air round it: the brightest on a light page, the darkest at night.
    let step = Math.floor(l * 4.6 + (bayer(cx, cy) - 0.5) * 0.9);
    if (palette.dark) step -= 1;
    if (palette.dark ? step < 0 : step > 3) continue;
    const t = ladder[Math.min(3, Math.max(0, step))], rgb = tones.rgb[t];
    f.size[i] = 1;
    f.col[i * 3] = rgb[0]; f.col[i * 3 + 1] = rgb[1]; f.col[i * 3 + 2] = rgb[2];
    f.life[i] = art.life(u * art.size[0], v * art.size[1], t) as number;
    f.key[i] = keyOf(tones.rank[t], x, y);
  }
  return sortOrder(f);
}

/** The colors the art is drawn in (navy, teal, peach, cream), as the generator made them. The pink round them is
 *  read off the corners of each picture. */
const ART_TONES: RGB[] = [[20, 45, 90], [45, 140, 150], [245, 165, 128], [250, 236, 212]].map(c => c.map(v => v / 255) as RGB);

/** Which of the art's four tones each pixel is, or 4 for the pink it stands on. */
export function keyArt(pixels: Pixels): Uint8Array {
  const { width: w, height: h, data } = pixels, out = new Uint8Array(w * h);
  const corner: RGB[] = [];
  for (const [cx, cy] of [[0, 0], [w - 6, 0], [0, h - 6], [w - 6, h - 6]]) for (let y = cy; y < cy + 6; y++) for (let x = cx; x < cx + 6; x++) {
    const o = (y * w + x) * 4; corner.push([data[o] / 255, data[o + 1] / 255, data[o + 2] / 255]);
  }
  const mid = (k: number) => corner.map(c => c[k]).sort((a, b) => a - b)[corner.length >> 1];
  const refs = [...ART_TONES, [mid(0), mid(1), mid(2)] as RGB];
  // The same distance as nearest(), written out flat: it runs once per pixel.
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4] / 255, g = data[i * 4 + 1] / 255, bl = data[i * 4 + 2] / 255;
    let best = 0, bestD = Infinity;
    for (let k = 0; k < 5; k++) {
      const t = refs[k], dr = r - t[0], dg = g - t[1], db = bl - t[2], rm = (r + t[0]) / 2;
      const d = (2 + rm) * dr * dr + 4 * dg * dg + (3 - rm) * db * db;
      if (d < bestD) { bestD = d; best = k; }
    }
    out[i] = best;
  }
  return out;
}

/** One of the bold objects as dots. The whole picture is fitted into the layout's rectangle. Each cell takes the
 *  tone most of its pixels are, and is left as paper unless about a quarter of it is object, so thin lines like
 *  the plane's dashed trail survive. With `drips`, the last few dots of the pool sit on the object's lower edge,
 *  ready to fall (or, with reduced motion, lie in a small heap at the bottom of the screen). */
export function objectFormation(g: Grid, layout: Layout, art: Art, pixels: Pixels, palette: Palette, opts: { seed?: number; drips?: boolean; still?: boolean } = {}): Formation {
  const rand = seeded(opts.seed ?? 5), f = base(g, rand), tones = objectTonesOf(palette);
  const [x0, y0, x1, y1] = layout.rect;
  const box = containBox(pixels.width, pixels.height, x0 * g.w, y0 * g.h, (x1 - x0) * g.w, (y1 - y0) * g.h, layout.align);
  const cls = keyArt(pixels), counts = new Uint16Array(5);
  const [ax0, ay0, ax1, ay1] = art.crop, toArtX = (u: number) => ax0 + u * (ax1 - ax0), toArtY = (v: number) => ay0 + v * (ay1 - ay0);
  const pivot = art.pivot && [box.x + ((art.pivot[0] - ax0) / (ax1 - ax0)) * box.w, box.y + ((art.pivot[1] - ay0) / (ay1 - ay0)) * box.h];
  const lowest = new Int32Array(g.cols).fill(-1);

  for (let i = 0; i < g.cells; i++) {
    const cx = i % g.cols, cy = Math.floor(i / g.cols);
    const x = f.pos[i * 2], y = f.pos[i * 2 + 1];
    // The pixels under this cell.
    const u0 = (x - g.cell / 2 - box.x) / box.w, u1 = (x + g.cell / 2 - box.x) / box.w;
    const v0 = (y - g.cell / 2 - box.y) / box.h, v1 = (y + g.cell / 2 - box.y) / box.h;
    if (u1 <= 0 || u0 >= 1 || v1 <= 0 || v0 >= 1) continue;
    const px0 = Math.max(0, Math.floor(u0 * pixels.width)), px1 = Math.min(pixels.width, Math.max(px0 + 1, Math.ceil(u1 * pixels.width)));
    const py0 = Math.max(0, Math.floor(v0 * pixels.height)), py1 = Math.min(pixels.height, Math.max(py0 + 1, Math.ceil(v1 * pixels.height)));
    counts.fill(0);
    for (let py = py0; py < py1; py++) for (let px = px0; px < px1; px++) counts[cls[py * pixels.width + px]]++;
    const total = (px1 - px0) * (py1 - py0);
    if (counts[4] > total * 0.76) continue;
    let t = 0;
    for (let k = 1; k < 4; k++) if (counts[k] > counts[t]) t = k;
    const rgb = tones.rgb[t];
    f.size[i] = 1;
    f.col[i * 3] = rgb[0]; f.col[i * 3 + 1] = rgb[1]; f.col[i * 3 + 2] = rgb[2];
    const u = (x - box.x) / box.w, v = (y - box.y) / box.h;
    const life = art.life(toArtX(u), toArtY(v), t);
    if (typeof life === 'number') f.life[i] = life;
    else { f.life[i] = life[0]; f.aux[i * 2] = life[1]; f.aux[i * 2 + 1] = life[2]; }
    if (pivot) { f.aux[i * 2] = x - pivot[0]; f.aux[i * 2 + 1] = y - pivot[1]; }
    f.key[i] = keyOf(tones.rank[t], x / g.w, y / g.h);
    if (cy > lowest[cx]) lowest[cx] = cy;
  }

  if (opts.drips) {
    // The bottom edge of the object, one cell per column, and a few of those picked to drip.
    const edge: number[] = [];
    for (let c = 0; c < g.cols; c++) if (lowest[c] >= 0) edge.push(lowest[c] * g.cols + c);
    const heapX = edge.length ? edge.reduce((s, i) => s + f.pos[i * 2], 0) / edge.length : g.w / 2;
    for (let k = 0; k < g.drips && edge.length; k++) {
      const s = g.n - g.drips + k, from = edge[Math.floor(rand() * edge.length)];
      f.col.set(f.col.subarray(from * 3, from * 3 + 3), s * 3);
      f.key[s] = f.key[from] + 0.0001 * (k + 1);
      if (opts.still) {
        // A small heap where the sand would have piled up: rows of 7, 5, 3 and 1, and any left over not shown.
        const rows = [7, 5, 3, 1];
        let r = 0, left = k;
        while (r < rows.length && left >= rows[r]) { left -= rows[r]; r++; }
        if (r >= rows.length) continue;
        f.pos[s * 2] = heapX + (left - (rows[r] - 1) / 2) * g.cell * 0.9;
        f.pos[s * 2 + 1] = g.h - g.cell * (0.5 + r * 0.8);
        f.size[s] = 0.8;
        f.life[s] = LIFE.still;
      } else {
        f.pos[s * 2] = f.pos[from * 2]; f.pos[s * 2 + 1] = f.pos[from * 2 + 1];
        f.size[s] = 0.75;
        f.life[s] = LIFE.drip;
      }
    }
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
  const out: Formation = { pos: f.pos.slice(), size: f.size.slice(), col: f.col.slice(), life: f.life.slice(), aux: f.aux.slice(), key: f.key.slice(), order: f.order };
  const tones = tonesOf(palette), rank = tones.rank[nearest(hex(palette.ink), tones.rgb)];
  const s = (g.typeGap / g.cell) * 0.98;
  // The last few slots are the drips, so the words stop short of them.
  for (let k = 0; k < Math.min(glyphs.length, g.typeSlots - g.drips); k++) {
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
