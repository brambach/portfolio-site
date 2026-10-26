import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// Async, so the plate has picked up the change to data-seen by the time it returns.
const view = (isIntersecting: boolean) => act(async () => {
  for (const o of Observer.all) o.cb([...o.targets].map(target => ({ isIntersecting, target }) as IntersectionObserverEntry), o as unknown as IntersectionObserver);
});

const reduceMotion = (on: boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({
  matches: on && q.includes('reduced-motion'), media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}) as MediaQueryList);

// Runs the next frame and anything waiting on it.
const frame = () => act(() => { vi.runAllTimers(); });

const plate = () => screen.getByRole('img', { name: HERO.art });
// React picks the event name from what the browser's styles support; under jsdom that's the prefixed one.
const animationEnd = (el: Element) => { for (const type of ['animationend', 'webkitAnimationEnd']) fireEvent(el, new Event(type, { bubbles: true })); };

beforeEach(() => {
  vi.useFakeTimers();
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
  it('is still with reduced motion: painted finished, with nothing watching for it to come into view', () => {
    reduceMotion(true);
    render(<Home />);
    expect(plate()).toHaveAttribute('data-motion', 'still');
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    expect(Observer.all).toHaveLength(0);
  });

  it('watches for a quarter of it to come into view when motion is allowed', () => {
    render(<Home />);
    expect(Observer.all).toHaveLength(1);
    expect(Observer.all[0].options?.threshold).toBe(0.25);
  });

  it('starts when it comes into view and stops when it leaves', async () => {
    render(<Vignette label={HERO.art} />);
    expect(plate()).toHaveAttribute('data-motion', 'off');
    expect(plate()).not.toHaveAttribute('data-drawn');
    await view(true);
    frame();
    expect(plate()).toHaveAttribute('data-motion', 'on');
    expect(plate()).toHaveAttribute('data-drawn', '');
    await view(false);
    expect(plate()).toHaveAttribute('data-motion', 'off');
    await view(true);
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('draws in only once, through a redraw and a second view', async () => {
    let width = 390;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
    render(<Vignette label={HERO.art} />);
    frame();
    expect(plate().querySelector('svg')).not.toBeNull();
    await view(true);
    width = 768;
    act(() => {
      for (const r of Resizes.all) r.cb([], r as unknown as ResizeObserver);
      vi.advanceTimersByTime(150);
    });
    expect(plate().querySelector('.vig__sun')?.getAttribute('viewBox')).toBeTruthy();
    expect(plate()).toHaveAttribute('data-drawn', '');
    await view(false);
    await view(true);
    expect(plate()).toHaveAttribute('data-drawn', '');
  });

  it('is marked drawn once its glow has faded in, and stays so through a redraw', async () => {
    let width = 390;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
    render(<Vignette label={HERO.art} />);
    frame();
    await view(true);
    frame();
    animationEnd(plate().querySelector('.vig__ridges')!);
    animationEnd(plate().querySelector('.vig__sun')!);
    expect(plate()).toHaveAttribute('data-drawn', '');
    animationEnd(plate().querySelector('.vig__halo')!);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    width = 768;
    act(() => {
      for (const r of Resizes.all) r.cb([], r as unknown as ResizeObserver);
      vi.advanceTimersByTime(150);
    });
    expect(plate().querySelector('.vig__far')).toHaveAttribute('width', '768');
    expect(plate()).toHaveAttribute('data-drawn', 'done');
  });

  it('starts its draw-in a frame after it is first seen, but shows a later load finished at once', async () => {
    const first = render(<Vignette label={HERO.art} />);
    await view(true);
    expect(plate()).toHaveAttribute('data-motion', 'on');
    expect(plate()).not.toHaveAttribute('data-drawn');
    frame();
    expect(plate()).toHaveAttribute('data-drawn', '');
    first.unmount();
    Observer.all = [];
    render(<Vignette label={HERO.art} />);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
  });

  it('pauses while the tab is hidden and runs again when it is shown', async () => {
    let hidden = false;
    vi.spyOn(Document.prototype, 'hidden', 'get').mockImplementation(() => hidden);
    const tab = (h: boolean) => act(() => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); });
    render(<Vignette label={HERO.art} />);
    await view(true);
    tab(true);
    expect(plate()).toHaveAttribute('data-motion', 'off');
    tab(false);
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('shows the picture finished on a later load in the same visit, and still runs its loops', async () => {
    const first = render(<Vignette label={HERO.art} />);
    await view(true);
    first.unmount();
    Observer.all = [];
    render(<Vignette label={HERO.art} />);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    await view(true);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('draws in as usual when the browser blocks storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<Vignette label={HERO.art} />);
    expect(plate()).not.toHaveAttribute('data-drawn');
    await view(true);
    frame();
    expect(plate()).toHaveAttribute('data-drawn', '');
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('shows the picture finished and running when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
    render(<Vignette label={HERO.art} />);
    frame();
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    expect(plate()).toHaveAttribute('data-motion', 'on');
    expect(plate().querySelector('.vig__ridges')).not.toBeNull();
  });

  it('stops watching and drawing once it is gone', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
    const views = vi.spyOn(Observer.prototype, 'disconnect');
    const sizes = vi.spyOn(Resizes.prototype, 'disconnect');
    const draws = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    const { unmount } = render(<Vignette label={HERO.art} />);
    act(() => { for (const r of Resizes.all) r.cb([], r as unknown as ResizeObserver); });
    unmount();
    frame();
    expect(views).toHaveBeenCalledOnce();
    expect(sizes).toHaveBeenCalledOnce();
    expect(draws).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
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
