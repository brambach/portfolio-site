import {it,expect} from 'vitest';
import {MotionProfile} from './motion-profile';
it('separates idle waiting from motion while retaining real animation stalls',()=>{
  const profile=new MotionProfile();profile.add('entry',9000);
  for(let i=0;i<29;i++)profile.add('entry',16);
  const active=profile.add('entry',500)!;expect(active.current?.samples).toBe(30);expect(active.current?.maxFrameMs).toBe(500);expect(active.current?.slowFrames).toBe(1);
  expect(active.current?.slowFrameSamples).toEqual([30]);
  const done=profile.add(null,16)!;expect(done.completed).toHaveLength(1);expect(done.completed[0].phase).toBe('entry');expect(done.current).toBeNull();
});
it('bounds repeated interaction history and finishes short animations',()=>{
  const profile=new MotionProfile();let last;
  for(let i=0;i<20;i++){profile.add('object',1000);profile.add('object',20);last=profile.add(null,20);}
  expect(last!.completed).toHaveLength(12);expect(last!.completed[0].fps).toBe(50);
});
