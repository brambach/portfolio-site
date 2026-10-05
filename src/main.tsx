import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {QuietIdleLoader} from './prototype/QuietIdleLoader';
import {SiteAnalytics} from './lib/SiteAnalytics';
import {isSkyPath} from './sky/routes';

const Garage=lazy(()=>import('./admin/Garage'));
const showGarage=window.location.pathname.replace(/\/$/,'')==='/admin';
const ProjectLab=lazy(()=>import('./project-lab/ProjectLab.tsx'));
const showProjectLab=window.location.pathname.replace(/\/$/,'')==='/project-lab';
// The sky site is the front door: / and /projects/<id> (see src/sky/routes.ts). The road lives at /work (and
// /?mile=<id>, where old study links come back to it), the 3D drive at /drive with its old links (/?town and
// friends) still opening it, and the quiet index at /next, whose ?look= links keep the old studies.
const SkyApp = lazy(() => import('./sky/SkyApp.tsx'));
const showSky = isSkyPath(window.location.pathname, window.location.search);
const ProjectReader = lazy(() => import('./prototype/ProjectReader.tsx'));
const path = window.location.pathname.replace(/\/$/, '');
const search = new URLSearchParams(window.location.search);
// /projects on its own was the paper collection; the list is on the home page now.
const toHome = path === '/projects' && !search.has('look');
if (toHome) window.location.replace('/#work');
const showProjects = !showSky && !toHome && /^\/projects(?:\/|$)/.test(window.location.pathname);
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
    <Suspense fallback={showSky?null:<QuietIdleLoader />}>{toHome?null:showSky&&!phoneReview&&!drivingReview&&!lifecycleReview?<SkyApp/>:showGarage?<Garage/>:showProjectLab?<ProjectLab/>:phoneReview?<div style={{padding:16,background:"#202520",minHeight:"100svh"}}><iframe title="Phone viewport review" src="/drive" style={{display:"block",border:0,width:phoneLandscape?660:390,height:phoneLandscape?390:660}}/></div>:drivingReview&&DrivingInputReview?<DrivingInputReview/>:lifecycleReview&&SceneLifecycleReview?<SceneLifecycleReview/>:showProjects ? <ProjectReader /> : showQuiet ? <QuietIndex /> : showWork ? <SimplePortfolio /> : showPrevious ? <PreviousSite /> : showPhotoEntrance ? <PhotoEntrance /> : <Entrance />}</Suspense>
  </StrictMode>,
);
