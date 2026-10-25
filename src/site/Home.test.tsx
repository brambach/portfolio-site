import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import * as COPY from './home/copy';
import LazyScene from './home/LazyScene';
import { motionMode } from './home/motion-mode';
import { INTRO, STAGES, introAt, paintAt, partAt, partsOf, vignette } from './home/art/vignette';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The home page', () => {
  it('leads with the line and who is saying it', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'i build tools for ai agents.' })).toBeInTheDocument();
    expect(screen.getByText(/^i'm bryce\. i'm 22, i finished a cs degree in may/)).toHaveTextContent(/open to moving\.$/);
  });

  it('shows the work as cards, each named, saying what it is, and linking to its own page', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'work' }));
    const cards = work.getAllByRole('article');
    expect(cards.map(c => within(c).getByRole('heading', { level: 3 }).textContent)).toEqual(['dervo', 'integration portal', 'arro', 'lucid', 'port']);
    const ids = ['dervo', 'integration-portal', 'arro', 'lucid', 'port'];
    cards.forEach((card, i) => {
      expect(within(card).getByRole('link', { name: 'the full story' })).toHaveAttribute('href', `/projects/${ids[i]}`);
      expect(card.querySelector('.s-what')?.textContent).toBeTruthy();
    });
    // The four with screenshots show them, and the picture is a link to the same page.
    cards.slice(0, 4).forEach((card, i) => {
      expect(within(card).getAllByRole('img').length).toBeGreaterThan(0);
      expect(card.querySelector(`a[href="/projects/${ids[i]}"] img`)).not.toBeNull();
    });
  });

  it('gives each card the source link only where the source is public', () => {
    render(<Home />);
    const cards = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article');
    const sources = cards.map(c => within(c).queryByRole('link', { name: 'source' })?.getAttribute('href') ?? null);
    expect(sources).toEqual(['https://github.com/brambach/dervo', null, 'https://github.com/brambach/arro', null, 'https://github.com/brambach/port']);
  });

  it('presents lucid as finished work, never as in development', () => {
    render(<Home />);
    const lucid = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[3];
    expect(lucid).toHaveTextContent('an integration workspace that follows a request into scope, specs and delivery.');
    expect(screen.getByRole('main').textContent).not.toMatch(/in development|in progress|\bwip\b|coming soon/i);
  });

  it('shows port without a picture, saying what it is and where to try the hold', () => {
    render(<Home />);
    const port = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[4];
    expect(within(port).queryByRole('img')).toBeNull();
    expect(port).toHaveTextContent('swiftui prototype');
    expect(port).toHaveTextContent('hold for a second and the screen folds into a line.');
    expect(port).toHaveTextContent('try the hold in your browser, with the app’s sound.');
    expect(within(port).getByRole('link', { name: 'the full story' })).toHaveAttribute('href', '/projects/port');
  });

  it('says dervo stopped building, with its real numbers', () => {
    render(<Home />);
    const dervo = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[0];
    expect(dervo).toHaveTextContent('18 beta testers signed on, and it ran 1,500+ agent tasks.');
    expect(dervo).toHaveTextContent('so i stopped building it.');
  });

  it('has a short about, and the header jumps to the work, the about and email', () => {
    const { container } = render(<Home />);
    const about = screen.getByRole('region', { name: 'about' });
    expect(about).toHaveTextContent('i’m 22 and i finished a cs degree in may 2026.');
    expect(about).toHaveTextContent('i’m looking for a founding or product engineer role at an early stage ai startup. open to moving.');
    const nav = within(screen.getByRole('navigation', { name: 'site' }));
    const hrefs = nav.getAllByRole('link').map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['#work', '#about', 'mailto:bryce.rambach@gmail.com']);
    for (const h of hrefs.slice(0, 2)) expect(container.querySelector(h!)).not.toBeNull();
  });

  it('ends with the email and the places to find him, each opening a new tab safely', () => {
    render(<Home />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    const away = within(within(footer).getByRole('navigation', { name: 'elsewhere' })).getAllByRole('link');
    expect(away.map(a => a.getAttribute('href'))).toEqual(['https://github.com/brambach', 'https://x.com/brycerambach', 'https://www.linkedin.com/in/bryce-rambach/']);
    expect(footer).not.toHaveTextContent(/let's connect|open to chat/i);
  });

  it('opens every link off the site in a new tab with rel noopener, and keeps its own links in the tab', () => {
    render(<Home />);
    for (const a of screen.getAllByRole('link')) {
      const href = a.getAttribute('href')!;
      if (href.startsWith('http')) {
        expect(a, href).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel'), href).toMatch(/\bnoopener\b/);
      } else {
        expect(a, href).not.toHaveAttribute('target');
      }
    }
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
    expect(text).not.toMatch(/[↗→←↑↓]/);
  });

  it('names no city and no employer', () => {
    const all = strings(COPY).join(' ');
    expect(all).not.toMatch(/\bsf\b|\bnyc\b|san francisco|new york/i);
    expect(COPY.PORTAL.body).toContain('an hr and payroll consultancy');
  });

  it('keeps the old dot art, its motion and GSAP out of the home page', () => {
    const files = ['Home.tsx', ...walk(path.join(__dirname, 'home'))].map(f => readFileSync(path.resolve(__dirname, f), 'utf8'));
    for (const src of files) {
      expect(src).not.toMatch(/from '\.\.?\/(?:\.\.\/)*(dots|field|build|motion|pixels|scenes|chrome|links)'/);
      expect(src).not.toMatch(/['/]e\.css/);
      expect(src).not.toMatch(/from 'gsap|from 'lenis/);
    }
  });
});

describe('The hero engraving', () => {
  it('draws the same picture for the same size, with the sun behind the range and glints on the water', () => {
    const a = vignette(1200, 300);
    expect(vignette(1200, 300)).toBe(a);
    expect(a).toContain('class="vig__sky" style="clip-path:path(');
    expect(a).toMatch(/class="vig__sun"[^>]*data-k="rise"/);
    expect(a).toContain('class="vig__glints"');
    expect(a).not.toMatch(/NaN|undefined/);
  });

  it('is in layers, back to front, so a scrub repaints only the one that moves', () => {
    const layers = [...vignette(1200, 300).matchAll(/class="vig__(\w+)"/g)].map(m => m[1]);
    expect(layers).toEqual(['sky', 'sun', 'rules', 'far', 'mid', 'near', 'lines', 'pines', 'water', 'reflect', 'glints']);
  });

  it('draws in the order of the plan, and the intro stops with the ridges drawn and the sun 60% up', () => {
    const el = document.createElement('div');
    el.innerHTML = vignette(1200, 300);
    const parts = partsOf(el);
    const of = (sel: string) => el.querySelector<HTMLElement>(sel)!;
    paintAt(el, parts, 0);
    expect(of('.vig__far').style.clipPath).toBe('inset(0 100.00% 0 0)');
    expect(of('.vig__lines path').style.strokeDashoffset).toBe('1');
    expect(el.hasAttribute('data-glint')).toBe(false);
    paintAt(el, parts, INTRO.to);
    const strokes = [...el.querySelectorAll<SVGElement>('.vig__lines path')];
    expect(strokes.every(s => s.style.strokeDashoffset === '0')).toBe(true);
    expect(partAt(STAGES.sun, INTRO.to)).toBeCloseTo(0.648, 2);
    expect(of('.vig__water').style.clipPath).toBe('inset(0 100.00% 0 0)');
    paintAt(el, parts, 1);
    expect(parts.every(p => p.t === 1)).toBe(true);
    expect([...el.querySelectorAll<HTMLElement>('[data-k]')].every(e => !e.style.clipPath && !e.style.transform)).toBe(true);
    expect(el.hasAttribute('data-glint')).toBe(true);
  });

  it('eases each part over its own stretch, and the intro settles at 0.40 in 2.4s', () => {
    expect(partAt([0.2, 0.4], 0.1)).toBe(0);
    expect(partAt([0.2, 0.4], 0.3)).toBeCloseTo(0.5);
    expect(partAt([0.2, 0.4], 0.5)).toBe(1);
    expect(introAt(0)).toBe(0);
    expect(introAt(1200)).toBeGreaterThan(0.25);
    expect(introAt(2400)).toBe(0.4);
    expect(introAt(9000)).toBe(0.4);
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

  const saveData = (on: boolean) => vi.spyOn(navigator as Navigator & { connection?: unknown }, 'connection', 'get').mockReturnValue({ saveData: on, addEventListener() {}, removeEventListener() {} });
  beforeEach(() => { if (!('connection' in navigator)) Object.defineProperty(navigator, 'connection', { configurable: true, get: () => undefined }); });

  it('is still with reduced motion', () => {
    media(q => q.includes('reduced-motion') || q.includes('max-width'));
    expect(motionMode()).toBe('still');
  });

  it('is still with Save-Data, even on a wide screen', () => {
    media(() => false);
    saveData(true);
    expect(motionMode()).toBe('still');
  });

  it('is lite under 760px wide', () => {
    media(q => q.includes('max-width'));
    saveData(false);
    expect(motionMode()).toBe('lite');
  });

  it('is full on a wide touch screen, like an ipad in landscape', () => {
    media(q => q.includes('coarse'));
    saveData(false);
    expect(motionMode()).toBe('full');
  });

  it('is full otherwise', () => {
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
