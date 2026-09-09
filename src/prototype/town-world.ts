import * as THREE from 'three';
import {townMaterial} from './town-materials';
import {journeyRoad,stopDistance} from './journey-route';
import {townBuildingParts,townBuildingSites,TOWN_START,TOWN_END,type TownPartKind} from './town-layout';
export {TOWN_START,TOWN_END} from './town-layout';

export function inTown(x:number,z:number,margin=0){
  const nearest=journeyRoad.nearest(x,z),fraction=nearest.distance/journeyRoad.length;
  return fraction>TOWN_START-.01&&fraction<TOWN_END+.01&&nearest.away<95+margin;
}

export function townInfluence(x:number,z:number){
  const nearest=journeyRoad.nearest(x,z),fraction=nearest.distance/journeyRoad.length;
  return THREE.MathUtils.smoothstep(fraction,TOWN_START-.03,TOWN_START)*(1-THREE.MathUtils.smoothstep(fraction,TOWN_END,TOWN_END+.04))*(1-THREE.MathUtils.smoothstep(nearest.away,65,155));
}

const specs=[['plaster','#bdad94'],['timber','#78614a'],['roof','#394640'],['glass','#233337'],['pavement','#818477'],['trim','#c8bfa8']] as const;
type TownMaterialKind=typeof specs[number][0];
type RenderPartKind=TownPartKind;
export function createTownPalette(){return new Map(specs.map(([name,color])=>[name,townMaterial(name,color)]));}

// Repeated street elements share one draw call per material.
export function createTownStreet(materials=createTownPalette()){
  const group=new THREE.Group();group.name='Small town main street';
  const matrices=new Map<TownMaterialKind,{matrix:THREE.Matrix4;color:THREE.Color}[]>();specs.forEach(([name])=>matrices.set(name,[]));
  const pitched:{matrix:THREE.Matrix4;color:THREE.Color}[]=[];
  const transform=new THREE.Object3D(),local=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  // Instance colour is a neutral scalar, never a copy of the material hue, so a
  // material's own colour is applied exactly once. `shade` lets a single part
  // sit lighter (stone) or darker (a recess in shadow) inside the same batch.
  function tint(kind:RenderPartKind,index:number,slice=false,role?:string,shade=1){
    const pulse=((index*37)%17-8)/100;
    const value=1+(slice?(role==='corner'?.08:.035):0)+pulse*.45;
    let scale=shade;
    if(slice&&kind==='timber')scale*=.94;
    if(slice&&kind==='trim')scale*=1.04;
    const level=THREE.MathUtils.clamp(value*scale,.84,1.14);
    return new THREE.Color(level,level,level);
  }
  function box(kind:RenderPartKind,frame:{point:THREE.Vector3;yaw:number;index:number;visualSlice?:string;role?:string},x:number,y:number,z:number,w:number,h:number,d:number,shade?:number){
    local.set(x,y,z).applyAxisAngle(up,frame.yaw).add(frame.point);
    transform.position.copy(local);transform.rotation.set(0,frame.yaw,0);transform.scale.set(w,h,d);transform.updateMatrix();
    const entry={matrix:transform.matrix.clone(),color:tint(kind,frame.index,frame.visualSlice==='first-street',frame.role,shade)};
    (kind==='pitched'?pitched:matrices.get(kind)!).push(entry);
  }
  const length=journeyRoad.length;
  for(const site of townBuildingSites()){
      const {point,yaw,index,visualSlice,role}=site;
      const frame={point,yaw,index,visualSlice,role};
      for(const part of townBuildingParts(site))box(part.kind,frame,part.x,part.y,part.z,part.w,part.h,part.d,part.shade);
  }
  // A continuous pavement ribbon makes the destinations part of one street.
  for(let distance=TOWN_START*length;distance<TOWN_END*length;distance+=5){
    for(const side of [-1,1]){
      if(side===1&&['cafe','tennis'].some(id=>Math.abs(Math.abs(distance-stopDistance(id as 'cafe'|'tennis'))-108)<22))continue;
      const road=journeyRoad.frame(distance,side*8),frame={point:road.point,yaw:road.yaw,index:Math.round(distance/27)};
      box('pavement',frame,0,-.025,0,3.2,.17,4.98);
    }
  }
  const geometry=new THREE.BoxGeometry(1,1,1);
  for(const [name] of specs){
    const values=matrices.get(name)!;
    const material=materials.get(name)!;
    const mesh=new THREE.InstancedMesh(geometry,material,values.length);mesh.name=`Town ${name}`;
    values.forEach(({matrix,color},i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color);});
    mesh.castShadow=name!=='pavement';mesh.receiveShadow=true;group.add(mesh);
  }
  const shape=new THREE.Shape();shape.moveTo(-.5,0);shape.lineTo(0,1);shape.lineTo(.5,0);shape.closePath();
  const roofGeometry=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});roofGeometry.translate(0,0,-.5);
  const roofs=new THREE.InstancedMesh(roofGeometry,materials.get('roof')!,pitched.length);roofs.name='Town pitched roofs';
  pitched.forEach(({matrix,color},i)=>{roofs.setMatrixAt(i,matrix);roofs.setColorAt(i,color);});roofs.castShadow=roofs.receiveShadow=true;group.add(roofs);
  return group;
}
