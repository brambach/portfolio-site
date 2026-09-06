export type SavedRace={elapsed:number;id:string|null;name:string;saved:boolean};
export function readRaceResult():SavedRace|null{try{const value=JSON.parse(localStorage.getItem('bryce-last-race')??'null');return value&&Number.isFinite(value.elapsed)&&value.elapsed>0&&typeof value.name==='string'&&typeof value.saved==='boolean'&&(value.id===null||typeof value.id==='string')?value:null;}catch{return null;}}
export function saveRaceResult(value:SavedRace){try{localStorage.setItem('bryce-last-race',JSON.stringify(value));}catch{}}
