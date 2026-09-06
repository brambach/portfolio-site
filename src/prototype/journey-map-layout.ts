import {journeyRoad,accessFor,type JourneyStopId,type JourneyAccess} from './journey-route';
const samples=Array.from({length:180},(_,i)=>journeyRoad.frame(i/180*journeyRoad.length).point);
const minX=Math.min(...samples.map(p=>p.x)),maxX=Math.max(...samples.map(p=>p.x));
const minZ=Math.min(...samples.map(p=>p.z)),maxZ=Math.max(...samples.map(p=>p.z));
export function mapPoint(distance:number){
  return mapWorldPoint(journeyRoad.frame(distance).point);
}
export function mapWorldPoint(p:{x:number;z:number}){
  return {x:35+(p.x-minX)/(maxX-minX)*430,y:25+(maxZ-p.z)/(maxZ-minZ)*320};
}
export const mapPoints=samples.map((_,i)=>mapPoint(i/180*journeyRoad.length));
export const mapOutline=mapPoints.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+' Z';

export function mapStopPoint(id:JourneyStopId,access=accessFor(id)){return mapWorldPoint(access.road.frame(access.parking).point);}
export function accessOutline(access:JourneyAccess){return Array.from({length:70},(_,i)=>{const p=mapWorldPoint(access.road.frame(i/69*access.road.length).point);return `${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(' ');}
