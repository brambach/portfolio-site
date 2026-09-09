import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {QuietIdleLoader} from './prototype/QuietIdleLoader';
import {SiteAnalytics} from './lib/SiteAnalytics';

const Garage=lazy(()=>import('./admin/Garage'));
const showGarage=window.location.pathname.replace(/\/$/,'')==='/admin';
const ProjectLab=lazy(()=>import('./project-lab/ProjectLab.tsx'));
const showProjectLab=window.location.pathname.replace(/\/$/,'')==='/project-lab';
const ProjectReader = lazy(() => import('./prototype/ProjectReader.tsx'));
const showProjects = /^\/projects(?:\/|$)/.test(window.location.pathname);
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
    <Suspense fallback={<QuietIdleLoader />}>{showGarage?<Garage/>:showProjectLab?<ProjectLab/>:phoneReview?<div style={{padding:16,background:"#202520",minHeight:"100svh"}}><iframe title="Phone viewport review" src="/" style={{display:"block",border:0,width:phoneLandscape?660:390,height:phoneLandscape?390:660}}/></div>:drivingReview&&DrivingInputReview?<DrivingInputReview/>:lifecycleReview&&SceneLifecycleReview?<SceneLifecycleReview/>:showProjects ? <ProjectReader /> : showPrevious ? <PreviousSite /> : showPhotoEntrance ? <PhotoEntrance /> : <Entrance />}</Suspense>
  </StrictMode>,
);
