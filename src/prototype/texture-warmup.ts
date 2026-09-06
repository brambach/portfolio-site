import {Mesh,Texture,type Object3D,type WebGLRenderer} from 'three';
import {loadingBatches} from './loading-batches';

// Upload shared material textures once, yielding between expensive batches.
export async function warmTextures(root:Object3D,renderer:Pick<WebGLRenderer,'initTexture'>,signal:AbortSignal){
  const textures=new Set<Texture>();
  root.traverse(object=>{
    if(!(object instanceof Mesh))return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      for(const value of Object.values(material)){
        if(value instanceof Texture&&!value.isRenderTargetTexture)textures.add(value);
      }
    }
  });
  await loadingBatches(textures,texture=>renderer.initTexture(texture),signal);
}
