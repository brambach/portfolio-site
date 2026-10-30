import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { siteRoute, type Route } from './routes';

/* Moving between the site's own pages without a reload, so a page can hand something to the next one. Following a
   link to / or /projects/<id> swaps the page in place inside a view transition: the root crossfades (leaving faster
   than arriving, src/index.css), and a picture both pages mark with the same data-handover grows from where it sat
   into where it lands. Back and forward do the same in reverse and put the scroll back where it was.

   Anything else (another site, the older pages, a new tab, a modified click) is a plain navigation. With reduced
   motion, or a browser without view transitions, the page still swaps in place; it just doesn't animate. */

type Loader = () => Promise<unknown>;
type Doc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

const reduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAME = 'handover';

/** The pages a visitor has already seen this visit, so coming back to one doesn't replay its entrance. */
const seen = new Set<string>();
export const seenBefore = (page: string) => seen.has(page);
export const markSeen = (page: string) => { seen.add(page); };

/** The handover picture on the page now: the one marked for `id` that's actually on screen. */
function shotOf(id: string) {
  return [...document.querySelectorAll<HTMLElement>(`[data-handover="${id}"]`)].find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
}

const idOf = (r: Route | null) => r?.name === 'project' || r?.name === 'story' ? r.id : null;

/** The route the site shows, kept in step with the address. `load` fetches a route's page before the swap, so the
 *  new page is there to hand over to. */
export function useSiteRoute(first: Route, load: (r: Route) => Loader) {
  const [route, setRoute] = useState(first);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let current = first;

    const go = async (url: URL, push: boolean, scroll?: number) => {
      const next = siteRoute(url.pathname, url.search);
      if (!next || next.name === 'missing') { window.location.assign(url.href); return; }
      if (push) history.replaceState({ ...history.state, y: window.scrollY }, '');
      await load(next)().catch(() => {});
      // The picture that travels: the project being opened, or the one being left.
      const id = idOf(next) ?? idOf(current);
      const from = id ? shotOf(id) : undefined;
      const swap = () => {
        if (from) from.style.viewTransitionName = '';
        flushSync(() => setRoute(next));
        current = next;
        if (push) history.pushState({ y: 0 }, '', url.href);
        const target = url.hash && document.getElementById(url.hash.slice(1));
        if (scroll !== undefined) window.scrollTo(0, scroll);
        else if (target) target.scrollIntoView();
        else window.scrollTo(0, 0);
        const to = from && id ? shotOf(id) : undefined;
        if (to) { to.style.viewTransitionName = NAME; to.setAttribute('data-landed', ''); }
        return to;
      };
      const doc = document as Doc;
      if (!doc.startViewTransition || reduced()) { swap(); return; }
      if (from) from.style.viewTransitionName = NAME;
      document.documentElement.dataset.nav = from ? 'handover' : 'swap';
      let to: HTMLElement | undefined;
      const t = doc.startViewTransition(() => { to = swap(); });
      t.finished.finally(() => {
        if (to) to.style.viewTransitionName = '';
        delete document.documentElement.dataset.nav;
      });
    };

    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.('a');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // A link to a spot on this same page is the browser's to scroll to.
      if (url.pathname.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '') && url.search === window.location.search) return;
      const next = siteRoute(url.pathname, url.search);
      if (!next || next.name === 'missing') return;
      e.preventDefault();
      void go(url, true);
    };
    const pop = (e: PopStateEvent) => {
      const next = siteRoute(window.location.pathname, window.location.search);
      if (JSON.stringify(next) === JSON.stringify(current)) return;
      void go(new URL(window.location.href), false, (e.state as { y?: number } | null)?.y ?? 0);
    };

    document.addEventListener('click', click);
    window.addEventListener('popstate', pop);
    return () => { document.removeEventListener('click', click); window.removeEventListener('popstate', pop); };
  }, []);

  return route;
}
