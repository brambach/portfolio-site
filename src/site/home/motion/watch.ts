import { useEffect, useRef, type RefObject } from 'react';
import { useMotionMode, type MotionMode } from '../motion-mode';

/* The page's one place that watches blocks come into view. It writes attributes straight onto each registered
   element, so nothing re-renders when a block crosses the screen edge or the tab hides. */

/** What a block is doing. CSS reads these attributes and nothing else.
 *  data-motion: still (reduced motion: painted finished, nothing runs)
 *               off   (off screen, not seen yet, or the tab is hidden: every animation paused)
 *               on    (on screen and the tab is visible: running)
 *  data-seen:   absent until first on screen, then "" (one-shots run). "done" when they should not run
 *               (still mode, no IntersectionObserver, or the oncePerVisit key already played this visit). */
export type Motion = 'still' | 'off' | 'on';

export type WatchOptions = {
  threshold?: number;          // share of the block in view that counts as on screen, default 0.25
  near?: () => void;           // fired once when the block is within ~1.5 screens (rootMargin)
  oncePerVisit?: string;       // sessionStorage key; if set and already played, data-seen starts at "done"
};

type Block = { onScreen: boolean; once?: string; near?: () => void };

const blocks = new Map<HTMLElement, Block>();
const views = new Map<number, IntersectionObserver>();
let nearby: IntersectionObserver | null = null;

const paint = (el: HTMLElement, b: Block) => { el.dataset.motion = b.onScreen && !document.hidden ? 'on' : 'off'; };
const paintAll = () => blocks.forEach((b, el) => paint(el, b));

// Blocked storage just means it plays again.
const played = (key: string) => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } };

// Entries can arrive after a block unregistered, so each one looks its block up again.
const view = (threshold: number) => {
  let io = views.get(threshold);
  if (!io) views.set(threshold, io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!(e.target instanceof HTMLElement)) continue;
      const el = e.target, b = blocks.get(el);
      if (!b) continue;
      b.onScreen = e.isIntersecting;
      if (b.onScreen && el.dataset.seen === undefined) {
        el.dataset.seen = '';
        if (b.once) try { sessionStorage.setItem(b.once, '1'); } catch { /* the next load plays it again */ }
      }
      paint(el, b);
    }
  }, { threshold }));
  return io;
};

const nearView = () => nearby ??= new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!(e.target instanceof HTMLElement)) continue;
    const b = blocks.get(e.target), fn = b?.near;
    if (!e.isIntersecting || !b || !fn) continue;
    b.near = undefined;
    nearby?.unobserve(e.target);
    fn();
  }
}, { rootMargin: '150% 0px' });

/** Registers a block with the page's single observer. Returns the unregister function. */
export function watch(el: HTMLElement, mode: MotionMode, { threshold = 0.25, near, oncePerVisit }: WatchOptions = {}): () => void {
  // Without IntersectionObserver there is no way to tell, so it counts as on screen and shows finished.
  if (mode === 'still' || typeof IntersectionObserver !== 'function') {
    el.dataset.motion = mode === 'still' ? 'still' : 'on';
    el.dataset.seen = 'done';
    near?.();
    return () => {};
  }
  // An existing data-seen stays, so a mode change never replays a one-shot.
  if (oncePerVisit && played(oncePerVisit)) el.dataset.seen ??= 'done';
  const block: Block = { onScreen: false, once: oncePerVisit, near };
  if (!blocks.size) document.addEventListener('visibilitychange', paintAll);
  blocks.set(el, block);
  paint(el, block);
  view(threshold).observe(el);
  if (near) nearView().observe(el);
  return () => {
    if (blocks.get(el) !== block) return;
    blocks.delete(el);
    views.forEach(io => io.unobserve(el));
    nearby?.unobserve(el);
    if (blocks.size) return;
    views.forEach(io => io.disconnect());
    views.clear();
    nearby?.disconnect();
    nearby = null;
    document.removeEventListener('visibilitychange', paintAll);
  };
}

/** React side: a ref that registers on mount and unregisters on unmount. It registers again when the motion mode
 *  changes, and reads the options once per registration. */
export function useWatch<T extends HTMLElement>(opts?: WatchOptions): RefObject<T | null> {
  const ref = useRef<T>(null);
  const mode = useMotionMode();
  useEffect(() => (ref.current ? watch(ref.current, mode, opts) : undefined), [mode]);
  return ref;
}
