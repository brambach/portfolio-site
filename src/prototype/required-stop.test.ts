import {expect,it} from 'vitest';
import {createTownDrive} from './scenic-drive';

it.each([12,56])('guides a manual driver approaching at %s m/s into the first lake stop',speed=>{
  const drive=createTownDrive(),lake=drive.accessRoads.find(stop=>stop.id==='lake')!;
  drive.tourAutopilot=false;
  drive.requireStop('lake');drive.traffic.cars.length=0;
  drive.distance=lake.entry-379;
  drive.position.copy(drive.road.frame(drive.distance,drive.profile.cruiseLane).point);
  drive.yaw=drive.road.frame(drive.distance).yaw;
  drive.phase='driving';drive.engineOn=true;drive.speed=speed;drive.engine.gear=5;
  let elapsed=0,maxStep=0;
  while(drive.stoppedAt!=='lake'&&elapsed<140){
    drive.automatic=false;drive.controls.gas=true;drive.controls.left=true;
    const previous=drive.position.clone();drive.update(1/60);
    maxStep=Math.max(maxStep,previous.distanceTo(drive.position));elapsed+=1/60;
  }
  expect(drive.stoppedAt).toBe('lake');expect(drive.requiredStop).toBeNull();
  expect(maxStep).toBeLessThan(1);
  drive.start();drive.setAutomatic(false);drive.controls.gas=true;
  for(let i=0;i<180;i++)drive.update(1/60);
  expect(drive.phase).toBe('driving');expect(drive.automatic).toBe(false);
});

it('goes directly from town to the lake in under three minutes on normal cruise',()=>{
  const drive=createTownDrive();drive.requireStop('lake');drive.start();let elapsed=0;
  while(drive.phase!=='parked'&&elapsed<240){drive.update(1/30);elapsed+=1/30;}
  expect(drive.stoppedAt).toBe('lake');expect(elapsed).toBeLessThan(180);
});

it('keeps braking and a paused approach available without sending the driver around the loop',()=>{
  const drive=createTownDrive(),lake=drive.accessRoads.find(stop=>stop.id==='lake')!;
  drive.requireStop('lake');drive.traffic.cars.length=0;
  drive.distance=lake.entry-90;drive.position.copy(drive.road.frame(drive.distance,drive.profile.cruiseLane).point);drive.yaw=drive.road.frame(drive.distance).yaw;
  drive.phase='driving';drive.engineOn=true;drive.speed=8;
  // Enter assistance from its normal warning distance, then pause nearer the branch.
  drive.requiredApproach=true;drive.destination=lake.centre;drive.nextOverlook=lake.centre;
  drive.controls.brake=true;
  for(let i=0;i<90;i++)drive.update(1/60);
  expect(drive.speed).toBeLessThan(.2);expect(drive.controls.brake).toBe(true);
  drive.park();drive.start();
  expect(drive.nextOverlook).toBe(lake.centre);
  for(let i=0;i<3600&&drive.stoppedAt!=='lake';i++)drive.update(1/60);
  expect(drive.stoppedAt).toBe('lake');
});
