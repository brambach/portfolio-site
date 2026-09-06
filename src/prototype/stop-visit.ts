import {MathUtils,Vector3} from 'three';
import type {JourneyStopId} from './journey-route';
import {stopLocalPoint,trailPoint,trailView} from './journey-land';
export {stopPlacement,stopLocalPoint} from './journey-land';
export type VisitPhase='idle'|'leaving'|'walking'|'exploring'|'returning'|'entering';
export class StopVisit {
  phase:VisitPhase='idle';
  stop:JourneyStopId|null=null;
  progress=0;
  hasCoffee=false;
  private startPosition=new Vector3();
  private startTarget=new Vector3();
  begin(stop:JourneyStopId){if(this.phase!=='idle')return false;this.stop=stop;this.phase='leaving';this.progress=0;return true;}
  outside(position:Vector3,target:Vector3){if(this.phase!=='leaving')return;this.startPosition.copy(position);this.startTarget.copy(target);this.phase='walking';}
  back(){if(this.phase==='walking'||this.phase==='exploring')this.phase='returning';}
  seated(){if(this.phase==='entering'){this.phase='idle';this.stop=null;this.progress=0;}}
  order(){if(this.phase!=='exploring'||this.stop!=='cafe')return false;this.hasCoffee=true;return true;}
  update(dt:number,reduced=false){
    const step=MathUtils.clamp(dt,0,.1)/(this.stop==='trailhead'?35:5);
    if(this.phase==='walking'){this.progress=reduced?1:Math.min(1,this.progress+step);if(this.progress===1)this.phase='exploring';}
    if(this.phase==='returning'){this.progress=reduced?0:Math.max(0,this.progress-step);if(this.progress===0)this.phase='entering';}
  }
  pose(){
    if(!this.stop)return null;
    const t=MathUtils.smoothstep(this.progress,0,1);
    if(this.stop==='trailhead'){
      const trailProgress=MathUtils.smoothstep(this.progress,.08,1);
      const trailPosition=trailPoint(trailProgress).add(new Vector3(0,1.67,0));
      const join=MathUtils.smoothstep(this.progress,0,.08);
      const position=this.startPosition.clone().lerp(trailPosition,join);
      const ahead=trailPoint(Math.min(1,trailProgress+.045)).add(new Vector3(0,1.6,0));
      ahead.lerp(trailView(),MathUtils.smoothstep(this.progress,.8,1));
      return {position,target:this.startTarget.clone().lerp(ahead,join)};
    }
    const position=this.startPosition.clone().lerp(stopLocalPoint(this.stop,0,1.67,3.6),t);
    position.y+=Math.sin(this.progress*10*Math.PI)*.018*Math.sin(this.progress*Math.PI);
    const target=this.startTarget.clone().lerp(stopLocalPoint(this.stop,0,1.85,.5),t);
    return {position,target};
  }
}
