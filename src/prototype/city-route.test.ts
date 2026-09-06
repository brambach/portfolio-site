import {describe,expect,it} from 'vitest';
import {CityDrive,CITY_LENGTH,cityFrame} from './city-route';

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
