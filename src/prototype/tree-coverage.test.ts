import {expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {createTreeCanopy} from './tree-canopy';
import {SceneResources} from './scene-resources';
it('uses opaque complementary coverage so fading detail cannot depth-occlude its billboard',()=>{
 const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,8,2),new THREE.MeshStandardMaterial()));
 const renderer={shadowMap:{enabled:true},toneMapping:THREE.NoToneMapping,getRenderTarget:()=>null,setRenderTarget:vi.fn(),getViewport:(o:THREE.Vector4)=>o.set(0,0,100,100),setViewport:vi.fn(),getScissor:(o:THREE.Vector4)=>o.set(0,0,100,100),setScissor:vi.fn(),getScissorTest:()=>false,setScissorTest:vi.fn(),getClearColor:(o:THREE.Color)=>o.set('#000'),getClearAlpha:()=>1,setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()};
 const resources=new SceneResources(),canopy=createTreeCanopy(source,renderer as unknown as THREE.WebGLRenderer,resources);
 canopy.update([{point:new THREE.Vector3(20,0,0),scale:1.3,yaw:0}],new THREE.Vector3(),4,.05);
 const slot=canopy.group.children.find(o=>o.name==='Detailed fir'&&o.visible)!;
 const mat=(slot.children[0] as THREE.Mesh).material as THREE.Material;
 expect(mat.transparent).toBe(false);
 expect(mat.opacity).toBe(1);
 expect(slot.scale.x).toBe(1.3);
 resources.object(canopy.group);resources.dispose();
});
