import {BufferGeometry,MathUtils,PlaneGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {scenicAccess} from './scenic-route';

// Refine only the visible bank, with edge heights matching the surrounding ten-metre grid.
export function refineLakeShore(base:BufferGeometry,heightAt:(x:number,z:number)=>number){
  const centre=scenicAccess[0].place,minX=Math.floor((centre.x-60+1530)/10)*10-1530,minZ=Math.floor((centre.z-60+515)/10)*10-515;
  const maxX=minX+120,maxZ=minZ+120,positions=base.getAttribute('position'),indices=base.getIndex()!,kept:number[]=[];
  for(let i=0;i<indices.count;i+=3){
    const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
    const x=(positions.getX(a)+positions.getX(b)+positions.getX(c))/3,z=(positions.getZ(a)+positions.getZ(b)+positions.getZ(c))/3;
    if(x<=minX||x>=maxX||z<=minZ||z>=maxZ)kept.push(a,b,c);
  }
  base.setIndex(kept);
  const patch=new PlaneGeometry(120,120,80,80).rotateX(-Math.PI/2).translate(minX+60,0,minZ+60),fine=patch.getAttribute('position'),uv=patch.getAttribute('uv');
  function coarse(x:number,z:number){
    const gx=(x+1530)/10,gz=(z+515)/10,ix=Math.floor(gx),iz=Math.floor(gz),tx=gx-ix,tz=gz-iz;
    return MathUtils.lerp(MathUtils.lerp(positions.getY(iz*211+ix),positions.getY(iz*211+ix+1),tx),MathUtils.lerp(positions.getY((iz+1)*211+ix),positions.getY((iz+1)*211+ix+1),tx),tz);
  }
  for(let i=0;i<fine.count;i++){
    const x=fine.getX(i),z=fine.getZ(i),edge=Math.min(x-minX,maxX-x,z-minZ,maxZ-z);
    fine.setY(i,MathUtils.lerp(coarse(x,z),heightAt(x,z),MathUtils.smoothstep(edge,0,3)));
    uv.setXY(i,(x+1530)/2100,1-(z+515)/1850);
  }
  const merged=mergeGeometries([base,patch]);base.dispose();patch.dispose();return merged;
}
