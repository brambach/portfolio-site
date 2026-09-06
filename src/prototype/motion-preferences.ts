const key='bryce-portfolio-reduce-motion';
export function readMotionPreference(){try{return localStorage.getItem(key)==='true';}catch{return false;}}
export function saveMotionPreference(reduce:boolean){try{localStorage.setItem(key,String(reduce));}catch{/* The current visit still uses the selected setting. */}}
