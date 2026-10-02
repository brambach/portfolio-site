import { useEffect, useRef, useState } from 'react';
import { ProjectCollection } from '../projects/ProjectCollection';
import { ProjectViewer } from '../projects/ProjectViewer';
import { projectFromPath, type ProjectId } from '../projects/catalog';
import { DEFAULT_LOOK, LOOK_BG, lookQuery, readLook, useSentient, useThemeColor } from '../projects/look';

export default function ProjectReader() {
  // The project pages wear the home page's night look. ?look=ink or ?look=bone picks another, and the
  // links between pages carry an explicit choice along.
  const [asked]=useState(readLook);
  const look=asked??DEFAULT_LOOK;
  const search=lookQuery(asked);
  useSentient();
  useThemeColor(LOOK_BG[look]);
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
    const path=`/projects/${id}${search}`;
    if(project)history.replaceState(history.state,'',path);
    else history.pushState({portfolioViewer:true},'',path);
    setProject(projectFromPath());
  };
  const close=()=>{
    if(history.state?.portfolioViewer)history.back();
    else {history.replaceState(null,'',`/projects${search}`);setProject(undefined);}
  };
  return <main ref={root} className="ps-page" data-look={look} aria-label="Bryce Rambach's portfolio">
    <header className="ps-page__nav"><a className="ink-link" href={`/${search}`}>← Back home</a><span>Bryce Rambach</span><a className="ink-link" href="mailto:bryce.rambach@gmail.com">Say hello ↗</a></header>
    <ProjectCollection open={open} selected={selected} search={search}/>
    {project&&<ProjectViewer project={project} close={close} choose={open} look={look} search={search}/>}
  </main>;
}
