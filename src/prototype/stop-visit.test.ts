import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {StopVisit,stopLocalPoint} from './stop-visit';
describe('physical café visit',()=>{
  it('orders only at the counter and carries coffee back through the same path',()=>{
    const visit=new StopVisit(),position=new Vector3(2,1.6,5),target=new Vector3(0,1,0);
    expect(visit.order()).toBe(false);visit.begin('cafe');expect(visit.order()).toBe(false);visit.outside(position,target);
    expect(visit.pose()!.position.distanceTo(position)).toBe(0);
    for(let i=0;i<310;i++)visit.update(1/60);
    expect(visit.phase).toBe('exploring');expect(visit.pose()!.position.distanceTo(stopLocalPoint('cafe',0,1.67,3.6))).toBeLessThan(.001);
    expect(visit.order()).toBe(true);visit.back();for(let i=0;i<310;i++)visit.update(1/60);
    expect(visit.phase).toBe('entering');expect(visit.pose()!.position.distanceTo(position)).toBe(0);
    visit.seated();expect(visit.phase).toBe('idle');expect(visit.hasCoffee).toBe(true);
  });
  it('can return during the walk without a camera jump',()=>{
    const visit=new StopVisit();visit.begin('cafe');visit.outside(stopLocalPoint('cafe',0,1.67,9),stopLocalPoint('cafe',0,1.85,.5));for(let i=0;i<120;i++)visit.update(1/60);
    const before=visit.pose()!.position;visit.back();expect(visit.pose()!.position.distanceTo(before)).toBe(0);visit.update(1/60);expect(visit.pose()!.position.distanceTo(before)).toBeLessThan(.1);
  });
  it('skips walking motion but preserves the visit and coffee under reduced motion',()=>{
    const visit=new StopVisit();visit.begin('cafe');visit.outside(new Vector3(),new Vector3(0,0,1));visit.update(1/60,true);expect(visit.phase).toBe('exploring');expect(visit.order()).toBe(true);visit.back();visit.update(1/60,true);expect(visit.phase).toBe('entering');
  });
});
