import * as THREE from 'three';
import {InstancedMesh,Matrix4,Vector3} from 'three';
import {expect,it} from 'vitest';
import {createRouteDressing,parkedLakeView,partRadius,routeDressingParts,DRESSING_ACCESS_MARGIN,DRESSING_ROAD_MARGIN,NARROW_VIEW_ASPECT,PARKED_EYE_HEIGHT,type RouteDressingPart} from './route-dressing';
import {scenicAccess,scenicRoad} from './scenic-route';
import {createScenicDrive} from './scenic-drive';
import {SCENIC_PROFILE} from './road-profile';
import {LAKE_LEVEL,landHeight,scenicLakeFrame} from './journey-land';

const parts=routeDressingParts();
const byZone=(zone:RouteDressingPart['zone'])=>parts.filter(part=>part.zone===zone);
const byKind=(kind:RouteDressingPart['kind'])=>parts.filter(part=>part.kind===kind);

it('uses the production parked lane as the lake composition origin',()=>{
  const drive=createScenicDrive();
  drive.reviewAt('lake');
  expect(parkedLakeView().origin.distanceTo(drive.position)).toBeLessThan(.001);
});

it('builds a physical roadside in all three route zones',()=>{
  expect(byZone('town-edge').length).toBeGreaterThanOrEqual(60);
  expect(byZone('valley').length).toBeGreaterThanOrEqual(150);
  expect(byZone('lake-shore').length).toBeGreaterThanOrEqual(12);
  for(const kind of ['stone','timber','rock','shrub'] as const)expect(byKind(kind).length).toBeGreaterThanOrEqual(12);
});

it('lays the long stone courses along the road rather than across it',()=>{
  const stones=byZone('town-edge').filter(part=>part.kind==='stone');
  expect(stones.length).toBeGreaterThan(20);
  for(const stone of stones){
    const nearest=scenicRoad.nearest(stone.point.x,stone.point.z);
    const tangent=scenicRoad.frame(nearest.distance).tangent.clone().setY(0).normalize();
    const longAxis=new Vector3(stone.w>stone.d?1:0,0,stone.w>stone.d?0:1).applyAxisAngle(new Vector3(0,1,0),stone.yaw);
    expect(Math.abs(longAxis.dot(tangent))).toBeGreaterThan(.98);
  }
});

it('keeps every emitted part outside the driveable shoulder',()=>{
  const offenders=parts.filter(part=>scenicRoad.nearest(part.point.x,part.point.z).away<SCENIC_PROFILE.shoulderHalfWidth+DRESSING_ROAD_MARGIN+partRadius(part));
  expect(offenders.map(part=>`${part.zone}/${part.kind}`)).toEqual([]);
});

it('keeps every emitted part clear of the access lanes',()=>{
  const offenders=parts.filter(part=>scenicAccess.some(access=>{
    const nearest=access.road.nearest(part.point.x,part.point.z);
    return nearest.distance>=0&&nearest.distance<=access.road.length&&nearest.away<access.road.halfWidth+DRESSING_ACCESS_MARGIN+partRadius(part);
  }));
  expect(offenders.map(part=>`${part.zone}/${part.kind}`)).toEqual([]);
});

it('stacks the town terrace into real courses that sit on the ground',()=>{
  const stones=byZone('town-edge').filter(part=>part.kind==='stone');
  const heights=new Set(stones.map(part=>Math.round((part.h)*100)/100));
  expect(heights.size).toBeGreaterThanOrEqual(2);
  const columns=new Map<string,RouteDressingPart[]>();
  for(const stone of stones){
    const key=`${Math.round(stone.point.x*2)}:${Math.round(stone.point.z*2)}`;
    columns.set(key,[...(columns.get(key)??[]),stone]);
  }
  const stacked=[...columns.values()].filter(column=>column.length>1);
  expect(stacked.length).toBeGreaterThanOrEqual(20);
  for(const column of stacked){
    const sorted=[...column].sort((a,b)=>a.point.y-b.point.y);
    for(let i=1;i<sorted.length;i++){
      const below=sorted[i-1],above=sorted[i];
      // Courses meet rather than float or interpenetrate.
      expect(above.point.y-above.h/2).toBeCloseTo(below.point.y+below.h/2,1);
      // The upper course is set back so the terrace reads as two lines of stone.
      expect(above.d).toBeLessThan(below.d);
    }
    const base=sorted[0];
    expect(base.point.y-base.h/2).toBeCloseTo(landHeight(base.point.x,base.point.z,true),1);
  }
});

it('lays the long shore kerbs along the waterline',()=>{
  const stones=byZone('lake-shore').filter(part=>part.kind==='stone');
  expect(stones.length).toBeGreaterThan(8);
  const tangent=scenicLakeFrame.tangent.clone().setY(0).normalize();
  for(const stone of stones){
    const longAxis=new Vector3(1,0,0).applyAxisAngle(new Vector3(0,1,0),stone.yaw);
    expect(Math.abs(longAxis.dot(tangent))).toBeGreaterThan(.98);
  }
});

it('leaves joints between neighbouring shore kerbs',()=>{
  const stones=byZone('lake-shore').filter(part=>part.kind==='stone');
  const tangent=scenicLakeFrame.tangent.clone().setY(0).normalize();
  const inward=parkedLakeView().inward;
  let pairs=0;
  for(let i=0;i<stones.length;i++)for(let j=i+1;j<stones.length;j++){
    const a=stones[i],b=stones[j],delta=a.point.clone().sub(b.point);
    const along=Math.abs(delta.dot(tangent));
    // Only stones set at the same depth are neighbours in a run. Two stones
    // standing well apart across the shore need no joint between them.
    if(Math.abs(delta.dot(inward))>(a.d+b.d)/2)continue;
    if(along<3){pairs++;expect(along-(a.w+b.w)/2).toBeGreaterThan(.05);}
  }
  expect(pairs).toBeGreaterThan(8);
});

it('keeps the lake shore frame below the parked driver sightline',()=>{
  const shore=byZone('lake-shore');
  for(const part of shore){
    expect(part.point.y+part.h/2).toBeLessThan(LAKE_LEVEL+1.2);
    expect(part.h).toBeLessThanOrEqual(.6);
  }
  expect(shore.filter(part=>part.kind==='stone').length).toBeGreaterThanOrEqual(8);
  expect(shore.some(part=>part.kind==='rock')).toBe(true);
});

// The parked lake view, measured the way the cabin camera sees it: the eye sits
// PARKED_EYE_HEIGHT above the parking ground and looks along `inward`. The
// half-angle is the horizontal one at 390 x 844, which is the frame that showed
// nothing but bare shore. Suspension travel and body roll aren't modelled.
const view=parkedLakeView();
const halfAngle=Math.atan(Math.tan(68*Math.PI/180/2)*NARROW_VIEW_ASPECT);
const local=(part:RouteDressingPart)=>{
  const delta=part.point.clone().sub(view.origin);
  return {forward:delta.dot(view.inward),lateral:delta.dot(view.tangent),part};
};
// The near band is the shore in front of the parked car, short of the water and
// inside the width a narrow frame could ever reach.
const nearBand=byZone('lake-shore').map(local).filter(seat=>seat.forward>0&&seat.forward<=12&&Math.abs(seat.lateral)<5);
const kerbLine=byZone('lake-shore').map(local).filter(seat=>Math.abs(seat.lateral)>=5);
// A square footprint from the part's longest side, so a rotated stone is still
// covered without reconstructing its oriented box.
const extent=(part:RouteDressingPart)=>Math.max(part.w,part.d)/2;

// The rendered truth: every instance matrix applied to the actual vertices it
// draws. A rotated polyhedron's lowest point is nowhere near point.y - h/2, so
// seating has to be judged here rather than from the authored centre.
const drawn=(()=>{
  const group=createRouteDressing(parts);
  const meshes=group.children.filter(child=>child instanceof InstancedMesh) as InstancedMesh[];
  const matrix=new Matrix4(),vertex=new Vector3();
  const seats=new Map<RouteDressingPart,{low:number;high:number;material:THREE.MeshStandardMaterial}>();
  for(const mesh of meshes){
    const members=parts.filter(part=>part.kind===(mesh.name.split(' ').pop() as RouteDressingPart['kind']));
    const position=mesh.geometry.getAttribute('position');
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix);
      let low=Infinity,high=-Infinity;
      for(let v=0;v<position.count;v++){
        vertex.fromBufferAttribute(position,v).applyMatrix4(matrix);
        low=Math.min(low,vertex.y);high=Math.max(high,vertex.y);
      }
      seats.set(members[i],{low,high,material:mesh.material as THREE.MeshStandardMaterial});
    }
  }
  return seats;
})();
const rendered=(part:RouteDressingPart)=>{
  const seat=drawn.get(part);
  if(!seat)throw new Error(`${part.zone}/${part.kind} was never drawn.`);
  return seat;
};

it('seats every lake foreground piece in the ground it actually covers',()=>{
  expect(nearBand.length).toBeGreaterThanOrEqual(6);
  for(const seat of nearBand){
    const {low,high}=rendered(seat.part);
    // The lowest ground the footprint spans, not just the centre sample. A
    // piece level with its centre still floats over the dip in front of it.
    const corners=[[seat.part.w/2,seat.part.d/2],[-seat.part.w/2,seat.part.d/2],[seat.part.w/2,-seat.part.d/2],[-seat.part.w/2,-seat.part.d/2],[0,0]];
    const ground=Math.min(...corners.map(([across,along])=>{
      const point=seat.part.point.clone().addScaledVector(view.tangent,across).addScaledVector(view.inward,along);
      return landHeight(point.x,point.z,true);
    }));
    // Bedded in, so no daylight under any edge.
    expect(low).toBeLessThanOrEqual(ground);
    // Bedded, not sunk out of sight.
    expect(low).toBeGreaterThan(ground-.3);
    expect(high-ground).toBeGreaterThan(.12);
  }
});

it('gives the lake foreground the shore\'s own granite rather than bare white facets',()=>{
  const boulders=nearBand.filter(seat=>seat.part.kind==='boulder');
  expect(boulders.length).toBeGreaterThanOrEqual(4);
  for(const seat of boulders){
    const {material}=rendered(seat.part);
    // The same textured granite the neighbouring shore rocks are made of.
    expect(material.map).toBeTruthy();
    expect(material.roughness).toBeGreaterThanOrEqual(.9);
  }
  // No box slabs in the near shore. Two of them lined up into a plinth.
  expect(nearBand.filter(seat=>seat.part.kind==='stone').map(seat=>seat.forward.toFixed(1))).toEqual([]);
});

it('matches the existing shore rock instance tint instead of whitening it',()=>{
  const mesh=createRouteDressing(parts).getObjectByName('Route dressing boulder') as InstancedMesh;
  expect(mesh.count).toBeGreaterThan(0);
  const colour=new THREE.Color();
  for(let i=0;i<mesh.count;i++){
    mesh.getColorAt(i,colour);
    expect(Math.max(colour.r,colour.g,colour.b)).toBeLessThan(.6);
    expect(colour.r).toBeGreaterThan(colour.b);
  }
});

it('puts a real lake foreground inside the narrow parked frame',()=>{
  const framed=nearBand.filter(seat=>Math.abs(seat.lateral)<=seat.forward*Math.tan(halfAngle)*.85);
  expect(framed.length).toBeGreaterThanOrEqual(4);
  expect(new Set(framed.map(seat=>seat.part.kind)).size).toBeGreaterThanOrEqual(2);
  // Near enough to read as foreground rather than another distant kerb.
  expect(Math.min(...framed.map(seat=>seat.forward))).toBeLessThan(7.5);
});

it('keeps the lake foreground under the horizon and out of the windshield',()=>{
  expect(nearBand.length).toBeGreaterThanOrEqual(6);
  for(const seat of nearBand){
    const top=rendered(seat.part).high;
    // Nothing reaches the driver's eyeline, so the far horizon stays whole.
    expect(top).toBeLessThan(view.eye-.7);
    // The sight ray grazing the top lands on water close in, so the lake beyond
    // it is open rather than screened.
    const above=top-view.water;
    expect(seat.forward*(view.eye-view.water)/(view.eye-view.water-above)).toBeLessThan(16);
  }
});

it('composes the near shore asymmetrically',()=>{
  const centroid=nearBand.reduce((total,seat)=>total+seat.lateral,0)/nearBand.length;
  expect(Math.abs(centroid)).toBeGreaterThan(.3);
  const mirrored=nearBand.filter(seat=>nearBand.some(other=>other!==seat&&other.part.kind===seat.part.kind&&Math.abs(other.lateral+seat.lateral)<.6&&Math.abs(other.forward-seat.forward)<.6));
  expect(mirrored.map(seat=>seat.part.kind)).toEqual([]);
});

it('spaces the lake foreground so no two pieces share ground',()=>{
  const crowded:string[]=[];
  for(let i=0;i<nearBand.length;i++)for(let j=i+1;j<nearBand.length;j++){
    const a=nearBand[i],b=nearBand[j];
    const reach=extent(a.part)+extent(b.part);
    // Separated on the shore axis or on the depth axis is enough; a piece only
    // shares ground when it clears neither.
    const gap=Math.max(Math.abs(a.lateral-b.lateral),Math.abs(a.forward-b.forward))-reach;
    if(gap<=.1)crowded.push(`${a.part.kind}/${b.part.kind} ${gap.toFixed(2)}`);
  }
  expect(crowded).toEqual([]);
  for(const seat of nearBand)for(const kerb of kerbLine){
    expect(Math.hypot(seat.lateral-kerb.lateral,seat.forward-kerb.forward)).toBeGreaterThan(extent(seat.part)+extent(kerb.part)+.5);
  }
});

// Ground contact for the lake foreground is asserted from the transformed mesh
// in "seats every lake foreground piece in the ground it actually covers".
// point.y - h/2 is not the floor of a tilted polyhedron, so it isn't checked
// here any more.
it('keeps the authored lake foreground centres near their own ground',()=>{
  for(const seat of nearBand){
    expect(Math.abs(seat.part.point.y-landHeight(seat.part.point.x,seat.part.point.z,true))).toBeLessThan(.5);
  }
  expect(PARKED_EYE_HEIGHT).toBeGreaterThan(1);
});

it('runs timber rails between the posts that carry them',()=>{
  const valley=byZone('valley').filter(part=>part.kind==='timber');
  const posts=valley.filter(part=>part.h>1);
  const rails=valley.filter(part=>part.h<=1);
  expect(posts.length).toBeGreaterThanOrEqual(40);
  expect(rails.length).toBeGreaterThanOrEqual(posts.length);
  for(const rail of rails){
    const nearestPost=posts.reduce((best,post)=>post.point.distanceTo(rail.point)<best.point.distanceTo(rail.point)?post:best,posts[0]);
    expect(nearestPost.point.distanceTo(rail.point)).toBeLessThan(4);
  }
});

it('emits one instanced batch per material and loses no part',()=>{
  const group=createRouteDressing(parts);
  const meshes=group.children.filter(child=>child instanceof InstancedMesh) as InstancedMesh[];
  expect(meshes.length).toBe(group.children.length);
  // Five: the lake foreground adds one batch, because it borrows the shore's
  // textured granite rather than the flat rock material.
  expect(meshes.length).toBeLessThanOrEqual(5);
  expect(meshes.reduce((total,mesh)=>total+mesh.count,0)).toBe(parts.length);
  const matrix=new Matrix4(),position=new Vector3();
  // Instance matrices are stored as float32, so positions are compared within a
  // millimetre rather than by exact equality.
  const placed:Vector3[]=[];
  for(const mesh of meshes)for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
    placed.push(position.clone());
  }
  // A seated piece is dropped in Y until its lowest vertex meets the ground, so
  // it is matched on the ground plane and allowed its bedding depth.
  const missing=parts.filter(part=>!placed.some(candidate=>
    Math.hypot(candidate.x-part.point.x,candidate.z-part.point.z)<.001&&Math.abs(candidate.y-part.point.y)<(part.seat===undefined?.001:.5)));
  expect(missing.map(part=>`${part.zone}/${part.kind}`)).toEqual([]);
});
