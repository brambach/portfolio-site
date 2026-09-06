export type FrameSample={interval:number;submission:number;calls:number;triangles:number;distance:number;pixelRatio:number};
// Keep bounded windows so a long drive doesn't grow profiler memory indefinitely.
export class ProfileSamples {
  private frames:FrameSample[]=[];
  private windows:ReturnType<ProfileSamples['summarize']>[]=[];
  private count=0;
  private intervalMs=0;
  private submissionMs=0;
  private calls=0;
  private triangles=0;
  private slowFrames=0;
  private maxFrameMs=0;
  private minPixelRatio=Infinity;
  private maxPixelRatio=0;
  private firstDistance:number|null=null;
  private lastDistance:number|null=null;
  snapshot(){
    return {latest:this.windows.at(-1)??null,windows:[...this.windows],pendingSamples:this.frames.length,total:{
      samples:this.count,intervalMs:this.intervalMs,fps:this.count?1000*this.count/this.intervalMs:0,
      submitMs:this.count?this.submissionMs/this.count:0,calls:this.count?this.calls/this.count:0,
      triangles:this.count?this.triangles/this.count:0,slowFrames:this.slowFrames,maxFrameMs:this.maxFrameMs,
      minPixelRatio:this.count?this.minPixelRatio:null,maxPixelRatio:this.count?this.maxPixelRatio:null,
      firstDistance:this.firstDistance,lastDistance:this.lastDistance,
    }};
  }
  constructor(private readonly windowSize=240,private readonly historySize=60){}
  private summarize(){
    const samples=this.frames.length,mean=(key:'interval'|'submission'|'calls'|'triangles')=>this.frames.reduce((sum,f)=>sum+f[key],0)/samples;
    const sorted=this.frames.map(f=>f.interval).sort((a,b)=>a-b),last=this.frames[samples-1];
    return {samples,distance:Math.round(last.distance),fps:+(1000/mean('interval')).toFixed(1),p95FrameMs:+sorted[Math.ceil(samples*.95)-1].toFixed(1),maxFrameMs:+sorted[samples-1].toFixed(1),submitMs:+mean('submission').toFixed(1),calls:Math.round(mean('calls')),triangles:Math.round(mean('triangles')),pixelRatio:last.pixelRatio,slowFrames:this.frames.filter(f=>f.interval>50).length};
  }
  add(frame:FrameSample){
    if(!Number.isFinite(frame.interval)||frame.interval<=0)return null;
    this.count++;this.intervalMs+=frame.interval;this.submissionMs+=frame.submission;
    this.calls+=frame.calls;this.triangles+=frame.triangles;
    if(frame.interval>50)this.slowFrames++;
    this.maxFrameMs=Math.max(this.maxFrameMs,frame.interval);
    this.minPixelRatio=Math.min(this.minPixelRatio,frame.pixelRatio);this.maxPixelRatio=Math.max(this.maxPixelRatio,frame.pixelRatio);
    this.firstDistance??=frame.distance;this.lastDistance=frame.distance;
    this.frames.push(frame);if(this.frames.length<this.windowSize)return null;
    const summary=this.summarize();this.windows.push(summary);if(this.windows.length>this.historySize)this.windows.shift();this.frames=[];
    return {...this.snapshot(),latest:summary};
  }
}
