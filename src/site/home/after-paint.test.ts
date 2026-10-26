import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { afterPaint } from './after-paint';

const frame = () => { vi.advanceTimersToNextFrame(); vi.advanceTimersByTime(1); };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('afterPaint', () => {
  it('runs each job after a paint of its own, in the order they were asked for', () => {
    const ran: string[] = [];
    afterPaint(() => ran.push('a'));
    afterPaint(() => { ran.push('b'); afterPaint(() => ran.push('d')); });
    afterPaint(() => ran.push('c'));
    expect(ran).toEqual([]);
    for (const want of [['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd']]) {
      frame();
      expect(ran).toEqual(want);
    }
    expect(vi.getTimerCount()).toBe(0);
  });

  it('skips a cancelled job and leaves nothing waiting once every job is cancelled', () => {
    const ran: string[] = [];
    const a = afterPaint(() => ran.push('a'));
    const b = afterPaint(() => ran.push('b'));
    a();
    frame();
    expect(ran).toEqual(['b']);
    const c = afterPaint(() => ran.push('c'));
    c();
    b();
    expect(vi.getTimerCount()).toBe(0);
    frame();
    expect(ran).toEqual(['b']);
  });
});
