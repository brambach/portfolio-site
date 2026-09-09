import * as THREE from 'three';

// Small deterministic surface maps are generated locally and owned by SceneResources.
export function townMaterial(kind:string,color:string){
  const surfaceColor=kind==='plaster'?'#cdbb9e':kind==='glass'?'#1b2a30':color;
  const material=new THREE.MeshStandardMaterial({color:surfaceColor,roughness:kind==='glass'?.3:kind==='plaster'?.92:.86,metalness:kind==='glass'?.24:0});
  if(kind==='glass'||kind==='trim')return material;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const context=canvas.getContext('2d')!;
  context.fillStyle='#efefef';context.fillRect(0,0,256,256);
  let seed=37;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2600;i++){
    context.fillStyle=`rgba(${random()>.5?'255,255,255':'30,25,20'},${.02+random()*.075})`;
    context.fillRect(random()*256,random()*256,1+random()*2,1+random()*2);
  }
  if(kind==='timber'){
    for(let x=0;x<256;x+=21.333){
      context.fillStyle='rgba(25,20,15,.22)';context.fillRect(x,0,1.4,256);
      for(let i=0;i<22;i++){
        context.strokeStyle=`rgba(45,32,20,${.03+random()*.1})`;context.lineWidth=.5;
        context.beginPath();const grain=x+2+random()*17;context.moveTo(grain,0);context.bezierCurveTo(grain+3,80,grain-3,170,grain+1,256);context.stroke();
      }
    }
  }
  if(kind==='roof'){
    for(let x=0;x<256;x+=64){context.fillStyle='rgba(20,25,25,.3)';context.fillRect(x,0,2,256);context.fillStyle='rgba(255,255,255,.12)';context.fillRect(x+2,0,1,256);}
  }
  if(kind==='pavement'){
    context.strokeStyle='rgba(40,40,35,.16)';context.lineWidth=1;
    context.strokeRect(.5,.5,255,255);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==='timber'?3:kind==='roof'?5:2,kind==='timber'?1:2);
  material.map=texture;
  return material;
}
