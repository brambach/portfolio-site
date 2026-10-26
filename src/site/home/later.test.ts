import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { later } from './later';

// A page of blocks at the given tops, all waiting.
const page = (tops: number[]) => {
  const root = document.createElement('div');
  for (const top of tops) {
    const el = root.appendChild(document.createElement('section'));
    el.setAttribute('data-later', '');
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
  }
  return root;
};
const waiting = (root: HTMLElement) => [...root.children].map(el => el.hasAttribute('data-later'));
// The next frame, and the task after it, where work held for after the paint runs.
const frame = () => { vi.advanceTimersToNextFrame(); vi.advanceTimersByTime(1); };

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('innerHeight', 800); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('later', () => {
  it('lets in the blocks on the first screen at the first frame, and the rest one a frame after it, top down', () => {
    const root = page([300, 700, 900, 1600]);
    const stop = later(root, false);
    expect(waiting(root)).toEqual([true, true, true, true]);
    frame();
    expect(waiting(root)).toEqual([false, false, true, true]);
    frame();
    expect(waiting(root)).toEqual([false, false, false, true]);
    frame();
    expect(waiting(root)).toEqual([false, false, false, false]);
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets every block in at once for a link to a place on the page', () => {
    const root = page([300, 900, 1600]);
    later(root, true);
    expect(waiting(root)).toEqual([false, false, false]);
  });

  it('lets nothing more in once it is stopped', () => {
    const root = page([300, 900, 1600]);
    const stop = later(root, false);
    frame();
    stop();
    expect(vi.getTimerCount()).toBe(0);
    frame();
    expect(waiting(root)).toEqual([false, true, true]);
  });
});
