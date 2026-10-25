import { afterEach, describe, expect, it, vi } from 'vitest';

/* A failed load isn't cached: the next call tries again rather than handing back the same rejection. */

afterEach(() => { vi.doUnmock('gsap'); vi.resetModules(); });

describe('loadGsap', () => {
  it('tries again after a failed load', async () => {
    vi.doMock('gsap', () => { throw new Error('offline'); });
    const { loadGsap } = await import('./gsap');
    await expect(loadGsap()).rejects.toThrow();
    vi.doUnmock('gsap');
    const { gsap, ScrollTrigger } = await loadGsap();
    expect(typeof gsap.to).toBe('function');
    expect(ScrollTrigger).toBeTruthy();
  });

  it('loads once and hands every scene the same promise', async () => {
    const { loadGsap } = await import('./gsap');
    expect(loadGsap()).toBe(loadGsap());
    await loadGsap();
  });
});
