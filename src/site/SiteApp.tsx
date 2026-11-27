import { lazy, Suspense, type ComponentType } from 'react';
import { COMIC, HOME_PAGE, LOOK } from './look';
import { useSiteRoute } from './navigate';
import type { Route, StoryId, WorkId } from './routes';

/* The site: the home page at /, a page per project at /projects/<id>, and a page for addresses that don't exist.
   Each is its own chunk, so a project page doesn't load the home page's motion and the other way round. The home and
   Dervo's page wear the look named in look.ts: the pumpkin patch (src/site/patch) for Halloween, the dinner table
   (src/site/harvest) for Thanksgiving, the first snow (src/site/snow) for Christmas, or cobalt (src/site/cobalt), and so do the product pages (StoryPage, words in stories.ts). The other projects keep their pages
   for now, except Arro, which gets a product page in the black and white look. Moving between them happens in place
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
  home: page(() => LOOK === 'block' ? HOME_PAGE === 'scribble' ? import('./scribble/Home') : import('./block/Home') : LOOK === 'snow' ? import('./snow/Home') : LOOK === 'harvest' ? import('./harvest/Home') : LOOK === 'patch' ? import('./patch/Home') : import('./cobalt/Home')),
  dervo: page(() => COMIC ? import('./patch/DervoPage') : import('./cobalt/DervoPage')),
  story: page<{ id: StoryId }>(() => COMIC ? import('./patch/StoryPage') : import('./cobalt/StoryPage')),
  work: page<{ id: WorkId }>(() => import('./WorkPage')),
  arro: page<{ id: 'arro' }>(() => import('./cobalt/StoryPage')),
  teammate: page(() => import('./block/TeammatePage')),
  psyche: page(() => import('./block/PsychePage')),
  missing: page(() => import('./NotFound')),
};

/** The visitor's creature, along with them on every page but the home page (which has its own). */
const Buddy = lazy(() => import('./scribble/Companion'));
const BUDDY = LOOK === 'block' && HOME_PAGE === 'scribble';
const routeKey = (r: Route) => ('id' in r ? `${r.name}:${r.id}` : r.name);

const pageOf = (r: Route) => r.name === 'home' ? pages.home : r.name === 'story' ? pages.story : r.name === 'case' ? r.id === 'psyche' ? pages.psyche : pages.teammate : r.name === 'project' ? r.id === 'dervo' ? pages.dervo : r.id === 'arro' && LOOK === 'block' ? pages.arro : pages.work : pages.missing;

export default function SiteApp({ route: first }: { route: Route }) {
  const route = useSiteRoute(first, r => pageOf(r).fetch);
  const ArroPage = pages.arro.View, Home = pages.home.View, DervoPage = pages.dervo.View, StoryPage = pages.story.View, WorkPage = pages.work.View, TeammatePage = pages.teammate.View, PsychePage = pages.psyche.View, NotFound = pages.missing.View;
  return <Suspense fallback={null}>
    {BUDDY && route.name !== 'home' && route.name !== 'missing' && <Buddy key={routeKey(route)} />}
    {route.name === 'home' ? <Home /> : route.name === 'story' ? <StoryPage key={route.id} id={route.id} /> : route.name === 'case' ? route.id === 'psyche' ? <PsychePage /> : <TeammatePage /> : route.name === 'project' ? route.id === 'dervo' ? <DervoPage /> : route.id === 'arro' && LOOK === 'block' ? <ArroPage id="arro" /> : <WorkPage key={route.id} id={route.id} /> : <NotFound />}
  </Suspense>;
}
