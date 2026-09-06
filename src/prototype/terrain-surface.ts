import type {BufferGeometry} from 'three';

// Index rendered triangles once so small props rest on the visible terrain.
export function terrainSurfaceHeight(geometry:BufferGeometry,fallback:(x:number,z:number)=>number){
  const positions=geometry.getAttribute('position'),index=geometry.index;
  const buckets=new Map<string,number[]>(),cell=10;
  const vertex=(i:number)=>index?index.getX(i):i;
  const count=index?.count??positions.count;
  for(let i=0;i<count;i+=3){
    const a=vertex(i),b=vertex(i+1),c=vertex(i+2);
    const xs=[positions.getX(a),positions.getX(b),positions.getX(c)];
    const zs=[positions.getZ(a),positions.getZ(b),positions.getZ(c)];
    for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++){
      for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){
        const key=`${x},${z}`;
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key)!.push(i);
      }
    }
  }
  return (x:number,z:number)=>{
    for(const i of buckets.get(`${Math.floor(x/cell)},${Math.floor(z/cell)}`)??[]){
      const a=vertex(i),b=vertex(i+1),c=vertex(i+2);
      const ax=positions.getX(a),az=positions.getZ(a),bx=positions.getX(b),bz=positions.getZ(b),cx=positions.getX(c),cz=positions.getZ(c);
      const divisor=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
      if(Math.abs(divisor)<1e-10)continue;
      const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/divisor;
      const v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/divisor,w=1-u-v;
      if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)return u*positions.getY(a)+v*positions.getY(b)+w*positions.getY(c);
    }
    return fallback(x,z);
  };
}
