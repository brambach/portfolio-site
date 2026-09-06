import * as THREE from 'three';
import { smooth } from './laptop-motion';

export const RACKET_REST = new THREE.Vector3(-.61, 1.035, -.10);
export const RACKET_HELD = new THREE.Vector3(.40, 1.015, .36);
const restRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.38, .7, -.05));
const heldRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(.05, -.18, -.18));

export function racketPose(progress: number) {
  const lift = smooth(progress / .3);
  const carry = smooth((progress - .3) / .4);
  const settle = smooth((progress - .7) / .3);
  const clear = new THREE.Vector3(-.61, 1.08, .17);
  const across = new THREE.Vector3(.4, 1.08, .36);
  const carryingRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.1, 0, 0));
  const position = progress < .3 ? RACKET_REST.clone().lerp(clear, lift)
    : progress < .7 ? clear.lerp(across, carry) : across.lerp(RACKET_HELD, settle);
  const rotation = progress < .3 ? restRotation.clone().slerp(carryingRotation, lift)
    : progress < .7 ? carryingRotation : carryingRotation.slerp(heldRotation, settle);
  return { position, rotation, cameraWeight: smooth(progress) };
}

export function racketReadingPose(aspect: number) {
  return {position:new THREE.Vector3(.34,1.28,-.14), target:new THREE.Vector3(aspect<1?.35:.08,1.095,.44), fov:aspect<1?88:78};
}

export function makeTennisRacket() {
  const racket = new THREE.Group();
  racket.name = 'Tennis racket on the front passenger seat';
  racket.userData.artifact = 'racket';
  const graphite = new THREE.MeshStandardMaterial({color:'#344237',metalness:.38,roughness:.34});
  const cream = new THREE.MeshStandardMaterial({color:'#dfd3b5',roughness:.54});
  const gripMaterial = new THREE.MeshStandardMaterial({color:'#bc9270',roughness:.9});
  const stringMaterial = new THREE.MeshStandardMaterial({color:'#e8ddbd',roughness:.62});
  const hoopPoints=Array.from({length:81},(_,i)=>{const angle=i/80*Math.PI*2;return new THREE.Vector3(Math.cos(angle)*.128,.165+Math.sin(angle)*.162,0);});
  const hoopCurve=new THREE.CatmullRomCurve3(hoopPoints,true);
  const frame = new THREE.Mesh(new THREE.TubeGeometry(hoopCurve,100,.0085,8,true),graphite);
  racket.add(frame);
  const trimCurve=new THREE.CatmullRomCurve3(hoopPoints.map(p=>p.clone().setZ(-.005)),true);
  racket.add(new THREE.Mesh(new THREE.TubeGeometry(trimCurve,100,.002,5,true),cream));
  function rod(a:THREE.Vector3,b:THREE.Vector3,radius:number,material:THREE.Material) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,a.distanceTo(b),7),material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
    racket.add(mesh);return mesh;
  }
  for(const side of [-1,1]) rod(new THREE.Vector3(side*.078,.038,0),new THREE.Vector3(side*.014,-.16,0),.008,graphite);
  rod(new THREE.Vector3(-.06,-.008,0),new THREE.Vector3(.06,-.008,0),.006,cream);
  for(let i=-7;i<=7;i++) {
    const x=i*.015;
    const extent=.15*Math.sqrt(1-(x/.119)**2);
    rod(new THREE.Vector3(x,.165-extent,-.001),new THREE.Vector3(x,.165+extent,-.001),.0005,stringMaterial);
  }
  for(let i=-9;i<=9;i++) {
    const y=i*.015;
    const extent=.12*Math.sqrt(1-(y/.151)**2);
    rod(new THREE.Vector3(-extent,.165+y,.0002),new THREE.Vector3(extent,.165+y,.0002),.0005,stringMaterial);
  }
  const handle=rod(new THREE.Vector3(0,-.16,0),new THREE.Vector3(0,-.337,0),.016,gripMaterial);
  handle.name='Wrapped tennis racket grip';
  const wrapPoints=Array.from({length:321},(_,i)=>{const t=i/320,angle=t*Math.PI*2*12;return new THREE.Vector3(Math.cos(angle)*.0161,-.161-t*.174,Math.sin(angle)*.0161);});
  racket.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wrapPoints),320,.0009,4,false),new THREE.MeshStandardMaterial({color:'#785842',roughness:1})));
  rod(new THREE.Vector3(0,-.337,0),new THREE.Vector3(0,-.35,0),.019,cream);
  // A transparent string-bed target lets the whole head respond to a tap.
  const target = new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  target.scale.set(.125,.159,1);target.position.y=.165;target.userData.pickTarget=true;racket.add(target);
  racket.traverse(object=>{if(object instanceof THREE.Mesh&&!object.userData.pickTarget){object.castShadow=true;object.receiveShadow=true;}});
  return racket;
}
