import * as THREE from 'three';
import {beforeEach,expect,it,vi} from 'vitest';
import {SceneResources} from './scene-resources';
import {createTownPalette,createTownStreet} from './town-world';
import {townBuildingParts,townBuildingSites,townSiteFootprint,type TownBuildingSite} from './town-layout';

beforeEach(()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({
    fillRect:vi.fn(),strokeRect:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),bezierCurveTo:vi.fn(),stroke:vi.fn(),
    set fillStyle(_value:string){},set strokeStyle(_value:string){},set lineWidth(_value:number){},
  } as unknown as CanvasRenderingContext2D);
});

function emittedBoxes(street:THREE.Group,site:TownBuildingSite) {
  const inverse=new THREE.Matrix4().makeRotationY(site.yaw);inverse.setPosition(site.point);inverse.invert();
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const boxes:{name:string;position:THREE.Vector3;scale:THREE.Vector3}[]=[];
  for(const child of street.children){
    if(!(child instanceof THREE.InstancedMesh))continue;
    for(let index=0;index<child.count;index++){
      child.getMatrixAt(index,matrix);
      matrix.decompose(position,rotation,scale);
      const local=position.clone().applyMatrix4(inverse);
      if(Math.abs(local.x)<=site.width/2+2&&local.z>=-site.depth/2-2&&local.z<=site.depth/2+4.6&&local.y>=-.2&&local.y<=site.height+3){
        boxes.push({name:child.name,position:local,scale:scale.clone()});
      }
    }
  }
  return boxes;
}

function localBounds(boxes:{position:THREE.Vector3;scale:THREE.Vector3}[]) {
  const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
  for(const box of boxes){
    min.min(new THREE.Vector3(box.position.x-box.scale.x/2,box.position.y-box.scale.y/2,box.position.z-box.scale.z/2));
    max.max(new THREE.Vector3(box.position.x+box.scale.x/2,box.position.y+box.scale.y/2,box.position.z+box.scale.z/2));
  }
  return new THREE.Box3(min,max);
}

function horizontalRect(site:TownBuildingSite,width:number,depth:number,z:number) {
  const corners=[
    new THREE.Vector3(-width/2,0,z-depth/2),
    new THREE.Vector3(width/2,0,z-depth/2),
    new THREE.Vector3(width/2,0,z+depth/2),
    new THREE.Vector3(-width/2,0,z+depth/2),
  ];
  const matrix=new THREE.Matrix4().makeRotationY(site.yaw);matrix.setPosition(site.point);
  return corners.map(corner=>corner.applyMatrix4(matrix));
}

function overlaps(a:THREE.Vector3[],b:THREE.Vector3[]) {
  const axes=[...a,...b].map((point,index,array)=>{
    const next=array[index%4===3?index-3:index+1];
    const edge=next.clone().sub(point);
    return new THREE.Vector3(-edge.z,0,edge.x).normalize();
  }).filter(axis=>Number.isFinite(axis.x)&&Number.isFinite(axis.z));
  return axes.every(axis=>{
    const project=(points:THREE.Vector3[])=>points.map(point=>point.dot(axis));
    const ap=project(a),bp=project(b);
    return Math.max(...ap)>Math.min(...bp)&&Math.max(...bp)>Math.min(...ap);
  });
}

it('keeps the town street in the seven shared instanced batches',()=>{
  const street=createTownStreet(createTownPalette());
  expect(street.children).toHaveLength(7);
  expect(street.children.every(child=>child instanceof THREE.InstancedMesh)).toBe(true);
  const materialSet=new Set(street.children.map(child=>(child as THREE.InstancedMesh).material));
  expect(materialSet.size).toBe(6);
  expect(street.children.every(child=>(child as THREE.InstancedMesh).instanceColor)).toBe(true);
});

it('holds the town instance budget inside the seven shared batches',()=>{
  const street=createTownStreet(createTownPalette());
  const counts=street.children.map(child=>({name:child.name,count:(child as THREE.InstancedMesh).count}));
  const total=counts.reduce((sum,entry)=>sum+entry.count,0);
  console.log('town instance budget',JSON.stringify({total,counts}));
  const featuredParts=townBuildingSites().filter(site=>site.visualSlice==='first-street')
    .reduce((sum,site)=>sum+townBuildingParts(site).length,0);
  console.log('featured emitted parts',featuredParts);
  expect(total).toBeLessThanOrEqual(3200);
  expect(featuredParts).toBeLessThanOrEqual(520);
});

it('drives featured recess shading through the instance colour buffer',()=>{
  const street=createTownStreet(createTownPalette());
  const plaster=street.children.find(child=>child.name==='Town plaster') as THREE.InstancedMesh;
  const site=townBuildingSites().find(site=>site.visualSlice==='first-street')!;
  const boxes=emittedBoxes(street,site).filter(box=>box.name==='Town plaster');
  expect(boxes.length).toBeGreaterThan(6);
  const values:number[]=[];
  const colour=new THREE.Color();
  for(let index=0;index<plaster.instanceColor!.count;index++){
    colour.fromBufferAttribute(plaster.instanceColor!,index);
    values.push(colour.r);
  }
  expect(Math.min(...values)).toBeLessThan(.95);
  expect(Math.max(...values)).toBeGreaterThan(1.02);
});

it('uses neutral instance multipliers so material palettes are not squared',()=>{
  const street=createTownStreet(createTownPalette());
  for(const child of street.children){
    const mesh=child as THREE.InstancedMesh;
    const colors=mesh.instanceColor!;
    for(let index=0;index<colors.count;index++){
      const colour=new THREE.Color().fromBufferAttribute(colors,index);
      expect(Math.min(colour.r,colour.g,colour.b)).toBeGreaterThanOrEqual(.82);
      expect(Math.max(colour.r,colour.g,colour.b)).toBeLessThanOrEqual(1.16);
    }
  }
});

it('keeps rear glazing attached to the actual rear wall face',()=>{
  const street=createTownStreet(createTownPalette());
  const glass=street.children.find(child=>child.name==='Town glass') as THREE.InstancedMesh;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const rearWindows:{position:THREE.Vector3;scale:THREE.Vector3}[]=[];
  for(let index=0;index<glass.count;index++){
    glass.getMatrixAt(index,matrix);
    matrix.decompose(position,rotation,scale);
    if(Math.abs(scale.x-2)<.02&&Math.abs(scale.y-1.6)<.02&&Math.abs(scale.z-.06)<.02)rearWindows.push({position:position.clone(),scale:scale.clone()});
  }
  const detached:number[]=[];
  let attachedCandidates=0;
  for(const site of townBuildingSites().slice(0,8)){
    const inverse=new THREE.Matrix4().makeRotationY(site.yaw);inverse.setPosition(site.point);inverse.invert();
    const rearFace=-site.depth/2-.45;
    for(const local of rearWindows.map(window=>window.position.clone().applyMatrix4(inverse)).filter(local=>Math.abs(local.y-2.25)<.02&&Math.abs(Math.abs(local.x)-site.width*.27)<.05)){
      attachedCandidates++;
      if(local.z<rearFace-.08)detached.push(local.z-rearFace);
    }
  }
  expect(attachedCandidates).toBeGreaterThan(0);
  expect(detached).toHaveLength(0);
});

it('keeps ordinary awnings at their original front depth while featured awnings vary',()=>{
  const street=createTownStreet(createTownPalette());
  const sites=townBuildingSites();
  const ordinary=sites.find(site=>!site.visualSlice&&site.side===1)!;
  const ordinaryAwning=emittedBoxes(street,ordinary).find(box=>box.name==='Town roof'&&Math.abs(box.position.y-3.85)<.02&&Math.abs(box.scale.y-.16)<.02&&Math.abs(box.scale.z-3.2)<.02);
  expect(ordinaryAwning?.position.z).toBeCloseTo(ordinary.depth/2+2.1,2);
  const featured=sites.filter(site=>site.visualSlice==='first-street');
  // Found by geometry, not by a pinned height: a facade awning is the thin roof
  // slab standing clear in front of the frontage. Featured awnings step per site,
  // so keying this on one y would pin the street to a single straight line.
  const featuredAwningDepths=featured.map(site=>emittedBoxes(street,site).find(box=>box.name==='Town roof'&&box.position.z-box.scale.z/2>site.depth/2&&Math.abs(box.scale.y-.16)<.02)!.scale.z);
  expect(new Set(featuredAwningDepths.map(depth=>depth.toFixed(2))).size).toBeGreaterThan(1);
});

it('contains every emitted per-site part inside the shared footprint bounds',()=>{
  const street=createTownStreet(createTownPalette());
  const sites=townBuildingSites().filter(site=>!site.visualSlice).slice(0,8);
  let checked=0;
  for(const site of sites){
    const boxes=emittedBoxes(street,site);
    const bounds=localBounds(boxes);
    const footprint=townSiteFootprint(site);
    expect(boxes.length).toBeGreaterThan(0);
    expect(bounds.min.x).toBeGreaterThanOrEqual(footprint.minX-.01);
    expect(bounds.max.x).toBeLessThanOrEqual(footprint.maxX+.01);
    expect(bounds.min.z).toBeGreaterThanOrEqual(footprint.minZ-.01);
    expect(bounds.max.z).toBeLessThanOrEqual(footprint.maxZ+.01);
    checked++;
  }
  expect(checked).toBeGreaterThan(0);
});

it('keeps generated featured pavement instances from overlapping',()=>{
  const street=createTownStreet(createTownPalette());
  const pavement=street.children.find(child=>child.name==='Town pavement') as THREE.InstancedMesh;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const slabs:{site:TownBuildingSite;rect:THREE.Vector3[]}[]=[];
  for(const site of townBuildingSites().filter(site=>site.visualSlice==='first-street')){
    const inverse=new THREE.Matrix4().makeRotationY(site.yaw);inverse.setPosition(site.point);inverse.invert();
    for(let index=0;index<pavement.count;index++){
      pavement.getMatrixAt(index,matrix);
      matrix.decompose(position,rotation,scale);
      const local=position.clone().applyMatrix4(inverse);
      if(Math.abs(local.y+.015)<.02&&Math.abs(local.z-(site.depth/2+1.2))<.02&&Math.abs(scale.z-site.pavementDepth)<.02){
        slabs.push({site,rect:horizontalRect(site,scale.x,scale.z,local.z)});
      }
    }
  }
  expect(slabs.length).toBeGreaterThan(0);
  for(let i=1;i<slabs.length;i++)expect(overlaps(slabs[i-1].rect,slabs[i].rect)).toBe(false);
});

it('disposes town street geometries, materials, textures and instanced buffers once',()=>{
  const street=createTownStreet(createTownPalette());
  const resources=new SceneResources();
  const disposeSpies:ReturnType<typeof vi.spyOn>[]=[];
  street.traverse(object=>{
    if(object instanceof THREE.InstancedMesh){
      disposeSpies.push(vi.spyOn(object,'dispose'));
      disposeSpies.push(vi.spyOn(object.geometry,'dispose'));
      const materials=Array.isArray(object.material)?object.material:[object.material];
      for(const material of materials){
        disposeSpies.push(vi.spyOn(material,'dispose'));
        for(const value of Object.values(material))if(value instanceof THREE.Texture)disposeSpies.push(vi.spyOn(value,'dispose'));
      }
    }
  });
  resources.object(street);
  resources.dispose();
  resources.dispose();
  for(const spy of disposeSpies)expect(spy).toHaveBeenCalledOnce();
});
