import {useEffect,useRef,useState} from 'react';
import Entrance from './Entrance';

const controls=[['KeyW','w','Hold accelerator'],['KeyS','s','Hold brake'],['KeyA','a','Hold left'],['KeyD','d','Hold right']] as const;
// Development-only held-key controls let the browser review exercise sustained manual input.
export default function DrivingInputReview(){
  const [held,setHeld]=useState<Record<string,boolean>>({});
  const delayedEntry=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [waiting,setWaiting]=useState(false);
  const [telemetry,setTelemetry]=useState({speed:0,collision:false,contacts:0,automatic:false,contactSpeed:0});
  useEffect(()=>{
    const host=document.querySelector('.live-entrance__scene');
    if(!host)return;
    const listener=(event:Event)=>{
      const sample=(event as CustomEvent).detail;
      setTelemetry(previous=>({speed:sample.speed,collision:sample.collision,automatic:sample.automatic,contacts:previous.contacts+Number(sample.collision&&!previous.collision),contactSpeed:sample.collision&&!previous.collision?previous.speed:previous.contactSpeed}));
    };
    host.addEventListener('car-telemetry',listener);
    return ()=>host.removeEventListener('car-telemetry',listener);
  },[]);
  useEffect(()=>()=>{if(delayedEntry.current!==null)clearTimeout(delayedEntry.current);},[]);
  function enterLater(){
    setWaiting(true);
    delayedEntry.current=setTimeout(()=>{
      delayedEntry.current=null;setWaiting(false);
      const canvas=document.querySelector('canvas');
      canvas?.dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));
      canvas?.dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));
    },2000);
  }
  function change(code:string,key:string,pressed:boolean){
    document.querySelector('canvas')?.dispatchEvent(new KeyboardEvent(pressed?'keydown':'keyup',{code,key,bubbles:true}));
    setHeld(previous=>({...previous,[code]:pressed}));
  }
  return <><Entrance/><aside aria-label="Driving input review" style={{position:'fixed',left:16,top:100,zIndex:1000,padding:12,background:'#fff',color:'#111',fontSize:12,display:'grid',gap:8}}>
    <button disabled={waiting} onClick={enterLater}>{waiting?"Entry queued":"Enter after 2 seconds"}</button>
    {controls.map(([code,key,label])=><label key={code}><input type="checkbox" checked={!!held[code]} onChange={event=>change(code,key,event.target.checked)}/>{label}</label>)}
    <button onClick={()=>controls.forEach(([code,key])=>change(code,key,false))}>Release all</button>
    <output aria-label="Traffic review telemetry">{telemetry.speed} km/h · {telemetry.automatic?'Cruise':'Manual'} · {telemetry.contacts} contact episodes{telemetry.contacts>0?` · last pre-contact sample ${telemetry.contactSpeed} km/h`:''}{telemetry.collision?' · contact active':''}</output>
  </aside></>;
}
