import {describe,expect,it} from 'vitest';
import {CityTraffic,trafficAcknowledgementLit} from './city-traffic';
import {CityDrive} from './city-route';
import {createRoad} from './road-geometry';
import {SCENIC_PROFILE} from './road-profile';
import {createTownDrive} from './scenic-drive';

describe('boulevard traffic',()=>{
  it('finds cars ahead in the same lane and detects contact in either direction',()=>{
    const traffic=new CityTraffic();traffic.cars.splice(1);
    Object.assign(traffic.cars[0],{distance:40,lane:2.1,direction:1,speed:10});
    expect(traffic.forwardGap(0,2.1)).toEqual({gap:35.2,speed:10});
    expect(traffic.forwardGap(0,5.5).gap).toBe(Infinity);
    expect(traffic.collision(37,2.1)).toBe(traffic.cars[0]);
    traffic.cars[0].direction=-1;
    expect(traffic.collision(37,2.1)).toBe(traffic.cars[0]);
    expect(traffic.collision(37,5.5)).toBeUndefined();
  });
  it('brakes for the player instead of passing through a stopped car',()=>{
    const traffic=new CityTraffic();traffic.cars.splice(1);
    Object.assign(traffic.cars[0],{distance:0,lane:2.1,direction:1,speed:10});
    traffic.update(1/60,{distance:15,lane:2.1,speed:0});
    expect(traffic.cars[0].braking).toBe(true);
    expect(traffic.cars[0].speed).toBeLessThan(10);
  });
  it('loses speed on contact with another car',()=>{
    const drive=new CityDrive();drive.phase='driving';drive.engineOn=true;drive.speed=20;
    drive.traffic.cars.splice(1);Object.assign(drive.traffic.cars[0],{distance:4,lane:2.1,direction:1,speed:4});
    drive.update(1/60);expect(drive.speed).toBeGreaterThan(8);expect(drive.speed).toBeLessThan(20);expect(drive.collisionTime).toBeGreaterThan(0);expect(drive.traffic.cars[0].speed).toBeGreaterThan(4);
  });
});

it('checks approaching traffic throughout a merge, including across the circuit seam',()=>{
  const traffic=new CityTraffic();traffic.cars.splice(1);const car=traffic.cars[0];
  Object.assign(car,{distance:traffic.road.length-55,lane:5.5,direction:1,speed:22});
  expect(traffic.mergeClear(5,5.5,2,8)).toBe(false);
  expect(traffic.mergeClear(5,2.1,2,8)).toBe(true);
  Object.assign(car,{distance:12,speed:0});
  expect(traffic.mergeClear(5,5.5,2,8)).toBe(false);
  Object.assign(car,{distance:150,speed:15});
  expect(traffic.mergeClear(5,5.5,2,8)).toBe(true);
});

it('acknowledges the nearest car ahead without changing its speed or lane',()=>{
  const traffic=new CityTraffic();traffic.cars.splice(2);
  const player=traffic.road.frame(100,2.1);
  Object.assign(traffic.cars[0],{distance:115,lane:2.1,direction:1});
  Object.assign(traffic.cars[1],{distance:125,lane:2.1,direction:1});
  const before=traffic.cars.map(({speed,lane})=>({speed,lane}));
  expect(traffic.honk(player)).toBe(true);
  expect(traffic.cars.map(c=>c.acknowledgement)).toEqual([1.8,0]);
  expect(traffic.cars.map(({speed,lane})=>({speed,lane}))).toEqual(before);
  expect(traffic.honk(player)).toBe(false);
  for(let i=0;i<241;i++)traffic.update(1/60,{distance:100,lane:10,speed:0});
  expect(traffic.cars[0].acknowledgement).toBe(0);
  Object.assign(traffic.cars[0],{distance:115,lane:2.1});
  expect(traffic.honk(player)).toBe(true);
});

it('ignores cars behind, oncoming cars and distant cars when honking',()=>{
  const traffic=new CityTraffic();traffic.cars.splice(1);const car=traffic.cars[0],player=traffic.road.frame(100,2.1);
  for(const state of [{distance:90,direction:1},{distance:115,direction:-1},{distance:160,direction:1}]){
    Object.assign(car,{lane:2.1,...state});expect(traffic.honk(player)).toBe(false);expect(car.acknowledgement).toBe(0);
  }
});

it('acknowledges across the road seam using physical proximity',()=>{
  const traffic=new CityTraffic();traffic.cars.splice(1);
  Object.assign(traffic.cars[0],{distance:8,lane:2.1,direction:1});
  expect(traffic.honk(traffic.road.frame(traffic.road.length-8,2.1))).toBe(true);
});

it('shows exactly two delayed acknowledgement flashes and then goes dark',()=>{
  expect([1.8,1.4,1.0,.7,.3,0].map(trafficAcknowledgementLit)).toEqual([false,true,false,true,false,false]);
});

it('starts braking early enough for a stopped player at high closing speed',()=>{
  const traffic=new CityTraffic();traffic.cars.splice(1);
  const car=traffic.cars[0];Object.assign(car,{distance:0,lane:2.1,direction:1,speed:28,targetSpeed:28});
  let lights=false;
  for(let i=0;i<1200;i++){
    const before=car.speed;traffic.update(1/120,{distance:70,lane:2.1,speed:0});
    expect(traffic.collision(70,2.1)).toBeUndefined();
    if(before-car.speed>1/120){expect(car.braking).toBe(true);lights=true;}
  }
  expect(lights).toBe(true);expect(car.distance).toBeLessThan(65.2);
});

const loop=createRoad([[0,0,0],[0,0,120],[70,0,120],[70,0,0]],8,.8);
function singleScenicTraffic(shoulderClear=(distance:number,lane:number)=>true){
  const traffic=new CityTraffic(loop,SCENIC_PROFILE,{shoulderClear});
  traffic.cars.splice(1);
  return traffic;
}

it('prompts only after following a slow same-direction cruise car',()=>{
  const traffic=singleScenicTraffic();const car=traffic.cars[0];
  Object.assign(car,{distance:34,lane:1.9,direction:1,speed:4,targetSpeed:4});
  const player={distance:10,lane:1.9,speed:12,automatic:true,access:false,phase:'driving',cruiseSpeed:18};
  expect(traffic.hornPrompt(player)).toBe(false);
  for(let i=0;i<90;i++)traffic.update(1/60,player);
  expect(traffic.hornPrompt({...player,speed:4.2})).toBe(true);
  expect(traffic.hornPrompt({...player,automatic:false})).toBe(false);
  expect(traffic.hornPrompt({...player,access:true})).toBe(false);
  expect(traffic.hornPrompt({...player,phase:'parked'})).toBe(false);
  Object.assign(car,{distance:34,lane:-1.9,direction:-1});
  for(let i=0;i<90;i++)traffic.update(1/60,player);
  expect(traffic.hornPrompt(player)).toBe(false);
});

it('pulls the same slow car onto a clear shoulder, lets the player pass, then rejoins behind',()=>{
  const traffic=singleScenicTraffic();const car=traffic.cars[0];
  Object.assign(car,{distance:32,lane:1.9,direction:1,speed:4,targetSpeed:4});
  let playerDistance=10;
  const player=()=>({distance:playerDistance,lane:1.9,speed:12,automatic:true,access:false,phase:'driving',cruiseSpeed:18});
  for(let i=0;i<90;i++)traffic.update(1/60,player());
  playerDistance=car.distance-20;
  expect(traffic.honk(loop.frame(playerDistance,1.9),player())).toBe(true);
  expect(traffic.cars[0]).toBe(car);
  let maxLane=car.lane,collided=false,passed=false;
  for(let i=0;i<900;i++){
    playerDistance+=12/60;
    traffic.update(1/60,player());
    maxLane=Math.max(maxLane,car.lane);
    if(traffic.collision(playerDistance,1.9))collided=true;
    const gap=(playerDistance-car.distance+traffic.road.length/2)%traffic.road.length-traffic.road.length/2;
    if(gap>12)passed=true;
    if(passed&&Math.abs(car.lane-1.9)<.15&&gap>8)break;
  }
  expect(collided).toBe(false);
  expect(maxLane).toBeGreaterThan(SCENIC_PROFILE.pavedHalfWidth+.75);
  expect(Math.abs(car.lane-1.9)).toBeLessThan(.15);
  expect((playerDistance-car.distance+traffic.road.length/2)%traffic.road.length-traffic.road.length/2).toBeGreaterThan(8);
});

it('defers a honked pull-over when the shoulder is blocked and retries within bounds',()=>{
  let clear=false,retries=0;
  const traffic=singleScenicTraffic(()=>{retries++;return clear;});const car=traffic.cars[0];
  Object.assign(car,{distance:32,lane:1.9,direction:1,speed:4,targetSpeed:4});
  let playerDistance=10;
  const player=()=>({distance:playerDistance,lane:1.9,speed:12,automatic:true,access:false,phase:'driving',cruiseSpeed:18});
  for(let i=0;i<90;i++)traffic.update(1/60,player());
  playerDistance=car.distance-20;
  expect(traffic.honk(loop.frame(playerDistance,1.9),player())).toBe(true);
  for(let i=0;i<120;i++)traffic.update(1/60,player());
  expect(car.lane).toBeCloseTo(1.9);
  clear=true;
  for(let i=0;i<180;i++)traffic.update(1/60,player());
  expect(car.lane).toBeGreaterThan(2.2);
  expect(retries).toBeLessThan(12);
});

it('cancels pull-over lifecycle during race, access, parked and off phases',()=>{
  for(const player of [
    {distance:12,lane:1.9,speed:12,automatic:true,access:false,phase:'driving',race:true},
    {distance:12,lane:1.9,speed:12,automatic:true,access:true,phase:'driving'},
    {distance:12,lane:1.9,speed:12,automatic:true,access:false,phase:'parked'},
    {distance:12,lane:1.9,speed:12,automatic:true,access:false,phase:'off'},
  ]){
    const traffic=singleScenicTraffic();const car=traffic.cars[0];
    Object.assign(car,{distance:32,lane:1.9,direction:1,speed:4,targetSpeed:4,pullOver:{phase:'pulling',lane:1.9,shoulder:4.65,retry:.2,age:0,originalSpeed:4}});
    traffic.update(1/60,player);
    expect(car.pullOver).toBeUndefined();
    expect(car.lane).toBe(1.9);
  }
});

it('finds at least one natural default cruise prompt without preventing lake arrival when no horn is used',()=>{
  const drive=createTownDrive();drive.start();
  let prompted=false;
  for(let i=0;i<60*210&&drive.phase!=='parked';i++){
    drive.update(1/60);
    prompted ||= drive.traffic.hornPrompt({distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed});
    expect(drive.collisionTime).toBe(0);
  }
  expect(prompted).toBe(true);
  expect(drive.stoppedAt).toBe('lake');
});

it('accepts at least one actual scenic shoulder for a production pull-over',()=>{
  const drive=createTownDrive();drive.start();
  let accepted=false;
  for(let i=0;i<60*120&&!accepted;i++){
    drive.update(1/60);
    const encounter=drive.traffic.trafficEncounter({distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed});
    if(encounter&&drive.traffic.honk(drive.pose(),{distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed})){
      accepted=encounter.phase==='prompt'||Boolean(drive.traffic.trafficEncounter({distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed})?.phase);
    }
  }
  expect(accepted).toBe(true);
});

it('honks during default town cruise, observes pull-over phases and still arrives',()=>{
  const drive=createTownDrive();drive.start();
  const phases=new Set<string>();let honked=false,eligibleAt:null|{time:number;distance:number}=null,elapsed=0;
  for(let i=0;i<60*220&&drive.phase!=='parked';i++){
    drive.update(1/60);elapsed+=1/60;
    const player={distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed};
    const encounter=drive.traffic.trafficEncounter(player);
    if(encounter)phases.add(encounter.phase);
    if(!honked&&drive.traffic.hornPrompt(player)){
      eligibleAt={time:elapsed,distance:drive.distance};
      expect(drive.traffic.honk(drive.pose(),player)).toBe(true);
      honked=true;
    }
    expect(drive.collisionTime).toBe(0);
  }
  expect(eligibleAt).not.toBeNull();
  expect(phases.has('pulling')).toBe(true);
  expect(phases.has('passing')).toBe(true);
  expect(phases.has('rejoining')).toBe(true);
  expect(drive.stoppedAt).toBe('lake');
});

it('reports read-only encounter telemetry with stable car identity',()=>{
  const traffic=singleScenicTraffic();const car=traffic.cars[0];
  Object.assign(car,{distance:34,lane:1.9,direction:1,speed:4,targetSpeed:4});
  const player={distance:10,lane:1.9,speed:12,automatic:true,access:false,phase:'driving',cruiseSpeed:18};
  for(let i=0;i<90;i++)traffic.update(1/60,player);
  const encounter=traffic.trafficEncounter(player);
  expect(encounter).toEqual(expect.objectContaining({phase:'prompt',carIndex:0,homeLane:1.9}));
  expect(encounter!.distance).toBe(car.distance);
  expect(encounter!.lane).toBe(car.lane);
});

it('does not change traffic progression without a horn response',()=>{
  const withHorn=singleScenicTraffic(),withoutHorn=singleScenicTraffic();
  Object.assign(withHorn.cars[0],{distance:32,lane:1.9,direction:1,speed:4,targetSpeed:4});
  Object.assign(withoutHorn.cars[0],{distance:32,lane:1.9,direction:1,speed:4,targetSpeed:4});
  for(let i=0;i<240;i++){
    withHorn.update(1/60,{distance:10+i*.2,lane:1.9,speed:12,automatic:true,access:false,phase:'driving'});
    withoutHorn.update(1/60,{distance:10+i*.2,lane:1.9,speed:12,automatic:true,access:false,phase:'driving'});
  }
  expect(withHorn.cars[0].lane).toBe(withoutHorn.cars[0].lane);
  expect(withHorn.cars[0].distance).toBeCloseTo(withoutHorn.cars[0].distance);
});
