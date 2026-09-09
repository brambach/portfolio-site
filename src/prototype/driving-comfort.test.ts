import {describe,expect,it} from 'vitest';
import {CityDrive} from './city-route';
import {createScenicDrive,createTownDrive} from './scenic-drive';
import {scenicAccess,scenicRoad} from './scenic-route';
import {stopDistance} from './journey-route';

function settleIntoTour(hz:number){
  const drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.navigate(stopDistance('lake'));
  drive.start();
  let elapsed=0;
  while(drive.phase!=='driving'&&elapsed<5){drive.update(1/hz);elapsed+=1/hz;}
  while(drive.speed<17.3&&elapsed<45){drive.update(1/hz);elapsed+=1/hz;}
  expect(drive.phase).toBe('driving');
  expect(drive.speed).toBeGreaterThan(17.2);
  return {drive,elapsed};
}

function brakeAndRelease(hz:number){
  const {drive}=settleIntoTour(hz);
  for(let i=0;i<hz*3;i++){drive.input('brake',true);drive.update(1/hz);}
  expect(drive.speed).toBe(0);
  drive.input('brake',false);
  const samples:{t:number;speed:number;acceleration:number}[]=[];
  for(let i=0;i<hz*6;i++){
    drive.update(1/hz);
    samples.push({t:(i+1)/hz,speed:drive.speed,acceleration:drive.acceleration});
  }
  return samples;
}

function gapToEntry(drive:CityDrive,stop:'cafe'|'tennis'|'lake'){
  const access=scenicAccess.find(candidate=>candidate.id===stop)!;
  return ((access.entry-drive.distance+drive.road.length/2)%drive.road.length+drive.road.length)%drive.road.length-drive.road.length/2;
}

function isParked(drive:CityDrive){return drive.phase==='parked';}

describe('default-tour driving comfort',()=>{
  it.each([30,60,120])('eases automatic acceleration after a temporary brake release at %s Hz',hz=>{
    const samples=brakeAndRelease(hz);
    const near=(seconds:number)=>samples.reduce((best,row)=>Math.abs(row.t-seconds)<Math.abs(best.t-seconds)?row:best);
    expect(near(1).speed).toBeGreaterThan(1.2);
    expect(near(1).speed).toBeLessThan(4.8);
    expect(near(3).speed).toBeGreaterThan(7.5);
    expect(near(3).speed).toBeLessThan(16.2);
    expect(Math.max(...samples.map(row=>row.acceleration))).toBeLessThanOrEqual(5.6);
  });

  it.each([30,60,120])('keeps the scenic stop sequence stable at %s Hz',hz=>{
    const drive=createTownDrive();
    drive.traffic.cars.length=0;
    for(const stop of ['cafe','tennis','lake'] as const){
      drive.navigate(stopDistance(stop));
      drive.start();
      let elapsed=0,maxStep=0,maxSpeed=0;
      while(drive.phase!=='parked'&&elapsed<400){
        const before={phase:drive.phase,speed:drive.speed,position:drive.position.clone()};
        drive.update(1/hz);
        elapsed+=1/hz;
        const step=before.position.distanceTo(drive.position);
        if(before.speed>1&&drive.phase==='parking')expect(step).toBeGreaterThan(.001);
        maxStep=Math.max(maxStep,step);
        maxSpeed=Math.max(maxSpeed,drive.speed);
        expect(drive.collisionTime).toBe(0);
      }
      expect(drive.stoppedAt).toBe(stop);
      expect(maxStep).toBeLessThan(hz===30?1:hz===60?.5:.25);
      expect(maxSpeed).toBeGreaterThan(stop==='cafe'?7:14);
      expect(drive.position.distanceTo(scenicAccess.find(access=>access.id===stop)!.road.frame(scenicAccess.find(access=>access.id===stop)!.parking,.7).point)).toBeLessThan(.1);
    }
  });

  it.each([30,60,120])('anticipates access entry speed from cruise before the abrupt approach boundary at %s Hz',hz=>{
    const stop='tennis' as const,access=scenicAccess.find(candidate=>candidate.id===stop)!;
    const drive=createTownDrive();
    drive.traffic.cars.length=0;
    drive.distance=access.entry-180;
    drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
    drive.yaw=scenicRoad.frame(drive.distance).yaw;
    drive.phase='driving';drive.engineOn=true;drive.speed=18;drive.acceleration=0;
    drive.navigate(access.centre);
    const samples:{gap:number;speed:number;acceleration:number;heading:number;lane:number;access:boolean}[]=[];
    for(let i=0;i<hz*45;i++){
      if(isParked(drive))break;
      drive.update(1/hz);
      samples.push({gap:gapToEntry(drive,stop),speed:drive.speed,acceleration:drive.acceleration,heading:drive.heading,lane:drive.lane,access:Boolean(drive.access)});
    }
    const beforeBoundary=samples.filter(row=>row.gap<135&&row.gap>112);
    expect(beforeBoundary.length).toBeGreaterThan(2);
    expect(beforeBoundary[0].speed-beforeBoundary[beforeBoundary.length-1].speed).toBeGreaterThan(.6);
    expect(Math.max(...samples.filter(row=>row.gap<125&&row.gap>-5).map(row=>-row.acceleration))).toBeLessThan(6.4);
    const entry=samples.find(row=>row.access);
    expect(entry).toBeTruthy();
    expect(entry!.speed).toBeLessThanOrEqual(8.4);
    const afterEntry=samples.filter(row=>row.access).slice(0,Math.round(hz*2));
    expect(Math.max(...afterEntry.map(row=>Math.abs(row.heading)))).toBeLessThan(.45);
    expect(Math.max(...afterEntry.map(row=>Math.abs(row.lane)))).toBeLessThan(access.road.halfWidth);
    expect(drive.stoppedAt).toBe(stop);
  });
});

it('leaves manual scenic driving on the existing CityDrive response curve',()=>{
  const drive=createScenicDrive();
  drive.traffic.cars.length=0;
  drive.start();
  for(let i=0;i<180;i++)drive.update(1/60);
  expect(drive.automatic).toBe(true);
  drive.input('gas',true);
  expect(drive.automatic).toBe(false);
  for(let i=0;i<420;i++)drive.update(1/60);
  expect(drive.speed).toBeGreaterThan(32);
});

it('leaves turbo arrival materially faster than the comfort tour',()=>{
  const turbo=createScenicDrive();
  turbo.traffic.cars.length=0;
  turbo.setTurbo(true);
  turbo.start();
  let elapsed=0,peak=0;
  while(turbo.phase!=='parked'&&elapsed<120){
    turbo.update(1/60);
    elapsed+=1/60;
    peak=Math.max(peak,turbo.speed);
  }
  expect(turbo.stoppedAt).toBe('lake');
  expect(elapsed).toBeLessThan(90);
  expect(peak).toBeGreaterThan(20);
});

it('keeps unconfigured CityDrive acceleration available outside the default tour',()=>{
  const drive=new CityDrive(scenicRoad,18,scenicAccess);
  drive.traffic.cars.length=0;
  drive.setAutomatic(true);
  drive.start();
  for(let i=0;i<180;i++)drive.update(1/60);
  drive.controls.brake=true;
  for(let i=0;i<180;i++)drive.update(1/60);
  expect(drive.speed).toBe(0);
  drive.controls.brake=false;
  let peakAcceleration=0;
  for(let i=0;i<60;i++){
    drive.update(1/60);
    peakAcceleration=Math.max(peakAcceleration,drive.acceleration);
  }
  expect(peakAcceleration).toBeGreaterThan(8);
});

it('does not apply comfort brake-release easing after disabling tour autopilot on the same instance',()=>{
  const comfortTour=createTownDrive();
  comfortTour.traffic.cars.length=0;
  comfortTour.tourAutopilot=false;
  comfortTour.setAutomatic(true);
  comfortTour.start();
  for(let i=0;i<180;i++)comfortTour.update(1/60);
  comfortTour.controls.brake=true;
  for(let i=0;i<180;i++)comfortTour.update(1/60);
  comfortTour.controls.brake=false;
  let peakAcceleration=0;
  for(let i=0;i<60;i++){
    comfortTour.update(1/60);
    peakAcceleration=Math.max(peakAcceleration,comfortTour.acceleration);
  }
  expect(peakAcceleration).toBeGreaterThan(8);
});

it('clears brake-release easing across intentional arrival and later departure',()=>{
  const drive=createTownDrive();
  drive.traffic.cars.length=0;
  drive.navigate(stopDistance('lake'));
  drive.start();
  while(drive.phase!=='driving')drive.update(1/60);
  while(drive.speed<17.3)drive.update(1/60);
  drive.input('brake',true);
  for(let i=0;i<180;i++)drive.update(1/60);
  drive.input('brake',false);
  drive.update(1/60);
  drive.arriveAtStop('cafe');
  drive.navigate(stopDistance('tennis'));
  drive.start();
  while(drive.phase!=='driving')drive.update(1/60);
  let peakAcceleration=0;
  for(let i=0;i<60;i++){
    drive.update(1/60);
    peakAcceleration=Math.max(peakAcceleration,drive.acceleration);
  }
  expect(peakAcceleration).toBeGreaterThan(6);
});
