import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DirectionE from './DirectionE';
import { bayer, makeGrid, pair, photoFormation, sampleType, staticFormation, tonesOf, withType } from './field';
import { hex, hourFor, PALETTES, timeOf } from './palette';
import { layoutFor, PHOTOS, SCENE_ORDER } from './scenes';

// jsdom has no canvas, WebGL or font loading, so the dots don't start and the page is just its words.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => vi.restoreAllMocks());

describe('Direction E', () => {
  it('leads with the tagline, has a part for every scene and ends with a way to say hello', () => {
    const { container, unmount } = render(<DirectionE />);
    expect(screen.getByRole('heading', { level: 1, name: 'I design it, make it move, and build it.' })).toBeInTheDocument();
    expect([...container.querySelectorAll<HTMLElement>('[data-scene]')].map(el => el.dataset.scene)).toEqual(SCENE_ORDER);
    expect(screen.getByRole('img', { name: /portrait of Bryce Rambach/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryce\.rambach@gmail\.com/ })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello' })).toBeInTheDocument();
    unmount();
    expect(document.documentElement.dataset.labE).toBeUndefined();
  });
});

describe('E’s time of day', () => {
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

describe('E’s dots', () => {
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

  it('turns a photo into dots in the palette’s tones, dissolved where it washes out', () => {
    const g = makeGrid(280, 140, false);
    const w = 40, h = 20, data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { const x = i % w; data.set([x * 6, 120, 255 - x * 6, 255], i * 4); }
    const layout = { rect: [0, 0, 1, 1] as [number, number, number, number], wash: (x: number) => (x > 0.5 ? 1 : 0) };
    const f = photoFormation(g, layout, PHOTOS.hero, [w, h], { width: w, height: h, data }, palette);
    const tones = tonesOf(palette).rgb;
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

  it('names no places in what it says about the photos', () => {
    for (const p of Object.values(PHOTOS)) expect(p.caption).toMatch(/^(A|An) [a-z ]+$/);
  });
});
