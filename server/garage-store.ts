export type Command=(...args:(string|number)[])=>Promise<any>;
export const command:Command=async(...args)=>{
  const url=process.env.RACE_KV_REST_API_URL??process.env.UPSTASH_REDIS_REST_URL??process.env.KV_REST_API_URL;
  const token=process.env.RACE_KV_REST_API_TOKEN??process.env.UPSTASH_REDIS_REST_TOKEN??process.env.KV_REST_API_TOKEN;
  if(!url||!token)throw new Error('Storage unavailable');
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('Storage unavailable');
  const data=await response.json();if(data.error)throw new Error('Storage unavailable');return data.result;
};
