import {Euler,Quaternion,Vector3} from 'three';
import {smooth} from './laptop-motion';

export function contactCardPose(progress:number,scenic=true){
  const rest=new Vector3(...(scenic?[-.265,.858,.77725]:[-.35,1.092,.76]) as [number,number,number]);
  const restRotation=new Quaternion().setFromEuler(scenic?new Euler(-Math.PI/2,0,0):new Euler(0,-.2,0));
  const clear=rest.clone().add(new Vector3(0,.055,-.12));
  const held=new Vector3(.38,1.10,.30);
  const lift=smooth(progress/.3),carry=smooth((progress-.3)/.7);
  return {position:progress<.3?rest.lerp(clear,lift):clear.lerp(held,carry),rotation:restRotation.slerp(new Quaternion().setFromEuler(new Euler(-1.35,.12,-.08)),smooth(progress)),cameraWeight:smooth(progress)};
}
export function contactCardReadingPose(aspect:number){
  return {position:new Vector3(.34,1.28,-.14),target:new Vector3(aspect<1?.38:.12,aspect<1?.88:1.1,.44),fov:aspect<1?70:58};
}
