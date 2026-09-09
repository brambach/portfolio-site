import type {RoadGeometry} from './road-geometry';

export type CruisePaceConfig={
  topSpeed:number;
  lateralAcceleration:number;
  longitudinalDeceleration:number;
  spacing?:number;
  lookaheadBase?:number;
  brakingBuffer?:number;
};

const turboConfig:Required<CruisePaceConfig>={topSpeed:28,lateralAcceleration:4.5,longitudinalDeceleration:5.5,spacing:8,lookaheadBase:56,brakingBuffer:16};
const plans=new WeakMap<RoadGeometry,Map<string,Float32Array>>();
function resolved(config:CruisePaceConfig):Required<CruisePaceConfig>{
  return {...turboConfig,...config};
}
function key(config:Required<CruisePaceConfig>){
  return [config.topSpeed,config.lateralAcceleration,config.longitudinalDeceleration,config.spacing,config.lookaheadBase,config.brakingBuffer].join(':');
}
function plan(road:RoadGeometry,pace:Required<CruisePaceConfig>){
  let roadPlans=plans.get(road);
  if(!roadPlans){roadPlans=new Map();plans.set(road,roadPlans);}
  const cacheKey=key(pace),cached=roadPlans.get(cacheKey);if(cached)return cached;
  const spacing=pace.spacing,topSpeed=pace.topSpeed;
  const speeds=new Float32Array(Math.ceil(road.length/spacing)+1);
  for(let i=0;i<speeds.length;i++){
    const distance=Math.min(road.length,i*spacing),a=road.frame(distance-4),b=road.frame(distance+4);
    const bend=Math.abs(Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw)))/8;
    speeds[i]=Math.min(topSpeed,Math.sqrt(pace.lateralAcceleration/Math.max(bend,.0001)));
  }
  roadPlans.set(cacheKey,speeds);return speeds;
}
export function plannedCruiseSpeed(road:RoadGeometry,distance:number,speed:number,config:CruisePaceConfig){
  const pace=resolved(config),speeds=plan(road,pace),spacing=pace.spacing,lookahead=Math.max(pace.lookaheadBase,speed*speed/(2*pace.longitudinalDeceleration)+24);
  let target=pace.topSpeed;
  for(let ahead=0;ahead<=lookahead;ahead+=spacing){
    const d=((distance+ahead)%road.length+road.length)%road.length;
    const index=Math.floor(d/spacing),corner=Math.min(speeds[index],speeds[Math.min(index+1,speeds.length-1)]);
    target=Math.min(target,Math.sqrt(corner*corner+2*pace.longitudinalDeceleration*Math.max(0,ahead-pace.brakingBuffer)));
  }
  return target;
}
export function turboCruiseSpeed(road:RoadGeometry,distance:number,speed:number){
  return plannedCruiseSpeed(road,distance,speed,turboConfig);
}
