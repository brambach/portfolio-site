import {expect,it} from 'vitest';
import {createTownDrive} from './scenic-drive';
import {ReturnRace} from './return-race';

it('keeps the outward tour on autopilot across keyboard, pedals and mode changes',()=>{
  const drive=createTownDrive();drive.start();
  drive.input('gas',true);drive.input('left',true);drive.setAutomatic(false);drive.setSpeedHold(true);
  expect(drive.automatic).toBe(true);expect(drive.controls.gas).toBe(false);expect(drive.controls.left).toBe(false);
  drive.input('brake',true);expect(drive.controls.brake).toBe(true);
  expect(drive.shift(-1)).toBe(false);
});
it('only starts at the lake, counts down without moving, then hands over manual controls',()=>{
  const drive=createTownDrive(),race=new ReturnRace(drive);
  expect(race.start(0)).toBe(false);
  drive.reviewAt('lake');const origin=drive.position.clone();
  expect(race.start(100)).toBe(true);expect(race.start(200)).toBe(false);
  race.update(2099);drive.update(.1);expect(drive.position.distanceTo(origin)).toBe(0);expect(race.state.countdown).toBe(2);
  race.update(3100);expect(race.state.phase).toBe('racing');expect(drive.tourAutopilot).toBe(false);expect(drive.automatic).toBe(false);
  drive.input('gas',true);expect(drive.controls.gas).toBe(true);
});
it('finishes at the original start after the road wraps, and freezes the result',()=>{
  const drive=createTownDrive(),race=new ReturnRace(drive);drive.reviewAt('lake');race.start(0);race.update(3000);
  drive.access=null;drive.distance=drive.road.length*.99;race.update(60000);expect(race.state.phase).toBe('racing');
  drive.distance=drive.road.length*1.026;race.update(61000);expect(race.state.phase).toBe('finished');expect(race.state.elapsed).toBe(58000);
  race.update(90000);expect(race.state.elapsed).toBe(58000);expect(drive.controls.gas).toBe(false);
});
it('cancels a countdown without a later surprise launch',()=>{
  const drive=createTownDrive(),race=new ReturnRace(drive);drive.reviewAt('lake');race.start(0);race.cancel();race.update(10000);
  expect(race.state.phase).toBe('idle');expect(drive.phase).toBe('parked');expect(drive.tourAutopilot).toBe(true);
});
it('returns a repeat race to the same start with clean controls and drivetrain',()=>{
  const drive=createTownDrive(),race=new ReturnRace(drive);drive.reviewAt('lake');const origin=drive.position.clone();
  race.start(0);race.update(3000);drive.engine.gear=5;drive.collisionTime=2;drive.speed=40;drive.input('left',true);
  race.cancel();drive.resetAtLake();expect(drive.position.distanceTo(origin)).toBeLessThan(.001);
  expect(drive.engine.gear).toBe(1);expect(drive.speed).toBe(0);expect(drive.collisionTime).toBe(0);expect(drive.controls.left).toBe(false);expect(race.start(10000)).toBe(true);
});
