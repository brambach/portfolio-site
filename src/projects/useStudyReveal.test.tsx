import {StrictMode,useRef} from 'react';
import {render,screen,act} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useStudyReveal} from './useStudyReveal';

function Collection(){const root=useRef<HTMLDivElement>(null);useStudyReveal(root,'collection');return <div ref={root}><a className="ps-project" href="#project">Project</a></div>;}
afterEach(()=>vi.unstubAllGlobals());

it('re-observes unrevealed cards after StrictMode restarts the effect',()=>{
  const observers:{callback:IntersectionObserverCallback;targets:Element[];disconnected:boolean}[]=[];
  vi.stubGlobal('IntersectionObserver',class{
    record:{callback:IntersectionObserverCallback;targets:Element[];disconnected:boolean};
    constructor(callback:IntersectionObserverCallback){this.record={callback,targets:[],disconnected:false};observers.push(this.record);}
    observe(target:Element){this.record.targets.push(target);}
    unobserve(){}
    disconnect(){this.record.disconnected=true;}
  });
  const view=render(<StrictMode><Collection/></StrictMode>);
  const card=screen.getByRole('link',{name:'Project'});
  expect(observers).toHaveLength(2);
  expect(observers[0].disconnected).toBe(true);
  expect(observers[1].targets).toContain(card);
  act(()=>observers[1].callback([{isIntersecting:true,target:card,time:0,intersectionRatio:1,boundingClientRect:card.getBoundingClientRect(),intersectionRect:card.getBoundingClientRect(),rootBounds:null}],{} as IntersectionObserver));
  expect(card).toHaveAttribute('data-revealed','true');
  view.unmount();
  expect(observers[1].disconnected).toBe(true);
});

it('removes pending animation state when observation is disconnected',()=>{
  vi.stubGlobal('IntersectionObserver',class{observe(){}unobserve(){}disconnect(){}});
  const view=render(<Collection/>);const card=screen.getByRole('link',{name:'Project'});
  expect(card).toHaveAttribute('data-reveal');view.unmount();
  expect(card).not.toHaveAttribute('data-reveal');
});
