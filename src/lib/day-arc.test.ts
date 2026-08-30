import { describe, expect, it } from 'vitest';
import { dayArcColor, isDarkAt } from './day-arc';

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

describe('isDarkAt', () => {
  it('is light on paper and golden, dark from oak onward', () => {
    expect(isDarkAt(0)).toBe(false);
    expect(isDarkAt(0.26)).toBe(false);
    expect(isDarkAt(0.5)).toBe(true);
    expect(isDarkAt(0.72)).toBe(true);
    expect(isDarkAt(1)).toBe(true);
  });
});
