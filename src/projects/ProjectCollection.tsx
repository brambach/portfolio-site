import {useId, useRef} from 'react';
import {useStudyReveal} from './useStudyReveal';
import { projects, archive, type ArchiveItem, type Project, type ProjectId } from './catalog';
import './projects.css';
import { ArchiveClip } from './ArchiveClip';

export function ProjectCover({project}:{project:Project}) {
  return <div className={`ps-cover ps-cover--${project.id}`} aria-hidden="true">
    {project.id === 'agentsky' && <img src="/project-lab/sky.png" alt=""/>}
    {project.id === 'dervo' && <img className="ps-cover__product" src="/projects/dervo/decision.png" alt="" loading="lazy"/>}
    {project.id === 'lucid' && <img className="ps-cover__product" src="/projects/lucid/spec.png" alt="" loading="lazy"/>}
    {project.id === 'arro' && <img className="ps-cover__product" src="/projects/arro/today-sample.png" alt="" loading="lazy"/>}
    {project.id === 'port' && <div className="ps-port-line"/>}
    {project.id === 'integration-portal' && <img className="ps-cover__product" src="/projects/portal/hub.png" alt="" loading="lazy"/>}
    <strong>{project.name}</strong><span className="ps-cover__line">{project.line}</span><span className="ps-cover__open">Open study</span>
  </div>;
}
export function getArchiveAvailabilityLabel(items: ArchiveItem[]) {
  const recordings = items.filter(item => item.availability === 'recording' && item.recordingId).length;
  return `${recordings} recordings, ${items.length - recordings} source or concept notes`;
}
export function ProjectCollection({open,compact=false,selected,archiveItems=archive}:{open:(id:ProjectId)=>void;compact?:boolean;selected?:ProjectId;archiveItems?:ArchiveItem[]}) {
  const root=useRef<HTMLDivElement>(null);
  const idPrefix=useId().replace(/:/g,'');
  useStudyReveal(root,'collection');
  return <div ref={root} className={`ps-collection ${compact?'ps-collection--compact':''}`}>
    <header className="ps-collection__intro"><div><span className="ps-eyebrow">Selected work / 01 / 06</span><h1>Things I’ve<br/><em>put into the world.</em></h1></div><p>Interfaces, systems and small rituals.<br/>Designed and built by Bryce Rambach.</p></header>
    <div className="ps-grid">{projects.map((project,i)=><a className="ps-project" key={project.id} href={`/projects/${project.id}`} data-project={project.id} aria-label={`View ${project.name}`} aria-current={selected===project.id?'true':undefined} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();open(project.id);}}><ProjectCover project={project}/><div className="ps-project__caption"><span>0{i+1}</span><div><h2>{project.name}</h2><p>{project.category}</p></div><span className="ps-cover-tab" aria-hidden="true">+</span></div></a>)}</div>
    <details className="ps-archive"><summary><span>From the archive <small>{archiveItems.length} more projects & studies</small><small>{getArchiveAvailabilityLabel(archiveItems)}</small></span><span aria-hidden="true">+</span></summary><div className="ps-archive__intro">Earlier work, useful experiments and things worth keeping. Each entry says what survives.</div><div className="ps-archive__items">{archiveItems.map(item=>{const headingId=`${idPrefix}-archive-${item.name.replace(/\W+/g,'-').toLowerCase()}`;return <article key={item.name} aria-labelledby={headingId}><span className="ps-eyebrow">{item.kind}</span><h3 id={headingId}>{item.name}</h3><p>{item.text}</p>{item.availability==='recording'&&item.recordingId&&<ArchiveClip id={item.recordingId} name={item.name}/>}</article>;})}</div><p className="ps-archive__foot">Also found: historical workspace names for a Unity game and an OTP Reuse Detector. Implementation and authorship weren’t recovered, so they aren’t presented as completed projects.</p></details>
    <footer className="ps-collection__footer"><span>Design that explains itself.<br/>Software you can feel.</span><a href="mailto:bryce.rambach@gmail.com">Say hello</a></footer>
  </div>;
}
