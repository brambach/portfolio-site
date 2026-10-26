/** returns x, or throws naming what was expected when it is null or undefined. */
export function must<T>(x: T | null | undefined, what: string): T {
  if (x === null || x === undefined) throw new Error(`expected ${what}, got ${x}`);
  return x;
}

/** the first element under root matching selector, or a throw naming the selector. */
export function el<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  return must(root.querySelector<T>(selector), `an element matching ${selector}`);
}

/** an IntersectionObserver entry for target, wholly in view or wholly out of it. */
export function entry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const box = target.getBoundingClientRect();
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: box,
    intersectionRect: box,
    rootBounds: null,
    time: performance.now(),
  };
}

/** what the tests' fake IntersectionObservers keep: the callback each was made with, its options and what it watches. */
export interface FakeObserver extends Pick<IntersectionObserver, 'observe' | 'unobserve' | 'disconnect'> {
  readonly cb: IntersectionObserverCallback;
  readonly options?: IntersectionObserverInit;
  readonly targets: ReadonlySet<Element>;
}

/** the IntersectionObserver a fake observer's callback is handed, as the browser would hand it: it forwards to the
    fake. */
export function observerOf(o: FakeObserver): IntersectionObserver {
  return {
    root: o.options?.root ?? null,
    rootMargin: o.options?.rootMargin ?? '0px',
    thresholds: [o.options?.threshold ?? 0].flat(),
    observe: t => o.observe(t),
    unobserve: t => o.unobserve(t),
    disconnect: () => o.disconnect(),
    takeRecords: () => [],
  };
}

/** tells a fake observer that target came into view (or left it), when it watches target. its callback gets the
    entry and an IntersectionObserver that forwards to the fake, as the browser would call it. */
export function report(o: FakeObserver, target: Element, isIntersecting = true): void {
  if (o.targets.has(target)) o.cb([entry(target, isIntersecting)], observerOf(o));
}

/** what the tests' fake ResizeObservers keep: the callback each was made with. */
export interface FakeResizeObserver extends Pick<ResizeObserver, 'observe' | 'unobserve' | 'disconnect'> {
  readonly cb: ResizeObserverCallback;
}

/** tells a fake resize observer that what it watches changed size. its callback gets no entries and a ResizeObserver
    that forwards to the fake, as the browser would call it. */
export function resized(o: FakeResizeObserver): void {
  const observer: ResizeObserver = {
    observe: (target, options) => o.observe(target, options),
    unobserve: target => o.unobserve(target),
    disconnect: () => o.disconnect(),
  };
  o.cb([], observer);
}
