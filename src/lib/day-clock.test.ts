import { describe, expect, it } from 'vitest';
import { dayClockLabel } from './day-clock';

describe('dayClockLabel', () => {
  it('opens at first light', () => {
    expect(dayClockLabel(0)).toBe('5:47 am');
  });

  it('closes just before midnight', () => {
    expect(dayClockLabel(1)).toBe('11:58 pm');
  });

  it('reads mid-afternoon halfway down the page', () => {
    expect(dayClockLabel(0.5)).toBe('2:53 pm');
  });

  it('clamps outside the day', () => {
    expect(dayClockLabel(-0.2)).toBe('5:47 am');
    expect(dayClockLabel(1.4)).toBe('11:58 pm');
  });

  it('pads minutes like a clock should', () => {
    expect(dayClockLabel(0.002)).toMatch(/^\d{1,2}:\d{2} (am|pm)$/);
  });
});
