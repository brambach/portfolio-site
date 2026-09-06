import { MathUtils, Vector3 } from 'three';

export const LAPTOP_SCREEN = { width: .304, height: .19, pixels: 960 };
export const LAPTOP_REST = new Vector3(-.35, .823, .035);
export const LAPTOP_HELD = new Vector3(.22, .82, .22);
const LAPTOP_CLEAR = new Vector3(-.35, .985, .035);
const LAPTOP_CARRIED = new Vector3(.22, .985, .22);

export function smooth(t: number) {
  const x = MathUtils.clamp(t, 0, 1);
  return MathUtils.clamp(x * x * x * (x * (x * 6 - 15) + 10), 0, 1);
}

export function laptopPose(progress: number) {
  const lift = smooth(progress / .23);
  const carry = smooth((progress - .23) / .32);
  const settle = smooth((progress - .55) / .21);
  const opening = smooth((progress - .65) / .35);
  const position = progress < .23
    ? LAPTOP_REST.clone().lerp(LAPTOP_CLEAR, lift)
    : progress < .55
      ? LAPTOP_CLEAR.clone().lerp(LAPTOP_CARRIED, carry)
      : LAPTOP_CARRIED.clone().lerp(LAPTOP_HELD, settle);
  return {
    position,
    rotation: 0,
    lid: MathUtils.lerp(-Math.PI / 2 + .035, .22, opening),
    cameraWeight: smooth((progress - .55) / .45),
  };
}

export function readingPose(aspect: number) {
  const axis = new Vector3(1, 0, 0);
  const target = LAPTOP_HELD.clone().add(new Vector3(0, .009, .111)).add(new Vector3(0, .11 - .027, -.0042).applyAxisAngle(axis, .22));
  const normal = new Vector3(0, 0, -1).applyAxisAngle(axis, .22);
  const distance = .48;
  const span = Math.max(LAPTOP_SCREEN.height * 1.75, LAPTOP_SCREEN.width / aspect * 1.16);
  const fov = MathUtils.radToDeg(2 * Math.atan(span / (2 * distance)));
  return { position: target.clone().addScaledVector(normal, distance), target, fov, distance };
}
