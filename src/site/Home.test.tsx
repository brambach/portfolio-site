import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../banned-names';
import { projects } from '../projects/catalog';
import { el, report } from '../test/helpers';
import Home from './Home';
import * as COPY from './home/copy';
import { vignette } from './home/art/vignette';
import { PROJECT_META } from './meta';
import { WORK_IDS } from './routes';
import WorkPage from './WorkPage';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

class Observer {
  static all: Observer[] = [];
  readonly targets = new Set<Element>();
  constructor(readonly cb: IntersectionObserverCallback, readonly options: IntersectionObserverInit = {}) { Observer.all.push(this); }
  observe(el: Element) { this.targets.add(el); }
  unobserve(el: Element) { this.targets.delete(el); }
  disconnect() { this.targets.clear(); }
  takeRecords() { return []; }
}

const media = (matches: (q: string) => boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({ matches: matches(q), media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as MediaQueryList);

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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
      expect(story.querySelector('.vh')?.textContent).toBe(`about ${names[i]}`);
      expect(card.querySelector('.work__what')?.textContent).toBeTruthy();
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
        expect(a.querySelector('.vh'), href).not.toBeNull();
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
    expect(text).not.toMatch(/[↗→←↑↓]/);
  });

  it('calls the integration portal employee work, with no contract and no july to october', () => {
    const { container } = render(<Home />);
    const portal = within(screen.getByRole('region', { name: 'work' })).getAllByRole('article')[1];
    expect(within(portal).getByRole('heading', { level: 3 })).toHaveTextContent('integration portal');
    expect(portal.querySelector('.work__kind')).toHaveTextContent(/^employee, now$/);
    const old = /contract|jul to oct|july to october|parked/i;
    expect(container.textContent).not.toMatch(old);
    for (const s of strings(COPY)) expect(s, s).not.toMatch(old);
  });

  it('names no city and no employer', () => {
    const all = strings(COPY).join(' ');
    expect(all).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk/i);
    // The job is employee work at an unnamed consultancy: never the company, its clients or vendors, a contract or
    // freelance gig, or a claim to be its only, sole or solo technical person (src/banned-names.ts has the list).
    const employer = [...BANNED, /\bdd\b/i, /\bcontract/i, /\bfreelanc/i];
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
  it('is on the home page once, inside main, and named for a screen reader on the picture itself', () => {
    render(<Home />);
    const art = within(screen.getByRole('main')).getByRole('img', { name: COPY.HERO.art });
    expect(art).toHaveClass('vig__plate');
    expect(document.querySelectorAll('.vig')).toHaveLength(1);
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

describe('The note', () => {
  const rows = () => within(screen.getByRole('region', { name: 'work' })).getAllByRole('article');

  it('numbers the work no. 001 to no. 004, in order', () => {
    render(<Home />);
    expect(rows().map(r => within(r).getByText(/^no\. \d+$/).textContent)).toEqual(['no. 001', 'no. 002', 'no. 003', 'no. 004']);
  });

  it('watches each row for an eighth of it coming into view, so its number clicks up as it arrives', () => {
    Observer.all = [];
    vi.stubGlobal('IntersectionObserver', Observer);
    render(<Home />);
    for (const row of rows()) {
      const own = Observer.all.filter(o => o.targets.has(row));
      expect(own.map(o => o.options.threshold), row.id).toEqual([0.12]);
    }
  });

  it('clicks each number up on a wheel, one digit at a time, overshooting once on the last click', () => {
    render(<Home />);
    for (const row of rows()) {
      const serial = within(row).getByText(/^no\. \d+$/).textContent!;
      const n = Number(serial.at(-1));
      // The serial's line carries the wheel's count and rhythm, so the rule beside the number can follow the clicks.
      const line = row.querySelector<HTMLElement>('.work__line')!;
      expect(line.querySelector('.wheel'), serial).not.toBeNull();
      expect(line.style.getPropertyValue('--n'), serial).toBe(String(n));
      const easing = line.style.getPropertyValue('--clicks');
      expect(easing, serial).toMatch(/^linear\(.*\)$/);
      const stops = easing.slice('linear('.length, -1).split(', ').map(s => {
        const [v, at = '0%'] = s.split(' ');
        return { v: Number(v), at: parseFloat(at) };
      });
      expect(stops[0], serial).toEqual({ v: 0, at: 0 });
      expect(stops.at(-1), serial).toEqual({ v: 1, at: 100 });
      // Rounded to two places, so a digit's value is within .005 of k/n.
      const near = (v: number, want: number) => Math.abs(v - want) <= .005 + 1e-9;
      const holds = (k: number) => stops.findIndex((s, i) => i > 0 && near(stops[i - 1].v, k / n) && near(s.v, k / n) && s.at > stops[i - 1].at);
      for (let k = 0; k < n; k++) expect(holds(k), `${serial} holds on ${k}`).toBeGreaterThan(0);
      const over = stops.filter(s => s.v > 1);
      expect(over, serial).toHaveLength(1);
      expect(near(over[0].v, 1 + .06 / n), `${serial} overshoots by ${over[0].v - 1}`).toBe(true);
      expect(over[0].at, serial).toBeGreaterThan(stops[holds(n - 1)].at);
    }
  });

  it('prints microprint only from lines on the page, repeated, and hidden from screen readers', () => {
    const { container } = render(<Home />);
    const face = screen.getByRole('heading', { level: 1 }).closest('section')!;
    const back = screen.getByRole('contentinfo');
    const about = screen.getByRole('region', { name: 'about' }).querySelectorAll('p')[1].textContent!;
    const unit = (m: Element) => {
      const row = m.closest('article');
      if (row) return `${within(row).getByRole('heading', { level: 3 }).textContent}, ${row.querySelector('.work__kind')!.textContent}`;
      if (face.contains(m)) return screen.getByRole('heading', { level: 1 }).textContent!;
      if (back.contains(m)) return about;
      throw new Error(`microprint outside a note or a row: ${m.textContent!.slice(0, 40)}`);
    };
    const micro = [...container.querySelectorAll('.micro')];
    expect([face, back, ...rows()].map(n => micro.filter(m => n.contains(m) && (n.tagName === 'ARTICLE' || !m.closest('article'))).length)).toEqual([4, 4, 1, 1, 1, 1]);
    for (const m of micro) {
      expect(m.closest('[aria-hidden="true"]'), m.className).not.toBeNull();
      const text = m.textContent!, u = unit(m), times = (text.length + 1) / (u.length + 1);
      expect(Number.isInteger(times) && times > 1, `${m.className}: ${text.slice(0, 60)}`).toBe(true);
      expect(text).toBe(Array(times).fill(u).join(' '));
    }
  });

  it('gives each print one hairline frame a pen can draw, one round both of arro’s phones', () => {
    render(<Home />);
    for (const row of rows()) {
      const frames = row.querySelectorAll('.print rect');
      expect(frames, row.id).toHaveLength(1);
      expect(frames[0], row.id).toHaveAttribute('pathLength', '1');
      expect(frames[0].closest('[aria-hidden="true"]'), row.id).not.toBeNull();
    }
    expect(rows()[2].querySelectorAll('.print img')).toHaveLength(2);
  });

  it('lays a foil over the border of both sides of the note, hidden from screen readers', () => {
    render(<Home />);
    for (const note of [screen.getByRole('heading', { level: 1 }).closest('section')!, screen.getByRole('contentinfo')]) {
      const foil = note.querySelectorAll('.note__plate > .foil > .foil__band');
      expect(foil, note.className).toHaveLength(1);
      expect(foil[0].closest('[aria-hidden="true"]'), note.className).not.toBeNull();
    }
  });

  it('carries its guilloche on the page root, with the border in two inks', () => {
    render(<Home />);
    const root = screen.getByRole('main').parentElement!;
    const prop = (name: string) => root.style.getPropertyValue(name);
    for (const name of ['--border-ink', '--border-cream', '--wave', '--band']) expect(prop(name), name).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(prop('--border-ink')).not.toBe(prop('--border-cream'));
  });

  it('shows the portrait at once as decoration, and the screenshots lazily at their own size', () => {
    const { container } = render(<Home />);
    const portrait = container.querySelector('img[src="/art/portrait.webp"]')!;
    expect(portrait).toHaveAttribute('alt', '');
    expect(portrait).toHaveAttribute('width', '150');
    expect(portrait).toHaveAttribute('height', '192');
    expect(portrait).toHaveAttribute('decoding', 'async');
    expect(portrait).not.toHaveAttribute('loading');
    expect(portrait.closest('[aria-hidden="true"]')).not.toBeNull();
    const shots = rows().flatMap(r => [...r.querySelectorAll('img')]);
    expect(shots).toHaveLength(5);
    for (const img of shots) {
      expect(Number(img.getAttribute('width')), img.src).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height')), img.src).toBeGreaterThan(0);
      expect(img, img.src).toHaveAttribute('loading', 'lazy');
    }
  });
});

describe('Copying the email', () => {
  const MAILTO = `mailto:${COPY.EMAIL}`;
  const FAILED = `copy did not work, the address is ${COPY.EMAIL}`;
  const notes = () => ({ hero: screen.getByRole('heading', { level: 1 }).closest('section')!, footer: screen.getByRole('contentinfo') });
  const buttons = () => Object.entries(notes()).map(([where, note]) => [where, within(note).getByRole('button', { name: 'copy email address' })] as const);
  const clipboard = (writeText?: (text: string) => Promise<void>) =>
    Object.defineProperty(navigator, 'clipboard', { value: writeText && { writeText }, configurable: true });
  const status = () => screen.getByRole('status');
  // A click, then the clipboard's answer. True when nothing stopped the click's default.
  const click = async (el: HTMLElement) => {
    let followed = true;
    await act(async () => { followed = fireEvent.click(el); });
    return followed;
  };

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
    vi.useRealTimers();
  });

  it('shows the address as a plain mailto link in the hero and the footer, with a copy button after it', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    render(<Home />);
    expect(screen.getAllByRole('button', { name: 'copy email address' })).toHaveLength(2);
    for (const [where, note] of Object.entries(notes())) {
      const link = within(note).getByRole('link', { name: COPY.EMAIL });
      expect(link, where).toHaveAttribute('href', MAILTO);
      // The address may break before the @ on a narrow screen.
      expect(link.innerHTML, where).toBe(COPY.EMAIL.replace('@', '<wbr>@'));
      const button = within(note).getByRole('button', { name: 'copy email address' });
      expect(button, where).toHaveAttribute('type', 'button');
      expect(link.nextSibling?.textContent, where).toBe(' ');
      expect(link.nextSibling?.nextSibling, where).toBe(button);
      expect(button.querySelector('.stamp'), where).toHaveAttribute('aria-hidden', 'true');
      expect(await click(link), `${where} link opens the mail app`).toBe(true);
    }
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the address from the hero and from the footer, stamps the button that copied, and lifts the stamp after its hold', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<Home />);
    for (const [where, button] of buttons()) {
      writeText.mockClear();
      await click(button);
      expect(writeText, where).toHaveBeenCalledExactlyOnceWith(COPY.EMAIL);
      expect(button.querySelector('.stamp'), where).toHaveTextContent('copied');
      expect(button, where).toHaveAttribute('data-stamp', 'in');
      expect(buttons().filter(([, b]) => b !== button).map(([, b]) => b.dataset.stamp), where).toEqual([undefined]);
      expect(screen.getAllByRole('link', { name: COPY.EMAIL }).filter(l => l.hasAttribute('data-stamp')), where).toEqual([]);
      // 220ms in and a 1.2s hold, then 140ms out, then gone.
      act(() => { vi.advanceTimersByTime(1419); });
      expect(button, where).toHaveAttribute('data-stamp', 'in');
      act(() => { vi.advanceTimersByTime(1); });
      expect(button, where).toHaveAttribute('data-stamp', 'out');
      act(() => { vi.advanceTimersByTime(140); });
      expect(button, where).not.toHaveAttribute('data-stamp');
    }
  });

  it.each(['{Enter}', '[Space]'])('copies from the keyboard with %s, stamping only that button', async key => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    render(<Home />);
    const [[, hero], [, footer]] = buttons();
    footer.focus();
    await userEvent.keyboard(key);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(COPY.EMAIL);
    expect(footer).toHaveAttribute('data-stamp', 'in');
    expect(hero).not.toHaveAttribute('data-stamp');
  });

  it('says the address instead when the clipboard is missing or refuses, with no stamp, each time', async () => {
    render(<Home />);
    for (const writeText of [undefined, vi.fn(() => Promise.reject(new Error('denied')))]) {
      for (const [where, button] of buttons()) {
        clipboard(writeText);
        const before = status().firstElementChild;
        await click(button);
        const how = `${where}, clipboard ${writeText ? 'refused' : 'missing'}`;
        expect(button, how).not.toHaveAttribute('data-stamp');
        expect(status().textContent, how).toBe(FAILED);
        expect(status().firstElementChild, how).not.toBe(before);
      }
    }
  });

  it('says "email copied" in one polite status line, once for each copy, and clears it when the stamp has gone', async () => {
    clipboard(() => Promise.resolve());
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = render(<Home />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(container.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]')).toHaveLength(1);
    expect(status()).toHaveClass('vh');
    expect(status()).toBeEmptyDOMElement();
    const [[, hero], [, footer]] = buttons();
    await click(hero);
    const first = status().firstElementChild;
    expect(status().textContent).toBe('email copied');
    // A second copy says it again as a new line, not a second line beside the first.
    await click(footer);
    expect(status().children).toHaveLength(1);
    expect(status().firstElementChild).not.toBe(first);
    expect(status().textContent).toBe('email copied');
    act(() => { vi.advanceTimersByTime(1420); });
    expect(status().textContent).toBe('email copied');
    act(() => { vi.advanceTimersByTime(140); });
    expect(status()).toBeEmptyDOMElement();
  });

  it('leaves the header’s email a plain mailto link, with no copy button', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    render(<Home />);
    const header = screen.getByRole('banner');
    const link = within(header).getByRole('link', { name: 'email' });
    expect(link).toHaveAttribute('href', MAILTO);
    expect(within(header).queryByRole('button')).toBeNull();
    expect(await click(link)).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('The foil on the back of the note', () => {
  const back = () => screen.getByRole('contentinfo');
  const plate = () => el(back(), '.note__plate');
  const seeBack = () => act(() => {
    for (const o of Observer.all) for (const target of [back(), plate()]) report(o, target);
  });

  it('sweeps once a visit, while the medallion’s pen draws again on every load', () => {
    Observer.all = [];
    vi.stubGlobal('IntersectionObserver', Observer);
    sessionStorage.clear();
    const first = render(<Home />);
    expect(plate()).not.toHaveAttribute('data-seen');
    seeBack();
    expect(plate()).toHaveAttribute('data-seen', '');
    expect(back()).toHaveAttribute('data-seen', '');
    expect(sessionStorage.getItem('bn-foil-back')).toBe('1');
    first.unmount();

    Observer.all = [];
    render(<Home />);
    expect(plate()).toHaveAttribute('data-seen', 'done');
    expect(back()).not.toHaveAttribute('data-seen');
    seeBack();
    expect(plate()).toHaveAttribute('data-seen', 'done');
    expect(back()).toHaveAttribute('data-seen', '');
    expect(sessionStorage.getItem('bn-roll')).toBeNull();
  });
});

describe('The medallion on the back of the note', () => {
  const rings = () => screen.getByRole('contentinfo').querySelectorAll('.medal > svg');

  it('is drawn at once when the browser cannot tell where the back is', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Home />);
    expect(rings()).toHaveLength(3);
  });

  it('is drawn at once with reduced motion', () => {
    media(q => q.includes('reduced-motion'));
    render(<Home />);
    expect(rings()).toHaveLength(3);
  });

  it('waits until the back of the note comes near, then is drawn', () => {
    Observer.all = [];
    vi.stubGlobal('IntersectionObserver', Observer);
    render(<Home />);
    expect(rings()).toHaveLength(0);
    const back = screen.getByRole('contentinfo');
    act(() => {
      for (const o of Observer.all) if (o.targets.has(back)) o.cb([{ isIntersecting: true, target: back } as unknown as IntersectionObserverEntry], o as unknown as IntersectionObserver);
    });
    expect(rings()).toHaveLength(3);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path.relative(__dirname, full)] : [];
  });
}
