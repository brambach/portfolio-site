import {MathUtils,type Vector3} from 'three';
import {cityRoad} from './city-path';
import {BOULEVARD_PROFILE,type RoadProfile} from './road-profile';
import type {RoadGeometry} from './road-geometry';

export type TrafficCar={distance:number;lane:number;direction:1|-1;speed:number;targetSpeed:number;braking:boolean;colour:string;acknowledgement:number;pullOver?:TrafficPullOver};
type TrafficPullOver={phase:'waiting'|'pulling'|'passing'|'rejoining';lane:number;shoulder:number;retry:number;age:number;originalSpeed:number};
export type TrafficPlayer={distance:number;lane:number;speed:number;automatic?:boolean;access?:boolean;phase?:string;cruiseSpeed?:number;race?:boolean};
type TrafficOptions={shoulderClear?:(distance:number,lane:number,car:TrafficCar)=>boolean};
export type TrafficEncounter={phase:'prompt'|'waiting'|'pulling'|'passing'|'rejoining';carIndex:number;distance:number;lane:number;speed:number;homeLane:number};
export class CityTraffic {
  readonly cars:TrafficCar[]=[];
  private hornCooldown=0;
  private followCandidate:TrafficCar|null=null;
  private followTime=0;
  constructor(readonly road:RoadGeometry=cityRoad,readonly profile:RoadProfile=BOULEVARD_PROFILE,private options:TrafficOptions={}) {
    const colours=['#8c8b83','#333f51','#773b37','#bac1c3','#47423d','#233b38'];
    const lanes=profile.trafficLanes,groupSize=lanes.length*2;
    for(let i=0;i<profile.trafficCount;i++) {
      const slot=i%groupSize,direction=slot<lanes.length?1:-1;
      const lane=direction*lanes[slot%lanes.length];
      const scenicLead=profile.trafficLanes.length===1&&direction===1&&i===2;
      const distance=scenicLead?this.road.length*.07:55+Math.floor(i/groupSize)*this.road.length/(profile.trafficCount/groupSize)+slot*34;
      const targetSpeed=scenicLead?14.4:(slot%lanes.length?17:13)+(i%3)*.7;
      this.cars.push({distance,lane,direction,speed:targetSpeed,targetSpeed,braking:false,colour:colours[i%colours.length],acknowledgement:0});
    }
  }
  private forwardCar(player:TrafficPlayer,range=35,slowOnly=false) {
    let nearest:TrafficCar|undefined,nearestGap=range;
    if(player.phase&&player.phase!=='driving')return undefined;
    if(player.access)return undefined;
    for(const car of this.cars){
      if(car.direction!==1||Math.abs(car.lane-player.lane)>1.8)continue;
      const gap=MathUtils.euclideanModulo(car.distance-player.distance,this.road.length)-4.8;
      if(gap<4||gap>=nearestGap)continue;
      const slowLimit=Math.max(8,(player.cruiseSpeed??player.speed)-1.2);
      if(slowOnly&&car.targetSpeed>=slowLimit&&car.speed>=slowLimit)continue;
      nearest=car;nearestGap=gap;
    }
    return nearest;
  }
  private updateFollowPrompt(dt:number,player:TrafficPlayer) {
    const candidate=player.automatic&&!player.race?this.forwardCar(player,42,true):undefined;
    if(candidate&&candidate===this.followCandidate)this.followTime+=dt;
    else {this.followCandidate=candidate??null;this.followTime=candidate?dt:0;}
  }
  hornPrompt(player:TrafficPlayer) {
    return Boolean(player.automatic&&player.phase==='driving'&&!player.access&&!player.race&&this.followCandidate&&this.followTime>=1&&this.forwardCar(player,42,true)===this.followCandidate&&this.hornCooldown===0);
  }
  private shoulderLane(car:TrafficCar) {
    const side=Math.sign(car.lane)||1;
    return side*Math.min(this.profile.shoulderHalfWidth-1.35,Math.max(this.profile.pavedHalfWidth+1.4,Math.abs(car.lane)+2.6));
  }
  private shoulderClear(car:TrafficCar) {
    const shoulder=this.shoulderLane(car);
    if(Math.abs(shoulder)>this.road.halfWidth-1.1)return null;
    for(const other of this.cars){
      if(other===car)continue;
      const gap=Math.abs(MathUtils.euclideanModulo(other.distance-car.distance+this.road.length/2,this.road.length)-this.road.length/2);
      if(gap<18&&Math.abs(other.lane-shoulder)<2.2)return null;
    }
    if(this.options.shoulderClear&&!this.options.shoulderClear(car.distance,shoulder,car))return null;
    return shoulder;
  }
  private homeLaneClear(car:TrafficCar,player:TrafficPlayer) {
    const home=car.pullOver?.lane??car.lane;
    const playerGap=MathUtils.euclideanModulo(player.distance-car.distance+this.road.length/2,this.road.length)-this.road.length/2;
    if(playerGap<15)return false;
    for(const other of this.cars){
      if(other===car||other.direction!==1||Math.abs(other.lane-home)>1.8)continue;
      const gap=MathUtils.euclideanModulo(other.distance-car.distance+this.road.length/2,this.road.length)-this.road.length/2;
      if(gap>-12&&gap<22)return false;
    }
    return true;
  }
  trafficEncounter(player:TrafficPlayer):TrafficEncounter|null {
    const active=this.cars.find(car=>car.pullOver);
    const car=active??(this.hornPrompt(player)?this.followCandidate:null);
    if(!car)return null;
    const index=this.cars.indexOf(car);
    if(index<0)return null;
    return {phase:car.pullOver?.phase??'prompt',carIndex:index,distance:car.distance,lane:car.lane,speed:car.speed,homeLane:car.pullOver?.lane??car.lane};
  }
  honk(player:{point:Vector3;yaw:number},context?:TrafficPlayer) {
    const eligible=Boolean(context&&this.hornPrompt(context));
    if(this.hornCooldown>0)return false;
    let nearest:TrafficCar|undefined=eligible&&this.followCandidate?this.followCandidate:undefined,range=42;
    if(!nearest){
      for(const car of this.cars){
        const pose=this.pose(car),dx=pose.point.x-player.point.x,dz=pose.point.z-player.point.z;
        const forward=dx*Math.sin(player.yaw)+dz*Math.cos(player.yaw),side=dx*Math.cos(player.yaw)-dz*Math.sin(player.yaw);
        const distance=Math.hypot(dx,dz);
        if(forward<4||Math.abs(side)>3||Math.cos(pose.yaw-player.yaw)<.7||distance>=range)continue;
        nearest=car;range=distance;
      }
    }
    if(!nearest)return false;
    nearest.acknowledgement=1.8;this.hornCooldown=4;
    if(context&&eligible&&nearest===this.followCandidate&&!nearest.pullOver){
      const shoulder=this.shoulderClear(nearest);
      nearest.pullOver={phase:shoulder===null?'waiting':'pulling',lane:nearest.lane,shoulder:shoulder??this.shoulderLane(nearest),retry:.35,age:0,originalSpeed:nearest.targetSpeed};
    }
    return true;
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
  update(dt:number,player:TrafficPlayer) {
    this.hornCooldown=Math.max(0,this.hornCooldown-dt);
    for(const car of this.cars)car.acknowledgement=Math.max(0,car.acknowledgement-dt);
    this.updateFollowPrompt(dt,player);
    // Compute every target from the same frame, then move all cars together.
    const targets=this.cars.map(car=>{
      let target=car.targetSpeed;
      if(car.pullOver){
        car.pullOver.age+=dt;car.pullOver.retry-=dt;
        if((player.phase&&player.phase!=='driving')||player.access||player.race)car.pullOver.phase='rejoining';
        if(car.pullOver.phase==='waiting'&&car.pullOver.retry<=0){
          const shoulder=this.shoulderClear(car);
          if(shoulder!==null){car.pullOver.shoulder=shoulder;car.pullOver.phase='pulling';}
          car.pullOver.retry=.55;
        }
        const gapToPlayer=MathUtils.euclideanModulo(player.distance-car.distance+this.road.length/2,this.road.length)-this.road.length/2;
        if((car.pullOver.phase==='pulling'||car.pullOver.phase==='passing')&&Math.abs(car.lane-car.pullOver.shoulder)<.35)car.pullOver.phase='passing';
        if(car.pullOver.phase==='passing'&&this.homeLaneClear(car,player))car.pullOver.phase='rejoining';
        if(car.pullOver.phase==='waiting'&&car.pullOver.age>8){car.targetSpeed=car.pullOver.originalSpeed;car.pullOver=undefined;return target;}
        const safeBehind=gapToPlayer>15;
        target=Math.min(target,car.pullOver.phase==='rejoining'&&safeBehind?Math.max(5,Math.min(player.speed-1,car.pullOver.originalSpeed)):Math.max(3,Math.min(8,player.speed-3)));
      }
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
      if(car.pullOver){
        const targetLane=car.pullOver.phase==='waiting'||car.pullOver.phase==='rejoining'?car.pullOver.lane:car.pullOver.shoulder;
        car.lane=MathUtils.damp(car.lane,targetLane,car.pullOver.phase==='rejoining'?1.6:1.25,dt);
        if(car.pullOver.phase==='rejoining'&&Math.abs(car.lane-car.pullOver.lane)<.08){car.lane=car.pullOver.lane;car.targetSpeed=car.pullOver.originalSpeed;car.pullOver=undefined;}
      }
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
