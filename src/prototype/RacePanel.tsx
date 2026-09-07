import {trackJourney} from '../lib/journey-stats';
import {ContactLinks} from './ContactLinks';
import {saveRaceResult,type SavedRace} from "./race-result";
import {useEffect,useRef,useState} from 'react';
import {raceTime,type RaceState} from './return-race';
import './return-race.css';

export function RacePanel({race,cancel,resume}:{race:RaceState;cancel:()=>void;resume?:SavedRace}){
  const [name,setName]=useState(resume?.name??'');
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(resume?.saved??false);
  const [rank,setRank]=useState<number|null>(null);
  const [runId,setRunId]=useState<string|null>(resume?.id??null);
  const [entries,setEntries]=useState<{id:string;name:string;elapsed:number}[]>([]);
  const [online,setOnline]=useState(false);
  const request=useRef<Promise<string|null>>(Promise.resolve(null));
  const finishRequest=useRef<Promise<boolean>>(Promise.resolve(false));
  const abort=useRef<AbortController|null>(null),finishHeading=useRef<HTMLHeadingElement>(null);
  async function post(body:unknown){
    const response=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.current?.signal});
    const result=await response.json();if(!response.ok)throw new Error(result.error??'The leaderboard isn’t available.');return result;
  }
  async function loadBoard(){
    try{const id=await request.current;const response=await fetch('/api/race'+(id?'?id='+encodeURIComponent(id):''),{signal:abort.current?.signal});if(response.ok){const result=await response.json();setEntries(result.entries);setRank(result.rank??null);}}catch{}
  }
  useEffect(()=>{
    const controller=new AbortController();abort.current=controller;
    request.current=resume?Promise.resolve(resume.id):post({action:'start'}).then(result=>{if(!controller.signal.aborted){setOnline(true);setRunId(result.id);}return result.id as string;}).catch(()=>null);
    if(resume?.id)setOnline(true);
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(race.phase!=='finished')return;
    finishHeading.current?.focus({preventScroll:true});
    finishRequest.current=request.current.then(async id=>{
      if(!id)return false;
      if(resume?.saved)return true;
      try{await post({action:'finish',id,elapsed:Math.round(race.elapsed)});return true;}catch{setMessage('We couldn’t register this finish. Your time is still here.');return false;}
    });
    void loadBoard();
  },[race.phase]);
  useEffect(()=>{if(race.phase==='finished')saveRaceResult({elapsed:race.elapsed,id:runId,name,saved});},[race.phase,race.elapsed,runId,name,saved]);
  async function save(){
    setSaving(true);setMessage('');
    try{
      if(!await finishRequest.current){
        const id=await request.current;
        if(!id)throw new Error('This run couldn’t reach the leaderboard. Your time is still here.');
        await post({action:'finish',id,elapsed:Math.round(race.elapsed)});
      }
      await post({action:'publish',id:await request.current,name:name.trim()});
      trackJourney('time_posted');setSaved(true);setMessage('Your time is on the board.');await loadBoard();
    }catch(error){setMessage(error instanceof Error?error.message:'The leaderboard isn’t available.');}
    finally{setSaving(false);}
  }
  if(race.phase==='countdown')return <section className="race-countdown" aria-label="Race countdown"><span>THE LAKE → THE START</span><strong role="status">{race.countdown||'GO'}</strong><p>Your turn. W accelerates. A / D steer. S brakes.</p><button onClick={cancel}>Stay at the lake</button></section>;
  if(race.phase==='racing')return <aside className="race-hud" aria-label="Return race"><span>THE WAY BACK</span><strong>{raceTime(race.elapsed)}</strong><p>{Math.ceil(race.remaining)} m to the finish</p><progress aria-label="Race progress" max={1} value={race.progress}/><button onClick={cancel}>End run</button></aside>;
  return <section className="race-finish" aria-label="Race finish"><span>THE LONG WAY / TIMING SLIP</span><h1 ref={finishHeading} tabIndex={-1}>Back where we started.</h1><div className="race-finish__result"><span>THE LAKE → HOME</span><strong>{raceTime(race.elapsed)}</strong><small>{rank?`YOUR TIME / #${rank} ON THE BOARD`:"YOUR TIME"}</small></div><p>Thanks for taking the long way.</p>{!online && <p id="race-connection-status">The leaderboard was offline when this run started, so this time can’t be posted.</p>}<label htmlFor="race-name">Name on the board</label><input id="race-name" maxLength={24} value={name} onChange={event=>setName(event.target.value)} autoComplete="nickname"/><button aria-describedby={!online?"race-connection-status":undefined} disabled={!online||saving||saved||!name.trim()} onClick={save}>{!online?'Leaderboard offline':saved?'Time posted':saving?'Saving…':'Post my time'}</button><p role="status">{message}</p>{entries.length>0 && <ol aria-label="Leaderboard">{entries.slice(0,5).map(entry=><li key={entry.id}><span>{entry.name}</span><strong>{raceTime(entry.elapsed)}</strong></li>)}</ol>}<a href="/projects">Back to my projects ↗</a><button onClick={cancel}>Keep exploring</button><ContactLinks/></section>;
}
