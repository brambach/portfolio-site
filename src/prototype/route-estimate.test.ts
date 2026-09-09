import {expect,it} from 'vitest';
import {CityDrive} from './city-route';
import {createTownDrive} from './scenic-drive';
import {scenicAccess,scenicRoad} from './scenic-route';
import {estimatePlannedRoute} from './route-estimate';

it('matches the current CityDrive scenic planner without adding another lap',()=>{
  const access=scenicAccess.find(stop=>stop.id==='cafe')!;
  for(const gap of [59,60,100,149,150,151]){
    const drive=createTownDrive();
    drive.distance=access.centre-gap;
    drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
    drive.yaw=scenicRoad.frame(drive.distance).yaw;
    drive.navigate(access.centre);
    const estimate=estimatePlannedRoute({id:'cafe',distance:drive.distance,destination:access.centre,roadLength:scenicRoad.length,accessRoads:scenicAccess,cruiseSpeed:drive.cruiseSpeed});
    expect(estimate.plannedDistance).toBeCloseTo(drive.nextOverlook,6);
    expect(estimate.travelDistance).toBeLessThan(gap+scenicRoad.length*1.5);
  }
});

it('uses the active access state when estimating an already-entered stop',()=>{
  const drive=new CityDrive(scenicRoad,18,scenicAccess),access=scenicAccess.find(stop=>stop.id==='cafe')!;
  drive.reviewAt('cafe');
  drive.accessDistance=access.parking-20;
  const estimate=estimatePlannedRoute({id:'cafe',distance:drive.distance,destination:access.centre,roadLength:scenicRoad.length,accessRoads:scenicAccess,currentAccessId:'cafe',currentAccessDistance:drive.accessDistance,cruiseSpeed:drive.cruiseSpeed});
  drive.navigate(access.centre);
  expect(estimate.plannedDistance).toBeCloseTo(drive.nextOverlook,6);
});

it('estimates same-stop access progress from the access position, not parked telemetry',()=>{
  const cafe=scenicAccess.find(stop=>stop.id==='cafe')!;
  const drive=new CityDrive(scenicRoad,18,scenicAccess);
  drive.reviewAt('cafe');
  for(const remaining of [80,20]){
    drive.accessDistance=cafe.parking-remaining;
    const estimate=estimatePlannedRoute({id:'cafe',distance:drive.distance,destination:cafe.centre,roadLength:scenicRoad.length,accessRoads:scenicAccess,currentAccessId:'cafe',currentAccessDistance:drive.accessDistance,cruiseSpeed:drive.cruiseSpeed});
    expect(estimate.travelDistance).toBeCloseTo(Math.max(0,remaining),6);
  }
});

it('estimates departing one access road before driving to another stop entry',()=>{
  const cafe=scenicAccess.find(stop=>stop.id==='cafe')!,tennis=scenicAccess.find(stop=>stop.id==='tennis')!;
  const drive=new CityDrive(scenicRoad,18,scenicAccess);
  drive.reviewAt('cafe');
  const estimate=estimatePlannedRoute({id:'tennis',distance:drive.distance,destination:tennis.centre,roadLength:scenicRoad.length,accessRoads:scenicAccess,currentAccessId:'cafe',currentAccessDistance:cafe.parking,cruiseSpeed:drive.cruiseSpeed});
  const remainingCafe=cafe.road.length-cafe.parking;
  const mainGap=(tennis.entry-cafe.exit+scenicRoad.length)%scenicRoad.length;
  expect(estimate.travelDistance).toBeCloseTo(remainingCafe+mainGap+tennis.parking,6);
});

it('keeps behind destination estimates forward-only with the chosen access approach',()=>{
  const cafe=scenicAccess.find(stop=>stop.id==='cafe')!;
  const distance=cafe.centre+40;
  const estimate=estimatePlannedRoute({id:'cafe',distance,destination:cafe.centre,roadLength:scenicRoad.length,accessRoads:scenicAccess,cruiseSpeed:18});
  expect(estimate.plannedDistance-distance).toBeCloseTo(scenicRoad.length-40,6);
  expect(estimate.travelDistance).toBeGreaterThan(scenicRoad.length-200);
});
