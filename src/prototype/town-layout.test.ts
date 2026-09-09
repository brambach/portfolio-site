import {Box3,Matrix4,Vector3} from 'three';
import {expect,it} from 'vitest';
import {FEATURE_STREET_END,FEATURE_STREET_SIDE,FEATURE_STREET_START,townBuildingParts,townBuildingSites,townSiteFootprint,type TownBuildingPart,type TownBuildingSite} from './town-layout';
import {scenicAccess,scenicRoad} from './scenic-route';
import {stopDistance} from './journey-route';

function footprintFor(site:TownBuildingSite) {
  const footprint=townSiteFootprint(site);
  return new Box3(new Vector3(footprint.minX,-1,footprint.minZ),new Vector3(footprint.maxX,1,footprint.maxZ));
}
function horizontalRect(site:TownBuildingSite,width:number,depth:number,z:number) {
  const corners=[
    new Vector3(-width/2,0,z-depth/2),
    new Vector3(width/2,0,z-depth/2),
    new Vector3(width/2,0,z+depth/2),
    new Vector3(-width/2,0,z+depth/2),
  ];
  const matrix=new Matrix4().makeRotationY(site.yaw);matrix.setPosition(site.point);
  return corners.map(corner=>corner.applyMatrix4(matrix));
}
function overlaps(a:Vector3[],b:Vector3[]) {
  const axes=[...a,...b].map((point,index,array)=>{
    const next=array[index%4===3?index-3:index+1];
    const edge=next.clone().sub(point);
    return new Vector3(-edge.z,0,edge.x).normalize();
  }).filter(axis=>Number.isFinite(axis.x)&&Number.isFinite(axis.z));
  return axes.every(axis=>{
    const project=(points:Vector3[])=>points.map(point=>point.dot(axis));
    const ap=project(a),bp=project(b);
    return Math.max(...ap)>Math.min(...bp)&&Math.max(...bp)>Math.min(...ap);
  });
}

it('keeps town building and paving footprints clear of both access roads',()=>{
  let minimum=Infinity;
  for(const site of townBuildingSites()){
    const inverse=new Matrix4().makeRotationY(site.yaw);inverse.setPosition(site.point);inverse.invert();
    const footprint=footprintFor(site);
    for(const access of scenicAccess.filter(access=>access.id!=='lake')){
      for(let distance=0;distance<access.road.length;distance+=.5){
        const local=access.road.frame(distance).point.applyMatrix4(inverse);
        minimum=Math.min(minimum,footprint.distanceToPoint(local)-access.road.halfWidth);
      }
    }
  }
  expect(minimum).toBeGreaterThanOrEqual(1);
});

it('turns the first street slice into a closer continuous screen-right rhythm',()=>{
  const sites=townBuildingSites().filter(site=>site.side===FEATURE_STREET_SIDE&&site.distance>=FEATURE_STREET_START&&site.distance<=FEATURE_STREET_END);
  expect(sites.length).toBeGreaterThanOrEqual(6);
  expect(sites.every(site=>site.visualSlice==='first-street')).toBe(true);
  for(let i=1;i<sites.length;i++)expect(sites[i].distance-sites[i-1].distance).toBeLessThanOrEqual(22);
  expect(sites.some(site=>site.role==='corner')).toBe(true);
  expect(Math.min(...sites.map(site=>site.setback))).toBeLessThan(18);
  expect(new Set(sites.map(site=>site.height)).size).toBeGreaterThan(3);
  expect(new Set(sites.map(site=>site.index)).size).toBe(sites.length);
  const corner=sites.find(site=>site.role==='corner')!;
  expect(corner.height).toBe(Math.max(...sites.map(site=>site.height)));
});

it('keeps neighbouring site footprints separated across the featured slice boundaries',()=>{
  const sites=townBuildingSites().filter(site=>site.side===FEATURE_STREET_SIDE&&site.distance>=FEATURE_STREET_START-70&&site.distance<=FEATURE_STREET_END+70).sort((a,b)=>a.distance-b.distance);
  expect(sites.some(site=>site.distance<FEATURE_STREET_START)).toBe(true);
  expect(sites.some(site=>site.visualSlice==='first-street')).toBe(true);
  expect(sites.some(site=>site.distance>FEATURE_STREET_END)).toBe(true);
  const rects=sites.map(site=>{
    const footprint=townSiteFootprint(site);
    return {site,rect:horizontalRect(site,footprint.maxX-footprint.minX,footprint.maxZ-footprint.minZ,(footprint.minZ+footprint.maxZ)/2)};
  });
  for(let i=1;i<rects.length;i++)expect(overlaps(rects[i-1].rect,rects[i].rect)).toBe(false);
});

it('keeps town footprints off the paved road and shoulder',()=>{
  let minimum=Infinity;
  for(const site of townBuildingSites()){
    const road=scenicRoad.nearest(site.point.x,site.point.z);
    const footprint=townSiteFootprint(site);
    minimum=Math.min(minimum,road.away-footprint.maxZ-scenicRoad.halfWidth);
  }
  expect(minimum).toBeGreaterThanOrEqual(1);
});

function featuredSites() {
  return townBuildingSites().filter(site=>site.visualSlice==='first-street');
}
const frontFace=(part:TownBuildingPart)=>part.z+part.d/2;
const topFace=(part:TownBuildingPart)=>part.y+part.h/2;
const overlap=(a:number,aSize:number,b:number,bSize:number)=>Math.min(a+aSize/2,b+bSize/2)-Math.max(a-aSize/2,b-bSize/2);

it('cuts real recessed shopfront openings behind full-height piers',()=>{
  const sites=featuredSites();
  expect(sites.length).toBeGreaterThanOrEqual(6);
  for(const site of sites){
    const parts=townBuildingParts(site);
    const piers=parts.filter(part=>part.kind==='plaster'&&part.w<=1.3&&part.h>=3&&part.y-part.h/2<=.4&&part.y+part.h/2>=3.4);
    expect(piers.length,`ground piers at ${site.distance}m`).toBeGreaterThanOrEqual(3);
    const facade=Math.max(...piers.map(frontFace));
    const shopfront=parts.filter(part=>part.kind==='glass'&&part.w>=1&&part.y-part.h/2>=.5&&part.y+part.h/2<=4.1);
    expect(shopfront.length,`shopfront glazing at ${site.distance}m`).toBeGreaterThanOrEqual(2);
    for(const glass of shopfront)expect(facade-frontFace(glass),`reveal depth at ${site.distance}m`).toBeGreaterThanOrEqual(.7);
    const solidAcross=parts.filter(part=>(part.kind==='plaster'||part.kind==='timber')&&part.w>site.width*.6&&part.y-part.h/2<=1.4&&part.y+part.h/2>=2.6&&frontFace(part)>facade-.55);
    expect(solidAcross.map(part=>part.kind),`solid wall across the openings at ${site.distance}m`).toHaveLength(0);
  }
});

it('shades a soffit board under the oversailing storey of each featured bay',()=>{
  for(const site of featuredSites()){
    const parts=townBuildingParts(site);
    const piers=parts.filter(part=>part.kind==='plaster'&&part.w<=1.3&&part.h>=3&&part.y-part.h/2<=.4);
    const facade=Math.max(...piers.map(frontFace));
    const soffits=parts.filter(part=>(part.shade??1)<=.92&&part.h<=.3&&part.y-part.h/2>=3.2&&part.y+part.h/2<=3.75&&frontFace(part)<=facade-.2);
    expect(soffits.length,`recess soffits at ${site.distance}m`).toBeGreaterThanOrEqual(2);
    // The soffit tops out on the same plaster plane as the piers, so it has to
    // span between them rather than lap over them.
    for(const soffit of soffits)for(const pier of piers){
      if(Math.abs(topFace(soffit)-topFace(pier))>1e-4)continue;
      expect(overlap(soffit.x,soffit.w,pier.x,pier.w),`soffit over a pier at ${site.distance}m`).toBeLessThanOrEqual(0);
    }
  }
});

it('punches upper storey windows into a projecting outer leaf',()=>{
  for(const site of featuredSites()){
    const parts=townBuildingParts(site);
    const pilasters=parts.filter(part=>part.kind==='plaster'&&part.w<=1&&part.h>=.9&&part.y-part.h/2>=3.4&&part.y+part.h/2<=site.height+.2);
    expect(pilasters.length,`upper pilasters at ${site.distance}m`).toBeGreaterThanOrEqual(3);
    const leaf=Math.max(...pilasters.map(frontFace));
    const upper=parts.filter(part=>part.kind==='glass'&&part.y-part.h/2>=3.9&&frontFace(part)>0);
    expect(upper.length,`upper glazing at ${site.distance}m`).toBeGreaterThanOrEqual(2);
    for(const glass of upper)expect(leaf-frontFace(glass),`upper reveal at ${site.distance}m`).toBeGreaterThanOrEqual(.45);
  }
});

it('varies featured roof forms and gives the corner the only crown',()=>{
  const sites=featuredSites();
  const crown=(site:TownBuildingSite)=>townBuildingParts(site).filter(part=>part.y-part.h/2>=site.height-.05)
    .map(part=>`${part.kind}:${part.h.toFixed(2)}:${part.w.toFixed(2)}`).sort().join('|');
  const top=(site:TownBuildingSite)=>Math.max(...townBuildingParts(site).map(part=>part.y+part.h/2));
  expect(new Set(sites.map(crown)).size).toBeGreaterThanOrEqual(3);
  expect(sites.filter(site=>townBuildingParts(site).some(part=>part.kind==='pitched')).length).toBeLessThan(sites.length);
  const corner=sites.find(site=>site.role==='corner')!;
  for(const site of sites.filter(site=>site.role!=='corner'))expect(top(corner),`corner over ${site.distance}m`).toBeGreaterThan(top(site));
});

it('keeps featured facade faces from sitting coplanar across materials',()=>{
  let compared=0;
  for(const site of featuredSites()){
    const parts=townBuildingParts(site).filter(part=>frontFace(part)>site.depth/2-2);
    for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
      const a=parts[i],b=parts[j];
      if(a.kind===b.kind)continue;
      if(overlap(a.x,a.w,b.x,b.w)<=.05||overlap(a.y,a.h,b.y,b.h)<=.05)continue;
      compared++;
      expect(Math.abs(frontFace(a)-frontFace(b)),`${a.kind} and ${b.kind} at ${site.distance}m`).toBeGreaterThan(1e-4);
    }
  }
  expect(compared).toBeGreaterThan(0);
});

// The across-materials guard above only looks at front faces, so it cannot see two
// parts of the SAME kind sharing one horizontal plane. That is the corner parapet
// case: a front cap and its side return, identical material, identical top y,
// overlapping footprint. Depth fighting does not care about material, so this
// checks every roofline pair. Extruded pitched roofs have a ridge, not a top
// rectangle, so they are excluded.
it('keeps exposed featured roof and parapet tops off one shared plane',()=>{
  let compared=0;
  for(const site of featuredSites()){
    const parts=townBuildingParts(site).filter(part=>part.kind!=='pitched'&&topFace(part)>=site.height);
    expect(parts.length,`roofline parts at ${site.distance}m`).toBeGreaterThanOrEqual(2);
    for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
      const a=parts[i],b=parts[j];
      if(Math.abs(topFace(a)-topFace(b))>1e-4)continue;
      compared++;
      const shared=Math.min(overlap(a.x,a.w,b.x,b.w),overlap(a.z,a.d,b.z,b.d));
      expect(shared,`${a.kind} and ${b.kind} tops at ${topFace(a).toFixed(2)}m on ${site.distance}m`).toBeLessThanOrEqual(0);
    }
  }
  expect(compared).toBeGreaterThan(0);
});

// The featured run should not read as one straight horizontal held at a single
// height the length of the street. Awnings step per site, they sit under the
// upper sill band rather than cutting across it, and the posts and beam land on
// the underside they actually carry instead of floating below it.
it('steps featured awnings and lands their supports on the actual underside',()=>{
  const undersides:number[]=[];
  for(const site of featuredSites()){
    const parts=townBuildingParts(site),front=site.depth/2;
    const canopies=parts.filter(part=>part.kind==='roof'&&part.z-part.d/2>front);
    expect(canopies.length,`facade awning at ${site.distance}m`).toBe(1);
    const canopy=canopies[0],under=canopy.y-canopy.h/2;
    undersides.push(under);
    expect(under,`awning headroom at ${site.distance}m`).toBeGreaterThanOrEqual(2.6);
    const sills=parts.filter(part=>part.kind==='trim'&&part.y>3.5&&part.y<site.height&&part.d>=.5);
    expect(sills.length,`upper sill bands at ${site.distance}m`).toBeGreaterThan(0);
    expect(topFace(canopy),`awning below the upper sills at ${site.distance}m`)
      .toBeLessThanOrEqual(Math.min(...sills.map(part=>part.y-part.h/2))+1e-6);
    const supports=parts.filter(part=>part.kind==='timber'&&part.z>front&&overlap(part.z,part.d,canopy.z,canopy.d)>0);
    expect(supports.length,`awning supports at ${site.distance}m`).toBeGreaterThanOrEqual(3);
    for(const support of supports)expect(topFace(support),`support meets the awning at ${site.distance}m`).toBeCloseTo(under,3);
    const posts=supports.filter(part=>part.w<=.3);
    expect(posts.length,`awning posts at ${site.distance}m`).toBeGreaterThanOrEqual(2);
    for(const post of posts)expect(post.y-post.h/2,`post foot at ${site.distance}m`).toBeLessThanOrEqual(.05);
  }
  expect(new Set(undersides.map(value=>value.toFixed(2))).size,'stepped awning heights').toBeGreaterThanOrEqual(3);
});

it('separates exposed arcade lintel tops from their supporting pier tops',()=>{
  let joints=0;
  for(const site of featuredSites()){
    const parts=townBuildingParts(site);
    const piers=parts.filter(part=>part.kind==='plaster'&&part.w<=1.3&&part.h>=3&&part.y-part.h/2<=.4);
    const lintels=parts.filter(part=>part.kind==='timber'&&part.w>2&&part.h>.3&&part.h<.6&&part.y>3&&part.z<site.depth/2+.9);
    expect(lintels.length).toBeGreaterThanOrEqual(2);
    for(const pier of piers)for(const lintel of lintels){
      if(overlap(pier.x,pier.w,lintel.x,lintel.w)<=0||overlap(pier.z,pier.d,lintel.z,lintel.d)<=0)continue;
      joints++;
      expect(Math.abs(pier.y+pier.h/2-lintel.y-lintel.h/2),`exposed arcade head at ${site.distance}m`).toBeGreaterThan(.01);
    }
  }
  expect(joints).toBeGreaterThan(0);
});

// The light-only passes left one repeated mass: near-equal heights, one plan
// line and one roof depth for the whole run. These check the composition itself.
it('steps the featured frontage in plan and in height',()=>{
  const sites=featuredSites();
  const setbacks=sites.map(site=>site.setback),heights=sites.map(site=>site.height);
  expect(new Set(setbacks.map(value=>value.toFixed(2))).size,'distinct plan lines').toBeGreaterThanOrEqual(4);
  expect(Math.max(...setbacks)-Math.min(...setbacks),'plan jog range').toBeGreaterThanOrEqual(2.5);
  expect(new Set(heights.map(value=>value.toFixed(2))).size,'distinct eaves heights').toBeGreaterThanOrEqual(5);
  expect(Math.max(...heights)-Math.min(...heights),'eaves height range').toBeGreaterThanOrEqual(3);
  const tops=sites.map(site=>Math.max(...townBuildingParts(site).map(topFace)));
  expect(new Set(tops.map(value=>value.toFixed(2))).size,'distinct silhouette tops').toBeGreaterThanOrEqual(5);
  expect(Math.max(...tops)-Math.min(...tops),'silhouette range').toBeGreaterThanOrEqual(3);
});

it('sets back a recessed upper volume on part of the featured run',()=>{
  const stepped=featuredSites().filter(site=>{
    const parts=townBuildingParts(site),facade=Math.max(...parts.filter(part=>part.kind==='plaster').map(frontFace));
    return parts.some(part=>part.kind==='plaster'&&part.y-part.h/2>=site.height-.06&&part.h>=1.2
      &&part.w>=site.width*.5&&frontFace(part)<=facade-1.2);
  });
  expect(stepped.length,'set-back upper volumes').toBeGreaterThanOrEqual(2);
  expect(stepped.length,'not every building steps back').toBeLessThan(featuredSites().length);
});

// Glazing set behind a solid face is not glazing. The attic opening has to be a
// real void: jambs either side, bands over and under, nothing solid in front.
it('opens the set-back attic storey instead of burying glass behind its face',()=>{
  let checked=0;
  for(const site of featuredSites()){
    const parts=townBuildingParts(site);
    const glazing=parts.filter(part=>part.kind==='glass'&&part.y-part.h/2>=site.height);
    if(!glazing.length)continue;
    checked++;
    for(const glass of glazing){
      const solids=parts.filter(part=>part.kind!=='glass'&&part.kind!=='pitched'
        &&overlap(part.x,part.w,glass.x,glass.w)>.05&&overlap(part.y,part.h,glass.y,glass.h)>.05);
      for(const solid of solids)expect(frontFace(solid),`solid in front of the attic opening at ${site.distance}m`).toBeLessThanOrEqual(frontFace(glass));
      const jambs=parts.filter(part=>part.kind==='plaster'&&overlap(part.y,part.h,glass.y,glass.h)>.05&&frontFace(part)>frontFace(glass));
      expect(jambs.filter(part=>part.x<glass.x).length,`left jamb at ${site.distance}m`).toBeGreaterThanOrEqual(1);
      expect(jambs.filter(part=>part.x>glass.x).length,`right jamb at ${site.distance}m`).toBeGreaterThanOrEqual(1);
    }
  }
  expect(checked,'attic openings checked').toBeGreaterThanOrEqual(2);
});

it('expresses the exposed side faces of every featured building',()=>{
  for(const site of featuredSites()){
    const parts=townBuildingParts(site);
    for(const side of [-1,1]){
      const onSide=parts.filter(part=>Math.sign(part.x)===side&&Math.abs(part.x)+part.w/2>site.width/2+.02);
      expect(onSide.length,`side ${side} articulation at ${site.distance}m`).toBeGreaterThanOrEqual(2);
      expect(onSide.some(part=>part.h>=1.5),`side ${side} return at ${site.distance}m`).toBe(true);
      expect(onSide.some(part=>topFace(part)>=site.height),`side ${side} cap at ${site.distance}m`).toBe(true);
    }
  }
});

it('retains buildings in usable spaces around each town stop',()=>{
  const sites=townBuildingSites();
  for(const stop of ['cafe','tennis'] as const){
    expect(sites.some(site=>site.side===1&&Math.abs(site.distance-stopDistance(stop))<70)).toBe(true);
  }
});
