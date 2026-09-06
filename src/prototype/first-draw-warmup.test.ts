import {expect,it} from 'vitest';
import {Group} from 'three';
import {withFirstDrawObjects} from './first-draw-warmup';

it('warms only tagged hidden objects and restores visibility even if rendering fails',()=>{
  const root=new Group(),tree=new Group(),other=new Group(),visible=new Group();
  tree.userData.prewarmFirstDraw=visible.userData.prewarmFirstDraw=true;
  tree.visible=other.visible=false;root.add(tree,other,visible);
  expect(()=>withFirstDrawObjects(root,()=>{
    expect(tree.visible).toBe(true);expect(other.visible).toBe(false);expect(visible.visible).toBe(true);
    throw new Error('context lost');
  })).toThrow('context lost');
  expect(tree.visible).toBe(false);expect(other.visible).toBe(false);expect(visible.visible).toBe(true);
});
