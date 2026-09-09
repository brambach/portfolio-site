import {Vector3} from 'three';
import {journeyRoad} from './journey-route';
import {scenicAccess} from './scenic-route';

export const TOWN_START=.025,TOWN_END=.215;
export const FEATURE_STREET_START=250,FEATURE_STREET_END=400,FEATURE_STREET_SIDE=-1;
const FEATURE_STREET_SPACING=22;

export type TownBuildingSite={
  distance:number;
  side:number;
  index:number;
  width:number;
  height:number;
  depth:number;
  setback:number;
  pavementDepth:number;
  point:Vector3;
  yaw:number;
  visualSlice?:'first-street';
  role?:'corner'|'shop';
};
export type TownPartKind='plaster'|'timber'|'roof'|'glass'|'pavement'|'trim'|'pitched';
// `shade` is a neutral scalar on the instance colour. It never carries hue, so a
// material's own colour is still applied exactly once.
export type TownBuildingPart={kind:TownPartKind;x:number;y:number;z:number;w:number;h:number;d:number;shade?:number};

function featuredDistance(distance:number,side:number) {
  return side===FEATURE_STREET_SIDE&&distance>=FEATURE_STREET_START&&distance<=FEATURE_STREET_END;
}

function featuredDistances(start:number,end:number) {
  const distances:number[]=[];
  for(let distance=start;distance<=end;distance+=FEATURE_STREET_SPACING)distances.push(distance);
  return distances;
}

// One decisive composition for the featured run. Each plot is dimensioned on its
// own line rather than by a modulo of the index, so the street reads as seven
// built parcels: the frontage steps in plan, the eaves step in height, and each
// crown is a different silhouette against the mountains.
type FeaturedCrown='stepped'|'gable'|'parapet';
type FeaturedMassing={width:number;height:number;depth:number;setback:number;crown:FeaturedCrown};
const FEATURED_MASSING:FeaturedMassing[]=[
  {width:14.6,height:8.2,depth:8.6,setback:15,crown:'stepped'},
  {width:13.8,height:5.6,depth:8.2,setback:17.6,crown:'gable'},
  {width:15.4,height:7.1,depth:8.6,setback:15.1,crown:'parapet'},
  {width:14.2,height:6.5,depth:8.4,setback:16.4,crown:'gable'},
  {width:15,height:7.7,depth:8.6,setback:17.9,crown:'stepped'},
  {width:13.6,height:5.9,depth:8.2,setback:15.2,crown:'gable'},
  {width:14.8,height:6.8,depth:8.6,setback:16.8,crown:'parapet'},
];
const CORNER_MASSING:FeaturedMassing={width:17.6,height:9.4,depth:9.8,setback:15.3,crown:'stepped'};
export function featuredMassing(featureIndex:number,corner:boolean):FeaturedMassing {
  return corner?CORNER_MASSING:FEATURED_MASSING[((featureIndex%FEATURED_MASSING.length)+FEATURED_MASSING.length)%FEATURED_MASSING.length];
}

function wallKind(site:TownBuildingSite):'timber'|'plaster' {
  return site.index%3===0?'timber':'plaster';
}

// The featured run is a built frontage, not an extruded profile. The ground
// storey is a real arcade: solid mass pulled back to `recess`, piers standing at
// `facade`, and glazing set almost a metre behind the pier face so the openings
// are voids with shadowed jambs rather than dark panels on a flat wall.
const FEATURE_GROUND_TOP=3.6;
function featuredBuildingParts(site:TownBuildingSite):TownBuildingPart[] {
  const parts:TownBuildingPart[]=[],wall=wallKind(site);
  const add=(kind:TownPartKind,x:number,y:number,z:number,w:number,h:number,d:number,shade?:number)=>parts.push({kind,x,y,z,w,h,d,shade});
  const {width,height,depth}=site,corner=site.role==='corner',featureIndex=site.index-100;
  const front=depth/2,facade=front+.18,rear=-.45-depth/2,recess=facade-1.05;
  const ground=FEATURE_GROUND_TOP,leafTop=height-.18,leafBack=facade-.63;

  // Solid mass behind the arcade, then a storey above that oversails the recess.
  add(wall,0,ground/2,(recess+rear)/2,width,ground,recess-rear,.88);
  add(wall,0,(height+ground)/2,-.45,width,height-ground,depth);
  for(const x of [-width*.27,width*.27]){
    const back=rear-.035;
    add('glass',x,2.25,back,2,1.6,.06);
    for(const edge of [-1.06,1.06])add('timber',x+edge,2.25,back-.05,.12,1.84,.12);
    for(const y of [1.39,3.11])add('trim',x,y,back-.065,2.24,.12,.2,.93);
    add('timber',x,2.25,back-.055,.075,1.6,.1);
  }

  const bays=corner?3:2+(featureIndex%2),pierWidth=corner?.95:.8;
  const pitch=(width-pierWidth)/bays,bayWidth=pitch-pierWidth;
  const pierX=(bay:number)=>-width/2+pierWidth/2+bay*pitch;
  const bayCentre=(bay:number)=>pierX(bay)+pitch/2;
  const doorBay=featureIndex%bays;
  // One vertical rhythm from pavement to parapet. Stone reads as a lighter
  // neutral scalar on the same plaster, so no material is added.
  for(let bay=0;bay<=bays;bay++){
    add('plaster',pierX(bay),ground/2,facade-.72,pierWidth,ground,1.44,1.05);
    add('plaster',pierX(bay),(ground+leafTop)/2,facade-.315,pierWidth*.7,leafTop-ground,.63,1.05);
  }
  for(let bay=0;bay<bays;bay++){
    const centre=bayCentre(bay),door=bay===doorBay,mullions=bayWidth>5?2:1;
    if(door){
      const segment=(bayWidth+.2-1.3)/2;
      for(const side of [-1,1])add('plaster',centre+side*(1.3+segment)/2,.31,facade-.55,segment,.62,1.34,1.02);
      add('timber',centre,1.12,recess+.16,1.3,2.24,.12,.9);
      add('glass',centre,2.98,recess+.14,bayWidth-.24,.95,.1);
    } else {
      add('plaster',centre,.31,facade-.55,bayWidth+.2,.62,1.34,1.02);
      add('glass',centre,2.05,recess+.14,bayWidth-.24,2.6,.1);
    }
    // Seat the lintel over the pier with a 25 mm proud top. Equal top planes
    // overlap outside the upper wall and flicker across the two materials.
    add('timber',centre,ground-.205,facade-.36,bayWidth+.3,.46,.9);
    // The storey above oversails the recess. Without a shaded soffit the
    // underside reads as another bright band over a dark opening.
    // Spans between the piers rather than lapping over them. At bayWidth+.1 it
    // ran .05 m onto each pier with both tops on the same plaster plane at 3.6.
    add('plaster',centre,ground-.09,facade-.82,bayWidth-.02,.18,.46,.86);
    for(let mullion=1;mullion<=mullions;mullion++)add('timber',centre-bayWidth/2+mullion*bayWidth/(mullions+1),2.05,recess+.24,.12,2.7,.16);
  }

  // Upper leaf: sill and head bands leave a genuine void in front of the wall.
  const voidBottom=4.15,voidTop=Math.min(leafTop-.62,voidBottom+2.15);
  for(let bay=0;bay<bays;bay++){
    const centre=bayCentre(bay),windows=bayWidth>5?2:1,span=bayWidth/windows;
    add('trim',centre,4,facade-.28,bayWidth+.36,.3,.7,.93);
    add('plaster',centre,voidTop+.31,facade-.315,bayWidth+.2,.62,.63);
    if(leafTop-voidTop-.62>.12)add('plaster',centre,(voidTop+.62+leafTop)/2,facade-.315,bayWidth+.2,leafTop-voidTop-.62,.63);
    for(let window=0;window<windows;window++)add('glass',centre-bayWidth/2+span*(window+.5),(voidBottom+voidTop)/2,leafBack+.05,span-.6,voidTop-voidBottom-.1,.1);
  }

  add('roof',0,height+.1,0,width+1.1,.22,depth+3.2);
  // One cornice per plot, sized by its crown, so the front cap and the side
  // returns below share a single top plane per building rather than a street-long
  // horizontal at one height.
  const crown=featuredMassing(featureIndex,corner).crown;
  const capH=corner?.74:crown==='parapet'?.42:.34,capY=height+(corner?.5:crown==='parapet'?.34:.3);
  add('trim',0,capY,front+.05,width+.45,capH,.5,.93);
  if(corner){
    add('plaster',0,height+1.1,front-.6,width*.6,1,depth*.46,1.02);
    add('trim',0,height+1.72,front-.6,width*.64,.24,depth*.46+.08,.93);
  } else if(crown==='stepped'){
    // A genuine setback: the top storey stands well back from the facade, so the
    // plot shows a shoulder and a shadowed reveal instead of one flat top edge.
    const atticDepth=depth*.62,atticHeight=2.3,atticWidth=width-2.6,atticZ=front-1.35-atticDepth/2;
    const base=height+.06,atticFront=atticZ+atticDepth/2,bandZ=atticFront-.35;
    // A real opening, not a pane behind a wall: the solid core stops .7 m back,
    // jambs and the head and sill bands stand at the attic face, and the glass
    // sits in the void between them with a 22 cm reveal.
    const voidBottom=base+.4,voidTop=base+atticHeight-.45,voidHeight=voidTop-voidBottom;
    add('plaster',0,base+atticHeight/2,atticZ-.35,atticWidth,atticHeight,atticDepth-.7,1.02);
    add('plaster',0,base+.2,bandZ,atticWidth,.4,.7,1.02);
    add('plaster',0,voidTop+.225,bandZ,atticWidth,.45,.7,1.02);
    for(const side of [-1,1])add('plaster',side*(atticWidth/2-.55),voidBottom+voidHeight/2,bandZ,1.1,voidHeight,.7,1.05);
    add('trim',0,height+atticHeight+.19,atticZ,atticWidth+.34,.26,atticDepth+.08,.93);
    add('glass',0,voidBottom+voidHeight/2,atticFront-.27,atticWidth-2.2,voidHeight-.1,.1);
  } else if(crown==='gable'){
    // A real gable end facing the street, its ridge above the neighbouring
    // parapets, so the roofline has a break in it.
    add('pitched',0,height+.2,0,width+1.04,2.35+(featureIndex%2)*.3,depth+3.14);
    add('plaster',0,height+.62,front-.55,width*.5,.9,.5,.96);
  } else {
    // Stepped parapet: two diminishing courses over the cornice.
    add('plaster',0,height+.95,front-.28,width*.86,.8,.7,1.02);
    add('plaster',0,height+1.5,front-.3,width*.52,.42,.66,1);
  }
  // Every plot shows a side face where the plan line steps. A pilaster return
  // plus its capping band gives that face an edge and a shadow of its own.
  for(const side of [-1,1]){
    add('plaster',side*(width/2+.08),(ground+leafTop)/2,front-1.9,.5,leafTop-ground,2.4,1.05);
    // The return stops 2 cm short of the front cap's rear edge at front-.20.
    // Running them into each other put two same-material caps on one top plane
    // over a .355 by .10 m patch, which is a depth fight, not a mitre.
    add('trim',side*(width/2+.1),capY,front-1.66,.46,capH,2.88,.93);
  }
  if(site.index%4===0)add('plaster',width*.25,height+1.6,-2,.7,2,.8);

  // The awning steps per site instead of holding one straight line the length of
  // the street, and its top stays under the upper sill band at 3.85 rather than
  // cutting across it. Posts and beam land on the underside they carry: the old
  // fixed heights left the posts topping out 7 cm below the slab.
  const awningDepth=2+(featureIndex%3)*.28+(corner?.36:0);
  const awningY=corner?3.74:3.18+(featureIndex%3)*.26,under=awningY-.08;
  const awningZ=front+.9+awningDepth/2,postZ=front+.9+awningDepth-.08;
  add('roof',0,awningY,awningZ,width+.4,.16,awningDepth);
  for(const x of [-width/2+.7,width/2-.7])add('timber',x,under/2,postZ,.16,under,.16);
  add('timber',0,under-.135,postZ,width-.8,.27,.17);
  add('pavement',0,-.015,front+1.2,width+1,.19,site.pavementDepth);
  return parts;
}

export function townBuildingParts(site:TownBuildingSite):TownBuildingPart[] {
  if(site.visualSlice==='first-street')return featuredBuildingParts(site);
  const parts:TownBuildingPart[]=[],wall=wallKind(site);
  const {width,height,depth}=site,front=depth/2,wallRearFace=-.45-depth/2;
  const add=(kind:TownPartKind,x:number,y:number,z:number,w:number,h:number,d:number)=>parts.push({kind,x,y,z,w,h,d});
  add(wall,0,height/2,-.45,width,height,depth);
  for(const x of [-width*.27,width*.27]){
    const back=wallRearFace-.035;
    add('glass',x,2.25,back,2,1.6,.06);
    for(const edge of [-1.06,1.06])add('timber',x+edge,2.25,back-.05,.12,1.84,.12);
    for(const y of [1.39,3.11])add('trim',x,y,back-.065,2.24,.12,.2);
    add('timber',x,2.25,back-.055,.075,1.6,.1);
  }
  for(const x of [-width/2+.55,width/2-.55])add(wall,x,(height-.5)/2,front,1.1,height-1.7,2);
  add(wall,0,height-.55,front,width,1.1,2);
  add(wall,0,.3,front,width,.6,2);
  add('roof',0,.13,front+.3,width,.25,1.5);
  add('roof',0,height+.1,0,width+1.1,.22,depth+3.2);
  if(site.index%3!==1)add('pitched',0,height+.22,0,width+1.04,2.3,depth+3.14);
  else add('timber',0,height+.38,-.2,width,.5,10);
  if(site.index%4===0)add('plaster',width*.25,height+1.6,-2,.7,2,.8);
  add('glass',-1.5,2.15,front+.4,width-5,2.8,.08);
  add('glass',width/2-2,1.6,front+.4,1.5,3,.08);
  add('trim',-1.5,.68,front+.8,width-4.6,.17,.65);
  add('timber',-1.5,3.62,front+.8,width-4.6,.18,.65);
  for(let x=-width/2+1.2;x<width/2-2.5;x+=2.2)add('timber',x,2.15,front+.78,.1,2.95,.2);
  for(const x of [width/2-2.85,width/2-1.15])add('trim',x,1.65,front+.76,.13,3.3,.3);
  add('trim',width/2-1.55,1.5,front+.9,.055,.45,.08);
  add('roof',0,3.85,front+2.1,width+.4,.16,3.2);
  for(const x of [-width/2+.7,width/2-.7])add('timber',x,1.85,front+3.1,.16,3.7,.16);
  add('timber',0,3.58,front+3.1,width-.8,.27,.17);
  add('pavement',0,-.015,front+1.2,width+2,.19,site.pavementDepth);
  return parts;
}

export function townSiteFootprint(site:TownBuildingSite) {
  const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
  for(const part of townBuildingParts(site)){
    bounds.minX=Math.min(bounds.minX,part.x-part.w/2);
    bounds.maxX=Math.max(bounds.maxX,part.x+part.w/2);
    bounds.minZ=Math.min(bounds.minZ,part.z-part.d/2);
    bounds.maxZ=Math.max(bounds.maxZ,part.z+part.d/2);
  }
  return bounds;
}

export function townBuildingSites(){
  const accessSamples=scenicAccess.filter(access=>access.id!=='lake').flatMap(access=>{
    const points:Vector3[]=[];
    for(let distance=0;distance<=access.road.length;distance+=2)points.push(access.road.frame(distance).point);
    points.push(access.road.frame(access.road.length).point);
    return points;
  });
  const sites:TownBuildingSite[]=[];
  const ordinaryStart=TOWN_START*journeyRoad.length,ordinaryEnd=TOWN_END*journeyRoad.length;
  const featuredSamples=featuredDistances(FEATURE_STREET_START,FEATURE_STREET_END);
  const distances=[
    ...Array.from({length:Math.ceil((ordinaryEnd-ordinaryStart)/27)},(_,i)=>ordinaryStart+i*27).filter(distance=>distance<ordinaryEnd),
    ...featuredSamples,
  ].sort((a,b)=>a-b);
  for(const distance of distances){
    for(const side of [-1,1]){
      const featuredSample=featuredSamples.includes(distance);
      if(side===FEATURE_STREET_SIDE&&distance>FEATURE_STREET_START-18&&distance<FEATURE_STREET_END+18&&!featuredSample)continue;
      if(side!==FEATURE_STREET_SIDE&&featuredSample)continue;
      const slice=featuredDistance(distance,side)&&featuredSample;
      const featureIndex=slice?Math.round((distance-FEATURE_STREET_START)/FEATURE_STREET_SPACING):0;
      const index=slice?100+featureIndex:Math.round(distance/27);
      const corner=slice&&Math.abs(distance-325)<10;
      // Two usable storeys: the ground arcade tops out at 3.6 m, so the featured
      // run needs enough above it to carry a punched upper window. Featured plots
      // take their whole massing from the composition table.
      const massing=slice?featuredMassing(featureIndex,corner):undefined;
      const width=massing?massing.width:13+(index%2)*3;
      const height=massing?massing.height:4.8+(index%3)*.7;
      const depth=massing?massing.depth:8;
      const setback=massing?massing.setback:20.2;
      const pavementDepth=slice?2.4:6;
      const road=journeyRoad.frame(distance,side*setback),yaw=road.yaw-side*Math.PI/2;
      const cosine=Math.cos(yaw),sine=Math.sin(yaw);
      const bounds=townSiteFootprint({distance,side,index,width,height,depth,setback,pavementDepth,point:road.point,yaw,visualSlice:slice?'first-street':undefined,role:corner?'corner':slice?'shop':undefined});
      // Include the emitted footprint, with one metre of road clearance plus
      // one metre to cover gaps between the two-metre centreline samples.
      const blocked=accessSamples.some(point=>{
        const dx=point.x-road.point.x,dz=point.z-road.point.z;
        const x=cosine*dx-sine*dz,z=sine*dx+cosine*dz;
        const alongX=Math.max(0,bounds.minX-x,x-bounds.maxX);
        const alongZ=Math.max(0,bounds.minZ-z,z-bounds.maxZ);
        return Math.hypot(alongX,alongZ)<2.8+2;
      });
      if(!blocked)sites.push({distance,side,index,width,height,depth,setback,pavementDepth,point:road.point,yaw,visualSlice:slice?'first-street':undefined,role:corner?'corner':slice?'shop':undefined});
    }
  }
  return sites;
}
