import {describe,expect,it,vi} from 'vitest';
import {CityDrive,CITY_LENGTH,cityFrame} from './city-route';
import {createTownDrive} from './scenic-drive';
import {scenicAccess,scenicRoad} from './scenic-route';

function advance(drive:CityDrive,seconds:number,dt=1/60){for(let t=0;t<seconds-.00001;t+=dt)drive.update(dt);}
function emptyDrive(){const drive=new CityDrive();drive.traffic.cars.length=0;return drive;}

describe('city driving',()=>{
  it('waits for ignition, then requires the accelerator in manual mode',()=>{
    const drive=emptyDrive();drive.start();advance(drive,4);
    expect(drive.engineOn).toBe(true);expect(drive.phase).toBe('driving');expect(drive.speed).toBe(0);
    drive.controls.gas=true;advance(drive,8);
    expect(drive.speed*3.6).toBeGreaterThan(130);
    expect(drive.engineState.rpm).toBeGreaterThan(3000);
    expect(drive.engineState.rpm).toBeLessThanOrEqual(7000);
  });
  it('steers the actual position and heading and brakes to rest',()=>{
    const drive=emptyDrive();drive.start();drive.controls.gas=true;advance(drive,5);
    const yaw=drive.yaw,lane=drive.lane;
    drive.controls.left=true;advance(drive,.3);
    expect(drive.yaw).toBeGreaterThan(yaw);expect(drive.lane).toBeGreaterThan(lane);
    drive.controls.left=drive.controls.gas=false;drive.controls.brake=true;advance(drive,5);
    expect(drive.speed).toBe(0);
  });
  it('parks gradually when an object is requested and can restart',()=>{
    const drive=emptyDrive();drive.start();drive.controls.gas=true;advance(drive,6);drive.park();
    let previous=drive.speed;
    for(let i=0;i<1000;i++){drive.update(1/60);expect(Math.abs(drive.speed-previous)).toBeLessThan(.2);previous=drive.speed;}
    expect(drive.phase).toBe('parked');expect(drive.lane).toBeCloseTo(5.4);
    expect(Object.values(drive.controls).every(value=>!value)).toBe(true);
    drive.start();advance(drive,3);expect(drive.phase).toBe('driving');expect(drive.engineOn).toBe(true);
  });
  it('cruises without accelerator input and keeps simulation timing consistent',()=>{
    const fast=emptyDrive(),slow=emptyDrive();
    for(const drive of [fast,slow]){drive.setAutomatic(true);drive.start();}
    advance(fast,20);advance(slow,20,1/15);
    expect(fast.distance).toBeGreaterThan(100);expect(fast.speed).toBeGreaterThan(8);
    expect(slow.distance).toBeCloseTo(fast.distance,7);
  });
  it('joins the boulevard at the end of each circuit',()=>{
    expect(cityFrame(0).point.distanceTo(cityFrame(CITY_LENGTH).point)).toBeLessThan(.001);
    expect(cityFrame(0).tangent.angleTo(cityFrame(CITY_LENGTH).tangent)).toBeLessThan(.001);
  });
  it('moves straight to a parked waterfront with reduced motion',()=>{
    const drive=emptyDrive();drive.start();for(let i=0;i<240;i++)drive.update(1/60,true,true);
    expect(drive.phase).toBe('parked');expect(drive.speed).toBe(0);
  });
});

it('upshifts at redline rather than holding a lower gear for eight seconds',()=>{
  const drive=emptyDrive();drive.start();advance(drive,3);
  drive.engine.gear=3;drive.speed=15;drive.shift(-1);drive.controls.gas=true;
  advance(drive,7);
  expect(drive.engine.gear).toBeGreaterThan(2);
  expect(drive.speed).toBeGreaterThan(7000/285);
  expect(drive.engineState.rpm).toBeLessThanOrEqual(7000);
});

it('does not treat a stationary traffic wait as the start of a creeping arrival',()=>{
  const drive=emptyDrive();drive.setAutomatic(true);drive.phase='driving';
  drive.nextOverlook=drive.distance+5;drive.controls.brake=true;
  drive.update(1/120);
  expect(drive.phase).toBe('driving');
  expect(drive.speed).toBe(0);
});

it.each([30,60,120])('keeps positive-speed parking entry moving at %s Hz for each scenic stop',hz=>{
  for(const access of scenicAccess){
    const drive=createTownDrive();drive.traffic.cars.length=0;drive.navigate(access.centre);drive.start();
    let transition:null|{beforeSpeed:number;positionDelta:number;yawDelta:number}=null;
    for(let i=0;i<hz*260&&drive.phase!=='parked';i++){
      const before={phase:drive.phase,speed:drive.speed,x:drive.position.x,z:drive.position.z,yaw:drive.yaw};
      drive.update(1/hz);
      if(before.phase!=='parking'&&drive.phase==='parking'){
        transition={
          beforeSpeed:before.speed,
          positionDelta:Math.hypot(drive.position.x-before.x,drive.position.z-before.z),
          yawDelta:Math.atan2(Math.sin(drive.yaw-before.yaw),Math.cos(drive.yaw-before.yaw)),
        };
      }
    }
    expect(drive.stoppedAt).toBe(access.id);
    expect(transition).not.toBeNull();
    expect(transition!.beforeSpeed).toBeGreaterThan(0);
    expect(transition!.positionDelta).toBeGreaterThan(0);
    expect(Math.abs(transition!.yawDelta)).toBeGreaterThan(0);
  }
});

it('consumes a parking-entry 120Hz substep without a second traffic tick',()=>{
  const access=scenicAccess.find(stop=>stop.id==='lake')!,drive=createTownDrive();drive.traffic.cars.length=0;
  drive.navigate(access.centre);drive.start();
  let trafficTicks=0;
  const originalUpdate=drive.traffic.update.bind(drive.traffic);
  drive.traffic.update=((dt,car)=>{trafficTicks++;return originalUpdate(dt,car);}) as typeof drive.traffic.update;
  for(let i=0;i<120*240;i++){
    const beforeTicks=trafficTicks,before={phase:drive.phase,speed:drive.speed,x:drive.position.x,z:drive.position.z};
    drive.update(1/120);
    if(before.phase!=='parking'&&drive.phase==='parking'){
      expect(trafficTicks-beforeTicks).toBe(1);
      expect(before.speed).toBeGreaterThan(0);
      expect(Math.hypot(drive.position.x-before.x,drive.position.z-before.z)).toBeGreaterThan(0);
      return;
    }
  }
  throw new Error('Lake route did not enter parking.');
});

it('consumes a parking-entry 120Hz substep without a second engine tick',()=>{
  const access=scenicAccess.find(stop=>stop.id==='lake')!,drive=createTownDrive();drive.traffic.cars.length=0;
  drive.navigate(access.centre);drive.start();
  const originalUpdate=drive.engine.update.bind(drive.engine);
  const engineUpdate=vi.fn(originalUpdate);
  drive.engine.update=engineUpdate as typeof drive.engine.update;
  for(let i=0;i<120*240;i++){
    const beforeCalls=engineUpdate.mock.calls.length,before={phase:drive.phase,speed:drive.speed,x:drive.position.x,z:drive.position.z};
    drive.update(1/120);
    if(before.phase!=='parking'&&drive.phase==='parking'){
      expect(engineUpdate.mock.calls.length-beforeCalls).toBe(1);
      expect(before.speed).toBeGreaterThan(0);
      expect(Math.hypot(drive.position.x-before.x,drive.position.z-before.z)).toBeGreaterThan(0);
      return;
    }
  }
  throw new Error('Lake route did not enter parking.');
});

it('preserves the original centre-gap planner thresholds for nearby scenic destinations',()=>{
  const access=scenicAccess.find(stop=>stop.id==='cafe')!;
  for(const gap of [59,60,100,149,150,151]){
    const drive=createTownDrive();
    drive.traffic.cars.length=0;
    drive.distance=access.centre-gap;
    drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
    drive.yaw=scenicRoad.frame(drive.distance).yaw;
    drive.navigate(access.centre);
    const plannedGap=drive.nextOverlook-drive.distance;
    if(gap<150)expect(plannedGap).toBeCloseTo(gap+scenicRoad.length,6);
    else expect(plannedGap).toBeCloseTo(gap,6);
    expect(plannedGap).toBeLessThan(gap+scenicRoad.length*1.5);
  }
});

it('keeps behind scenic destinations forward-only with one circuit',()=>{
  const access=scenicAccess.find(stop=>stop.id==='cafe')!,drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.distance=access.centre+40;
  drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
  drive.yaw=scenicRoad.frame(drive.distance).yaw;
  drive.navigate(access.centre);
  expect(drive.nextOverlook-drive.distance).toBeCloseTo(scenicRoad.length-40,6);
});

it.each(['cafe','tennis','lake'] as const)('places straight-through arrivals at %s with clean drive state',id=>{
  const drive=createTownDrive();
  drive.requiredStop='lake';
  drive.requiredApproach=true;
  drive.destination=scenicAccess.find(stop=>stop.id==='lake')!.centre;
  drive.speedHold=12;
  drive.controls.left=drive.controls.right=drive.controls.gas=drive.controls.brake=true;
  drive.steering=.8;drive.heading=.4;drive.acceleration=3;drive.speed=18;
  drive.arriveAtStop(id,{preserveRequiredStop:id!=='lake'});
  expect(drive.stoppedAt).toBe(id);
  expect(drive.destination).toBeNull();
  expect(drive.requiredApproach).toBe(false);
  expect(drive.speedHold).toBeNull();
  expect(drive.speed).toBe(0);
  expect(drive.acceleration).toBe(0);
  expect(drive.steering).toBe(0);
  expect(drive.heading).toBe(0);
  expect(Object.values(drive.controls).every(value=>!value)).toBe(true);
  expect(drive.requiredStop).toBe(id==='lake'?null:'lake');
});

it('can go straight during forced lake approach, then navigate to tennis afterward',()=>{
  const drive=createTownDrive();
  drive.requiredStop='lake';drive.requiredApproach=true;drive.destination=scenicAccess.find(stop=>stop.id==='lake')!.centre;
  drive.arriveAtStop('cafe',{preserveRequiredStop:true});
  drive.navigate(scenicAccess.find(stop=>stop.id==='tennis')!.centre);
  drive.start();
  for(let i=0;i<60*90&&drive.stoppedAt!=='tennis';i++)drive.update(1/60);
  expect(drive.stoppedAt).toBe('tennis');
});
