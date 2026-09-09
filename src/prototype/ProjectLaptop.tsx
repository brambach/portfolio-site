import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProjectCollection } from '../projects/ProjectCollection';
import { ProjectViewer } from '../projects/ProjectViewer';
import { projectById, type ProjectId } from '../projects/catalog';
import './project-laptop.css';

export function ProjectLaptop({close,active=true,embedded=false,closeLabel}:{close?:()=>void;active?:boolean;embedded?:boolean;closeLabel?:string}) {
  const [selected,setSelected]=useState<ProjectId>();
  const [viewing,setViewing]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const bodyRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const expandRef=useRef<HTMLButtonElement>(null);
  const expandedDialog=useRef<HTMLDialogElement>(null);
  const expandedClose=useRef<HTMLButtonElement>(null);
  const canRestoreExpandFocus=useRef(false);
  const project=projectById(selected||null);
  canRestoreExpandFocus.current=active&&embedded;
  useEffect(()=>{if(active&&embedded)closeRef.current?.focus({preventScroll:true});if(!active){setViewing(false);setExpanded(false);}},[active,embedded]);
  useEffect(()=>{
    if(!expanded)return;
    const dialog=expandedDialog.current;
    dialog?.showModal();
    expandedClose.current?.focus({preventScroll:true});
    return()=>{dialog?.close();requestAnimationFrame(()=>{if(canRestoreExpandFocus.current&&expandRef.current?.isConnected)expandRef.current.focus({preventScroll:true});});};
  },[expanded]);
  useEffect(()=>{
    const body=bodyRef.current;
    if(!active||!embedded||!body||typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(()=>{
      const focused=document.activeElement;
      if(focused instanceof HTMLElement&&body.contains(focused)&&focused.matches('a,button,input,select,textarea'))focused.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    });
    observer.observe(body);
    return()=>observer.disconnect();
  },[active,embedded]);
  const open=(id:ProjectId)=>{setSelected(id);setViewing(true);};
  const focusCover=()=>requestAnimationFrame(()=>{const scope=expanded?expandedDialog.current:root.current;const cover=scope?.querySelector<HTMLAnchorElement>(`[data-project="${selected}"]`);cover?.focus({preventScroll:true});cover?.scrollIntoView?.({block:'nearest',inline:'nearest'});});
  const back=()=>{setViewing(false);focusCover();};
  const closeExpanded=()=>{setExpanded(false);setViewing(false);};
  const showExpandAction=embedded&&active&&!expanded&&!viewing;
  return <div ref={root} className={`ps-laptop ${embedded?'ps-laptop--embedded':''}`} role={embedded?'dialog':undefined} aria-label={embedded?'Project laptop':undefined} {...(expanded?{inert:true}:{})} onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(viewing)back();else close?.();}}}>
    <header className="ps-laptop__bar"><span>Bryce Rambach <span>/ Selected work</span></span>{close&&<button ref={closeRef} onClick={close} aria-label={closeLabel??(embedded?'Close laptop and return to seat':'Put down object')}>{closeLabel??'Close ×'}</button>}</header>
    <div ref={bodyRef} className="ps-laptop__body"><ProjectCollection compact open={open} selected={selected}/></div>
    {showExpandAction&&createPortal(<div className="ps-laptop-action"><button ref={expandRef} className="ps-laptop__expand" onClick={()=>setExpanded(true)}>Open full-size collection</button></div>,document.body)}
    {embedded&&expanded&&createPortal(<dialog ref={expandedDialog} className="ps-laptop-full ps-page" aria-label="Full-size project collection" onCancel={event=>{event.preventDefault();event.stopPropagation();closeExpanded();}} onKeyDown={event=>event.stopPropagation()}>
      <header className="ps-laptop-full__bar"><span>Bryce Rambach / Selected work</span><button ref={expandedClose} onClick={closeExpanded}>Back to laptop</button></header>
      <div className="ps-laptop-full__body"><ProjectCollection open={open} selected={selected}/></div>
    </dialog>,document.body)}
    {viewing&&project&&<ProjectViewer project={project} close={back} choose={open}/>}
  </div>;
}
