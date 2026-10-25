import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkPage from './WorkPage';
import { WORK_IDS } from './routes';

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

const home = readFileSync(`${process.cwd()}/src/site/home/look-d.css`, 'utf8');
const css = ['./e.css', './not-found.css'].map(f => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
// The page's own index.html, read from the repo (vitest serves a URL for it, not a file).
const index = readFileSync(`${process.cwd()}/index.html`, 'utf8');

describe('A project’s way back', () => {
  it.each(WORK_IDS)('goes to the work on the home page from %s, however the page was reached', id => {
    render(<WorkPage id={id} />);
    const back = screen.getByRole('link', { name: 'back to the work' });
    expect(back).toHaveAttribute('href', '/#work');
    // A plain link: nothing in the page decides to go somewhere else instead.
    expect(back.onclick).toBeNull();
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
});

describe('The home page on a phone', () => {
  const phone = home.slice(home.indexOf('@media (max-width: 759.98px)'));
  it('sets nothing under 12px, and its labels at 13px on a phone', () => {
    const rems = [...home.matchAll(/--fs-[a-z]+: ([\d.]+)rem/g)].map(m => Number(m[1]) * 16);
    expect(Math.min(...rems)).toBeGreaterThanOrEqual(12);
    expect(phone).toMatch(/--fs-label: 0\.8125rem/);
  });
  it('gives the small links in the header and footer a 44px band to tap', () => {
    expect(home).toMatch(/\.hero__name::after, \.hero__links a::after \{ content: ""; position: absolute; inset: -16px -8px; \}/);
    expect(home).toMatch(/\.foot__links a \{ padding: 14px 12px; margin-inline: -12px; \}/);
  });
  it('keeps the engraving\'s box the same shape before and after it is drawn', () => {
    expect(home).toMatch(/\.vig \{[^}]*aspect-ratio: 4\.4 \/ 1;/);
    expect(phone).toMatch(/\.vig \{ aspect-ratio: 7 \/ 4;/);
  });
  it('clears the other dervo beats while a link in one has focus', () => {
    expect(home).toMatch(/\.dv__lines:has\(\.dv__beat:focus-within\) \.dv__beat:not\(:focus-within\) \{ opacity: 0 !important;/);
    expect(home).toMatch(/\.dv__text:has\(\.dv__beat:focus-within\) \.dv__count \{ visibility: hidden; \}/);
  });
});
