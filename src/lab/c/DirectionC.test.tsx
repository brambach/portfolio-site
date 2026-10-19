import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TAGLINE } from '../content';
import { clockAt, dayFromScroll, readLocal, remap, scrollFromDay, startNote, startOf } from './day';
import DirectionC from './DirectionC';
import { spring, springEasing, step } from './spring';

// jsdom has no WebGL or scrolling; the sky simply keeps its CSS gradient.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(() => { vi.restoreAllMocks(); });

describe('direction C', () => {
  it('leads with the tagline and ends with a way to say hello', () => {
    render(<DirectionC />);
    expect(screen.getByRole('heading', { level: 1, name: TAGLINE })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('link', { name: /Open Dervo/ })).toHaveAttribute('href', '/projects/dervo');
    expect(screen.getByRole('slider', { name: 'Time of day' })).toBeInTheDocument();
  });
});

describe('the visitor’s day', () => {
  it('starts at their own hour, and at first light at night', () => {
    expect(startOf(readLocal('?hour=13')).kind).toBe('now');
    expect(startOf(readLocal('?hour=23'))).toEqual({ D: 0, kind: 'night' });
    expect(startOf(readLocal('?hour=18')).kind).toBe('late');
    expect(clockAt(0)).toBe('5:48 am');
    expect(clockAt(1)).toBe('7:44 pm');
    expect(remap(0.5, 1)).toBe(1);
    expect(startNote(readLocal('?hour=23'), startOf(readLocal('?hour=23')))).toBe('Previewing 11:00 pm, so the day starts at first light.');
  });
  it('maps scroll to the time of day and back', () => {
    const anchors = [{ y: 0, D: 0.2 }, { y: 1000, D: 0.6 }, { y: 2000, D: 1 }];
    expect(dayFromScroll(anchors, 500)).toBeCloseTo(0.4);
    expect(scrollFromDay(anchors, 0.8)).toBeCloseTo(1500);
    expect(dayFromScroll(anchors, -50)).toBe(0.2);
  });
});

describe('springs', () => {
  it('settle on their target', () => {
    const s = spring(0);
    s.to = 10;
    for (let i = 0; i < 240; i++) step(s, 1 / 60, { k: 120, c: 22 });
    expect(s.x).toBeCloseTo(10, 2);
  });
  it('make a CSS curve that ends at 1', () => {
    const { easing, ms } = springEasing({ k: 260, c: 15 });
    expect(easing.startsWith('linear(0.000')).toBe(true);
    expect(easing.endsWith('1.000)')).toBe(true);
    expect(ms).toBeGreaterThan(100);
  });
});
