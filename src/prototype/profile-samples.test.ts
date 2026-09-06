import {it,expect} from 'vitest';
import {ProfileSamples} from './profile-samples';
const frame=(interval:number)=>({interval,submission:3,calls:200,triangles:800000,distance:80,pixelRatio:1});
it('includes visible long stalls and bounds retained driving windows',()=>{
  const profile=new ProfileSamples(20,2);
  for(let i=0;i<19;i++)expect(profile.add(frame(16))).toBeNull();
  const first=profile.add(frame(500))!;
  expect(first.latest.maxFrameMs).toBe(500);expect(first.latest.slowFrames).toBe(1);expect(first.latest.fps).toBeCloseTo(24.9,1);
  for(let i=0;i<39;i++)profile.add(frame(20));
  const last=profile.add(frame(20))!;expect(last.windows).toHaveLength(2);expect(last.latest.fps).toBe(50);
});

it('retains whole-trip totals after history rolls over, including an unfinished final window',()=>{
  const profile=new ProfileSamples(2,2);
  const intervals=[500,10,20,20,30,30,40];
  intervals.forEach((interval,i)=>profile.add({...frame(interval),distance:i,pixelRatio:i===0?1.5:.85}));
  const result=profile.snapshot();
  expect(result.windows).toHaveLength(2);expect(result.pendingSamples).toBe(1);
  expect(result.total.samples).toBe(7);expect(result.total.intervalMs).toBe(650);
  expect(result.total.fps).toBeCloseTo(7000/650);
  expect(result.total.maxFrameMs).toBe(500);expect(result.total.slowFrames).toBe(1);
  expect(result.total.firstDistance).toBe(0);expect(result.total.lastDistance).toBe(6);
  expect(result.total.minPixelRatio).toBe(.85);expect(result.total.maxPixelRatio).toBe(1.5);
  profile.add(frame(NaN));profile.add(frame(-1));expect(profile.snapshot()).toEqual(result);
});
