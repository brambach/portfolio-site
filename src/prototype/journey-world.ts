import {createTownStreet,createTownPalette} from './town-world';
import * as THREE from 'three';
import {loadingBatches} from './loading-batches';
import {terrainSurfaceHeight} from './terrain-surface';
import {scenicTreePlacements} from './scenic-trees';
import {SCENIC_START_FRACTION} from './experience-mode';
import {scenicRoad,scenicAccess} from './scenic-route';
import {createTreeCanopy,type CanopyTree} from './tree-canopy';
import {createRoadsideGrass} from './roadside-grass';
import {createRoadsideFerns} from './roadside-ferns';
import {colourTerrain,addScenicRocks,blendShoreMaterial} from './landscape-detail';
import {refineLakeShore} from './shore-mesh';
import {createCoffeeCup} from './coffee-cup';
import {stopLocalPoint,landHeight,trailPoint,trailSamples,nearTrail,lakeFrame,scenicLakeFrame,LAKE_LEVEL} from './journey-land';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createCityWorld} from './city-world';
import {journeyRoad,JOURNEY_STOPS,journeyAccess,nearAccess,STOP_OFFSET,stopDistance} from './journey-route';
import type {SceneResources} from './scene-resources';

export async function createJourneyWorld(scene:THREE.Scene,resources:SceneResources,renderer:THREE.WebGLRenderer,signal:AbortSignal,scenic=false,stage:((name:string)=>void)=()=>{}) {
  const road=scenic?scenicRoad:journeyRoad,accessRoads=scenic?scenicAccess:journeyAccess;
  const heightAt=(x:number,z:number)=>landHeight(x,z,scenic);
  const lake=scenic?scenicLakeFrame:lakeFrame;
  const [world,tree,fern]=await Promise.all([
    createCityWorld(scene,resources,road,true,scenic),
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/journey/fir-canopy.glb').then(asset=>{resources.object(asset.scene);resources.assertActive();return asset;}),
    scenic?new GLTFLoader().loadAsync('/models/forest/fern_02/fern_02.gltf').then(asset=>{resources.object(asset.scene);resources.assertActive();return asset;}):Promise.resolve(null),
  ]);
  resources.assertActive();
  const afternoonFog=new THREE.Color('#93a6ad'),eveningFog=new THREE.Color('#596872');
  const journeyFog=new THREE.FogExp2(scenic?afternoonFog:'#626c6b',.0042);
  scene.fog=journeyFog;
  const {group}=world;
  const textureLoader=new THREE.TextureLoader();
  const [groundTexture,groundNormal]=await Promise.all([
    textureLoader.loadAsync('/models/forest/ground.jpg').then(texture=>resources.track(texture)),
    scenic?textureLoader.loadAsync('/models/forest/ground-normal.jpg').then(texture=>resources.track(texture)):Promise.resolve(null),
  ]);resources.assertActive();
  groundTexture.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [groundTexture,groundNormal])if(texture){
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(scenic?525:160,scenic?462.5:140);
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  }
  stage('terrain-started');
  let terrainGeometry:THREE.BufferGeometry=new THREE.PlaneGeometry(2100,1850,210,185).rotateX(-Math.PI/2).translate(-480,0,410);
  const coarseVertices=terrainGeometry.getAttribute('position');
  try{
    await loadingBatches(Array.from({length:186},(_,row)=>row),row=>{
      resources.assertActive();
      for(let i=row*211;i<(row+1)*211;i++)coarseVertices.setY(i,heightAt(coarseVertices.getX(i),coarseVertices.getZ(i)));
    },signal);
    resources.assertActive();
  }catch(error){terrainGeometry.dispose();throw error;}
  if(scenic)terrainGeometry=refineLakeShore(terrainGeometry,heightAt);
  terrainGeometry.computeVertexNormals();const vertices=terrainGeometry.getAttribute('position');
  stage('terrain-shaped');
  if(scenic)colourTerrain(terrainGeometry);
  else{
    const terrainColours=new Float32Array(vertices.count*3),soil=new THREE.Color(),grass=new THREE.Color('#a5af83');
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),z=vertices.getZ(i),patch=.5+.25*Math.sin(x*.047+z*.029)+.25*Math.cos(x*.013-z*.039);
      soil.set('#7d755f').lerp(grass,patch);
      terrainColours[i*3]=soil.r;terrainColours[i*3+1]=soil.g;terrainColours[i*3+2]=soil.b;
    }
    terrainGeometry.setAttribute('color',new THREE.BufferAttribute(terrainColours,3));
  }
  const terrainMaterial=new THREE.MeshStandardMaterial({map:groundTexture,normalMap:groundNormal,normalScale:new THREE.Vector2(.45,.45),vertexColors:true,roughness:1});
  if(scenic)blendShoreMaterial(terrainMaterial);
  const terrain=new THREE.Mesh(terrainGeometry,terrainMaterial);terrain.receiveShadow=true;group.add(terrain);
  const surfaceHeight=scenic?terrainSurfaceHeight(terrainGeometry,heightAt):heightAt;
  stage('terrain-ready');
  if(scenic)addScenicRocks(group,surfaceHeight);
  stage('rocks-ready');
  const trailVertices:number[]=[],trailIndices:number[]=[];
  for(let i=0;i<trailSamples.length;i++){
    const p=trailSamples[i],ahead=trailSamples[Math.min(i+1,trailSamples.length-1)],behind=trailSamples[Math.max(0,i-1)];
    const tangent=ahead.clone().sub(behind).normalize(),side=new THREE.Vector3(tangent.z,0,-tangent.x).normalize();
    for(const sign of [-1,1]){const edge=p.clone().addScaledVector(side,sign*.95);edge.y=landHeight(edge.x,edge.z)+.035;trailVertices.push(edge.x,edge.y,edge.z);}
    if(i<trailSamples.length-1){const a=i*2;trailIndices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.Float32BufferAttribute(trailVertices,3));trailGeometry.setIndex(trailIndices);trailGeometry.computeVertexNormals();
  const walkingPath=new THREE.Mesh(trailGeometry,new THREE.MeshStandardMaterial({color:'#8b8064',roughness:1,side:THREE.DoubleSide}));walkingPath.receiveShadow=true;if(!scenic)group.add(walkingPath);else{walkingPath.geometry.dispose();walkingPath.material.dispose();}
  const timber=new THREE.MeshStandardMaterial({color:'#655246',roughness:.86});
  const cream=new THREE.MeshStandardMaterial({color:'#c8b89b',roughness:.93});
  const dark=new THREE.MeshStandardMaterial({color:'#213336',metalness:.2,roughness:.3});
  const green=new THREE.MeshStandardMaterial({color:'#344d3f',roughness:.9});
  const townPalette=scenic?createTownPalette():null;
  const boxGeometry=new THREE.BoxGeometry();
  function box(parent:THREE.Object3D,material:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number){const mesh=new THREE.Mesh(boxGeometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function batchPlace(place:THREE.Group){
    place.updateMatrixWorld(true);
    const inverse=place.matrixWorld.clone().invert(),batches=new Map<THREE.Material,THREE.Mesh[]>();
    place.traverse(object=>{
      if(object instanceof THREE.Mesh&&object.geometry===boxGeometry&&!Array.isArray(object.material)){
        const batch=batches.get(object.material)??[];batch.push(object);batches.set(object.material,batch);
      }
    });
    for(const [material,meshes] of batches){
      const batch=new THREE.InstancedMesh(boxGeometry,material,meshes.length);
      meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,inverse.clone().multiply(mesh.matrixWorld));mesh.removeFromParent();});
      batch.castShadow=batch.receiveShadow=true;place.add(batch);
    }
  }
  function sign(parent:THREE.Object3D,title:string,subtitle:string,x:number,y:number,z:number,width=4,advance=false){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ink=canvas.getContext('2d')!;ink.fillStyle='#243c34';ink.fillRect(0,0,1024,256);ink.fillStyle='#e9dfc5';ink.textAlign='center';ink.font=advance?'96px Georgia':'52px Georgia';ink.fillText(title,512,advance?120:110);ink.font=advance?'38px sans-serif':'24px sans-serif';ink.fillText(subtitle,512,advance?194:173);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshStandardMaterial({map:texture,roughness:.8}));mesh.position.set(x,y,z);parent.add(mesh);
  }
  const accessAsphalt=new THREE.MeshStandardMaterial({map:world.asphalt,color:'#30342f',roughness:.94});
  const parkingPaint=new THREE.MeshStandardMaterial({color:'#bdbbaa',roughness:1});
  const gravelTexture=resources.track(groundTexture.clone());gravelTexture.repeat.set(2,2);gravelTexture.needsUpdate=true;
  const gravelNormal=groundNormal?resources.track(groundNormal.clone()):null;
  if(gravelNormal){gravelNormal.repeat.set(2,2);gravelNormal.needsUpdate=true;}
  const accessGravel=new THREE.MeshStandardMaterial({map:gravelTexture,normalMap:gravelNormal,normalScale:new THREE.Vector2(.45,.45),color:'#c6b99e',roughness:1});
  for(const access of accessRoads){
    
    for(const [width,y,material] of [[access.road.halfWidth+1,-.075,accessGravel],[access.road.halfWidth,-.041,accessAsphalt]] as const){
      const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
      for(let i=0;i<=160;i++){
        const d=i/160*access.road.length;
        for(const side of [-1,1]){const p=access.road.frame(d,side*width).point;positions.push(p.x,y,p.z);uvs.push((side+1)/2,d/8);}
        if(i<160){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);
    }
    const entrance=new THREE.Group(),frame=journeyRoad.frame(access.entry-16,10);
    entrance.position.copy(frame.point);entrance.rotation.y=frame.yaw+Math.PI;group.add(entrance);
    box(entrance,timber,0,1,0,.13,2,.13);sign(entrance,JOURNEY_STOPS.find(stop=>stop.id===access.id)!.name.toUpperCase(),'TURN IN · REJOINS THE ROAD',0,2.1,0,3.8);
    if(scenic&&(access.id==='cafe'||access.id==='tennis')){
      const lead=access.id==='cafe'?50:108;
      const advance=new THREE.Group(),ahead=journeyRoad.frame(access.entry-lead,10);
      advance.name=`${access.id} advance sign`;
      advance.position.copy(ahead.point);advance.rotation.y=ahead.yaw+Math.PI;group.add(advance);
      box(advance,timber,0,1,0,.13,2,.13);
      sign(advance,access.id==='cafe'?'COFFEE AHEAD':'TENNIS AHEAD',`${access.id==='cafe'?'50':'100'} M · OPTIONAL STOP`,0,2.1,0,3.8,true);
    }
    if(scenic&&access.id!=='lake'){
      const bay=new THREE.Group(),pose=access.road.frame(access.parking);
      bay.name=`${access.id} parking bay`;bay.position.copy(pose.point);bay.rotation.y=pose.yaw;group.add(bay);
      for(const x of [-.5,1.9])box(bay,parkingPaint,x,-.032,0,.07,.008,6.2);
      for(const z of [-3.1,3.1])box(bay,parkingPaint,.7,-.032,z,2.47,.008,.07);
      batchPlace(bay);
    }
  }
  for(const stop of JOURNEY_STOPS){
    if(scenic&&!['cafe','tennis','lake'].includes(stop.id))continue;
    const frame=journeyRoad.frame(stopDistance(stop.id),STOP_OFFSET),place=new THREE.Group();
    const facade=townPalette?.get("plaster")??cream,joinery=townPalette?.get("timber")??timber;
    place.position.copy(frame.point);place.rotation.y=frame.yaw-Math.PI/2;group.add(place);
    if(!scenic||stop.kind!=='lake')box(place,facade,0,-.06,0,28,.1,12);
    if(stop.kind==='cafe' || stop.kind==='store'){
      if(stop.kind==='cafe'){
        // An open service window with a shallow interior, visible from the pavement.
        box(place,facade,-5,2.4,-3,2,4.8,7);box(place,facade,5,2.4,-3,2,4.8,7);
        // The arrival-facing wall has a closed entrance beside the service counter.
        box(place,green,-6.015,1.22,-2.4,.03,2.44,1.12);
        for(const z of [-3.01,-1.79])box(place,joinery,-6.045,1.25,z,.09,2.5,.1);
        box(place,joinery,-6.045,2.52,-2.4,.09,.1,1.32);
        box(place,dark,-6.038,1.72,-2.4,.022,1.04,.86);
        box(place,cream,-6.09,1.05,-1.98,.1,.18,.035);
        box(place,facade,0,4,-3,8,1.6,7);box(place,facade,0,.46,.35,8,.92,.3);
        box(place,joinery,0,2,-5.8,8,4,.15);box(place,joinery,0,.02,-2.5,8,.1,6.5);
        const stone=new THREE.MeshStandardMaterial({color:'#aaa393',roughness:.82});
        const steel=new THREE.MeshStandardMaterial({color:'#9fa4a0',metalness:.8,roughness:.32});
        box(place,stone,0,1.05,-2.3,7,.1,1.5);box(place,green,0,.5,-2.3,7,1,1.3);
        box(place,steel,-1.2,1.4,-2.3,1.4,.6,.7);box(place,dark,-1.2,1.35,-1.92,1.2,.32,.05);
        box(place,steel,-1.2,1.11,-1.7,1.5,.06,.6);
        for(const x of [-1.6,-.8]){box(place,steel,x,1.3,-1.7,.08,.15,.35);box(place,dark,x,1.25,-1.5,.055,.055,.4);}
        for(const y of [1.9,2.7]){box(place,joinery,1.65,y,-5.15,3,.09,.6);for(let i=0;i<5;i++){const cup=createCoffeeCup();cup.position.set(.5+i*.5,y+.05,-5.1);place.add(cup);}}
        sign(place,'COFFEE','FLAT WHITE · ESPRESSO · LONG BLACK',2.7,2.15,.65,1.9);
        const warmLight=new THREE.PointLight('#ffe0ad',18,11,2);warmLight.position.set(0,2.9,-1.2);place.add(warmLight);
        const lamp=new THREE.MeshStandardMaterial({color:'#eee2b8',emissive:'#ffca77',emissiveIntensity:1.1,roughness:.7});
        for(const x of [-2,1]){box(place,dark,x,3.1,-1.3,.025,.7,.025);box(place,lamp,x,2.8,-1.3,.45,.08,.3);}
      }else{box(place,facade,0,2.4,-3,12,4.8,7);box(place,dark,0,2.25,.53,8,2.6,.06);}
      box(place,joinery,0,1.0,1,8,.14,1.6);box(place,green,0,3.8,1.8,13,.12,3.4);
      sign(place,stop.kind==='cafe'?'THE LONG WAY':'CORNER STORE',stop.kind==='cafe'?'COFFEE · FLAT WHITES':'A SMALL STOP ALONG THE WAY',0,3.05,3.56,4.2);
      for(const x of [-1.8,1.8])box(place,dark,x,3.54,3.55,.025,.42,.025);
      for(const x of [-3,3]){
        box(place,joinery,x,.75,5,2,.1,1.2);
        for(const dx of [-.75,.75])for(const z of [4.6,5.4])box(place,dark,x+dx,.35,z,.07,.7,.07);
        for(const z of [4,6]){
          box(place,joinery,x,.43,z,2,.08,.4);
          for(const dx of [-.75,.75])box(place,dark,x+dx,.2,z,.07,.4,.24);
          box(place,joinery,x,.3,z,1.6,.1,.08);
        }
      }
    }else if(stop.kind==='tennis'){
      box(place,green,0,.01,-13,22,.04,34);
      const line=new THREE.MeshBasicMaterial({color:'#dfd9bc'});
      for(const x of [-5.485,-4.115,4.115,5.485])box(place,line,x,.04,-13,.05,.02,23.77);
      for(const z of [-24.885,-1.115])box(place,line,0,.04,z,10.97,.02,.05);
      for(const z of [-19.4,-6.6])box(place,line,0,.045,z,8.23,.02,.05);
      box(place,line,0,.045,-13,.05,.02,12.8);
      const netLines:number[]=[];
      for(let x=-6.4;x<=6.4;x+=.12)netLines.push(x,.08,-13,x,.98,-13);
      for(let y=.08;y<=.98;y+=.1)netLines.push(-6.4,y,-13,6.4,y,-13);
      const netGeometry=new THREE.BufferGeometry();netGeometry.setAttribute('position',new THREE.Float32BufferAttribute(netLines,3));
      place.add(new THREE.LineSegments(netGeometry,new THREE.LineBasicMaterial({color:'#283630',transparent:true,opacity:.72})));
      box(place,line,0,1,-13,12.8,.045,.045);
      for(const x of [-6.5,6.5])box(place,dark,x,.54,-13,.085,1.08,.085);
      for(const x of [-11,11])for(let z=-29;z<=3;z+=4){box(place,dark,x,1.5,z,.07,3,.07);box(place,dark,x,2.9,z+2,.04,.04,4);}
      box(place,facade,18,2,-15,10,4,16);box(place,joinery,18,4.15,-15,11,.3,17);box(place,townPalette?.get('glass')??dark,12.94,2,-15,.1,2.8,10);
      for(const z of [-19,-16,-13,-10])box(place,joinery,12.82,2,z,.2,2.9,.12);
      box(place,joinery,12.82,.6,-15,.3,.16,10.2);
      box(place,joinery,12.1,3.5,-15,2,.18,12);
      for(const z of [-20,-10])box(place,joinery,11.3,1.75,z,.13,3.5,.13);
      const fenceLines:number[]=[];
      for(const x of [-11,11]){
        for(let z=-29;z<=3;z+=.25)fenceLines.push(x,.1,z,x,2.9,z);
        for(let y=.15;y<3;y+=.25)fenceLines.push(x,y,-29,x,y,3);
      }
      for(let x=-11;x<=11;x+=.25)fenceLines.push(x,.1,-29,x,2.9,-29);
      for(let y=.15;y<3;y+=.25)fenceLines.push(-11,y,-29,11,y,-29);
      const fenceGeometry=new THREE.BufferGeometry();fenceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fenceLines,3));
      place.add(new THREE.LineSegments(fenceGeometry,new THREE.LineBasicMaterial({color:'#506257',transparent:true,opacity:.3})));
      for(let i=0;i<=6;i++)box(place,dark,-11+i*22/6,1.5,-29,.07,3,.07);
      box(place,dark,0,2.9,-29,22,.04,.04);
      for(const x of [-10.4,-8.4])box(place,joinery,x,.9,1,.09,1.8,.09);
      sign(place,'TENNIS CLUB','YOUNG PRODIGY PARKING ONLY',-9.4,1.7,1.05,2.8);
    }else if(stop.kind==='lake'){
      const signZ=scenic?4:0;
      box(place,joinery,-9,.75,signZ,.12,1.5,.12);
      sign(place,'LAKESIDE','YES, THIS COUNTS AS LOOKING AT MY SITE',-9,1.4,signZ+.1,2.2);
    }else{
      box(place,joinery,0,1.2,0,5,2.4,.16);sign(place,stop.name.toUpperCase(),stop.kind==='forest'?'LEAVE THE ENGINE. TAKE A WALK.':'THE CITY CAN WAIT',0,1.6,.1,4.8);
      for(const x of [-2.2,2.2])box(place,joinery,x,.6,0,.16,3,.16);
    }
    if(scenic)batchPlace(place);
  }
  if(scenic)group.add(createTownStreet(townPalette!));
  const lookout=trailPoint(1);
  const bench=new THREE.Group();bench.position.copy(lookout);bench.visible=!scenic;group.add(bench);
  box(bench,timber,0,.5,1,2.4,.12,.65);for(const x of [-.9,.9])box(bench,timber,x,.22,1,.13,.44,.45);
  for(const x of scenic?[]:[-2,-1,0,1,2]){const p=lookout.clone().add(new THREE.Vector3(x,0,-2));p.y=landHeight(p.x,p.z);box(group,timber,p.x,p.y+.6,p.z,.10,1.2,.10);}
  const counterCoffee=createCoffeeCup();counterCoffee.position.copy(stopLocalPoint('cafe',.2,1.3,1));counterCoffee.visible=false;group.add(counterCoffee);
  stage('landscape-props-ready');
  const canopy=createTreeCanopy(tree.scene,renderer,resources);group.add(canopy.group);
  const treePoints:CanopyTree[]=scenic?scenicTreePlacements(surfaceHeight):[];
  for(let i=0;!scenic&&i<2400;i++){
    const d=i/2400*journeyRoad.length,fraction=i/2400;
    if(!scenic&&((fraction>.06&&fraction<.3)||(fraction>.73&&fraction<.92)))continue;
    const side=i%2?1:-1,frame=journeyRoad.frame(d,side*((scenic?10:17)+(i*37%160)));
    frame.point.y=heightAt(frame.point.x,frame.point.z);
    if((!scenic&&nearTrail(frame.point,4))||nearAccess(frame.point.x,frame.point.z,scenic?3:5,accessRoads)||accessRoads.some(access=>access.place.distanceToSquared(frame.point)<20**2)||frame.point.y<LAKE_LEVEL+.1)continue;
    treePoints.push({point:frame.point,scale:.6+(i*7%17)/20,yaw:i*2.399});
  }
  const roadside=fern?createRoadsideFerns(fern.scene,surfaceHeight):null;
  if(roadside){resources.object(roadside.mesh);group.add(roadside.mesh);}
  const grass=scenic?createRoadsideGrass(surfaceHeight):null;
  if(grass){resources.object(grass.mesh);group.add(grass.mesh);}
  stage('vegetation-ready');
  let furthest=0;
  const waterMaterial=new THREE.MeshStandardMaterial({color:scenic?'#344b58':'#244c58',metalness:.18,roughness:.32});
  waterMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 lakeLocal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlakeLocal=position.xy;');
    shader.fragmentShader='varying vec2 lakeLocal;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 p=vec2(lakeLocal.x/170.,-lakeLocal.y/290.);
      float angle=atan(p.y,p.x);float shore=length(p)/(1.+.05*sin(angle*3.)+.025*cos(angle*7.));
      if(shore>1.03)discard;
      diffuseColor.rgb=mix(diffuseColor.rgb,${scenic?'vec3(.055,.10,.115)':'vec3(.22,.38,.34)'},smoothstep(.7,1.,shore));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      float rippleA=sin(lakeLocal.x*1.8+lakeLocal.y*.45);
      float rippleB=cos(lakeLocal.x*.62-lakeLocal.y*2.7);
      normal=normalize(normal+mat3(viewMatrix)*vec3(rippleA*.035,0.,rippleB*.025));`);
  };
  waterMaterial.customProgramCacheKey=()=> scenic?'scenic-lake-shore-ripples-v3':'journey-lake-shore-ripples-v2';
  const water=new THREE.Mesh(new THREE.PlaneGeometry(450,660),waterMaterial);
  water.rotation.set(-Math.PI/2,lake.yaw,0,'YXZ');water.position.copy(lake.point).setY(LAKE_LEVEL);group.add(water);
  return {group,setCoffee(visible:boolean){counterCoffee.visible=visible;},update(car:THREE.Vector3,viewer:THREE.Vector3=car,treeBudget=4){
    world.update(car,viewer);
    canopy.update(treePoints,viewer,treeBudget);
    if(roadside?.mesh.visible)roadside.update(viewer);
    if(grass?.mesh.visible)grass.update(viewer);
    const fraction=THREE.MathUtils.euclideanModulo(journeyRoad.nearest(car.x,car.z).distance,journeyRoad.length)/journeyRoad.length;
    furthest=Math.max(furthest,fraction);const warmth=1-THREE.MathUtils.smoothstep(furthest,scenic?SCENIC_START_FRACTION:.12,scenic?.61:.85)*.78;world.setDaylight(warmth);if(scenic)journeyFog.color.copy(eveningFog).lerp(afternoonFog,warmth);return warmth;
  }};
}
