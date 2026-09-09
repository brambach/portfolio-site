import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export default function PortStudy() {
  const [phase,setPhase]=useState<'open'|'holding'|'closing'|'closed'>('open');
  const [sound,setSound]=useState(false);
  const [audioFailed,setAudioFailed]=useState(false);
  const reduced=useReducedMotion();
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const sequence=useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio=useRef<HTMLAudioElement|null>(null);
  const action=useRef<HTMLButtonElement>(null);
  const pointerClosing=useRef(false);
  const ignoreReleaseClick=useRef(false);
  const restoreCompletionFocus=useRef(false);
  const cancelHold=()=>{if(hold.current)clearTimeout(hold.current);hold.current=null;setPhase(p=>p==='holding'?'open':p);};
  const stopAudio=()=>{if(audio.current){audio.current.pause();audio.current.currentTime=0;}};
  useEffect(()=>()=>{if(hold.current)clearTimeout(hold.current);sequence.current.forEach(clearTimeout);stopAudio();},[]);
  useEffect(()=>{const hide=()=>{if(document.hidden){cancelHold();stopAudio();}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
  useLayoutEffect(()=>{
    if(phase!=='closed'||!restoreCompletionFocus.current)return;
    restoreCompletionFocus.current=false;
    const focused=document.activeElement;
    if(focused===document.body||focused===action.current)action.current?.focus({preventScroll:true});
  },[phase]);
  const close=()=>{
    if(hold.current)clearTimeout(hold.current);hold.current=null;
    const focused=document.activeElement;
    restoreCompletionFocus.current=focused===document.body||focused===action.current;
    setPhase('closing');
    if(sound){sequence.current.push(setTimeout(()=>{audio.current?.play().catch(()=>setAudioFailed(true));},reduced?0:380));}
    sequence.current.push(setTimeout(()=>{setPhase('closed');},reduced?0:1666));
  };
  const activationKey=(key:string)=>key==='Enter'||key===' ';
  const startHold=()=>{ignoreReleaseClick.current=false;if(phase!=='open')return;pointerClosing.current=true;setPhase('holding');hold.current=setTimeout(()=>{ignoreReleaseClick.current=pointerClosing.current;close();},1000);};
  const releasePointer=()=>{pointerClosing.current=false;cancelHold();};
  const abandonPointer=(clearReleaseGuard=true)=>{pointerClosing.current=false;if(clearReleaseGuard)ignoreReleaseClick.current=false;cancelHold();};
  const toggleSound=()=>{
    if(!sound&&!audio.current){audio.current=new Audio('/projects/port/close.wav');audio.current.preload='auto';}
    if(sound)stopAudio();setSound(!sound);
  };
  return <article className="ps-port">
    <header className="ps-port__hero"><div className="ps-port__title"><span className="ps-eyebrow">Port / Native interaction study</span><h1 tabIndex={-1}>A moment<br/>to <em>close.</em></h1><p>One deliberate gesture.<br/>Then a little less everything.</p><span className="ps-port__hint">Try the ritual</span></div>
      <div className="ps-port__demo"><div className={`ps-port__screen is-${phase}`}><div className="ps-port__band"/><div className="ps-port__horizon"/><span className="ps-port__status" role="status">{phase==='closed'?'Port closed':phase==='closing'?'':'Port open'}</span><button ref={action} className="ps-port__action" disabled={phase==='closing'} onPointerDown={event=>{if(event.button===0)startHold();}} onPointerUp={releasePointer} onPointerCancel={()=>abandonPointer()} onPointerLeave={()=>abandonPointer(false)} onBlur={()=>abandonPointer(false)} onKeyDown={event=>{if(!activationKey(event.key))return;if(event.repeat){event.preventDefault();return;}ignoreReleaseClick.current=false;}} onClick={event=>{if(ignoreReleaseClick.current){ignoreReleaseClick.current=false;return;}if(phase==='closed'){stopAudio();setPhase('open');}else if(event.detail===0&&phase==='open'){ignoreReleaseClick.current=false;close();}}} aria-label={phase==='closed'?'Open Port':'Close Port'} aria-describedby="port-instructions">{phase==='closed'?'Open port':phase==='holding'?'Hold…':'Close port'}</button></div>
        <div className="ps-port__controls"><span id="port-instructions">Hold for one second.<br/>Keyboard: press Enter to close.</span><button aria-pressed={sound} onClick={toggleSound}>Sound {sound?'on':'off'}</button></div>{audioFailed&&<p className="ps-port__audio-note" role="status">Sound couldn’t play in this browser. The visual ritual still works.</p>}
      </div>
    </header>
    <section className="ps-port__story"><span className="ps-eyebrow">The feeling is in the timing</span><h2>Give stopping<br/>a physical feeling.</h2><p>Most interfaces are designed to keep you going. Port gives leaving the same attention: a hold, a compression, a line pulled inward, then silence.</p><ol><li><b>1.00<span>s</span></b><h3>Commit</h3><p>A deliberate hold. Release early and nothing changes.</p></li><li><b>0.83<span>s</span></b><h3>Compress</h3><p>The screen closes vertically. A sound enters partway through.</p></li><li><b>0.42<span>s</span></b><h3>Contract</h3><p>The remaining line pulls into its centre.</p></li><li><b>0.40<span>s</span></b><h3>Be still</h3><p>A short pause before the closed state appears.</p></li></ol></section>
    <footer className="ps-port__credits"><div><span className="ps-eyebrow">Design & implementation</span><p>Bryce Rambach<br/>SwiftUI · WidgetKit · Sound & haptics</p></div><p>The native source coordinates the ritual, saves the closed state and refreshes a widget. This browser interpretation follows its timing and uses the original sound. It doesn’t produce native haptics, retain your state or block other apps. A device run hasn’t been verified.</p></footer>
  </article>;
}
