import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

export function cabinDiscoveryLook(aspect:number){
  return {yaw:MathUtils.lerp(-1.5,-.95,MathUtils.smoothstep(aspect,.65,1.4)),pitch:-.38};
}

const ease = (t: number) => t * t * (3 - 2 * t);
export const interval = (t: number, a: number, b: number) => ease(MathUtils.clamp((t - a) / (b - a), 0, 1));
const path = new CatmullRomCurve3([
  new Vector3(.1, 8.1, -5.2),
  new Vector3(2.7, 5.2, -3.7),
  new Vector3(3.1, 2.25, -1.35),
  new Vector3(1.75, 1.55, -.38),
  new Vector3(.85, 1.32, -.1),
  new Vector3(.38, 1.27, -.02),
], false, 'centripetal');
const gaze = new CatmullRomCurve3([
  new Vector3(0, .45, .25),
  new Vector3(0, .75, .2),
  new Vector3(.25, 1.05, .18),
  new Vector3(.25, 1.04, .65),
  new Vector3(.3, 1.12, 2.3),
  new Vector3(.38, .42, 4.98),
], false, 'centripetal');

function originalCameraPose(progress: number, aspect: number, yaw: number, pitch: number) {
  const t = ease(progress);
  const position = path.getPoint(t);
  const target = gaze.getPoint(t);
  if (aspect < 1) {
    position.y += (1 - interval(t, 0, .45)) * 3;
    position.x += (1 - aspect) * .9 * (1 - interval(t, .62, .88));
    target.z -= (1 - aspect) * .65 * (1 - interval(t, .6, .85));
  }
  const lookWeight = interval(t, .82, 1);
  const turn = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  target.sub(position).applyAxisAngle(new Vector3(0, 1, 0), turn * lookWeight).add(position);
  target.y += pitch * 4 * lookWeight;
  return { position, target, fov: MathUtils.lerp(48, 68, interval(t, .4, .95)), doorAngle: -1.05 * interval(t, .22, .53) * (1 - interval(t, .88, 1)) };
}


// A front-quarter detail opens into the established door-entry position.
// Keep the final pose identical so entering the cabin doesn't cut the camera.
let openingCache:{aspect:number;positions:CatmullRomCurve3;targets:CatmullRomCurve3}|undefined;
export function openingPose(amount:number,aspect:number){
  const end=originalCameraPose(.56,aspect,0,0);
  const t=ease(MathUtils.clamp(amount,0,1));
  const portrait=Math.max(0,1-aspect);
  if(!openingCache||openingCache.aspect!==aspect){
  const positions=new CatmullRomCurve3([
    new Vector3(1.65+portrait*.8,.88,3.25+portrait),
    new Vector3(3.7+portrait,1.35,3.8),
    new Vector3(4.5+portrait,3.6,1.6),
    end.position.clone(),
  ],false,'centripetal');
  const targets=new CatmullRomCurve3([
    new Vector3(.52,.64,1.85),
    new Vector3(0,.75,.9),
    new Vector3(0,.8,.1),
    end.target.clone(),
  ],false,'centripetal');
  openingCache={aspect,positions,targets};
  }
  return {position:openingCache.positions.getPoint(t),target:openingCache.targets.getPoint(t),fov:MathUtils.lerp(38,end.fov,ease(t)),doorAngle:0};
}
export function cameraPose(progress:number,aspect:number,yaw:number,pitch:number){
  return progress<.56?openingPose(progress/.56,aspect):originalCameraPose(progress,aspect,yaw,pitch);
}
