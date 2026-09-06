import {expect,it} from 'vitest';
import {Group,Mesh,BoxGeometry,MeshStandardMaterial,Vector3,Matrix4} from 'three';
import {createRoadsideFerns,fernPlacements} from './roadside-ferns';
import {scenicRoad,scenicAccess} from './scenic-route';
import {nearAccess} from './journey-route';
import {landHeight,LAKE_LEVEL} from './journey-land';

it('grounds ferns outside the shoulder, access lanes and lake',()=>{
  const plants=fernPlacements();expect(plants.length).toBeGreaterThan(500);
  for(const {point} of plants){
    expect(scenicRoad.nearest(point.x,point.z).away).toBeGreaterThanOrEqual(7.5);
    expect(nearAccess(point.x,point.z,5,scenicAccess)).toBe(false);
    expect(point.y).toBeGreaterThanOrEqual(LAKE_LEVEL+.3);
    expect(point.y).toBe(landHeight(point.x,point.z,true));
  }
});
it('bounds visible geometry and releases plants outside the local radius',()=>{
  const source=new Group();source.add(new Mesh(new BoxGeometry(),new MeshStandardMaterial()));
  const ferns=createRoadsideFerns(source);ferns.update(scenicRoad.frame(scenicRoad.length*.3).point);
  expect(ferns.mesh.count).toBeGreaterThan(0);expect(ferns.mesh.count).toBeLessThanOrEqual(64);expect(ferns.mesh.castShadow).toBe(false);
  ferns.update(new Vector3(100000,0,100000));expect(ferns.mesh.count).toBe(0);
  ferns.mesh.geometry.dispose();ferns.mesh.material.dispose();ferns.mesh.dispose();
  source.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();object.material.dispose();}});
});

it('fades plants through the instance cutoff when moving past the crowded overlook',()=>{
  const source=new Group(),geometry=new BoxGeometry(),material=new MeshStandardMaterial();
  source.add(new Mesh(geometry,material));
  const ferns=createRoadsideFerns(source),parking=scenicAccess[0].road.frame(scenicAccess[0].parking).point,matrix=new Matrix4();
  let previous=new Map<string,number>(),largestStep=0,reachedLimit=false;
  for(let step=0;step<=320;step++){
    const viewer=parking.clone().add(new Vector3(-60+step*.25,0,0));ferns.update(viewer);
    reachedLimit ||= ferns.mesh.count===64;
    const current=new Map<string,number>();
    for(let i=0;i<ferns.mesh.count;i++){
      ferns.mesh.getMatrixAt(i,matrix);const e=matrix.elements;
      current.set(`${e[12].toFixed(3)},${e[14].toFixed(3)}`,Math.hypot(e[0],e[1],e[2]));
    }
    if(step>0)for(const key of new Set([...current.keys(),...previous.keys()]))largestStep=Math.max(largestStep,Math.abs((current.get(key)??0)-(previous.get(key)??0)));
    previous=current;
  }
  expect(reachedLimit).toBe(true);
  expect(largestStep).toBeLessThan(.04);
  ferns.mesh.geometry.dispose();ferns.mesh.material.dispose();ferns.mesh.dispose();geometry.dispose();material.dispose();
});
