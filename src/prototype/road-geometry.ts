import {CatmullRomCurve3,MathUtils,Vector3} from 'three';
export type RoadFrame={point:Vector3;tangent:Vector3;side:Vector3;yaw:number;slope:number};
export type RoadGeometry={length:number;halfWidth:number;cruiseStop:number;frame:(distance:number,lane?:number)=>RoadFrame;nearest:(x:number,z:number)=>RoadFrame & {distance:number;lane:number;away:number}};
export function createRoad(points:[number,number,number][],halfWidth:number,stopFraction:number,closed=true):RoadGeometry {
  const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)),closed,'centripetal');
  curve.arcLengthDivisions=4000;
  const length=curve.getLength();
  function frame(distance:number,lane=0):RoadFrame {
    const u=closed?MathUtils.euclideanModulo(distance,length)/length:MathUtils.clamp(distance/length,0,1),tangent=curve.getTangentAt(u).normalize();
    const side=new Vector3(tangent.z,0,-tangent.x).normalize();
    return {point:curve.getPointAt(u).addScaledVector(side,lane),tangent,side,yaw:Math.atan2(tangent.x,tangent.z),slope:Math.asin(tangent.y)};
  }
  const count=closed?1200:180;
  const samples=Array.from({length:count+1},(_,i)=>({...frame(i/count*length),distance:i/count*length}));
  function nearest(x:number,z:number) {
    let nearest=samples[0],squared=Infinity;
    for(const sample of samples){const d=(x-sample.point.x)**2+(z-sample.point.z)**2;if(d<squared){squared=d;nearest=sample;}}
    const horizontal=nearest.tangent.x**2+nearest.tangent.z**2;
    const along=((x-nearest.point.x)*nearest.tangent.x+(z-nearest.point.z)*nearest.tangent.z)/horizontal;
    const distance=nearest.distance+along,pose=frame(distance);
    const lane=(x-pose.point.x)*pose.side.x+(z-pose.point.z)*pose.side.z;
    return {...pose,distance,lane,away:Math.abs(lane)};
  }
  return {length,halfWidth,cruiseStop:length*stopFraction,frame,nearest};
}
