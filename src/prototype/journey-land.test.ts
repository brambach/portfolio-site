import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {landHeight,trailPoint,stopLocalPoint,lakeFrame,LAKE_LEVEL,lakeRadius} from './journey-land';
import {StopVisit} from './stop-visit';
import {journeyRoad,journeyAccess,stopDistance} from './journey-route';
import {scenicLakeFrame} from './journey-land';
import {scenicRoad,scenicAccess} from './scenic-route';
import {createScenicDrive} from './scenic-drive';
describe('forest terrain and trail',()=>{
  it('keeps the road clear and lifts the trail above the valley',()=>{
    for(let d=0;d<journeyRoad.length;d+=70){const p=journeyRoad.frame(d,8).point;expect(landHeight(p.x,p.z)).toBeCloseTo(-.16);}
    expect(trailPoint(1).y).toBeGreaterThan(trailPoint(0).y+5);
    for(let t=0;t<=1;t+=.02){const p=trailPoint(t);expect(p.y).toBeCloseTo(landHeight(p.x,p.z));}
  });
  it('follows terrain with eye clearance, reaches the view and returns to the car',()=>{
    const visit=new StopVisit();visit.begin('trailhead');const origin=stopLocalPoint('trailhead',0,1.67,10);visit.outside(origin,new Vector3());
    for(let i=0;i<2150;i++){visit.update(1/60);if(visit.progress>.08){const p=visit.pose()!.position;expect(p.y-landHeight(p.x,p.z)).toBeCloseTo(1.67,2);}}
    expect(visit.phase).toBe('exploring');expect(visit.order()).toBe(false);
    visit.back();for(let i=0;i<2150;i++)visit.update(1/60);expect(visit.phase).toBe('entering');expect(visit.pose()!.position.distanceTo(origin)).toBe(0);
  });
  it('reaches and leaves the viewpoint without animation under reduced motion',()=>{
    const visit=new StopVisit();visit.begin('trailhead');visit.outside(new Vector3(),new Vector3());visit.update(1/60,true);expect(visit.phase).toBe('exploring');visit.back();visit.update(1/60,true);expect(visit.phase).toBe('entering');
  });
});

it('keeps a submerged lake basin without flooding the road',()=>{
  expect(landHeight(lakeFrame.point.x,lakeFrame.point.z)).toBeLessThan(LAKE_LEVEL-2);
  for(let angle=0;angle<Math.PI*2;angle+=.1){
    const p=lakeFrame.point.clone().addScaledVector(lakeFrame.side,Math.cos(angle)*130).addScaledVector(lakeFrame.tangent,Math.sin(angle)*210);
    expect(lakeRadius(p.x,p.z)).toBeLessThan(1);expect(landHeight(p.x,p.z)).toBeLessThan(LAKE_LEVEL);
  }
  for(let d=0;d<journeyRoad.length;d+=8){const p=journeyRoad.frame(d,8).point;expect(landHeight(p.x,p.z)).toBeCloseTo(-.16);}
});

it('keeps the lake visible from the parked driver seat',()=>{
  const eye=journeyRoad.frame(stopDistance('lake'),5.4).point.clone().setY(1.25);
  const water=lakeFrame.point.clone().setY(LAKE_LEVEL);
  for(let t=.08;t<.99;t+=.01){
    const ray=eye.clone().lerp(water,t);
    expect(landHeight(ray.x,ray.z)).toBeLessThan(ray.y);
  }
});

it('keeps all branch pavement and stop forecourts above the terrain',()=>{
  for(const access of journeyAccess){
    for(let d=0;d<access.road.length;d+=4)for(const lane of [-3.8,0,3.8]){const p=access.road.frame(d,lane).point;expect(landHeight(p.x,p.z)).toBeLessThan(-.075);}
    expect(landHeight(access.place.x,access.place.z)).toBeCloseTo(-.16);
  }
});

it('clears the scenic shoulder and its only access road without flattening hidden stops',async()=>{
  const {scenicRoad,scenicAccess}=await import('./scenic-route');
  for(let d=0;d<scenicRoad.length;d+=8)for(const lane of [-6,0,6]){const p=scenicRoad.frame(d,lane).point;expect(landHeight(p.x,p.z,true)).toBeLessThan(-.08);}
  for(const access of scenicAccess)for(let d=0;d<access.road.length;d+=4)for(const lane of [-3.8,0,3.8]){const p=access.road.frame(d,lane).point;expect(landHeight(p.x,p.z,true)).toBeLessThan(-.075);}
  const forest=scenicRoad.frame(scenicRoad.length*.4,20).point;expect(landHeight(forest.x,forest.z,true)).toBeGreaterThan(1);
});

it('brings the scenic water into the parked view while keeping pavement dry',()=>{
  const drive=createScenicDrive();drive.reviewAt('lake');const parked=drive.pose().point;
  const toward=scenicLakeFrame.point.clone().sub(parked).setY(0).normalize();
  let shoreline=Infinity;
  for(let distance=0;distance<=30;distance+=.5){const p=parked.clone().addScaledVector(toward,distance);if(landHeight(p.x,p.z,true)<LAKE_LEVEL){shoreline=distance;break;}}
  expect(shoreline).toBeGreaterThan(8);expect(shoreline).toBeLessThan(12);
  const sign=stopLocalPoint('lake',-9,0,4);
  expect(landHeight(sign.x,sign.z,true)).toBeCloseTo(-.16);
  for(let d=0;d<scenicRoad.length;d+=4)for(const offset of [-6,0,6]){const p=scenicRoad.frame(d,offset).point;expect(landHeight(p.x,p.z,true)).toBeGreaterThan(LAKE_LEVEL+.3);}
  for(const access of scenicAccess)for(let d=0;d<access.road.length;d+=2)for(const offset of [-4.8,0,4.8]){const p=access.road.frame(d,offset).point;expect(landHeight(p.x,p.z,true)).toBeGreaterThan(LAKE_LEVEL+.3);}
  const eye=parked.clone().setY(1.25),water=scenicLakeFrame.point.clone().setY(LAKE_LEVEL);
  for(let t=.02;t<1;t+=.01){const ray=eye.clone().lerp(water,t);expect(landHeight(ray.x,ray.z,true)).toBeLessThan(ray.y);}
});
