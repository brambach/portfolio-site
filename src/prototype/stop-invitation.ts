import type {JourneyAccess,JourneyStopId} from './journey-route';

export function stopInvitation(accessRoads:readonly JourneyAccess[],distance:number,speedKmh:number,dismissed:readonly JourneyStopId[]){
  // Stop offering a turn before the car runs out of braking and alignment room.
  const speed=Math.max(0,speedKmh/3.6),minimum=55+speed*speed/12;
  return accessRoads.filter(stop=>(stop.id==='cafe'||stop.id==='tennis')&&!dismissed.includes(stop.id))
    .map(stop=>({stop,gap:stop.entry-distance}))
    .filter(({gap})=>gap>=minimum&&gap<=Math.max(300,minimum+150))
    .sort((a,b)=>a.gap-b.gap)[0]?.stop??null;
}
