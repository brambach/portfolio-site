import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {trackJourney} from './journey-stats';
beforeEach(()=>{sessionStorage.clear();vi.stubEnv('PROD',true);vi.stubGlobal('location',{hostname:'www.brycerambach.com',pathname:'/',search:''});});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('counts repeated effects and a later refresh only once per session',async()=>{
  const request=vi.fn(async(..._args:any[])=>({ok:true}));vi.stubGlobal('fetch',request);
  trackJourney('car_entered');trackJourney('car_entered');await vi.waitFor(()=>expect(request).toHaveBeenCalledTimes(1));
  await new Promise(resolve=>setTimeout(resolve,0));trackJourney('car_entered');expect(request).toHaveBeenCalledTimes(1);
  const body=JSON.parse(request.mock.calls[0][1].body);expect(body.event).toBe('car_entered');expect(Object.keys(body).sort()).toEqual(['event','session','source']);
});
it('excludes admin and local traffic',()=>{
  const request=vi.fn();vi.stubGlobal('fetch',request);vi.stubGlobal('location',{hostname:'www.brycerambach.com',pathname:'/admin',search:''});trackJourney('visit');vi.stubGlobal('location',{hostname:'localhost',pathname:'/',search:''});trackJourney('visit');expect(request).not.toHaveBeenCalled();
});
it('can retry a failed delivery without breaking the journey',async()=>{
  const request=vi.fn(async()=>({ok:false}));vi.stubGlobal('fetch',request);trackJourney('visit');await new Promise(resolve=>setTimeout(resolve,0));trackJourney('visit');expect(request).toHaveBeenCalledTimes(2);
});
