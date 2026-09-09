import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function InspectImage({src,alt,label='Inspect the screen'}:{src:string;alt:string;label?:string}) {
  const [open,setOpen]=useState(false);
  return <><button className="ps-inspect-trigger" onClick={()=>setOpen(true)}>{label} <span aria-hidden="true">+</span></button>{open&&<ImageDialog src={src} alt={alt} close={()=>setOpen(false)}/>}</>;
}
function ImageDialog({src,alt,close}:{src:string;alt:string;close:()=>void}){
  const prior=useRef(document.activeElement as HTMLElement);
  const dialog=useRef<HTMLDialogElement>(null);
  const [zoom,setZoom]=useState(false);
  useEffect(()=>{dialog.current?.showModal();return()=>{requestAnimationFrame(()=>{if(prior.current?.isConnected)prior.current.focus({preventScroll:true});});};},[]);
  return createPortal(<dialog ref={dialog} className="ps-inspector" aria-label={alt} onCancel={event=>{event.preventDefault();event.stopPropagation();close();}} onKeyDown={event=>event.stopPropagation()}><header><span>{alt}</span><div><button aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?'Fit to screen':'View full size'}</button><button onClick={close}>Close ×</button></div></header><div className={`ps-inspector__image ${zoom?'is-zoomed':''}`} tabIndex={0} aria-label="Image. Scroll to inspect when zoomed."><img src={src} alt={alt}/></div></dialog>,document.body);
}
