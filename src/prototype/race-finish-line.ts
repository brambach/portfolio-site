import {BoxGeometry,Group,Mesh,MeshStandardMaterial} from 'three';
import type {RoadGeometry} from './road-geometry';

export function createRaceFinishLine(road:RoadGeometry){
  const group=new Group(),pose=road.frame(road.length*.025);
  group.position.copy(pose.point);group.rotation.y=pose.yaw;
  const ivory=new MeshStandardMaterial({color:'#eee9d3',roughness:.85}),dark=new MeshStandardMaterial({color:'#23352c',roughness:.85});
  const tile=new BoxGeometry(.95,.025,.95);
  for(let row=0;row<2;row++)for(let column=0;column<8;column++){
    const square=new Mesh(tile,(row+column)%2?ivory:dark);square.position.set(column*.95-3.325,.06,row*.95);group.add(square);
  }
  const postGeometry=new BoxGeometry(.12,4.8,.12);
  for(const side of [-1,1]){
    const post=new Mesh(postGeometry,dark);post.position.set(side*5,2.4,0);group.add(post);
    for(let row=0;row<3;row++)for(let column=0;column<4;column++){
      const flag=new Mesh(new BoxGeometry(.3,.3,.04),(row+column)%2?ivory:dark);flag.position.set(side*5+column*.3,4.4-row*.3,0);group.add(flag);
    }
  }
  group.visible=false;return group;
}
