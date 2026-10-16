import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useThemeColor } from '../projects/look';
import { nameForTravel, reduced, SkyNav, useClickRipples, useSmoothScroll, type Go } from './parts';
import SkyHome from './SkyHome';
import SkyProject from './SkyProject';
import { workById } from './work';
import './sky.css';

/* The sky site: the home page at / and a page per project at /projects/<id>. Moving between them happens inside
   this one page, so the browser can carry pieces across with a view transition (the list's preview grows into the
   project's picture, the project's name becomes its title) and always has the new page on screen to animate to.
   Opened directly, each address renders on its own. Browsers without view transitions just switch. */

type Route = { name: 'home' } | { name: 'project'; id: string };

export function readRoute(pathname = location.pathname): Route {
  const id = /^\/projects\/([^/]+)\/?$/.exec(pathname)?.[1];
  return id && workById(id) ? { name: 'project', id } : { name: 'home' };
}

const TITLES: Record<Route['name'], string> = { home: 'Bryce Rambach', project: '' };
function titleFor(route: Route) {
  return route.name === 'project' ? `${workById(route.id)?.name} · Bryce Rambach` : TITLES.home;
}

/** Where the page should sit once a route has rendered. */
function settleScroll(route: Route, saved?: number) {
  if (route.name === 'project') { scrollTo(0, 0); return; }
  if (typeof saved === 'number') { scrollTo(0, saved); return; }
  if (location.hash) { document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }); return; }
  scrollTo(0, 0);
}

/** Keyboard and screen-reader users land somewhere sensible after a move: a project's title, or back on the name
 *  of the project they left. */
function placeFocus(route: Route, from: Route) {
  const target = route.name === 'project'
    ? document.querySelector<HTMLElement>('[data-piece="title"]')
    : from.name === 'project' ? document.querySelector<HTMLElement>(`[data-row="${from.id}"] .sky-head`) : null;
  target?.focus({ preventScroll: true });
}

/** After the new page renders, name its pieces to match what the old page named. Back on the home page, the
 *  project's title lands on its name, and its picture sinks back into its place on the horizon if that's in view. */
function nameArrivals(route: Route, from: Route) {
  if (route.name === 'project') {
    nameForTravel([[document.querySelector('[data-piece="shot"]'), 'sky-shot'], [document.querySelector('[data-piece="title"]'), 'sky-title']]);
  } else if (from.name === 'project') {
    const card = scrollY < innerHeight * 0.04 ? document.querySelector(`[data-berth="${from.id}"] .sky-shot`) : null;
    nameForTravel([[document.querySelector(`[data-row="${from.id}"] .sky-nm`), 'sky-title'], [card, 'sky-shot']]);
  }
}

export default function SkyApp() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [arrived, setArrived] = useState(true);
  const [cameFrom, setCameFrom] = useState<string | null>(null);
  const current = useRef(route);
  current.current = route;

  useThemeColor('#090f1c');
  useSmoothScroll();
  useClickRipples();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.sky = '';
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { delete root.dataset.sky; history.scrollRestoration = restoration; };
  }, []);
  useEffect(() => { document.title = titleFor(route); }, [route]);
  // A direct link to /#work lands on the list.
  useEffect(() => { if (location.hash && route.name === 'home') settleScroll(route); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const move = useCallback((next: Route, commit: () => void, prepare?: () => void, saved?: number) => {
    const from = current.current;
    const update = () => {
      flushSync(() => { setArrived(false); setRoute(next); setCameFrom(from.name === 'project' ? from.id : null); });
      commit();
      settleScroll(next, saved);
      nameArrivals(next, from);
      placeFocus(next, from);
    };
    if (!document.startViewTransition || reduced() || document.hidden) { update(); nameForTravel([]); return; }
    prepare?.();
    const transition = document.startViewTransition(update);
    transition.finished.finally(() => nameForTravel([]));
    transition.ready.catch(() => {});
  }, []);

  const go: Go = useCallback((to, prepare) => {
    const url = new URL(to, location.href);
    const next = readRoute(url.pathname);
    if (url.origin !== location.origin || (url.pathname !== '/' && next.name === 'home')) { location.href = url.href; return; }
    // Remember where the list was, for coming back, and whether this step left from it.
    const fromHome = current.current.name === 'home';
    if (fromHome) history.replaceState({ ...history.state, skyScroll: scrollY }, '');
    move(next, () => history.pushState({ sky: true, fromHome }, '', url.pathname + url.search + url.hash), prepare);
  }, [move]);

  useEffect(() => {
    const pop = (event: PopStateEvent) => {
      const next = readRoute();
      const from = current.current;
      const saved = typeof event.state?.skyScroll === 'number' ? event.state.skyScroll : undefined;
      // Going back from a project, its title flies home to its row.
      const prepare = from.name === 'project' ? () => nameForTravel([[document.querySelector('[data-piece="title"]'), 'sky-title']]) : undefined;
      move(next, () => {}, prepare, saved);
    };
    addEventListener('popstate', pop);
    return () => removeEventListener('popstate', pop);
  }, [move]);

  return <SkyNav.Provider value={{ go, arrived, cameFrom }}>
    <div className={`sky${arrived ? '' : ' sky--moved'}`}>
      {route.name === 'project' ? <SkyProject key={route.id} id={route.id} /> : <SkyHome />}
    </div>
  </SkyNav.Provider>;
}
