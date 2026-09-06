import {MathUtils} from 'three';

export function manualYawRate(steering:number,speed:number){
  const wheel=Math.sign(steering)*Math.pow(Math.abs(steering),1.5)*.42/(1+speed*.06);
  const grip=Math.min(.9,9/Math.max(speed,1));
  return MathUtils.clamp(speed/2.45*Math.tan(wheel),-grip,grip);
}

export function roadsideResponse(speed:number,heading:number,lane:number,dt:number){
  const outward=Math.max(0,Math.sign(lane)*Math.sin(heading));
  const along=Math.cos(heading)<0?Math.PI:0;
  const error=Math.atan2(Math.sin(heading-along),Math.cos(heading-along));
  return {speed:speed*Math.exp(-(.18+3*outward*outward)*dt),heading:along+MathUtils.damp(error,0,3+outward*7,dt)};
}

export function trafficResponse(gap:number,side:number,speed:number,heading:number,otherSpeed:number,direction:1|-1,impulse:boolean){
  const alongSign=Math.sign(gap)||-1,sideSign=Math.sign(side)||1;
  const lateral=1.7-Math.abs(side)<4.6-Math.abs(gap);
  let nextSpeed=speed,nextOther=otherSpeed;
  if(impulse){
    if(lateral)nextSpeed*=1-MathUtils.clamp(.03+Math.abs(Math.sin(heading))*.25,.03,.18);
    else{
      const closing=Math.max(0,-alongSign*(speed*Math.cos(heading)-otherSpeed*direction));
      if(direction===-1&&closing>8){nextSpeed=0;nextOther=0;}
      else{nextSpeed=MathUtils.clamp(speed+alongSign*closing*.55*Math.cos(heading),0,58);nextOther=Math.max(0,otherSpeed-alongSign*closing*.55*direction);}
    }
  }
  return {lateral,laneShift:lateral?sideSign*(1.74-Math.abs(side)):0,distanceShift:lateral?0:alongSign*(4.64-Math.abs(gap)),speed:nextSpeed,otherSpeed:nextOther};
}
