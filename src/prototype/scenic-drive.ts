import {CityDrive} from './city-route';
import {scenicRoad,scenicAccess} from './scenic-route';
import {SCENIC_PROFILE} from './road-profile';
import {SCENIC_START_FRACTION,SCENIC_CRUISE_SPEED} from './experience-mode';

export function createScenicDrive(cruiseSpeed=SCENIC_CRUISE_SPEED){
  const drive=new CityDrive(scenicRoad,cruiseSpeed,scenicAccess,SCENIC_PROFILE);
  drive.distance=scenicRoad.length*SCENIC_START_FRACTION;
  drive.position.copy(scenicRoad.frame(drive.distance,SCENIC_PROFILE.cruiseLane).point);
  drive.yaw=scenicRoad.frame(drive.distance).yaw;
  drive.navigate(scenicAccess[0].centre);
  return drive;
}

export function createTownDrive(){
  const drive=createScenicDrive(18);
  drive.tourAutopilot=true;
  drive.distance=scenicRoad.length*.025;
  drive.position.copy(scenicRoad.frame(drive.distance,drive.profile.cruiseLane).point);
  drive.yaw=scenicRoad.frame(drive.distance).yaw;
  drive.navigate(scenicAccess.find(access=>access.id==='lake')!.centre);
  return drive;
}
