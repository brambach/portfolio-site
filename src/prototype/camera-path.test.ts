import { describe, expect, it } from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {LAPTOP_REST} from './laptop-motion';
import {RACKET_REST} from './tennis-racket';
import { cameraPose, cabinDiscoveryLook } from './camera-path';

describe('entrance camera continuity', () => {
  it('keeps the view continuous when leaving the seat while looking sideways', () => {
    const seated = cameraPose(1, 1.6, .8, .2);
    const leaving = cameraPose(1 - 1e-5, 1.6, .8, .2);
    expect(seated.position.distanceTo(leaving.position)).toBeLessThan(.001);
    expect(seated.target.distanceTo(leaving.target)).toBeLessThan(.001);
  });
  it('uses the same seat position and field of view on portrait and landscape screens', () => {
    const wide = cameraPose(1, 1.6, 0, 0);
    const narrow = cameraPose(1, .48, 0, 0);
    expect(wide.position.distanceTo(narrow.position)).toBe(0);
    expect(wide.fov).toBe(narrow.fov);
  });
  it('opens the door before the camera crosses the doorway', () => {
    for (let p = .6; p < .84; p += .01) {
      const pose = cameraPose(p, 1.6, 0, 0);
      if (pose.position.x < 1.4 && pose.position.x > .7) expect(pose.doorAngle).toBeLessThan(-.8);
    }
  });
  it('keeps a horizontal view direction while returning from looking behind', () => {
    for (let p = .85; p <= 1; p += .002) {
      const pose = cameraPose(p, 1.6, Math.PI, 0);
      const direction = pose.target.clone().sub(pose.position).normalize();
      expect(Math.abs(direction.y)).toBeLessThan(.5);
    }
  });
});

it('frames the three cabin objects in the first seated landscape view',()=>{
  const look=cabinDiscoveryLook(16/9);
  const pose=cameraPose(1,16/9,look.yaw,look.pitch);
  const camera=new PerspectiveCamera(pose.fov,16/9,.05,100);
  camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
  for(const point of [LAPTOP_REST,RACKET_REST,new Vector3(-.265,.858,.77725)]){
    const projected=point.clone().project(camera);
    expect(Math.abs(projected.x)).toBeLessThan(.95);expect(Math.abs(projected.y)).toBeLessThan(.95);
    expect(projected.z).toBeGreaterThan(-1);expect(projected.z).toBeLessThan(1);
  }
});

it('keeps the laptop and racket centres visible in the first portrait view',()=>{
  for(const aspect of [320/660,390/660,390/844]){
    const look=cabinDiscoveryLook(aspect),pose=cameraPose(1,aspect,look.yaw,look.pitch);
    const camera=new PerspectiveCamera(pose.fov,aspect,.05,100);
    camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
    for(const point of [LAPTOP_REST,RACKET_REST]){
      const projected=point.clone().project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(.8);expect(Math.abs(projected.y)).toBeLessThan(.9);
    }
  }
});


it('joins the cinematic reveal to the entry camera without a position or lens cut',()=>{
  for(const aspect of [.46,1,16/9]){
    const before=cameraPose(.56-1e-6,aspect,0,0),after=cameraPose(.56,aspect,0,0);
    expect(before.position.distanceTo(after.position)).toBeLessThan(.001);
    expect(before.target.distanceTo(after.target)).toBeLessThan(.001);
    expect(Math.abs(before.fov-after.fov)).toBeLessThan(.001);
    for(let p=0;p<.56;p+=.005){
      const pose=cameraPose(p,aspect,0,0);
      expect(pose.position.y).toBeGreaterThan(.7);
      expect(pose.position.distanceTo(pose.target)).toBeGreaterThan(1);
      expect(pose.position.x>1.2||pose.position.y>2||pose.position.z>2.7).toBe(true);
    }
  }
});
