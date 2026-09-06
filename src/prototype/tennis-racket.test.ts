import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { RACKET_REST, RACKET_HELD, racketPose } from './tennis-racket';

it('keeps the racket below the roof and clears the seat while carrying it across', () => {
  expect(racketPose(0).position.distanceTo(RACKET_REST)).toBe(0);
  expect(racketPose(1).position.distanceTo(RACKET_HELD)).toBeCloseTo(0);
  const points=[new Vector3(0,-.35,0),new Vector3(0,.335,0),new Vector3(-.137,.165,0),new Vector3(.137,.165,0)];
  for(let i=0;i<=100;i++) {
    const p=i/100, pose=racketPose(p);
    for(const point of points) {
      const world=point.clone().applyQuaternion(pose.rotation).add(pose.position);
      expect(world.y).toBeLessThan(1.4);
      if(p>=.3&&p<=.7) expect(world.y).toBeGreaterThan(.8);
    }
  }
});
