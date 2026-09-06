import {describe,it,expect} from 'vitest';
import {CityDrive} from './city-route';
import {JOURNEY_STOPS,journeyRoad,journeyAccess,accessFor,nextVisit,nearbyStop,stopDistance} from './journey-route';
function advance(drive:CityDrive,seconds:number){for(let t=0;t<seconds;t+=1/30)drive.update(1/30);}
describe('connected journey',()=>{
  it('keeps the route and nearest-road projection continuous',()=>{
    expect(journeyRoad.frame(0).point.distanceTo(journeyRoad.frame(journeyRoad.length).point)).toBeLessThan(.001);
    for(let d=0;d<journeyRoad.length;d+=47){const point=journeyRoad.frame(d,2.1).point;const found=journeyRoad.nearest(point.x,point.z);expect(found.lane).toBeCloseTo(2.1,1);expect(found.point.clone().addScaledVector(found.side,found.lane).distanceTo(point)).toBeLessThan(.1);}
  });
  for(const stop of JOURNEY_STOPS)it(`parks at ${stop.name} from the road`,()=>{
    const drive=new CityDrive(journeyRoad);drive.traffic.cars.length=0;
    drive.distance=stopDistance(stop.id)-200;drive.position.copy(journeyRoad.frame(drive.distance,2.1).point);drive.yaw=journeyRoad.frame(drive.distance).yaw;
    drive.navigate(stopDistance(stop.id));drive.start();advance(drive,40);
    expect(drive.phase).toBe('parked');expect(drive.speed).toBe(0);
    expect(nearbyStop(drive.distance)?.id).toBe(stop.id);
    expect(Math.abs(drive.distance-stopDistance(stop.id))).toBeLessThan(1);
    expect(drive.stoppedAt).toBe(stop.id);
    const access=accessFor(stop.id);expect(drive.position.distanceTo(access.road.frame(access.parking,.7).point)).toBeLessThan(1);
    expect(drive.lane).toBeGreaterThan(journeyRoad.halfWidth+20);
  });
  it('travels the whole route with traffic, visiting each stop and returning to the café',()=>{
    const drive=new CityDrive(journeyRoad);
    for(const stop of [...JOURNEY_STOPS,JOURNEY_STOPS[0]]){drive.navigate(stopDistance(stop.id));drive.start();let elapsed=0;while(drive.phase!=="parked"&&elapsed<240){drive.update(1/20);expect(drive.collisionTime).toBe(0);elapsed+=1/20;}expect(drive.phase).toBe("parked");expect(nearbyStop(drive.distance)?.id).toBe(stop.id);expect(drive.stoppedAt).toBe(stop.id);}
    expect(drive.distance).toBeGreaterThan(journeyRoad.length);
  });
  it('can choose a previous destination on the next circuit and keep a selected stop after Cruise resumes',()=>{
    const cafe=stopDistance('cafe'),lake=stopDistance('lake');
    expect(nextVisit(lake,cafe,journeyRoad.length)).toBeCloseTo(cafe+journeyRoad.length);
    const drive=new CityDrive(journeyRoad);drive.distance=lake;drive.navigate(cafe);drive.setAutomatic(false);drive.setAutomatic(true);
    expect(drive.nextOverlook).toBeCloseTo(cafe+journeyRoad.length);
  });
  it('honours the selected stop without travel animation under reduced motion',()=>{
    const drive=new CityDrive(journeyRoad);drive.navigate(stopDistance('trailhead'));drive.start();
    for(let i=0;i<100;i++)drive.update(1/30,true,true);
    expect(drive.phase).toBe('parked');expect(nearbyStop(drive.distance)?.id).toBe('trailhead');
  });
});

it('connects each open access road to the main road at both ends',()=>{
  for(const access of journeyAccess){
    expect(access.road.frame(0).point.distanceTo(journeyRoad.frame(access.entry,5.5).point)).toBeLessThan(.001);
    expect(access.road.frame(access.road.length).point.distanceTo(journeyRoad.frame(access.exit,5.5).point)).toBeLessThan(.001);
    expect(access.road.frame(0).point.distanceTo(access.road.frame(access.road.length).point)).toBeGreaterThan(180);
  }
});
it('allows manual steering into an access road and back onto the main road without position jumps',()=>{
  const access=accessFor('cafe'),drive=new CityDrive(journeyRoad);drive.traffic.cars.length=0;
  drive.distance=access.entry-25;drive.position.copy(journeyRoad.frame(drive.distance,5.5).point);drive.yaw=journeyRoad.frame(drive.distance).yaw;drive.phase='driving';drive.engineOn=true;drive.speed=5;
  let entered=false,rejoined=false,maxJump=0;
  for(let i=0;i<5000&&!rejoined;i++){
    const projected=access.road.nearest(drive.position.x,drive.position.z);
    const aim=entered&&!drive.access?journeyRoad.frame(drive.distance+9,5.5).point:access.road.frame(projected.distance+9).point;
    const target=Math.atan2(aim.x-drive.position.x,aim.z-drive.position.z),error=Math.atan2(Math.sin(target-drive.yaw),Math.cos(target-drive.yaw));
    drive.controls.left=error>.018;drive.controls.right=error<-.018;drive.controls.gas=drive.speed<5.5;drive.controls.brake=drive.speed>6;
    const previous=drive.position.clone();drive.update(1/60);maxJump=Math.max(maxJump,previous.distanceTo(drive.position));
    if(drive.access?.id==='cafe')entered=true;
    if(entered&&!drive.access&&drive.distance>access.exit-2)rejoined=true;
  }
  expect(entered).toBe(true);expect(rejoined).toBe(true);expect(maxJump).toBeLessThan(.3);expect(drive.automatic).toBe(false);
});
it('continues on the main road past an unselected turnoff',()=>{
  const access=accessFor('cafe'),drive=new CityDrive(journeyRoad);drive.traffic.cars.length=0;drive.distance=access.entry-50;drive.position.copy(journeyRoad.frame(drive.distance,2.1).point);drive.yaw=journeyRoad.frame(drive.distance).yaw;drive.setAutomatic(true);drive.start();
  for(let i=0;i<1400;i++){drive.update(1/60);expect(drive.access).toBeNull();}
  expect(drive.distance).toBeGreaterThan(access.exit);
});

it('continues a fast braking manoeuvre from an access road onto the main road',()=>{
  const drive=new CityDrive(journeyRoad),access=accessFor('cafe');drive.traffic.cars.length=0;drive.reviewAt('cafe');drive.phase='driving';drive.engineOn=true;drive.speed=50;drive.park();
  let frozen=0,maxJump=0;
  for(let i=0;i<900;i++){const previous=drive.position.clone();drive.update(1/60);const moved=previous.distanceTo(drive.position);maxJump=Math.max(maxJump,moved);if(drive.speed>2&&moved<.001)frozen++;}
  expect(drive.phase).toBe('parked');expect(drive.access).toBeNull();expect(drive.distance).toBeGreaterThan(access.exit+50);expect(frozen).toBe(0);expect(maxJump).toBeLessThan(1);
});
it('can resume toward a nearby stop while already on its access road',()=>{
  const drive=new CityDrive(journeyRoad),access=accessFor('cafe');drive.traffic.cars.length=0;drive.reviewAt('cafe');drive.accessDistance=access.parking-20;drive.position.copy(access.road.frame(drive.accessDistance,.7).point);drive.distance=journeyRoad.nearest(drive.position.x,drive.position.z).distance;
  drive.navigate(access.centre);drive.start();expect(drive.nextOverlook-drive.distance).toBeLessThan(40);advance(drive,15);expect(drive.stoppedAt).toBe('cafe');expect(drive.distance).toBeLessThan(access.exit);
});

it('waits outside the traffic lane at a blocked exit and resumes when it clears',()=>{
  const access=accessFor('cafe'),drive=new CityDrive(journeyRoad);drive.reviewAt('cafe');
  drive.traffic.cars.splice(1);
  const conflict=access.road.frame(access.road.length-20).point;
  Object.assign(drive.traffic.cars[0],{distance:journeyRoad.nearest(conflict.x,conflict.z).distance,lane:5.5,direction:1,speed:0,targetSpeed:0});
  drive.navigate(stopDistance('tennis'));drive.start();advance(drive,35);
  expect(drive.phase).toBe('driving');expect(drive.access?.id).toBe('cafe');expect(drive.speed).toBeLessThan(.1);
  expect(drive.lane).toBeGreaterThan(9);expect(drive.collisionTime).toBe(0);
  drive.traffic.cars.length=0;advance(drive,65);
  expect(drive.stoppedAt).toBe('tennis');
});
