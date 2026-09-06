import {expect,it} from 'vitest';
import {Matrix4,Vector3} from 'three';
import {createRoadsideGrass} from './roadside-grass';
import {landHeight} from './journey-land';
import {scenicRoad} from './scenic-route';

it('keeps low grass bounded and grounded while following the roadside slope',()=>{
  const heightAt=(x:number,z:number)=>landHeight(x,z,true),grass=createRoadsideGrass(heightAt),matrix=new Matrix4();
  grass.update(scenicRoad.frame(scenicRoad.length*.3).point);
  expect(grass.mesh.count).toBeGreaterThan(0);expect(grass.mesh.count).toBeLessThanOrEqual(128);
  for(let i=0;i<grass.mesh.count;i++){
    grass.mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    expect(e[13]).toBeCloseTo(heightAt(e[12],e[14]),3);
    expect(scenicRoad.nearest(e[12],e[14]).away).toBeGreaterThan(7.49);
    expect(e[5]).toBeGreaterThanOrEqual(0);
  }
  expect(grass.mesh.geometry.attributes.position.count*grass.mesh.count/3).toBeLessThanOrEqual(4608);
  grass.update(new Vector3(100000,0,100000));expect(grass.mesh.count).toBe(0);
  grass.mesh.geometry.dispose();grass.mesh.material.dispose();grass.mesh.dispose();
});
