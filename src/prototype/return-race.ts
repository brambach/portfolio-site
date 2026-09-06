import {CityTraffic} from "./city-traffic";
import {MathUtils} from 'three';
import type {CityDrive} from './city-route';

export type RaceState={phase:'idle'|'countdown'|'racing'|'finished';countdown:number;elapsed:number;remaining:number;progress:number};
export const idleRace:RaceState={phase:'idle',countdown:3,elapsed:0,remaining:0,progress:0};

export class ReturnRace {
  state:RaceState={...idleRace};
  private startsAt=0;
  private origin=0;
  private finish=0;
  constructor(private drive:CityDrive){}
  start(now:number){
    if(this.drive.stoppedAt!=='lake'||this.state.phase==='racing'||this.state.phase==='countdown')return false;
    this.drive.clearInput();this.drive.speed=0;this.drive.engineOn=true;
    const traffic=new CityTraffic(this.drive.road,this.drive.profile);
    this.drive.traffic.cars.forEach((car,index)=>Object.assign(car,traffic.cars[index]));
    this.drive.requiredStop=null;this.drive.requiredApproach=false;
    this.origin=this.drive.distance;
    this.finish=this.origin+MathUtils.euclideanModulo(this.drive.road.length*.025-this.origin,this.drive.road.length);
    this.startsAt=now+3000;
    this.state={phase:'countdown',countdown:3,elapsed:0,remaining:this.finish-this.origin,progress:0};
    return true;
  }
  update(now:number){
    if(this.state.phase==='countdown'){
      this.drive.clearInput();
      this.state.countdown=Math.max(0,Math.ceil((this.startsAt-now)/1000));
      if(now<this.startsAt)return;
      this.drive.tourAutopilot=false;this.drive.setAutomatic(false);this.drive.turbo=false;
      this.drive.destination=null;this.drive.phase='driving';
      this.state.phase='racing';
    }
    if(this.state.phase!=='racing')return;
    this.state.elapsed=Math.max(0,now-this.startsAt);
    this.state.remaining=Math.max(0,this.finish-this.drive.distance);
    this.state.progress=MathUtils.clamp((this.drive.distance-this.origin)/(this.finish-this.origin),0,1);
    if(!this.drive.access&&this.drive.distance>=this.finish){
      this.state.phase='finished';this.drive.clearInput();this.drive.park();
    }
  }
  cancel(){this.state={...idleRace};this.drive.clearInput();this.drive.tourAutopilot=true;this.drive.setAutomatic(true);this.drive.park();}
  get active(){return this.state.phase==='countdown'||this.state.phase==='racing';}
}
export function raceTime(milliseconds:number){
  const total=Math.floor(milliseconds/1000),minutes=Math.floor(total/60),seconds=total%60;
  return `${minutes}:${String(seconds).padStart(2,'0')}.${String(Math.floor(milliseconds%1000)).padStart(3,'0')}`;
}
