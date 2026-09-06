import {Vector3} from 'three';
import {journeyRoad} from './journey-route';
import {scenicAccess} from './scenic-route';

export const TOWN_START=.025,TOWN_END=.215;

export function townBuildingSites(){
  const accessSamples=scenicAccess.filter(access=>access.id!=='lake').flatMap(access=>{
    const points:Vector3[]=[];
    for(let distance=0;distance<=access.road.length;distance+=2)points.push(access.road.frame(distance).point);
    points.push(access.road.frame(access.road.length).point);
    return points;
  });
  const sites=[];
  for(let distance=TOWN_START*journeyRoad.length;distance<TOWN_END*journeyRoad.length;distance+=27){
    for(const side of [-1,1]){
      const road=journeyRoad.frame(distance,side*20),yaw=road.yaw-side*Math.PI/2;
      const index=Math.round(distance/27),width=13+(index%2)*3;
      const cosine=Math.cos(yaw),sine=Math.sin(yaw);
      // Include the roof and front paving, with one metre of road clearance
      // plus one metre to cover gaps between the two-metre centreline samples.
      const blocked=accessSamples.some(point=>{
        const dx=point.x-road.point.x,dz=point.z-road.point.z;
        const x=cosine*dx-sine*dz,z=sine*dx+cosine*dz;
        const across=Math.max(0,Math.abs(x)-(width+2)/2);
        const along=Math.max(0,-5.6-z,z-11);
        return across*across+along*along<(2.8+2)**2;
      });
      if(!blocked)sites.push({distance,side,index,width,point:road.point,yaw});
    }
  }
  return sites;
}
