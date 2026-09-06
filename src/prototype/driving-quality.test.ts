import {expect,it} from 'vitest';
import {Vector3} from 'three';
import {CityDrive} from './city-route';
import {SCENIC_PROFILE} from './road-profile';
import type {RoadGeometry} from './road-geometry';

const frame=(distance:number,lane=0)=>({point:new Vector3(lane,0,distance),tangent:new Vector3(0,0,1),side:new Vector3(1,0,0),yaw:0,slope:0});
const road:RoadGeometry={length:10000,halfWidth:6,cruiseStop:9000,frame,nearest:(x,z)=>({...frame(z),distance:z,lane:x,away:Math.abs(x)})};
function car(speed=30,lane=1.9,heading=0){const drive=new CityDrive(road,10,[],SCENIC_PROFILE);drive.phase='driving';drive.engineOn=true;drive.speed=speed;drive.engine.gear=speed>16?5:1;drive.lane=lane;drive.position.copy(frame(0,lane).point);drive.yaw=heading;drive.traffic.cars.length=0;return drive;}
function run(drive:CityDrive,seconds:number,dt=1/60){for(let i=0;i<Math.round(seconds/dt);i++)drive.update(dt);}
function obstacle(drive:CityDrive,distance:number,lane:number,speed:number,direction:1|-1=1){drive.traffic.cars.push({distance,lane,speed,targetSpeed:speed,direction,braking:false,colour:'#777',acknowledgement:0});}

it('gives gentle initial steering and recentres predictably at different frame rates',()=>{
  const samples=[30,60,120].map(fps=>{
    const drive=car(30,0);drive.controls.left=true;run(drive,.2,1/fps);
    expect(drive.yaw).toBeGreaterThan(.035);expect(drive.yaw).toBeLessThan(.055);expect(drive.lane).toBeLessThan(.15);
    run(drive,.2,1/fps);drive.controls.left=false;run(drive,.8,1/fps);
    expect(drive.steering).toBeLessThan(.02);return drive;
  });
  for(const drive of samples.slice(1)){expect(drive.position.distanceTo(samples[0].position)).toBeLessThan(.02);expect(Math.abs(drive.yaw-samples[0].yaw)).toBeLessThan(.001);}
});

it('lets a grazing roadside contact scrub speed and recover within the boundary',()=>{
  const graze=car(30,4.89,.06),frontal=car(30,4.89,1.3);
  for(const drive of [graze,frontal]){drive.controls.gas=true;run(drive,1);expect(Math.abs(drive.lane)).toBeLessThanOrEqual(4.9001);}
  expect(graze.speed).toBeGreaterThan(25);expect(graze.speed).toBeGreaterThan(frontal.speed);
  graze.controls.right=true;run(graze,1);expect(graze.lane).toBeLessThan(4.5);expect(graze.speed).toBeGreaterThan(20);
});

it('distinguishes a side scrape, rear impact and substantial head-on hit',()=>{
  const graze=car(30,3.5),rear=car(30),head=car(30);
  obstacle(graze,1,1.9,12);obstacle(rear,4,1.9,12);obstacle(head,4,1.9,13,-1);
  for(const drive of [graze,rear,head])drive.update(1/60);
  expect(graze.speed).toBeGreaterThan(27);expect(rear.speed).toBeGreaterThan(15);expect(rear.speed).toBeLessThan(graze.speed);expect(head.speed).toBeLessThan(1);
  for(const drive of [graze,rear,head])expect(drive.traffic.collision(drive.distance,drive.lane)).toBeUndefined();
});

it('retains control through repeated contact and a head-on recovery',()=>{
  const graze=car(30,3.5);obstacle(graze,1,1.9,20);graze.controls.gas=graze.controls.right=true;run(graze,1.2);
  expect(graze.speed).toBeGreaterThan(10);expect(Math.abs(graze.lane)).toBeLessThanOrEqual(4.9001);
  const head=car(20);obstacle(head,4,1.9,13,-1);head.update(1/60);head.controls.gas=head.controls.left=true;run(head,8);
  expect(head.speed).toBeGreaterThan(3);expect(head.distance).toBeGreaterThan(8);expect(Math.abs(head.lane)).toBeLessThanOrEqual(4.9001);
});

it('resolves repeated side contact consistently at 30, 60 and 120 fps',()=>{
  const drives=[30,60,120].map(fps=>{const drive=car(30,3.5);obstacle(drive,1,1.9,20);drive.controls.gas=drive.controls.right=true;run(drive,1.2,1/fps);return drive;});
  for(const drive of drives.slice(1)){expect(drive.position.distanceTo(drives[0].position)).toBeLessThan(.02);expect(Math.abs(drive.speed-drives[0].speed)).toBeLessThan(.02);}
});

it('accelerates through lower-gear redlines after a manual shift and recovers after braking',()=>{
  for(const fps of [30,60,120]){
    const drive=car(15);drive.engine.gear=3;drive.shift(-1);drive.controls.gas=true;run(drive,9,1/fps);
    expect(drive.engine.gear).toBeGreaterThan(2);expect(drive.speed).toBeGreaterThan(40);
    run(drive,20,1/fps);expect(drive.engine.gear).toBe(5);expect(drive.speed).toBeCloseTo(56,2);expect(drive.engineState.rpm).toBeLessThanOrEqual(7000);
    drive.controls.gas=false;drive.controls.brake=true;run(drive,3,1/fps);const low=drive.speed;
    drive.controls.brake=false;drive.controls.gas=true;run(drive,8,1/fps);expect(drive.speed).toBeGreaterThan(low+20);
  }
});

it('holds the selected speed at 30, 60 and 120 fps while leaving steering manual',()=>{
  for(const fps of [30,60,120]){
    const drive=car(20,0);drive.controls.gas=true;drive.setSpeedHold(true);
    expect(drive.automatic).toBe(false);expect(drive.controls.gas).toBe(false);
    run(drive,6,1/fps);expect(drive.speed).toBeCloseTo(20,2);
    drive.controls.left=true;run(drive,.2,1/fps);
    expect(drive.yaw).toBeGreaterThan(.02);expect(drive.speedHold).toBe(20);
    drive.controls.left=false;drive.controls.gas=true;run(drive,.5,1/fps);
    expect(drive.speedHold).toBeNull();expect(drive.speed).toBeGreaterThan(21);
    drive.setSpeedHold(true);drive.controls.brake=true;run(drive,.5,1/fps);
    expect(drive.speedHold).toBeNull();expect(drive.speed).toBeLessThan(20);
  }
});

it('releases speed hold for parking, cruise and contact, and refuses it at rest',()=>{
  const drive=car(0);drive.setSpeedHold(true);expect(drive.speedHold).toBeNull();
  drive.speed=20;drive.setSpeedHold(true);drive.park();expect(drive.speedHold).toBeNull();
  const cruise=car(20);cruise.setSpeedHold(true);cruise.setAutomatic(true);expect(cruise.speedHold).toBeNull();
  const hit=car(20);hit.setSpeedHold(true);obstacle(hit,4,1.9,10);hit.update(1/60);expect(hit.speedHold).toBeNull();
});

it('reports the throttle maintaining speed to the shared engine state',()=>{
  const held=car(20);held.setSpeedHold(true);run(held,5);
  expect(held.controls.gas).toBe(false);expect(held.speed).toBeCloseTo(20,2);
  expect(held.engineState.load).toBeGreaterThan(.19);expect(held.engineState.load).toBeLessThan(.23);
  held.setSpeedHold(false);run(held,2);expect(held.engineState.load).toBeCloseTo(.12,2);
  const cruise=car(10);cruise.setAutomatic(true);run(cruise,6);
  expect(cruise.controls.gas).toBe(false);expect(cruise.engineState.load).toBeGreaterThan(.14);
  cruise.park();run(cruise,5);expect(cruise.engineState.load).toBeCloseTo(.12,2);
});
