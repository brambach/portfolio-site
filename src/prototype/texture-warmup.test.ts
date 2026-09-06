import {afterEach,expect,it,vi} from 'vitest';
import {BoxGeometry,Group,Mesh,MeshStandardMaterial,Texture} from 'three';
import {warmTextures} from './texture-warmup';

afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('uploads shared maps once and leaves render target textures alone',async()=>{
  const root=new Group(),map=new Texture(),normal=new Texture(),target=new Texture();
  target.isRenderTargetTexture=true;
  const material=new MeshStandardMaterial({map,normalMap:normal,envMap:target});
  root.add(new Mesh(new BoxGeometry(),material),new Mesh(new BoxGeometry(),[material,material]));
  const renderer={initTexture:vi.fn()};
  await warmTextures(root,renderer,new AbortController().signal);
  expect(renderer.initTexture.mock.calls.map(call=>call[0])).toEqual([map,normal]);
});

it('yields after an expensive upload and stops before touching a disposed renderer',async()=>{
  vi.useFakeTimers();let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
  const root=new Group(),controller=new AbortController();
  root.add(new Mesh(new BoxGeometry(),new MeshStandardMaterial({map:new Texture(),normalMap:new Texture()})));
  const renderer={initTexture:vi.fn(()=>{now+=12;})};
  const ready=warmTextures(root,renderer,controller.signal);
  expect(renderer.initTexture).toHaveBeenCalledOnce();
  const rejected=expect(ready).rejects.toMatchObject({name:'AbortError'});
  controller.abort();await vi.runAllTimersAsync();await rejected;
  expect(renderer.initTexture).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
