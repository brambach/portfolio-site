import {inTown} from './town-world';
import * as THREE from 'three';
import {scenicRoad,scenicAccess} from './scenic-route';
import {landHeight,LAKE_LEVEL,scenicLakeFrame} from './journey-land';
import {nearAccess} from './journey-route';

export function fernPlacements(heightAt=(x:number,z:number)=>landHeight(x,z,true)){
  const plants:{point:THREE.Vector3;height:number;yaw:number}[]=[];
  const parking=scenicAccess[0].road.frame(scenicAccess[0].parking).point;
  const inward=scenicLakeFrame.point.clone().sub(parking).normalize();
  for(let i=0;i<48;i++){
    const along=(i%2?1:-1)*(9+Math.floor(i/16)*7)+Math.sin(i*2.399)*1.5;
    const point=parking.clone().addScaledVector(scenicLakeFrame.tangent,along).addScaledVector(inward,8+Math.floor((i%16)/2)*.22);
    point.y=heightAt(point.x,point.z);
    if(inTown(point.x,point.z)||point.y<LAKE_LEVEL+.3||nearAccess(point.x,point.z,5,scenicAccess)||scenicRoad.nearest(point.x,point.z).away<7.5)continue;
    plants.push({point,height:.3+(i*7%11)/50,yaw:i*2.399});
  }
  for(let i=0;i<2400;i++){
    const frame=scenicRoad.frame(i/2400*scenicRoad.length,(i%2?1:-1)*(8+(i*17%90)/10));
    const point=frame.point;point.y=heightAt(point.x,point.z);
    if(inTown(point.x,point.z)||point.y<LAKE_LEVEL+.3||nearAccess(point.x,point.z,8,scenicAccess)||scenicRoad.nearest(point.x,point.z).away<7.5)continue;
    plants.push({point,height:.35+(i*13%31)/100,yaw:i*2.399});
  }
  return plants;
}

export function createRoadsideFerns(source:THREE.Object3D,heightAt?:(x:number,z:number)=>number){
  source.updateMatrixWorld(true);
  const candidates:THREE.Mesh[]=[];
  source.traverse(object=>{if(object instanceof THREE.Mesh)candidates.push(object);});
  candidates.sort((a,b)=>(a.geometry.index?.count??a.geometry.attributes.position.count)-(b.geometry.index?.count??b.geometry.attributes.position.count));
  const plant=candidates[0];
  if(!plant)throw new Error('The fern model has no geometry.');
  const geometry=plant.geometry.clone().applyMatrix4(plant.matrixWorld);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox!,height=bounds.max.y-bounds.min.y;
  geometry.translate(0,-bounds.min.y,0);geometry.scale(1/height,1/height,1/height);
  const original=Array.isArray(plant.material)?plant.material[0]:plant.material;
  const material=original.clone();
  const mesh=new THREE.InstancedMesh(geometry,material,64);mesh.name='Nearby roadside ferns';
  mesh.castShadow=false;mesh.receiveShadow=true;mesh.count=0;
  const plants=fernPlacements(heightAt).map(plant=>({...plant,distance:0})),nearby:typeof plants=[],transform=new THREE.Object3D();
  return {mesh,update(viewer:THREE.Vector3){
    nearby.length=0;
    for(const plant of plants){
      plant.distance=Math.hypot(plant.point.x-viewer.x,plant.point.z-viewer.z);
      if(plant.distance<52)nearby.push(plant);
    }
    nearby.sort((a,b)=>a.distance-b.distance);
    const limit=nearby.length>64?nearby[64].distance:52,count=Math.min(64,nearby.length);
    for(let i=0;i<count;i++){
      const plant=nearby[i],scale=plant.height*THREE.MathUtils.smoothstep(limit-plant.distance,0,14);
      transform.position.copy(plant.point);transform.rotation.set(0,plant.yaw,0);transform.scale.setScalar(scale);transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  }};
}
