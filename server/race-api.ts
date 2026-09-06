import {createHash,randomUUID} from 'node:crypto';

type Command=(...args:(string|number)[])=>Promise<any>;
const board='portfolio:race:v1:board';
export async function raceApi(method:string,body:unknown,ip:string,command?:Command){
  const reply=(status:number,data:unknown)=>({status,data});
  if(!['GET','POST'].includes(method))return reply(405,{error:'Method not allowed.'});
  if(!command){
    const url=process.env.RACE_KV_REST_API_URL??process.env.UPSTASH_REDIS_REST_URL??process.env.KV_REST_API_URL,token=process.env.RACE_KV_REST_API_TOKEN??process.env.UPSTASH_REDIS_REST_TOKEN??process.env.KV_REST_API_TOKEN;
    if(!url||!token)return reply(503,{error:'The shared leaderboard isn’t connected yet.'});
    command=async(...args)=>{
      const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(5000)});
      if(!response.ok)throw new Error('Leaderboard unavailable');
      const data=await response.json();if(data.error)throw new Error('Leaderboard unavailable');return data.result;
    };
  }
  try{
    if(method==='GET'){
      const rows=await command('ZRANGE',board,0,199);
      const all=rows.map((row:string)=>JSON.parse(row));
      const id=body&&typeof body==='object'?(body as {id?:unknown}).id:null;
      const index=typeof id==='string'?all.findIndex((entry:{id:string})=>entry.id===id):-1;
      return reply(200,{entries:all.slice(0,20),...(id?{rank:index<0?null:index+1}:{})});
    }
    if(!body||typeof body!=='object')return reply(400,{error:'Invalid request.'});
    const data=body as Record<string,unknown>;
    const rateKey=`portfolio:race:rate:${createHash('sha256').update(ip).digest('hex')}:${Math.floor(Date.now()/60000)}`;
    const count=await command('INCR',rateKey);if(count===1)await command('EXPIRE',rateKey,120);
    if(count>30)return reply(429,{error:'A few too many requests. Try again shortly.'});
    if(data.action==='start'){
      const id=randomUUID();await command('SET',`portfolio:race:run:${id}`,JSON.stringify({started:Date.now()}),'EX',3600);
      return reply(200,{id});
    }
    if(typeof data.id!=='string'||! /^[a-f0-9-]{36}$/.test(data.id))return reply(400,{error:'Start a new run first.'});
    const key=`portfolio:race:run:${data.id}`;
    const raw=await command('GET',key);if(!raw)return reply(410,{error:'This run has expired. Try another lap.'});
    const run=JSON.parse(raw);
    if(data.action==='finish'){
      const elapsed=data.elapsed;
      if(typeof elapsed!=='number'||!Number.isInteger(elapsed)||elapsed<20000||elapsed>1800000||elapsed>Date.now()-run.started+5000)return reply(400,{error:'That race time couldn’t be accepted.'});
      const result=await command('EVAL',`local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local run=cjson.decode(raw); if not run.elapsed then run.elapsed=tonumber(ARGV[1]); redis.call('SET',KEYS[1],cjson.encode(run),'KEEPTTL') end; return 1`,1,key,elapsed);
      return reply(result?200:410,{finished:!!result});
    }
    if(data.action!=='publish')return reply(400,{error:'Unknown race action.'});
    const name=typeof data.name==='string'?data.name.normalize('NFKC').trim():'';
    if(!/^[\p{L}\p{N} ._'’():!?-]{1,24}$/u.test(name)||!/[\p{L}\p{N}]/u.test(name))return reply(400,{error:'Use 1–24 letters, numbers, spaces or simple punctuation.'});
    if(!run.elapsed)return reply(400,{error:'Finish the run before posting a time.'});
    const entry=JSON.stringify({id:data.id,name,elapsed:run.elapsed});
    const saved=await command('EVAL',`local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local run=cjson.decode(raw); if not run.elapsed then return 0 end; if not run.published then redis.call('ZADD',KEYS[2],run.elapsed,ARGV[1]); redis.call('ZREMRANGEBYRANK',KEYS[2],200,-1); run.published=true; redis.call('SET',KEYS[1],cjson.encode(run),'KEEPTTL') end; return 1`,2,key,board,entry);
    return reply(saved?200:410,{saved:!!saved});
  }catch{return reply(503,{error:'The leaderboard is taking a breather. Your time is still here.'});}
}
