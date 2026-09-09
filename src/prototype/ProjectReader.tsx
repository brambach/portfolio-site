import { useEffect, useRef, useState } from 'react';
import { ProjectCollection } from '../projects/ProjectCollection';
import { ProjectViewer } from '../projects/ProjectViewer';
import { projectFromPath, type ProjectId } from '../projects/catalog';

export default function ProjectReader() {
  const [project,setProject]=useState(projectFromPath);
  const [selected,setSelected]=useState<ProjectId|undefined>(project?.id);
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    const change=()=>setProject(projectFromPath());
    window.addEventListener('popstate',change);
    return ()=>window.removeEventListener('popstate',change);
  },[]);
  useEffect(()=>{
    if(project)setSelected(project.id);
    else if(selected)requestAnimationFrame(()=>{const cover=root.current?.querySelector<HTMLAnchorElement>(`[data-project="${selected}"]`);cover?.focus({preventScroll:true});cover?.scrollIntoView?.({block:'nearest',inline:'nearest'});});
  },[project,selected]);
  const open=(id:ProjectId)=>{
    const path=`/projects/${id}`;
    if(project)history.replaceState(history.state,'',path);
    else history.pushState({portfolioViewer:true},'',path);
    setProject(projectFromPath());
  };
  const close=()=>{
    if(history.state?.portfolioViewer)history.back();
    else {history.replaceState(null,'','/projects');setProject(undefined);}
  };
  return <main ref={root} className="ps-page" aria-label="Bryce Rambach's portfolio">
    <header className="ps-page__nav"><a href="/">← Back to the Porsche</a><span>Bryce Rambach</span><a href="mailto:bryce.rambach@gmail.com">Say hello ↗</a></header>
    <ProjectCollection open={open} selected={selected}/>
    {project&&<ProjectViewer project={project} close={close} choose={open}/>}
  </main>;
}
