import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY_BEATS } from '../content';
import { clockAt, cssLand, horizonAt, lightAt, lookAt, starsAt } from './day';
import DirectionD from './DirectionD';

// jsdom has no canvas, WebGL or font loading; the landscape falls back to its gradient and the motion doesn't start.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => vi.restoreAllMocks());

describe('Direction D', () => {
  it('leads with the tagline and ends with a way to say hello', () => {
    const { unmount } = render(<DirectionD />);
    expect(screen.getByRole('heading', { level: 1, name: 'I design it, make it move, and build it.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryce\.rambach@gmail\.com/ })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getAllByRole('link', { name: /Dervo/ }).some(a => a.getAttribute('href') === '/projects/dervo')).toBe(true);
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello' })).toBeInTheDocument();
    unmount();
  });
});

describe('D’s day', () => {
  const days = Array.from({ length: 101 }, (_, i) => i / 100);

  it('never puts the light inside the frame, so there is never a sun to see', () => {
    for (const tall of [false, true]) for (const d of days) {
      const { x, y } = lightAt(d, horizonAt(d, tall));
      expect(x < 0 || x > 1 || y > 1).toBe(true);
    }
  });

  it('keeps the sky dark enough for the cream type at every hour', () => {
    // WCAG contrast of the page's ink (#ecebe6) on each color, before the shade the page adds behind the words.
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const contrast = (c: number[]) => (lum([0xec / 255, 0xeb / 255, 0xe6 / 255]) + 0.05) / (lum(c) + 0.05);
    for (const d of days) {
      const look = lookAt(d);
      for (const c of [look.zenith, look.middle, look.land]) expect(contrast(c)).toBeGreaterThan(4.5);
    }
  });

  it('reads each part’s own hour on the clock when you’re on it', () => {
    for (const beat of DAY_BEATS) expect(clockAt(beat.at)).toBe(beat.time);
  });

  it('only lets the stars out at the very end', () => {
    expect(starsAt(0.5)).toBe(0);
    expect(starsAt(0.9)).toBe(0);
    expect(starsAt(1)).toBe(1);
  });

  it('has a gradient for browsers without WebGL', () => {
    expect(cssLand(0.5)).toMatch(/^linear-gradient\(to bottom, rgb\(/);
  });
});
