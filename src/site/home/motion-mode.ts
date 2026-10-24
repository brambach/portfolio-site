import { useSyncExternalStore } from 'react';

/* The one place the home decides how much to move. Every scene reads only this.
   still: the visitor asked for reduced motion, so scenes paint their finished state.
   lite: a narrow screen (<760px), a coarse pointer or Save-Data, so nothing pins and scrubbed scenes play once.
   full: everything else. */

export type MotionMode = 'full' | 'lite' | 'still';

const QUERIES = ['(prefers-reduced-motion: reduce)', '(max-width: 759.98px)', '(pointer: coarse)'] as const;

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: Connection }).connection);
const media = (q: string) => (typeof matchMedia === 'function' ? matchMedia(q) : null);

export function motionMode(): MotionMode {
  if (typeof window === 'undefined') return 'still';
  const [reduce, narrow, coarse] = QUERIES.map(q => media(q)?.matches ?? false);
  if (reduce) return 'still';
  return narrow || coarse || connection()?.saveData ? 'lite' : 'full';
}

function subscribe(onChange: () => void) {
  const lists = QUERIES.map(media).filter((m): m is MediaQueryList => !!m);
  lists.forEach(m => m.addEventListener?.('change', onChange));
  const conn = connection();
  conn?.addEventListener?.('change', onChange);
  return () => {
    lists.forEach(m => m.removeEventListener?.('change', onChange));
    conn?.removeEventListener?.('change', onChange);
  };
}

/** The current motion mode, updated when any of its inputs change. 'still' when there's no window (SSR). */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, motionMode, () => 'still');
}
