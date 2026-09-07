import {useEffect,useRef,useState} from 'react';
import {raceTime} from './return-race';
export type RaceEntry={id:string;name:string;elapsed:number};
export function useRaceTimes(){
  const [entries,setEntries]=useState<RaceEntry[]>([]),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [target,setTarget]=useState<RaceEntry|null>(null);
  const [challenge]=useState(()=>new URLSearchParams(window.location.search).get('challenge'));
  const [revision,reload]=useState(0);
  useEffect(()=>{const abort=new AbortController();setStatus('loading');
    fetch('/api/race'+(challenge?'?id='+encodeURIComponent(challenge):''),{signal:abort.signal}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.entries))throw new Error();setTarget(data.target??null);return data.entries as RaceEntry[];}).then(data=>{setEntries(data);setStatus('ready');}).catch(()=>{if(!abort.signal.aborted)setStatus('error');});
    return()=>abort.abort();
  },[revision]);
  return {entries,target,challenge,status,retry:()=>reload(value=>value+1)};
}
export function RaceTimes({close}:{close:()=>void}){
  const {entries,status,retry}=useRaceTimes(),dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();return()=>{if(previous?.isConnected)previous.focus();};},[]);
  return <dialog ref={dialog} className="race-times" aria-labelledby="race-times-title" onCancel={event=>{event.preventDefault();close();}}><header><span>THE LONG WAY / CLUB TIMES</span><button aria-label="Close race times" onClick={close}>×</button></header><h1 id="race-times-title">Race times.</h1><p>the lake to the start. One car. Your best shot.</p>{status==='loading'&&<p role="status">Checking the board…</p>}{status==='error'&&<div role="status"><p>The board is taking a breather.</p><button onClick={retry}>Try again</button></div>}{status==='ready'&&(entries.length?<ol>{entries.map(entry=><li key={entry.id}><span>{entry.name}</span><strong>{raceTime(entry.elapsed)}</strong></li>)}</ol>:<p>No times yet. The first lap is up for grabs.</p>)}<p className="race-times__note">The race starts at the lake, after the tour. Astra’s time is an AI exhibition using direct road knowledge.</p></dialog>;
}
export function TimeToBeat({open}:{open:()=>void}){
  const {entries,target,challenge,status}=useRaceTimes();
  const leader=target??entries[0];
  return <div className="time-to-beat">{status==='ready'&&leader&&<p>{target?'Your challenge':'Time to beat'} <strong>{raceTime(leader.elapsed)}</strong><span> · {leader.name}</span></p>}{status==='ready'&&challenge&&!target&&<p>That challenge has left the board. The current times are below.</p>}<button onClick={open}>View race times ↗</button></div>;
}
