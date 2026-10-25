import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../projects/catalog';
import { WORK_IDS } from './routes';
import Home from './Home';
import WorkPage from './WorkPage';
import { WORK_PAGES, pageWorkById, nextWork, toWork } from './work';

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const lower = (text: string) => text.toLowerCase().replace(/\s+·\s+/g, ', ');

describe('The site’s project pages: what they say', () => {
  it('has a page for all five projects, each with its own words from the catalog', () => {
    expect(WORK_PAGES.map(w => w.id)).toEqual([...WORK_IDS]);
    for (const w of WORK_PAGES) {
      const p = projects.find(x => x.id === w.id)!;
      for (const k of ['name', 'line', 'category', 'status', 'role', 'introduction', 'decision', 'engineering', 'boundary'] as const) expect(w[k]).toBe(p[k]);
    }
  });
  it('never falls back to another project', () => {
    expect(pageWorkById('nope')).toBeNull();
    expect(pageWorkById('port')).toBeNull();
    expect(nextWork('agentsky').id).toBe('dervo');
    expect(toWork('/projects/arro')).toBe('arro');
    expect(toWork('#integrations')).toBeNull();
  });

  it('walks every page once with next, skipping port, and comes back to the start', () => {
    const seen: string[] = [];
    let id: (typeof WORK_IDS)[number] = WORK_IDS[0];
    for (let k = 0; k < WORK_IDS.length; k++) { seen.push(id); id = nextWork(id).id; }
    expect(id).toBe(WORK_IDS[0]);
    expect(seen).toEqual(['dervo', 'arro', 'lucid', 'integration-portal', 'agentsky']);
    for (const w of WORK_IDS) expect(nextWork(w).id).not.toBe('port');
  });

  it.each(WORK_IDS)('never links %s to port, before or after', id => {
    const { container } = render(<WorkPage id={id} />);
    expect(container.querySelector('a[href*="port"]:not([href*="portal"])')).toBeNull();
    expect(container.textContent).not.toMatch(/\bport\b/i);
  });

  it.each(WORK_IDS)('opens %s on its own name and keeps every word the catalog has, in the home’s voice', id => {
    const w = pageWorkById(id)!, next = nextWork(id);
    const { container } = render(<WorkPage id={id} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(w.name.toLowerCase());
    const text = container.textContent!;
    for (const k of ['line', 'category', 'role', 'status', 'introduction', 'decision', 'engineering', 'boundary'] as const) expect(text).toContain(lower(w[k]));
    expect(text).not.toMatch(/[–—·]/);
    expect(text).not.toMatch(/parked|in development/i);
    expect(screen.getByRole('link', { name: 'back to the work' })).toHaveAttribute('href', '/#work');
    expect(screen.getByRole('link', { name: `next: ${next.name.toLowerCase()}` })).toHaveAttribute('href', `/projects/${next.id}`);
    expect(document.title).toBe(`${w.name.toLowerCase()}, bryce rambach`);
    const before = text.slice(0, text.indexOf(w.name.toLowerCase()));
    for (const other of WORK_PAGES.filter(o => o.id !== id && !w.name.includes(o.name))) expect(before).not.toContain(other.name.toLowerCase());
  });

  it.each(WORK_IDS)('shows %s’s screenshots with alt text, sized so nothing shifts, and its headings in order', id => {
    const w = pageWorkById(id)!;
    const { container } = render(<WorkPage id={id} />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(w.shots.length);
    imgs.forEach((img, k) => {
      expect(img.getAttribute('alt')?.length, img.src).toBeGreaterThan(0);
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
      if (k > 1) expect(img).toHaveAttribute('loading', 'lazy');
    });
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    expect(levels[0]).toBe(1);
    levels.slice(1).forEach((l, k) => expect(l - levels[k]).toBeLessThanOrEqual(1));
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['what it is', 'the call', 'under the hood', 'the fine print']);
  });

  it('says where each project stands: dervo stopped, lucid finished, arro on testflight', () => {
    const status = (id: (typeof WORK_IDS)[number]) => {
      const { container, unmount } = render(<WorkPage id={id} />);
      const dd = [...container.querySelectorAll('dt')].find(dt => dt.textContent === 'status')!.nextElementSibling!.textContent;
      unmount();
      return dd;
    };
    expect(status('dervo')).toMatch(/^stopped building/);
    expect(status('lucid')).toBe('finished');
    expect(status('arro')).toMatch(/^on testflight/);
  });

  it('presents lucid as finished, never as in development', () => {
    const { container } = render(<WorkPage id="lucid" />);
    expect(container.textContent).not.toMatch(/in development|development work|in progress|\bwip\b/i);
  });

  it('draws nothing in canvas and has no custom cursor', () => {
    const { container } = render(<WorkPage id="dervo" />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('[data-cursor-el]')).toBeNull();
  });
});

describe('The project pages’ header and footer', () => {
  it.each(WORK_IDS)('keeps %s’s header and footer outside main, the way the home does', id => {
    render(<WorkPage id={id} />);
    const main = screen.getByRole('main'), header = screen.getByRole('banner'), footer = screen.getByRole('contentinfo');
    expect(main.contains(header)).toBe(false);
    expect(main.contains(footer)).toBe(false);
    expect(within(header).getByRole('link', { name: 'bryce rambach' })).toHaveAttribute('href', '/');
    const site = within(within(header).getByRole('navigation', { name: 'site' }));
    expect(site.getByRole('link', { name: 'work' })).toHaveAttribute('href', '/#work');
    expect(site.getByRole('link', { name: 'about' })).toHaveAttribute('href', '/#about');
    expect(site.getByRole('link', { name: 'email' }).getAttribute('href')).toMatch(/^mailto:/);
    for (const name of ['github', 'x @brycerambach', 'linkedin']) expect(within(footer).getByRole('link', { name: `${name} (opens in a new tab)` })).toBeInTheDocument();
  });

  it.each(WORK_IDS)('says so on every link on %s that opens a new tab', id => {
    const { container } = render(<WorkPage id={id} />);
    const away = [...container.querySelectorAll('a[target="_blank"]')];
    expect(away.length).toBeGreaterThanOrEqual(3);
    for (const a of away) {
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a).toHaveAccessibleName(expect.stringMatching(/\(opens in a new tab\)$/));
    }
    expect(container.querySelectorAll('a[href^="http"]:not([target="_blank"])')).toHaveLength(0);
  });

  it('links the source where it is public', () => {
    render(<WorkPage id="dervo" />);
    expect(screen.getByRole('link', { name: 'read the source on github (opens in a new tab)' })).toHaveAttribute('href', 'https://github.com/brambach/dervo');
  });
});

describe('The site’s links', () => {
  it('sends the home page to the project pages, opens the links off the site in a new tab, with no arrow glyphs', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'work' }));
    for (const id of ['dervo', 'integration-portal', 'arro', 'lucid']) expect(work.getAllByRole('link').some(a => a.getAttribute('href') === `/projects/${id}`), id).toBe(true);
    for (const name of ['linkedin', 'x @brycerambach', 'github']) {
      for (const link of screen.getAllByRole('link', { name: `${name} (opens in a new tab)` })) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
    expect(screen.getByRole('main').textContent).not.toMatch(/[↗→]/);
  });
});
