import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import WorkPage from './WorkPage';
import { WORK_IDS } from './routes';
import { SCENE_ORDER } from './scenes';

/* The phone and tablet pass: the way back from a project, where the hand ends up on a phone, and the CSS that keeps
   the words clear and the links big enough to tap. jsdom doesn't lay anything out, so the sizes are checked in the
   browser by scripts/check-e-layout.mjs; these keep the rules from going missing. */

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

const css = ['./e.css', './work.css', './not-found.css'].map(f => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
// The page's own index.html, read from the repo (vitest serves a URL for it, not a file).
const index = readFileSync(`${process.cwd()}/index.html`, 'utf8');

describe('A project’s way back', () => {
  it.each(WORK_IDS)('goes to the work on the home page from %s, however the page was reached', id => {
    render(<WorkPage id={id} />);
    const back = screen.getByRole('link', { name: 'Back to the work' });
    expect(back).toHaveAttribute('href', '/#work');
    // A plain link: nothing in the page decides to go somewhere else instead.
    expect(back.onclick).toBeNull();
  });
});

describe('The hand on a phone', () => {
  it('waves once: no second space is left for it under the last line', () => {
    const { container } = render(<Home />);
    // The close ends on the sign-off. There is no separate resting place that would show the hand a second time.
    expect(container.querySelector('[data-hand-rest]')).toBeNull();
    const close = container.querySelector('[data-scene="contact"]')!;
    expect(close.lastElementChild).toHaveClass('e-sign');
    expect(css).not.toMatch(/e-close__rest/);
    expect(css).not.toMatch(/46lvh/);
  });
});

describe('The layout rules', () => {
  it('puts the line under the tagline on a tablet and a phone on its side', () => {
    expect(css).toMatch(/@media \(min-width: 761px\) and \(max-width: 1099\.98px\), \(min-width: 761px\) and \(max-height: 560px\) \{\s*\.e-hero__foot \{ position: static;/);
  });
  it('stacks a proof’s note under its name when the column is narrow', () => {
    expect(css).toMatch(/\.e-proof \{ container-type: inline-size; \}/);
    expect(css).toMatch(/@container \(max-width: 470px\) \{ \.e-proof li \{ grid-template-columns: 1fr;/);
  });
  it('gives the small links a 44px band to tap', () => {
    expect(css).toMatch(/\.e-go::after, \.e-link::after, \.e-mail::after \{[^}]*top: min\(0px, calc\(50% - 22px\)\); bottom: min\(0px, calc\(50% - 22px\)\);/);
    expect(css).toMatch(/\.e-head__name::after \{ content: ""; position: absolute; inset: -14px -10px; \}/);
  });
  // The pointer's word is the one exception: it only shows beside a mouse pointer.
  it('sets no label under 11px', () => {
    const sizes = [...css.replace(/\.e-cursor__word \{[^}]*\}/, '').matchAll(/font(?:-size)?: (?:400 |italic 400 )?([\d.]+)px/g)].map(m => Number(m[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });
});

describe('Page-to-page fades', () => {
  it('quietly drops the two ways the browser abandons one, and nothing else', () => {
    expect(index).toMatch(/r\.name === 'AbortError' && \/skipped\/i\.test\(r\.message\)/);
    expect(index).toMatch(/r\.name === 'InvalidStateError' && \/transition\/i\.test\(r\.message\)/);
  });
});

describe('The plane on a phone on its side', () => {
  it('flies in beside the tagline, low on the right, instead of under it', async () => {
    const { layoutFor, sideways } = await import('./scenes');
    expect(sideways(667, 375)).toBe(true);
    expect(sideways(375, 667)).toBe(false);
    expect(sideways(1440, 900)).toBe(false);
    const [x0, y0] = layoutFor('hero', true, true).rect;
    expect(x0).toBeGreaterThan(0.5);
    expect(y0).toBeGreaterThan(0.5);
    expect(layoutFor('hero', true)).toEqual(layoutFor('hero', true, false));
  });
});

describe('The dots on a phone, as the words scroll over them', () => {
  it('show fully until a word reaches the foot of their band, and not at all once one is halfway up', async () => {
    const { bandShown } = await import('./scenes');
    const word = (top: number, bottom = top + 20, width = 300) => ({ top, bottom, width });
    expect(bandShown(100, 500, [])).toBe(1);
    expect(bandShown(100, 500, [word(600), word(20, 80)])).toBe(1);
    expect(bandShown(100, 500, [word(495)])).toBeGreaterThan(0.99);
    expect(bandShown(100, 500, [word(400)])).toBeCloseTo(0.5);
    expect(bandShown(100, 500, [word(300)])).toBe(0);
    // A block that runs past the top of the band still covers it, and one with nothing showing doesn't count.
    expect(bandShown(100, 500, [word(-200, 120)])).toBe(0);
    expect(bandShown(100, 500, [word(300, 340, 0)])).toBe(1);
  });

  it('count everything there is to read past the hero, labels and hints included', async () => {
    const { READING } = await import('./motion');
    const { container } = render(<Home />);
    const reading = [...container.querySelectorAll(READING)];
    expect(container.querySelectorAll('.e-rule').length).toBe(SCENE_ORDER.length - 1);
    for (const sel of ['.e-rule', '.e-work__hint', '.e-intro__big', '.e-hello', '.e-sign']) {
      for (const el of container.querySelectorAll(sel)) expect(reading).toContain(el);
    }
    expect(container.querySelector('.e-hero__sub')!.closest(READING)).toBeNull();
    // Every word in a part past the hero is inside one of them.
    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement!;
      if (!n.textContent!.trim() || el.closest('.e-sr') || !el.closest('[data-scene]:not([data-scene="hero"])')) continue;
      expect(el.closest(READING)).not.toBeNull();
    }
  });
});
