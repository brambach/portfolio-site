import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entry, observerOf, report } from '../../../test/helpers';
import type { MotionMode } from '../motion-mode';
import { watch, type WatchOptions } from './watch';

class Observer {
  static all: Observer[] = [];
  readonly targets = new Set<Element>();
  constructor(readonly cb: IntersectionObserverCallback, readonly options: IntersectionObserverInit = {}) { Observer.all.push(this); }
  observe(el: Element) { this.targets.add(el); }
  unobserve(el: Element) { this.targets.delete(el); }
  disconnect() { this.targets.clear(); }
  takeRecords() { return []; }
}

const isNear = (o: Observer) => o.options.rootMargin !== undefined;
const watching = (el: Element, near = false) => Observer.all.filter(o => o.targets.has(el) && isNear(o) === near);
// hands o an entry for el whether or not o still watches it, as the browser can with entries already queued.
const send = (o: Observer, el: Element, isIntersecting: boolean) => o.cb([entry(el, isIntersecting)], observerOf(o));
const deliver = (el: Element, isIntersecting: boolean, near = false) => { for (const o of watching(el, near)) report(o, el, isIntersecting); };

let hidden = false;
const tab = (h: boolean) => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); };

const offs: (() => void)[] = [];
const block = (mode: MotionMode = 'full', opts?: WatchOptions) => {
  const el = document.createElement('div');
  const off = watch(el, mode, opts);
  offs.push(off);
  return { el, off };
};

beforeEach(() => {
  Observer.all = [];
  hidden = false;
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.spyOn(Document.prototype, 'hidden', 'get').mockImplementation(() => hidden);
  sessionStorage.clear();
});

afterEach(() => {
  offs.splice(0).forEach(off => off());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('watch', () => {
  it('paints a still block finished and never watches it', () => {
    const near = vi.fn();
    const { el } = block('still', { near });
    expect(el).toHaveAttribute('data-motion', 'still');
    expect(el).toHaveAttribute('data-seen', 'done');
    expect(Observer.all).toHaveLength(0);
    expect(near).toHaveBeenCalledOnce();
  });

  it('runs while on screen and is seen from the first time it shows', () => {
    const { el } = block();
    expect(el).toHaveAttribute('data-motion', 'off');
    expect(el).not.toHaveAttribute('data-seen');
    deliver(el, true);
    expect(el).toHaveAttribute('data-motion', 'on');
    expect(el).toHaveAttribute('data-seen', '');
    deliver(el, false);
    expect(el).toHaveAttribute('data-motion', 'off');
    expect(el).toHaveAttribute('data-seen', '');
  });

  it('pauses everything while the tab is hidden and resumes only what is on screen', () => {
    const shown = block().el, below = block().el;
    deliver(shown, true);
    tab(true);
    expect(shown).toHaveAttribute('data-motion', 'off');
    expect(below).toHaveAttribute('data-motion', 'off');
    tab(false);
    expect(shown).toHaveAttribute('data-motion', 'on');
    expect(below).toHaveAttribute('data-motion', 'off');
  });

  it('shows a block finished and running when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const near = vi.fn();
    const { el } = block('full', { near });
    expect(el).toHaveAttribute('data-motion', 'on');
    expect(el).toHaveAttribute('data-seen', 'done');
    expect(near).toHaveBeenCalledOnce();
  });

  it('starts finished when its one-shot already played this visit', () => {
    sessionStorage.setItem('roll', '1');
    const { el } = block('full', { oncePerVisit: 'roll' });
    expect(el).toHaveAttribute('data-seen', 'done');
    deliver(el, true);
    expect(el).toHaveAttribute('data-seen', 'done');
    expect(el).toHaveAttribute('data-motion', 'on');
  });

  it('plays its one-shot on the first view of a visit and remembers it', () => {
    const { el } = block('full', { oncePerVisit: 'roll' });
    expect(el).not.toHaveAttribute('data-seen');
    deliver(el, true);
    expect(el).toHaveAttribute('data-seen', '');
    expect(sessionStorage.getItem('roll')).toBe('1');
  });

  it('plays its one-shot when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { el } = block('full', { oncePerVisit: 'roll' });
    expect(el).not.toHaveAttribute('data-seen');
    deliver(el, true);
    expect(el).toHaveAttribute('data-seen', '');
    expect(el).toHaveAttribute('data-motion', 'on');
  });

  it('keeps a block seen when it registers again, and a stale unregister leaves the new one alone', () => {
    const { el, off } = block('full', { oncePerVisit: 'roll' });
    deliver(el, true);
    off();
    offs.push(watch(el, 'lite', { oncePerVisit: 'roll' }));
    expect(el).toHaveAttribute('data-seen', '');
    expect(el).toHaveAttribute('data-motion', 'off');
    off();
    deliver(el, true);
    expect(el).toHaveAttribute('data-motion', 'on');
  });

  it('stops watching a block once it unregisters, and everything once the last one does', () => {
    const a = block(), b = block();
    const [io] = watching(a.el);
    a.off();
    a.off();
    expect(io.targets).toEqual(new Set([b.el]));
    send(io, a.el, true);
    expect(a.el).toHaveAttribute('data-motion', 'off');
    deliver(b.el, true);
    expect(b.el).toHaveAttribute('data-motion', 'on');
    b.off();
    expect(io.targets.size).toBe(0);
    tab(true);
    expect(b.el).toHaveAttribute('data-motion', 'on');
    expect(a.el).toHaveAttribute('data-motion', 'off');
  });

  it('calls near once, from its own wide observer, when the block comes within reach', () => {
    const near = vi.fn();
    const { el } = block('full', { near });
    const [reach] = watching(el, true);
    expect(reach.options.rootMargin).toBe('150% 0px');
    deliver(el, false, true);
    expect(near).not.toHaveBeenCalled();
    send(reach, el, true);
    send(reach, el, true);
    expect(near).toHaveBeenCalledOnce();
    expect(el).toHaveAttribute('data-motion', 'off');
  });

  it('watches for a quarter of a block by default and shares an observer per threshold', () => {
    const a = block().el, b = block('full', { threshold: 0.12 }).el, c = block().el;
    expect(watching(a)[0].options.threshold).toBe(0.25);
    expect(watching(b)[0].options.threshold).toBe(0.12);
    expect(watching(c)[0]).toBe(watching(a)[0]);
    expect(Observer.all).toHaveLength(2);
  });
});
