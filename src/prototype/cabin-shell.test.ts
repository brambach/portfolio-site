import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { addCabinShell } from './cabin-details';
import { addDoorInterior } from './door-geometry';

describe('cabin occlusion', () => {
  it('blocks the ground beneath both seats and both footwells', () => {
    const car = new THREE.Group();
    const shell = addCabinShell(car);
    car.updateMatrixWorld(true);
    for (const x of [-.55, .38, .65]) {
      for (const z of [-.7, 0, .7]) {
        const ray = new THREE.Raycaster(new THREE.Vector3(x, 1.27, z), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObject(shell)[0];
        expect(hit, `Floor missing at ${x}, ${z}`).toBeDefined();
        expect(hit.point.y).toBeGreaterThan(.4);
      }
    }
  });

  it('keeps the door panel opaque from both sides throughout its swing', () => {
    const door = new THREE.Group();
    door.position.set(.79, .5, .95);
    addDoorInterior(door);
    for (const angle of [0, -.35, -.7, -1.05]) {
      door.rotation.y = angle;
      door.updateMatrixWorld(true);
      for (const side of [-1, 1]) {
        const origin = door.localToWorld(new THREE.Vector3(side * .5, .18, -.65));
        const direction = new THREE.Vector3(-side, 0, 0).transformDirection(door.matrixWorld);
        const hit = new THREE.Raycaster(origin, direction).intersectObject(door)[0];
        expect(hit, `Door is transparent at angle ${angle}, side ${side}`).toBeDefined();
        expect(hit.object.name).toBe('Solid driver door interior');
      }
    }
  });
});
