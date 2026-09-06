import {afterEach,it,expect,vi} from 'vitest';
import {waitForGpu} from './gpu-ready';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
function context(){return {SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,fenceSync:vi.fn(()=>({})),flush:vi.fn(),deleteSync:vi.fn(),clientWaitSync:vi.fn(()=>0)};}
it('waits asynchronously for submitted draws and releases the fence',async()=>{
  vi.useFakeTimers();const gl=context();gl.clientWaitSync.mockReturnValueOnce(0).mockReturnValue(3);
  const ready=waitForGpu(gl as unknown as WebGL2RenderingContext,new AbortController().signal);expect(gl.flush).toHaveBeenCalledOnce();expect(gl.deleteSync).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(8);expect(await ready).toBe(true);expect(gl.deleteSync).toHaveBeenCalledOnce();
});
it('cancels pending work and deletes its fence when loading is aborted',async()=>{
  vi.useFakeTimers();const gl=context(),controller=new AbortController();const ready=waitForGpu(gl as unknown as WebGL2RenderingContext,controller.signal);
  const rejected=expect(ready).rejects.toMatchObject({name:'AbortError'});controller.abort();await rejected;await vi.advanceTimersByTimeAsync(100);expect(gl.clientWaitSync).toHaveBeenCalledOnce();expect(gl.deleteSync).toHaveBeenCalledOnce();
});
it('does not hold the loading screen indefinitely when completion fails',async()=>{
  const gl=context();gl.clientWaitSync.mockReturnValue(4);expect(await waitForGpu(gl as unknown as WebGL2RenderingContext,new AbortController().signal)).toBe(false);expect(gl.deleteSync).toHaveBeenCalledOnce();
});
it('stops polling after three seconds when the GPU never signals',async()=>{
  vi.useFakeTimers();let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
  const gl=context(),ready=waitForGpu(gl as unknown as WebGL2RenderingContext,new AbortController().signal);
  now=3000;await vi.advanceTimersByTimeAsync(8);
  expect(await ready).toBe(false);expect(gl.deleteSync).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('skips fence waiting when the context does not provide WebGL2 synchronization',async()=>{
  expect(await waitForGpu({} as WebGLRenderingContext,new AbortController().signal)).toBe(false);
});
