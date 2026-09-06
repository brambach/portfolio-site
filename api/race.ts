import type {IncomingMessage,ServerResponse} from 'node:http';
import {raceApi} from '../server/race-api.js';
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse){
  let body=req.method==='GET'?{id:new URL(req.url??'/','http://localhost').searchParams.get('id')}:req.body;
  try{
    if(body===undefined&&req.method==='POST'){
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048){res.writeHead(413);res.end();return;}}
      body=JSON.parse(raw);
    }else if(typeof body==='string')body=JSON.parse(body);
    if(JSON.stringify(body??{}).length>2048){res.writeHead(413);res.end();return;}
  }catch{res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Invalid request.'}));return;}
  const result=await raceApi(req.method??'GET',body,String(req.headers['x-vercel-forwarded-for']??req.socket.remoteAddress??'unknown'));
  res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result.data));
}
