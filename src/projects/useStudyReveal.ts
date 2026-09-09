import {useEffect, type RefObject} from 'react';

export function useStudyReveal(root:RefObject<HTMLElement|null>,identity:string){
  useEffect(()=>{
    const element=root.current;
    if(!element||typeof IntersectionObserver==='undefined'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const observed=new Set<Element>();
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.setAttribute('data-revealed','true');observer.unobserve(entry.target);}
    },{threshold:.08});
    const observe=()=>element.querySelectorAll('.ps-editorial,.ps-editorial__pair>div,.ps-arro__moment,.ps-project,.ps-next').forEach(node=>{
      if(observed.has(node)||node.getAttribute('data-revealed')==='true')return;
      observed.add(node);node.setAttribute('data-reveal','');observer.observe(node);
    });
    observe();
    const changes=new MutationObserver(observe);changes.observe(element,{childList:true,subtree:true});
    return()=>{observer.disconnect();changes.disconnect();for(const node of observed)if(node.getAttribute('data-revealed')!=='true')node.removeAttribute('data-reveal');};
  },[root,identity]);
}
