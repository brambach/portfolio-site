import * as THREE from 'three';
import {MathUtils} from 'three';
import {scenicRoad} from './scenic-route';
import {covers,mileLabel,roadProjects} from '../projects/road-lineup';
import type {Project} from '../projects/catalog';
import type {SceneResources} from './scene-resources';

// The /work road, driven for real: the same five boards in the same order.
// Dervo gets the open road just past town, the rest are spaced about 15 s apart
// at tour pace, and all of them sit well before the lake turn-in (.58).
const FRACTIONS=[.225,.29,.355,.42,.49];
// the right-hand verge, the side you drive on, clear of the notes card on the left
const OFFSET=-10.5;
export const PROJECT_BILLBOARDS=roadProjects.map((project,index)=>({project,index,mile:mileLabel(index),distance:FRACTIONS[index]*scenicRoad.length,lead:index===0}));
export type ProjectBillboard=typeof PROJECT_BILLBOARDS[number];

export function billboardPoint(board:ProjectBillboard){return scenicRoad.frame(board.distance,OFFSET).point;}
// Trees keep this clear so nothing grows through a board.
export function nearBillboard(x:number,z:number,margin=8){
  return PROJECT_BILLBOARDS.some(board=>{const p=billboardPoint(board);return (p.x-x)**2+(p.z-z)**2<margin**2;});
}
// Stopped in front of a board (you can still read it) or a little past it counts as pulling over for it.
export function billboardAt(distance:number){
  return PROJECT_BILLBOARDS.find(board=>{
    const past=MathUtils.euclideanModulo(distance-board.distance+scenicRoad.length/2,scenicRoad.length)-scenicRoad.length/2;
    return past>-45&&past<70;
  })??null;
}

const CREAM='#f4efe4',INK='#1f2a22',GREEN='#2f5d3a',SIGN='#243c34',MUTED='#5d6a60';
const DISPLAY="'Fraunces Variable', Georgia, serif",BODY="'Hanken Grotesk Variable', sans-serif",MONO="'IBM Plex Mono', monospace";

function wrap(ink:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number){
  const words=text.split(' ');let line='';
  for(const word of words){
    const next=line?`${line} ${word}`:word;
    if(ink.measureText(next).width>width&&line){ink.fillText(line,x,y);line=word;y+=lineHeight;}else line=next;
  }
  if(line)ink.fillText(line,x,y);
  return y;
}
function coverImage(ink:CanvasRenderingContext2D,image:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),sw=w/scale,sh=h/scale;
  ink.drawImage(image,(image.naturalWidth-sw)/2,0,sw,sh,x,y,w,h);
}
// Port has no screenshot: a dusk sky with the moon, for "a moment to close".
function quietArt(ink:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
  const sky=ink.createLinearGradient(0,y,0,y+h);sky.addColorStop(0,'#34445a');sky.addColorStop(1,'#e59a6e');
  ink.fillStyle=sky;ink.fillRect(x,y,w,h);
  ink.fillStyle='#f1e6c8';ink.beginPath();ink.arc(x+w*.62,y+h*.38,h*.13,0,Math.PI*2);ink.fill();
}

// the biggest size (up to max) at which every word of text fits the width
function fit(ink:CanvasRenderingContext2D,text:string,font:(size:number)=>string,max:number,width:number){
  let size=max;
  while(size>40){ink.font=font(size);if(text.split(' ').every(word=>ink.measureText(word).width<=width))break;size-=6;}
  return size;
}

// Sized to be read from a moving car: a big name, one line, the mile marker.
export function drawBillboard(canvas:HTMLCanvasElement,project:Project,mile:string,lead:boolean,image:HTMLImageElement|null){
  const ink=canvas.getContext('2d');if(!ink)return;
  const {width:W,height:H}=canvas,pad=48,art=Math.round(W*.42);
  ink.fillStyle=CREAM;ink.fillRect(0,0,W,H);
  if(image)coverImage(ink,image,pad,pad,art-pad,H-pad*2);else quietArt(ink,pad,pad,art-pad,H-pad*2);
  const x=art+56,text=W-x-pad;
  ink.textBaseline='alphabetic';
  // the mile marker, like the little highway signs on /work
  ink.font=`500 40px ${MONO}`;const tag=mile.toUpperCase(),tagWidth=ink.measureText(tag).width+48;
  ink.fillStyle=GREEN;ink.beginPath();ink.roundRect(x,pad+4,tagWidth,68,12);ink.fill();
  ink.fillStyle=CREAM;ink.fillText(tag,x+24,pad+52);
  const display=(size:number)=>`600 ${size}px ${DISPLAY}`;
  const size=fit(ink,project.name,display,lead?220:190,text);
  ink.fillStyle=INK;ink.font=display(size);
  let y=wrap(ink,project.name,x,pad+90+size*.92,text,size*.95);
  ink.font=`500 ${lead?64:58}px ${BODY}`;ink.fillStyle='#3b463e';
  y=wrap(ink,project.line,x,y+(lead?96:88),text,lead?76:70);
  if(lead){ink.font=`600 64px 'Caveat Variable', cursive`;ink.fillStyle=GREEN;ink.fillText('I’m building all of it.',x,Math.min(y+100,H-pad-10));}
  else{ink.font=`400 36px ${MONO}`;ink.fillStyle=MUTED;ink.fillText(project.category.toUpperCase(),x,H-pad-6);}
}

export function addProjectBillboards(parent:THREE.Object3D,resources:SceneResources,heightAt:(x:number,z:number)=>number){
  const frameMaterial=new THREE.MeshStandardMaterial({color:SIGN,roughness:.85});
  const postMaterial=new THREE.MeshStandardMaterial({color:'#3a3a33',roughness:.9});
  const fonts=typeof document!=='undefined'&&document.fonts?Promise.all([`600 96px ${DISPLAY}`,`500 42px ${BODY}`,`500 40px ${MONO}`,`600 44px 'Caveat Variable'`].map(font=>document.fonts.load(font).catch(()=>[]))):Promise.resolve();
  const boards:THREE.Group[]=[];
  for(const board of PROJECT_BILLBOARDS){
    const {project,mile,lead}=board;
    const width=lead?9:7.6,height=lead?4.5:3.9,lift=.9;
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.round(canvas.width*height/width);
    drawBillboard(canvas,project,mile,lead,null);
    const texture=resources.track(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    // lit a little from the front so the boards still read once dusk comes in
    const face=new THREE.MeshStandardMaterial({map:texture,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.14,roughness:.75});
    const frame=scenicRoad.frame(board.distance,OFFSET),group=new THREE.Group();
    group.name=`${project.id} billboard`;
    group.position.copy(frame.point).setY(heightAt(frame.point.x,frame.point.z));
    // face oncoming cars, turned a little toward the road so it reads on approach
    group.rotation.y=frame.yaw+Math.PI+.42;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),face);panel.position.set(0,lift+height/2,.07);
    const back=new THREE.Mesh(new THREE.BoxGeometry(width+.24,height+.24,.12),frameMaterial);back.position.set(0,lift+height/2,0);
    back.castShadow=true;group.add(back,panel);
    for(const x of [-width*.32,width*.32]){const post=new THREE.Mesh(new THREE.BoxGeometry(.16,lift+.2,.16),postMaterial);post.position.set(x,(lift+.2)/2-.1,-.12);post.castShadow=true;group.add(post);}
    parent.add(group);resources.object(group);boards.push(group);
    const src=covers[project.id];
    const image=src?new Image():null;
    const loaded=image?new Promise<void>(resolve=>{image.onload=()=>resolve();image.onerror=()=>resolve();image.src=src!;}):Promise.resolve();
    void Promise.all([fonts,loaded]).then(()=>{drawBillboard(canvas,project,mile,lead,image?.naturalWidth?image:null);texture.needsUpdate=true;});
  }
  return boards;
}
