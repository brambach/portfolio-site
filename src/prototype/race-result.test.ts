import {afterEach,expect,it,vi} from 'vitest';
import {readPersonalBest,readRaceResult,saveRaceResult} from './race-result';
afterEach(()=>{localStorage.clear();vi.restoreAllMocks();});
const run=(elapsed:number)=>({elapsed,id:null,name:'Bryce',saved:false});
it('migrates the last result before a slower finish replaces it',()=>{
 localStorage.setItem('bryce-last-race',JSON.stringify(run(41000)));
 saveRaceResult(run(45000));
 expect(readPersonalBest()?.elapsed).toBe(41000);
 expect(readRaceResult()?.elapsed).toBe(45000);
 saveRaceResult(run(40000));expect(readPersonalBest()?.elapsed).toBe(40000);
});
it('ignores corrupt results and works without storage access',()=>{
 localStorage.setItem('bryce-best-race','oops');expect(readPersonalBest()).toBeNull();
 saveRaceResult(run(NaN));expect(readRaceResult()).toBeNull();
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
 expect(()=>saveRaceResult(run(41000))).not.toThrow();
});
