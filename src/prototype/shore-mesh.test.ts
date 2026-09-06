import {expect,it} from 'vitest';
import {PlaneGeometry} from 'three';
import {refineLakeShore} from './shore-mesh';

it('replaces the coarse bank and matches its boundary heights and texture coordinates',()=>{
  const height=(x:number,z:number)=>x*x*.0001+z*z*.0002;
  const base=new PlaneGeometry(2100,1850,210,185).rotateX(-Math.PI/2).translate(-480,0,410),points=base.getAttribute('position');
  for(let i=0;i<points.count;i++)points.setY(i,height(points.getX(i),points.getZ(i)));
  const count=points.count,refined=refineLakeShore(base,height),p=refined.getAttribute('position'),uv=refined.getAttribute('uv');
  expect(refined.getIndex()!.count/3).toBe(90212);
  for(let i=count;i<p.count;i++){
    const row=Math.floor((i-count)/81),column=(i-count)%81,x=p.getX(i),z=p.getZ(i);
    expect(Number.isFinite(p.getY(i))).toBe(true);
    expect(uv.getX(i)).toBeCloseTo((x+1530)/2100,5);expect(uv.getY(i)).toBeCloseTo(1-(z+515)/1850,5);
    if(row===0||row===80||column===0||column===80){
      const gx=Math.floor((x+1530)/10)*10-1530,gz=Math.floor((z+515)/10)*10-515;
      const tx=(x-gx)/10,tz=(z-gz)/10;
      const expected=(1-tz)*((1-tx)*height(gx,gz)+tx*height(gx+10,gz))+tz*((1-tx)*height(gx,gz+10)+tx*height(gx+10,gz+10));
      expect(p.getY(i)).toBeCloseTo(expected,4);
    }
  }
  refined.dispose();
});
