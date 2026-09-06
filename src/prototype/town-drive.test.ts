import {expect,it} from 'vitest';
import {createTownDrive} from './scenic-drive';
import {stopDistance} from './journey-route';

it('connects café, courts and lake with parking, engine-off and continuous departures',()=>{
  const drive=createTownDrive();
  for(const stop of ['cafe','tennis','lake'] as const){
    drive.navigate(stopDistance(stop));drive.start();
    let elapsed=0,maxStep=0;
    while(drive.phase!=='parked'&&elapsed<400){
      const before=drive.position.clone();drive.update(1/30);elapsed+=1/30;
      maxStep=Math.max(maxStep,before.distanceTo(drive.position));
      expect(drive.collisionTime).toBe(0);
    }
    expect(drive.stoppedAt).toBe(stop);
    expect(maxStep).toBeLessThan(1);
    const parked=drive.position.clone();expect(drive.stopEngine()).toBe(true);
    drive.update(1/30);expect(drive.position.distanceTo(parked)).toBe(0);
  }
});

it('allows reduced-motion arrivals at each approved town destination',()=>{
  const drive=createTownDrive();
  for(const stop of ['cafe','tennis','lake'] as const){
    drive.navigate(stopDistance(stop));drive.start();
    for(let i=0;i<180;i++)drive.update(1/60,true,true);
    expect(drive.stoppedAt).toBe(stop);
    expect(drive.speed).toBe(0);
  }
});
