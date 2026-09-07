// Run locally. The browser collects the owner's password; only its hash goes to Redis.
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {loadEnv} from 'vite';
import {hashPassword,passwordKey} from '../server/garage';
import {command} from '../server/garage-store';
const env=loadEnv('development',process.cwd(),'');
for(const key of ['RACE_KV_REST_API_URL','RACE_KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'])if(env[key]&&!process.env[key])process.env[key]=env[key];
const csrf=randomBytes(32).toString('hex');
const port=3012,origin=`http://127.0.0.1:${port}`;
const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");
  if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);res.end();return;}
  try{
    if(req.method==='GET'&&req.url==='/'){
      if(await command('GET',passwordKey)){res.end('<h1>Your garage password is already set.</h1><p>This setup page can’t replace it.</p>');return;}
      res.end(`<!doctype html><html><title>Set your garage password</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#283e31;color:#eee7d6;font:16px system-ui;margin:0;padding:10vh 24px}main{max-width:420px;margin:auto}h1{font:42px Georgia}label{display:block;margin:22px 0 8px}input,button{box-sizing:border-box;width:100%;padding:14px;font:inherit;border:1px solid #bcb99d;border-radius:3px}button{margin-top:24px;background:#eee7d6;color:#283e31}p{line-height:1.6;color:#c5cbb7}</style><main><small>THE LONG WAY / OWNER SETUP</small><h1>Your garage key.</h1><p>Choose a unique password of at least 16 characters. Save it in your password manager. Only a salted password hash is stored.</p><form method="post" action="/"><input type="hidden" name="csrf" value="${csrf}"><label for="password">New garage password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="16" maxlength="128" required><label for="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autocomplete="new-password" minlength="16" maxlength="128" required><button>Create my garage key</button></form></main></html>`);return;
    }
    if(req.method!=='POST'||req.url!=='/'||req.headers.origin!==origin){res.writeHead(403);res.end();return;}
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048){res.writeHead(413);res.end();return;}}
    const form=new URLSearchParams(raw),password=form.get('password')??'';
    if(form.get('csrf')!==csrf||password.length<16||password.length>128||password!==form.get('confirm')){res.writeHead(400);res.end('<h1>Check your password.</h1><p>Use 16–128 characters and make both entries match.</p><a href="/">Try again</a>');return;}
    const saved=await command('SET',passwordKey,await hashPassword(password),'NX');
    res.end(saved?'<h1>Your garage key is ready.</h1><p>You can sign in at brycerambach.com/admin once the update is live.</p>':'<h1>The password is already set.</h1>');
    if(saved){console.log('Garage password configured. No password was logged.');server.close();}
  }catch{res.writeHead(503);res.end('<h1>Couldn’t save the key.</h1><p>Storage is unavailable. Try again shortly.</p>');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Owner setup: ${origin}`));
setTimeout(()=>server.close(),3600000).unref();
