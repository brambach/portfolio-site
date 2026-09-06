import {expect,it} from 'vitest';
import {Vector3} from 'three';
import {turboCruiseSpeed} from './cruise-pace';
import type {RoadGeometry} from './road-geometry';
import {createScenicDrive} from './scenic-drive';
import {CityDrive} from './city-route';
const frame=(distance:number,lane=0)=>({point:new Vector3(lane,0,distance),tangent:new Vector3(0,0,1),side:new Vector3(1,0,0),yaw:0,slope:0});
const straight:RoadGeometry={length:10000,halfWidth:6,cruiseStop:9000,frame,nearest:(x,z)=>({...frame(z),distance:z,lane:x,away:Math.abs(x)})};
it('allows fast straights and plans braking before a sharp bend',()=>{
 const bend={...straight,frame:(distance:number,lane=0)=>({...frame(distance,lane),yaw:Math.max(0,Math.min(80,distance-200))*.04})};
 expect(turboCruiseSpeed(straight,100,28)).toBe(28);
 expect(turboCruiseSpeed(bend,170,28)).toBeLessThan(20);
 expect(turboCruiseSpeed(bend,210,20)).toBeLessThan(12);
});
it('pulls over with heading following the arc, steering then straightening',()=>{
 const drive=new CityDrive(straight);drive.phase='driving';drive.engineOn=true;drive.speed=15;drive.traffic.cars.length=0;drive.park();
 let maxHeading=0,maxSteering=0,minSteering=0,maxError=0;
 for(let i=0;i<300;i++){
  const before=drive.position.clone();drive.update(1/60);const delta=drive.position.clone().sub(before);
  maxHeading=Math.max(maxHeading,Math.abs(drive.heading));maxSteering=Math.max(maxSteering,drive.steering);minSteering=Math.min(minSteering,drive.steering);
  if(i>30&&delta.length()>.01)maxError=Math.max(maxError,Math.abs(Math.atan2(delta.x,delta.z)-drive.yaw));
 }
 expect(drive.phase).toBe('parked');expect(maxHeading).toBeGreaterThan(.1);expect(maxSteering).toBeGreaterThan(.05);expect(minSteering).toBeLessThan(-.05);expect(maxError).toBeLessThan(.08);expect(drive.steering).toBe(0);expect(drive.heading).toBe(0);
});
it('completes Turbo cruise to the overlook while following traffic and staying on the road',()=>{
 const drive=createScenicDrive();drive.setTurbo(true);drive.start();let elapsed=0,peak=0,maxLane=0;
 while(drive.phase!=='parked'&&elapsed<180){drive.update(1/30);elapsed+=1/30;peak=Math.max(peak,drive.speed);if(!drive.access&&drive.phase==='driving')maxLane=Math.max(maxLane,Math.abs(drive.lane));expect(drive.collisionTime).toBe(0);}
 expect(drive.stoppedAt).toBe('lake');expect(elapsed).toBeLessThan(120);expect(peak).toBeGreaterThan(20);expect(maxLane).toBeLessThan(4.9);
});
it('brakes for a stationary car from Turbo straightaway speed without contact',()=>{
 const drive=new CityDrive(straight);drive.phase='driving';drive.engineOn=true;drive.speed=28;drive.engine.gear=5;drive.setTurbo(true);
 drive.traffic.cars.splice(1);Object.assign(drive.traffic.cars[0],{distance:80,lane:drive.lane,direction:1,speed:0,targetSpeed:0});
 for(let i=0;i<900;i++){drive.update(1/60);expect(drive.collisionTime).toBe(0);}
 expect(drive.speed).toBeLessThan(.2);expect(drive.traffic.forwardGap(drive.distance,drive.lane).gap).toBeGreaterThan(7);
});
