import {describe,expect,it,vi} from 'vitest';
import {BoxGeometry,BufferGeometry,DirectionalLight,Group,LineSegments,LineBasicMaterial,Mesh,MeshStandardMaterial,Texture,WebGLRenderTarget} from 'three';
import {SceneResources} from './scene-resources';

describe('scene resource lifetime',()=>{
  it('releases shared court net and fence line resources once',()=>{
    const resources=new SceneResources(),geometry=new BufferGeometry(),material=new LineBasicMaterial();
    const group=new Group();group.add(new LineSegments(geometry,material),new LineSegments(geometry,material));
    const geometryDispose=vi.spyOn(geometry,'dispose'),materialDispose=vi.spyOn(material,'dispose');
    resources.object(group);resources.dispose();resources.dispose();
    expect(geometryDispose).toHaveBeenCalledOnce();expect(materialDispose).toHaveBeenCalledOnce();
  });
  it('releases the shadow render target when the scene leaves',()=>{
    const resources=new SceneResources(),light=new DirectionalLight();
    light.shadow.map=new WebGLRenderTarget(16,16);
    const dispose=vi.spyOn(light.shadow.map,'dispose');
    resources.object(light);resources.dispose();resources.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('disposes resources once, including late loader results',async()=>{
    const resources=new SceneResources();
    const early={dispose:vi.fn()},late={dispose:vi.fn()};resources.track(early);
    const loading=Promise.resolve().then(()=>resources.track(late));
    resources.dispose();resources.dispose();await loading;resources.track(late);
    expect(early.dispose).toHaveBeenCalledOnce();expect(late.dispose).toHaveBeenCalledOnce();
    expect(()=>resources.assertActive()).toThrow('Scene loading was cancelled.');
  });
  it('collects shared geometry and texture references before materials change',()=>{
    const resources=new SceneResources(),geometry=new BoxGeometry(),texture=new Texture();
    const material=new MeshStandardMaterial({map:texture});const group=new Group();
    group.add(new Mesh(geometry,material),new Mesh(geometry,material));
    const geometryDispose=vi.spyOn(geometry,'dispose'),textureDispose=vi.spyOn(texture,'dispose'),materialDispose=vi.spyOn(material,'dispose');
    resources.object(group);material.map=null;resources.object(group);resources.release(geometry);resources.dispose();
    expect(geometryDispose).toHaveBeenCalledOnce();expect(textureDispose).toHaveBeenCalledOnce();expect(materialDispose).toHaveBeenCalledOnce();
  });
});
