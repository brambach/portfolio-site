import type {RoadGeometry} from './road-geometry';

const plans=new WeakMap<RoadGeometry,Float32Array>();
const spacing=8,topSpeed=28;
function plan(road:RoadGeometry){
  let speeds=plans.get(road);if(speeds)return speeds;
  speeds=new Float32Array(Math.ceil(road.length/spacing)+1);
  for(let i=0;i<speeds.length;i++){
    const distance=Math.min(road.length,i*spacing),a=road.frame(distance-4),b=road.frame(distance+4);
    const bend=Math.abs(Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw)))/8;
    speeds[i]=Math.min(topSpeed,Math.sqrt(4.5/Math.max(bend,.0001)));
  }
  plans.set(road,speeds);return speeds;
}
export function turboCruiseSpeed(road:RoadGeometry,distance:number,speed:number){
  const speeds=plan(road),lookahead=Math.max(56,speed*speed/11+24);
  let target=topSpeed;
  for(let ahead=0;ahead<=lookahead;ahead+=spacing){
    const d=((distance+ahead)%road.length+road.length)%road.length;
    const index=Math.floor(d/spacing),corner=Math.min(speeds[index],speeds[Math.min(index+1,speeds.length-1)]);
    target=Math.min(target,Math.sqrt(corner*corner+11*Math.max(0,ahead-16)));
  }
  return target;
}
