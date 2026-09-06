import {afterEach,expect,it,vi} from 'vitest';
import {loadingBatches} from './loading-batches';

afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('preserves construction order across yields without skipping or repeating work',async()=>{
  vi.useFakeTimers();let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
  const seen:number[]=[];
  const ready=loadingBatches([1,2,3,4],item=>{seen.push(item);now+=5;},new AbortController().signal);
  expect(seen).toEqual([1,2]);
  await vi.runAllTimersAsync();await ready;
  expect(seen).toEqual([1,2,3,4]);expect(vi.getTimerCount()).toBe(0);
});
it('does no construction when the scene is already cancelled',async()=>{
  const controller=new AbortController(),work=vi.fn();controller.abort();
  await expect(loadingBatches([1],work,controller.signal)).rejects.toMatchObject({name:'AbortError'});
  expect(work).not.toHaveBeenCalled();
});
it('propagates a construction failure without continuing later items',async()=>{
  const error=new Error('Geometry failed'),work=vi.fn(()=>{throw error;});
  await expect(loadingBatches([1,2],work,new AbortController().signal)).rejects.toBe(error);
  expect(work).toHaveBeenCalledOnce();
});
