import {createTownDrive} from '../src/prototype/scenic-drive';
import {ReturnRace} from '../src/prototype/return-race';
import {writeFile} from 'node:fs/promises';

// AI exhibition driver. Reads road geometry and telemetry; writes only pedal and steering inputs.
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(a:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,a));
const real=process.argv.includes('--real');
const cap=Number(process.env.ASTRA_SPEED??56);
// Desired corner speed only. This doesn't alter the vehicle's grip or physics.
const cornerTarget=Number(process.env.ASTRA_CORNER_TARGET??10.3);
const lookFactor=Number(process.env.ASTRA_LOOK??.4);
const lane=Number(process.env.ASTRA_LANE??0);
const drive=createTownDrive(),race=new ReturnRace(drive);
// Set up the same parked lake starting pose used by the race review.
drive.reviewAt('lake');
let runId:string|undefined;
async function api(body:unknown){const r=await fetch('http://localhost:3003/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(JSON.stringify(data));return data;}
if(real)runId=(await api({action:'start'})).id;
const start=performance.now();race.start(start);
let ticks=0,contactFrames=0,maxSpeed=0,shoulderFrames=0;
const trace:unknown[]=[];
while(race.state.phase!=='finished'&&ticks<60*240){
 const now=start+ticks*1000/60;
 if(real){const delay=now-performance.now();if(delay>0)await new Promise(r=>setTimeout(r,delay));}
 race.update(real?performance.now():now);
 if(race.state.phase==='racing'){
  const road=drive.access?.road??drive.road,distance=drive.access?drive.accessDistance:drive.distance;
  const look=clamp(6+drive.speed*lookFactor,6,35);
  const target=road.frame(distance+look,drive.access?0:lane);
  const error=wrap(Math.atan2(target.point.x-drive.position.x,target.point.z-drive.position.z)-drive.yaw);
  const yawRate=2*drive.speed*Math.sin(error)/look;
  const wheel=Math.atan(yawRate*2.45/Math.max(.5,drive.speed));
  const desired=clamp(Math.sign(wheel)*Math.pow(Math.abs(wheel)*(1+drive.speed*.06)/.42,2/3),-1,1);
  drive.input('left',desired>drive.steering+.025);drive.input('right',desired<drive.steering-.025);
  let targetSpeed=drive.access?20:cap;
  for(const ahead of [8,20,40,65,100]){
   const a=road.frame(distance+ahead),b=road.frame(distance+ahead+8);
   const curvature=Math.abs(wrap(b.yaw-a.yaw))/8;
   const corner=Math.sqrt(cornerTarget/Math.max(.0001,curvature));
   targetSpeed=Math.min(targetSpeed,Math.sqrt(corner*corner+18*Math.max(0,ahead-12)));
  }
  drive.input('gas',drive.speed<targetSpeed);drive.input('brake',drive.speed>targetSpeed+1);
 }
 drive.update(1/60);
 ticks++;maxSpeed=Math.max(maxSpeed,drive.speed);
 if(drive.collisionTime>0)contactFrames++;
 if(Math.abs(drive.lane)>(drive.profile.pavedHalfWidth-1.1)&&!drive.access)shoulderFrames++;
 if(ticks%60===0)trace.push({seconds:ticks/60,speed:drive.speed,distance:drive.distance,lane:drive.lane,remaining:race.state.remaining});
 if(real&&ticks%600===0)console.log(JSON.stringify(trace.at(-1)));
}
const result={driver:'astra (AI no license)',mode:real?'wall-clock headless AI exhibition':'practice simulation',finished:race.state.phase==='finished',elapsed:Math.floor(race.state.elapsed),runId,maxSpeed,contactFrames,shoulderFrames,cap,cornerTarget,lane,lookFactor,trace};
await writeFile(real?'.codex/review/astra-real-run.json':'.codex/review/astra-practice.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,trace:undefined}));
if(real&&result.finished){await api({action:'finish',id:runId,elapsed:result.elapsed});console.log('Finished run registered. Not published.');}
