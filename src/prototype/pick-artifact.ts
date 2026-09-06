import {Material,Mesh,type Intersection,type Object3D} from 'three';

export function pickArtifact(hits:readonly Intersection[]):string|undefined {
  for(const hit of hits){
    let visible=true;
    for(let object:Object3D|null=hit.object;object;object=object.parent){if(!object.visible){visible=false;break;}}
    if(!visible)continue;
    const mesh=hit.object;
    if(mesh instanceof Mesh&&mesh.material instanceof Material&&mesh.material.transparent&&!mesh.userData.pickTarget)continue;
    for(let object:Object3D|null=hit.object;object;object=object.parent){if(object.userData.artifact)return object.userData.artifact;}
    // A visible opaque part of the cabin still blocks objects behind it.
    return undefined;
  }
}
