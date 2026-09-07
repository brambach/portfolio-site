import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {SiteAnalytics} from './lib/SiteAnalytics';

const AgentSkyProject=lazy(()=>import('./prototype/AgentSkyProject.tsx'));
const showAgentSky=window.location.pathname.replace(/\/$/,'')==='/projects/agentsky';
const ProjectReader = lazy(() => import('./prototype/ProjectReader.tsx'));
const showProjects = window.location.pathname.replace(/\/$/, '') === '/projects';
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
    <Suspense fallback={<div style={{ background: '#24291d', minHeight: '100svh' }} />}>{showAgentSky?<AgentSkyProject/>:phoneReview?<div style={{padding:16,background:"#202520",minHeight:"100svh"}}><iframe title="Phone viewport review" src="/" style={{display:"block",border:0,width:phoneLandscape?660:390,height:phoneLandscape?390:660}}/></div>:drivingReview&&DrivingInputReview?<DrivingInputReview/>:lifecycleReview&&SceneLifecycleReview?<SceneLifecycleReview/>:showProjects ? <ProjectReader /> : showPrevious ? <PreviousSite /> : showPhotoEntrance ? <PhotoEntrance /> : <Entrance />}</Suspense>
  </StrictMode>,
);
