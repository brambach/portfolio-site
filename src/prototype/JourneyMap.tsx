import {useEffect,useRef} from 'react';
import {JOURNEY_STOPS,journeyAccess,type JourneyStopId,type JourneyAccess} from './journey-route';
import './journey-map.css';
import {mapPoint,mapWorldPoint,mapStopPoint,accessOutline,mapOutline} from './journey-map-layout';
export function JourneyMap({distance,visited,navigate,close,restoreFocus,position,stops=JOURNEY_STOPS,accessRoads=journeyAccess,firstTrip=false}:{firstTrip?:boolean;stops?:readonly typeof JOURNEY_STOPS[number][];accessRoads?:readonly JourneyAccess[];distance:number;visited:JourneyStopId[];navigate:(id:JourneyStopId)=>void;close:()=>void;restoreFocus?:()=>void;position?:{x:number;z:number}}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!,previous=document.activeElement;dialog.showModal();return()=>{dialog.close();if(restoreFocus)restoreFocus();else if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[]);
  const here=position?mapWorldPoint(position):mapPoint(distance);
  return <dialog className="journey-map" ref={ref} aria-labelledby="journey-map-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><span>THE LONG WAY / ROUTE NOTES</span><button onClick={close} autoFocus aria-label="Close route map">Close ×</button></header>
    <h2 id="journey-map-title">Where to next?</h2>
    <p>A fictional road from the neighbourhood to the lake. Pick a stop and Cruise will take you there. You can take the wheel at any time.</p>
    <div className="journey-map__layout"><svg viewBox="0 0 500 380" role="img" aria-label={`Route through ${stops.map(stop=>stop.name).join(", ")}. Your current position is marked.`}>
      <path d={mapOutline} fill="none" stroke="#8d9a82" strokeWidth="12"/><path d={mapOutline} fill="none" stroke="#e9dfc7" strokeWidth="7"/>
      {accessRoads.map(access=><path key={access.id} d={accessOutline(access)} fill="none" stroke="#8d9a82" strokeWidth="3"/>)}
      {stops.map((stop,i)=>{const p=mapStopPoint(stop.id,accessRoads.find(access=>access.id===stop.id));return <g key={stop.id}><circle cx={p.x} cy={p.y} r="13" fill="#284f43"/><text x={p.x} y={p.y+4} textAnchor="middle" fill="#fff8e7" fontSize="12">{i+1}</text></g>;})}
      <circle cx={here.x} cy={here.y} r="6" fill="#b86539" stroke="#fff8e7" strokeWidth="3"/>
      <text x="35" y="373" fill="#665f4e" fontSize="12">● You are here · Follow the road at your own pace</text>
    </svg><ol>{stops.map(stop=><li key={stop.id}><button onClick={()=>{ref.current?.close();navigate(stop.id);}}><strong>{stop.name}{visited.includes(stop.id)?' ✓':''}</strong><span>{stop.detail}</span></button></li>)}</ol></div>
    <footer>{firstTrip?"Your first trip ends at the lake. Café and tennis are optional.":"Pick another stop, or close the map to keep exploring."}</footer>
  </dialog>;
}
