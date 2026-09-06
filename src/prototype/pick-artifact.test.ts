import {describe,it,expect} from 'vitest';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {pickArtifact} from './pick-artifact';

describe('physical object visibility',()=>{
  function fixture(){
    const scene=new Group(),holder=new Group();holder.visible=false;
    const bracket=new Mesh(new BoxGeometry(1,1,.2),new MeshBasicMaterial());bracket.position.z=2;holder.add(bracket);scene.add(holder);
    const card=new Mesh(new BoxGeometry(1,1,.1),new MeshBasicMaterial());card.position.z=3;card.userData.artifact='card';scene.add(card);scene.updateMatrixWorld(true);
    const ray=new Raycaster(new Vector3(),new Vector3(0,0,1));
    return {scene,holder,card,ray,dispose(){bracket.geometry.dispose();bracket.material.dispose();card.geometry.dispose();card.material.dispose();}};
  }
  it('ignores an invisible parent even when its opaque child intersects first',()=>{
    const f=fixture(),hits=f.ray.intersectObject(f.scene);expect(hits[0].object.parent).toBe(f.holder);expect(pickArtifact(hits)).toBe('card');f.dispose();
  });
  it('respects a visible opaque obstruction instead of clicking through the cabin',()=>{
    const f=fixture();f.holder.visible=true;expect(pickArtifact(f.ray.intersectObject(f.scene))).toBeUndefined();f.dispose();
  });
  it('accepts a transparent touch target while ignoring ordinary transparent glass',()=>{
    const f=fixture();f.holder.visible=true;const bracket=f.holder.children[0] as Mesh;const material=bracket.material as MeshBasicMaterial;material.transparent=true;material.opacity=0;
    expect(pickArtifact(f.ray.intersectObject(f.scene))).toBe('card');bracket.userData.pickTarget=true;f.holder.userData.artifact='racket';expect(pickArtifact(f.ray.intersectObject(f.scene))).toBe('racket');f.dispose();
  });
});
