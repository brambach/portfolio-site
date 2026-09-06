import {describe, expect, it} from 'vitest';
import {RenderQuality} from './render-quality';

function run(quality: RenderQuality, frameMs: number, duration: number, active = true) {
  for (let time = 0; time < duration; time += frameMs) quality.sample(frameMs, active);
}

describe('canvas render quality', () => {
  it('can start with headroom while retaining device limits and later recovery', () => {
    const quality = new RenderQuality(2,1.35);
    expect(quality.ratio).toBe(1.35);
    run(quality,16.7,60000);
    expect(quality.ratio).toBe(1.35);
    run(quality,12,65000);
    expect(quality.ratio).toBe(1.5);
    expect(new RenderQuality(1,1.35).ratio).toBe(1);
    expect(new RenderQuality(2,.1).ratio).toBe(.85);
  });
  it('keeps steady rendering sharp across an isolated scheduling pause', () => {
    const quality = new RenderQuality(2);
    run(quality, 16.7, 1900);
    quality.sample(240, true);
    run(quality, 16.7, 200);
    expect(quality.ratio).toBe(1.5);
  });
  it('still reduces density when long frames persist', () => {
    const quality = new RenderQuality(2);
    run(quality, 100, 8400);
    expect(quality.ratio).toBe(1.2);
  });
  it('reduces sustained slow rendering without exceeding the lower bound', () => {
    const quality = new RenderQuality(2);
    run(quality, 40, 1800);
    expect(quality.ratio).toBe(1.5);
    run(quality, 40, 400);
    expect(quality.ratio).toBe(1.5);
    expect(quality.treeBudget).toBe(2);
    run(quality, 40, 2200);
    expect(quality.ratio).toBe(1.2);
    run(quality, 40, 20000);
    expect(quality.ratio).toBe(.85);
  });
  it('ignores parked time and tab wakeups', () => {
    const quality = new RenderQuality(2);
    run(quality, 40, 1800);
    quality.sample(3000, true);
    run(quality, 40, 1000);
    expect(quality.ratio).toBe(1.5);
    run(quality, 40, 10000, false);
    expect(quality.ratio).toBe(1.5);
  });
  it('keeps the chosen density through parked reading and ordinary 60 fps resume', () => {
    const quality = new RenderQuality(2);
    run(quality, 40, 5000);
    expect(quality.ratio).toBeLessThan(1.5);
    const settled=quality.ratio;
    expect(quality.sample(16, false)).toBeNull();
    run(quality,16.7,20000);
    expect(quality.ratio).toBe(settled);
  });
  it('recovers only after sustained fast frames and never exceeds device density', () => {
    const quality = new RenderQuality(1);
    run(quality, 40, 4400);
    expect(quality.ratio).toBe(.85);
    run(quality, 12, 26000);
    expect(quality.ratio).toBe(.85);
    run(quality, 12, 62000);
    expect(quality.ratio).toBe(1);
  });
});

it('responds to sustained low-50s frame rates before they become visibly slower',()=>{
  const quality=new RenderQuality(2);run(quality,19,2200);expect(quality.treeBudget).toBe(2);expect(quality.ratio).toBe(1.5);
  run(quality,19,2200);expect(quality.ratio).toBe(1.35);
});

it('keeps resolution steady through alternating easy and heavy road sections',()=>{
  const quality=new RenderQuality(2);run(quality,19,4400);
  for(let section=0;section<4;section++){run(quality,13,10000);run(quality,16,6000);}
  expect(quality.ratio).toBe(1.35);
});

it('tries lower geometry first and avoids resizing when frame rates recover',()=>{
  const quality=new RenderQuality(2,1.35);
  run(quality,19,2200);
  expect(quality.treeBudget).toBe(2);expect(quality.ratio).toBe(1.35);
  run(quality,16.7,60000);
  expect(quality.treeBudget).toBe(2);expect(quality.ratio).toBe(1.35);
  run(quality,24,12000);
  expect(quality.ratio).toBe(.85);
  const normal=new RenderQuality(2);run(normal,16.7,60000);expect(normal.treeBudget).toBe(4);
});


it('reaches the minimum with two reallocations when 25 fps persists',()=>{
  const quality=new RenderQuality(2,1.35),changes:number[]=[];
  for(let time=0;time<12000;time+=40){const ratio=quality.sample(40,true);if(ratio!==null)changes.push(ratio);}
  expect(changes).toEqual([1.05,.85]);
  expect(quality.treeBudget).toBe(2);
  run(quality,16.7,60000);
  expect(quality.ratio).toBe(.85);
});
