import {MathUtils,Vector3,CatmullRomCurve3} from 'three';
import {journeyRoad,journeyAccess,STOP_OFFSET,stopDistance,type JourneyStopId} from './journey-route';
import {townInfluence} from './town-world';
import {scenicAccess} from './scenic-route';
export function stopPlacement(id:JourneyStopId){const frame=journeyRoad.frame(stopDistance(id),STOP_OFFSET);return {point:frame.point,yaw:frame.yaw-Math.PI/2};}
export function stopLocalPoint(id:JourneyStopId,x:number,y:number,z:number){const place=stopPlacement(id);return new Vector3(x,y,z).applyAxisAngle(new Vector3(0,1,0),place.yaw).add(place.point);}
export const LAKE_LEVEL=-.6;
export const lakeFrame=journeyRoad.frame(stopDistance('lake'),230);
export const scenicLakeFrame=journeyRoad.frame(stopDistance('lake'),205);
export function lakeRadius(x:number,z:number,scenic=false){
  const lake=scenic?scenicLakeFrame:lakeFrame;
  const dx=x-lake.point.x,dz=z-lake.point.z;
  const across=(dx*lake.side.x+dz*lake.side.z)/170;
  const along=(dx*lake.tangent.x+dz*lake.tangent.z)/290;
  const angle=Math.atan2(along,across);
  return Math.hypot(across,along)/(1+.05*Math.sin(angle*3)+.025*Math.cos(angle*7));
}
export function landHeight(x:number,z:number,scenic=false){
  const road=journeyRoad.nearest(x,z),fraction=MathUtils.euclideanModulo(road.distance,journeyRoad.length)/journeyRoad.length;
  const forest=scenic?(1-townInfluence(x,z)):MathUtils.smoothstep(fraction,.25,.34)*(1-MathUtils.smoothstep(fraction,.66,.74));
  const ridge=18+8*Math.sin(x*.006+z*.004)+6*Math.cos(z*.011)+20*Math.exp(-((x+900)**2+(z-1050)**2)/180000);
  const radius=lakeRadius(x,z,scenic);
  // A low shore keeps the water visible from the parked driver’s eye level.
  const shoreRise=MathUtils.smoothstep(radius,1.4,1.8);
  let accessSlope=1;
  let waterClearance=MathUtils.smoothstep(road.away,8,13);
  for(const access of scenic?scenicAccess:journeyAccess){
    const squared=(x-access.place.x)**2+(z-access.place.z)**2;if(squared>190**2)continue;
    accessSlope=Math.min(accessSlope,MathUtils.smoothstep(Math.sqrt(squared),20,38));
    // The scenic overlook has no building forecourt beyond its access lane.
    if(!scenic)waterClearance=Math.min(waterClearance,MathUtils.smoothstep(Math.sqrt(squared),6,12));
    const branch=access.road.nearest(x,z);
    if(branch.distance>=0&&branch.distance<=access.road.length)accessSlope=Math.min(accessSlope,MathUtils.smoothstep(branch.away,7,24));
    if(branch.distance>=0&&branch.distance<=access.road.length)waterClearance=Math.min(waterClearance,MathUtils.smoothstep(branch.away,scenic?8:6,scenic?13:10));
  }
  const land=-.16+forest*ridge*MathUtils.smoothstep(road.away,scenic?7:28,scenic?85:130)*shoreRise*accessSlope;
  if(radius>=1.15)return land;
  const basin=radius<=1?MathUtils.lerp(-3,LAKE_LEVEL,Math.pow(radius,4)):MathUtils.lerp(LAKE_LEVEL,land,MathUtils.smoothstep(radius,1,1.15));
  return MathUtils.lerp(land,Math.min(land,basin),scenic?waterClearance:accessSlope);
}
const trail=new CatmullRomCurve3([[0,8],[6,-12],[12,-35],[3,-65],[-15,-105]].map(([x,z])=>stopLocalPoint('trailhead',x,0,z)),false,'centripetal');
trail.arcLengthDivisions=300;
export function trailPoint(progress:number){const p=trail.getPointAt(MathUtils.clamp(progress,0,1));p.y=landHeight(p.x,p.z);return p;}
export function trailView(){const target=lakeFrame.point.clone();target.y=4;return target;}
export const trailSamples=Array.from({length:80},(_,i)=>trailPoint(i/79));
export function nearTrail(point:Vector3,width=3){return trailSamples.some(sample=>(sample.x-point.x)**2+(sample.z-point.z)**2<width*width);}
