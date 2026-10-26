import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { report, resized } from '../../../test/helpers';
import Home from '../../Home';
import { HERO } from '../copy';
import Vignette from './Vignette';

class Observer {
  static all: Observer[] = [];
  readonly targets = new Set<Element>();
  constructor(readonly cb: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) { Observer.all.push(this); }
  observe(el: Element) { this.targets.add(el); }
  unobserve(el: Element) { this.targets.delete(el); }
  disconnect() { this.targets.clear(); }
  takeRecords() { return []; }
}

class Resizes {
  static all: Resizes[] = [];
  constructor(readonly cb: ResizeObserverCallback) { Resizes.all.push(this); }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const reduceMotion = (on: boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({
  matches: on && q.includes('reduced-motion'), media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}) as MediaQueryList);

let width = 390;
const sized = () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
};

// Runs the next frame and anything waiting on it.
const frame = () => act(() => { vi.runAllTimers(); });
const resize = (w: number) => {
  act(() => {
    width = w;
    for (const r of Resizes.all) resized(r);
    vi.advanceTimersByTime(150);
  });
  frame();
};

const plate = () => screen.getByRole('img', { name: HERO.art });
// The block the picture moves with: CSS reads its data-motion and data-seen.
const block = () => plate().closest<HTMLElement>('[data-motion]')!;
const page = () => plate().closest<HTMLElement>('.home')!;

// Async, so React has caught up with anything the change set off.
const view = (isIntersecting: boolean) => act(async () => {
  const el = block();
  for (const o of Observer.all) report(o, el, isIntersecting);
});

const rollStarts = () => fireEvent(plate().closest('.roll')!, new Event('animationstart', { bubbles: true }));

beforeEach(() => {
  vi.useFakeTimers();
  width = 390;
  Observer.all = [];
  Resizes.all = [];
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('ResizeObserver', Resizes);
  sessionStorage.clear();
  reduceMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('The hero picture', () => {
  it('is painted finished with reduced motion, with nothing watching for it to come into view', () => {
    reduceMotion(true);
    render(<Home />);
    expect(page()).toHaveAttribute('data-mode', 'still');
    expect(block()).toHaveAttribute('data-motion', 'still');
    expect(block()).toHaveAttribute('data-seen', 'done');
    expect(Observer.all).toHaveLength(0);
  });

  it('rolls on with the face of the note, once a quarter of the face is in view', () => {
    render(<Home />);
    expect(block()).toBe(screen.getByRole('heading', { level: 1 }).closest('section'));
    expect(Observer.all.filter(o => o.targets.has(block())).map(o => o.options?.threshold)).toEqual([0.25]);
  });

  it('waits at the start of its roll until the face is seen, rolls once, and loops only while on screen', async () => {
    render(<Home />);
    expect(block()).toHaveAttribute('data-motion', 'off');
    expect(block()).not.toHaveAttribute('data-seen');
    await view(true);
    expect(block()).toHaveAttribute('data-motion', 'on');
    expect(block()).toHaveAttribute('data-seen', '');
    await view(false);
    expect(block()).toHaveAttribute('data-motion', 'off');
    await view(true);
    expect(block()).toHaveAttribute('data-motion', 'on');
    expect(block()).toHaveAttribute('data-seen', '');
  });

  it('pauses while the tab is hidden and runs again when it is shown', async () => {
    let hidden = false;
    vi.spyOn(Document.prototype, 'hidden', 'get').mockImplementation(() => hidden);
    const tab = (h: boolean) => act(() => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); });
    render(<Home />);
    await view(true);
    tab(true);
    expect(block()).toHaveAttribute('data-motion', 'off');
    tab(false);
    expect(block()).toHaveAttribute('data-motion', 'on');
  });

  it('is painted rolled on a later load in the same visit, and still runs its loops', async () => {
    const first = render(<Home />);
    await view(true);
    first.unmount();
    Observer.all = [];
    render(<Home />);
    expect(block()).toHaveAttribute('data-seen', 'done');
    await view(true);
    expect(block()).toHaveAttribute('data-seen', 'done');
    expect(block()).toHaveAttribute('data-motion', 'on');
  });

  it('rolls on every load when the browser blocks storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const first = render(<Home />);
    await view(true);
    expect(block()).toHaveAttribute('data-seen', '');
    first.unmount();
    Observer.all = [];
    render(<Home />);
    expect(block()).not.toHaveAttribute('data-seen');
    await view(true);
    expect(block()).toHaveAttribute('data-seen', '');
  });

  it('is painted finished and running when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    sized();
    render(<Home />);
    frame();
    expect(block()).toHaveAttribute('data-seen', 'done');
    expect(block()).toHaveAttribute('data-motion', 'on');
    expect(plate().querySelector('.vig__ridges')).not.toBeNull();
  });

  it('is drawn after the first paint at its box’s size, and drawn again when the box changes width, with only the first drawing’s sun rising', () => {
    sized();
    render(<Vignette label={HERO.art} />);
    expect(plate().querySelector('svg')).toBeNull();
    frame();
    expect(plate().querySelector('.vig__far')).toHaveAttribute('width', '390');
    expect(plate()).not.toHaveAttribute('data-redrawn');
    resize(391);
    expect(plate().querySelector('.vig__far')).toHaveAttribute('width', '390');
    resize(768);
    expect(plate().querySelector('.vig__far')).toHaveAttribute('width', '768');
    expect(plate()).toHaveAttribute('data-redrawn', '');
  });

  it('times the roll’s frames, and a roll that drops frames turns the page lite for the visit', async () => {
    let waiting: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => waiting.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const frames = (ms: number) => act(() => {
      for (let k = 0; k <= 30; k++) { const due = waiting; waiting = []; due.forEach(cb => cb(k * ms)); }
    });
    render(<Home />);
    await view(true);
    frames(25);
    expect(page()).toHaveAttribute('data-mode', 'full');
    rollStarts();
    frames(25);
    expect(page()).toHaveAttribute('data-mode', 'lite');
    expect(block()).toHaveAttribute('data-motion', 'on');
    expect(block()).toHaveAttribute('data-seen', '');
  });

  it('stops watching, drawing and timing once it is gone', async () => {
    sized();
    const { unmount } = render(<Home />);
    await view(true);
    // The async act leaves a zero-delay timer of its own.
    act(() => { vi.advanceTimersByTime(0); });
    rollStarts();
    act(() => { for (const r of Resizes.all) resized(r); });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const sizes = vi.spyOn(Resizes.prototype, 'disconnect');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(Observer.all.filter(o => o.targets.size)).toEqual([]);
    expect(sizes).toHaveBeenCalledOnce();
  });

  it('names the picture on the image itself, not on the figure around it', () => {
    render(<Home />);
    const img = plate();
    expect(img).toHaveClass('vig__plate');
    expect(img.closest('figure')).not.toHaveAttribute('role');
    expect(img.closest('figure')).not.toHaveAttribute('aria-label');
    expect(within(img.closest('figure')!).getAllByRole('img')).toEqual([img]);
  });
});
