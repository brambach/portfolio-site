import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Component = { vertices: number[]; bounds: THREE.Box3 };

// Weld by position so UV seams don't divide a physical panel.
function components(geometry: THREE.BufferGeometry): Component[] {
  const position = geometry.getAttribute('position');
  const roots = Array.from({ length: position.count / 3 }, (_, i) => i);
  const root = (i: number): number => {
    while (roots[i] !== i) { roots[i] = roots[roots[i]]; i = roots[i]; }
    return i;
  };
  const seen = new Map<string, number>();
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)].map(n => Math.round(n * 10000)).join(',');
    const triangle = Math.floor(i / 3);
    const previous = seen.get(key);
    if (previous === undefined) seen.set(key, triangle);
    else roots[root(triangle)] = root(previous);
  }
  const result = new Map<number, Component>();
  const point = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    const id = root(Math.floor(i / 3));
    if (!result.has(id)) result.set(id, { vertices: [], bounds: new THREE.Box3() });
    const component = result.get(id)!;
    component.vertices.push(i);
    component.bounds.expandByPoint(point.fromBufferAttribute(position, i));
  }
  return [...result.values()];
}

export function isDriverDoor(bounds: THREE.Box3) {
  const { min, max } = bounds;
  return min.x > .58 && min.y > .405 && max.y < 1.45 && min.z > -.5 && max.z < 1.06;
}

export function addDoorInterior(door: THREE.Group, leather?: THREE.MeshStandardMaterial) {
  const panel = new THREE.Shape();
  panel.moveTo(.32, .5);
  panel.lineTo(-.97, .5);
  panel.lineTo(-.72, 1.005);
  panel.lineTo(.32, 1.025);
  panel.closePath();
  const geometry = new THREE.ExtrudeGeometry(panel, { depth: .035, bevelEnabled: true, bevelSize: .007, bevelThickness: .007, bevelSegments: 2, steps: 1 });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(.775 - door.position.x, -door.position.y, -door.position.z);
  const lining = new THREE.Mesh(geometry, leather ?? new THREE.MeshStandardMaterial({ color: '#714b30', roughness: .82 }));
  lining.name = 'Solid driver door interior';
  lining.castShadow = lining.receiveShadow = true;
  door.add(lining);
  const armrest = new THREE.Mesh(new RoundedBoxGeometry(.07, .06, .38, 3, .02), leather ?? new THREE.MeshStandardMaterial({ color: '#282b21', roughness: .8 }));
  armrest.position.set(.73 - door.position.x, .79 - door.position.y, .15 - door.position.z);
  door.add(armrest);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(.012, .023, .075, 3, .007), new THREE.MeshStandardMaterial({ color: '#c1c1b8', metalness: .85, roughness: .28 }));
  handle.position.set(.725 - door.position.x, .882 - door.position.y, .35 - door.position.z);
  door.add(handle);
}

export function addCarParts(mesh: THREE.Mesh, body: THREE.Group, door: THREE.Group, leather: THREE.MeshStandardMaterial, wood: THREE.MeshPhysicalMaterial) {
  const baked = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  const raw = baked.index ? baked.toNonIndexed() : baked;
  const parts: Record<string, number[]> = { body: [], door: [], leather: [], wood: [] };
  const material = mesh.material as THREE.MeshStandardMaterial;
  for (const component of components(raw)) {
    const { min, max } = component.bounds;
    const seat = material.name === 'black' && min.x > -.65 && max.x < .65 && min.z > -.5 && max.z < .35 && min.y > .65;
    const wheel = material.name === 'black' && min.x > .1 && max.x < .6 && min.z > .5 && max.z < .7 && min.y > .9;
    if (wheel) continue;
    const part = isDriverDoor(component.bounds) ? 'door' : seat ? 'leather' : 'body';
    // The exterior model seals the cabin with a shallow cap at window height.
    // Remove that cap so the real floor, seats and footwell can sit below it.
    const interiorShell = material.name === 'black' && min.y > .95 && max.y > 1.45;
    const position = raw.getAttribute('position');
    for (let i = 0; i < component.vertices.length; i += 3) {
      const triangle = component.vertices.slice(i, i + 3);
      const cap = interiorShell && triangle.every(v => position.getY(v) < 1.09 && position.getZ(v) < .85);
      if (!cap) parts[part].push(...triangle);
    }
  }
  for (const [name, indices] of Object.entries(parts)) {
    if (!indices.length) continue;
    let geometry = new THREE.BufferGeometry();
    for (const key of Object.keys(raw.attributes)) {
      const attribute = raw.getAttribute(key);
      const values = new Float32Array(indices.length * attribute.itemSize);
      indices.forEach((index, n) => {
        for (let c = 0; c < attribute.itemSize; c++) values[n * attribute.itemSize + c] = attribute.getComponent(index, c);
      });
      geometry.setAttribute(key, new THREE.BufferAttribute(values, attribute.itemSize));
    }
    const indexed=mergeVertices(geometry,1e-6);
    geometry.dispose();geometry=indexed;
    const group = name === 'door' ? door : body;
    if (name === 'door') geometry.translate(-door.position.x, -door.position.y, -door.position.z);
    const item = new THREE.Mesh(geometry, name === 'leather' ? leather : name === 'wood' ? wood : material);
    item.name = `${mesh.name}-${name}`;
    // Thin transparent panes shouldn't cast opaque shadows or self-shadow.
    item.castShadow = item.receiveShadow = material.name !== 'glass';
    group.add(item);
    if (name === 'door' && material.name === 'paint') {
      const lining = geometry.clone().translate(-.012, 0, 0);
      const liningMaterial = leather.clone();
      liningMaterial.side = THREE.BackSide;
      const inner = new THREE.Mesh(lining, liningMaterial);
      inner.name = 'Driver door leather lining';
      inner.castShadow = inner.receiveShadow = true;
      door.add(inner);
    }
  }
  baked.dispose();
  if (raw !== baked) raw.dispose();
}
