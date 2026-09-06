import * as THREE from 'three';
export function createCoffeeCup(){
  const cup=new THREE.Group();cup.name='Flat white to go';
  const paper=new THREE.MeshStandardMaterial({color:'#e5dbbf',roughness:.93});
  const sleeve=new THREE.MeshStandardMaterial({color:'#345246',roughness:1});
  const lid=new THREE.MeshStandardMaterial({color:'#dad7c6',roughness:.75});
  function part(top:number,bottom:number,height:number,y:number,material:THREE.Material){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,24),material);mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;cup.add(mesh);}
  part(.039,.029,.10,.05,paper);part(.036,.033,.034,.048,sleeve);part(.043,.043,.008,.105,lid);part(.036,.041,.009,.113,lid);
  return cup;
}
