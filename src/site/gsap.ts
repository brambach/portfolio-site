/* GSAP on the live site. The CSS in motion.css still does every arrival and every loop; GSAP takes the two kinds of
   move CSS can't do well. A scroll scrub that trails the page a beat instead of sticking to it, and an answer that a
   second tap can catch mid-move instead of snapping back to the start. See docs/motion.md.

   It's never in the first load. A page asks for it when the browser goes idle, so it can't hold the entrance up, and
   until it arrives (or if it never does) the page does what it did before. */

type Gsap = typeof import('gsap').gsap;
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger;
export type G = { gsap: Gsap; ScrollTrigger: ST };

let loading: Promise<G> | null = null;

/** Waits for the browser to be idle (or 1.5s), so GSAP never takes bandwidth or frames from the fonts and the name. */
const idle = () => new Promise<void>(done => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => done(), { timeout: 1500 });
  else setTimeout(done, 300);
});

/** gsap and ScrollTrigger, registered once. Measured again after the web fonts land, since the face changes how tall
 *  the hero is. */
export function loadGsap() {
  loading ??= idle().then(() => Promise.all([import('gsap'), import('gsap/ScrollTrigger')])).then(([g, s]) => {
    const { gsap } = g, { ScrollTrigger } = s;
    gsap.registerPlugin(ScrollTrigger);
    // A phone's address bar showing and hiding isn't a resize worth measuring for.
    ScrollTrigger.config({ ignoreMobileResize: true });
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return { gsap, ScrollTrigger };
  }).catch(e => {
    // A failed load (a dropped connection, a deploy mid-visit) isn't kept, so the next page tries again.
    loading = null;
    throw e;
  });
  return loading;
}

export const reduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How far the scrub trails the scroll, in seconds. Long enough to feel like weight, short enough that the page
 *  never seems to lag behind your thumb. */
export const TRAIL = 0.6;

/** Runs `fallback` (the hand-rolled scroll the page always had) at once, then hands over to `withGsap` when GSAP
 *  arrives. `withGsap` builds its tweens inside a gsap.context, so leaving the page reverts every one of them. */
export function scrollMotion(root: HTMLElement, fallback: () => () => void, withGsap: (g: G) => void) {
  if (reduced()) return () => {};
  let stopFallback: (() => void) | undefined = fallback(), gone = false;
  let ctx: { revert: () => void } | undefined;
  loadGsap().then(g => {
    if (gone) return;
    stopFallback?.();
    stopFallback = undefined;
    ctx = g.gsap.context(() => withGsap(g), root);
  }).catch(() => { /* keep the fallback */ });
  return () => { gone = true; stopFallback?.(); ctx?.revert(); };
}
