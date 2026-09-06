import {expect,it} from 'vitest';
import * as THREE from 'three';
import {addCarParts} from './door-geometry';

it('restores shared vertices without changing triangle positions, normals or UV seams',()=>{
  const source=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(source,material);
  mesh.updateMatrixWorld();const body=new THREE.Group(),door=new THREE.Group(),leather=new THREE.MeshStandardMaterial(),wood=new THREE.MeshPhysicalMaterial();
  addCarParts(mesh,body,door,leather,wood);
  const output=(body.children[0] as THREE.Mesh).geometry,expanded=output.toNonIndexed(),original=source.toNonIndexed();
  expect(output.index?.count).toBe(original.attributes.position.count);
  expect(output.attributes.position.count).toBeLessThan(original.attributes.position.count);
  for(const name of ['position','normal','uv'])expect(Array.from(expanded.attributes[name].array)).toEqual(Array.from(original.attributes[name].array));
  for(const geometry of [source,output,expanded,original])geometry.dispose();material.dispose();leather.dispose();wood.dispose();
});


it('keeps transparent panes out of opaque shadow rendering',()=>{
  const source=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial({transparent:true,opacity:.13});
  material.name='glass';
  const mesh=new THREE.Mesh(source,material),body=new THREE.Group(),door=new THREE.Group();
  const leather=new THREE.MeshStandardMaterial(),wood=new THREE.MeshPhysicalMaterial();
  mesh.updateMatrixWorld();addCarParts(mesh,body,door,leather,wood);
  expect(body.children.length+door.children.length).toBeGreaterThan(0);
  for(const item of [...body.children,...door.children]){
    expect(item.castShadow).toBe(false);expect(item.receiveShadow).toBe(false);
    (item as THREE.Mesh).geometry.dispose();
  }
  source.dispose();material.dispose();leather.dispose();wood.dispose();
});
