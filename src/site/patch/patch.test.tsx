import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../../banned-names';
import * as COBALT from '../cobalt/copy';
import * as COPY from './copy';
import DervoPage from './DervoPage';
import Home from './Home';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The pumpkin patch home', () => {
  it('leads with the name and the line, over the patch', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText(COBALT.HERO.line)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('img', { name: COPY.PATCH.art })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY.PATCH.hint })).toBeInTheDocument();
  });

  it('bounces a tapped pumpkin and lights the big one on the third tap', () => {
    const { container } = render(<Home />);
    const small = container.querySelector('#pk-scene .pump:not(.big)')!, big = container.querySelector('#pk-scene .pump.big')!;
    fireEvent.pointerDown(small);
    expect(small).toHaveClass('boing');
    fireEvent.pointerDown(big);
    fireEvent.pointerDown(big);
    expect(big).not.toHaveClass('lit');
    fireEvent.pointerDown(big);
    expect(big).toHaveClass('lit');
    expect(screen.getByText(COPY.PATCH.lit)).toBeInTheDocument();
  });

  it('lists the work in order as panels, Dervo to its own page and the rest to their source', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'Selected work' }));
    expect(work.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(COBALT.WORK.rows.map(r => r.name));
    const rows = work.getAllByRole('listitem').map(li => li.querySelector('a')!);
    expect(rows.map(a => a.getAttribute('href'))).toEqual(COBALT.WORK.rows.map(r => r.href));
    rows.forEach(a => expect(a.querySelector('img')).not.toBeNull());
  });

  it('opens every link off the site in a new tab with rel noopener and says so, and keeps its own links in the tab', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<><Home /><DervoPage /></>);
    for (const a of container.querySelectorAll('a')) {
      const href = a.getAttribute('href')!;
      if (href.startsWith('http')) {
        expect(a, href).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel'), href).toMatch(/\bnoopener\b/);
        expect(a, href).toHaveAccessibleName(expect.stringContaining('(opens in a new tab)'));
      } else expect(a, href).not.toHaveAttribute('target');
    }
  });

  it('jumps to the work and the about, ends with the email and the side quests', () => {
    const { container } = render(<Home />);
    const nav = within(screen.getByRole('navigation', { name: 'site' }));
    expect(nav.getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/#work', '/#about']);
    expect(container.querySelector('#work')).not.toBeNull();
    expect(container.querySelector('#about')).not.toBeNull();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(within(footer).getByRole('link', { name: 'the road' })).toHaveAttribute('href', '/work');
    expect(within(footer).getByRole('link', { name: 'the drive' })).toHaveAttribute('href', '/drive');
  });

  it('keeps the header and footer outside main, and its headings in order', () => {
    const { container } = render(<Home />);
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByRole('banner'))).toBe(false);
    expect(main.contains(screen.getByRole('contentinfo'))).toBe(false);
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
  });
});

describe('The pumpkin patch Dervo page', () => {
  it('names it, shows the demo and says it stopped', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<DervoPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dervo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: COBALT.DERVO.demo })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Where it stands' })).toHaveTextContent('I stopped building it in October');
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
