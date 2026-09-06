import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function addIgnition(vehicle: THREE.Group) {
  const metal = new THREE.MeshStandardMaterial({
    color: "#b1a27c",
    metalness: 0.82,
    roughness: 0.3,
  });
  const ignition = new THREE.Group();
  ignition.name = "Ignition key";
  ignition.userData.artifact = "ignition";
  ignition.position.set(0.6, 0.935, 0.68);
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.023, 0.023, 0.017, 32),
    metal,
  );
  barrel.rotation.x = Math.PI / 2;
  ignition.add(barrel);
  const key = new THREE.Group();
  key.position.z = -0.018;
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.043, 0.003),
    metal,
  );
  blade.position.y = -0.018;
  const grip = new THREE.Mesh(
    new RoundedBoxGeometry(0.034, 0.035, 0.009, 3, 0.01),
    new THREE.MeshStandardMaterial({ color: "#282820", roughness: 0.7 }),
  );
  grip.position.y = -0.049;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.0014, 8, 32),
    metal,
  );
  ring.position.y = -0.079;
  const tag = new THREE.Mesh(
    new RoundedBoxGeometry(0.027, 0.06, 0.004, 2, 0.005),
    new THREE.MeshStandardMaterial({ color: "#754e2e", roughness: 0.86 }),
  );
  tag.position.set(0.01, -0.118, 0);
  tag.rotation.z = -0.17;
  key.add(blade, grip, ring, tag);
  ignition.add(key);
  vehicle.add(ignition);
  return { update: (turn: number, _inside = 1) => {
    key.rotation.z = -turn * .6;
  } };
}
