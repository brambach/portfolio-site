import {CityDrive} from './city-route';
import {scenicRoad,scenicAccess} from './scenic-route';
import {SCENIC_PROFILE} from './road-profile';
import {SCENIC_START_FRACTION,SCENIC_CRUISE_SPEED} from './experience-mode';

const TOUR_COMFORT={
  pace:{topSpeed:18,lateralAcceleration:3.1,longitudinalDeceleration:3.2,lookaheadBase:76},
  releaseEaseSeconds:6,
  releaseInitialAcceleration:2.4,
  releaseMaxAcceleration:5.2,
  automaticBrakeMax:3.8,
};

export function createScenicDrive(cruiseSpeed=SCENIC_CRUISE_SPEED){
  const drive=new CityDrive(scenicRoad,cruiseSpeed,scenicAccess,SCENIC_PROFILE);
  drive.distance=scenicRoad.length*SCENIC_START_FRACTION;
  drive.position.copy(scenicRoad.frame(drive.distance,SCENIC_PROFILE.cruiseLane).point);
  drive.yaw=scenicRoad.frame(drive.distance).yaw;
  drive.navigate(scenicAccess[0].centre);
  return drive;
}

export function createTownDrive(){
  const drive=new CityDrive(scenicRoad,18,scenicAccess,SCENIC_PROFILE,TOUR_COMFORT);
  drive.tourAutopilot=true;
  drive.distance=scenicRoad.length*.025;
  drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
  drive.yaw=scenicRoad.frame(drive.distance).yaw;
  drive.navigate(scenicAccess.find(access=>access.id==='lake')!.centre);
  return drive;
}
