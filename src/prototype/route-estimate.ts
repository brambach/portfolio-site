import {MathUtils} from 'three';
import type {JourneyAccess,JourneyStopId} from './journey-route';

export type RouteEstimate={
  id:JourneyStopId;
  plannedDistance:number;
  travelDistance:number;
  centreGap:number;
  extraLap:boolean;
  estimateSeconds:number;
  approximateSeconds:number;
  alreadyAtStop?:boolean;
};

export function estimatePlannedRoute({id,distance,destination,roadLength,accessRoads,currentAccessId=null,currentAccessDistance=0,cruiseSpeed}:{id:JourneyStopId;distance:number;destination:number;roadLength:number;accessRoads:readonly JourneyAccess[];currentAccessId?:JourneyStopId|null;currentAccessDistance?:number;cruiseSpeed:number;}):RouteEstimate{
  const target=MathUtils.euclideanModulo(destination,roadLength);
  const access=accessRoads.find(candidate=>Math.abs(candidate.centre-target)<1)??null;
  const currentAccess=currentAccessId?accessRoads.find(candidate=>candidate.id===currentAccessId)??null:null;
  const gap=MathUtils.euclideanModulo(target-distance,roadLength);
  const alreadyApproaching=Boolean(access?.id===currentAccessId&&access&&currentAccessDistance<access.parking-2);
  let plannedDistance=distance+gap;
  if(gap<60&&!alreadyApproaching)plannedDistance+=roadLength;
  if(access&&!currentAccessId&&plannedDistance-distance<150)plannedDistance+=roadLength;
  const plannedMainDistance=plannedDistance-distance;
  let travelDistance=plannedMainDistance;
  if(access&&currentAccess?.id===access.id&&currentAccessDistance<=access.parking+2){
    travelDistance=Math.max(0,access.parking-currentAccessDistance);
  }else if(access&&currentAccess){
    const remainingCurrentAccess=Math.max(0,currentAccess.road.length-currentAccessDistance);
    const currentExit=distance+MathUtils.euclideanModulo(currentAccess.exit-distance,roadLength);
    let chosenEntry=plannedDistance-MathUtils.euclideanModulo(target-access.entry,roadLength);
    while(chosenEntry<currentExit-.000001)chosenEntry+=roadLength;
    travelDistance=remainingCurrentAccess+Math.max(0,chosenEntry-currentExit)+access.parking;
  }else if(access){
    const mainToEntry=Math.max(0,plannedMainDistance-MathUtils.euclideanModulo(target-access.entry,roadLength));
    travelDistance=mainToEntry+access.parking;
  }
  const estimateSeconds=travelDistance/Math.max(1,cruiseSpeed);
  const approximateSeconds=Math.max(estimateSeconds+18,estimateSeconds*1.18);
  return {id,plannedDistance,travelDistance,centreGap:gap,extraLap:travelDistance>gap+1,estimateSeconds,approximateSeconds:travelDistance===0?0:approximateSeconds};
}

export function scenicTimeLabel(seconds:number){
  if(seconds<50)return 'under a minute';
  const minutes=Math.max(1,Math.round(seconds/60));
  return `about ${minutes} ${minutes===1?'minute':'minutes'}`;
}
