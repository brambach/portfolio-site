import { describe, expect, it } from 'vitest';
import { LAPTOP_HELD, LAPTOP_REST, LAPTOP_SCREEN, laptopPose, readingPose } from './laptop-motion';

describe('physical laptop movement', () => {
  it('opens from the passenger seat and returns to exactly the same closed position', () => {
    const closed = laptopPose(0), open = laptopPose(1);
    expect(closed.position.distanceTo(LAPTOP_REST)).toBe(0);
    expect(open.position.distanceTo(LAPTOP_HELD)).toBeCloseTo(0, 12);
    expect(closed.lid).toBeLessThan(-1.5);
    expect(open.lid).toBeCloseTo(.22);
    expect(closed.cameraWeight).toBe(0);
    expect(open.cameraWeight).toBe(1);
  });
  it('keeps the complete screen in frame at desktop and portrait aspect ratios', () => {
    for (const aspect of [.46, .875, 1.5, 2.2]) {
      const reading = readingPose(aspect);
      const height = 2 * reading.distance * Math.tan(reading.fov * Math.PI / 360);
      expect(height).toBeGreaterThan(LAPTOP_SCREEN.height * 1.1);
      expect(height * aspect).toBeGreaterThan(LAPTOP_SCREEN.width * 1.1);
      expect(reading.position.z).toBeGreaterThan(-.25);
      expect(reading.position.y).toBeGreaterThan(.98);
      expect(reading.position.x).toBeGreaterThan(0);
    }
  });
  it('clears the seat bolsters before crossing the cabin', () => {
    for (let p = 0; p <= 1; p += .01) {
      const pose = laptopPose(p);
      expect(pose.position.x).toBeGreaterThan(-.5);
      expect(pose.position.x).toBeLessThan(.3);
      expect(pose.position.y).toBeGreaterThan(.806);
      expect(pose.position.y).toBeLessThan(1);
      // The case is .338 m wide. Check its lower corners over both seat bolsters.
      for (const x of [pose.position.x - .169, pose.position.x + .169]) {
        for (const bolsterX of [-.548, -.152, .152, .548]) {
          if (Math.abs(x - bolsterX) < .045) expect(pose.position.y - .006).toBeGreaterThan(.8);
        }
      }
      if (p < .55) expect(pose.lid).toBeLessThan(-1.5);
    }
    expect(laptopPose(.001).position.distanceTo(laptopPose(0).position)).toBeLessThan(.00001);
    expect(laptopPose(.999).cameraWeight).toBeCloseTo(1, 6);
  });
});
