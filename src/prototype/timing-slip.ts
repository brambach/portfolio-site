import {raceTime} from './return-race';
const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
export function timingSlip(name:string,elapsed:number){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#eee7d6"/><g fill="#344733"><text x="90" y="130" font-family="monospace" font-size="25" letter-spacing="3">THE LONG WAY / TIMING SLIP</text><path d="M90 185H990M90 770H990" stroke="#82765a" stroke-dasharray="8 8"/><text x="90" y="310" font-family="Georgia,serif" font-size="70">Back where we started.</text><text x="90" y="435" font-family="monospace" font-size="28">THE LAKE TO HOME</text><text x="90" y="580" font-family="monospace" font-size="115">${raceTime(elapsed)}</text><text x="90" y="685" font-family="sans-serif" font-size="34">${escape(name.trim().slice(0,24)||'A passing driver')}</text><text x="90" y="890" font-family="Georgia,serif" font-size="42">Your turn. Take the long way.</text><text x="90" y="1200" font-family="monospace" font-size="27">brycerambach.com</text></g></svg>`;
}
export function downloadTimingSlip(name:string,elapsed:number){
 const url=URL.createObjectURL(new Blob([timingSlip(name,elapsed)],{type:'image/svg+xml'}));
 const link=document.createElement('a');link.href=url;link.download='the-long-way-timing-slip.svg';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function challengeLink(id:string){return 'https://brycerambach.com/?challenge='+encodeURIComponent(id);}
