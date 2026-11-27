import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../../banned-names';
import * as COBALT from '../cobalt/copy';
import DervoPage from '../cobalt/DervoPage';
import * as COPY from './copy';
import Home from './Home';
import TeammatePage from './TeammatePage';
import PsychePage from './PsychePage';
import { PSYCHE } from './psyche';
import { TEAMMATE } from './teammate';
import { siteRoute } from '../routes';
import { PAGES } from '../meta';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The black and white home', () => {
  it('leads with the name, the role and the line, beside the drawing', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText(COPY.BLOCK.role)).toBeInTheDocument();
    expect(screen.getByText(COBALT.HERO.line)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: COPY.BLOCK.art })).toBeInTheDocument();
  });

  it('lists the work in order, and each row opens in place and closes again', () => {
    render(<Home />);
    const work = within(screen.getByRole('region', { name: 'Selected work' }));
    const buttons = work.getAllByRole('button');
    expect(work.getAllByRole('heading', { level: 3 }).map(h => h.querySelector('.nm')!.textContent)).toEqual(COPY.ROWS.map(r => r.name));
    buttons.forEach(b => expect(b).toHaveAttribute('aria-expanded', 'false'));
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(buttons[1].getAttribute('aria-controls')!)).not.toHaveAttribute('inert');
    fireEvent.click(buttons[2]);
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(buttons[2]);
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a picture for every row and links each one that has a page or a source', () => {
    const { container } = render(<Home />);
    const rows = [...container.querySelectorAll('.rows > li')];
    expect(rows).toHaveLength(COPY.ROWS.length);
    rows.forEach((li, i) => {
      expect(li.querySelector('img')).toHaveAttribute('alt', COPY.ROWS[i].alt);
      expect(li.querySelector('a.go')?.getAttribute('href') ?? null).toBe(COPY.ROWS[i].href ?? null);
    });
    expect(COPY.ROWS.filter(r => !r.href).map(r => r.name)).toEqual(['receipts', 'tastepack']);
    expect(rows[0].querySelector('a.go')).toHaveAccessibleName('Read the story');
  });

  it('keeps the AI teammate unnamed', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<><Home /><TeammatePage /></>);
    for (const t of [container.innerHTML, ...strings(COPY), ...strings(TEAMMATE)]) expect(t).not.toMatch(/jared|perceptional|heyjared/i);
  });

  it('shows the links as logos that still say where they go, at the top and in the footer', () => {
    render(<Home />);
    const navs = screen.getAllByRole('navigation', { name: 'elsewhere' });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      const links = within(nav).getAllByRole('link');
      expect(links.map(a => a.getAttribute('href'))).toEqual(['https://x.com/brycerambach', 'https://www.linkedin.com/in/bryce-rambach/', 'https://github.com/brambach', 'mailto:bryce.rambach@gmail.com']);
      expect(links[0]).toHaveAccessibleName(expect.stringMatching(/^X/));
      expect(links[3]).toHaveAccessibleName('Email');
      links.forEach(a => expect(a.querySelector('svg')).not.toBeNull());
    }
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

  it('has the work and the about to jump to, and ends with the email and the side quests', () => {
    const { container } = render(<Home />);
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

describe('The AI teammate story', () => {
  it('has its own address, page and link preview', () => {
    expect(siteRoute('/projects/ai-teammate')).toEqual({ name: 'case', id: 'ai-teammate' });
    expect(siteRoute('/projects/ai-teammate/')).toEqual({ name: 'case', id: 'ai-teammate' });
    expect(PAGES.find(p => p.path === '/projects/ai-teammate')).toMatchObject({ file: 'projects/ai-teammate.html', title: TEAMMATE.title });
  });

  it('leads with the headline and the numbers, then the case study in order', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<TeammatePage />);
    expect(screen.getByRole('heading', { level: 1, name: TEAMMATE.h1 })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'By the numbers' })).getAllByRole('listitem').map(li => li.querySelector('.t-vh')!.textContent)).toEqual(['3 days', '1,000+', '122', '8,400+']);
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual([TEAMMATE.voice.label, TEAMMATE.system.h2, TEAMMATE.start.h2, TEAMMATE.decisions.h2, TEAMMATE.worked.h2, TEAMMATE.learned.h2]);
    expect(screen.getByRole('img', { name: TEAMMATE.system.alt })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: TEAMMATE.speed.chartAlt }).querySelectorAll('rect')).toHaveLength(TEAMMATE.perDay.length);
    expect(screen.getByRole('img', { name: TEAMMATE.trust.phone.label })).toHaveTextContent('yeah but make it due Friday');
    expect(screen.getByRole('table')).toHaveTextContent('ReachSlack onlyText, Slack, Discord, Telegram');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(TEAMMATE.privacy);
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
  });

  it('adds up: 1,030 pull requests over the 21 days charted, the most on Nov 19', () => {
    expect(TEAMMATE.perDay.reduce((a, b) => a + b, 0)).toBe(1030);
    expect(TEAMMATE.perDay.indexOf(Math.max(...TEAMMATE.perDay)) + 4).toBe(19);
  });
});

describe('The Psyche story', () => {
  it('has its own address, page and link preview, and the home row leads to it', () => {
    expect(siteRoute('/projects/psyche')).toEqual({ name: 'case', id: 'psyche' });
    expect(PAGES.find(p => p.path === '/projects/psyche')).toMatchObject({ file: 'projects/psyche.html', title: PSYCHE.title });
    expect(COPY.ROWS.find(r => r.name === 'Psyche')).toMatchObject({ href: '/projects/psyche', go: 'Read the story' });
  });

  it('leads with the headline, the numbers and the coast, then the case study in order, with its source', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<PsychePage />);
    expect(screen.getByRole('heading', { level: 1, name: PSYCHE.h1 })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'By the numbers' })).getAllByRole('listitem').map(li => li.querySelector('.t-vh')!.textContent)).toEqual(['53,793', '43', '13', '$0']);
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual([PSYCHE.principle.h2, PSYCHE.both.h2, PSYCHE.game.h2, PSYCHE.decisions.h2, PSYCHE.science.h2, PSYCHE.tracks.h2, PSYCHE.voice.label, PSYCHE.limits.h2]);
    const pics = Object.values(PSYCHE.pics);
    expect([...container.querySelectorAll('img')].map(i => i.getAttribute('src')).sort()).toEqual(pics.map(p => p.src).sort());
    pics.forEach(p => expect(screen.getByAltText(p.alt)).toHaveAttribute('width', String(p.w)));
    expect(screen.getByRole('img', { name: PSYCHE.principle.alt })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Source on GitHub/ })).toHaveAttribute('href', 'https://github.com/brambach/psyche');
    expect(screen.getByRole('list', { name: PSYCHE.both.chainLabel }).children).toHaveLength(6);
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], String(levels)).toBeLessThanOrEqual(1); });
  });

  it('ships its pictures as files, not inlined', async () => {
    const { existsSync, statSync } = await import('node:fs');
    for (const p of Object.values(PSYCHE.pics)) {
      const file = `${process.cwd()}/public${p.src}`;
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeLessThan(200_000);
    }
  });

  it('adds up: the split is 2,817 choices', () => {
    expect(PSYCHE.both.split.a + PSYCHE.both.split.b).toBe(2817);
  });
});

describe('The words', () => {
  it('use no dashes, never say parked, and name no port, city or employer', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(<><Home /><DervoPage /><TeammatePage /><PsychePage /></>);
    const texts = [container.textContent!, ...strings(COPY), ...strings(TEAMMATE), ...strings(PSYCHE)];
    const employer = [...BANNED, /\bdd\b/i, /\bcontract/i, /\bfreelanc/i];
    for (const t of texts) {
      expect(t, t).not.toMatch(DASHES);
      expect(t, t).not.toMatch(/parked/i);
      expect(t, t).not.toMatch(/\bport\b/i);
      expect(t, t).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk|manh[a]ttan|brookl[y]n/i);
      for (const re of employer) expect(t, t).not.toMatch(re);
    }
  });
});
