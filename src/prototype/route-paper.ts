import * as THREE from 'three';
import {mapPoints,mapWorldPoint,mapStopPoint} from './journey-map-layout';
import {JOURNEY_STOPS,journeyAccess} from './journey-route';

export function createRoutePaper(){
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=720;
  const ink=canvas.getContext('2d')!;
  ink.fillStyle='#e5ddc5';ink.fillRect(0,0,1000,720);
  ink.fillStyle='#284a3d';ink.font='42px Georgia';ink.fillText('THE LONG WAY',60,75);
  ink.font='18px monospace';ink.fillText('ROUTE NOTES / TAKE YOUR TIME',62,110);
  ink.save();ink.translate(35,145);ink.scale(1.3,1.3);
  ink.beginPath();mapPoints.forEach((p,i)=>i?ink.lineTo(p.x,p.y):ink.moveTo(p.x,p.y));ink.closePath();
  ink.lineWidth=12;ink.strokeStyle='#97a58c';ink.stroke();ink.lineWidth=5;ink.strokeStyle='#fcf1d4';ink.stroke();
  for(const access of journeyAccess){ink.beginPath();for(let i=0;i<70;i++){const p=mapWorldPoint(access.road.frame(i/69*access.road.length).point);if(i)ink.lineTo(p.x,p.y);else ink.moveTo(p.x,p.y);}ink.lineWidth=3;ink.strokeStyle="#97a58c";ink.stroke();}
  JOURNEY_STOPS.forEach((stop,i)=>{const p=mapStopPoint(stop.id);ink.beginPath();ink.arc(p.x,p.y,10,0,Math.PI*2);ink.fillStyle='#284a3d';ink.fill();ink.fillStyle='#fff8e7';ink.font='12px sans-serif';ink.textAlign='center';ink.fillText(String(i+1),p.x,p.y+4);});
  ink.restore();ink.textAlign='left';
  JOURNEY_STOPS.forEach((stop,i)=>{ink.fillStyle='#284a3d';ink.font='21px Georgia';ink.fillText(`${i+1}. ${stop.name}`,695,215+i*58,260);});
  ink.fillStyle='#7d7460';ink.font='17px monospace';ink.fillText('COFFEE. FOREST. LAKE. AFTER HOURS.',60,665);
  // Printed crease shading follows the shallow folds in the paper geometry.
  for(const x of [333,666]){ink.fillStyle='rgba(67,57,40,.10)';ink.fillRect(x,0,3,720);ink.fillStyle='rgba(255,255,255,.25)';ink.fillRect(x+3,0,2,720);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const geometry=new THREE.PlaneGeometry(.31,.223,6,1);
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)positions.setZ(i,[0,.002,0,-.002,0,.002,0][i%7]);
  geometry.computeVertexNormals();
  const paper=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,color:'#fff5db',roughness:.95,side:THREE.DoubleSide}));
  paper.name='Folded route map on the dashboard';paper.userData.artifact='map';
  paper.position.set(-.08,1.14,.82);paper.rotation.set(-1.1,Math.PI,0);
  return paper;
}
