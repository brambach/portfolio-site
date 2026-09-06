import * as THREE from 'three';
import {townMaterial} from './town-materials';
import {journeyRoad,stopDistance} from './journey-route';
import {townBuildingSites,TOWN_START,TOWN_END} from './town-layout';
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
export function createTownPalette(){return new Map(specs.map(([name,color])=>[name,townMaterial(name,color)]));}

// Repeated street elements share one draw call per material.
export function createTownStreet(materials=createTownPalette()){
  const group=new THREE.Group();group.name='Small town main street';
  const matrices=new Map<string,THREE.Matrix4[]>();specs.forEach(([name])=>matrices.set(name,[]));
  const pitched:THREE.Matrix4[]=[];
  const transform=new THREE.Object3D(),local=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function box(kind:string,frame:{point:THREE.Vector3;yaw:number},x:number,y:number,z:number,w:number,h:number,d:number){
    local.set(x,y,z).applyAxisAngle(up,frame.yaw).add(frame.point);
    transform.position.copy(local);transform.rotation.set(0,frame.yaw,0);transform.scale.set(w,h,d);transform.updateMatrix();(kind==='pitched'?pitched:matrices.get(kind)!).push(transform.matrix.clone());
  }
  const length=journeyRoad.length;
  for(const {point,yaw,index,width} of townBuildingSites()){
      const frame={point,yaw},height=4.8+(index%3)*.7;
      const wall=index%3===0?'timber':'plaster';
      // Recess the glazing behind piers, lintels and sills instead of applying it to a solid wall.
      box(wall,frame,0,height/2,-1,width,height,8);
      for(const x of [-width*.27,width*.27]){
        box('glass',frame,x,2.25,-5.035,2,1.6,.06);
        for(const edge of [-1.06,1.06])box('timber',frame,x+edge,2.25,-5.085,.12,1.84,.12);
        for(const y of [1.39,3.11])box('trim',frame,x,y,-5.1,2.24,.12,.2);
        box('timber',frame,x,2.25,-5.09,.075,1.6,.1);
      }
      for(const x of [-width/2+.55,width/2-.55])box(wall,frame,x,height/2,4,1.1,height,2);
      box(wall,frame,0,height-.55,4,width,1.1,2);
      box(wall,frame,0,.3,4,width,.6,2);
      box('roof',frame,0,.13,4.3,width,.25,1.5);
      box('roof',frame,0,height+.1,0,width+1.1,.22,11.2);
      if(index%3!==1)box('pitched',frame,0,height+.18,0,width+1.1,2.3,11.2);
      else box('timber',frame,0,height+.38,-.2,width,.5,10);
      if(index%4===0)box('plaster',frame,width*.25,height+1.6,-2,.7,2,.8);
      box('glass',frame,-1.5,2.15,4.4,width-5,2.8,.08);
      box('glass',frame,width/2-2,1.6,4.4,1.5,3,.08);
      box('trim',frame,-1.5,.68,4.8,width-4.6,.17,.65);
      box('timber',frame,-1.5,3.62,4.8,width-4.6,.18,.65);
      for(let x=-width/2+1.2;x<width/2-2.5;x+=2.2)box('timber',frame,x,2.15,4.78,.1,2.95,.2);
      for(const x of [width/2-2.85,width/2-1.15])box('trim',frame,x,1.65,4.76,.13,3.3,.3);
      box('trim',frame,width/2-1.55,1.5,4.9,.055,.45,.08);
      box('roof',frame,0,3.85,6.1,width+.4,.16,3.2);
      for(const x of [-width/2+.7,width/2-.7])box('timber',frame,x,1.85,7.1,.16,3.7,.16);
      box('timber',frame,0,3.58,7.1,width-.8,.27,.17);
      box('pavement',frame,0,-.015,8,width+2,.19,6);
  }
  // A continuous pavement ribbon makes the destinations part of one street.
  for(let distance=TOWN_START*length;distance<TOWN_END*length;distance+=5){
    for(const side of [-1,1]){
      if(side===1&&['cafe','tennis'].some(id=>Math.abs(Math.abs(distance-stopDistance(id as 'cafe'|'tennis'))-108)<22))continue;
      const road=journeyRoad.frame(distance,side*8),frame={point:road.point,yaw:road.yaw};
      box('pavement',frame,0,-.015,0,3.2,.19,5.1);
    }
  }
  const geometry=new THREE.BoxGeometry(1,1,1);
  for(const [name] of specs){
    const values=matrices.get(name)!;
    const material=materials.get(name)!;
    const mesh=new THREE.InstancedMesh(geometry,material,values.length);mesh.name=`Town ${name}`;
    values.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=name!=='pavement';mesh.receiveShadow=true;group.add(mesh);
  }
  const shape=new THREE.Shape();shape.moveTo(-.5,0);shape.lineTo(0,1);shape.lineTo(.5,0);shape.closePath();
  const roofGeometry=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});roofGeometry.translate(0,0,-.5);
  const roofs=new THREE.InstancedMesh(roofGeometry,materials.get('roof')!,pitched.length);roofs.name='Town pitched roofs';
  pitched.forEach((matrix,i)=>roofs.setMatrixAt(i,matrix));roofs.castShadow=roofs.receiveShadow=true;group.add(roofs);
  return group;
}
