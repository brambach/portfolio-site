import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import './road-notes.css';
const notes=[
  {title:'I design and build software.',short:'Interfaces, connected systems, and little tools for the people around me.',detail:'The laptop brings those sides together: interface studies, desktop tools, mobile prototypes and integration work. Each project has something you can explore.'},
  {title:'My day job connects systems.',short:'By day I work across payroll, HR and finance.',detail:'Most of it is quiet plumbing between platforms. The integration portal study shows an anonymised interpretation of that work, with fictional client data.'},
  {title:'Some projects start at home.',short:'Arro began as a running streak with my family.',detail:'A shared ritual, a little encouragement, and a reason to keep showing up. The portfolio uses fictional names and sample activity.'},
  {title:'There’s a racket back there.',short:'I played tennis when I was younger. The racket has a place in the car for a reason.',detail:'The nickname is “the young prodigy”. You can pick up the racket from the cabin when we stop.'}
];
const OPENED_KEY='bryce-road-notes-opened';
export function RoadNotes({progress,deferred=false,onFocusHidden}:{progress:number;deferred?:boolean;onFocusHidden?:()=>void}){
  const isMobile=useIsMobileViewport();
  const rootRef=useRef<HTMLElement>(null);
  const peekRef=useRef<HTMLButtonElement>(null);
  const moreRef=useRef<HTMLButtonElement>(null);
  const ownsFocus=useRef(false);
  const bodyId=useId();
  const [hidden,setHidden]=useState(()=>{try{return sessionStorage.getItem('bryce-road-notes-hidden')==='yes';}catch{return false;}});
  const [expanded,setExpanded]=useState(false);
  const [open,setOpen]=useState(false);
  const [everOpened,setEverOpened]=useState(()=>{try{return sessionStorage.getItem(OPENED_KEY)==='yes';}catch{return false;}});
  const [chosen,setChosen]=useState<number|null>(null);
  const index=chosen??Math.min(3,Math.max(0,Math.floor((progress-.025)/.145)));
  const note=notes[index];
  const mobileDeferred=deferred&&isMobile;
  // On a narrow screen the note is one line until it is asked for, so the drive
  // keeps the scenery band the card used to take.
  const compact=isMobile&&!open;
  useLayoutEffect(()=>{
    if(!mobileDeferred)return;
    if(!ownsFocus.current)return;
    ownsFocus.current=false;
    onFocusHidden?.();
  },[mobileDeferred,onFocusHidden]);
  // Crossing the 700px boundary swaps which control exists. If the reader was
  // holding the one that just went away, hand the keyboard to its replacement
  // rather than dropping focus onto the document.
  const settled=useRef(false);
  useLayoutEffect(()=>{
    if(!settled.current){settled.current=true;return;}
    if(mobileDeferred||!ownsFocus.current)return;
    if(rootRef.current?.contains(document.activeElement))return;
    (peekRef.current??moreRef.current)?.focus();
  },[isMobile,mobileDeferred]);
  if(hidden)return null;
  const dismiss=<button aria-label="Hide drive notes" onClick={()=>{setHidden(true);try{sessionStorage.setItem('bryce-road-notes-hidden','yes');}catch{}}}>×</button>;
  return <aside
    ref={rootRef}
    className={`road-notes ${expanded?'is-expanded':''} ${deferred?'is-deferred':''} ${mobileDeferred?'is-mobile-deferred':''} ${compact?'is-compact':''}`}
    aria-label="A little about Bryce"
    aria-hidden={mobileDeferred?'true':undefined}
    inert={mobileDeferred?true:undefined}
    onFocusCapture={()=>{ownsFocus.current=true;}}
    onBlurCapture={event=>{if(!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node|null))ownsFocus.current=false;}}
  >
    {isMobile
      ?<div className="road-notes__peek-row">
        <button
          ref={peekRef}
          className="road-notes__peek"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={()=>{
            setOpen(!open);
            if(!open&&!everOpened){setEverOpened(true);try{sessionStorage.setItem(OPENED_KEY,'yes');}catch{}}
          }}
        >
          <span className="road-notes__eyebrow">BETWEEN STOPS / 0{index+1}</span>
          {/* Closed, the peek leads with the note itself once the reader knows
              what these are. The first one leads with what they are instead. */}
          <span className="road-notes__peek-title">{everOpened&&!open?note.title:'A little about Bryce'}</span>
          {everOpened
            ?<span className="road-notes__peek-cue">{open?'Close this note':'A little about Bryce. Open it'}</span>
            :<span className="road-notes__hint">Four short notes. Open one while you drive.</span>}
        </button>
        {dismiss}
      </div>
      :<header><span className="road-notes__eyebrow">BETWEEN STOPS / 0{index+1}</span>{dismiss}</header>}
    <div className="road-notes__body" id={bodyId} hidden={compact}>
      {!compact&&<>
        <div className="road-notes__copy" key={index}><h2>{note.title}</h2><p>{note.short}</p>{expanded&&<p className="road-notes__detail">{note.detail}</p>}</div>
        <footer><button ref={moreRef} aria-expanded={expanded} onClick={()=>{setChosen(index);setExpanded(!expanded);}}>{expanded?'Less':'A little more'}</button><button aria-label="Next note about Bryce" onClick={()=>setChosen((index+1)%notes.length)}>Next note <span aria-hidden="true">+</span></button></footer>
      </>}
    </div>
  </aside>;
}
export function useIsMobileViewport(){
  const [isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width:700px)').matches);
  useEffect(()=>{
    if(typeof window==='undefined'||typeof window.matchMedia!=='function')return;
    const query=window.matchMedia('(max-width:700px)');
    const update=()=>setIsMobile(query.matches);
    update();
    query.addEventListener?.('change',update);
    return()=>query.removeEventListener?.('change',update);
  },[]);
  return isMobile;
}
