import {useStudyReveal} from './useStudyReveal';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { projects, type Project, type ProjectId } from './catalog';
import './projects.css';

const LucidStudy = lazy(() => import('./LucidStudy'));
const PortalStudy = lazy(() => import('./PortalStudy'));
const DervoStudy = lazy(() => import('./DervoStudy'));
const ArroStudy = lazy(() => import('./ArroStudy'));
const PortStudy = lazy(() => import('./PortStudy'));
const AgentSky = lazy(() => import('../project-lab/ProjectLab').then(module => ({default:module.Screening})));

export function ProjectViewer({project,close,choose}:{project:Project;close:()=>void;choose:(id:ProjectId)=>void}) {
  const prior=useRef(document.activeElement as HTMLElement|null);
  const dialog=useRef<HTMLDialogElement>(null);
  const content=useRef<HTMLDivElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  useStudyReveal(content,project.id);
  const next=projects[(projects.indexOf(project)+1)%projects.length];
  useEffect(()=>{
    const overflow=document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow='hidden';
    closeButton.current?.focus({preventScroll:true});
    return ()=>{document.body.style.overflow=overflow;requestAnimationFrame(()=>{if(prior.current?.isConnected)prior.current.focus({preventScroll:true});});};
  },[]);
  useEffect(()=>{
    const title=document.title;
    document.title=`${project.name} / Bryce Rambach`;
    content.current?.scrollTo?.({top:0});
    closeButton.current?.focus({preventScroll:true});
    return ()=>{document.title=title;};
  },[project.id,project.name]);
  return createPortal(<dialog ref={dialog} className={`ps-viewer pl-root ${project.id==='agentsky'?'pl-root--screening':''}`} aria-label={`${project.name} project`} onKeyDown={event=>event.stopPropagation()} onCancel={event=>{event.preventDefault();event.stopPropagation();close();}}>
    <nav className="ps-viewer__nav" aria-label="Project navigation"><button ref={closeButton} onClick={close}>← All projects</button><span>{String(projects.indexOf(project)+1).padStart(2,'0')} / 06 <b>{project.name}</b></span><a href={`/projects/${project.id}`} aria-label={`Direct link to ${project.name}`}>Direct link</a></nav>
    <div ref={content} className="ps-viewer__scroll" key={project.id}>
      <Suspense fallback={<div className="ps-opening" role="status">Opening {project.name}…</div>}>
        {project.id==='agentsky'?<AgentSky/>:project.id==='port'?<PortStudy/>:project.id==='dervo'?<DervoStudy/>:project.id==='arro'?<ArroStudy/>:project.id==='lucid'?<LucidStudy/>:<PortalStudy/>}
      </Suspense>
      <button className="ps-next" onClick={()=>choose(next.id)}><span className="ps-eyebrow">Next project</span><strong>{next.name}</strong><span aria-hidden="true">+</span></button>
    </div>
  </dialog>,document.body);
}
