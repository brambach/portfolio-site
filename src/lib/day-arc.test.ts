import { describe, expect, it } from 'vitest';
import { arcStops, dayArcColor, isDarkAt } from './day-arc';

describe('dayArcColor', () => {
  it('returns paper at dawn and night at the end', () => {
    expect(dayArcColor(0)).toBe('rgb(242,235,221)');
    expect(dayArcColor(1)).toBe('rgb(14,20,26)');
  });

  it('hits each stop exactly', () => {
    expect(dayArcColor(0.26)).toBe('rgb(232,201,143)');
    expect(dayArcColor(0.5)).toBe('rgb(28,53,39)');
    expect(dayArcColor(0.72)).toBe('rgb(20,36,44)');
  });

  it('interpolates midway between stops and clamps out-of-range', () => {
    expect(dayArcColor(0.13)).toBe('rgb(237,218,182)');
    expect(dayArcColor(-1)).toBe(dayArcColor(0));
    expect(dayArcColor(2)).toBe(dayArcColor(1));
  });
});

describe('arcStops', () => {
  it('anchors each hour where its section sits and pins the endpoints', () => {
    const stops = arcStops({
      hero: 0,
      work: 0.18,
      made: 0.34,
      'off-the-clock': 0.55,
      'vibe-board': 0.74,
      'after-dark': 0.94,
    });
    expect(stops[0]).toEqual([0, [242, 235, 221]]);
    expect(stops.map(([t]) => t)).toEqual([0, 0.18, 0.34, 0.55, 0.74, 0.94, 1]);
    // golden holds through the index, night holds to the end
    expect(stops[2][1]).toEqual([232, 201, 143]);
    expect(stops[6][1]).toEqual([14, 20, 26]);
  });

  it('lets the lerp run through missing sections and stays sorted', () => {
    const stops = arcStops({ 'after-dark': 0.8, hero: 0, work: 0.3 });
    expect(stops.map(([t]) => t)).toEqual([0, 0.3, 0.8, 1]);
  });

  it('keeps the ground light through the whole index', () => {
    const stops = arcStops({ hero: 0, work: 0.2, made: 0.4, 'off-the-clock': 0.6 });
    expect(isDarkAt(0.4, stops)).toBe(false);
    expect(isDarkAt(0.6, stops)).toBe(true);
  });
});

describe('isDarkAt', () => {
  it('is light on paper and golden, dark from oak onward', () => {
    expect(isDarkAt(0)).toBe(false);
    expect(isDarkAt(0.26)).toBe(false);
    expect(isDarkAt(0.5)).toBe(true);
    expect(isDarkAt(0.72)).toBe(true);
    expect(isDarkAt(1)).toBe(true);
  });
});
