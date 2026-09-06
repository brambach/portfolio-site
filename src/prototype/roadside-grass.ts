import * as THREE from 'three';
import {fernPlacements} from './roadside-ferns';

// Short bent blades share one mesh. Vertex colour keeps the roots darker than the dry tips.
export function createRoadsideGrass(heightAt:(x:number,z:number)=>number){
  const vertices:number[]=[],colours:number[]=[];
  const root=new THREE.Color('#38472b'),tip=new THREE.Color('#8b9060');
  for(let i=0;i<36;i++){
    const angle=i*2.399,radius=Math.sqrt((i+.5)/36)*1.15;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    const height=.16+(i*17%19)/100,width=.018+(i%4)*.005;
    const dx=Math.cos(angle+1.1)*width,dz=Math.sin(angle+1.1)*width;
    const leanX=Math.cos(angle)*height*.4,leanZ=Math.sin(angle)*height*.4;
    vertices.push(x-dx,0,z-dz,x+dx,0,z+dz,x+leanX,height,z+leanZ);
    for(const colour of [root,root,tip])colours.push(colour.r,colour.g,colour.b);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
  const mesh=new THREE.InstancedMesh(geometry,material,128);mesh.name='Low roadside grass';mesh.count=0;mesh.receiveShadow=true;
  const up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3();
  const plants=fernPlacements(heightAt).map(plant=>{
    const {x,z}=plant.point;
    normal.set(heightAt(x-.35,z)-heightAt(x+.35,z),.7,heightAt(x,z-.35)-heightAt(x,z+.35)).normalize();
    return {...plant,distance:0,rotation:new THREE.Quaternion().setFromUnitVectors(up,normal)};
  });
  const nearby:typeof plants=[],transform=new THREE.Object3D();
  return {mesh,update(viewer:THREE.Vector3){
    nearby.length=0;
    for(const plant of plants){
      plant.distance=Math.hypot(plant.point.x-viewer.x,plant.point.z-viewer.z);
      if(plant.distance<58)nearby.push(plant);
    }
    nearby.sort((a,b)=>a.distance-b.distance);
    const count=Math.min(128,nearby.length),limit=nearby.length>128?nearby[128].distance:58;
    for(let i=0;i<count;i++){
      const plant=nearby[i],fade=THREE.MathUtils.smoothstep(limit-plant.distance,0,14);
      transform.position.copy(plant.point);transform.quaternion.copy(plant.rotation);transform.rotateY(plant.yaw);
      transform.scale.setScalar(fade*(.85+plant.height*.4));transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  }};
}
