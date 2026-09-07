import {it,expect,vi,afterEach} from 'vitest';
import {garageApi,journeyApi,hashPassword,verifyPassword,cookieToken,sameOrigin,passwordKey} from './garage';
afterEach(()=>vi.unstubAllEnvs());
it('denies anonymous stats without fetching private counts',async()=>{
  const db=vi.fn();expect((await garageApi('GET',null,'','test',db)).status).toBe(401);expect(db).not.toHaveBeenCalled();
});
it('hashes and verifies the password without storing plaintext',async()=>{
  const password='test-only garage password';const hash=await hashPassword(password);
  expect(hash).not.toContain(password);expect(await verifyPassword(password,hash)).toBe(true);expect(await verifyPassword('different',hash)).toBe(false);expect(await verifyPassword(password,'invalid')).toBe(false);
});
it('limits failed logins before doing password work',async()=>{
  const db=vi.fn(async()=>9);expect((await garageApi('POST',{action:'login',password:'guess'},'','test',db)).status).toBe(429);expect(db).toHaveBeenCalledTimes(1);
});
it('issues a secure session only after a correct password and invalidates logout',async()=>{
  vi.stubEnv('VERCEL','1');const hash=await hashPassword('test-only garage password');const values=new Map([[passwordKey,hash]]);
  const db=vi.fn(async(...args:any[])=>{if(args[0]==='EVAL')return 1;if(args[0]==='GET')return values.get(args[1])??null;if(args[0]==='SET'){values.set(args[1],args[2]);return 'OK';}if(args[0]==='DEL'){values.delete(args[1]);return 1;}return null;});
  expect((await garageApi('POST',{action:'login',password:'wrong'},'','test',db)).status).toBe(401);
  const login=await garageApi('POST',{action:'login',password:'test-only garage password'},'','test',db);
  expect(login.status).toBe(200);expect(login.setCookie).toContain('HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=43200; Secure');
  const token=cookieToken(login.setCookie!);expect(token).toHaveLength(64);expect([...values.keys()].some(key=>key.includes(token!))).toBe(false);
  expect((await garageApi('POST',{action:'logout'},login.setCookie!,'test',db)).status).toBe(200);
  expect((await garageApi('GET',null,login.setCookie!,'test',db)).status).toBe(401);
});
it('rejects expired and malformed sessions',async()=>{
  expect(cookieToken('garage_session=<script>')).toBeNull();
  expect((await garageApi('GET',null,'garage_session='+'a'.repeat(64),'test',async()=>null)).status).toBe(401);
});
it('only accepts same-origin writes, never localhost on Vercel',()=>{
  vi.stubEnv('VERCEL','1');expect(sameOrigin('https://evil.example')).toBe(false);expect(sameOrigin(undefined)).toBe(false);expect(sameOrigin('http://localhost:3001')).toBe(false);expect(sameOrigin('https://www.brycerambach.com')).toBe(true);
});
it('rejects arbitrary event names and user content before storage',async()=>{
  const db=vi.fn();expect((await journeyApi({event:'password',session:'anything',source:'email@example.com'},'test',db)).status).toBe(400);expect(db).not.toHaveBeenCalled();
});
it('uses an atomic expiring event key so retries cannot increment twice',async()=>{
  const db=vi.fn(async(..._args:any[])=>0);const event={event:'car_entered',session:'12345678-1234-1234-1234-123456789abc',source:'direct'};
  expect((await journeyApi(event,'test',db)).status).toBe(200);
  expect(db.mock.calls[0][0]).toBe('EVAL');expect(db.mock.calls[0][1]).toContain("'NX','EX',86400");expect(db.mock.calls[0][4]).toContain(event.session+':car_entered');
});
it('reports rate limits and storage errors without claiming success',async()=>{
  const body={event:'visit',session:'12345678-1234-1234-1234-123456789abc',source:'x'};
  expect((await journeyApi(body,'test',async()=>-1)).status).toBe(429);expect((await journeyApi(body,'test',async()=>{throw Error();})).status).toBe(503);
});
it('accepts the bounded engagement signals without storing link or message content',async()=>{
 for(const event of ['project_opened','project_study_opened','contact_clicked','social_clicked','race_retried']){
  const db=vi.fn(async()=>1);
  const result=await journeyApi({event,session:'12345678-1234-1234-1234-123456789abc',source:'direct'},'test',db);
  expect(result.status).toBe(200);
  expect(db.mock.calls).toHaveLength(1);
 }
});
