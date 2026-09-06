import {it,expect} from 'vitest';
import {scenicTreePlacements} from './scenic-trees';
import {scenicRoad,scenicAccess} from './scenic-route';
import {nearAccess} from './journey-route';
import {landHeight,LAKE_LEVEL} from './journey-land';

it('keeps the denser scenic planting grounded and clear of pavement, access and water',()=>{
  const trees=scenicTreePlacements();
  expect(trees.length).toBeGreaterThan(1500);expect(trees.length).toBeLessThanOrEqual(3300);
  expect(trees.filter(tree=>tree.scale<.4).length).toBeGreaterThan(600);
  for(const {point} of trees){
    expect(scenicRoad.nearest(point.x,point.z).away).toBeGreaterThanOrEqual(11);
    expect(nearAccess(point.x,point.z,7,scenicAccess)).toBe(false);
    expect(point.y).toBeCloseTo(landHeight(point.x,point.z,true));
    expect(point.y).toBeGreaterThanOrEqual(LAKE_LEVEL+.1);
  }
});
