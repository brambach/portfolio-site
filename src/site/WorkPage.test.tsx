import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../projects/catalog';
import { WORK_IDS } from './routes';
import Home from './Home';
import { saveHandoff, snapshotOf, takeHandoff } from './chrome';
import { makeGrid, ringFormation, shotFormation } from './field';
import { PALETTES } from './palette';
import { workRect } from './scenes';
import WorkPage from './WorkPage';
import { WORK_PAGES, pageWorkById, nextWork, toWork } from './work';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

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

  it.each(WORK_IDS)('opens %s on its own name, and offers the next one', id => {
    const w = pageWorkById(id)!, next = nextWork(id);
    const { container } = render(<WorkPage id={id} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(w.name);
    expect(container.textContent).toContain(w.introduction);
    expect(container.textContent).toContain(w.boundary);
    const nav = screen.getByRole('navigation', { name: 'Next project' });
    expect(within(nav).getByRole('link')).toHaveAttribute('href', `/projects/${next.id}`);
    // Nothing on the page names another project before its own.
    const before = container.textContent!.slice(0, container.textContent!.indexOf(w.name));
    for (const other of WORK_PAGES.filter(o => o.id !== id && !w.name.includes(o.name))) expect(before).not.toContain(other.name);
    for (const s of w.shots) expect(screen.getByAltText(s.alt)).toBeInTheDocument();
  });

  it('presents lucid as finished, never as in development', () => {
    const { container } = render(<WorkPage id="lucid" />);
    expect(container.textContent).not.toMatch(/in development|development work|in progress|\bwip\b/i);
  });
});

describe('The site’s links', () => {
  it('sends the home page to the project pages, opens the links off the site in a new tab, with no arrow glyphs', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'work' }));
    for (const id of ['dervo', 'integration-portal', 'arro', 'lucid', 'port']) expect(work.getAllByRole('link').some(a => a.getAttribute('href') === `/projects/${id}`), id).toBe(true);
    for (const name of ['linkedin', 'x @brycerambach', 'github']) {
      for (const link of screen.getAllByRole('link', { name })) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
    expect(screen.getByRole('main').textContent).not.toMatch(/[↗→]/);
  });
});

describe('The site’s project pages: the dots', () => {
  it('draws a screen whole, framed in the darkest tone, inside the object’s place', () => {
    const g = makeGrid(1440, 900, false), [x0, y0, x1, y1] = workRect(false).rect;
    const box = { x: x0 * g.w, y: y0 * g.h, w: (x1 - x0) * g.w, h: (y1 - y0) * g.h };
    const px = { width: 40, height: 30, data: Array.from({ length: 40 * 30 * 4 }, (_, i) => (i % 4 === 3 ? 255 : (i * 7) % 256)) };
    const f = shotFormation(g, box, px, PALETTES.day);
    let shown = 0;
    for (let i = 0; i < g.cells; i++) if (f.size[i]) {
      shown++;
      expect(f.pos[i * 2]).toBeGreaterThanOrEqual(box.x); expect(f.pos[i * 2]).toBeLessThanOrEqual(box.x + box.w);
    }
    expect(shown).toBeGreaterThan(0.9 * (box.w / g.cell) * (box.h / g.cell));
  });
  it('closes Port’s ring into a much smaller disc', () => {
    const g = makeGrid(1440, 900, false), rect = workRect(false).rect;
    const count = (closed: boolean) => ringFormation(g, rect, PALETTES.dawn, closed).size.reduce((s, v) => s + (v ? 1 : 0), 0);
    expect(count(true)).toBeGreaterThan(10);
    expect(count(true)).toBeLessThan(count(false) / 4);
  });
  it('picks up handed-over dots only for the same project on the same screen, once', () => {
    saveHandoff('arro', 1440, 900);
    expect(takeHandoff('port', 1440, 900)).toBeNull();
    const g = makeGrid(1440, 900, false), f = ringFormation(g, workRect(false).rect, PALETTES.day);
    const snap = snapshotOf(f, g.cells);
    saveHandoff('arro', 1440, 900, snap);
    expect(takeHandoff('arro', 1440, 900)).toEqual({ dots: snap });
    expect(takeHandoff('arro', 1440, 900)).toBeNull();
    saveHandoff('arro', 1440, 900);
    expect(takeHandoff('arro', 390, 844)).toBeNull();
    // The snapshot is every dot that shows, in two colors for the ring.
    expect(snap.d.length / 2).toBe(f.size.reduce((s, v) => s + (v ? 1 : 0), 0));
    expect(snap.c.length).toBe(2);
  });
});
