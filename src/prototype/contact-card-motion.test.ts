import {expect,it} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {contactCardPose,contactCardReadingPose} from './contact-card-motion';

it('releases the card away from the glovebox before carrying it across the cabin',()=>{
  expect(contactCardPose(0).position.toArray()).toEqual([-.265,.858,.77725]);
  expect(contactCardPose(.3).position.x).toBe(-.265);
  expect(contactCardPose(.3).position.z).toBeLessThan(.66);
  for(let i=0;i<=100;i++){
    const pose=contactCardPose(i/100);
    for(const x of [-.075,.075])for(const z of [-.045,.045]){
      const corner=new Vector3(x,0,z).applyQuaternion(pose.rotation).add(pose.position);
      expect(corner.y).toBeGreaterThan(.80);expect(corner.y).toBeLessThan(1.3);
    }
  }
});

it('keeps the held card visible beside desktop notes and above phone notes',()=>{
  for(const aspect of [1280/720,390/660]){
    const view=contactCardReadingPose(aspect),camera=new PerspectiveCamera(view.fov,aspect,.01,100);
    camera.position.copy(view.position);camera.lookAt(view.target);camera.updateMatrixWorld();
    const pose=contactCardPose(1);
    for(const x of [-.075,.075])for(const z of [-.045,.045]){
      const projected=new Vector3(x,0,z).applyQuaternion(pose.rotation).add(pose.position).project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(1);expect(Math.abs(projected.y)).toBeLessThan(1);
      if(aspect>1)expect(projected.x).toBeLessThan(.35);
      else expect(projected.y).toBeGreaterThan(.1);
    }
  }
});
