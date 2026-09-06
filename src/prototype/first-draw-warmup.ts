import type {Object3D} from 'three';

// Compile alone doesn't exercise the main-scene shadow draw for hidden tree variants.
export function withFirstDrawObjects(root:Object3D,render:()=>void){
  const hidden:Object3D[]=[];
  root.traverse(object=>{if(object.userData.prewarmFirstDraw&&!object.visible){hidden.push(object);object.visible=true;}});
  try{render();}finally{for(const object of hidden)object.visible=false;}
}
