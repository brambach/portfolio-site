import {afterEach,expect,it,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RaceTimes,TimeToBeat} from './RaceTimes';
afterEach(()=>{vi.unstubAllGlobals();window.history.replaceState({},'', '/');});
it('shows the actual fastest time at the lake',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({entries:[{id:'one',name:'bryce :)',elapsed:41106}]})})));
 render(<TimeToBeat open={vi.fn()}/>);
 expect(await screen.findByText('0:41.106')).toBeInTheDocument();
 expect(screen.getByText(/bryce/)).toBeInTheDocument();
});
it('allows a failed board request to be retried',async()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 const fetcher=vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true,json:async()=>({entries:[]})});vi.stubGlobal('fetch',fetcher);
 const user=userEvent.setup();render(<RaceTimes close={vi.fn()}/>);
 await user.click(await screen.findByRole('button',{name:'Try again'}));
 expect(await screen.findByText(/first lap is up for grabs/)).toBeInTheDocument();
});

it('uses the server target rather than a supplied time in the URL',async()=>{
 window.history.replaceState({},'', '/?challenge=real-run&elapsed=1');
 const fetcher=vi.fn(async(_url:string,_options?:RequestInit)=>({ok:true,json:async()=>({entries:[],target:{id:'real-run',name:'Rory',elapsed:43210}})}));
 vi.stubGlobal('fetch',fetcher);render(<TimeToBeat open={vi.fn()}/>);
 expect(await screen.findByText('0:43.210')).toBeInTheDocument();
 expect(fetcher.mock.calls[0][0]).toBe('/api/race?id=real-run');
});
it('explains an expired target instead of inventing a challenge',async()=>{
 window.history.replaceState({},'', '/?challenge=old');
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({entries:[],target:null})})));
 render(<TimeToBeat open={vi.fn()}/>);
 expect(await screen.findByText(/challenge has left the board/)).toBeInTheDocument();
});
