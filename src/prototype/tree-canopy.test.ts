import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {createTreeCanopy} from './tree-canopy';
import {SceneResources} from './scene-resources';
it('restores the shared renderer and disposes the atlas after a failed bake',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const prior=new THREE.WebGLRenderTarget(8,8),viewport=new THREE.Vector4(2,3,200,150),scissor=new THREE.Vector4(4,5,100,80);
  let current:THREE.WebGLRenderTarget|null=prior,colour=new THREE.Color('#345678'),alpha=.7,clipping=false;
  let atlas:THREE.WebGLRenderTarget|undefined;
  const renderer={
    shadowMap:{enabled:true},toneMapping:THREE.ACESFilmicToneMapping,
    getRenderTarget:()=>current,setRenderTarget:(target:THREE.WebGLRenderTarget|null)=>{current=target;if(target!==prior&&target)atlas=target;},
    getViewport:(out:THREE.Vector4)=>out.copy(viewport),setViewport:vi.fn(),getScissor:(out:THREE.Vector4)=>out.copy(scissor),setScissor:vi.fn(),
    getScissorTest:()=>clipping,setScissorTest:(value:boolean)=>{clipping=value;},
    getClearColor:(out:THREE.Color)=>out.copy(colour),getClearAlpha:()=>alpha,setClearColor:(value:THREE.ColorRepresentation,a:number)=>{colour=new THREE.Color(value);alpha=a;},
    clear:vi.fn(),render:()=>{throw new Error('context lost');},
  };
  const resources=new SceneResources();
  expect(()=>createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources)).toThrow('context lost');
  expect(current).toBe(prior);expect(renderer.shadowMap.enabled).toBe(true);expect(renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
  expect(renderer.setViewport).toHaveBeenCalledOnce();expect(renderer.setScissor).toHaveBeenCalledOnce();expect(atlas!.viewport.toArray()).toEqual([0,0,512,512]);expect(renderer.setViewport).toHaveBeenLastCalledWith(viewport);expect(renderer.setScissor).toHaveBeenLastCalledWith(scissor);expect(clipping).toBe(false);expect(alpha).toBe(.7);expect(colour.getHexString()).toBe('345678');
  const dispose=vi.spyOn(atlas!,'dispose');resources.dispose();resources.dispose();expect(dispose).toHaveBeenCalledOnce();
  prior.dispose();source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('preserves trees as baked views when the detail budget changes without camera movement',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const trees=[3,5,8,11].map(x=>({point:new THREE.Vector3(x,0,0),scale:1,yaw:0})),viewer=new THREE.Vector3();
  const detailed=()=>canopy.group.children.filter(object=>object.name==='Detailed fir'&&object.visible).length;
  const baked=canopy.group.children.find(object=>object instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
  canopy.update(trees,viewer,4);expect(detailed()).toBe(4);expect(baked.count).toBe(4);
  canopy.update(trees,viewer,2);expect(detailed()).toBe(4);expect(baked.count).toBe(4);
  canopy.update(trees,viewer,4);expect(detailed()).toBe(4);expect(baked.count).toBe(4);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('keeps detailed tree slots bound to their tree through small viewer movement',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const trees=[
    {point:new THREE.Vector3(-1,0,10),scale:1,yaw:0},
    {point:new THREE.Vector3(1,0,10),scale:1,yaw:0},
    {point:new THREE.Vector3(-3,0,12),scale:1,yaw:0},
    {point:new THREE.Vector3(3,0,12),scale:1,yaw:0},
    {point:new THREE.Vector3(0,0,9.8),scale:1,yaw:0},
  ];
  canopy.update(trees,new THREE.Vector3(0,0,0),4);
  const detailed=canopy.group.children.filter(object=>object.name==='Detailed fir');
  const firstPositions=detailed.map(object=>object.position.clone());
  canopy.update(trees,new THREE.Vector3(.2,0,0),4);
  expect(detailed.map((object,i)=>object.position.distanceTo(firstPositions[i]))).toEqual([0,0,0,0]);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('keeps authored scale while coverage overlaps baked and detailed tree representations',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const tree={point:new THREE.Vector3(34,0,0),scale:1,yaw:0};
  canopy.update([tree],new THREE.Vector3(),4);
  const detailed=canopy.group.children.filter(object=>object.name==='Detailed fir'&&object.visible);
  const baked=canopy.group.children.find(object=>object instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
  expect(detailed).toHaveLength(1);
  expect(detailed[0].scale.x).toBe(1);
  expect(detailed[0].userData.coverage).toBeGreaterThan(0);
  expect(detailed[0].userData.coverage).toBeLessThan(1);
  expect(baked.count).toBe(1);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('updates sub-two-metre motion and demotes without shrinking the authored transform',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const tree={point:new THREE.Vector3(20,0,0),scale:1.35,yaw:0};
  canopy.update([tree],new THREE.Vector3(),4,.05);
  const detailed=canopy.group.children.find(object=>object.name==='Detailed fir'&&object.visible)!;
  const firstCoverage=detailed.userData.coverage;
  canopy.update([tree],new THREE.Vector3(.5,0,0),4,.05);
  expect(detailed.userData.coverage).toBeGreaterThan(firstCoverage);
  tree.point.set(36,0,0);
  canopy.update([tree],new THREE.Vector3(.5,0,0),4,.05);
  expect(detailed.scale.x).toBe(1.35);
  expect(detailed.userData.coverage).toBeGreaterThan(0);
  expect(detailed.userData.coverage).toBeLessThan(1);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('keeps fading detail slots until elapsed coverage reaches zero',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const tree={point:new THREE.Vector3(12,0,0),scale:1,yaw:0};
  for(let i=0;i<6;i++)canopy.update([tree],new THREE.Vector3(),4,.08);
  const detailed=canopy.group.children.find(object=>object.name==='Detailed fir'&&object.visible)!;
  tree.point.set(42,0,0);
  canopy.update([tree],new THREE.Vector3(),4,.08);
  expect(detailed.visible).toBe(true);
  expect(detailed.userData.coverage).toBeGreaterThan(0);
  expect(detailed.scale.x).toBe(1);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});

it('exposes adjacent atlas frame attributes and blend weights',()=>{
  const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
  const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,
    getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(out:THREE.Vector4)=>out.set(0,0,100,100),setViewport:vi.fn(),
    getScissor:(out:THREE.Vector4)=>out.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),
    getClearColor:(out:THREE.Color)=>out.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
  const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
  const far=canopy.group.children.find(object=>object instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
  canopy.update([{point:new THREE.Vector3(1,0,-20),scale:1,yaw:0}],new THREE.Vector3(),0,.05);
  const frameA=far.geometry.getAttribute('canopyFrameA') as THREE.InstancedBufferAttribute;
  const frameB=far.geometry.getAttribute('canopyFrameB') as THREE.InstancedBufferAttribute;
  const mix=far.geometry.getAttribute('canopyFrameMix') as THREE.InstancedBufferAttribute;
  expect(frameA.getX(0)).not.toBe(frameB.getX(0));
  expect(mix.getX(0)).toBeGreaterThan(0);
  expect(mix.getX(0)).toBeLessThan(1);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});
