import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {command,type Command} from './garage-store.js';
export const passwordKey='portfolio:garage:v1:password';
export const steps=['visit','car_entered','lake_reached','race_started','race_finished','time_posted','scene_loading','scene_ready','scene_load_failed','scene_render_failed','intro_completed','ready_under_3s','ready_3_to_8s','ready_8_to_15s','ready_over_15s'] as const;
export const sources=['direct','x','linkedin','github','other'] as const;
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+(await derive(password,salt)).toString('hex');}
export async function verifyPassword(password:string,stored:string){
  const [salt,hash]=stored.split(':');if(!/^[a-f0-9]{32}$/.test(salt??'')||!/^[a-f0-9]{128}$/.test(hash??''))return false;
  return timingSafeEqual(await derive(password,salt),Buffer.from(hash,'hex'));
}
export function cookieToken(cookie:string){const token=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('garage_session='))?.slice(15);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
const sessionKey=(token:string)=>'portfolio:garage:v1:session:'+digest(token);
const rateScript="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
export function sameOrigin(origin:string|undefined){
  return origin==='https://www.brycerambach.com'||origin==='https://brycerambach.com'||(!process.env.VERCEL&&!!origin&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
}
export async function garageApi(method:string,body:any,cookie:string,ip:string,db:Command=command){
  const reply=(status:number,data:unknown,setCookie?:string)=>({status,data,setCookie});
  try{
    const token=cookieToken(cookie);
    const secure=process.env.VERCEL?'; Secure':'';
    if(method==='POST'&&body?.action==='login'){
      if(typeof body.password!=='string'||body.password.length<1||body.password.length>128)return reply(400,{error:'Enter your garage password.'});
      const attempts=await db('EVAL',rateScript,1,'portfolio:garage:v1:login:'+digest(ip),900);
      if(attempts>8)return reply(429,{error:'Too many attempts. Try again in 15 minutes.'});
      const stored=await db('GET',passwordKey);
      if(!stored)return reply(503,{error:'The garage password hasn’t been set up yet.'});
      if(!await verifyPassword(body.password,stored))return reply(401,{error:'That password didn’t unlock the garage.'});
      const next=randomBytes(32).toString('hex');await db('SET',sessionKey(next),'1','EX',43200);
      return reply(200,{ok:true},`garage_session=${next}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=43200${secure}`);
    }
    if(!token||!await db('GET',sessionKey(token)))return reply(401,{error:'Sign in to the garage.'});
    if(method==='POST'&&body?.action==='logout'){
      await db('DEL',sessionKey(token));return reply(200,{ok:true},`garage_session=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure}`);
    }
    if(method!=='GET')return reply(405,{error:'Method not allowed.'});
    const dates=Array.from({length:30},(_,i)=>new Date(Date.now()-(29-i)*86400000).toISOString().slice(0,10));
    const rows=await db('EVAL',"local out={}; for i,key in ipairs(KEYS) do out[i]=redis.call('HGETALL',key) end; return out",dates.length,...dates.map(day=>'portfolio:journey:v1:day:'+day));
    const daily=dates.map((date,i)=>{const fields=rows[i]??[];const counts:Record<string,number>={};for(let j=0;j<fields.length;j+=2)counts[fields[j]]=Number(fields[j+1]);return {date,counts};});
    const startedAt=await db('GET','portfolio:journey:v1:started');
    const board=(await db('ZRANGE','portfolio:race:v1:board',0,199)).map((row:string)=>JSON.parse(row));
    return reply(200,{daily,startedAt,board,updatedAt:new Date().toISOString()});
  }catch{return reply(503,{error:'The garage couldn’t reach its logbook. Try again shortly.'});}
}
export async function journeyApi(body:any,ip:string,db:Command=command){
  if(!body||!steps.includes(body.event)||typeof body.session!=='string'||!/^[a-f0-9-]{36}$/.test(body.session)||!sources.includes(body.source))return {status:400,data:{error:'Invalid event.'}};
  try{
    const day=new Date().toISOString().slice(0,10);
    const result=await db('EVAL',`local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; if n>60 then return -1 end
      if not redis.call('SET',KEYS[2],'1','NX','EX',86400) then return 0 end
      redis.call('HINCRBY',KEYS[3],ARGV[1],1)
      if ARGV[1]=='visit' then redis.call('HINCRBY',KEYS[3],'source:'..ARGV[2],1) end
      redis.call('EXPIRE',KEYS[3],7776000); redis.call('SET',KEYS[4],ARGV[3],'NX'); return 1`,4,
      'portfolio:journey:v1:rate:'+digest(ip),'portfolio:journey:v1:seen:'+body.session+':'+(body.event.startsWith('ready_')?'ready_timing':body.event),
      'portfolio:journey:v1:day:'+day,'portfolio:journey:v1:started',body.event,body.source,new Date().toISOString());
    return {status:result===-1?429:200,data:{ok:result!==-1}};
  }catch{return {status:503,data:{error:'Stats unavailable.'}};}
}
