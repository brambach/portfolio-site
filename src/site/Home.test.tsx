import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import * as COPY from './home/copy';
import LazyScene from './home/LazyScene';
import { motionMode } from './home/motion-mode';
import { vignette } from './home/art/vignette';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The home page', () => {
  it('leads with the line and who is saying it', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'i build tools for ai agents.' })).toBeInTheDocument();
    expect(screen.getByText(/^i'm bryce\. i'm 22, i finished a cs degree in may/)).toHaveTextContent(/open to moving\.$/);
  });

  it('has a contents page whose rows link to sections that exist, in page order', () => {
    const { container } = render(<Home />);
    const toc = screen.getByRole('navigation', { name: 'contents' });
    const links = within(toc).getAllByRole('link');
    expect(links.map(a => a.getAttribute('href'))).toEqual(['#dervo', '#portal', '#bots', '#more', '#more']);
    expect(links[0]).toHaveTextContent('dervo');
    expect(links[0]).toHaveTextContent('run more agents than you can watch.');
    const ids = [...container.querySelectorAll('section[id]')].map(s => s.id);
    expect(ids).toEqual(['dervo', 'portal', 'bots', 'more']);
    // A project's way back and /projects land on the contents.
    expect(toc).toHaveAttribute('id', 'work');
  });

  it('ends with the email, the way to reach him', () => {
    render(<Home />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
  });

  it('says dervo stopped, never that it was parked, and uses no em or en dashes', () => {
    const { container } = render(<Home />);
    const text = container.textContent!;
    expect(text).not.toMatch(/parked/i);
    expect(text).not.toMatch(DASHES);
    for (const s of strings(COPY)) {
      expect(s, s).not.toMatch(/parked/i);
      expect(s, s).not.toMatch(DASHES);
    }
    expect(COPY.DERVO.beats.at(-1)).toContain('stopped building');
  });

  it('names no city and no employer', () => {
    const all = strings(COPY).join(' ');
    expect(all).not.toMatch(/\bs[f]\b|san fr[a]ncisco|new y[o]rk/i);
    expect(COPY.PORTAL.body).toContain('an hr and payroll consultancy');
  });

  it('keeps the old dot art, its motion and GSAP out of the home page', () => {
    const files = ['Home.tsx', ...walk(path.join(__dirname, 'home'))].map(f => readFileSync(path.resolve(__dirname, f), 'utf8'));
    for (const src of files) {
      expect(src).not.toMatch(/from '\.\.?\/(?:\.\.\/)*(dots|field|build|motion|pixels|scenes|chrome|links)'/);
      expect(src).not.toMatch(/e\.css/);
      expect(src).not.toMatch(/from 'gsap|from 'lenis/);
    }
  });
});

describe('The hero engraving', () => {
  it('draws the same picture for the same size, with the sun behind the range and glints on the water', () => {
    const a = vignette(1200, 300);
    expect(vignette(1200, 300)).toBe(a);
    expect(a).toContain('class="vig__sun"');
    expect(a).toContain('clip-path="url(#vig-sky)"');
    expect(a).toContain('class="vig__rise"');
    expect(a).toContain('class="vig__glints"');
    expect(a).not.toMatch(/NaN|undefined/);
  });

  it('has a narrow variant for phones', () => {
    const phone = vignette(390, 223);
    expect(phone).not.toMatch(/NaN|undefined/);
    // The narrow variant sets the sun's dots closer together, so they aren't just scaled down.
    const step = (svg: string) => { const [a, b] = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].slice(0, 2).map(m => Number(m[1])); return +(b - a).toFixed(1); };
    expect(step(phone)).toBe(3.8);
    expect(step(vignette(1200, 300))).toBe(4.2);
  });
});

describe('How much the home moves', () => {
  const media = (matches: (q: string) => boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({ matches: matches(q), media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as MediaQueryList);

  it('is still with reduced motion, lite on a phone or a touch screen, and full otherwise', () => {
    media(q => q.includes('reduced-motion'));
    expect(motionMode()).toBe('still');
    vi.restoreAllMocks();
    media(q => q.includes('max-width'));
    expect(motionMode()).toBe('lite');
    vi.restoreAllMocks();
    media(q => q.includes('coarse'));
    expect(motionMode()).toBe('lite');
    vi.restoreAllMocks();
    media(() => false);
    expect(motionMode()).toBe('full');
  });
});

describe('A scene that loads later', () => {
  it('shows its still at once, then the scene when it comes near', async () => {
    let resolve!: (m: { default: () => ReactElement }) => void;
    const load = () => new Promise<{ default: () => ReactElement }>(r => { resolve = r; });
    render(<LazyScene load={load} still={<p>still</p>} />);
    expect(screen.getByText('still')).toBeInTheDocument();
    await act(async () => resolve({ default: () => <p>scene</p> }));
    expect(await screen.findByText('scene')).toBeInTheDocument();
    expect(screen.queryByText('still')).toBeNull();
  });

  it('keeps its still if the scene\'s code fails to load', async () => {
    let reject!: (e: Error) => void;
    const load = () => new Promise<{ default: () => ReactElement }>((_, r) => { reject = r; });
    render(<LazyScene load={load} still={<p>still</p>} />);
    await act(async () => reject(new Error('offline')));
    expect(await screen.findByText('still')).toBeInTheDocument();
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path.relative(__dirname, full)] : [];
  });
}
