import { MathUtils } from 'three';

// Metres per second to crank RPM in each gear. Dashboard and audio share this state.
const ratios=[0,420,285,215,165,125];
const CRUISE_UPSHIFT_RPM=3000;
const CRUISE_SETTLE_MIN_RPM=2000;
const FEEDBACK_SHIFT_DWELL=.45;
const FEEDBACK_DOWNSHIFT_RPM=1450;
const FEEDBACK_KICKDOWN_RPM=2600;
const RPM_RISE_PER_SECOND=4200;
const RPM_FALL_PER_SECOND=5200;
export class EngineSound {
  rpm=0;
  gear=1;
  load=0;
  private speed=0;
  private manualHold=0;
  private feedbackGear=1;
  private feedbackShiftDwell=0;
  private lastMechanicalGear=1;
  reset(){this.rpm=0;this.gear=1;this.feedbackGear=1;this.feedbackShiftDwell=0;this.lastMechanicalGear=1;this.load=0;this.speed=0;this.manualHold=0;}
  setState(rpm:number,gear=this.gear,speed=this.speed){this.rpm=rpm;this.gear=gear;this.feedbackGear=gear;this.feedbackShiftDwell=0;this.lastMechanicalGear=gear;this.speed=speed;}
  get speedLimit(){return 7000/ratios[this.gear];}
  shift(direction: -1 | 1, speed: number) {
    const next=MathUtils.clamp(this.gear+direction,1,5);
    if(next===this.gear || speed*ratios[next]>7000)return false;
    this.gear=next;
    this.feedbackGear=next;
    this.feedbackShiftDwell=0;
    this.lastMechanicalGear=next;
    this.manualHold=8;
    return true;
  }
  private feedbackTarget(speed:number,throttle:number,brake:boolean,lowLoadCruise:boolean) {
    let target=this.feedbackGear;
    if(lowLoadCruise) {
      for(let next=this.feedbackGear+1;next<=5;next++) {
        const nextRpm=speed*ratios[next];
        if(nextRpm<CRUISE_SETTLE_MIN_RPM)break;
        if(nextRpm<=CRUISE_UPSHIFT_RPM)target=next;
      }
    } else if(throttle>=.65 || this.gear>this.feedbackGear) target=this.gear;
    const displayedRpm=speed*ratios[this.feedbackGear];
    if(speed<.2)target=1;
    else if(this.feedbackGear>1 && (displayedRpm<FEEDBACK_DOWNSHIFT_RPM || (throttle>=.65&&displayedRpm<FEEDBACK_KICKDOWN_RPM))) {
      target=Math.min(target,this.feedbackGear-1);
    }
    if(brake&&this.feedbackGear>1&&displayedRpm<1900)target=Math.min(target,this.feedbackGear-1);
    return MathUtils.clamp(target,1,5);
  }
  update(speed:number,running:boolean,gas:boolean|number,brake:boolean,dt:number,blipping=false) {
    dt=MathUtils.clamp(dt,.001,.15);
    if(this.gear!==this.lastMechanicalGear) {
      this.feedbackGear=this.gear;
      this.feedbackShiftDwell=0;
      this.lastMechanicalGear=this.gear;
    }
    const throttle=MathUtils.clamp(Number(gas),0,1);
    const acceleration=(speed-this.speed)/dt;this.speed=speed;
    this.manualHold=Math.max(0,this.manualHold-dt);
    this.feedbackShiftDwell=Math.max(0,this.feedbackShiftDwell-dt);
    const lowLoadCruise=throttle>0&&throttle<=.35&&Math.abs(acceleration)<.45&&!brake&&this.manualHold===0;
    const shiftAt=throttle>=.65?6950:4100;
    const atRedline=throttle>0&&speed*ratios[this.gear]>=6950;
    if(running && this.gear<5 && (this.manualHold===0||atRedline) && speed*ratios[this.gear]>shiftAt){this.gear++;this.manualHold=0;}
    else if(running && this.gear>1 && (this.manualHold===0||speed*ratios[this.gear]<1200) && speed*ratios[this.gear]<1900)this.gear--;
    if(speed<.2)this.gear=1;
    this.lastMechanicalGear=this.gear;
    if(speed<.2) {
      this.feedbackGear=1;
      this.feedbackShiftDwell=0;
    }
    const targetGear=running?this.feedbackTarget(speed,throttle,brake,lowLoadCruise):1;
    if(targetGear!==this.feedbackGear&&this.feedbackShiftDwell===0) {
      this.feedbackGear+=Math.sign(targetGear-this.feedbackGear);
      this.feedbackShiftDwell=FEEDBACK_SHIFT_DWELL;
    }
    const clutch=speed<3 ? 920+480*throttle : 920;
    const target=running?Math.min(7000,Math.max(clutch,speed*ratios[this.feedbackGear],blipping?6200:0)):0;
    const smoothed=MathUtils.damp(this.rpm,target,running?12:8,dt);
    this.rpm=MathUtils.clamp(smoothed,this.rpm-RPM_FALL_PER_SECOND*dt,this.rpm+RPM_RISE_PER_SECOND*dt);
    this.load=MathUtils.damp(this.load,running?MathUtils.clamp(.12+Math.max(0,acceleration)*.09+throttle*.5-(brake?.4:0),0,1):0,8,dt);
    return {rpm:this.rpm,gear:this.feedbackGear,load:this.load};
  }
}
