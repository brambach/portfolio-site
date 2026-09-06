import {it,expect} from 'vitest';
import {PlaneGeometry} from 'three';
import {terrainSurfaceHeight} from './terrain-surface';

it('grounds props on rendered triangle interiors and edges rather than a curved formula',()=>{
  const geometry=new PlaneGeometry(20,20,2,2).rotateX(-Math.PI/2);
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)positions.setY(i,(positions.getX(i)**2+positions.getZ(i)**2)/100);
  for(const mesh of [geometry,geometry.toNonIndexed()]){
    const sample=terrainSurfaceHeight(mesh,()=>-99);
    expect(sample(5,5)).toBeCloseTo(1);
    expect(sample(0,0)).toBeCloseTo(0);
    expect(sample(-5,-5)).toBeCloseTo(1);
    expect(sample(10,10)).toBeCloseTo(2);
    expect(sample(20,20)).toBe(-99);
  }
});
