import {afterEach,expect,it,vi} from 'vitest';
import {raceApi} from './race-api';
afterEach(()=>vi.unstubAllEnvs());
it('returns an honest unavailable response without shared storage',async()=>{
  vi.stubEnv('UPSTASH_REDIS_REST_URL','');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');
  expect((await raceApi('GET',null,'test')).status).toBe(503);
});
it('rejects posting without a registered finish and rejects markup in names',async()=>{
  const command=vi.fn(async(name:string)=>name==='INCR'?1:name==='GET'?JSON.stringify({started:Date.now()}):null);
  const id='12345678-1234-1234-1234-123456789abc';
  expect((await raceApi('POST',{action:'publish',id,name:'Bryce'},'test',command)).status).toBe(400);
  expect((await raceApi('POST',{action:'publish',id,name:'<script>'},'test',command)).status).toBe(400);
  expect(command.mock.calls.some(call=>call[0]==='EVAL')).toBe(false);
});
it('rejects impossible and non-finite times before saving a finish',async()=>{
  const command=vi.fn(async(name:string)=>name==='INCR'?1:name==='GET'?JSON.stringify({started:Date.now()}):null);
  const id='12345678-1234-1234-1234-123456789abc';
  for(const elapsed of [0,NaN,Infinity,30000])expect((await raceApi('POST',{action:'finish',id,elapsed},'test',command)).status).toBe(400);
});
it('limits repeated writes before creating a run',async()=>{
  const command=vi.fn(async()=>31);
  expect((await raceApi('POST',{action:'start'},'test',command)).status).toBe(429);
  expect(command).toHaveBeenCalledTimes(1);
});
it('returns named results from shared storage in ranked order',async()=>{
  const entries=[{id:'a',name:'Bryce',elapsed:54000},{id:'b',name:'Sam',elapsed:60000}];
  const command=vi.fn(async()=>entries.map(entry=>JSON.stringify(entry)));
  expect((await raceApi('GET',null,'test',command)).data).toEqual({entries});
});
it('returns your rank even when your time is below the visible top twenty',async()=>{
 const rows=Array.from({length:25},(_,index)=>JSON.stringify({id:String(index),name:'Driver '+index,elapsed:30000+index}));
 const result=await raceApi('GET',{id:'24'},'test',async()=>rows);
 expect(result.data).toMatchObject({rank:25});expect((result.data as any).entries).toHaveLength(20);
});
