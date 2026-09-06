import * as THREE from 'three';
import type {SceneResources} from './scene-resources';
export type CanopyTree={point:THREE.Vector3;scale:number;yaw:number};
const VIEWS=8,COLUMNS=4,TILE=512,NEAR=4,FAR=600;

export function createTreeCanopy(source:THREE.Group,renderer:THREE.WebGLRenderer,resources:SceneResources){
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const height=16,width=Math.hypot(size.x,size.z)*height/size.y*1.08;
  const model=new THREE.Group();
  source.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const geometry=object.geometry.clone();
    for(const name of ['position','normal']){
      const attr=geometry.getAttribute(name);if(!attr)continue;
      const values=new Float32Array(attr.count*3);
      for(let i=0;i<attr.count;i++){values[i*3]=attr.getX(i);values[i*3+1]=attr.getY(i);values[i*3+2]=attr.getZ(i);}
      geometry.setAttribute(name,new THREE.BufferAttribute(values,3));
    }
    geometry.applyMatrix4(object.matrixWorld).translate(-center.x,-bounds.min.y,-center.z).scale(height/size.y,height/size.y,height/size.y);
    const materials=(Array.isArray(object.material)?object.material:[object.material]).map(m=>{const material=m.clone();material.side=THREE.DoubleSide;return material;});
    model.add(new THREE.Mesh(geometry,materials.length===1?materials[0]:materials));
  });
  resources.object(model);
  const atlas=resources.track(new THREE.WebGLRenderTarget(TILE*COLUMNS,TILE*2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false}));
  atlas.texture.colorSpace=THREE.SRGBColorSpace;
  const bake=new THREE.Scene();bake.add(model,new THREE.HemisphereLight('#d7e4db','#526049',2.4));
  const sun=new THREE.DirectionalLight('#fff1d4',2);sun.position.set(-8,18,-5);bake.add(sun);
  const camera=new THREE.OrthographicCamera(-width/2,width/2,height*1.025,-height*.025,.1,100);
  const target=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4());
  const scissorTest=renderer.getScissorTest(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),tone=renderer.toneMapping,shadows=renderer.shadowMap.enabled;
  try{
    renderer.shadowMap.enabled=false;renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor(0,0);atlas.scissorTest=true;
    for(let i=0;i<VIEWS;i++){
      const angle=i/VIEWS*Math.PI*2;camera.position.set(Math.sin(angle)*35,0,Math.cos(angle)*35);camera.lookAt(0,0,0);camera.updateMatrixWorld();
      // Render-target rectangles use texture pixels, independent of the screen pixel ratio.
      atlas.viewport.set(i%COLUMNS*TILE,Math.floor(i/COLUMNS)*TILE,TILE,TILE);
      atlas.scissor.copy(atlas.viewport);renderer.setRenderTarget(atlas);renderer.clear();renderer.render(bake,camera);
    }
  }finally{
    renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(clear,alpha);renderer.toneMapping=tone;renderer.shadowMap.enabled=shadows;
  }
  const group=new THREE.Group();group.name='Fir canopy with near geometry and distant views';
  // Four detailed trees are cheap to manage separately and can be culled in both camera and shadow views.
  const nearTrees=Array.from({length:NEAR},(_,index)=>{
    const tree=new THREE.Group();tree.name='Detailed fir';tree.visible=false;tree.userData.prewarmFirstDraw=index===0;
    for(const object of model.children){const mesh=object as THREE.Mesh,part=new THREE.Mesh(mesh.geometry,mesh.material);part.castShadow=part.receiveShadow=true;tree.add(part);}
    group.add(tree);return tree;
  });
  const plane=new THREE.PlaneGeometry(width,height*1.05).translate(0,height*.5,0);
  const frames=new THREE.InstancedBufferAttribute(new Float32Array(FAR),1);plane.setAttribute('canopyFrame',frames);
  const material=new THREE.MeshBasicMaterial({map:atlas.texture,alphaTest:.16,alphaToCoverage:true,side:THREE.DoubleSide,fog:true,color:'#b6c7ae'});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float canopyFrame;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vMapUv=(vMapUv*.996+.002+vec2(mod(canopyFrame,4.),floor(canopyFrame/4.)))/vec2(4.,2.);`);
  };material.customProgramCacheKey=()=> 'canopy-atlas-v1';
  const far=new THREE.InstancedMesh(plane,material,FAR);far.count=0;far.frustumCulled=false;group.add(far);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
  let previous=new THREE.Vector3(Infinity,Infinity,Infinity),previousBudget=NEAR;
  return {group,update(trees:CanopyTree[],viewer:THREE.Vector3,nearLimit=NEAR){
    if(previous.distanceToSquared(viewer)<4&&previousBudget===nearLimit)return;previous.copy(viewer);previousBudget=nearLimit;
    const visible=trees.filter(t=>t.point.distanceToSquared(viewer)<260**2).sort((a,b)=>a.point.distanceToSquared(viewer)-b.point.distanceToSquared(viewer));
    const near=visible.filter(t=>t.point.distanceToSquared(viewer)<32**2).slice(0,nearLimit),distant=visible.filter(t=>!near.includes(t)).slice(0,FAR);
    nearTrees.forEach((object,i)=>{const tree=near[i];object.visible=!!tree;if(tree){object.position.copy(tree.point);object.rotation.y=tree.yaw;object.scale.setScalar(tree.scale);}});
    far.count=distant.length;distant.forEach((tree,i)=>{const angle=Math.atan2(viewer.x-tree.point.x,viewer.z-tree.point.z);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,angle);matrix.compose(tree.point,q,scale.setScalar(tree.scale));far.setMatrixAt(i,matrix);frames.setX(i,Math.round(THREE.MathUtils.euclideanModulo(angle-tree.yaw,Math.PI*2)/(Math.PI*2)*VIEWS)%VIEWS);});
    far.instanceMatrix.needsUpdate=true;frames.needsUpdate=true;
  }};
}
