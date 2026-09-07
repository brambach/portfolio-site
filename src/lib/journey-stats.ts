export type JourneyEvent='visit'|'car_entered'|'lake_reached'|'race_started'|'race_finished'|'time_posted'|'scene_loading'|'scene_ready'|'scene_load_failed'|'scene_render_failed'|'intro_completed'|'ready_under_3s'|'ready_3_to_8s'|'ready_8_to_15s'|'ready_over_15s';
const sent=new Set<string>();
const pending=new Set<string>();
export function trackJourney(event:JourneyEvent){
  if(!import.meta.env.PROD||!['brycerambach.com','www.brycerambach.com'].includes(location.hostname)||location.pathname.startsWith('/admin'))return;
  if(['profile','drivingReview','phoneReview','capture'].some(key=>new URLSearchParams(location.search).has(key)))return;
  try{
    let session=sessionStorage.getItem('garage-visit');
    const created=Number(sessionStorage.getItem('garage-visit-created'));
    if(!session||Date.now()-created>12*3600000){session=crypto.randomUUID();sessionStorage.setItem('garage-visit',session);sessionStorage.setItem('garage-visit-created',String(Date.now()));}
    const key=session+':'+(event.startsWith('ready_')?'ready_timing':event);
    if(sent.has(key)||pending.has(key)||sessionStorage.getItem(key))return;
    const campaign=new URLSearchParams(location.search).get('utm_source')?.toLowerCase();
    let host='';try{host=new URL(document.referrer).hostname;}catch{}
    const source=campaign==='x'||campaign==='twitter'||/^(www\.)?(t\.co|x\.com|twitter\.com)$/.test(host)?'x':host.endsWith('linkedin.com')?'linkedin':host==='github.com'?'github':!host||host===location.hostname?'direct':'other';
    pending.add(key);
    void fetch('/api/journey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,session,source}),keepalive:true}).then(response=>{
      if(response.ok){sent.add(key);try{sessionStorage.setItem(key,'1');}catch{}}
    }).catch(()=>{}).finally(()=>pending.delete(key));
  }catch{/* Stats must never interrupt the journey. */}
}

export function recordSceneReady(elapsedMs:number){
  trackJourney('scene_ready');
  trackJourney(elapsedMs<3000?'ready_under_3s':elapsedMs<8000?'ready_3_to_8s':elapsedMs<15000?'ready_8_to_15s':'ready_over_15s');
}
