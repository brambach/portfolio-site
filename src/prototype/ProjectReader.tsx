import { useEffect, useRef, useState } from 'react';
import { ProjectCollection } from '../projects/ProjectCollection';
import { ProjectViewer } from '../projects/ProjectViewer';
import { projectFromPath, type ProjectId } from '../projects/catalog';
import { LOOK_BG, lookQuery, readLook, useSentient, useThemeColor } from '../projects/look';

export default function ProjectReader() {
  // The project pages wear the road's paper look. Opened from /next they carry ?look= and wear its
  // night look instead, and their links keep that choice along.
  const [look]=useState(readLook);
  const search=lookQuery(look);
  useSentient(!!look);
  useThemeColor(look?LOOK_BG[look]:'#F2EBDD');
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
  return <main ref={root} className="ps-page" data-look={look??undefined} aria-label="Bryce Rambach's portfolio">
    <header className="ps-page__nav">{look?<a className="ink-link" href={`/next${search}`}>← Back home</a>:<a className="ink-link" href={selected?`/?mile=${selected}`:'/'}>← Back to the road</a>}<span>Bryce Rambach</span><a className="ink-link" href="mailto:bryce.rambach@gmail.com">Say hello ↗</a></header>
    <ProjectCollection open={open} selected={selected} search={search}/>
    {project&&<ProjectViewer project={project} close={close} choose={open} look={look} search={search}/>}
  </main>;
}
