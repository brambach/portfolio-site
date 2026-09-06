import { useEffect, useRef, useState } from 'react';
import { projects } from '../lib/site';

const notes: Record<string, string> = {
  AgentSky: 'An independent homepage concept with three interactive demonstrations: an agent session, a local-to-cloud workspace transfer and sample output comparisons. Built with React, TypeScript and Motion. Runs and outputs are simulated.',
  arro: 'A running streak with my family. A small, shared ritual that gives us a reason to keep showing up. Built with React Native.',
  trace: 'A local prototype for finding the context left behind in coding sessions. Trace reads Claude Code session files into SQLite, with a dashboard for searching prompts, reviewing projects and spotting patterns. Built with TypeScript and Next.js.',
  throughline: 'An experiment in turning the work happening across Slack and GitHub into a readable story.',
  'bryce-os': 'An operating system for exactly one person. Personal tools and watchers, built around the way I work.',
};

function FolderIcon() {
  return <svg viewBox="0 0 32 28" fill="none" aria-hidden="true"><path d="M2 7V3h10l4 4h14v18H2V7Z" fill="#b4a074" stroke="#756549"/><path d="M2 9h28v16H2z" fill="#d2be90" stroke="#756549"/></svg>;
}

export function ProjectLaptop({ close, active = true, embedded = false, closeLabel }: { closeLabel?: string; close?: () => void; active?: boolean; embedded?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastSelected = useRef<string | null>(null);
  const project = projects.find(p => p.name === selected);
  useEffect(() => {
    if (active && embedded) closeRef.current?.focus({ preventScroll: true });
  }, [active, embedded]);
  useEffect(() => {
    const body=bodyRef.current;
    if(!active||!embedded||!body||typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(()=>{
      const focused=document.activeElement;
      if(focused instanceof HTMLElement&&body.contains(focused)&&focused.matches('a,button,input,select,textarea')){
        focused.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      }
    });
    observer.observe(body);
    return()=>observer.disconnect();
  },[active,embedded]);
  useEffect(() => {
    if (!active) return;
    if (selected) articleRef.current?.focus({ preventScroll: true });
    else if (lastSelected.current) root.current?.querySelector<HTMLButtonElement>(`button[data-project="${lastSelected.current}"]`)?.focus({ preventScroll: true });
    bodyRef.current?.scrollTo?.({top:0});
  }, [selected, active]);
  function back() {
    setSelected(null);
  }
  return <div ref={root} className={`laptop-os ${embedded ? 'laptop-os--embedded' : ''}`} role={embedded ? 'dialog' : undefined} aria-label={embedded ? 'Project laptop' : undefined} onKeyDown={event => {
    if (event.key === 'Escape' && (close || selected)) { event.preventDefault(); event.stopPropagation(); if(close)close();else back(); }
  }}>
    <header className="laptop-os__bar">
      <span className="laptop-os__owner">Bryce Rambach</span>
      {close&&<button ref={closeRef} onClick={close} aria-label={closeLabel ?? (embedded ? 'Close laptop and return to seat' : 'Put down object')} title="Close">{closeLabel ?? <span aria-hidden="true">×</span>}</button>}
    </header>
    <div className="laptop-os__path"><FolderIcon/><span>personal <span aria-hidden="true">/</span> projects {project && <><span aria-hidden="true">/</span> {project.name}</>}</span></div>
    <div ref={bodyRef} className="laptop-os__body">
      {project ? <article ref={articleRef} tabIndex={-1} className="laptop-os__note" aria-label={`${project.name} project notes`}>
        <button className="laptop-os__back" onClick={back}>← All projects</button>
        <div className="laptop-os__project-heading"><FolderIcon/><h1>{project.name}</h1></div>
        <p className="laptop-os__tag">{project.tag}</p>
        <p>{notes[project.name]}</p>
        {project.studyHref&&<a className="laptop-os__source" href={project.studyHref} target={embedded?'_blank':undefined} rel={embedded?'noopener noreferrer':undefined} aria-label={embedded?'Read the design study (opens in a new tab)':undefined}>Read the design study ↗</a>}
        {project.sourceHref&&<a className="laptop-os__source" href={project.sourceHref} target="_blank" rel="noreferrer">View source on GitHub ↗</a>}
      </article> : <div className="laptop-os__collection">
        <div className="laptop-os__intro"><h1>Projects</h1><span>{String(projects.length).padStart(2,'0')} folders</span></div>
        <div className="laptop-os__files">{projects.map(p => <button aria-label={`${p.name}: ${p.oneLiner}`} data-project={p.name} key={p.name} onClick={() => { lastSelected.current = p.name; setSelected(p.name); }}>
          <FolderIcon/><span><strong>{p.name}</strong><span>{p.oneLiner}</span></span><span className="laptop-os__stack">{p.tag}</span><span className="laptop-os__arrow" aria-hidden="true">›</span>
        </button>)}</div>
      </div>}
    </div>
    <footer className="laptop-os__footer"><span>{project ? 'Project notes' : 'Personal projects'}</span><span>{project ? '1 folder open' : `${projects.length} folders`}</span></footer>
  </div>;
}
