import {afterEach,expect,it,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RaceTimes,TimeToBeat} from './RaceTimes';
afterEach(()=>vi.unstubAllGlobals());
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
