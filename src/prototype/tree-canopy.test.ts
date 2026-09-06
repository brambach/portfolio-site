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
  canopy.update(trees,viewer,4);expect(detailed()).toBe(4);expect(baked.count).toBe(0);
  canopy.update(trees,viewer,2);expect(detailed()).toBe(2);expect(baked.count).toBe(2);
  canopy.update(trees,viewer,4);expect(detailed()).toBe(4);expect(baked.count).toBe(0);
  resources.object(canopy.group);resources.dispose();
  source.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});
});
