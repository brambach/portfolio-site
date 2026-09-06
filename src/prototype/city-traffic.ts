import {MathUtils,type Vector3} from 'three';
import {cityRoad} from './city-path';
import {BOULEVARD_PROFILE,type RoadProfile} from './road-profile';
import type {RoadGeometry} from './road-geometry';

export type TrafficCar={distance:number;lane:number;direction:1|-1;speed:number;targetSpeed:number;braking:boolean;colour:string;acknowledgement:number};
export class CityTraffic {
  readonly cars:TrafficCar[]=[];
  private hornCooldown=0;
  constructor(readonly road:RoadGeometry=cityRoad,profile:RoadProfile=BOULEVARD_PROFILE) {
    const colours=['#8c8b83','#333f51','#773b37','#bac1c3','#47423d','#233b38'];
    const lanes=profile.trafficLanes,groupSize=lanes.length*2;
    for(let i=0;i<profile.trafficCount;i++) {
      const slot=i%groupSize,direction=slot<lanes.length?1:-1;
      const lane=direction*lanes[slot%lanes.length];
      const distance=55+Math.floor(i/groupSize)*this.road.length/(profile.trafficCount/groupSize)+slot*34;
      const targetSpeed=(slot%lanes.length?17:13)+(i%3)*.7;
      this.cars.push({distance,lane,direction,speed:targetSpeed,targetSpeed,braking:false,colour:colours[i%colours.length],acknowledgement:0});
    }
  }
  honk(player:{point:Vector3;yaw:number}) {
    if(this.hornCooldown>0)return false;
    let nearest:TrafficCar|undefined,range=35;
    for(const car of this.cars){
      const pose=this.pose(car),dx=pose.point.x-player.point.x,dz=pose.point.z-player.point.z;
      const forward=dx*Math.sin(player.yaw)+dz*Math.cos(player.yaw),side=dx*Math.cos(player.yaw)-dz*Math.sin(player.yaw);
      const distance=Math.hypot(dx,dz);
      if(forward<4||Math.abs(side)>3||Math.cos(pose.yaw-player.yaw)<.7||distance>=range)continue;
      nearest=car;range=distance;
    }
    if(!nearest)return false;
    nearest.acknowledgement=1.8;this.hornCooldown=4;return true;
  }
  forwardGap(distance:number,lane:number) {
    let gap=Infinity,speed=0;
    for(const car of this.cars) {
      if(car.direction!==1 || Math.abs(car.lane-lane)>1.8)continue;
      const d=MathUtils.euclideanModulo(car.distance-distance,this.road.length)-4.8;
      if(d<gap){gap=d;speed=car.speed;}
    }
    return {gap,speed};
  }
  mergeClear(distance:number,lane:number,arrival:number,speed:number) {
    for(const car of this.cars){
      if(car.direction!==1||Math.abs(car.lane-lane)>1.8)continue;
      const gap=MathUtils.euclideanModulo(car.distance+car.speed*arrival-distance+this.road.length/2,this.road.length)-this.road.length/2;
      // Allow for the player accelerating while approaching the merge point.
      const start=gap-car.speed*Math.min(arrival,1.5),end=gap+(car.speed-speed)*2;
      const rear=10+Math.max(0,car.speed-speed)*1.2,front=10+speed*.8;
      if(Math.min(start,gap,end)<front&&Math.max(start,gap,end)>-rear)return false;
    }
    return true;
  }
  update(dt:number,player:{distance:number;lane:number;speed:number}) {
    this.hornCooldown=Math.max(0,this.hornCooldown-dt);
    for(const car of this.cars)car.acknowledgement=Math.max(0,car.acknowledgement-dt);
    // Compute every target from the same frame, then move all cars together.
    const targets=this.cars.map(car=>{
      let target=car.targetSpeed;
      // Include the distance needed to shed closing speed before the usual following gap.
      const distanceTo=(distance:number)=>MathUtils.euclideanModulo((distance-car.distance)*car.direction,this.road.length)-4.8;
      for(const other of this.cars) {
        if(other===car || other.lane!==car.lane)continue;
        const gap=distanceTo(other.distance);
        const brakingGap=Math.max(0,(car.speed*car.speed-other.speed*other.speed)/14);
        if(gap<8+Math.max(car.speed*1.1,brakingGap))target=Math.min(target,Math.max(0,other.speed+(gap-8)*.6),Math.sqrt(other.speed*other.speed+14*Math.max(0,gap-8)));
      }
      if(Math.abs(player.lane-car.lane)<1.8) {
        const gap=distanceTo(player.distance);
        const aheadSpeed=car.direction===1?player.speed:0;
        const brakingGap=Math.max(0,(car.speed*car.speed-aheadSpeed*aheadSpeed)/14);
        if(gap<8+Math.max(car.speed*1.2,brakingGap))target=Math.min(target,car.direction===1?Math.max(0,player.speed+(gap-8)*.6):0,Math.sqrt(aheadSpeed*aheadSpeed+14*Math.max(0,gap-8)));
      }
      return target;
    });
    this.cars.forEach((car,i)=>{
      car.braking=targets[i]<car.speed-.8*dt;
      car.speed=Math.max(0,car.speed+MathUtils.clamp(targets[i]-car.speed,-7*dt,2*dt));
      car.distance=MathUtils.euclideanModulo(car.distance+car.speed*car.direction*dt,this.road.length);
    });
  }
  collision(distance:number,lane:number) {
    return this.cars.find(car=>{
      const gap=Math.abs(MathUtils.euclideanModulo(car.distance-distance+this.road.length/2,this.road.length)-this.road.length/2);
      return gap<4.6 && Math.abs(car.lane-lane)<1.7;
    });
  }
  pose(car:TrafficCar) {const frame=this.road.frame(car.distance,car.lane);return {...frame,yaw:frame.yaw+(car.direction===1?0:Math.PI)};}
}

// A short reaction delay followed by two amber flashes.
export function trafficAcknowledgementLit(remaining:number){
  const elapsed=1.8-remaining;
  return remaining>0&&((elapsed>=.3&&elapsed<.65)||(elapsed>=.95&&elapsed<1.3));
}
