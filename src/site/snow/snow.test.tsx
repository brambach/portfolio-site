import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../../banned-names';
import * as COBALT from '../cobalt/copy';
import DervoPage from '../patch/DervoPage';
import { capPath } from './Art';
import * as COPY from './copy';
import Home from './Home';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The snow home', () => {
  it('leads with the name and the line, over the yard', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText(COBALT.HERO.line)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('img', { name: COPY.SNOW.art })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY.SNOW.hint })).toBeInTheDocument();
  });

  it('hangs three ornaments and then the star from the box, and lights the tree once the star is on', () => {
    const { container } = render(<Home />);
    const pine = container.querySelector('#sn-scene .pine')!;
    const hung = () => [...container.querySelectorAll('#sn-scene .hung.on')].map(h => h.getAttribute('data-trim'));
    const boxed = () => container.querySelectorAll('#sn-scene .boxed:not(.gone)');
    expect(boxed()).toHaveLength(4);
    fireEvent.pointerDown(pine);
    fireEvent.pointerDown(container.querySelector('#sn-scene .box')!);
    expect(hung()).toEqual(['red', 'gold']);
    fireEvent.pointerDown(pine);
    expect(pine).not.toHaveClass('lit');
    expect(screen.queryByText(COPY.SNOW.done)).toBeNull();
    fireEvent.pointerDown(pine);
    expect(hung()).toEqual(['red', 'gold', 'blue', 'star']);
    expect(boxed()).toHaveLength(0);
    expect(pine).toHaveClass('lit');
    expect(screen.getByText(COPY.SNOW.done)).toBeInTheDocument();
    // There's nothing left to hang: the tree just shakes.
    fireEvent.pointerDown(pine);
    expect(hung()).toHaveLength(4);
    expect(pine).toHaveClass('boing');
  });

  it('tips the hat, rattles a present, kicks a drift and makes it snow', () => {
    vi.useFakeTimers();
    const { container } = render(<Home />);
    const gift = container.querySelector('#sn-scene .gift')!, drift = container.querySelector('#sn-drift')!;
    fireEvent.pointerDown(container.querySelector('#sn-scene .snowman')!);
    expect(container.querySelector('#sn-scene .snowman .hat')).toHaveClass('boing');
    fireEvent.pointerDown(gift);
    expect(gift).toHaveClass('boing');
    fireEvent.pointerDown(drift);
    expect(drift).toHaveClass('boing');
    fireEvent.click(screen.getByRole('button', { name: COPY.SNOW.hint }));
    expect(container.querySelector('.gust')).toHaveClass('go');
    vi.advanceTimersByTime(800);
    container.querySelectorAll('#sn-scene .gift').forEach(d => expect(d).toHaveClass('boing'));
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

  it('jumps to the work and the about, ends with Christmas Eve, the email and the side quests', () => {
    const { container } = render(<Home />);
    const nav = within(screen.getByRole('navigation', { name: 'site' }));
    expect(nav.getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/#work', '/#about']);
    expect(container.querySelector('#work')).not.toBeNull();
    expect(container.querySelector('#about')).not.toBeNull();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('img', { name: COPY.SNOW.footArt })).toBeInTheDocument();
    // Without the scroll story the snowman already has its head.
    expect(footer.querySelector('#sn-footHead')).not.toBeNull();
    expect(within(footer).getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(within(footer).getByRole('link', { name: 'the road' })).toHaveAttribute('href', '/work');
    expect(within(footer).getByRole('link', { name: 'the drive' })).toHaveAttribute('href', '/drive');
  });

  it('keeps the header and footer outside main, its headings in order and named plainly, and the moving parts out of the reading order', () => {
    const { container } = render(<Home />);
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByRole('banner'))).toBe(false);
    expect(main.contains(screen.getByRole('contentinfo'))).toBe(false);
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
    expect(screen.getByRole('heading', { level: 2, name: 'About' })).toBeInTheDocument();
    for (const sel of ['.far', '.yard', '.tint', '.lights', '.snowfall', '.gust', '#sn-roll', '.night-page', '.cap', '.holly']) expect(container.querySelector(sel), sel).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('The snow caps', () => {
  it('are closed shapes that fit the width they are given', () => {
    for (const w of [120, 360, 1100]) {
      const d = capPath(w, 3);
      expect(d.endsWith('Z')).toBe(true);
      const xs = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
      expect(Math.max(...xs), String(w)).toBeLessThanOrEqual(w + 1);
      expect(Math.min(...xs), String(w)).toBeGreaterThanOrEqual(0);
    }
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
