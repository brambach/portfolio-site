export type SavedRace={elapsed:number;id:string|null;name:string;saved:boolean};
function valid(value:unknown):value is SavedRace {
  if(!value||typeof value!=='object')return false;
  const race=value as SavedRace;
  return Number.isFinite(race.elapsed)&&race.elapsed>0&&typeof race.name==='string'&&typeof race.saved==='boolean'&&(race.id===null||typeof race.id==='string');
}
function read(key:string):SavedRace|null {
  try {const value:unknown=JSON.parse(localStorage.getItem(key)??'null');return valid(value)?value:null;}catch{return null;}
}
export function readRaceResult(){return read('bryce-last-race');}
export function readPersonalBest(){
  const best=read('bryce-best-race'),last=readRaceResult();
  return last&&(!best||last.elapsed<best.elapsed)?last:best;
}
export function saveRaceResult(value:SavedRace){
  if(!valid(value))return;
  const best=readPersonalBest();
  try {
    localStorage.setItem('bryce-last-race',JSON.stringify(value));
    if(!best||value.elapsed<=best.elapsed)localStorage.setItem('bryce-best-race',JSON.stringify(value));
    else localStorage.setItem('bryce-best-race',JSON.stringify(best));
  }catch{}
}
