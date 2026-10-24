/* The only place the home imports GSAP. It's never in the first load: a scene calls loadGsap() when it mounts,
   which LazyScene only does once the page has painted. */

type Gsap = typeof import('gsap').gsap;
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger;

let loading: Promise<{ gsap: Gsap; ScrollTrigger: ST }> | null = null;

/** gsap and ScrollTrigger, registered once. Pins are measured again after the web fonts arrive, since the
 *  serif changes the height of every headline. */
export function loadGsap() {
  loading ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, s]) => {
    const { gsap } = g, { ScrollTrigger } = s;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return { gsap, ScrollTrigger };
  }).catch(e => {
    // A failed load (a dropped connection, a deploy mid-visit) isn't kept, so the next scene tries again.
    loading = null;
    throw e;
  });
  return loading;
}
