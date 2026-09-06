import {inTown} from './town-world';
import * as THREE from 'three';
import {lakeRadius,landHeight,scenicLakeFrame,LAKE_LEVEL} from './journey-land';
import {journeyRoad,nearAccess} from './journey-route';
import {scenicAccess} from './scenic-route';

export function colourTerrain(geometry:THREE.BufferGeometry){
  const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
  const colours=new Float32Array(positions.count*3),shoreBlend=new Float32Array(positions.count);
  const earth=new THREE.Color('#8c826b'),grass=new THREE.Color('#62764c'),moss=new THREE.Color('#3e5439'),stone=new THREE.Color('#9a998c'),sand=new THREE.Color('#b8b6aa'),colour=new THREE.Color();
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i),patch=.5+.25*Math.sin(x*.035+z*.024)+.25*Math.cos(x*.017-z*.031);
    const slope=1-Math.abs(normals.getY(i));
    shoreBlend[i]=(1-THREE.MathUtils.smoothstep(lakeRadius(x,z,true),1.04,1.3))*(1-THREE.MathUtils.smoothstep(positions.getY(i),.2,1.4));
    if(shoreBlend[i]>0)for(const access of scenicAccess){
      const nearest=access.road.nearest(x,z);
      if(nearest.distance>=0&&nearest.distance<=access.road.length)shoreBlend[i]*=THREE.MathUtils.smoothstep(nearest.away,3,7);
    }
    colour.copy(grass).lerp(moss,patch*.75).lerp(earth,THREE.MathUtils.smoothstep(patch,.62,.95));
    colour.lerp(stone,THREE.MathUtils.smoothstep(slope,.12,.48));
    colour.lerp(sand,1-THREE.MathUtils.smoothstep(lakeRadius(x,z,true),1.04,1.24));
    colours[i*3]=colour.r;colours[i*3+1]=colour.g;colours[i*3+2]=colour.b;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colours,3));
  geometry.setAttribute('shoreBlend',new THREE.BufferAttribute(shoreBlend,1));
}

export function blendShoreMaterial(material:THREE.MeshStandardMaterial){
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float shoreBlend;\nvarying float vShoreBlend;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShoreBlend = shoreBlend;');
    shader.fragmentShader='varying float vShoreBlend;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float shoreGrain = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.52, 0.51, 0.47) * (0.55 + shoreGrain * 1.6), vShoreBlend);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, vShoreBlend * 0.6));');
  };
  material.customProgramCacheKey=()=> 'scenic-shore-sand-v2';
}

function graniteTexture(){
  const size=128,data=new Uint8Array(size*size*4);
  let seed=731;
  for(let i=0;i<size*size;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const grain=seed/4294967296;
    const value=grain<.045?105:grain>.94?245:196+Math.round(grain*36);
    data.set([value,Math.min(255,value+2),Math.min(255,value+3),255],i*4);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(3,3);texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

export function addScenicRocks(parent:THREE.Group,heightAt=(x:number,z:number)=>landHeight(x,z,true)){
  const geometry=new THREE.DodecahedronGeometry(1,1),vertices=geometry.getAttribute('position');
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),shape=.88+.08*Math.sin(x*7+z*3)*Math.cos(y*5-z*4);
    vertices.setXYZ(i,x*shape,y*shape,z*shape);
  }
  geometry.computeVertexNormals();
  // Share lighting normals across duplicate positions while preserving the UV seams.
  const normals=geometry.getAttribute('normal'),shared=new Map<string,THREE.Vector3>(),keys:string[]=[];
  for(let i=0;i<vertices.count;i++){
    const key=[vertices.getX(i),vertices.getY(i),vertices.getZ(i)].map(value=>Math.round(value*100000)).join(',');
    keys.push(key);
    if(!shared.has(key))shared.set(key,new THREE.Vector3());
    shared.get(key)!.add(new THREE.Vector3(normals.getX(i),normals.getY(i),normals.getZ(i)));
  }
  for(const normal of shared.values())normal.normalize();
  for(let i=0;i<vertices.count;i++){const normal=shared.get(keys[i])!;normals.setXYZ(i,normal.x,normal.y,normal.z);}
  const material=new THREE.MeshStandardMaterial({color:'#bcb9b2',map:graniteTexture(),roughness:.92});
  const rocks=new THREE.InstancedMesh(geometry,material,672);rocks.name='Scattered granite';rocks.receiveShadow=true;
  const transform=new THREE.Object3D(),colour=new THREE.Color();let count=0;
  for(let i=0;i<600;i++){
    const frame=journeyRoad.frame(i/600*journeyRoad.length,(i%2?1:-1)*(12+(i*31%73)));
    const {x,z}=frame.point,y=heightAt(x,z);
    if(inTown(x,z)||y<-.3||nearAccess(x,z,9,scenicAccess))continue;
    const size=.35+(i*17%23)/16;
    if(journeyRoad.nearest(x,z).away<6+size*1.3)continue;
    transform.position.set(x,y+size*.14,z);transform.rotation.set(i*.71,i*2.399,i*.43);transform.scale.set(size*1.3,size*.6,size);transform.updateMatrix();
    rocks.setMatrixAt(count,transform.matrix);colour.setHSL(.105,.06+(i%4)*.015,.63+(i%5)*.025,THREE.SRGBColorSpace);rocks.setColorAt(count,colour);count++;
  }
  const parking=scenicAccess[0].road.frame(scenicAccess[0].parking).point;
  const inward=scenicLakeFrame.point.clone().sub(parking).normalize();
  for(let i=0;i<80;i++){
    const foreground=i>=72;
    if(!foreground&&i%3===1)continue;
    const along=foreground?(i%2?1:-1)*(6+Math.floor((i-72)/2)*2.5):-35+i/71*70+Math.sin(i*2.4)*1.2;
    if(!foreground&&(Math.abs(along)<5||Math.sin(along*.28+.5)+.55*Math.sin(along*.71)<-.1))continue;
    const base=parking.clone().addScaledVector(scenicLakeFrame.tangent,along);
    let low=5,high=55;
    const at=(distance:number)=>base.clone().addScaledVector(inward,distance);
    const outer=at(high);if(landHeight(outer.x,outer.z,true)>LAKE_LEVEL+.1)continue;
    for(let step=0;step<12;step++){
      const middle=(low+high)/2,point=at(middle);
      if(landHeight(point.x,point.z,true)>LAKE_LEVEL+.1)low=middle;else high=middle;
    }
    const point=at((low+high)/2+Math.sin(i*1.7)*.55-(foreground?1.2:0)),size=foreground?.8+(i*13%7)/20:.35+(i*13%11)/20,y=heightAt(point.x,point.z);
    const blocksLane=scenicAccess.some(access=>{
      const nearest=access.road.nearest(point.x,point.z);
      return nearest.distance>=0&&nearest.distance<=access.road.length&&nearest.away<6+size*1.3;
    });
    if(blocksLane||journeyRoad.nearest(point.x,point.z).away<6+size*1.3)continue;
    transform.position.set(point.x,y+size*.12,point.z);transform.rotation.set(i*.41,i*2.399,i*.19);transform.scale.set(size*1.3,size*.6,size);transform.updateMatrix();
    rocks.setMatrixAt(count,transform.matrix);colour.setHSL(.105,.045,.68+(i%5)*.025,THREE.SRGBColorSpace);rocks.setColorAt(count,colour);count++;
  }
  rocks.count=count;rocks.computeBoundingSphere();parent.add(rocks);return rocks;
}
