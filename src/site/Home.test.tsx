import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import { bayer, introPlan, keyArt, makeGrid, objectFormation, objectTonesOf, pair, photoFormation, sampleType, staticFormation, withType } from './field';
import { hex, hourFor, PALETTES, timeOf } from './palette';
import { ART, LIFE, layoutFor, SCENE_ORDER } from './scenes';

// jsdom has no canvas, WebGL or font loading, so the dots don't start and the page is just its words.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => vi.restoreAllMocks());

describe('The home page', () => {
  it('leads with the tagline, has a part for every scene and ends with a way to say hello', () => {
    const { container, unmount } = render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'I design it, make it move, and build it.' })).toBeInTheDocument();
    expect([...container.querySelectorAll<HTMLElement>('[data-scene]')].map(el => el.dataset.scene)).toEqual(SCENE_ORDER);
    expect(screen.getByRole('img', { name: /portrait of Bryce Rambach/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryce\.rambach@gmail\.com/ })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello' })).toBeInTheDocument();
    unmount();
    expect(document.documentElement.dataset.e).toBeUndefined();
  });
});

describe('The site’s time of day', () => {
  it('picks the palette from the hour', () => {
    expect(timeOf(6)).toBe('dawn');
    expect(timeOf(9.9)).toBe('dawn');
    expect(timeOf(12)).toBe('day');
    expect(timeOf(17)).toBe('golden');
    expect(timeOf(19.6)).toBe('night');
    expect(timeOf(2)).toBe('night');
  });

  it('takes ?hour= as a preview, and otherwise reads the clock', () => {
    const noon = new Date(2026, 9, 20, 12, 30);
    expect(hourFor('?hour=7', noon)).toBe(7);
    expect(hourFor('?hour=17:30', noon)).toBe(17.5);
    expect(hourFor('?hour=6.25', noon)).toBe(6.25);
    expect(hourFor('?hour=banana', noon)).toBe(12.5);
    expect(hourFor('?hour=31', noon)).toBe(12.5);
    expect(hourFor('', noon)).toBe(12.5);
  });

  it('keeps the type readable on its paper at every hour', () => {
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const L = (h: string) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
    for (const p of Object.values(PALETTES)) {
      const [a, b] = [L(p.ink), L(p.paper)].sort((x, y) => y - x);
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThan(7);
    }
  });

  it('paints the same paper before the page loads as the page does', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const p of Object.values(PALETTES)) expect(html).toContain(`'${p.paper}'`);
  });
});

describe('The site’s dots', () => {
  const palette = PALETTES.dawn;

  it('keeps the dot count down on big screens and phones', () => {
    expect(makeGrid(1440, 900, false).cells).toBeLessThan(31000);
    expect(makeGrid(2560, 1440, false).cells).toBeLessThan(31500);
    expect(makeGrid(390, 844, true).cells).toBeLessThan(9500);
  });

  it('pairs every dot with exactly one slot', () => {
    const g = makeGrid(300, 200, false);
    const from = staticFormation(g, palette, 1), to = staticFormation(g, palette, 2);
    const slots = pair(from.key, to);
    expect(new Set(slots).size).toBe(g.n);
  });

  it('turns the portrait into dots in the four object tones, dissolved where it washes out', () => {
    const g = makeGrid(280, 140, false);
    const w = 40, h = 20, data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { const x = i % w; data.set([x * 6, 120, 255 - x * 6, 255], i * 4); }
    const layout = { rect: [0, 0, 1, 1] as [number, number, number, number], align: [0.5, 0.5] as [number, number], wash: (x: number) => (x > 0.5 ? 1 : 0) };
    const f = photoFormation(g, layout, ART.intro, { width: w, height: h, data }, palette);
    const tones = objectTonesOf(palette).rgb.slice(0, 4);
    let left = 0, right = 0;
    for (let i = 0; i < g.cells; i++) {
      if (!f.size[i]) continue;
      if (f.pos[i * 2] / g.w > 0.5) right++; else left++;
      const c = [f.col[i * 3], f.col[i * 3 + 1], f.col[i * 3 + 2]];
      expect(tones.some(t => t.every((v, k) => Math.abs(v - c[k]) < 1e-6))).toBe(true);
    }
    expect(left).toBeGreaterThan(100);
    expect(right).toBe(0);
  });

  it('leaves the portrait’s keyed-out wall as bare paper', () => {
    const g = makeGrid(280, 140, false);
    const w = 40, h = 20, data = new Uint8ClampedArray(w * h * 4);
    // A grey ramp, with the right half keyed out (no alpha).
    for (let i = 0; i < w * h; i++) { const x = i % w; data.set([x * 6, x * 6, x * 6, x < w / 2 ? 255 : 0], i * 4); }
    const layout = { rect: [0, 0, 1, 1] as [number, number, number, number], align: [0.5, 0.5] as [number, number], wash: () => 0 };
    const f = photoFormation(g, layout, ART.intro, { width: w, height: h, data }, palette);
    let left = 0, right = 0;
    for (let i = 0; i < g.cells; i++) if (f.size[i]) { if (f.pos[i * 2] / g.w > 0.52) right++; else left++; }
    expect(left).toBeGreaterThan(50);
    expect(right).toBe(0);
  });

  it('opens on a field with one dot in every cell, and assembles the first picture out of it', () => {
    const g = makeGrid(540, 360, false), f = objectFormation(g, whole, ART.hero, art(), palette, { drips: true });
    const plan = introPlan(g, f);
    // At the start every cell shows exactly one dot, whoever it belongs to.
    const at = new Map<string, number>();
    for (let i = 0; i < g.n; i++) if (plan.shown[i]) { const k = `${plan.from[i * 2]},${plan.from[i * 2 + 1]}`; at.set(k, (at.get(k) ?? 0) + 1); }
    expect(at.size).toBe(g.cells);
    expect([...at.values()].every(v => v === 1)).toBe(true);
    // Every dot the picture shows comes in from somewhere in the field, and the drips wait hidden.
    for (let i = 0; i < g.n; i++) {
      if (f.size[i] > 0 && f.life[i] !== LIFE.drip) expect(plan.shown[i]).toBe(1);
      if (f.life[i] === LIFE.drip) expect(plan.shown[i]).toBe(0);
      expect(plan.delay[i]).toBeGreaterThanOrEqual(0);
      expect(plan.delay[i]).toBeLessThanOrEqual(plan.last + 1);
    }
    // The darkest tone goes first.
    const wave = (t: number) => { const d: number[] = []; for (let i = 0; i < g.n; i++) if (f.size[i] > 0 && f.life[i] !== LIFE.drip && Math.floor(f.key[i]) === t) d.push(plan.delay[i]); return d.reduce((a, b) => a + b, 0) / d.length; };
    expect(wave(0)).toBeLessThan(wave(1));
  });

  it('samples words into evenly spaced points, thinned to fit the pool', () => {
    const inside = (x: number, y: number) => (x > 10 && x < 90 && y > 10 && y < 40 ? 1 : 0);
    const all = sampleType(inside, () => [0, 0, 0], 100, 50, 0, 0, 4, 10000);
    expect(all.length).toBeGreaterThan(100);
    expect(sampleType(inside, () => [0, 0, 0], 100, 50, 0, 0, 4, 50)).toHaveLength(50);
    const g = makeGrid(100, 50, false), f = withType(g, staticFormation(g, palette), all, palette);
    expect(f.size[g.cells]).toBeGreaterThan(0);
  });

  it('dithers with every level of a 4x4 matrix', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(bayer(x, y));
    expect(seen.size).toBe(16);
  });

  it('gives every part a layout inside the screen, on both widths', () => {
    for (const id of SCENE_ORDER) for (const phone of [false, true]) {
      const [x0, y0, x1, y1] = layoutFor(id, phone).rect;
      expect(x0).toBeGreaterThanOrEqual(0); expect(y0).toBeGreaterThanOrEqual(0);
      expect(x1).toBeLessThanOrEqual(1); expect(y1).toBeLessThanOrEqual(1);
      expect(x1 > x0 && y1 > y0).toBe(true);
    }
  });

  it('names no places in what it says about the pictures', () => {
    for (const p of Object.values(ART)) expect(p.caption).toMatch(/^(A|An|Two) [a-z ]+$/);
  });

  // A pink picture with a navy square in the middle and a thin teal line under it, like the art in photos2.
  const art = (w = 60, h = 40) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = Math.floor(i / w);
      const square = x >= 20 && x < 40 && y >= 10 && y < 26, line = y === 30 && x >= 10 && x < 50;
      data.set(square ? [22, 46, 92, 255] : line ? [44, 140, 150, 255] : [252, 214, 216, 255], i * 4);
    }
    return { width: w, height: h, data };
  };
  const whole = { rect: [0, 0, 1, 1] as [number, number, number, number], align: [0.5, 0.5] as [number, number], wash: () => 0 };

  it('keys the pink out of the art and reads its four tones', () => {
    const k = keyArt(art());
    expect(k[0]).toBe(4);
    expect(k[15 * 60 + 30]).toBe(0);
    expect(k[30 * 60 + 30]).toBe(1);
  });

  it('draws an object as a silhouette on bare paper, thin lines and all, in the palette’s object tones', () => {
    for (const p of Object.values(PALETTES)) {
      const g = makeGrid(540, 360, false), f = objectFormation(g, whole, ART.design, art(), p);
      const tones = objectTonesOf(p).rgb;
      let navy = 0, teal = 0, outside = 0;
      for (let i = 0; i < g.cells; i++) {
        if (!f.size[i]) continue;
        const x = f.pos[i * 2] / g.w, y = f.pos[i * 2 + 1] / g.h, c = [f.col[i * 3], f.col[i * 3 + 1], f.col[i * 3 + 2]];
        if (c.every((v, k) => Math.abs(v - tones[0][k]) < 1e-6)) navy++;
        if (c.every((v, k) => Math.abs(v - tones[1][k]) < 1e-6)) teal++;
        if (y < 0.2 || y > 0.8 || x < 0.12 || x > 0.88) outside++;
      }
      expect(navy).toBeGreaterThan(60);
      expect(teal).toBeGreaterThan(10);
      expect(outside).toBe(0);
    }
  });

  it('puts a few drips on the plane’s lower edge, or a still heap at the bottom with reduced motion', () => {
    const g = makeGrid(540, 360, false), drips = Array.from({ length: g.drips }, (_, k) => g.n - g.drips + k);
    const moving = objectFormation(g, whole, ART.hero, art(), palette, { drips: true });
    for (const s of drips) {
      expect(moving.life[s]).toBe(LIFE.drip);
      expect(moving.pos[s * 2 + 1] / g.h).toBeGreaterThan(0.6);
    }
    const still = objectFormation(g, whole, ART.hero, art(), palette, { drips: true, still: true });
    const shown = drips.filter(s => still.size[s] > 0);
    expect(shown.length).toBe(16);
    for (const s of shown) { expect(still.life[s]).toBe(LIFE.still); expect(still.pos[s * 2 + 1]).toBeGreaterThan(g.h - g.cell * 4); }
  });

  it('keeps every object tone clear of its paper, so no picture sinks into the page at any hour', () => {
    const lab = (h: string) => {
      const [r, g, b] = hex(h).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
      return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
    };
    const dE = (a: string, b: string) => Math.hypot(...lab(a).map((v, k) => v - lab(b)[k]));
    for (const p of Object.values(PALETTES)) {
      p.object.forEach((t, k) => expect(dE(t, p.paper)).toBeGreaterThan(k === 3 ? 14 : 40));
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(dE(p.object[i], p.object[j])).toBeGreaterThan(28);
      // The cup's steam stands out from the paper wherever it has its own tone.
      if (p.steam) expect(dE(p.steam, p.paper)).toBeGreaterThan(30);
    }
    expect(PALETTES.dawn.steam && PALETTES.day.steam).toBeTruthy();
  });
});
