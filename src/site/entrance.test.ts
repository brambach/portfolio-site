import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { afterFirstPaint } from './chrome';

/* The first load: whatever the entrance moves starts where the motion starts it, in the stylesheet, so it's in place
   for the first paint and nothing shows, hides and fades back in. */

const read = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8');
const css = read('./e.css'), home = read('./motion.ts'), work = read('./work-motion.ts');

describe('The entrance', () => {
  const start = /@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';

  it('hides what it moves before the page is ready, in the CSS, and only when there is motion', () => {
    const hidden = /\.e-site:not\(\.is-ready\) :is\(([^)]*\))[^{]*\{ opacity: 0; \}/.exec(start)?.[1] ?? '';
    for (const sel of ['.e-hero__sub', '[data-lead]', '[data-quiet]', '[data-top-label]']) expect(hidden).toContain(sel);
    expect(start).toMatch(/:not\(\.is-ready\) :is\(\[data-rule\], \[data-top-rule\]\) \{ transform: scaleX\(0\); \}/);
    expect(css).toMatch(/\.e-site:not\(\.is-ready\) \.e-tag \{ visibility: hidden; \}/);
    expect(css).toMatch(/\.e-site:not\(\.is-ready\) \.e-head \{ opacity: 0; \}/);
  });

  it('takes each of those to a stated end, since a from() would read the hidden start as where to end', () => {
    expect(home).toMatch(/\.fromTo\(sub, \{ opacity: 0/);
    expect(home).toMatch(/\.fromTo\(head, \{ opacity: 0/);
    expect(work).toMatch(/\.fromTo\('\[data-lead\]', \{ y: 18, opacity: 0 \}, \{ y: 0, opacity: 1/);
    expect(work).toMatch(/\.fromTo\('\[data-top-label\]'/);
    expect(work).toMatch(/\.fromTo\(head, \{ opacity: 0/);
    for (const src of [home, work]) {
      expect(src).toMatch(/q\('\[data-quiet\]'\)\.forEach\(el => gsap\.fromTo\(el, \{ y: 22, opacity: 0 \}, \{ y: 0, opacity: 1/);
      expect(src).not.toMatch(/\.from\(\s*(head|sub|'\[data-lead\]'|'\[data-top-label\]')/);
      expect(src).not.toMatch(/q\('\[data-quiet\]'\)\.forEach\(el => gsap\.from\(/);
    }
  });

  // The home page brings the tagline in first, then the line under it, then the header.
  it('brings the tagline in before the line under it, and the header last', () => {
    const at = (re: RegExp) => Number(re.exec(home)?.[1]);
    const tagline = at(/\.from\(s1\.chars, \{[^}]*\}, ([\d.]+)\)/), sub = at(/\.fromTo\(sub, [^)]*\}, ([\d.]+)\)/), head = at(/\.fromTo\(head, [^)]*\}, ([\d.]+)\)/);
    expect(tagline).toBeLessThan(sub);
    expect(sub).toBeLessThan(head);
  });
});

describe('afterFirstPaint', () => {
  afterEach(() => { vi.useRealTimers(); });
  it('starts once a frame has been drawn, without waiting for a contentful paint', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    const fn = vi.fn();
    afterFirstPaint(fn);
    vi.advanceTimersByTime(20);
    await vi.advanceTimersByTimeAsync(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('can be called off before it starts', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    const fn = vi.fn();
    afterFirstPaint(fn)();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
