import {CatmullRomCurve3, MathUtils, Vector3} from 'three';

// A closed boulevard with long straights and a waterfront bend.
const curve = new CatmullRomCurve3([
  [0,0,0], [0,0,180], [0,0,400], [-35,0,535], [-160,0,570],
  [-350,0,570], [-470,0,520], [-500,0,380], [-500,0,100],
  [-480,0,-140], [-350,0,-220], [-130,0,-220], [0,0,-140],
].map(p => new Vector3(...p as [number,number,number])), true, 'centripetal');
curve.arcLengthDivisions = 2000;
export const CITY_LENGTH = curve.getLength();
export const CITY_STOP = CITY_LENGTH * .34;
export const CITY_HALF_WIDTH = 8;
export function cityFrame(distance: number, lane = 0) {
  const u = MathUtils.euclideanModulo(distance,CITY_LENGTH)/CITY_LENGTH;
  const tangent = curve.getTangentAt(u).normalize();
  const side = new Vector3(tangent.z,0,-tangent.x).normalize();
  return {point:curve.getPointAt(u).addScaledVector(side,lane), tangent, side, yaw:Math.atan2(tangent.x,tangent.z), slope:0};
}
const samples = Array.from({length:900},(_,i) => ({...cityFrame(i/900*CITY_LENGTH),distance:i/900*CITY_LENGTH}));
export function nearestCityRoad(x: number,z: number) {
  let nearest = samples[0], squared = Infinity;
  for (const sample of samples) {
    const d = (x-sample.point.x)**2+(z-sample.point.z)**2;
    if (d<squared) {squared=d;nearest=sample;}
  }
  const along = (x-nearest.point.x)*nearest.tangent.x+(z-nearest.point.z)*nearest.tangent.z;
  const distance = nearest.distance+along;
  const frame = cityFrame(distance);
  const lane = (x-frame.point.x)*frame.side.x+(z-frame.point.z)*frame.side.z;
  return {...frame,distance,lane,away:Math.abs(lane)};
}


export const cityRoad={length:CITY_LENGTH,halfWidth:CITY_HALF_WIDTH,cruiseStop:CITY_STOP,frame:cityFrame,nearest:nearestCityRoad};
