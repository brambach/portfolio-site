import * as THREE from 'three';
import {scenicRoad,scenicAccess} from './scenic-route';
import {SCENIC_PROFILE} from './road-profile';
import {landHeight,scenicLakeFrame,LAKE_LEVEL} from './journey-land';
import {scenicRockGeometry,scenicRockMaterial} from './landscape-detail';

export type RouteDressingKind='stone'|'timber'|'rock'|'shrub'|'boulder';
export type RouteDressingZone='town-edge'|'valley'|'lake-shore';
export type RouteDressingPart={
  kind:RouteDressingKind;
  zone:RouteDressingZone;
  point:THREE.Vector3;
  yaw:number;
  w:number;
  h:number;
  d:number;
  // Full rotation, for pieces that should lie the way a rock lies rather than
  // stand square to the shore.
  tilt?:[number,number,number];
  // The world height the lowest drawn vertex has to reach. Set for anything
  // bedded into ground that isn't level under its own footprint.
  seat?:number;
  // Multiplies the instance colour, so a small flat-topped piece doesn't blow
  // out white next to the boulders it is meant to match.
  shade?:number;
};

// The dressing sits outside the gravel shoulder the car is allowed to use, and
// outside every access lane, so nothing new can be driven into.
export const DRESSING_ROAD_MARGIN=.5;
export const DRESSING_ACCESS_MARGIN=1.5;
// Nothing on the shore rises into the parked driver's view of the water.
export const SHORE_SIGHTLINE=LAKE_LEVEL+1.1;
// The cabin camera's height above the car's ground, taken from the seated end
// of the entry path in camera-path. Suspension travel and body roll aren't
// modelled here; this is the composition datum, not the render pose.
export const PARKED_EYE_HEIGHT=1.27;
// 390 x 844, the narrow frame the shore has to read in.
export const NARROW_VIEW_ASPECT=390/844;

// The frame the parked driver actually looks through after Take in the view:
// the camera turns from the parking spot toward the lake, so `inward` is the
// view axis and `tangent` runs along the shore across it.
export function parkedLakeView(heightAt:(x:number,z:number)=>number=(x,z)=>landHeight(x,z,true)){
  const lake=scenicAccess.find(access=>access.id==='lake');
  if(!lake)throw new Error('The scenic route has no lake access to park on.');
  const origin=lake.road.frame(lake.parking,.7).point;
  return {
    origin,
    inward:scenicLakeFrame.point.clone().sub(origin).setY(0).normalize(),
    tangent:scenicLakeFrame.tangent.clone().setY(0).normalize(),
    eye:heightAt(origin.x,origin.z)+PARKED_EYE_HEIGHT,
    water:LAKE_LEVEL,
  };
}

// Where the built edge runs. The first two courses continue the featured
// street's stone; the last pair carry it out of town into the open valley.
const TERRACE_RUNS=[
  {start:216,end:430,side:-1},
  {start:812,end:996,side:-1},
  {start:812,end:996,side:1},
] as const;
const TERRACE_LANE=10.9,TERRACE_STEP=5.2;
// Five authored guard runs rather than a rail that never stops.
const RAIL_RUNS=[1100,1380,1660,1980,2260] as const;
const RAIL_LENGTH=120,RAIL_LANE=10.6,POST_SPACING=5.5;

// The parked view's own foreground, in metres forward of the parking spot and
// across the shore. Granite boulders of the same stock as the ones already
// lying at the frame edges, plus low planting. No boxes: two slabs lined up in
// projection and read as one pale plinth. Deliberately uneven, nothing
// mirrored, every piece bedded into the sand by `bury` metres.
const LAKE_FOREGROUND=[
  {kind:'boulder' as const,fwd:7.0,lat:-1.30,w:1.35,h:.50,d:1.05,bury:.17,tilt:[.19,1.1,-.13] as [number,number,number],shade:.9},
  {kind:'boulder' as const,fwd:5.7,lat:-2.35,w:.95,h:.40,d:.85,bury:.13,tilt:[-.14,2.4,.2] as [number,number,number],shade:.86},
  {kind:'boulder' as const,fwd:7.4,lat:.40,w:.70,h:.28,d:.65,bury:.09,tilt:[.24,.6,.17] as [number,number,number],shade:.84},
  {kind:'boulder' as const,fwd:8.4,lat:1.55,w:1.25,h:.46,d:1.0,bury:.15,tilt:[-.2,3.3,.12] as [number,number,number],shade:.92},
  {kind:'boulder' as const,fwd:9.7,lat:-1.05,w:.85,h:.34,d:.75,bury:.11,tilt:[.15,4.1,-.22] as [number,number,number],shade:.88},
  {kind:'shrub'   as const,fwd:6.9,lat:-2.90,w:1.05,h:.40,d:1.0,bury:.06,tilt:[0,.5,0] as [number,number,number],shade:1},
  {kind:'shrub'   as const,fwd:9.6,lat:2.30,w:.90,h:.34,d:.90,bury:.05,tilt:[0,-.4,0] as [number,number,number],shade:.94},
  {kind:'shrub'   as const,fwd:9.9,lat:.15,w:.80,h:.28,d:.80,bury:.05,tilt:[0,1.9,0] as [number,number,number],shade:.9},
] as const;

export function partRadius(part:{w:number;d:number}){return Math.hypot(part.w,part.d)/2;}

export function clearOfRoutes(point:THREE.Vector3,radius:number){
  if(scenicRoad.nearest(point.x,point.z).away<SCENIC_PROFILE.shoulderHalfWidth+DRESSING_ROAD_MARGIN+radius)return false;
  return !scenicAccess.some(access=>{
    const nearest=access.road.nearest(point.x,point.z);
    return nearest.distance>=0&&nearest.distance<=access.road.length&&nearest.away<access.road.halfWidth+DRESSING_ACCESS_MARGIN+radius;
  });
}

// A group is placed whole or not at all, so a stacked course never loses the
// stone underneath it.
function admit(parts:RouteDressingPart[],group:RouteDressingPart[]){
  if(group.every(part=>clearOfRoutes(part.point,partRadius(part))))parts.push(...group);
}

export function routeDressingParts(heightAt:(x:number,z:number)=>number=(x,z)=>landHeight(x,z,true)):RouteDressingPart[]{
  const parts:RouteDressingPart[]=[];
  let index=0;
  for(const run of TERRACE_RUNS){
    for(let distance=run.start;distance<=run.end;distance+=TERRACE_STEP){
      index++;
      const frame=scenicRoad.frame(distance,run.side*TERRACE_LANE);
      const ground=heightAt(frame.point.x,frame.point.z);
      const base={kind:'stone' as const,zone:'town-edge' as const,yaw:frame.yaw+Math.PI/2,w:4.6,h:.42,d:1.15};
      const cap={kind:'stone' as const,zone:'town-edge' as const,yaw:frame.yaw+Math.PI/2,w:4.6,h:.3,d:.82};
      const group:RouteDressingPart[]=[
        {...base,point:new THREE.Vector3(frame.point.x,ground+base.h/2,frame.point.z)},
        {...cap,point:new THREE.Vector3(frame.point.x,ground+base.h+cap.h/2,frame.point.z)},
      ];
      // A timber bollard every fourth bay breaks the run and ties the stone to
      // the shopfront joinery.
      if(index%4===0){
        const post=scenicRoad.frame(distance,run.side*(TERRACE_LANE+1.5));
        const postGround=heightAt(post.point.x,post.point.z);
        group.push({kind:'timber',zone:'town-edge',point:new THREE.Vector3(post.point.x,postGround+.45,post.point.z),yaw:post.yaw,w:.2,h:.9,d:.2});
      }
      admit(parts,group);
    }
  }
  for(let run=0;run<RAIL_RUNS.length;run++){
    const side=run%2?1:-1,start=RAIL_RUNS[run];
    const posts:{point:THREE.Vector3;yaw:number;ground:number;distance:number}[]=[];
    for(let distance=start;distance<=start+RAIL_LENGTH;distance+=POST_SPACING){
      const frame=scenicRoad.frame(distance,side*RAIL_LANE);
      posts.push({point:frame.point,yaw:frame.yaw,ground:heightAt(frame.point.x,frame.point.z),distance});
    }
    for(let i=0;i<posts.length;i++){
      const post=posts[i];
      admit(parts,[{kind:'timber',zone:'valley',point:new THREE.Vector3(post.point.x,post.ground+.62,post.point.z),yaw:post.yaw,w:.17,h:1.25,d:.17}]);
      if(i<posts.length-1){
        const next=posts[i+1],mid=scenicRoad.frame((post.distance+next.distance)/2,side*RAIL_LANE);
        const ground=(post.ground+next.ground)/2;
        for(const height of [.58,.98])admit(parts,[{kind:'timber',zone:'valley',point:new THREE.Vector3(mid.point.x,ground+height,mid.point.z),yaw:mid.yaw,w:.09,h:.13,d:POST_SPACING}]);
      }
      // Rock and planting groups sit behind the rail so the shoulder stays open.
      if(i%3===1){
        const backdrop=scenicRoad.frame(post.distance+1.4,side*(RAIL_LANE+3.6));
        const rockGround=heightAt(backdrop.point.x,backdrop.point.z);
        admit(parts,[{kind:'rock',zone:'valley',point:new THREE.Vector3(backdrop.point.x,rockGround+.34,backdrop.point.z),yaw:post.distance,w:1.6,h:.9,d:1.3}]);
        const planted=scenicRoad.frame(post.distance-1.8,side*(RAIL_LANE+5.2));
        const plantGround=heightAt(planted.point.x,planted.point.z);
        admit(parts,[{kind:'shrub',zone:'valley',point:new THREE.Vector3(planted.point.x,plantGround+.62,planted.point.z),yaw:post.distance*.7,w:1.7,h:1.35,d:1.7}]);
      }
    }
  }
  const lake=scenicAccess.find(access=>access.id==='lake');
  if(lake){
    const {origin:parking,inward,tangent}=parkedLakeView(heightAt);
    const shoreYaw=Math.atan2(tangent.x,tangent.z);
    // The near shore the parked driver is actually looking at. Authored piece by
    // piece rather than stepped, because a stepped run reads as a fence and a
    // mirrored one reads as a stage set. Everything stays low enough that the
    // sight ray over its top lands on water within a few metres, so the lake and
    // the far horizon are untouched.
    for(const piece of LAKE_FOREGROUND){
      const point=parking.clone().addScaledVector(inward,piece.fwd).addScaledVector(tangent,piece.lat);
      // Seated against the lowest ground the footprint covers, not the centre
      // sample. The beach falls away toward the water, so a piece level with
      // its own centre shows daylight under its front edge.
      const ground=Math.min(...[[0,0],[piece.w/2,piece.d/2],[-piece.w/2,piece.d/2],[piece.w/2,-piece.d/2],[-piece.w/2,-piece.d/2]].map(([across,along])=>{
        const corner=point.clone().addScaledVector(tangent,across).addScaledVector(inward,along);
        return heightAt(corner.x,corner.z);
      }));
      admit(parts,[{
        kind:piece.kind,
        zone:'lake-shore',
        point:new THREE.Vector3(point.x,ground+piece.h/2,point.z),
        yaw:shoreYaw+Math.PI/2+piece.tilt[1],
        w:piece.w,h:piece.h,d:piece.d,
        tilt:[piece.tilt[0],shoreYaw+Math.PI/2+piece.tilt[1],piece.tilt[2]],
        seat:ground-piece.bury,
        shade:piece.shade,
      }]);
    }
    for(let offset=-30;offset<=30;offset+=2.5){
      // The view straight ahead of the parked car stays open water.
      if(Math.abs(offset)<6)continue;
      const base=parking.clone().addScaledVector(tangent,offset);
      let waterline:THREE.Vector3|null=null;
      for(let reach=4;reach<=45;reach+=1.5){
        const probe=base.clone().addScaledVector(inward,reach);
        if(heightAt(probe.x,probe.z)>LAKE_LEVEL+.25)waterline=probe;else break;
      }
      if(!waterline)continue;
      const kerb=waterline.clone().addScaledVector(inward,-1.2);
      const kerbGround=heightAt(kerb.x,kerb.z);
      const shore:RouteDressingPart[]=[{kind:'stone',zone:'lake-shore',point:new THREE.Vector3(kerb.x,kerbGround+.17,kerb.z),yaw:shoreYaw+Math.PI/2,w:2.3,h:.34,d:.9}];
      // Boulders and low planting punctuate the kerb line along the shore
      // rather than stacking up behind it, where the access lane runs.
      if(Math.round(Math.abs(offset)*2)%15===0){
        const boulder=kerb.clone().addScaledVector(tangent,offset>0?1.7:-1.7).addScaledVector(inward,.5);
        const boulderGround=heightAt(boulder.x,boulder.z);
        shore.push({kind:'rock',zone:'lake-shore',point:new THREE.Vector3(boulder.x,boulderGround+.26,boulder.z),yaw:offset,w:1.5,h:.55,d:1.2});
        const clump=kerb.clone().addScaledVector(tangent,offset>0?-1.8:1.8).addScaledVector(inward,-.9);
        const clumpGround=heightAt(clump.x,clump.z);
        shore.push({kind:'shrub',zone:'lake-shore',point:new THREE.Vector3(clump.x,clumpGround+.24,clump.z),yaw:offset*.6,w:1.3,h:.5,d:1.3});
      }
      const visible=shore.filter(part=>part.point.y+part.h/2<SHORE_SIGHTLINE);
      if(visible.length===shore.length)admit(parts,shore);
    }
  }
  return parts;
}

const KIND_COLOURS:Record<RouteDressingKind,string>={
  // Cut stone reads between the town pavement and the café's counter stone,
  // timber matches the shopfront joinery, so the route keeps one palette.
  stone:'#a49f92',
  timber:'#78614a',
  rock:'#b0aca2',
  shrub:'#4a5a41',
  // Multiplied over the granite texture, exactly as the scattered shore rocks
  // are, so the lake foreground is the same stone as its neighbours.
  boulder:'#bcb9b2',
};

// The lowest point a geometry actually draws under this transform. A tilted
// polyhedron's floor is nowhere near its centre minus half its height.
function lowestDrawnY(geometry:THREE.BufferGeometry,matrix:THREE.Matrix4){
  const position=geometry.getAttribute('position'),vertex=new THREE.Vector3();
  let low=Infinity;
  for(let i=0;i<position.count;i++)low=Math.min(low,vertex.fromBufferAttribute(position,i).applyMatrix4(matrix).y);
  return low;
}

export function createRouteDressing(parts:RouteDressingPart[]=routeDressingParts()){
  const group=new THREE.Group();group.name='Route dressing';
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const rockGeometry=new THREE.DodecahedronGeometry(.5,0);
  const shrubGeometry=new THREE.IcosahedronGeometry(.5,1);
  const boulderGeometry=scenicRockGeometry(.5);
  const geometries:Record<RouteDressingKind,THREE.BufferGeometry>={stone:boxGeometry,timber:boxGeometry,rock:rockGeometry,shrub:shrubGeometry,boulder:boulderGeometry};
  const transform=new THREE.Object3D(),colour=new THREE.Color();
  for(const kind of ['stone','timber','rock','shrub','boulder'] as RouteDressingKind[]){
    const members=parts.filter(part=>part.kind===kind);
    if(!members.length)continue;
    const material=kind==='boulder'
      ?scenicRockMaterial()
      :new THREE.MeshStandardMaterial({color:KIND_COLOURS[kind],roughness:kind==='shrub'?1:.9});
    const mesh=new THREE.InstancedMesh(geometries[kind],material,members.length);
    mesh.name=`Route dressing ${kind}`;
    members.forEach((part,i)=>{
      transform.position.copy(part.point);
      if(part.tilt)transform.rotation.set(part.tilt[0],part.tilt[1],part.tilt[2]);
      else transform.rotation.set(kind==='rock'?part.yaw*.13:0,part.yaw,0);
      transform.scale.set(part.w,part.h,part.d);transform.updateMatrix();
      // Drop the piece until the lowest vertex it draws reaches its seat, so it
      // beds into the sand instead of hovering over the fall toward the water.
      if(part.seat!==undefined){
        transform.position.y+=part.seat-lowestDrawnY(geometries[kind],transform.matrix);
        transform.updateMatrix();
      }
      mesh.setMatrixAt(i,transform.matrix);
      // Match the existing shore's sRGB tint before applying local variation.
      // A near-white linear scalar makes this granite too pale.
      if(kind==='boulder'){
        colour.setHSL(.105,.045,.68+(i%5)*.025,THREE.SRGBColorSpace).multiplyScalar(part.shade??1);
      }else{
        const level=THREE.MathUtils.clamp(1+((i*37)%17-8)/140,.88,1.12)*(part.shade??1);
        colour.setRGB(level,level,level);
      }
      mesh.setColorAt(i,colour);
    });
    mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return group;
}
