import { describe, expect, it } from 'vitest';
import { EngineSound } from './engine-sound';
import { createTownDrive } from './scenic-drive';

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

it('uses fractional throttle load while allowing low-load cruise upshifts',()=>{
  const levels=[0,.2,1].map(throttle=>{
    const engine=new EngineSound();engine.gear=3;
    for(let i=0;i<180;i++)engine.update(16,true,throttle,false,1/60);
    expect(engine.rpm).toBeCloseTo(throttle===.2?16*125:16*215,0);return engine.load;
  });
  expect(levels[0]).toBeCloseTo(.12,3);expect(levels[1]).toBeCloseTo(.22,3);expect(levels[2]).toBeCloseTo(.62,3);
});

it('keeps production-default town cruise in the normal scenic RPM band without changing road physics',()=>{
  const drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.start();
  const cruise:{speed:number;rpm:number;gear:number;distance:number}[]=[];
  const physics:{speed:number;distance:number;acceleration:number;steering:number}[]=[];
  for(let i=0;i<60*65;i++){
    drive.update(1/60);
    if(i%60===59)physics.push({speed:drive.speed,distance:drive.distance,acceleration:drive.acceleration,steering:drive.steering});
    if(i>=60*8&&i<60*60&&i%60===59)cruise.push({speed:drive.speed,rpm:drive.engineState.rpm,gear:drive.engineState.gear,distance:drive.distance});
  }
  expect(cruise.length).toBeGreaterThan(40);
  expect(Math.min(...cruise.map(sample=>sample.rpm))).toBeGreaterThanOrEqual(2000);
  expect(Math.max(...cruise.map(sample=>sample.rpm))).toBeLessThanOrEqual(3000);
  expect(new Set(cruise.map(sample=>sample.gear))).toEqual(new Set([5]));
  expect(drive.engine.gear).toBe(3);
  expect(physics.at(-1)!.speed).toBeGreaterThan(17);
  expect(physics.at(-1)!.distance).toBeGreaterThan(1100);
});

it('stages production automatic feedback upshifts with dwell, ratio drops and cruise settlement',()=>{
  const drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.start();
  const samples:{time:number;speed:number;rpm:number;gear:number;mechanical:number}[]=[];
  for(let i=0;i<60*30;i++){
    drive.update(1/60);
    samples.push({
      time:(i+1)/60,
      speed:drive.speed,
      rpm:drive.engineState.rpm,
      gear:drive.engineState.gear,
      mechanical:drive.engine.gear,
    });
  }
  const running=samples.filter(sample=>sample.time>2.2&&sample.speed>2);
  const changes=running.filter((sample,index)=>index>0&&sample.gear!==running[index-1].gear);
  expect(running[0]!.gear).toBe(1);
  expect(new Set(running.map(sample=>sample.gear))).toEqual(new Set([1,2,3,4,5]));
  expect(changes.map(sample=>sample.gear)).toEqual([2,3,4,5]);
  for(let i=1;i<changes.length;i++)expect(changes[i]!.time-changes[i-1]!.time).toBeGreaterThanOrEqual(.38);
  for(const change of changes){
    let before=running[0]!;
    for(let i=running.length-1;i>=0;i--)if(running[i]!.time<change.time){before=running[i]!;break;}
    expect(change.gear-before.gear).toBe(1);
    const settled=running.find(sample=>sample.time>=change.time+.35)!;
    expect(settled.gear).toBe(change.gear);
    expect(settled.rpm).toBeLessThan(before.rpm-550);
    expect(change.speed).toBeGreaterThanOrEqual(before.speed-.05);
  }
  const cruise=samples.filter(sample=>sample.time>18&&sample.speed>16);
  expect(Math.min(...cruise.map(sample=>sample.rpm))).toBeGreaterThanOrEqual(2000);
  expect(Math.max(...cruise.map(sample=>sample.rpm))).toBeLessThanOrEqual(3000);
  expect(new Set(cruise.map(sample=>sample.gear))).toEqual(new Set([5]));
  expect(drive.engine.gear).toBe(3);
});

it('does not rebound displayed gears on lift-off after settled cruise',()=>{
  const engine=new EngineSound();
  for(let i=0;i<160;i++)engine.update(Math.min(18,i*.14),true,1,false,1/60);
  for(let i=0;i<240;i++)engine.update(18,true,.22,false,1/60);
  expect(engine.update(18,true,.22,false,1/60).gear).toBe(5);
  const lifted:number[]=[];
  for(let i=0;i<180;i++)lifted.push(engine.update(18,true,0,false,1/60).gear);
  expect(new Set(lifted)).toEqual(new Set([5]));
  expect(engine.gear).toBeLessThanOrEqual(3);
});

it('keeps steady fractional-load threshold jitter from hunting displayed gears',()=>{
  const engine=new EngineSound();
  for(let i=0;i<160;i++)engine.update(Math.min(18,i*.14),true,1,false,1/60);
  for(let i=0;i<240;i++)engine.update(18,true,.22,false,1/60);
  expect(engine.update(18,true,.22,false,1/60).gear).toBe(5);
  const displayed:number[]=[];
  for(let i=0;i<240;i++){
    const throttle=i%2===0?.34:.36;
    const speed=18+(i%4-.5)*.01;
    displayed.push(engine.update(speed,true,throttle,false,1/60).gear);
  }
  expect(new Set(displayed)).toEqual(new Set([5]));
});

it('clears feedback dwell across stop, reset and shortcut state changes',()=>{
  const engine=new EngineSound();
  for(let i=0;i<160;i++)engine.update(Math.min(18,i*.14),true,1,false,1/60);
  for(let i=0;i<80;i++)engine.update(18,true,.22,false,1/60);
  expect(engine.update(0,true,0,true,1/60).gear).toBe(1);
  for(let i=0;i<30;i++)engine.update(0,true,0,false,1/60);
  expect(engine.update(0,true,0,false,1/60).gear).toBe(1);
  engine.setState(3200,5,22);
  expect(engine.update(22,true,.22,false,1/60).gear).toBe(5);
  engine.reset();
  expect(engine.update(0,false,0,false,1/60).gear).toBe(1);
  engine.setState(2600,1,0);
  expect(engine.update(0,true,0,false,1/60).gear).toBe(1);
});

it('keeps shortcut arrival and restart RPM coherent with the next production update',()=>{
  const drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.start();
  for(let i=0;i<60*12;i++)drive.update(1/60);
  expect(drive.engineState.rpm).toBeGreaterThan(2000);
  const beforeShortcut=drive.engineState.rpm;
  drive.arriveAtStop('lake');
  expect(drive.engineState.rpm).toBe(beforeShortcut);
  drive.update(1/60);
  expect(drive.engineState.rpm).toBeLessThanOrEqual(beforeShortcut);
  expect(beforeShortcut-drive.engineState.rpm).toBeLessThanOrEqual(5200/60+.001);
  expect(drive.stopEngine()).toBe(true);
  let previous=drive.engineState.rpm,maxFall=0;
  for(let i=0;i<45;i++){
    drive.update(1/60);
    maxFall=Math.max(maxFall,(previous-drive.engineState.rpm)*60);
    previous=drive.engineState.rpm;
  }
  expect(maxFall).toBeLessThanOrEqual(5200.001);
  drive.start();
  for(let i=0;i<60*3;i++)drive.update(1/60);
  expect(drive.engineState.rpm).toBeGreaterThan(850);
});

it('slews RPM coherently through start, acceleration, lift, brake, stop, switch-off and restart',()=>{
  const engine=new EngineSound();
  let previous=engine.rpm,maxRise=0,maxFall=0,peak=0;
  const step=(speed:number,running:boolean,gas:boolean|number,brake:boolean,dt=1/60,blip=false)=>{
    const state=engine.update(speed,running,gas,brake,dt,blip);
    const delta=state.rpm-previous;
    maxRise=Math.max(maxRise,delta/dt);
    maxFall=Math.max(maxFall,-delta/dt);
    peak=Math.max(peak,state.rpm);
    previous=state.rpm;
    expect(state.rpm).toBeGreaterThanOrEqual(0);
    expect(state.rpm).toBeLessThanOrEqual(7000);
    return state;
  };
  for(let i=0;i<50;i++)step(0,true,false,false);
  expect(engine.rpm).toBeGreaterThan(850);
  for(let i=0;i<160;i++)step(Math.min(18,i*.12),true,1,false);
  expect(peak).toBeGreaterThan(3600);
  for(let i=0;i<90;i++)step(18,true,.18,false);
  expect(engine.rpm).toBeGreaterThanOrEqual(2000);
  expect(engine.rpm).toBeLessThanOrEqual(3000);
  for(let i=0;i<90;i++)step(Math.max(0,18-i*.2),true,0,true);
  expect(engine.rpm).toBeGreaterThanOrEqual(850);
  for(let i=0;i<80;i++)step(0,true,0,false);
  expect(engine.rpm).toBeCloseTo(920,0);
  for(let i=0;i<80;i++)step(0,false,0,false);
  expect(engine.rpm).toBeLessThan(1);
  for(let i=0;i<50;i++)step(0,true,0,false);
  expect(engine.rpm).toBeGreaterThan(850);
  expect(maxRise).toBeLessThanOrEqual(4200.001);
  expect(maxFall).toBeLessThanOrEqual(5200.001);
});
