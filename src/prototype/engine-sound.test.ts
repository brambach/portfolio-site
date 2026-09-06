import { describe, expect, it } from 'vitest';
import { EngineSound } from './engine-sound';

describe('engine response', () => {
  it('settles to idle, rises with a blip, and shuts down', () => {
    const engine = new EngineSound();
    for(let i=0;i<120;i++) engine.update(0,true,false,false,1/60);
    expect(engine.rpm).toBeCloseTo(920,0);
    for(let i=0;i<30;i++) engine.update(0,true,false,false,1/60,true);
    expect(engine.rpm).toBeGreaterThan(2600);
    for(let i=0;i<120;i++) engine.update(0,false,false,false,1/60);
    expect(engine.rpm).toBeLessThan(1);
  });
  it('changes gears without hunting when speed varies near a shift point', () => {
    const engine=new EngineSound();
    engine.update(17,true,true,false,.1);
    expect(engine.gear).toBe(2);
    for(const speed of [16.4,16.8,16.4,17]) expect(engine.update(speed,true,true,false,.1).gear).toBe(2);
    expect(engine.update(6,true,false,true,.1).gear).toBe(1);
  });
});

it('reaches the redline in top gear and keeps RPM bounded', () => {
  const engine = new EngineSound();
  for(let i=0;i<4000;i++) engine.update(Math.min(58,i*.025),true,true,false,1/60);
  expect(engine.gear).toBe(5);
  expect(engine.rpm).toBeGreaterThan(6900);
  expect(engine.rpm).toBeLessThanOrEqual(7000);
});
it('drops RPM on an upshift while road speed keeps increasing', () => {
  const engine = new EngineSound();
  for(let i=0;i<120;i++) engine.update(16.5,true,true,false,1/60);
  const before = engine.rpm;
  for(let i=0;i<30;i++) engine.update(17,true,true,false,1/60);
  expect(engine.gear).toBe(2);
  expect(engine.rpm).toBeLessThan(before-1500);
});

it('rev-matches a requested downshift and holds the chosen gear',()=>{
  const engine=new EngineSound();engine.gear=3;
  for(let i=0;i<60;i++)engine.update(18,true,true,false,1/60);
  const before=engine.rpm;
  expect(engine.shift(-1,18)).toBe(true);
  for(let i=0;i<60;i++)engine.update(18,true,false,false,1/60);
  expect(engine.gear).toBe(2);expect(engine.rpm).toBeGreaterThan(before+1000);
  expect(engine.shift(-1,18)).toBe(false);
  expect(engine.gear).toBe(2);
});

it('uses fractional throttle load while retaining speed-linked RPM',()=>{
  const levels=[0,.2,1].map(throttle=>{
    const engine=new EngineSound();engine.gear=3;
    for(let i=0;i<180;i++)engine.update(16,true,throttle,false,1/60);
    expect(engine.rpm).toBeCloseTo(16*215,0);return engine.load;
  });
  expect(levels[0]).toBeCloseTo(.12,3);expect(levels[1]).toBeCloseTo(.22,3);expect(levels[2]).toBeCloseTo(.62,3);
});
