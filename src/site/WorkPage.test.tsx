import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../projects/catalog';
import { WORK_IDS } from './routes';
import Home from './Home';
import WorkPage from './WorkPage';
import { WORK_PAGES, pageWorkById, nextWork, toWork } from './work';

const reduced = (on: boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(((query: string) => ({ matches: on && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia);

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const lower = (text: string) => text.toLowerCase().replace(/\s+·\s+/g, ', ');

describe('The site’s project pages: what they say', () => {
  it('has a page for all six projects, each with its own words from the catalog', () => {
    expect(WORK_PAGES.map(w => w.id)).toEqual([...WORK_IDS]);
    for (const w of WORK_PAGES) {
      const p = projects.find(x => x.id === w.id)!;
      for (const k of ['name', 'line', 'category', 'status', 'role', 'introduction', 'decision', 'engineering', 'boundary'] as const) expect(w[k]).toBe(p[k]);
    }
  });
  it('never falls back to another project', () => {
    expect(pageWorkById('nope')).toBeNull();
    expect(pageWorkById('port')?.name).toBe('Port');
    expect(nextWork('agentsky').id).toBe('dervo');
    expect(toWork('/projects/arro')).toBe('arro');
    expect(toWork('#integrations')).toBeNull();
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

describe('Port’s hold', () => {
  it('closes on Enter, says so, and opens again', () => {
    reduced(true);
    render(<WorkPage id="port" />);
    const ring = screen.getByRole('button', { name: 'hold to close port' });
    fireEvent.keyDown(ring, { key: 'Enter' });
    expect(screen.getByRole('status')).toHaveTextContent('port closed');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('button', { name: 'open port' }), { key: ' ' });
    expect(screen.getByRole('status')).toHaveTextContent('port open');
  });

  it('folds after a one second hold, and does nothing if let go early', () => {
    reduced(false);
    vi.useFakeTimers();
    render(<WorkPage id="port" />);
    const ring = screen.getByRole('button', { name: 'hold to close port' });
    fireEvent.pointerDown(ring, { button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.pointerUp(ring);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByRole('status')).toHaveTextContent('port open');
    fireEvent.pointerDown(ring, { button: 0 });
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.getByRole('status')).toHaveTextContent('port closed');
  });

  it('can be quiet', () => {
    reduced(true);
    render(<WorkPage id="port" />);
    fireEvent.click(screen.getByRole('button', { name: 'sound on' }));
    expect(screen.getByRole('button', { name: 'sound off' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.keyDown(screen.getByRole('button', { name: 'hold to close port' }), { key: 'Enter' });
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});

describe('The site’s links', () => {
  it('sends the home page to the project pages, opens the links off the site in a new tab, with no arrow glyphs', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'work' }));
    for (const id of ['dervo', 'integration-portal', 'arro', 'lucid', 'port']) expect(work.getAllByRole('link').some(a => a.getAttribute('href') === `/projects/${id}`), id).toBe(true);
    for (const name of ['linkedin', 'x @brycerambach', 'github']) {
      for (const link of screen.getAllByRole('link', { name: `${name} (opens in a new tab)` })) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
    expect(screen.getByRole('main').textContent).not.toMatch(/[↗→]/);
  });
});
