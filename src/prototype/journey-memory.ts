const key='bryce-journey-v2';
export type JourneyMemory={onboarded:boolean;lake:boolean;discoveries:string[]};
const known=['card','racket','journal','laptop','cafe','tennis','lake','coffee'];
export function readJourneyMemory():JourneyMemory{
  try{const value=JSON.parse(localStorage.getItem(key)??'null');return {onboarded:value?.onboarded===true,lake:value?.lake===true,discoveries:Array.isArray(value?.discoveries)?value.discoveries.filter((item:unknown)=>typeof item==='string'&&known.includes(item)):[]};}catch{return {onboarded:false,lake:false,discoveries:[]};}
}
export function rememberJourney(patch:Partial<JourneyMemory>){const next={...readJourneyMemory(),...patch};try{localStorage.setItem(key,JSON.stringify(next));}catch{}return next;}
export function rememberDiscovery(item:string){const memory=readJourneyMemory();return rememberJourney({discoveries:known.includes(item)?[...new Set([...memory.discoveries,item])]:memory.discoveries});}
export function resetJourneyMemory(){try{localStorage.removeItem(key);sessionStorage.removeItem('bryce-arrived');}catch{}}
