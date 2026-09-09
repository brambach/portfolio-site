import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { flushSync } from 'react-dom';
import './project-lab.css';

type Direction = 'screening' | 'playable' | 'archive';
const directions: {id:Direction; name:string; caption:string; number:string}[] = [
  {id:'screening',name:'The screening room',caption:'Watch the work unfold.',number:'01'},
  {id:'playable',name:'The playable collection',caption:'Get your hands on it.',number:'02'},
  {id:'archive',name:'The designer’s archive',caption:'See what went into it.',number:'03'},
];
const asset = (name:string) => `/project-lab/${name}`;
function CloudMark() { return <svg viewBox="0 0 40 28" fill="none" aria-hidden="true"><path d="M11 24h19a8 8 0 0 0 0-16h-2A11 11 0 0 0 7 10a7 7 0 0 0 4 14Z" stroke="currentColor" strokeWidth="2" /></svg>; }

function Modal({title,close,children,wide=false}:{title:string;close:()=>void;children:ReactNode;wide?:boolean}) {
  const prior=useRef(document.activeElement as HTMLElement);
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    ref.current?.showModal();
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=previous;requestAnimationFrame(()=>{if(prior.current?.isConnected)prior.current.focus({preventScroll:true});});};
  },[]);
  return <dialog ref={ref} className={`pl-modal ${wide?'pl-modal--wide':''}`} aria-label={title} onKeyDown={e=>{if(e.key==='Escape')e.stopPropagation();}} onCancel={e=>{e.preventDefault();e.stopPropagation();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
    <div className="pl-modal__bar"><span>{title}</span><button onClick={close} aria-label={`Close ${title}`}>Close <span aria-hidden="true">×</span></button></div>{children}
  </dialog>;
}

function SampleOutput(){const [filter,setFilter]=useState('All updates');return <div className="pl-output">
  <span className="pl-kicker">Illustrative output / changelog</span><h2>Good things.<br/>Just shipped.</h2><p>A sample release page from the AgentSky concept.</p>
  <div className="pl-output__filters" aria-label="Filter sample releases">{['All updates','Features','Fixes'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
  {[{type:'Features',title:'Your workspace, everywhere.',body:'Pick up the same sample session after closing the local window.',date:'SEP 05'}, {type:'Fixes',title:'A little less friction.',body:'A clearer file list and keyboard access to every preview.',date:'SEP 02'}].filter(r=>filter==='All updates'||filter===r.type).map(r=><article key={r.title}><span>{r.date} / {r.type}</span><h3>{r.title}</h3><p>{r.body}</p></article>)}
  </div>;}

function Playground(){
  const [agent,setAgent]=useState(0);const [phase,setPhase]=useState(0);const [cloud,setCloud]=useState(false);const [offline,setOffline]=useState(false);const [inspect,setInspect]=useState(false);
  const reduced=useReducedMotion();const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  useEffect(()=>()=>clear(),[]);
  const choose=(i:number)=>{clear();setAgent(i);setPhase(0);setCloud(false);setOffline(false);};
  const run=()=>{clear();setPhase(1);setCloud(false);setOffline(false);timers.current=[2,3].map((n,i)=>setTimeout(()=>setPhase(n),reduced?40*(i+1):950*(i+1)));};
  const agents=['Claude Code','Codex','Hermes'];
  return <div className="pl-playground">
    <div className="pl-playground__bar"><span><CloudMark/> AgentSky <b>/</b> Playground</span><span className="pl-session-state" role="status">{phase===0?'Ready when you are':phase===3?(offline?'Local closed · cloud available':cloud?'Workspace in the cloud':'Sample build complete'):'Running sample sequence'}</span></div>
    <div className="pl-playground__body">
      <aside className="pl-agents"><span className="pl-kicker">01 / Choose your agent</span>{agents.map((a,i)=><button key={a} onClick={()=>choose(i)} aria-pressed={agent===i}><span className={`pl-agent-mark pl-agent-mark--${i}`}>{['✳','>_','H'][i]}</span><span>{a}<small>{['Coding assistant','Coding agent','Agent framework'][i]}</small></span><span className="pl-agent-check">{agent===i?'↗':'+'}</span></button>)}<p>Change the agent.<br/>Keep the same intention.</p></aside>
      <section className="pl-request"><span className="pl-kicker">02 / The brief</span><h3>Build a product<br/>changelog.</h3><p>Clear release notes. Filterable updates.<br/>A layout that works on mobile.</p><div className="pl-request__meta"><span>my-next-idea</span><span>React</span></div><button className="pl-primary" disabled={phase>0&&phase<3} onClick={run}>{phase===0?'Run the demo':phase<3?'Building sample…':'Run again'}<span aria-hidden="true">↗</span></button></section>
      <section className="pl-run"><span className="pl-kicker">03 / Watch it happen</span><ol>{['Prepare the workspace','Build the interface','Preview the result'].map((s,i)=><li key={s} className={phase>i?'is-done':''}><span>{phase>i?'✓':`0${i+1}`}</span><div>{s}<small>{phase>i?['Sample session opened',`${agents[agent]} · illustrative run`,'Three sample files ready'][i]:'Waiting'}</small></div></li>)}</ol>
        {phase===3?<div className="pl-ready">{cloud&&<div className="pl-cloud-receipt"><CloudMark/><span>my-next-idea<small>{offline?'Local session closed. Three sample files retained.':'Sample workspace available in both windows.'}</small></span></div>}<button onClick={()=>setInspect(true)}>Inspect the output <span aria-hidden="true">↗</span></button><button className="pl-cloud-action" onClick={()=>{if(!cloud)setCloud(true);else setOffline(v=>!v);}}>{!cloud?'Move workspace to cloud':offline?'Reopen local session':'Close local session'}</button></div>:<div className="pl-result-placeholder"><span aria-hidden="true">⌁</span><span>Your result will appear here.</span></div>}
      </section>
    </div><div className="pl-playground__foot"><span>Illustrative demo. No agents or cloud services are executed.</span><span>Try it. Reset it. Change your mind.</span></div>
    {inspect&&<Modal title="Sample changelog" close={()=>setInspect(false)}><SampleOutput/></Modal>}
  </div>;
}

export function Screening(){const [film,setFilm]=useState(false);const [tryIt,setTryIt]=useState(false);const video=useRef<HTMLVideoElement>(null);const [chapter,setChapter]=useState(0);
  useEffect(()=>{if(!film)return;const element=video.current;const pause=()=>{if(document.hidden)element?.pause();};document.addEventListener('visibilitychange',pause);return()=>{document.removeEventListener('visibilitychange',pause);element?.pause();element?.removeAttribute('src');element?.load();};},[film]);
  return <div className="pl-cinema"><section className="pl-cinema__hero"><img className="pl-cinema__sky" src={asset('sky.png')} alt=""/><div className="pl-cinema__type"><span className="pl-kicker">Independent design study / 2026</span><h1 tabIndex={-1}>AgentSky<span>A little closer<br/>to the cloud.</span></h1><div className="pl-cinema__actions"><button onClick={()=>setFilm(true)}><span className="pl-play-icon" aria-hidden="true">▶</span> Watch the film <small>00:33</small></button><button onClick={()=>setTryIt(true)}>Try the interaction <span aria-hidden="true">↗</span></button></div><p className="pl-sample-note">Recorded from an illustrative prototype. AgentSky’s service and agent execution aren't connected.</p></div><div className="pl-cinema__bottom"><span>Design & development<br/>Bryce Rambach</span><span>One request.<br/>An entire workspace.</span><a href="#cinema-story" onClick={e=>{e.preventDefault();document.getElementById('cinema-story')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}>Explore the study ↓</a></div></section>
    <section className="pl-cinema__story" id="cinema-story"><span className="pl-kicker">Behind the interface</span><h2>Make something<br/>invisible feel tangible.</h2><p>Cloud agents are hard to explain in a sentence. This independent concept gives them a workspace you can follow: choose an agent, move the session, inspect what comes back.</p><img src={asset('hero.png')} alt="AgentSky concept showing agent selection and a sample session" loading="lazy"/><div className="pl-cinema__credits"><span>Interface design<br/>Interactive frontend<br/>Motion direction</span><p>Recorded from an illustrative prototype. AgentSky’s service and agent execution aren't connected.</p></div></section>
    {film&&<Modal title="AgentSky walkthrough" close={()=>setFilm(false)} wide><video ref={video} controls autoPlay playsInline preload="none" src={asset('walkthrough.webm')} aria-label="Recorded AgentSky concept walkthrough" onTimeUpdate={()=>{const t=video.current?.currentTime||0;setChapter(t>=19?2:t>=9?1:0);}}/><div className="pl-chapters">{['Choose an agent','Keep the context','Explore the output'].map((c,i)=><button key={c} aria-pressed={chapter===i} onClick={()=>{if(video.current)video.current.currentTime=[0,9,19][i];}}><span>0{i+1}</span>{c}</button>)}</div><p className="pl-film-note">Recorded concept demonstration with sample data.</p></Modal>}
    {tryIt&&<Modal title="Try AgentSky" close={()=>setTryIt(false)} wide><Playground/></Modal>}
  </div>;
}

function Playable(){return <div className="pl-playable"><header className="pl-playable__intro"><div><span className="pl-kicker">AgentSky / An interactive design study</span><h1 tabIndex={-1}>Less explaining.<br/><em>More trying.</em></h1></div><div className="pl-playable__note"><span aria-hidden="true">↙</span><p>Choose an agent.<br/>Give it a brief.<br/>See what happens.</p></div></header><Playground/><section className="pl-playable__details"><h2>The interaction<br/>is the explanation.</h2><div><span className="pl-kicker">The design decision</span><p>Keep the request, the agent and the resulting files in one place. The viewer can change one thing and see exactly what changed with it.</p></div><div><span className="pl-kicker">The work</span><p>Independent interface design, frontend implementation and interaction choreography. This portfolio demo adapts the original concept’s sample workflow.</p></div></section></div>;}

const artifacts=[
  {name:'One place to follow the work.',label:'The session',image:'hero.png',category:'Interface / interaction',detail:'Agent selection, the request and its files stay visible together. Changing the selected agent resets the sample run, so an old result never appears to belong to a new agent.',note:'Continuity over spectacle.'},
  {name:'Close the window. Keep the context.',label:'The workspace',image:'cloud.png',category:'Motion / continuity',detail:'The local and cloud windows share the same workspace identity. Movement explains the transfer, while the remaining window makes persistence visible.',note:'Motion with a job to do.'},
  {name:'Give the result room.',label:'The output',image:'comparison.png',category:'Composition / inspection',detail:'A selector sits beside one large output preview. Each result has space to be read, and the viewer can open it for closer inspection.',note:'Read the work, then compare.'},
];
function Archive(){const [selected,setSelected]=useState<number|null>(null);const [tryIt,setTryIt]=useState(false);return <div className="pl-archive"><header className="pl-archive__intro"><span className="pl-kicker">From the desk of Bryce Rambach / Study 001</span><h1 tabIndex={-1}>AgentSky<span>Form follows<br/><em>understanding.</em></span></h1><p>An independent exploration of how a cloud workspace should look, move and explain itself.</p></header><div className="pl-archive__rule"><span>Three artifacts</span><span>Interface · Motion · Frontend</span><span>Select a piece to inspect ↙</span></div><div className="pl-artifacts">{artifacts.map((a,i)=><button key={a.label} onClick={()=>setSelected(i)} className={`pl-artifact pl-artifact--${i}`}><div className="pl-artifact__mount"><img src={asset(a.image)} alt={`${a.label}: original AgentSky concept capture`}/><span className="pl-artifact__expand" aria-hidden="true">↗</span></div><div className="pl-artifact__caption"><span>0{i+1} / {a.category}</span><h2>{a.label}</h2><p>{a.note}</p></div></button>)}</div><footer className="pl-archive__end"><p>The decisions matter.<br/>So does how they feel.</p><button onClick={()=>setTryIt(true)}>Try the assembled interaction <span aria-hidden="true">↗</span></button><small>Source captures from an independent concept.<br/>All agent runs and outputs are illustrative.</small></footer>
    {selected!==null&&<Modal title="Inspect the design" close={()=>setSelected(null)} wide><div className="pl-artifact-view"><div><img src={asset(artifacts[selected].image)} alt={artifacts[selected].label}/></div><aside><span className="pl-kicker">Artifact 0{selected+1} / 03</span><h2>{artifacts[selected].name}</h2><p>{artifacts[selected].detail}</p><span className="pl-artifact-source">Original prototype capture / September 2026</span><nav aria-label="Choose artifact">{artifacts.map((a,i)=><button key={a.label} aria-pressed={selected===i} onClick={()=>setSelected(i)}>0{i+1}<span>{a.label}</span></button>)}</nav></aside></div></Modal>}
    {tryIt&&<Modal title="Try AgentSky" close={()=>setTryIt(false)} wide><Playground/></Modal>}
  </div>;}

function readDirection():Direction|null {const id=location.hash.slice(1);return directions.some(d=>d.id===id)?id as Direction:null;}
export default function ProjectLab(){const [direction,setDirection]=useState<Direction|null>(readDirection);const reduced=useReducedMotion();const root=useRef<HTMLDivElement>(null);const last=useRef<Direction>('screening');const previousDirection=useRef(direction);
  useEffect(()=>{const change=()=>setDirection(readDirection());window.addEventListener('hashchange',change);const title=document.title;document.title='Project presentations / Bryce Rambach';return()=>{window.removeEventListener('hashchange',change);document.title=title;};},[]);
  useEffect(()=>{if(previousDirection.current===direction)return;previousDirection.current=direction;window.scrollTo(0,0);const t=setTimeout(()=>{if(direction)root.current?.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});else root.current?.querySelector<HTMLButtonElement>(`[data-direction="${last.current}"]`)?.focus();},reduced?0:550);return()=>clearTimeout(t);},[direction,reduced]);
  const open=(id:Direction)=>{
    if(id===direction)return;
    const update=()=>{last.current=id;history.pushState(null,'',`${location.pathname}#${id}`);flushSync(()=>setDirection(id));};
    if(!reduced&&document.startViewTransition)document.startViewTransition(update);else update();
  };
  const back=()=>{history.pushState(null,'',location.pathname);setDirection(null);};
  useEffect(()=>{root.current?.querySelectorAll('h1').forEach(h=>h.tabIndex=-1);},[direction]);
  return <div ref={root} className={`pl-root ${direction?`pl-root--${direction}`:'pl-root--index'}`}><header className="pl-nav"><button onClick={back} aria-label="Back to presentation comparison">{direction?'← All directions':'BR / Selected work'}</button><span>{direction?`${directions.find(d=>d.id===direction)?.number} / ${directions.find(d=>d.id===direction)?.name}`:'Presentation studies / 2026'}</span><a href="/">Return to the Porsche ↗</a></header>
    {direction&&<nav className="pl-switcher" aria-label="Compare presentation directions">{directions.map(d=><button key={d.id} aria-label={`View ${d.name}`} aria-current={direction===d.id?'page':undefined} onClick={()=>open(d.id)}><span>{d.number}</span>{d.name.replace('The ','')}</button>)}</nav>}
    <main key={direction||'index'}>
      {!direction?<div className="pl-index"><div className="pl-index__intro"><span className="pl-kicker">One project. Three ways in.</span><h1 tabIndex={-1}>How should<br/>the work <em>feel?</em></h1><p>Watch it. Play with it. Pull it apart.<br/>Three presentations of the same AgentSky concept.</p></div><div className="pl-directions">{directions.map(d=><button data-direction={d.id} key={d.id} onClick={()=>open(d.id)} className={`pl-direction pl-direction--${d.id}`}><div className="pl-direction__cover">{d.id==='screening'?<><img src={asset('sky.png')} alt=""/><strong>AgentSky</strong><span className="pl-direction__play">▶</span></>:d.id==='playable'?<><span className="pl-mini-brand"><CloudMark/>AgentSky</span><div className="pl-mini-agents"><span>✳</span><span>&gt;_</span><span>H</span></div><strong>Your move.</strong><span className="pl-mini-run">Run the demo ↗</span></>:<><strong>Agent<br/><em>Sky.</em></strong><img src={asset('cloud.png')} alt=""/><span className="pl-mini-label">NOTES ON CONTINUITY / 02</span></>}</div><div className="pl-direction__caption"><span>{d.number}</span><div><h2>{d.name}</h2><p>{d.caption}</p></div><span aria-hidden="true">↗</span></div></button>)}</div><footer className="pl-index__foot"><span>Same project. Different pacing, scale and interaction.</span><span>Working prototypes / independent design study</span></footer></div>:direction==='screening'?<Screening/>:direction==='playable'?<Playable/>:<Archive/>}
    </main>
  </div>;
}
