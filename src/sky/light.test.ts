import { describe, expect, it } from 'vitest';
import { isNight, localHour, oklch, SKY_STOPS } from './light';

describe('the light', () => {
  it('follows the visitor’s hour, or ?hour= when previewing', () => {
    const noon = new Date(2026, 9, 5, 12, 0);
    expect(localHour('', noon)).toBe(12);
    expect(localHour('?hour=22', noon)).toBe(22);
    expect(localHour('?hour=0', noon)).toBe(0);
    expect(localHour('?hour=', noon)).toBe(12);
    expect(localHour('?hour=25', noon)).toBe(12);
    expect(localHour('?hour=dawn', noon)).toBe(12);
  });
  it('is a moon from 9pm to 5am', () => {
    expect([20, 21, 23, 0, 4, 5, 12].map(isNight)).toEqual([false, true, true, true, true, false, false]);
  });
  it('turns the sky stops into the colours the CSS paints', () => {
    // The top of the sky is a deep navy, the bottom a warm dusk.
    const [top, , , bottom] = SKY_STOPS.map(stop => oklch(...stop));
    expect(top[2]).toBeGreaterThan(top[0]);
    expect(bottom[0]).toBeGreaterThan(bottom[2]);
    expect(oklch(1, 0, 0)).toEqual([255, 255, 255]);
    expect(oklch(0, 0, 0)).toEqual([0, 0, 0]);
  });
});
