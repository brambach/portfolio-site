import {useEffect,useState} from 'react';
import Entrance from './Entrance';

// This review is reachable only in development with both lifecycle and profile query parameters.
export default function SceneLifecycleReview(){
  const [mounted,setMounted]=useState(false),[samples,setSamples]=useState<object[]>([]),[cancelCompilation,setCancelCompilation]=useState(false);
  const [cancelMotion,setCancelMotion]=useState('none');
  const [cancelCar,setCancelCar]=useState(false),[cancelTerrain,setCancelTerrain]=useState(false);
  useEffect(()=>{
    const record=(event:Event)=>{
      const sample=(event as CustomEvent<{stage:string}>).detail;setSamples(previous=>[...previous.slice(-19),sample]);
      if((cancelTerrain&&sample.stage==='terrain-started')||(cancelCompilation&&sample.stage==='compiling')||(cancelCar&&sample.stage==='car-parts-started')||sample.stage===cancelMotion)setMounted(false);
    };
    window.addEventListener('scene-lifetime',record);return()=>window.removeEventListener('scene-lifetime',record);
  },[cancelCompilation,cancelMotion,cancelCar,cancelTerrain]);
  return <>
    {mounted&&<Entrance/>}
    <aside aria-label="Scene lifecycle review" style={{position:'fixed',zIndex:1000,left:16,top:16,padding:16,background:'#fff',color:'#111',maxHeight:'40vh',overflow:'auto',fontFamily:'monospace',fontSize:12}}>
      <button onClick={()=>setMounted(value=>!value)}>{mounted?'Unmount scene':'Mount scene'}</button>
      <button disabled={!mounted} onClick={()=>document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()}>Simulate graphics reset</button>
      <label><input type="checkbox" checked={cancelTerrain} onChange={event=>setCancelTerrain(event.target.checked)}/>Cancel during terrain setup</label>
      <label><input type="checkbox" checked={cancelCompilation} onChange={event=>setCancelCompilation(event.target.checked)}/>Cancel during shader compilation</label>
      <label><input type="checkbox" checked={cancelCar} onChange={event=>setCancelCar(event.target.checked)}/>Cancel during car construction</label>
      <label>Cancel during motion preparation <select value={cancelMotion} onChange={event=>setCancelMotion(event.target.value)}>
        <option value="none">None</option>
        <option value="entry-shadow-preparing">Entry</option>
        <option value="ignition-shadow-preparing">Ignition</option>
      </select></label>
      <pre aria-label="Scene resource samples">{JSON.stringify(samples,null,2)}</pre>
    </aside>
  </>;
}
