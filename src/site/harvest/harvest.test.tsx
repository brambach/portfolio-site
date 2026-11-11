import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../../banned-names';
import * as COBALT from '../cobalt/copy';
import DervoPage from '../patch/DervoPage';
import * as COPY from './copy';
import Home from './Home';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The dinner table home', () => {
  it('leads with the name and the line, over the yard', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText(COBALT.HERO.line)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('img', { name: COPY.HARVEST.art })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY.HARVEST.hint })).toBeInTheDocument();
  });

  it('gives up three slices of pie to the plate and saves the fourth', () => {
    const { container } = render(<Home />);
    const pie = container.querySelector('#hv-scene .pie')!, slices = () => container.querySelectorAll('#hv-scene .slice:not(.gone)');
    expect(slices()).toHaveLength(4);
    fireEvent.pointerDown(pie);
    fireEvent.pointerDown(pie);
    expect(slices()).toHaveLength(2);
    expect(screen.queryByText(COPY.HARVEST.saved)).toBeNull();
    fireEvent.pointerDown(pie);
    expect(slices()).toHaveLength(1);
    expect(container.querySelectorAll('#hv-scene .got.on')).toHaveLength(3);
    expect(screen.getByText(COPY.HARVEST.saved)).toBeInTheDocument();
    // There's nothing left to take: the pie just hops.
    fireEvent.pointerDown(pie);
    expect(slices()).toHaveLength(1);
    expect(pie).toHaveClass('boing');
  });

  it('bounces a tapped pumpkin and a kicked leaf pile, and bumps every dish on the table', () => {
    vi.useFakeTimers();
    const { container } = render(<Home />);
    const pump = container.querySelector('#hv-scene .pump')!, pile = container.querySelector('#hv-pile')!;
    fireEvent.pointerDown(pump);
    expect(pump).toHaveClass('boing');
    fireEvent.pointerDown(pile);
    expect(pile).toHaveClass('boing');
    fireEvent.click(screen.getByRole('button', { name: COPY.HARVEST.hint }));
    vi.advanceTimersByTime(600);
    container.querySelectorAll('#hv-scene .dish').forEach(d => expect(d).toHaveClass('boing'));
    vi.useRealTimers();
  });

  it('lists the work in order as panels, each to its own page or source, and work not public yet unlinked', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'Selected work' }));
    expect(work.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(COBALT.WORK.rows.map(r => r.name));
    const items = work.getAllByRole('listitem');
    expect(items.map(li => li.querySelector('a')?.getAttribute('href') ?? null)).toEqual(COBALT.WORK.rows.map(r => r.href ?? null));
    items.forEach(li => expect(li.querySelector('img')).not.toBeNull());
  });

  it('opens every link off the site in a new tab with rel noopener and says so, and keeps its own links in the tab', () => {
    const { container } = render(<Home />);
    for (const a of container.querySelectorAll('a')) {
      const href = a.getAttribute('href')!;
      if (href.startsWith('http')) {
        expect(a, href).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel'), href).toMatch(/\bnoopener\b/);
        expect(a, href).toHaveAccessibleName(expect.stringContaining('(opens in a new tab)'));
      } else expect(a, href).not.toHaveAttribute('target');
    }
  });

  it('jumps to the work and the about, ends with the night, the email and the side quests', () => {
    const { container } = render(<Home />);
    const nav = within(screen.getByRole('navigation', { name: 'site' }));
    expect(nav.getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/#work', '/#about']);
    expect(container.querySelector('#work')).not.toBeNull();
    expect(container.querySelector('#about')).not.toBeNull();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('img', { name: COPY.HARVEST.footArt })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(within(footer).getByRole('link', { name: 'the road' })).toHaveAttribute('href', '/work');
    expect(within(footer).getByRole('link', { name: 'the drive' })).toHaveAttribute('href', '/drive');
  });

  it('keeps the header and footer outside main, its headings in order, and the moving parts out of the reading order', () => {
    const { container } = render(<Home />);
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByRole('banner'))).toBe(false);
    expect(main.contains(screen.getByRole('contentinfo'))).toBe(false);
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
    for (const sel of ['.far', '.back', '.tint', '.lights', '#hv-fall', '.dusk-page']) expect(container.querySelector(sel), sel).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('The words', () => {
  it('use no dashes, never say parked, and name no port, city or employer', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<><Home /><DervoPage /></>);
    const texts = [container.textContent!, ...strings(COPY)];
    const employer = [...BANNED, /\bdd\b/i, /\bcontract/i, /\bfreelanc/i];
    for (const t of texts) {
      expect(t, t).not.toMatch(DASHES);
      expect(t, t).not.toMatch(/parked/i);
      expect(t, t).not.toMatch(/\bport\b/i);
      expect(t, t).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk/i);
      for (const re of employer) expect(t, t).not.toMatch(re);
    }
  });
});
