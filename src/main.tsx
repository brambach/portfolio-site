import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {QuietIdleLoader} from './prototype/QuietIdleLoader';
import {SiteAnalytics} from './lib/SiteAnalytics';
import SiteApp from './site/SiteApp';
import {fromLab, siteRoute} from './site/routes';

const Garage=lazy(()=>import('./admin/Garage'));
const showGarage=window.location.pathname.replace(/\/$/,'')==='/admin';
const ProjectLab=lazy(()=>import('./project-lab/ProjectLab.tsx'));
const showProjectLab=window.location.pathname.replace(/\/$/,'')==='/project-lab';
// The site is / and /projects/<id>, plus a not-found page for anything it doesn't know (see src/site/routes.ts).
// The older pages it still links to keep their addresses: the road at /work (and /?mile=<id>), the 3D drive at
// /drive with its old links (/?town and friends), and the quiet index at /next.
// The motion lab's addresses (/lab and under it) moved to the site. vercel.json redirects them; this does the same
// wherever that doesn't run.
const labMoved = fromLab(window.location.pathname);
if (labMoved) window.location.replace(labMoved + window.location.search + window.location.hash);
// /projects on its own was the paper collection; the list is on the home page now.
const toHome = !labMoved && window.location.pathname.replace(/\/$/, '') === '/projects';
if (toHome) window.location.replace('/' + window.location.search + '#work');
// The host serves 404.html, which says so, for any address it doesn't know.
const route = (window as Window & { __notFound?: boolean }).__notFound ? { name: 'missing' as const }
  : labMoved || toHome ? null : siteRoute(window.location.pathname, window.location.search);
const path = window.location.pathname.replace(/\/$/, '');
const search = new URLSearchParams(window.location.search);
const SimplePortfolio = lazy(() => import('./projects/SimplePortfolio.tsx'));
const showWork = path === '/work' || (path === '' && search.has('mile'));
const QuietIndex = lazy(() => import('./projects/QuietIndex.tsx'));
const showQuiet = path === '/next';
const Entrance = lazy(() => import('./prototype/Entrance.tsx'));
const PhotoEntrance = lazy(() => import('./prototype/PhotoEntrance.tsx'));
const PreviousSite = lazy(() => import('./App.tsx'));
const showPrevious = window.location.pathname.replace(/\/$/, '') === '/previous';
const showPhotoEntrance = window.location.pathname.replace(/\/$/, '') === '/entrance-still';
const SceneLifecycleReview=import.meta.env.DEV?lazy(()=>import('./prototype/SceneLifecycleReview.tsx')):null;
const lifecycleReview=import.meta.env.DEV&&new URLSearchParams(location.search).has('lifecycle')&&new URLSearchParams(location.search).has('profile');
const DrivingInputReview=import.meta.env.DEV?lazy(()=>import('./prototype/DrivingInputReview.tsx')):null;
const phoneReview=import.meta.env.DEV&&new URLSearchParams(location.search).has('phoneReview');
const phoneLandscape=phoneReview&&new URLSearchParams(location.search).get('phoneReview')==='landscape';
const drivingReview=import.meta.env.DEV&&new URLSearchParams(location.search).has('drivingReview');

const appRoot=createRoot(document.getElementById('root')!);
if(import.meta.hot){
  import.meta.hot.accept();
  import.meta.hot.dispose(()=>appRoot.unmount());
}

appRoot.render(
  <StrictMode>
    <SiteAnalytics/>
    {route&&!phoneReview&&!drivingReview&&!lifecycleReview?<SiteApp route={route}/>:<Suspense fallback={labMoved||toHome?null:<QuietIdleLoader />}>{labMoved||toHome?null:showGarage?<Garage/>:showProjectLab?<ProjectLab/>:phoneReview?<div style={{padding:16,background:"#202520",minHeight:"100svh"}}><iframe title="Phone viewport review" src="/drive" style={{display:"block",border:0,width:phoneLandscape?660:390,height:phoneLandscape?390:660}}/></div>:drivingReview&&DrivingInputReview?<DrivingInputReview/>:lifecycleReview&&SceneLifecycleReview?<SceneLifecycleReview/>:showQuiet ? <QuietIndex /> : showWork ? <SimplePortfolio /> : showPrevious ? <PreviousSite /> : showPhotoEntrance ? <PhotoEntrance /> : <Entrance />}</Suspense>}
  </StrictMode>,
);
