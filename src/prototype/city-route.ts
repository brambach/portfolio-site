import {MathUtils} from 'three';
import type {DriveInput, DrivePhase} from './forest-route';
import {cityRoad} from './city-path';
import type {RoadGeometry} from './road-geometry';
import {journeyRoad,journeyAccess,type JourneyAccess,type JourneyStopId} from './journey-route';
import {CityTraffic,type TrafficCar} from './city-traffic';
import {manualYawRate,roadsideResponse,trafficResponse} from './driving-response';
import {turboCruiseSpeed} from './cruise-pace';
import {EngineSound} from './engine-sound';
import {BOULEVARD_PROFILE,type RoadProfile} from './road-profile';
export {CITY_LENGTH,CITY_STOP,CITY_HALF_WIDTH,cityFrame,nearestCityRoad} from './city-path';

export class CityDrive {
  readonly traffic:CityTraffic;
  constructor(readonly road:RoadGeometry=cityRoad,readonly cruiseSpeed=19,readonly accessRoads:readonly JourneyAccess[]=road===journeyRoad?journeyAccess:[],readonly profile:RoadProfile=BOULEVARD_PROFILE) {
    this.traffic=new CityTraffic(road,profile);this.lane=profile.cruiseLane;this.nextOverlook=road.cruiseStop;
    this.position=road.frame(0,profile.cruiseLane).point;this.yaw=road.frame(0).yaw;
  }
  access:JourneyAccess|null=null;
  accessDistance=0;
  private accessLane=0;
  get stoppedAt():JourneyStopId|null{return this.phase==='parked'&&this.access&&Math.abs(this.accessDistance-this.access.parking)<12?this.access.id:null;}
  reviewAt(id:JourneyStopId,distance?:number){
    const access=this.accessRoads.find(candidate=>candidate.id===id);
    if(!access)throw new Error(`This road doesn't include ${id}.`);
    this.distance=distance??access.centre;
    this.access=access;this.accessDistance=this.access.parking;this.accessLane=.7;
    this.position.copy(this.access.road.frame(this.accessDistance,this.accessLane).point);this.yaw=this.access.road.frame(this.accessDistance).yaw;
    this.syncMainPosition();this.phase='parked';this.speed=0;
  }
  private syncMainPosition(){const pose=this.road.nearest(this.position.x,this.position.z);this.distance+=MathUtils.euclideanModulo(pose.distance-this.distance+this.road.length/2,this.road.length)-this.road.length/2;this.lane=pose.lane;}
  private selectedAccess(){const destination=MathUtils.euclideanModulo(this.destination??this.road.cruiseStop,this.road.length);return this.accessRoads.find(access=>Math.abs(access.centre-destination)<1)??null;}
  private joinAccess(access:JourneyAccess){const nearest=access.road.nearest(this.position.x,this.position.z);this.access=access;this.accessDistance=nearest.distance;this.accessLane=nearest.lane;}
  ahead(metres=3){return this.access?this.access.road.frame(this.accessDistance+metres):this.road.frame(this.distance+metres);}
  // The first lake stop is part of the introduction. Free driving resumes after arrival.
  requiredStop:JourneyStopId|null=null;
  requiredApproach=false;
  requireStop(id:JourneyStopId){this.requiredStop=id;}
  destination:number|null=null;
  navigate(distance:number) {
    if(this.requiredApproach) return;
    this.destination=distance;this.nextOverlook=this.planNextStop();
    this.speedHold=null;this.automatic=true;this.clearInput();
  }
  private planNextStop(){
    const access=this.selectedAccess(),gap=MathUtils.euclideanModulo((this.destination??this.road.cruiseStop)-this.distance,this.road.length);
    const alreadyApproaching=access?.id===this.access?.id&&this.access&&this.accessDistance<this.access.parking-2;
    let next=this.distance+gap;
    if(gap<60&&!alreadyApproaching)next+=this.road.length;
    if(access&&!this.access&&next-this.distance<150)next+=this.road.length;
    return next;
  }
  readonly engine=new EngineSound();
  engineState={rpm:0,gear:1,load:0};
  private appliedThrottle=0;
  private blip=0;
  collisionTime=0;
  private lastContact:TrafficCar|null=null;
  private contactCooldown=0;
  shift(direction:-1|1) {
    if(!this.engineOn)return false;
    if(this.tourAutopilot)return false;
    return this.engine.shift(direction,this.speed);
  }
  rev(){if(this.engineOn && this.phase==='parked')this.blip=1.1;}
  phase: DrivePhase = 'off';
  distance = 0;
  speed = 0;
  lane = 2.1;
  steering = 0;
  heading = 0;
  acceleration = 0;
  startup = 0;
  engineOn = false;
  automatic = false;
  tourAutopilot = false;
  input(key:DriveInput,pressed:boolean){
    if(this.tourAutopilot && key!=="brake")return;
    if(pressed&&!this.tourAutopilot)this.automatic=false;
    this.controls[key]=pressed;
  }
  turbo=false;
  setTurbo(value:boolean){this.turbo=value;this.setAutomatic(true);}
  speedHold:number|null = null;
  setSpeedHold(enabled:boolean){
    if(this.tourAutopilot)return;
    this.speedHold=enabled && this.phase==='driving' && this.speed>=2.8?this.speed:null;
    if(this.speedHold!==null){this.automatic=false;this.controls.gas=this.controls.brake=false;this.acceleration=0;}
  }
  nextOverlook:number;
  controls: Record<DriveInput,boolean> = {left:false,right:false,gas:false,brake:false};
  position;
  yaw:number;
  private stop: {time:number;duration:number;speed:number;creep:number;distance:number;lane:number;heading:number;access:JourneyAccess|null;exitDistance:number} | null = null;
  pose() {return {...(this.access?this.access.road.frame(this.accessDistance):this.road.frame(this.distance)),point:this.position.clone(),yaw:this.yaw};}
  setAutomatic(value: boolean) {
    this.speedHold=null;this.automatic=this.tourAutopilot||value;this.clearInput();
    if(value&&!this.requiredApproach)this.nextOverlook=this.planNextStop();
  }
  start() {
    if (['starting','driving','parking'].includes(this.phase)) return;
    this.speedHold=null;this.phase='starting';this.startup=0;this.acceleration=0;
    if(!this.requiredApproach)this.nextOverlook=this.planNextStop();
  }
  stopEngine(){if(this.phase!=="parked"&&this.phase!=="off")return false;this.engineOn=false;this.clearInput();return true;}
  clearInput() {for(const key of Object.keys(this.controls) as DriveInput[]) this.controls[key]=false;}
  park() {
    this.speedHold=null;
    this.clearInput();
    if (this.phase==='starting' || this.speed<.05) {
      this.phase='parked';this.speed=this.acceleration=0;return;
    }
    if(this.phase!=='driving') return;
    const {creep,duration}=this.parkingMotion();
    this.stop={time:0,duration,speed:this.speed,creep,distance:this.access?this.accessDistance:this.distance,lane:this.access?this.accessLane:this.lane,heading:this.heading,access:this.access,exitDistance:this.access?this.distance+MathUtils.euclideanModulo(this.access.exit-this.distance,this.road.length):0};
    this.phase='parking';
  }
  private parkingMotion() {
    if(this.speed<.05)return {creep:0,duration:2.5};
    const laneShift=Math.abs((this.access ? .7 : this.profile.parkingLane)-(this.access?this.accessLane:this.lane));
    // Reserve forward room for the arc continuously across crawl and road speeds.
    const creep=Math.max(0,3-this.speed)*MathUtils.smoothstep(laneShift,0,.2);
    const duration=Math.max(2.5,1.5*this.speed/7,10*laneShift/Math.max(this.speed+creep,.05));
    return {creep,duration};
  }
  update(dt: number, ready=true, reduced=false) {
    let remaining=MathUtils.clamp(dt,0,.25);
    while(remaining>.000001) {
      const step=Math.min(remaining,1/120);
      this.appliedThrottle=0;
      if(this.phase!=="off")this.traffic.update(step,this);
      this.step(step,ready,reduced);
      this.blip=Math.max(0,this.blip-step);
      this.collisionTime=Math.max(0,this.collisionTime-step);
      if(this.stoppedAt===this.requiredStop){this.requiredStop=null;this.requiredApproach=false;}
      this.engineState=this.engine.update(this.speed,this.engineOn,this.appliedThrottle,this.controls.brake,step,this.blip>0);
      remaining-=step;
    }
  }

  private step(dt: number,ready: boolean,reduced: boolean) {
    this.contactCooldown=Math.max(0,this.contactCooldown-dt);
    if(this.phase==='starting') {
      if(!ready)return;
      this.startup+=dt;
      if(this.startup>.8)this.engineOn=true;
      if(this.startup<2.1)return;
      if(reduced) {
        const access=this.selectedAccess();if(access){this.distance=this.nextOverlook;this.reviewAt(access.id,this.nextOverlook);return;}
        this.distance=this.nextOverlook;this.lane=this.profile.parkingLane;this.position.copy(this.road.frame(this.distance,this.lane).point);this.yaw=this.road.frame(this.distance).yaw;this.phase='parked';return;
      }
      this.phase='driving';
    }
    if(this.phase==='parking' && this.stop) {
      const stop=this.stop;
      stop.time=Math.min(stop.duration,stop.time+dt);
      const t=stop.time/stop.duration;
      this.speed=stop.speed*(1-3*t*t+2*t*t*t)+stop.creep*Math.sin(Math.PI*t)**2;
      this.acceleration=(-6*stop.speed*t*(1-t)+stop.creep*Math.PI*Math.sin(2*Math.PI*t))/stop.duration;
      this.appliedThrottle=this.acceleration>0?Math.min(.3,this.acceleration/4):0;
      const distance=stop.distance+stop.speed*stop.duration*(t-t*t*t+.5*t*t*t*t)+stop.creep*stop.duration*(t/2-Math.sin(2*Math.PI*t)/(4*Math.PI));
      const lane=MathUtils.lerp(stop.lane,stop.access ? .7 : this.profile.parkingLane,MathUtils.smootherstep(t,0,.78));
      let pose;
      if(stop.access&&distance<stop.access.road.length){
        this.access=stop.access;this.accessDistance=distance;this.accessLane=lane;
        pose=this.access.road.frame(distance,lane);
      }else{
        const passed=stop.access?distance-stop.access.road.length:0;
        this.access=null;this.distance=stop.access?stop.exitDistance+passed:distance;
        this.lane=stop.access?MathUtils.lerp(this.profile.approachLane+lane,this.profile.parkingLane,MathUtils.smoothstep(passed,0,20)):lane;
        pose=this.road.frame(this.distance,this.lane);
      }
      const dx=pose.point.x-this.position.x,dz=pose.point.z-this.position.z,previousYaw=this.yaw;
      const pathYaw=Math.hypot(dx,dz)>.00001?Math.atan2(dx,dz):pose.yaw;
      const pathHeading=Math.atan2(Math.sin(pathYaw-pose.yaw),Math.cos(pathYaw-pose.yaw));
      this.heading=MathUtils.lerp(stop.heading,pathHeading,MathUtils.smoothstep(t,0,.16));
      this.yaw=pose.yaw+this.heading;
      const turn=Math.atan2(Math.sin(this.yaw-previousYaw),Math.cos(this.yaw-previousYaw))/dt;
      const wheel=Math.atan(turn*2.45/Math.max(this.speed,.5))/(.48/(1+this.speed*.085));
      this.steering=MathUtils.damp(this.steering,MathUtils.clamp(wheel,-1,1),12,dt);
      this.position.copy(pose.point);
      if(this.access)this.syncMainPosition();
      if(t===1){this.phase='parked';this.speed=this.acceleration=this.heading=this.steering=0;}
      return;
    }
    if(this.phase!=='driving')return;
    if(this.tourAutopilot){this.automatic=true;this.speedHold=null;this.controls.gas=this.controls.left=this.controls.right=false;}
    if(this.requiredStop){
      const required=this.accessRoads.find(access=>access.id===this.requiredStop);
      if(required){
        const gap=MathUtils.euclideanModulo(required.entry-this.distance+this.road.length/2,this.road.length)-this.road.length/2;
        if(this.requiredApproach || (gap<380&&gap>-30) || this.access?.id===required.id){
          if(!this.requiredApproach){this.destination=required.centre;this.nextOverlook=this.planNextStop();this.requiredApproach=true;}
          const braking=this.controls.brake;
          this.automatic=true;this.speedHold=null;this.clearInput();this.controls.brake=braking;
        }
      }
    }
    const selected=this.selectedAccess();
    const untilEntry=selected?MathUtils.euclideanModulo(selected.entry-this.distance+this.road.length/2,this.road.length)-this.road.length/2:Infinity;
    if(this.automatic&&!this.access&&selected&&untilEntry<=0&&untilEntry>-30&&this.nextOverlook-this.distance<this.road.length/2&&selected.road.nearest(this.position.x,this.position.z).away<selected.road.halfWidth-1.1)this.joinAccess(selected);
    const activeRoad=this.access?.road??this.road,activeDistance=this.access?this.accessDistance:this.distance;
    const road=activeRoad.frame(activeDistance);
    let throttle=this.controls.gas?1:0;
    let desiredSteer=Number(this.controls.left)-Number(this.controls.right);
    const brake=this.controls.brake;
    let automaticBrake=0;
    if(this.controls.gas||brake)this.speedHold=null;
    if(this.speedHold!==null){
      throttle=MathUtils.clamp((.55+this.speed*this.speed*.0025)/9.2+(this.speedHold-this.speed)*.7,0,1);
      automaticBrake=MathUtils.clamp((this.speed-this.speedHold)*2,0,6);
    }
    if(this.automatic) {
      const approaching=selected&&untilEntry<110&&untilEntry>-30&&this.nextOverlook-this.distance<this.road.length/2;
      const cruiseLimit=this.turbo?turboCruiseSpeed(activeRoad,activeDistance,this.speed):this.cruiseSpeed;
      const lookahead=this.access?10:this.turbo?MathUtils.clamp(this.speed*.9,20,32):20;
      let targetLane=approaching?this.profile.approachLane:this.profile.cruiseLane;
      if(!this.access&&Math.abs(targetLane-this.lane)>1.8&&!this.traffic.mergeClear(this.distance+this.speed,targetLane,1,this.speed))targetLane=this.lane;
      const ahead=activeRoad.frame(activeDistance+lookahead,this.access?0:targetLane);
      const target=Math.atan2(ahead.point.x-this.position.x,ahead.point.z-this.position.z);
      const error=Math.atan2(Math.sin(target-this.yaw),Math.cos(target-this.yaw));
      desiredSteer=MathUtils.clamp(error*3,-1,1);
      const curvature=Math.abs(Math.atan2(Math.sin(ahead.yaw-road.yaw),Math.cos(ahead.yaw-road.yaw)))/lookahead;
      const traffic=this.traffic.forwardGap(this.distance,this.lane);
      const followSpeed=traffic.gap<12+this.speed*1.5?Math.max(0,traffic.speed+(traffic.gap-12)*.45):cruiseLimit;
      let targetSpeed=Math.min(this.access||approaching?8:cruiseLimit,followSpeed,Math.sqrt(4/Math.max(curvature,.002)));
      if(this.turbo)targetSpeed=Math.min(targetSpeed,Math.sqrt(traffic.speed*traffic.speed+10*Math.max(0,traffic.gap-12)));
      let yieldGap=Infinity;
      if(this.access){
        // Wait outside the main lane before committing to the access-road merge.
        const hold=this.access.road.length-36,gap=hold-this.accessDistance;
        if(gap>=-3&&gap<45){
          const merge=this.access.road.frame(this.access.road.length-20).point;
          const main=this.road.nearest(merge.x,merge.z).distance;
          const arrival=(gap+16)/Math.max(4,this.speed);
          if(!this.traffic.mergeClear(main,this.profile.approachLane,arrival,8)){yieldGap=gap;targetSpeed=Math.min(targetSpeed,gap<2?0:Math.sqrt(6*Math.max(0,gap-2)));}
        }
      }
      throttle=brake?0:MathUtils.clamp((targetSpeed-this.speed)*.35,0,1);
      automaticBrake=MathUtils.clamp((this.speed-targetSpeed)*2,0,8);
      if(Number.isFinite(yieldGap))automaticBrake=Math.max(automaticBrake,Math.min(8,this.speed*this.speed/(2*Math.max(.2,yieldGap-1))));
      const parking=this.parkingMotion();
      const stoppingDistance=(this.speed+parking.creep)*parking.duration/2;
      const stopGap=this.access?(selected?.id===this.access.id&&this.nextOverlook-this.distance<this.road.length/2?this.access.parking-this.accessDistance:Infinity):selected?Infinity:this.nextOverlook-this.distance;
      if(stopGap<=Math.max(.5,stoppingDistance)) {this.park();return;}
    }
    this.appliedThrottle=throttle;
    const drag=.55+this.speed*this.speed*.0025+(!throttle&&this.speedHold===null?this.speed*.018*(6-this.engine.gear):0);
    let desired=throttle*9.2-drag-(brake?13:0)-automaticBrake;
    if(this.automatic && !throttle && this.speed>(this.turbo?28:this.cruiseSpeed))desired-=3;
    this.acceleration=MathUtils.damp(this.acceleration,desired,9,dt);
    this.speed=MathUtils.clamp(this.speed+this.acceleration*dt,0,Math.min(58,this.engine.speedLimit));
    this.steering=MathUtils.damp(this.steering,desiredSteer,this.automatic?7:desiredSteer?4.4:5,dt);
    const wheelAngle=this.steering*.48/(1+this.speed*.085);
    this.yaw+=(this.automatic?this.speed/2.45*Math.tan(wheelAngle):manualYawRate(this.steering,this.speed))*dt;
    this.position.x+=Math.sin(this.yaw)*this.speed*dt;
    this.position.z+=Math.cos(this.yaw)*this.speed*dt;
    let nearest=activeRoad.nearest(this.position.x,this.position.z);
    if(!this.access&&this.accessRoads.length>0&&nearest.lane>this.profile.manualEntryLane){
      const entry=this.accessRoads.find(access=>{const gap=MathUtils.euclideanModulo(this.distance-access.entry+this.road.length/2,this.road.length)-this.road.length/2;if(gap<0||gap>90)return false;const p=access.road.nearest(this.position.x,this.position.z);return p.distance<access.parking&&p.away<access.road.halfWidth-1.1;});
      if(entry){this.joinAccess(entry);nearest=entry.road.nearest(this.position.x,this.position.z);}
    }
    const currentRoad=this.access?.road??this.road;
    if(this.access){this.accessDistance=nearest.distance;this.accessLane=nearest.lane;this.syncMainPosition();}
    else{this.distance+=MathUtils.euclideanModulo(nearest.distance-this.distance+this.road.length/2,this.road.length)-this.road.length/2;this.lane=nearest.lane;}
    this.position.y=nearest.point.y;
    this.heading=Math.atan2(Math.sin(this.yaw-nearest.yaw),Math.cos(this.yaw-nearest.yaw));
    if(Math.abs(nearest.lane)>currentRoad.halfWidth-1.1) {
      const lane=MathUtils.clamp(nearest.lane,-currentRoad.halfWidth+1.1,currentRoad.halfWidth-1.1);
      this.position.copy(currentRoad.frame(this.access?this.accessDistance:this.distance,lane).point);
      if(this.access){this.accessLane=lane;this.syncMainPosition();}else this.lane=lane;
      this.speedHold=null;
      const contact=roadsideResponse(this.speed,this.heading,lane,dt);
      this.speed=contact.speed;this.heading=contact.heading;this.yaw=nearest.yaw+this.heading;
    }
    if(this.access&&this.accessDistance>=this.access.road.length-1.5){this.access=null;this.syncMainPosition();}
    const trafficHit=this.traffic.collision(this.distance,this.lane);
    if(trafficHit) {
      this.speedHold=null;
      const gap=MathUtils.euclideanModulo(this.distance-trafficHit.distance+this.road.length/2,this.road.length)-this.road.length/2;
      const impulse=this.lastContact!==trafficHit||this.contactCooldown===0;
      const contact=trafficResponse(gap,this.lane-trafficHit.lane,this.speed,this.heading,trafficHit.speed,trafficHit.direction,impulse);
      const oldLane=this.access?this.accessLane:this.lane,newLane=MathUtils.clamp(oldLane+contact.laneShift,-currentRoad.halfWidth+1.1,currentRoad.halfWidth-1.1);
      let separation=contact.distanceShift;
      if(contact.lateral&&Math.abs(newLane-oldLane-contact.laneShift)>.001)separation=(Math.sign(gap)||-1)*(4.64-Math.abs(gap));
      if(this.access){this.accessDistance+=separation;this.accessLane=newLane;this.position.copy(this.access.road.frame(this.accessDistance,newLane).point);this.syncMainPosition();}
      else{this.distance+=separation;this.lane=newLane;this.position.copy(this.road.frame(this.distance,newLane).point);}
      this.speed=contact.speed;trafficHit.speed=contact.otherSpeed;
      if(impulse){this.acceleration=Math.min(0,this.acceleration);this.contactCooldown=.3;this.lastContact=trafficHit;}
      this.collisionTime=.35;
    }
  }
}
