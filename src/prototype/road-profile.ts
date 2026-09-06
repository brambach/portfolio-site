export type RoadProfile = {
  cruiseLane:number;
  approachLane:number;
  parkingLane:number;
  manualEntryLane:number;
  pavedHalfWidth:number;
  shoulderHalfWidth:number;
  trafficLanes:readonly number[];
  trafficCount:number;
};
export const BOULEVARD_PROFILE:RoadProfile={
  cruiseLane:2.1,approachLane:5.5,parkingLane:5.4,manualEntryLane:6.4,
  pavedHalfWidth:8,shoulderHalfWidth:12,trafficLanes:[2.1,5.5],trafficCount:28,
};
export const SCENIC_PROFILE:RoadProfile={
  cruiseLane:1.9,approachLane:1.9,parkingLane:4.6,manualEntryLane:3,
  pavedHalfWidth:3.8,shoulderHalfWidth:6,trafficLanes:[1.9],trafficCount:12,
};
