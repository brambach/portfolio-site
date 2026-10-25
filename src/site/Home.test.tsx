import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../projects/catalog';
import Home from './Home';
import * as COPY from './home/copy';
import LazyScene from './home/LazyScene';
import { motionMode } from './home/motion-mode';
import { vignette } from './home/art/vignette';
import { PROJECT_META } from './meta';
import { WORK_IDS } from './routes';
import WorkPage from './WorkPage';

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
    expect(cards.map(c => within(c).getByRole('heading', { level: 3 }).textContent)).toEqual(['dervo', 'integration portal', 'arro', 'lucid']);
    const ids = ['dervo', 'integration-portal', 'arro', 'lucid'];
    const names = ['dervo', 'integration portal', 'arro', 'lucid'];
    cards.forEach((card, i) => {
      // Each repeated link says which project it's about, for a screen reader; the visible words stay the same.
      const story = within(card).getByRole('link', { name: `the full story about ${names[i]}` });
      expect(story).toHaveAttribute('href', `/projects/${ids[i]}`);
      expect(story.querySelector('.s-vh')?.textContent).toBe(`about ${names[i]}`);
      expect(card.querySelector('.s-what')?.textContent).toBeTruthy();
    });
    // Each shows its screenshots, and the picture is a link to the same page.
    cards.forEach((card, i) => {
      expect(within(card).getAllByRole('img').length).toBeGreaterThan(0);
      expect(card.querySelector(`a[href="/projects/${ids[i]}"] img`)).not.toBeNull();
    });
  });

  it('gives each card the source link only where the source is public', () => {
    render(<Home />);
    const cards = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article');
    const sources = cards.map(c => within(c).queryByRole('link', { name: /source/ }));
    expect(sources.map(a => a?.getAttribute('href') ?? null)).toEqual(['https://github.com/brambach/dervo', null, 'https://github.com/brambach/arro', null]);
    expect(sources[0]).toHaveAccessibleName('dervo source (opens in a new tab)');
    expect(sources[2]).toHaveAccessibleName('arro source (opens in a new tab)');
  });

  it('presents lucid as finished work, never as in development', () => {
    render(<Home />);
    const lucid = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[3];
    expect(lucid).toHaveTextContent('an integration workspace that follows a request into scope, specs and delivery.');
    expect(screen.getByRole('main').textContent).not.toMatch(/in development|in progress|\bwip\b|coming soon/i);
  });

  it('has no port row, and no word or link about port anywhere', () => {
    const { container } = render(<Home />);
    const work = screen.getByRole('region', { name: 'work' });
    expect(within(work).getAllByRole('article')).toHaveLength(4);
    expect(within(work).queryByRole('heading', { name: 'port' })).toBeNull();
    expect(container.querySelector('.s-small')).toBeNull();
    expect(container.textContent).not.toMatch(/\bport\b|hold for a second/i);
    for (const a of screen.getAllByRole('link')) expect(a.getAttribute('href'), a.getAttribute('href')!).not.toMatch(/\/projects\/port$|brambach\/port$/);
    for (const s of strings(COPY)) expect(s, s).not.toMatch(/\bport\b/i);
    expect(COPY.CONTENTS.rows.map(r => r.numeral)).toEqual(['i', 'ii', 'iii', 'iv']);
    expect(COPY.MORE.rows.map(r => r.id)).toEqual(['arro']);
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
    const [first, second] = about.querySelectorAll('p');
    expect(first.textContent).toMatch(/^i'm a remote employee at an hr and payroll consultancy\. alongside that, i founded dervo\.$/);
    expect(first).toHaveTextContent('remote employee');
    expect(first).toHaveTextContent('alongside that, i founded dervo');
    expect(second.textContent).toMatch(/to the words on the buttons\.$/);
    // The hero already says the age, the degree and what he's looking for; the about doesn't repeat it.
    expect(about).not.toHaveTextContent(/22|degree|product engineer|open to moving/);
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
        expect(a.querySelector('.s-vh'), href).not.toBeNull();
      } else {
        expect(a, href).not.toHaveAttribute('target');
      }
    }
  });

  it('tells a screen reader every link that opens a new tab', () => {
    const { container } = render(<Home />);
    const away = [...container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
    expect(away.length).toBe(8);
    for (const a of away) {
      expect(a, a.href).toHaveAccessibleName(expect.stringContaining('(opens in a new tab)'));
      expect(a.getAttribute('rel'), a.href).toMatch(/\bnoopener\b/);
    }
  });

  it('keeps the header and footer outside main, and its headings in order', () => {
    const { container } = render(<Home />);
    const main = screen.getByRole('main');
    const header = screen.getByRole('banner');
    const footer = screen.getByRole('contentinfo');
    expect(main.contains(header)).toBe(false);
    expect(main.contains(footer)).toBe(false);
    expect(header.parentElement).toBe(main.parentElement);
    expect(footer.parentElement).toBe(main.parentElement);
    expect(main.parentElement).toHaveClass('home');
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    expect(levels[0]).toBe(1);
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    expect(levels.slice(1, 3)).toEqual([2, 3]);
    // Never a skipped level: each heading is at most one deeper than the one before it.
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['work', 'about']);
  });

  it('says maya is a sample name', () => {
    render(<Home />);
    const arro = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[2];
    expect(arro).toHaveTextContent('a missed day is never public. it says “maya still has today”. maya is a sample name.');
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

  it('calls the integration portal employee work, with no contract and no july to october', () => {
    const { container } = render(<Home />);
    const portal = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[1];
    expect(within(portal).getByRole('heading', { level: 3 })).toHaveTextContent('integration portal');
    expect(portal.querySelector('.s-label')).toHaveTextContent(/^employee, now$/);
    const old = /contract|jul to oct|july to october|parked/i;
    expect(container.textContent).not.toMatch(old);
    for (const s of strings(COPY)) expect(s, s).not.toMatch(old);
    expect(COPY.PORTAL.body).toMatch(/^as a remote employee /);
  });

  it('names no city and no employer', () => {
    const all = strings(COPY).join(' ');
    expect(all).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk/i);
    expect(COPY.PORTAL.body).toContain('an hr and payroll consultancy');
    // The job is employee work at an unnamed consultancy: never the company, its vendors, or a contract or freelance gig.
    const employer = [/the consultancy/i, /\bdd\b/i, /a client/i, /the HR system/i, /the finance system/i, /\bcontract/i, /\bfreelanc/i];
    const { container, unmount } = render(<Home />);
    const home = container.textContent!;
    unmount();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const pages = WORK_IDS.map(id => { const { container, unmount } = render(<WorkPage id={id} />); const t = container.textContent!; unmount(); return t; });
    const texts = [home, ...strings(COPY), ...pages, ...strings(projects), ...PROJECT_META.map(m => m.description)];
    for (const t of texts) for (const re of employer) expect(t, t).not.toMatch(re);
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
  it('is drawn once on the home page, finished and still, inside main and named for a screen reader', async () => {
    render(<Home />);
    const art = within(screen.getByRole('main')).getByRole('img', { name: COPY.HERO.art });
    const plate = art.querySelector<HTMLElement>('.vig__plate')!;
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(plate.hasAttribute('data-risen')).toBe(true);
    expect(plate.hasAttribute('data-glint')).toBe(true);
  });

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
