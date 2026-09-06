import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RacePanel} from './RacePanel';
import {idleRace} from './return-race';
afterEach(()=>vi.unstubAllGlobals());
it('keeps a practice result visible when the shared board is unavailable',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'Unavailable'})})));
  render(<RacePanel race={{...idleRace,phase:'finished',elapsed:65000}} cancel={vi.fn()}/>);
  expect(screen.getByText('1:05.000')).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByText(/leaderboard was offline/)).toBeInTheDocument());
  expect(screen.getByRole('button',{name:'Leaderboard offline'})).toBeDisabled();
});
it('registers the finish before publishing a name and shows the shared result',async()=>{
  const calls:any[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
    const data=options?.body?JSON.parse(String(options.body)):null;calls.push(data);
    return {ok:true,json:async()=>data?.action==='start'?{id:'run'}:data?{saved:true}:{entries:[{id:'run',name:'Bryce',elapsed:65000}]}};
  }));
  const user=userEvent.setup(),view=render(<RacePanel race={{...idleRace,phase:'countdown'}} cancel={vi.fn()}/>);
  await waitFor(()=>expect(calls).toContainEqual({action:'start'}));
  view.rerender(<RacePanel race={{...idleRace,phase:'finished',elapsed:65000}} cancel={vi.fn()}/>);
  await user.type(screen.getByLabelText('Name on the board'),'Bryce');
  await user.click(screen.getByRole('button',{name:'Post my time'}));
  await screen.findByText('Your time is on the board.');
  expect(calls.indexOf(calls.find(call=>call?.action==='finish'))).toBeLessThan(calls.indexOf(calls.find(call=>call?.action==='publish')));
  expect(screen.getByRole('list',{name:'Leaderboard'})).toHaveTextContent('Bryce');
  expect(screen.getByRole('button',{name:'Time posted'})).toBeDisabled();
});

it('restores a published result without creating another race',async()=>{
 const fetcher=vi.fn(async(_url:string,_options?:RequestInit)=>({ok:true,json:async()=>({entries:[],rank:24})}));vi.stubGlobal('fetch',fetcher);
 render(<RacePanel race={{...idleRace,phase:'finished',elapsed:65000}} resume={{id:'old-run',elapsed:65000,name:'Rory',saved:true}} cancel={vi.fn()}/>);
 expect(screen.getByLabelText('Name on the board')).toHaveValue('Rory');
 expect(await screen.findByText('YOUR TIME / #24 ON THE BOARD')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Time posted'})).toBeDisabled();
 expect(fetcher.mock.calls.every(call=>call.length===1||!(call[1] as RequestInit)?.body)).toBe(true);
});
