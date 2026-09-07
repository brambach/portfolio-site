import type {IncomingMessage,ServerResponse} from 'node:http';
import {garageApi,journeyApi,sameOrigin} from './garage.js';
export async function garageHandler(req:IncomingMessage&{body?:unknown},res:ServerResponse,journey=false){
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Robots-Tag','noindex, nofollow');
  const send=(status:number,data:unknown)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  const method=req.method??'GET';
  if(!['GET','POST'].includes(method)||(journey&&method!=='POST'))return send(405,{error:'Method not allowed.'});
  if(method==='POST'&&!sameOrigin(req.headers.origin))return send(403,{error:'Request not allowed.'});
  let body=req.body;
  try{
    if(method==='POST'){
      if(!String(req.headers['content-type']).startsWith('application/json'))return send(415,{error:'Use JSON.'});
      if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return send(413,{error:'Request too large.'});}body=JSON.parse(raw);}
      else if(typeof body==='string')body=JSON.parse(body);
      if(JSON.stringify(body).length>2048)return send(413,{error:'Request too large.'});
    }
    const ip=String(req.headers['x-vercel-forwarded-for']??req.socket.remoteAddress??'unknown');
    const result=journey?await journeyApi(body,ip):await garageApi(method,body,req.headers.cookie??'',ip);
    if('setCookie' in result&&result.setCookie)res.setHeader('Set-Cookie',result.setCookie);
    send(result.status,result.data);
  }catch{send(400,{error:'Invalid request.'});}
}
