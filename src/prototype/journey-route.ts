import {MathUtils} from 'three';
import {createRoad,type RoadGeometry} from './road-geometry';

// Fictional geography. These coordinates don't represent private addresses.
export const journeyRoad=createRoad([
  [0,0,0],[0,0,160],[40,0,360],[0,0,600],[-180,0,820],[-430,0,1000],
  [-760,0,1040],[-1020,0,900],[-1150,0,640],[-1050,0,380],[-850,0,160],
  [-620,0,-100],[-400,0,-320],[-130,0,-350],[0,0,-180],
],8,.61);
export const JOURNEY_STOPS=[
  {id:'cafe',name:'Neighbourhood café',detail:'A flat white before the hills.',fraction:.075,kind:'cafe'},
  {id:'tennis',name:'Tennis club',detail:'Take a detour to the courts.',fraction:.18,kind:'tennis'},
  {id:'store',name:'Corner store',detail:'A small stop along the way.',fraction:.25,kind:'store'},
  {id:'trailhead',name:'Forest trailhead',detail:'Park under the trees. Walk to a view.',fraction:.43,kind:'forest'},
  {id:'lake',name:'Lakeside',detail:'a lake-inspired end to the afternoon.',fraction:.61,kind:'lake'},
  {id:'city',name:'After hours',detail:'Keep going through the city lights.',fraction:.82,kind:'city'},
] as const;
export type JourneyStopId=typeof JOURNEY_STOPS[number]['id'];
export function stopDistance(id:JourneyStopId){return JOURNEY_STOPS.find(stop=>stop.id===id)!.fraction*journeyRoad.length;}
export function nextVisit(current:number,destination:number,length:number) {
  let gap=MathUtils.euclideanModulo(destination-current,length);
  if(gap<45)gap+=length;
  return current+gap;
}
export function nearbyStop(distance:number,tolerance=12) {
  return JOURNEY_STOPS.find(stop=>Math.abs(MathUtils.euclideanModulo(distance-stopDistance(stop.id)+journeyRoad.length/2,journeyRoad.length)-journeyRoad.length/2)<tolerance)??null;
}

export const STOP_OFFSET=45;
export function createAccessRoad(main:RoadGeometry,id:JourneyStopId,joinLane=5.5){
  const centre=JOURNEY_STOPS.find(stop=>stop.id===id)!.fraction*main.length,entry=centre-120,exit=centre+120;
  const points=[[-120,joinLane],[-108,joinLane],[-90,joinLane+3.5],[-65,26],[-28,36],[0,36],[28,36],[65,26],[90,joinLane+3.5],[108,joinLane],[120,joinLane]].map(([along,lane])=>main.frame(centre+along,lane).point.toArray() as [number,number,number]);
  const road=createRoad(points,2.8,.5,false),target=main.frame(centre,36).point;
  const parking=road.nearest(target.x,target.z).distance;
  return {id,entry,exit,road,parking,centre,place:main.frame(centre,STOP_OFFSET).point};
}
export const journeyAccess=JOURNEY_STOPS.map(stop=>createAccessRoad(journeyRoad,stop.id));
export type JourneyAccess=typeof journeyAccess[number];
export function accessFor(id:JourneyStopId){return journeyAccess.find(access=>access.id===id)!;}
export function nearAccess(x:number,z:number,margin=5,accessRoads:readonly JourneyAccess[]=journeyAccess){
  return accessRoads.some(access=>{
    if((x-access.place.x)**2+(z-access.place.z)**2>190**2)return false;
    const nearest=access.road.nearest(x,z);
    return nearest.distance>=0&&nearest.distance<=access.road.length&&nearest.away<access.road.halfWidth+margin;
  });
}
