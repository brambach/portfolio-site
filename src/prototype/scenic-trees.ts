import {inTown} from './town-world';
import {scenicRoad,scenicAccess} from './scenic-route';
import {nearAccess} from './journey-route';
import {landHeight,LAKE_LEVEL} from './journey-land';
import type {CanopyTree} from './tree-canopy';

export function scenicTreePlacements(heightAt=(x:number,z:number)=>landHeight(x,z,true)):CanopyTree[]{
  const trees:CanopyTree[]=[];
  for(let i=0;i<2400;i++){
    const distance=i/2400*scenicRoad.length;
    const spread=(i*.61803398875)%1;
    // Concentrate the existing trees on nearby slopes, with occasional distant stands.
    const offset=14+150*spread*spread;
    const point=scenicRoad.frame(distance,(i%2?1:-1)*offset).point;
    point.y=heightAt(point.x,point.z);
    if(inTown(point.x,point.z)||scenicRoad.nearest(point.x,point.z).away<11||nearAccess(point.x,point.z,7,scenicAccess)||scenicAccess.some(access=>access.place.distanceToSquared(point)<20**2)||point.y<LAKE_LEVEL+.1)continue;
    trees.push({point,scale:.75+(i*7%17)/20,yaw:i*2.399});
  }
  // Young firs fill the bank below the taller canopy without a second model or atlas.
  for(let i=0;i<900;i++){
    const distance=(i+.31*Math.sin(i*2.399))/900*scenicRoad.length;
    const spread=(i*.754877666)%1,offset=11.5+10*spread;
    const point=scenicRoad.frame(distance,(i%2?1:-1)*offset).point;
    point.y=heightAt(point.x,point.z);
    if(inTown(point.x,point.z)||scenicRoad.nearest(point.x,point.z).away<11||nearAccess(point.x,point.z,7,scenicAccess)||scenicAccess.some(access=>access.place.distanceToSquared(point)<20**2)||point.y<LAKE_LEVEL+.1)continue;
    trees.push({point,scale:.19+(i*13%18)/100,yaw:i*1.618});
  }
  return trees;
}
