import {expect,it,vi} from 'vitest';
import {createGpuTiming} from './gpu-timing';

function harness(){
  let ready=false,disjoint=false;
  const gl={
    QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
    getExtension:()=>({TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4}),
    createQuery:vi.fn(()=>({})),deleteQuery:vi.fn(),beginQuery:vi.fn(),endQuery:vi.fn(),
    isContextLost:()=>false,getParameter:()=>disjoint,
    getQueryParameter:vi.fn((_query:unknown,key:number)=>key===1?ready:8_500_000),
  };
  const record=vi.fn(),timer=createGpuTiming(gl as unknown as WebGL2RenderingContext,record);
  return {gl,record,timer,ready(){ready=true;},disjoint(value:boolean){disjoint=value;}};
}

it('waits for an available GPU result without reading the pending result',()=>{
  const h=harness();h.timer.begin(123);h.timer.end();h.timer.poll();
  expect(h.record).not.toHaveBeenCalled();
  expect(h.gl.getQueryParameter.mock.calls.every(([,key])=>key===h.gl.QUERY_RESULT_AVAILABLE)).toBe(true);
  h.ready();h.timer.poll();expect(h.record).toHaveBeenCalledWith({at:123,ms:8.5});
  expect(h.gl.deleteQuery).toHaveBeenCalledOnce();h.timer.dispose();
});

it('bounds pending queries and releases pending plus active queries on disposal',()=>{
  const h=harness();for(let i=0;i<10;i++){h.timer.begin(i);h.timer.end();}
  expect(h.gl.createQuery).toHaveBeenCalledTimes(4);
  h.ready();h.timer.poll();h.timer.begin(12);h.timer.dispose();h.timer.dispose();h.timer.begin(13);
  expect(h.gl.createQuery).toHaveBeenCalledTimes(5);expect(h.gl.deleteQuery).toHaveBeenCalledTimes(5);
  expect(h.gl.endQuery).toHaveBeenCalledTimes(5);
});

it('discards disjoint samples and resumes only when the timer is reliable again',()=>{
  const h=harness();h.timer.begin(1);h.timer.end();h.ready();h.disjoint(true);h.timer.poll();h.timer.begin(2);
  expect(h.record).not.toHaveBeenCalled();expect(h.gl.createQuery).toHaveBeenCalledOnce();
  h.disjoint(false);h.timer.poll();h.timer.begin(3);h.timer.end();h.timer.poll();
  expect(h.record).toHaveBeenCalledWith({at:3,ms:8.5});h.timer.dispose();
});

it('leaves rendering usable when GPU timers are unavailable',()=>{
  const h=harness();h.gl.getExtension=()=>null as never;
  const timer=createGpuTiming(h.gl as unknown as WebGL2RenderingContext,vi.fn());
  expect(timer.supported).toBe(false);timer.begin(1);timer.end();timer.poll();timer.dispose();
  expect(h.gl.createQuery).not.toHaveBeenCalled();
});
