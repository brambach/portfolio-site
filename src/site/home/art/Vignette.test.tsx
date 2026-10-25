import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../../Home';
import { HERO } from '../copy';
import Vignette from './Vignette';

class Observer {
  static all: Observer[] = [];
  constructor(readonly cb: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) { Observer.all.push(this); }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

class Resizes {
  static all: Resizes[] = [];
  constructor(readonly cb: ResizeObserverCallback) { Resizes.all.push(this); }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const view = (isIntersecting: boolean) => act(() => {
  for (const o of Observer.all) o.cb([{ isIntersecting } as IntersectionObserverEntry], o as unknown as IntersectionObserver);
});

const reduceMotion = (on: boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({
  matches: on && q.includes('reduced-motion'), media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}) as MediaQueryList);

const plate = () => screen.getByRole('img', { name: HERO.art });
const toggle = () => screen.queryByRole('button', { name: /^(pause|play)$/ });

beforeEach(() => {
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
    expect(toggle()).toBeNull();
  });

  it('offers a pause button when motion is allowed', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: 'pause' })).toBeInTheDocument();
  });

  it('watches for a quarter of it to come into view when motion is allowed', () => {
    render(<Home />);
    expect(Observer.all).toHaveLength(1);
    expect(Observer.all[0].options?.threshold).toBe(0.25);
  });

  it('starts when it comes into view and stops when it leaves', () => {
    render(<Vignette label={HERO.art} />);
    expect(plate()).toHaveAttribute('data-motion', 'off');
    expect(plate()).not.toHaveAttribute('data-drawn');
    view(true);
    expect(plate()).toHaveAttribute('data-motion', 'on');
    expect(plate()).toHaveAttribute('data-drawn', '');
    view(false);
    expect(plate()).toHaveAttribute('data-motion', 'off');
    view(true);
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('stays paused once paused, through leaving and coming back, until play', () => {
    render(<Vignette label={HERO.art} />);
    view(true);
    fireEvent.click(screen.getByRole('button', { name: 'pause' }));
    expect(toggle()).toHaveTextContent('play');
    expect(plate()).toHaveAttribute('data-motion', 'paused');
    view(false);
    view(true);
    expect(plate()).toHaveAttribute('data-motion', 'paused');
    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    expect(toggle()).toHaveTextContent('pause');
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('draws in only once, through a redraw and a second view', () => {
    vi.useFakeTimers();
    let width = 390;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
    render(<Vignette label={HERO.art} />);
    act(() => { vi.runAllTimers(); });
    expect(plate().querySelector('svg')).not.toBeNull();
    view(true);
    width = 768;
    act(() => {
      for (const r of Resizes.all) r.cb([], r as unknown as ResizeObserver);
      vi.advanceTimersByTime(150);
    });
    expect(plate().querySelector('.vig__sun')?.getAttribute('viewBox')).toBeTruthy();
    expect(plate()).toHaveAttribute('data-drawn', '');
    view(false);
    view(true);
    expect(plate()).toHaveAttribute('data-drawn', '');
  });

  it('shows the picture finished on a later load in the same visit, and still runs its loops', () => {
    const first = render(<Vignette label={HERO.art} />);
    view(true);
    first.unmount();
    Observer.all = [];
    render(<Vignette label={HERO.art} />);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    view(true);
    expect(plate()).toHaveAttribute('data-drawn', 'done');
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('draws in as usual when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<Vignette label={HERO.art} />);
    expect(plate()).not.toHaveAttribute('data-drawn');
    view(true);
    expect(plate()).toHaveAttribute('data-drawn', '');
    expect(plate()).toHaveAttribute('data-motion', 'on');
  });

  it('names the picture on the image itself, not on the figure around it', () => {
    render(<Home />);
    const img = plate();
    expect(img).toHaveClass('vig__plate');
    expect(img.closest('figure')).not.toHaveAttribute('role');
    expect(img.closest('figure')).not.toHaveAttribute('aria-label');
    expect(within(img.closest('figure')!).getAllByRole('img')).toEqual([img]);
  });

  it('keeps the pause button beside the image, where a screen reader can reach it', () => {
    render(<Home />);
    const button = screen.getByRole('button', { name: 'pause' });
    expect(plate().contains(button)).toBe(false);
    expect(plate().closest('figure')).toContainElement(button);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-pressed');
  });
});
