import * as THREE from 'three';
import type {SceneResources} from './scene-resources';
export type CanopyTree={point:THREE.Vector3;scale:number;yaw:number};
const VIEWS=8,COLUMNS=4,TILE=512,NEAR=4,FAR=600,DETAIL_IN=32,DETAIL_FULL=30,DETAIL_OUT=38,VIEW_DISTANCE=260;
type SlotState={tree:CanopyTree;slot:THREE.Group;coverage:number;target:number};

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
    for(const object of model.children){
      const mesh=object as THREE.Mesh;
      const materials=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(material=>{
        const copy=material.clone();copy.transparent=false;copy.alphaToCoverage=true;copy.depthWrite=true;
        const coverage={value:0};copy.userData.canopyCoverage=coverage;
        copy.onBeforeCompile=shader=>{
          shader.uniforms.canopyCoverage=coverage;
          shader.fragmentShader='uniform float canopyCoverage;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
            float coverageSample=fract(dot(floor(gl_FragCoord.xy),vec2(.754877666,.569840296)));
            if(coverageSample>=canopyCoverage)discard;`);
        };
        copy.customProgramCacheKey=()=> 'canopy-detail-coverage-v1';return copy;
      });
      const part=new THREE.Mesh(mesh.geometry,materials.length===1?materials[0]:materials);
      part.castShadow=part.receiveShadow=true;tree.add(part);
    }
    group.add(tree);return tree;
  });
  const plane=new THREE.PlaneGeometry(width,height*1.05).translate(0,height*.5,0);
  const frameA=new THREE.InstancedBufferAttribute(new Float32Array(FAR),1);plane.setAttribute('canopyFrameA',frameA);
  const frameB=new THREE.InstancedBufferAttribute(new Float32Array(FAR),1);plane.setAttribute('canopyFrameB',frameB);
  const frameMix=new THREE.InstancedBufferAttribute(new Float32Array(FAR),1);plane.setAttribute('canopyFrameMix',frameMix);
  const fades=new THREE.InstancedBufferAttribute(new Float32Array(FAR),1);plane.setAttribute('canopyFade',fades);
  const material=new THREE.MeshBasicMaterial({map:atlas.texture,alphaTest:.16,alphaToCoverage:true,side:THREE.DoubleSide,fog:true,color:'#b6c7ae'});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float canopyFrameA;\nattribute float canopyFrameB;\nattribute float canopyFrameMix;\nattribute float canopyFade;\nvarying float vCanopyFrameA;\nvarying float vCanopyFrameB;\nvarying float vCanopyFrameMix;\nvarying float vCanopyFade;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vCanopyFrameA=canopyFrameA;
      vCanopyFrameB=canopyFrameB;
      vCanopyFrameMix=canopyFrameMix;
      vCanopyFade=canopyFade;
      vMapUv=vMapUv*.996+.002;`);
    shader.fragmentShader='varying float vCanopyFrameA;\nvarying float vCanopyFrameB;\nvarying float vCanopyFrameMix;\nvarying float vCanopyFade;\nvec2 canopyAtlasUv(vec2 uv,float frame){return (uv+vec2(mod(frame,4.),floor(frame/4.)))/vec2(4.,2.);}\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec4 sampledDiffuseColorA=texture2D(map,canopyAtlasUv(vMapUv,vCanopyFrameA));
      vec4 sampledDiffuseColorB=texture2D(map,canopyAtlasUv(vMapUv,vCanopyFrameB));
      diffuseColor*=mix(sampledDiffuseColorA,sampledDiffuseColorB,vCanopyFrameMix);
    #endif`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      float coverageSample=fract(dot(floor(gl_FragCoord.xy),vec2(.754877666,.569840296)));
      if(coverageSample<1.-vCanopyFade)discard;`);
  };material.customProgramCacheKey=()=> 'canopy-atlas-v3';
  const far=new THREE.InstancedMesh(plane,material,FAR);far.count=0;far.frustumCulled=false;group.add(far);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
  const assigned=new Map<CanopyTree,SlotState>();
  function setSlotCoverage(slot:THREE.Group,coverage:number) {
    slot.userData.coverage=coverage;
    slot.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      for(const material of Array.isArray(object.material)?object.material:[object.material])material.userData.canopyCoverage.value=coverage;
    });
  }
  return {group,update(trees:CanopyTree[],viewer:THREE.Vector3,nearLimit=NEAR,dt=1/60){
    const elapsed=THREE.MathUtils.clamp(dt,0,0.25);
    const distanceTo=(tree:CanopyTree)=>tree.point.distanceTo(viewer);
    const visible=trees.map((tree,index)=>({tree,index,distance:distanceTo(tree)})).filter(entry=>entry.distance<VIEW_DISTANCE).sort((a,b)=>a.distance-b.distance||a.index-b.index);
    const visibleTrees=new Set(visible.map(entry=>entry.tree));
    for(const [tree,state] of [...assigned]){
      const distance=distanceTo(tree);
      state.target=!visibleTrees.has(tree)||distance>=DETAIL_OUT?0:THREE.MathUtils.smoothstep(DETAIL_OUT-distance,0,DETAIL_OUT-DETAIL_IN);
    }
    while([...assigned.values()].filter(state=>state.target>0).length>nearLimit){
      const state=[...assigned.values()].filter(candidate=>candidate.target>0).sort((a,b)=>distanceTo(b.tree)-distanceTo(a.tree))[0];
      state.target=0;
    }
    const free=nearTrees.filter(slot=>![...assigned.values()].some(state=>state.slot===slot));
    for(const entry of visible){
      if([...assigned.values()].filter(state=>state.target>0).length>=nearLimit)break;
      if(entry.distance>=DETAIL_OUT||assigned.has(entry.tree))continue;
      const slot=free.shift();if(!slot)break;
      const target=THREE.MathUtils.smoothstep(DETAIL_OUT-entry.distance,0,DETAIL_OUT-DETAIL_IN);
      assigned.set(entry.tree,{tree:entry.tree,slot,coverage:0,target});slot.visible=true;setSlotCoverage(slot,0);
    }
    for(const [tree,state] of assigned){
      state.coverage=THREE.MathUtils.damp(state.coverage,state.target,8,elapsed);
      state.slot.visible=state.coverage>.01;
      state.slot.position.copy(tree.point);state.slot.rotation.y=tree.yaw;state.slot.scale.setScalar(tree.scale);
      setSlotCoverage(state.slot,state.coverage);
      if(state.coverage<=.01&&state.target===0){assigned.delete(tree);state.slot.visible=false;setSlotCoverage(state.slot,0);}
    }
    for(const slot of nearTrees)if(![...assigned.values()].some(state=>state.slot===slot))slot.visible=false;
    const distant=visible.slice(0,FAR);
    far.count=distant.length;distant.forEach(({tree},i)=>{
      const angle=Math.atan2(viewer.x-tree.point.x,viewer.z-tree.point.z);
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,angle);
      const state=assigned.get(tree),targetFade=state?1-state.coverage:1;
      matrix.compose(tree.point,q,scale.setScalar(tree.scale));far.setMatrixAt(i,matrix);
      const raw=THREE.MathUtils.euclideanModulo(angle-tree.yaw,Math.PI*2)/(Math.PI*2)*VIEWS;
      const base=Math.floor(raw)%VIEWS;
      frameA.setX(i,base);frameB.setX(i,(base+1)%VIEWS);frameMix.setX(i,raw-Math.floor(raw));fades.setX(i,Math.max(0,Math.min(1,targetFade)));
    });
    far.instanceMatrix.needsUpdate=true;frameA.needsUpdate=true;frameB.needsUpdate=true;frameMix.needsUpdate=true;fades.needsUpdate=true;
  }};
}
