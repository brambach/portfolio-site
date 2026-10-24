import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* WCAG 2.2.2: nothing on the home moves for more than 5s without stopping. Each loop plays a set number of times and
   rests on its last frame. */
const read = (f: string) => readFileSync(`${process.cwd()}/src/site/home/${f}`, 'utf8');
const look = read('look-d.css');
const mock = read('scenes/dervo-mock.css');

describe('The home’s loops', () => {
  it('never run forever', () => {
    expect(look).not.toMatch(/\binfinite\b/);
    expect(mock).not.toMatch(/\binfinite\b/);
  });
  it('rest on their last frame', () => {
    expect(look).toMatch(/\.vig__glints \{ animation: vig-breathe 14s ease-in-out 2 alternate forwards; \}/);
    expect(look).toMatch(/\.bt__slip \{ animation: bt-hand [^;]* 1 forwards; \}/);
    expect(look).toMatch(/\.bt__mark \{ visibility: hidden; animation: bt-ink [^;]* 1 forwards; \}/);
    expect(mock).toMatch(/animation: dm-breathe 1\.2s ease-in-out 4 alternate forwards;/);
  });
  it('keep still for reduced motion', () => {
    expect(look).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.hero__in, \.vig__rise, \.vig__glints \{ animation: none; \}/);
    expect(mock).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.dm__live \{ animation: none; \}/);
    expect(mock).toMatch(/\.dv--still \.dm__live \{ animation: none; \}/);
    expect(look).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.bt :is\(\.bt__slip, \.bt__mark\)[^}]*animation: none; \}\s*\.bt \.bt__mark \{ visibility: visible; \}/);
  });
});
