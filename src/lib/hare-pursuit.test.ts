import { describe, expect, it } from 'vitest';
import { MAX_SPEED, pursue } from './hare-pursuit';

describe('pursue', () => {
  it('closes small gaps smoothly without overshooting', () => {
    let pos = 0;
    for (let i = 0; i < 60; i++) pos = pursue(pos, 100, 16);
    expect(pos).toBeGreaterThan(97);
    expect(pos).toBeLessThanOrEqual(100);
  });

  it('caps speed on big gaps so the gallop stays visible', () => {
    const pos = pursue(0, 5000, 16);
    expect(pos).toBeCloseTo(MAX_SPEED * 16, 5);
  });

  it('runs backward the same way', () => {
    const pos = pursue(5000, 0, 16);
    expect(pos).toBeCloseTo(5000 - MAX_SPEED * 16, 5);
  });

  it('is roughly frame-rate independent', () => {
    let a = 0;
    for (let i = 0; i < 30; i++) a = pursue(a, 300, 16);
    let b = 0;
    for (let i = 0; i < 15; i++) b = pursue(b, 300, 32);
    expect(Math.abs(a - b)).toBeLessThan(30);
  });

  it('holds still when it has arrived', () => {
    expect(pursue(100, 100, 16)).toBe(100);
  });
});
