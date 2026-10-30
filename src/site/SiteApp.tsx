import { lazy, Suspense, type ComponentType } from 'react';
import { LOOK } from './look';
import { useSiteRoute } from './navigate';
import type { Route, WorkId } from './routes';

/* The site: the home page at /, a page per project at /projects/<id>, and a page for addresses that don't exist.
   Each is its own chunk, so a project page doesn't load the home page's motion and the other way round. The home and
   Dervo's page wear the look named in look.ts: the pumpkin patch (src/site/patch) for Halloween, or cobalt
   (src/site/cobalt). The other projects keep their pages for now. Moving between them happens in place
   (navigate.ts), so the Dervo picture can grow into its page. */

/** A page in its own chunk. Once fetched it renders straight away, not through Suspense, so a page swapped in during
 *  a view transition is on screen in the same frame and has its picture there to hand over to. */
function page<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let ready: ComponentType<P> | undefined;
  const fetch = () => load().then(m => { ready = m.default; });
  const Lazy = lazy(load);
  return { fetch, get View() { return ready ?? Lazy; } };
}

const pages = {
  home: page(() => LOOK === 'patch' ? import('./patch/Home') : import('./cobalt/Home')),
  dervo: page(() => LOOK === 'patch' ? import('./patch/DervoPage') : import('./cobalt/DervoPage')),
  work: page<{ id: WorkId }>(() => import('./WorkPage')),
  missing: page(() => import('./NotFound')),
};

const pageOf = (r: Route) => r.name === 'home' ? pages.home : r.name === 'project' ? r.id === 'dervo' ? pages.dervo : pages.work : pages.missing;

export default function SiteApp({ route: first }: { route: Route }) {
  const route = useSiteRoute(first, r => pageOf(r).fetch);
  const Home = pages.home.View, DervoPage = pages.dervo.View, WorkPage = pages.work.View, NotFound = pages.missing.View;
  return <Suspense fallback={null}>
    {route.name === 'home' ? <Home /> : route.name === 'project' ? route.id === 'dervo' ? <DervoPage /> : <WorkPage key={route.id} id={route.id} /> : <NotFound />}
  </Suspense>;
}
