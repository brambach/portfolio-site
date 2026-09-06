import {describe,expect,it} from 'vitest';
import {CityTraffic,trafficAcknowledgementLit} from './city-traffic';
import {CityDrive} from './city-route';

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
