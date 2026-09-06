import {Box3,Matrix4,Vector3} from 'three';
import {expect,it} from 'vitest';
import {townBuildingSites} from './town-layout';
import {scenicAccess} from './scenic-route';
import {stopDistance} from './journey-route';

it('keeps town building and paving footprints clear of both access roads',()=>{
  let minimum=Infinity;
  for(const site of townBuildingSites()){
    const inverse=new Matrix4().makeRotationY(site.yaw);inverse.setPosition(site.point);inverse.invert();
    const footprint=new Box3(new Vector3(-(site.width+2)/2,-1,-5.6),new Vector3((site.width+2)/2,1,11));
    for(const access of scenicAccess.filter(access=>access.id!=='lake')){
      for(let distance=0;distance<access.road.length;distance+=.5){
        const local=access.road.frame(distance).point.applyMatrix4(inverse);
        minimum=Math.min(minimum,footprint.distanceToPoint(local)-access.road.halfWidth);
      }
    }
  }
  expect(minimum).toBeGreaterThanOrEqual(1);
});

it('retains buildings in usable spaces around each town stop',()=>{
  const sites=townBuildingSites();
  for(const stop of ['cafe','tennis'] as const){
    expect(sites.some(site=>site.side===1&&Math.abs(site.distance-stopDistance(stop))<70)).toBe(true);
  }
});
