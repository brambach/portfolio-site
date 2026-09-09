import {useEffect,useRef,useState} from 'react';
import {JOURNEY_STOPS,journeyAccess,journeyRoad,type JourneyStopId,type JourneyAccess} from './journey-route';
import './journey-map.css';
import {mapPoint,mapWorldPoint,mapStopPoint,accessOutline,mapOutline} from './journey-map-layout';
import {estimatePlannedRoute,scenicTimeLabel,type RouteEstimate} from './route-estimate';

const notes:Record<JourneyStopId,{title:string;text:string;tag:string}>={
  cafe:{title:'Coffee before the hills.',text:'A flat white, the laptop, and a little time with the work.',tag:'COFFEE / PROJECTS'},
  tennis:{title:'A small detour.',text:'The courts, a racket, and a story from before the software.',tag:'TENNIS / A PERSONAL NOTE'},
  lake:{title:'Save a little afternoon.',text:'A view across the water. Projects if you’re curious. A race home if you’re ready.',tag:'THE VIEW / THE WAY HOME'},
  store:{title:'Around the corner.',text:'A neighbourhood stop along the road.',tag:'NEIGHBOURHOOD'},
  trailhead:{title:'Into the trees.',text:'A short trail to the forest viewpoint.',tag:'FOREST / A SHORT WALK'},
  city:{title:'After hours.',text:'Follow the road back through the city.',tag:'CITY / THE RETURN'}
};
function Landmark({id}:{id:JourneyStopId}){
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{id==='cafe'?<><path d="M10 17h24v12a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10V17ZM34 19h3a5 5 0 0 1 0 10h-3M7 42h31M18 12c-5-5 5-5 0-10M27 12c-5-5 5-5 0-10"/></>:id==='tennis'?<><ellipse cx="27" cy="18" rx="11" ry="14" transform="rotate(30 27 18)"/><path d="m19 30-9 15m5-18 9 5M20 8l15 10M17 14l16 10M16 21l13 8M27 5 15 25M33 9 20 30M37 15 26 32"/></>:id==='lake'?<><path d="m4 27 13-17 9 11 8-16 11 22M11 19l6 2 4-4M29 15l5 3 5-4M3 33q7-4 14 0t14 0t14 0M3 41q7-4 14 0t14 0t14 0"/></>:<><path d="m24 4-13 18h7L7 36h34L30 22h7L24 4ZM24 36v9"/></>}</svg>;
}
export function JourneyMap({distance,visited,navigate,goStraight,routePreview,close,restoreFocus,position,stops=JOURNEY_STOPS,accessRoads=journeyAccess,firstTrip=false,cruiseSpeed=18,roadLength=journeyRoad.length,currentAccessId=null,currentAccessDistance=0}:{firstTrip?:boolean;stops?:readonly typeof JOURNEY_STOPS[number][];accessRoads?:readonly JourneyAccess[];distance:number;visited:JourneyStopId[];navigate:(id:JourneyStopId)=>void;goStraight?:(id:JourneyStopId)=>void;routePreview?:(id:JourneyStopId)=>RouteEstimate|null|undefined;close:()=>void;restoreFocus?:()=>void;position?:{x:number;z:number};cruiseSpeed?:number;roadLength?:number;currentAccessId?:JourneyStopId|null;currentAccessDistance?:number}){
  const ref=useRef<HTMLDialogElement>(null);
  const previous=useRef(document.activeElement);
  const [selected,setSelected]=useState<JourneyStopId>(()=>stops.find(stop=>!visited.includes(stop.id))?.id??stops[0]?.id??'lake');
  const active=stops.find(stop=>stop.id===selected)??stops[0];
  const activeAccess=active?accessRoads.find(access=>access.id===active.id):null;
  const estimate=active&&activeAccess?(routePreview?.(active.id)??estimatePlannedRoute({id:active.id,distance,destination:activeAccess.centre,roadLength,accessRoads,currentAccessId,currentAccessDistance,cruiseSpeed})):null;
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>{dialog.close();if(restoreFocus)restoreFocus();else if(previous.current instanceof HTMLElement&&previous.current.isConnected)previous.current.focus();};},[]);
  const here=position?mapWorldPoint(position):mapPoint(distance);
  const lake=mapStopPoint('lake',accessRoads.find(access=>access.id==='lake'));
  const choose=(id:JourneyStopId)=>setSelected(id);
  const alreadyAtStop=Boolean(estimate?.alreadyAtStop);
  return <dialog className="journey-map" ref={ref} aria-labelledby="journey-map-title" onCancel={event=>{event.preventDefault();close();}}>
    <header className="journey-map__masthead"><span className="journey-map__monogram">BR</span><span>THE LONG WAY<br/><small>A GLOVEBOX COMPANION</small></span><button onClick={close} autoFocus aria-label="Close route map">Fold away <span aria-hidden="true">×</span></button></header>
    <div className="journey-map__heading"><div><span className="journey-map__eyebrow">ROUTE No. 911</span><h2 id="journey-map-title">Where to next?</h2></div><p>From the neighbourhood to the lake.<br/>Choose a stop. The Porsche handles the road.</p></div>
    <div className="journey-map__layout">
      <div className="journey-map__sheet">
        <svg className="journey-map__drawing" viewBox="0 0 500 380" role="group" aria-label="Road map and stop previews">
          <defs><pattern id="map-water" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 4q3-2 6 0t6 0" fill="none" stroke="#668d91" strokeWidth=".6" opacity=".5"/></pattern></defs>
          <g aria-hidden="true" className="journey-map__terrain">
            {Array.from({length:7},(_,i)=><path key={i} d={`M${65+i*8} ${70+i*6}C${190+i*4} ${-10+i*10},${300-i*8} ${70+i*3},${360-i*6} ${120+i*8}S${240-i*3} ${240-i*5},${160+i*4} ${215-i*3}S${30+i*7} ${170-i*5},${65+i*8} ${70+i*6}Z`}/>)}
            <path d={`M${lake.x-64} ${lake.y-28}q-28 23-12 51t53 16q39 6 50-16t-6-43q-24-26-85-8Z`} fill="#a9bec0" stroke="none"/>
            <path d={`M${lake.x-64} ${lake.y-28}q-28 23-12 51t53 16q39 6 50-16t-6-43q-24-26-85-8Z`} fill="url(#map-water)" stroke="#77989a"/>
            <text x={lake.x-18} y={lake.y+11} className="journey-map__water-label">THE LAKE</text>
            {[{x:155,y:72},{x:191,y:91},{x:214,y: 60}].map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}><path d="m-16 14 15-25 18 25m-27-12 9 4 5-4"/></g>)}
            <text x="193" y="136" className="journey-map__region">THE HILLS</text><text x="304" y="278" className="journey-map__region">THE NEIGHBOURHOOD</text>
            {Array.from({length:13},(_,i)=><g key={i} transform={`translate(${105+(i%5)*19} ${172+Math.floor(i/5)*22})`}><path d="m0-8-5 8h3l-5 6h14L2 0h3L0-8ZM0 6v4"/></g>)}
          </g>
          <path className="journey-map__road-edge" d={mapOutline}/><path className="journey-map__road" d={mapOutline}/><path className="journey-map__road-dashes" d={mapOutline}/>
          {accessRoads.map(access=><path className={`journey-map__access ${selected===access.id?'is-selected':''}`} key={access.id} d={accessOutline(access)}/>)}
          {stops.map((stop,i)=>{const p=mapStopPoint(stop.id,accessRoads.find(access=>access.id===stop.id));return <g key={stop.id} role="button" tabIndex={0} aria-label={`Preview ${stop.name}`} aria-pressed={selected===stop.id} className={`journey-map__pin ${selected===stop.id?'is-selected':''}`} transform={`translate(${p.x} ${p.y})`} onClick={()=>choose(stop.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();choose(stop.id);}}}><circle className="journey-map__pin-hit" r="23"/><circle className="journey-map__pin-ring" r="18"/><circle className="journey-map__pin-face" r="12"/><text textAnchor="middle" y="4">{String(i+1).padStart(2,'0')}</text></g>;})}
          <g className="journey-map__here" transform={`translate(${here.x} ${here.y})`} aria-label="Your current position"><circle className="journey-map__here-pulse" r="12"/><circle r="5"/><path d="m-3-8 3-5 3 5"/></g>
          <g className="journey-map__compass" transform="translate(447 40)" aria-hidden="true"><text y="-17" textAnchor="middle">N</text><path d="M0-11 4 7 0 4-4 7Z"/></g>
        </svg>
        <div className="journey-map__legend"><span><i/> You are here</span><span>SCENIC ROUTE / NOT TO SCALE</span></div>
      </div>
      <aside className="journey-map__stops" aria-label="Choose a destination"><span className="journey-map__eyebrow">A FEW GOOD STOPS</span><ol>{stops.map((stop,i)=><li key={stop.id}><button onClick={()=>choose(stop.id)} aria-pressed={selected===stop.id}><span className="journey-map__stop-number">0{i+1}</span><Landmark id={stop.id}/><span><strong>{stop.name}</strong><small>{stop.detail}</small></span>{visited.includes(stop.id)&&<span className="journey-map__visited" aria-label="Visited">✓</span>}</button></li>)}</ol>
        {active&&<div className="journey-map__destination" key={active.id} aria-live="polite"><span className="journey-map__eyebrow">{notes[active.id].tag}</span><h3>{notes[active.id].title}</h3><p>{notes[active.id].text}</p>{alreadyAtStop?<p className="journey-map__route-note">You're already here.</p>:estimate&&<p className="journey-map__route-note">{estimate.extraLap?`Scenic route: ${scenicTimeLabel(estimate.approximateSeconds)} in light traffic. We’ve passed the safe entry, so this includes one extra lap.`:`Scenic route: ${scenicTimeLabel(estimate.approximateSeconds)} in light traffic from here.`}</p>}<button className="journey-map__go" onClick={()=>{ref.current?.close();if(alreadyAtStop)close();else navigate(active.id);}}>{alreadyAtStop?'Back to the stop':'Take the scenic route'} <span>{active.name}</span></button>{goStraight&&!alreadyAtStop&&<button className="journey-map__straight" onClick={()=>{ref.current?.close();goStraight(active.id);}}>Go straight there <span>{active.name}</span></button>}</div>}
      </aside>
    </div>
    <footer><span>{firstTrip?"Your first trip ends at the lake. Café and tennis are optional.":"Pick another stop, or close the map to keep exploring."}</span><span>KEEP THIS ONE IN THE GLOVEBOX.</span></footer>
  </dialog>;
}
