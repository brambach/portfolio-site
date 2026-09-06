import { MathUtils } from 'three';

// Metres per second to crank RPM in each gear. Dashboard and audio share this state.
const ratios=[0,420,285,215,165,125];
export class EngineSound {
  rpm=0;
  gear=1;
  load=0;
  private speed=0;
  private manualHold=0;
  get speedLimit(){return 7000/ratios[this.gear];}
  shift(direction: -1 | 1, speed: number) {
    const next=MathUtils.clamp(this.gear+direction,1,5);
    if(next===this.gear || speed*ratios[next]>7000)return false;
    this.gear=next;
    this.manualHold=8;
    return true;
  }
  update(speed:number,running:boolean,gas:boolean|number,brake:boolean,dt:number,blipping=false) {
    dt=MathUtils.clamp(dt,.001,.15);
    const throttle=MathUtils.clamp(Number(gas),0,1);
    const acceleration=(speed-this.speed)/dt;this.speed=speed;
    this.manualHold=Math.max(0,this.manualHold-dt);
    const shiftAt=throttle>=.65?6950:4100;
    const atRedline=throttle>0&&speed*ratios[this.gear]>=6950;
    if(running && this.gear<5 && (this.manualHold===0||atRedline) && speed*ratios[this.gear]>shiftAt){this.gear++;this.manualHold=0;}
    else if(running && this.gear>1 && (this.manualHold===0||speed*ratios[this.gear]<1200) && speed*ratios[this.gear]<1900)this.gear--;
    if(speed<.2)this.gear=1;
    const clutch=speed<3 ? 920+480*throttle : 920;
    const target=running?Math.min(7000,Math.max(clutch,speed*ratios[this.gear],blipping?6200:0)):0;
    this.rpm=MathUtils.damp(this.rpm,target,running?12:8,dt);
    this.load=MathUtils.damp(this.load,running?MathUtils.clamp(.12+Math.max(0,acceleration)*.09+throttle*.5-(brake?.4:0),0,1):0,8,dt);
    return {rpm:this.rpm,gear:this.gear,load:this.load};
  }
}
