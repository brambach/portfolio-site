import {DirectionalLight,PointLight,SpotLight,InstancedMesh,Mesh,Line,Texture,type Object3D,type Material} from 'three';

type Disposable={dispose:()=>void};
// Late loader results are disposed too, even when another load already failed.
export class SceneResources {
  private owned=new Set<Disposable>();
  private seen=new Set<Disposable>();
  private disposed=false;
  track<T extends Disposable>(resource:T):T {
    if(this.seen.has(resource))return resource;
    this.seen.add(resource);
    if(this.disposed)resource.dispose();else this.owned.add(resource);
    return resource;
  }
  material(material:Material) {
    this.track(material);
    for(const value of Object.values(material))if(value instanceof Texture)this.track(value);
  }
  object(root:Object3D) {
    root.traverse(object=>{
      if(object instanceof DirectionalLight || object instanceof PointLight || object instanceof SpotLight)this.track(object.shadow);
      if(!(object instanceof Mesh || object instanceof Line))return;
      this.track(object.geometry);
      if(object instanceof InstancedMesh)this.track(object);
      for(const material of Array.isArray(object.material)?object.material:[object.material])this.material(material);
    });
  }
  release(resource:Disposable) {
    if(this.owned.delete(resource))resource.dispose();
  }
  assertActive() {if(this.disposed)throw new DOMException('Scene loading was cancelled.','AbortError');}
  dispose() {
    if(this.disposed)return;
    this.disposed=true;
    for(const resource of this.owned)resource.dispose();
    this.owned.clear();
  }
}
