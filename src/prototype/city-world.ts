import * as THREE from 'three';
import type {SceneResources} from './scene-resources';
import {cityRoad} from './city-path';
import {journeyAccess,nearAccess} from './journey-route';
import type {RoadGeometry} from './road-geometry';
import {BOULEVARD_PROFILE,SCENIC_PROFILE} from './road-profile';

export function createScenicSkyMaterial(panorama:THREE.Texture|null,daylight=0,landscape=0) {
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{daylight:{value:daylight},landscape:{value:landscape},panorama:{value:panorama},hasPanorama:{value:panorama?1:0},fogHorizonColour:{value:new THREE.Color('#93a6ad')}},
    vertexShader:'varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`varying vec3 direction; uniform float daylight; uniform float landscape; uniform sampler2D panorama; uniform float hasPanorama; uniform vec3 fogHorizonColour;
      float ridgeDetail(float az,float offset){
        return .0035*sin(az*47.+offset)+.0018*sin(az*89.-offset)+.0008*sin(az*173.+offset);
      }
      vec3 mountainFace(vec3 base,vec3 haze,float az,float height,float crest,float offset){
        float depth=clamp((crest-height)/max(crest,.01),0.,1.);
        float folds=sin(az*43.+depth*4.+sin(az*13.+offset)*1.8+offset);
        float gullies=sin(az*91.-depth*7.+sin(az*29.)*.8);
        float light=.95+.045*folds+.012*gullies;
        vec3 face=base*light;
        face=mix(face,base*vec3(1.06,1.02,.98),smoothstep(.3,.9,folds)*(1.-depth)*.15);
        return mix(face,haze,smoothstep(.05,1.,depth)*.14);
      }
      void main(){vec3 d=normalize(direction);float h=smoothstep(-.05,.55,d.y);
      vec3 colour=mix(vec3(.095,.062,.092),vec3(.007,.012,.033),h);
      float glow=pow(max(0.,dot(d,normalize(vec3(-.8,.02,-.5)))),8.);
      colour+=vec3(.09,.025,.015)*glow*(1.-h);
      colour=mix(colour,mix(vec3(.64,.49,.33),vec3(.18,.30,.37),h),daylight);
      if(landscape>.5){
        vec3 afternoon=mix(vec3(.72,.50,.30),vec3(.11,.30,.48),h);
        vec3 evening=mix(vec3(.32,.18,.20),vec3(.06,.11,.20),h);
        colour=mix(evening,afternoon,daylight);
        float az=atan(d.x,d.z);
        float farRidge=.045+.045*abs(sin(az*3.+.7))+.016*sin(az*11.)+.008*cos(az*23.)+ridgeDetail(az,.7);
        float nearRidge=.012+.038*abs(sin(az*4.-.8))+.012*sin(az*13.)+.005*cos(az*29.)+ridgeDetail(az,2.1)*.65;
        vec3 farColour=mix(vec3(.14,.17,.23),vec3(.34,.39,.40),daylight);
        vec3 nearColour=mix(vec3(.08,.13,.18),vec3(.24,.32,.31),daylight);
        farColour=mix(colour,farColour,.48+.18*smoothstep(0.,farRidge,d.y));
        nearColour=mix(colour,nearColour,.60+.18*smoothstep(0.,nearRidge,d.y));
        farColour=mountainFace(farColour,colour,az,d.y,farRidge,.7);
        nearColour=mountainFace(nearColour,farColour,az,d.y,nearRidge,2.1);
        colour=mix(colour,farColour,1.-smoothstep(farRidge-.0007,farRidge+.0007,d.y));
        colour=mix(colour,nearColour,1.-smoothstep(nearRidge-.0009,nearRidge+.0009,d.y));
        if(hasPanorama>.5){
          vec2 panoramaUv=vec2(az/6.28318530718+.5,clamp(.453+asin(clamp(d.y,-1.,1.))/3.14159265359,.001,.999));
          vec2 panoramaDx=dFdx(panoramaUv),panoramaDy=dFdy(panoramaUv);
          panoramaDx.x-=floor(panoramaDx.x+.5);
          panoramaDy.x-=floor(panoramaDy.x+.5);
          vec3 panoramaColour=textureGrad(panorama,panoramaUv,panoramaDx,panoramaDy).rgb;
          colour=panoramaColour*mix(vec3(.68,.58,.69),vec3(1.08,1.02,.94),daylight);
          float horizonBlend=1.-smoothstep(.035,.13,d.y);
          colour=mix(colour,fogHorizonColour,horizonBlend*.58);
        }
      }
      gl_FragColor=vec4(colour,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  material.customProgramCacheKey=()=> 'scenic-sky-horizon-blend-v1';
  return material;
}

export async function createCityWorld(scene: THREE.Scene, resources?:SceneResources,road:RoadGeometry=cityRoad,journey=false,scenic=false) {
  const {length:CITY_LENGTH,frame:cityFrame,nearest:nearestCityRoad}=road;
  const profile=scenic?SCENIC_PROFILE:BOULEVARD_PROFILE;
  const CITY_HALF_WIDTH=profile.pavedHalfWidth;
  const [panorama,asphalt]=await Promise.all([
    scenic?new THREE.TextureLoader().loadAsync('/images/entrance/alpine-panorama-v1.png').then(texture=>resources?resources.track(texture):texture).catch(()=>null):Promise.resolve(null),
    new THREE.TextureLoader().loadAsync('/models/entrance/asphalt.jpg').then(texture=>resources?resources.track(texture):texture),
  ]);
  resources?.assertActive();
  if(panorama){panorama.colorSpace=THREE.SRGBColorSpace;panorama.wrapS=THREE.RepeatWrapping;}
  const group=new THREE.Group();group.name='Midnight boulevard';scene.add(group);
  scene.fog=new THREE.FogExp2('#171c30',.0025);
  const skyMaterial=createScenicSkyMaterial(panorama,journey?1:0,scenic?1:0);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(380,24,12),skyMaterial);
  sky.frustumCulled=false;group.add(sky);
  asphalt.colorSpace=THREE.SRGBColorSpace;asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.repeat.set(3,1);asphalt.anisotropy=4;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:'#131621',roughness:.95}));
  ground.rotation.x=-Math.PI/2;ground.position.set(-230,-.16,180);ground.receiveShadow=true;ground.visible=!journey;group.add(ground);
  const forestWeight=(distance:number)=>scenic?1:journey?THREE.MathUtils.smoothstep(distance/CITY_LENGTH,.25,.32)*(1-THREE.MathUtils.smoothstep(distance/CITY_LENGTH,.69,.75)):0;
  function ribbon(width:number,y:number,material:THREE.Material,shoulder=false) {
    const vertices:number[]=[],uvs:number[]=[],indices:number[]=[],colours:number[]=[];
    const count=1300;
    for(let i=0;i<=count;i++) {
      const d=i/count*CITY_LENGTH;
      const forest=forestWeight(d),edge=shoulder?THREE.MathUtils.lerp(width,(scenic?profile.shoulderHalfWidth:CITY_HALF_WIDTH+1.4)+Math.sin(d*.19)*.12,forest):width;
      const colour=new THREE.Color('#54515c').lerp(new THREE.Color('#91816a'),forest);
      for(const side of [-1,1]) {const p=cityFrame(d,side*edge).point;vertices.push(p.x,y,p.z);uvs.push((side+1)/2,d/8);colours.push(colour.r,colour.g,colour.b);}
      if(i<count){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    if(shoulder)geometry.setAttribute("color",new THREE.Float32BufferAttribute(colours,3));
    const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  ribbon(profile.shoulderHalfWidth,-.08,new THREE.MeshStandardMaterial({map:journey?asphalt:null,vertexColors:true,roughness:.97}),true);
  ribbon(CITY_HALF_WIDTH,-.045,new THREE.MeshStandardMaterial({map:asphalt,color:'#242934',roughness:.85,metalness:.03}));
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
  function batch(geometry:THREE.BufferGeometry,material:THREE.Material,entries:{x:number;y:number;z:number;sx:number;sy:number;sz:number;yaw?:number}[]) {
    const mesh=new THREE.InstancedMesh(geometry,material,entries.length);
    entries.forEach((e,i)=>{rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,e.yaw??0);matrix.compose(position.set(e.x,e.y,e.z),rotation,scale.set(e.sx,e.sy,e.sz));mesh.setMatrixAt(i,matrix);});
    mesh.computeBoundingSphere();mesh.matrixAutoUpdate=false;group.add(mesh);return mesh;
  }
  const markings=[];
  for(let d=0;d<CITY_LENGTH;d+=12) {
    for(const lane of scenic?[]:[-3.7,3.7]) {const f=cityFrame(d,lane);markings.push({x:f.point.x,y:-.038,z:f.point.z,sx:.11,sy:.005,sz:4,yaw:f.yaw});}
    for(const lane of [-.12,.12]) {const f=cityFrame(d,lane);markings.push({x:f.point.x,y:-.037,z:f.point.z,sx:.08,sy:.005,sz:12,yaw:f.yaw});}
  }
  batch(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:scenic?'#b2a27a':'#b8b1a1',emissive:'#626c8f',emissiveIntensity:scenic?0:.2,roughness:.75}),markings);
  if(scenic){
    const edges=[];
    for(let d=0;d<CITY_LENGTH;d+=6)for(const lane of [-1,1]){
      const f=cityFrame(d,lane*(profile.pavedHalfWidth-.18));
      edges.push({x:f.point.x,y:-.036,z:f.point.z,sx:.09,sy:.004,sz:6.05,yaw:f.yaw});
    }
    batch(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:'#babba9',roughness:.9}),edges);
  }
  let seed=12;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const buildings=[];
  for(let x=journey?-1350:-780;x<330;x+=42)for(let z=-430;z<(journey?1250:900);z+=45) {
    if(scenic)continue;
    const px=x+(random()-.5)*9,pz=z+(random()-.5)*9;
    if(nearestCityRoad(px,pz).away<40 || (pz>565 && px>-410 && px<-100))continue;
    if(journey){const district=THREE.MathUtils.euclideanModulo(nearestCityRoad(px,pz).distance,CITY_LENGTH)/CITY_LENGTH;if(district<.73 || district>.9)continue;}
    if(journey&&(nearAccess(px,pz,15)||journeyAccess.some(access=>(px-access.place.x)**2+(pz-access.place.z)**2<35**2)))continue;
    const h=15+Math.pow(random(),1.8)*100;
    buildings.push({x:px,y:h/2-.1,z:pz,sx:22+random()*13,sy:h,sz:24+random()*12});
  }
  const facade=new THREE.MeshStandardMaterial({color:'#343645',roughness:.78,metalness:.18,transparent:true,depthWrite:false});
  facade.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 cityWorld; varying float cityVisibility;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      cityWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
      vec3 blockCentre=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
      cityVisibility=1.-smoothstep(220.,330.,distance(cameraPosition.xz,blockCentre.xz));`);
    shader.fragmentShader='varying vec3 cityWorld; varying float cityVisibility;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(cityVisibility<=0.)discard; diffuseColor.a*=cityVisibility;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      vec2 grid=vec2(cityWorld.x+cityWorld.z,cityWorld.y)*vec2(.32,.30);
      vec2 tile=fract(grid);vec2 cell=floor(grid);
      float occupied=step(.38,fract(sin(dot(cell,vec2(27.17,78.43)))*43758.5));
      float window=step(.19,tile.x)*step(tile.x,.72)*step(.22,tile.y)*step(tile.y,.75);
      float warm=fract(sin(dot(cell,vec2(4.3,12.7)))*148.7);
      vec3 light=mix(vec3(.23,.36,.52),vec3(.78,.36,.12),step(.25,warm));
      totalEmissiveRadiance+=light*window*occupied*.8;
      diffuseColor.rgb*=mix(.7,1.,step(.08,tile.y));`);
  };facade.customProgramCacheKey=()=> 'city-windows-distance-v3';
  const buildingMesh=batch(new THREE.BoxGeometry(),facade,buildings);
  const lastBuildingSort=new THREE.Vector3(Infinity,Infinity,Infinity);
  const poles=[],heads=[],lampPositions:THREE.Vector3[]=[];
  for(let d=0;d<CITY_LENGTH;d+=36)for(const side of [-1,1]) {
    if(scenic)continue;
    if(journey && d/CITY_LENGTH>.28 && d/CITY_LENGTH<.73)continue;
    const f=cityFrame(d,side*9.7);
    poles.push({x:f.point.x,y:3.8,z:f.point.z,sx:.13,sy:7.6,sz:.13});
    const h=f.point.clone().addScaledVector(f.side,-side*1.3);
    heads.push({x:h.x,y:7.5,z:h.z,sx:.55,sy:.09,sz:1.3,yaw:f.yaw});lampPositions.push(h);
  }
  batch(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:'#3e424c',metalness:.6,roughness:.55}),poles);
  batch(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({color:'#ffd4a0',toneMapped:false}),heads);
  // Baked pools suggest the full street lighting. Only two nearby lamps light the car.
  const poolCanvas=document.createElement('canvas');poolCanvas.width=poolCanvas.height=128;
  const ink=poolCanvas.getContext('2d')!;const radial=ink.createRadialGradient(64,64,0,64,64,64);
  radial.addColorStop(0,'rgba(239,171,99,.34)');radial.addColorStop(.4,'rgba(212,144,83,.15)');radial.addColorStop(1,'rgba(212,144,83,0)');ink.fillStyle=radial;ink.fillRect(0,0,128,128);
  const poolTexture=new THREE.CanvasTexture(poolCanvas);poolTexture.colorSpace=THREE.SRGBColorSpace;
  const poolGeometry=new THREE.PlaneGeometry().rotateX(-Math.PI/2);
  batch(poolGeometry,new THREE.MeshBasicMaterial({map:poolTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),heads.map(h=>({...h,y:-.028,sx:17,sy:1,sz:29})));
  const lamps=[new THREE.PointLight('#ffd0a0',25,28,2),new THREE.PointLight('#ffd0a0',25,28,2)];lamps.forEach(l=>group.add(l));
  let lastLamp=-1;
  return {group,asphalt,setDaylight(value:number){skyMaterial.uniforms.daylight.value=value;},setHorizonFog(value:THREE.Color){skyMaterial.uniforms.fogHorizonColour.value.copy(value);},update(car:THREE.Vector3,_viewer?:THREE.Vector3,_treeBudget?:number){
    const viewer=_viewer??car;
    sky.position.copy(viewer);
    if(lastBuildingSort.distanceToSquared(viewer)>20**2){
      lastBuildingSort.copy(viewer);
      const distance=(block:typeof buildings[number])=>(block.x-viewer.x)**2+(block.z-viewer.z)**2;
      const sorted=[...buildings].sort((a,b)=>distance(b)-distance(a));
      rotation.identity();sorted.forEach((block,i)=>{matrix.compose(position.set(block.x,block.y,block.z),rotation,scale.set(block.sx,block.sy,block.sz));buildingMesh.setMatrixAt(i,matrix);});
      buildingMesh.instanceMatrix.needsUpdate=true;
    }
    let nearest=0,distance=Infinity;
    lampPositions.forEach((p,i)=>{const d=p.distanceToSquared(car);if(d<distance){distance=d;nearest=i;}});
    if(lampPositions.length&&nearest!==lastLamp){lamps[0].position.copy(lampPositions[nearest]).setY(6.8);lamps[1].position.copy(lampPositions[(nearest+2)%lampPositions.length]).setY(6.8);lastLamp=nearest;}
    return .5;
  }};
}
