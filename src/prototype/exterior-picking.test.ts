import {expect,it,vi} from 'vitest';
import {BoxGeometry,Group,Mesh,MeshBasicMaterial,Ray,Vector3} from 'three';
import {createExteriorPicker} from './exterior-picking';

it('accepts the parked car and rejects empty space without triangle intersections',()=>{
  const vehicle=new Group(),geometry=new BoxGeometry(2,1,4),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material);
  vehicle.add(mesh);const intersect=vi.spyOn(mesh,'raycast'),pick=createExteriorPicker(vehicle);
  expect(pick(new Ray(new Vector3(0,0,8),new Vector3(0,0,-1)))).toBe(true);
  expect(pick(new Ray(new Vector3(4,0,8),new Vector3(0,0,-1)))).toBe(false);
  vehicle.position.set(12,3,-8);vehicle.rotation.y=Math.PI/2;vehicle.updateMatrixWorld(true);
  expect(pick(new Ray(new Vector3(20,3,-8),new Vector3(-1,0,0)))).toBe(true);
  expect(pick(new Ray(new Vector3(0,0,8),new Vector3(0,0,-1)))).toBe(false);
  expect(intersect).not.toHaveBeenCalled();geometry.dispose();material.dispose();
});
