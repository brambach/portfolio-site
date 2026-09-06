import {Box3,Matrix4,Ray,type Object3D} from 'three';

// The parked car is a generous entry target. Its detailed triangles aren't needed for entry.
export function createExteriorPicker(vehicle:Object3D){
  vehicle.updateWorldMatrix(true,true);
  const inverse=new Matrix4().copy(vehicle.matrixWorld).invert();
  const bounds=new Box3().setFromObject(vehicle).applyMatrix4(inverse);
  const localRay=new Ray();
  return (ray:Ray)=>{
    inverse.copy(vehicle.matrixWorld).invert();
    localRay.copy(ray).applyMatrix4(inverse);
    return localRay.intersectsBox(bounds);
  };
}
