/// <reference types="vite/client" />
import type {WebGLRenderer} from 'three';
import {Mesh,Line,Points,Sprite,type Object3D,type BufferGeometry} from 'three';
import {ProfileSamples} from './profile-samples';
import {MotionProfile,type MotionPhase} from './motion-profile';
import {createGpuTiming,type GpuSample} from './gpu-timing';

// Opt-in local diagnostics. Nothing is displayed or collected in production.
export function createSceneProfile(renderer: WebGLRenderer) {
  const enabled = import.meta.env.DEV && new URLSearchParams(location.search).has('profile');
  if (!enabled) return { dispose(){}, gpuBegin(){}, gpuEnd(){}, watch(_root:Object3D){}, stage(_name:string){}, mark(_name:string){}, motion(_phase:MotionPhase|null,_interval:number,_submission?:number,_frameAt?:number){}, begin() { return 0; }, end(_start: number, _interval: number, _distance: number, _driving: boolean) {} };
  const sustained=new URLSearchParams(location.search).get('profile')==='journey';
  const gpuRequested=new URLSearchParams(location.search).has('gpuProfile');
  const gl=renderer.getContext();
  const gpuSamples:GpuSample[]=[],gpuStalls:GpuSample[]=[];let gpuCount=0;
  const gpu=gpuRequested?createGpuTiming(gl,sample=>{
    gpuSamples.push({at:sample.at,ms:+sample.ms.toFixed(3)});if(gpuSamples.length>600)gpuSamples.shift();
    if(sample.ms>20){gpuStalls.push(gpuSamples[gpuSamples.length-1]);if(gpuStalls.length>32)gpuStalls.shift();}
    if(++gpuCount%30===0||sample.ms>20)renderer.domElement.dataset.sceneGpu=JSON.stringify({count:gpuCount,samples:gpuSamples,slow:gpuStalls});
  }):{supported:false,poll(){},begin(_at:number){},end(){},dispose(){}};
  renderer.domElement.dataset.sceneCapabilities=JSON.stringify({gpuTimer:gpuRequested?gpu.supported:null,gpuTimerRequested:gpuRequested,parallelShaderCompile:renderer.extensions.has('KHR_parallel_shader_compile')});
  const windows=new ProfileSamples(),motions=new MotionProfile();
  const lifetime=(stage:'terrain-started'|'compiling'|'ready'|'disposed'|'car-parts-started'|'entry-shadow-preparing'|'ignition-shadow-preparing')=>window.dispatchEvent(new CustomEvent('scene-lifetime',{detail:{stage,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length??0,contextLost:renderer.getContext().isContextLost()}}));
  const loadedAt=performance.now(),stages:{name:string;elapsedMs:number;resources:{geometries:number;textures:number;programs:number}}[]=[];
  const slowTasks:object[]=[];
  const loadingStalls:PerformanceEntry[]=[];let readyAt=Infinity;
  const motionStalls:object[]=[];
  const workStalls:object[]=[];
  let markAt=0,work:{name:string;ms:number}[]=[];
  const resourceCounts=()=>({geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length??0});
  let beforeWork=resourceCounts();
  const seenGeometry=new WeakSet<BufferGeometry>();
  let firstDraws:object[]=[];
  let lastMotionPhase:MotionPhase|null=null;
  const observer=typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')?new PerformanceObserver(list=>{
    for(const entry of list.getEntries()){
      slowTasks.push(entry.toJSON());
      if(entry.startTime<readyAt)loadingStalls.push(entry);
    }
    loadingStalls.sort((a,b)=>b.duration-a.duration);loadingStalls.splice(8);
    renderer.domElement.dataset.sceneLoadingStalls=JSON.stringify(loadingStalls.map(entry=>entry.toJSON()));
    if(slowTasks.length>16)slowTasks.splice(0,slowTasks.length-16);
    renderer.domElement.dataset.sceneLongFrames=JSON.stringify(slowTasks);
  }):null;
  observer?.observe({type:'long-animation-frame'});
  const frames: number[] = [];
  const submissions: number[] = [];
  let calls = 0, triangles = 0, wasDriving=false;
  if (enabled) renderer.info.autoReset = false;
  return {
    dispose(){gpu.dispose();observer?.disconnect();lifetime('disposed');},
    gpuBegin(){gpu.begin(performance.now());},
    gpuEnd(){gpu.end();},
    watch(root:Object3D){root.traverse(object=>{
      if(!(object instanceof Mesh || object instanceof Line || object instanceof Points || object instanceof Sprite))return;
      const previous=object.onBeforeRender;
      object.onBeforeRender=function(renderer,scene,camera,geometry,material,group){
        if(!seenGeometry.has(geometry)){
          seenGeometry.add(geometry);
          firstDraws.push({object:object.name,objectType:object.type,parent:object.parent?.name,geometry:geometry.type,material:material.type});
        }
        previous.call(this,renderer,scene,camera,geometry,material,group);
      };
    });},
    stage(name:string){if(name==='ready')readyAt=performance.now();if(stages.length>=24)stages.shift();stages.push({name,elapsedMs:Math.round(performance.now()-loadedAt),resources:resourceCounts()});renderer.domElement.dataset.sceneLoading=JSON.stringify(stages);if(name==='terrain-started'||name==='ready'||name==='compiling'||name==='car-parts-started'||name==='entry-shadow-preparing'||name==='ignition-shadow-preparing')lifetime(name);},
    mark(name:string){const now=performance.now();work.push({name,ms:+(now-markAt).toFixed(2)});markAt=now;},
    motion(phase:MotionPhase|null,interval:number,submission=0,frameAt=performance.now()){
      if(!document.hidden && phase && phase===lastMotionPhase && interval>50){
        motionStalls.push({phase,frameAt,interval,submission,observedAt:performance.now()});
        if(motionStalls.length>32)motionStalls.shift();
        renderer.domElement.dataset.sceneMotionStalls=JSON.stringify(motionStalls);
      }
      lastMotionPhase=document.hidden?null:phase;
      const result=motions.add(document.hidden?null:phase,interval,submission);if(result)renderer.domElement.dataset.sceneMotion=JSON.stringify({...result,work:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}});},
    begin() {
      gpu.poll();
      if (enabled) renderer.info.reset();
      work=[];firstDraws=[];beforeWork=resourceCounts();markAt=performance.now();return markAt;
    },
    end(start: number, interval: number, distance: number, driving: boolean) {
      const elapsed=performance.now()-start;
      if(!document.hidden&&elapsed>20){
        workStalls.push({at:start,ms:+elapsed.toFixed(2),work,before:beforeWork,after:resourceCounts(),firstDraws});
        if(workStalls.length>16)workStalls.shift();
        renderer.domElement.dataset.sceneWorkStalls=JSON.stringify(workStalls);
      }
      if(sustained && wasDriving && !driving)renderer.domElement.dataset.sceneProfile=JSON.stringify(windows.snapshot());
      wasDriving=driving;
      if(!driving || document.hidden)return;
      if(sustained){
        const summary=windows.add({interval,submission:performance.now()-start,distance,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:Number(renderer.domElement.dataset.effectiveRatio)||renderer.getPixelRatio()});
        if(summary)renderer.domElement.dataset.sceneProfile=JSON.stringify(summary);
        return;
      }
      if (distance < 25 || distance > 150 || interval > 250) return;
      frames.push(interval);
      submissions.push(performance.now() - start);
      calls += renderer.info.render.calls;
      triangles += renderer.info.render.triangles;
      if (frames.length % 30 !== 0) return;
      const sorted = [...frames].sort((a,b) => a-b);
      renderer.domElement.dataset.sceneProfile = JSON.stringify({
        samples: frames.length,
        distance: Math.round(distance),
        fps: +(1000 / (frames.reduce((a,b) => a+b,0) / frames.length)).toFixed(1),
        p95FrameMs: +sorted[Math.floor(sorted.length*.95)].toFixed(1),
        submitMs: +(submissions.reduce((a,b) => a+b,0)/frames.length).toFixed(1),
        calls: Math.round(calls/frames.length),
        triangles: Math.round(triangles/frames.length),
        pixelRatio: Number(renderer.domElement.dataset.effectiveRatio)||renderer.getPixelRatio(),
      });
    },
  };
}
