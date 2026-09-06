export type MotionPhase='approach'|'entry'|'exit'|'object'|'ignition'|'parking';
type MotionSummary={phase:MotionPhase;samples:number;fps:number;p95FrameMs:number;maxFrameMs:number;slowFrames:number;maxSubmitMs:number;slowFrameSamples:number[]};

export class MotionProfile {
  private phase:MotionPhase|null=null;
  private intervals:number[]=[];
  private history:MotionSummary[]=[];
  private maxSubmit=0;
  private summary():MotionSummary|null {
    if(!this.phase||!this.intervals.length)return null;
    const sorted=[...this.intervals].sort((a,b)=>a-b),samples=sorted.length;
    return {phase:this.phase,samples,fps:+(1000*samples/sorted.reduce((a,b)=>a+b,0)).toFixed(1),p95FrameMs:+sorted[Math.ceil(samples*.95)-1].toFixed(1),maxFrameMs:+sorted[samples-1].toFixed(1),slowFrames:sorted.filter(value=>value>50).length,maxSubmitMs:+this.maxSubmit.toFixed(1),slowFrameSamples:this.intervals.flatMap((value,index)=>value>50?[index+1]:[]).slice(0,16)};
  }
  add(phase:MotionPhase|null,interval:number,submission=0){
    const changed=phase!==this.phase;
    if(changed){
      const finished=this.summary();if(finished){this.history.push(finished);if(this.history.length>12)this.history.shift();}
      this.phase=phase;this.intervals=[];this.maxSubmit=0;
    }else if(phase&&Number.isFinite(interval)&&interval>0){
      // The first frame after an idle period isn't a continuous animation interval.
      this.intervals.push(interval);if(this.intervals.length>2400)this.intervals.shift();
    }
    this.maxSubmit=Math.max(this.maxSubmit,submission);
    if(!changed&&this.intervals.length%30!==0)return null;
    return {completed:[...this.history],current:this.summary()};
  }
}
