import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../../banned-names';
import * as COPY from './copy';
import DervoPage from './DervoPage';
import { fireEvent } from '@testing-library/react';
import Home, { clockLabel, dayFromClock, seasonOf, sunAt } from './Home';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
const at = (h: number, m = 0) => new Date(2026, 9, 29, h, m);

afterEach(() => vi.restoreAllMocks());

describe('The cobalt home', () => {
  it('leads with the name and the line, over the engraving', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText(COPY.HERO.line)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('img', { name: COPY.HERO.art })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Time of day' })).toBeInTheDocument();
  });

  it('lists the work in order, Dervo to its own page, public work to its source, and work not public yet unlinked', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'Selected work' }));
    expect(work.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(['Dervo', 'receipts', 'tastepack', 'Trace', 'easeprint', 'dryline', 'Arro']);
    const items = work.getAllByRole('listitem');
    expect(items.map(li => li.querySelector('a')?.getAttribute('href') ?? null)).toEqual(['/projects/dervo', null, null, 'https://github.com/brambach/trace', 'https://github.com/brambach/easeprint', 'https://github.com/brambach/dryline', 'https://github.com/brambach/arro']);
    items.forEach(li => expect(li.querySelector('img')).not.toBeNull());
    expect(work.getByText(/^Also:/)).toHaveTextContent('voice, how I write on X');
  });

  it('starts on the season of the month and lets you switch it', () => {
    const { container } = render(<Home />);
    const root = container.querySelector('.cb')!;
    expect(root).toHaveAttribute('data-season', seasonOf(new Date()));
    const group = within(screen.getByRole('group', { name: 'Season' }));
    expect(group.getAllByRole('button').map(b => b.textContent)).toEqual(['winter', 'spring', 'summer', 'fall']);
    fireEvent.click(group.getByRole('button', { name: 'winter' }));
    expect(root).toHaveAttribute('data-season', 'winter');
    expect(group.getByRole('button', { name: 'winter' })).toHaveAttribute('aria-pressed', 'true');
    expect(group.getByRole('button', { name: 'fall' })).toHaveAttribute('aria-pressed', 'false');
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
    const away = within(within(footer).getByRole('navigation', { name: 'elsewhere' })).getAllByRole('link');
    expect(away.map(a => a.getAttribute('href'))).toEqual(['https://github.com/brambach', 'https://x.com/brycerambach', 'https://www.linkedin.com/in/bryce-rambach/']);
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

describe('The cobalt Dervo page', () => {
  it('names it, says what it is, and shows the demo', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<DervoPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dervo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: COPY.DERVO.demo })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub, FSL/ })).toHaveAttribute('href', 'https://github.com/brambach/dervo');
  });

  it('says it stopped, with its real numbers', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<DervoPage />);
    const stands = screen.getByRole('region', { name: 'Where it stands' });
    expect(stands).toHaveTextContent('18 beta testers signed on, and Dervo ran 1,500+ agent tasks.');
    expect(stands).toHaveTextContent('I stopped building it in October');
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

describe('The seasons', () => {
  it('snow from December through March, spring in April and May, summer to September, then fall', () => {
    const month = (m: number) => seasonOf(new Date(2026, m, 15));
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(month)).toEqual(['winter', 'winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'summer', 'summer', 'fall', 'fall', 'winter']);
  });
});

describe('The sun', () => {
  it('follows the clock: dawn at 5am, the small hours at midnight', () => {
    expect(dayFromClock(at(5))).toBe(0);
    expect(dayFromClock(at(14, 30))).toBe(0.5);
    expect(dayFromClock(at(0))).toBe(1);
    expect(dayFromClock(at(3))).toBe(1);
  });

  it('says the time it stands for', () => {
    expect(clockLabel(0)).toBe('5:00 am in tahoe · drag the sun');
    expect(clockLabel(0.5)).toBe('2:30 pm in tahoe · drag the sun');
    expect(clockLabel(1)).toBe('12:00 am in tahoe · drag the sun');
  });

  it('climbs through the day, then turns to the moon after dusk', () => {
    expect(sunAt(0).y).toBe(350);
    expect(sunAt(0.38).y).toBeCloseTo(95);
    expect(sunAt(0.5)).toMatchObject({ night: false, dark: 0 });
    expect(sunAt(0.9)).toMatchObject({ night: true, dark: 1 });
    expect(sunAt(0.9).y).toBeLessThan(235);
  });
});
