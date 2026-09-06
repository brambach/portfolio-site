import {describe,it,expect} from 'vitest';
import {createScenicDrive} from './scenic-drive';
import {getExperienceMode} from './experience-mode';

describe('first-version scenic drive',()=>{
  it('defaults to the scenic experience while retaining explicit prototypes',()=>{
    expect(getExperienceMode('')).toBe('scenic');
    expect(getExperienceMode('?profile')).toBe('scenic');
    expect(getExperienceMode('?city')).toBe('city');
    expect(getExperienceMode('?journey')).toBe('journey');
  });
  it('reaches the single overlook in two to three minutes without contact, then switches off and resumes continuously',()=>{
    const drive=createScenicDrive();expect(drive.accessRoads.map(access=>access.id)).toEqual(['lake','cafe','tennis']);
    drive.start();let elapsed=0;
    while(drive.phase!=='parked'&&elapsed<200){drive.update(1/30);elapsed+=1/30;expect(drive.collisionTime).toBe(0);}
    expect(drive.stoppedAt).toBe('lake');expect(elapsed).toBeGreaterThanOrEqual(120);expect(elapsed).toBeLessThanOrEqual(180);
    const parked=drive.position.clone();expect(drive.stopEngine()).toBe(true);expect(drive.engineOn).toBe(false);expect(drive.position.distanceTo(parked)).toBe(0);
    drive.start();for(let i=0;i<600;i++)drive.update(1/60);
    expect(drive.engineOn).toBe(true);expect(drive.phase).toBe('driving');expect(drive.position.distanceTo(parked)).toBeGreaterThan(10);
    expect(drive.stopEngine()).toBe(false);
  });
});

it.each(['cafe','tennis','lake'] as const)('allows manual entry and return through the %s junction without jumps',(stop)=>{
  const drive=createScenicDrive(),access=drive.accessRoads.find(access=>access.id===stop)!,road=drive.road;
  drive.traffic.cars.length=0;drive.automatic=false;
  drive.distance=access.entry-25;drive.position.copy(road.frame(drive.distance,drive.profile.cruiseLane).point);drive.yaw=road.frame(drive.distance).yaw;
  drive.phase='driving';drive.engineOn=true;drive.speed=5;
  let entered=false,rejoined=false,maxJump=0;
  for(let i=0;i<5500&&!rejoined;i++){
    const p=access.road.nearest(drive.position.x,drive.position.z);
    const aim=entered&&!drive.access?road.frame(drive.distance+9,drive.profile.cruiseLane).point:access.road.frame(p.distance+9).point;
    const angle=Math.atan2(aim.x-drive.position.x,aim.z-drive.position.z),error=Math.atan2(Math.sin(angle-drive.yaw),Math.cos(angle-drive.yaw));
    drive.controls.left=error>.018;drive.controls.right=error<-.018;drive.controls.gas=drive.speed<5.5;drive.controls.brake=drive.speed>6;
    const previous=drive.position.clone();drive.update(1/60);maxJump=Math.max(maxJump,previous.distanceTo(drive.position));
    if(drive.access?.id===stop)entered=true;
    if(entered&&!drive.access&&drive.distance>access.exit-2)rejoined=true;
  }
  expect(entered).toBe(true);expect(rejoined).toBe(true);expect(maxJump).toBeLessThan(.3);expect(drive.automatic).toBe(false);
});

it('waits clear of the two-lane road at a blocked merge and rejoins after traffic clears',()=>{
  const drive=createScenicDrive(),access=drive.accessRoads[0];drive.reviewAt('lake');drive.traffic.cars.splice(1);
  const merge=access.road.frame(access.road.length-20).point;
  Object.assign(drive.traffic.cars[0],{distance:drive.road.nearest(merge.x,merge.z).distance,lane:drive.profile.approachLane,direction:1,speed:0,targetSpeed:0});
  drive.start();for(let i=0;i<1200;i++)drive.update(1/30);
  expect(drive.access?.id).toBe('lake');expect(drive.speed).toBeLessThan(.1);expect(drive.lane).toBeGreaterThan(drive.profile.pavedHalfWidth+1.1);expect(drive.collisionTime).toBe(0);
  drive.traffic.cars.length=0;for(let i=0;i<900;i++)drive.update(1/30);
  expect(drive.access).toBeNull();expect(drive.distance).toBeGreaterThan(access.exit+50);
});

it('parks on the real shoulder when braking beyond the branch endpoint',()=>{
  const drive=createScenicDrive();drive.reviewAt('lake');drive.traffic.cars.length=0;drive.phase='driving';drive.speed=50;drive.park();
  let maxJump=0,frozen=0;
  for(let i=0;i<900;i++){const previous=drive.position.clone();drive.update(1/60);const moved=previous.distanceTo(drive.position);maxJump=Math.max(maxJump,moved);if(drive.speed>2&&moved<.001)frozen++;}
  expect(drive.phase).toBe('parked');expect(drive.access).toBeNull();expect(frozen).toBe(0);expect(maxJump).toBeLessThan(1);
  expect(drive.lane).toBeGreaterThan(drive.profile.pavedHalfWidth);expect(drive.lane+1.1).toBeLessThan(drive.profile.shoulderHalfWidth);
});

it('uses only the two rendered traffic lanes and reaches the same overlook under reduced motion',()=>{
  const drive=createScenicDrive();expect(drive.traffic.cars).toHaveLength(12);
  expect([...new Set(drive.traffic.cars.map(car=>car.lane))].sort()).toEqual([-1.9,1.9]);
  drive.start();for(let i=0;i<100;i++)drive.update(1/30,true,true);
  expect(drive.stoppedAt).toBe('lake');expect(drive.position.distanceTo(drive.accessRoads[0].road.frame(drive.accessRoads[0].parking,.7).point)).toBeLessThan(.01);
});

it('creeps forward through a shallow pull-over arc when already crawling',()=>{
  for(const initialSpeed of [.2,1,2,2.99,3,3.01,5]){
    const drive=createScenicDrive();drive.traffic.cars.length=0;
    drive.phase='driving';drive.engineOn=true;drive.speed=initialSpeed;
    drive.park();let elapsed=0,previous=initialSpeed,maxHeading=0;
    const isParking=()=>drive.phase==='parking';
    while(isParking()&&elapsed<12){
      drive.update(1/120);elapsed+=1/120;
      maxHeading=Math.max(maxHeading,Math.abs(drive.heading));
      expect(Math.abs(drive.speed-previous)).toBeLessThan(.02);
      expect(drive.speed).toBeLessThanOrEqual(Math.max(3,initialSpeed));
      previous=drive.speed;
    }
    expect(drive.phase).toBe('parked');
    expect(drive.lane).toBeCloseTo(drive.profile.parkingLane);
    expect(maxHeading).toBeLessThan(.45);
    expect(drive.speed).toBe(0);expect(drive.steering).toBe(0);
  }
});

it('lets a fast following car brake while the Porsche creeps onto the shoulder',()=>{
  for(const speed of [.2,1,3]){
    const drive=createScenicDrive();drive.traffic.cars.splice(1);
    const car=drive.traffic.cars[0];
    Object.assign(car,{distance:drive.distance-70,lane:drive.lane,direction:1,speed:28,targetSpeed:28});
    drive.phase='driving';drive.speed=speed;drive.park();
    for(let i=0;i<1800;i++){
      drive.update(1/120);
      expect(drive.traffic.collision(drive.distance,drive.lane)).toBeUndefined();
    }
    expect(drive.phase).toBe('parked');
  }
});
