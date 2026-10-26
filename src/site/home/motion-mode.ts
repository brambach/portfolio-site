import { useSyncExternalStore } from 'react';

/* The one place the home decides how much to move. The page root carries the answer as data-mode.
   still: the visitor asked for reduced motion, so the page shows the finished print.
   lite: Save-Data, reduced data, or frames that ran slow this visit, so the heaviest drawing (the medallion's pen) is
         skipped and its rings are there at once.
   full: everything else. A narrow screen or a coarse pointer is no reason to move less. */

export type MotionMode = 'full' | 'lite' | 'still';

const REDUCE = '(prefers-reduced-motion: reduce)', LESS_DATA = '(prefers-reduced-data: reduce)';
const SLOW = 'bn-slow', FRAMES = 30, SLOW_FRAME_MS = 20;

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: Connection }).connection);
const media = (q: string) => (typeof matchMedia === 'function' ? matchMedia(q) : null);

// The visit remembers a slow device in storage. When storage is blocked, this page alone remembers it here.
let slowHere = false;
const slow = () => { try { return sessionStorage.getItem(SLOW) === '1'; } catch { return slowHere; } };

const decided = new Set<() => void>();
const markSlow = () => {
  slowHere = true;
  try { sessionStorage.setItem(SLOW, '1'); } catch { /* slowHere keeps this page lite */ }
  decided.forEach(fn => fn());
};

export function motionMode(): MotionMode {
  if (typeof window === 'undefined') return 'still';
  if (media(REDUCE)?.matches) return 'still';
  return connection()?.saveData || media(LESS_DATA)?.matches || slow() ? 'lite' : 'full';
}

/** Times the next 30 frames. If they average over 20ms, the page goes lite for the rest of the visit. Only a full page
 *  is timed. Returns the cancel. */
export function timeFrames(): () => void {
  if (motionMode() !== 'full') return () => {};
  let raf = 0, n = 0, t0 = 0;
  // A hidden tab stops sending frames, and that gap would read as slow, so a tab change ends the timing undecided.
  const stop = () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', stop); };
  const tick = (t: number) => {
    if (n === 0) t0 = t;
    if (n++ < FRAMES) { raf = requestAnimationFrame(tick); return; }
    stop();
    if ((t - t0) / FRAMES > SLOW_FRAME_MS) markSlow();
  };
  raf = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', stop);
  return stop;
}

function subscribe(onChange: () => void) {
  const lists = [REDUCE, LESS_DATA].map(media).filter((m): m is MediaQueryList => !!m);
  lists.forEach(m => m.addEventListener?.('change', onChange));
  const conn = connection();
  conn?.addEventListener?.('change', onChange);
  decided.add(onChange);
  return () => {
    lists.forEach(m => m.removeEventListener?.('change', onChange));
    conn?.removeEventListener?.('change', onChange);
    decided.delete(onChange);
  };
}

/** The current motion mode, updated when any of its inputs change. 'still' when there's no window (SSR). */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, motionMode, () => 'still');
}
