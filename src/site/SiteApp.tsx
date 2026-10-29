import { lazy, Suspense } from 'react';
import type { Route } from './routes';

/* The site: the home page at /, a page per project at /projects/<id>, and a page for addresses that don't exist.
   Each is its own chunk, so a project page doesn't load the home page's motion and the other way round. The home and
   Dervo's page are in the cobalt look (src/site/cobalt); the other projects keep their pages for now. */

const Home = lazy(() => import('./cobalt/Home'));
const DervoPage = lazy(() => import('./cobalt/DervoPage'));
const WorkPage = lazy(() => import('./WorkPage'));
const NotFound = lazy(() => import('./NotFound'));

export default function SiteApp({ route }: { route: Route }) {
  return <Suspense fallback={null}>
    {route.name === 'home' ? <Home /> : route.name === 'project' ? route.id === 'dervo' ? <DervoPage /> : <WorkPage id={route.id} /> : <NotFound />}
  </Suspense>;
}
