import {expect,it} from 'vitest';
import {Group,Matrix4,Vector3,Quaternion} from 'three';
import {addScenicRocks} from './landscape-detail';
import {scenicRoad,scenicAccess} from './scenic-route';

it('keeps granite outside the driving shoulder and access lane',()=>{
  const rocks=addScenicRocks(new Group()),matrix=new Matrix4(),point=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
  expect(rocks.count).toBeGreaterThan(100);
  for(let i=0;i<rocks.count;i++){
    rocks.getMatrixAt(i,matrix);matrix.decompose(point,rotation,scale);
    expect(scenicRoad.nearest(point.x,point.z).away).toBeGreaterThan(6+Math.max(scale.x,scale.y,scale.z)-.001);
    for(const access of scenicAccess){
      const nearest=access.road.nearest(point.x,point.z);
      if(nearest.distance>=0&&nearest.distance<=access.road.length)expect(nearest.away).toBeGreaterThan(6+scale.x-.001);
    }
  }
  rocks.geometry.dispose();rocks.material.dispose();rocks.dispose();
});

it('adds low granite along the lake edge without filling the parking approach',()=>{
  const rocks=addScenicRocks(new Group()),matrix=new Matrix4(),point=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
  let shoreline=0;
  for(let i=0;i<rocks.count;i++){
    rocks.getMatrixAt(i,matrix);matrix.decompose(point,rotation,scale);
    if(point.y>=-.3)continue;
    shoreline++;
    for(const access of scenicAccess){
      const nearest=access.road.nearest(point.x,point.z);
      if(nearest.distance>=0&&nearest.distance<=access.road.length)expect(nearest.away).toBeGreaterThan(6+scale.x-.001);
    }
    expect(scale.y).toBeLessThan(.75);
  }
  expect(shoreline).toBeGreaterThan(8);
  rocks.geometry.dispose();rocks.material.dispose();rocks.dispose();
});
