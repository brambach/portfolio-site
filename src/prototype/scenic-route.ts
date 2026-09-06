import {journeyRoad,createAccessRoad} from './journey-route';
import {SCENIC_PROFILE} from './road-profile';

// The same centreline retains the continuous terrain and lake geography.
// Driving bounds include the gravel shoulder used for ordinary parking.
export const scenicRoad={...journeyRoad,halfWidth:SCENIC_PROFILE.shoulderHalfWidth};
export const scenicAccess=(['lake','cafe','tennis'] as const).map(id=>{
  const access=createAccessRoad(scenicRoad,id,SCENIC_PROFILE.approachLane);
  if(id!=='lake'){
    const arrival=scenicRoad.frame(access.centre-10,36).point;
    access.parking=access.road.nearest(arrival.x,arrival.z).distance;
  }
  return access;
});
