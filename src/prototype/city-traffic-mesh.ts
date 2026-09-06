import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {trafficAcknowledgementLit,type CityTraffic} from './city-traffic';

export function createTrafficMeshes(group:THREE.Group,traffic:CityTraffic) {
  const count=traffic.cars.length;
  const bodyMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',metalness:.55,roughness:.35});
  const glass=new THREE.MeshStandardMaterial({color:'#152132',metalness:.4,roughness:.22});
  const rubber=new THREE.MeshStandardMaterial({color:'#101116',roughness:.95});
  function part(geometry:THREE.BufferGeometry,material:THREE.Material,multiple=1) {
    const mesh=new THREE.InstancedMesh(geometry,material,count*multiple);
    mesh.castShadow=mesh.receiveShadow=true;
    mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);return mesh;
  }
  const profile=new THREE.Shape();
  profile.moveTo(-2.08,.34);profile.lineTo(-2.08,.69);profile.lineTo(-1.78,.81);
  profile.lineTo(-1.1,.85);profile.lineTo(1.15,.82);profile.lineTo(1.98,.68);profile.lineTo(2.08,.64);profile.lineTo(2.08,.34);
  profile.lineTo(1.65,.32);profile.absarc(1.27,.32,.38,0,Math.PI,false);
  profile.lineTo(-.89,.32);profile.absarc(-1.27,.32,.38,0,Math.PI,false);profile.closePath();
  const bodyGeometry=new THREE.ExtrudeGeometry(profile,{depth:1.68,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:1,steps:1,curveSegments:8});
  bodyGeometry.rotateY(-Math.PI/2);bodyGeometry.translate(.84,0,0);
  const bodies=part(bodyGeometry,bodyMaterial);
  // The roof is narrower than the beltline, with sloped front and rear screens.
  const cabinGeometry=new THREE.BoxGeometry(1,1,1),cabinPositions=cabinGeometry.getAttribute('position');
  for(let i=0;i<cabinPositions.count;i++){
    const upper=cabinPositions.getY(i)>0,front=cabinPositions.getZ(i)>0;
    cabinPositions.setXYZ(i,Math.sign(cabinPositions.getX(i))*(upper?.65:.79),upper?1.38:.84,upper?(front?.45:-.83):(front?1.12:-1.37));
  }
  cabinGeometry.computeVertexNormals();
  const cabins=part(cabinGeometry,glass);
  const roofs=part(new RoundedBoxGeometry(1.35,.075,1.34,1,.025),bodyMaterial);
  const wheelGeometry=new THREE.CylinderGeometry(.32,.32,.19,12).rotateZ(Math.PI/2);
  const wheels=part(wheelGeometry,rubber,4);
  const hubs=part(new THREE.CylinderGeometry(.18,.18,.205,12).rotateZ(Math.PI/2),new THREE.MeshStandardMaterial({color:'#939b9c',metalness:.8,roughness:.32}),4);
  const trim=part(new THREE.BoxGeometry(1,1,1),rubber,8);
  const lights=part(new THREE.BoxGeometry(.43,.14,.03),new THREE.MeshBasicMaterial({color:'#fff1c6',toneMapped:false}),2);
  const tails=part(new THREE.BoxGeometry(.43,.14,.03),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),2);
  const indicators=part(new THREE.BoxGeometry(.18,.14,.035),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),4);
  lights.castShadow=tails.castShadow=indicators.castShadow=false;
  const matrix=new THREE.Matrix4(),local=new THREE.Matrix4(),world=new THREE.Matrix4(),q=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1),colour=new THREE.Color();
  const forwardAxis=new THREE.Vector3(0,0,1),trimQuaternion=new THREE.Quaternion(),trimScale=new THREE.Vector3(),trimPosition=new THREE.Vector3();
  function placeTrim(index:number,x:number,y:number,z:number,w:number,h:number,d:number,roll=0){
    trimPosition.set(x,y,z);trimScale.set(w,h,d);trimQuaternion.identity();
    if(roll)trimQuaternion.setFromAxisAngle(forwardAxis,roll);
    local.compose(trimPosition,trimQuaternion,trimScale);matrix.multiplyMatrices(world,local);trim.setMatrixAt(index,matrix);
  }
  function place(mesh:THREE.InstancedMesh,index:number,x:number,y:number,z:number){local.makeTranslation(x,y,z);matrix.multiplyMatrices(world,local);mesh.setMatrixAt(index,matrix);}
  traffic.cars.forEach((car,i)=>{colour.set(car.colour);bodies.setColorAt(i,colour);roofs.setColorAt(i,colour);});
  function update() {
    traffic.cars.forEach((car,i)=>{
      const pose=traffic.pose(car);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,pose.yaw);world.compose(pose.point,q,one);
      place(bodies,i,0,0,0);place(cabins,i,0,0,0);place(roofs,i,0,1.41,-.19);
      placeTrim(i*8,0,.48,2.09,.74,.13,.035);
      placeTrim(i*8+1,0,.37,2.10,1.55,.09,.05);
      placeTrim(i*8+2,0,.38,-2.10,1.55,.09,.05);
      placeTrim(i*8+3,-.72,1.11,-.24,.065,.55,.085,-.24);
      placeTrim(i*8+4,.72,1.11,-.24,.065,.55,.085,.24);
      placeTrim(i*8+5,-.91,.95,.72,.18,.13,.27);
      placeTrim(i*8+6,.91,.95,.72,.18,.13,.27);
      placeTrim(i*8+7,0,.84,1.12,1.55,.04,.06);
      const lit=trafficAcknowledgementLit(car.acknowledgement);
      let indicator=0;
      for(const x of [-.79,.79])for(const z of [-2.16,2.16]){
        const index=i*4+indicator++;place(indicators,index,x,.60,z);
        indicators.setColorAt(index,colour.setRGB(lit?3:.12,lit?.65:.04,.002));
      }
      let wheel=0;for(const x of [-.9,.9])for(const z of [-1.27,1.27]){const index=i*4+wheel++;place(wheels,index,x,.32,z);place(hubs,index,x,.32,z);}
      for(let side=0;side<2;side++) {
        const x=side===0?-.64:.64;
        place(lights,i*2+side,x,.59,2.14);place(tails,i*2+side,x,.60,-2.14);
        tails.setColorAt(i*2+side,colour.setRGB(car.braking?3:.55,.018,.007));
      }
    });
    for(const mesh of [bodies,cabins,roofs,wheels,hubs,trim,lights,tails,indicators])mesh.instanceMatrix.needsUpdate=true;
    if(indicators.instanceColor)indicators.instanceColor.needsUpdate=true;
    if(tails.instanceColor)tails.instanceColor.needsUpdate=true;
  }
  update();return {update};
}
