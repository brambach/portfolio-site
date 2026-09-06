import {beforeAll,expect,it,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {JourneyMap} from './JourneyMap';

beforeAll(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
});

it('explains the required lake finish only during the first trip',()=>{
  const props={distance:100,visited:[],navigate:vi.fn(),close:vi.fn()};
  const view=render(<JourneyMap {...props} firstTrip/>);
  expect(screen.getByText('Your first trip ends at the lake. Café and tennis are optional.')).toBeInTheDocument();
  view.rerender(<JourneyMap {...props}/>);
  expect(screen.queryByText(/Your first trip ends/)).not.toBeInTheDocument();
});

it('restores cabin focus when destination selection closes the map',async()=>{
  const user=userEvent.setup(),navigate=vi.fn();
  const cabin=document.createElement('canvas');cabin.tabIndex=0;document.body.append(cabin);
  const restoreFocus=()=>cabin.focus();
  const view=render(<JourneyMap distance={100} visited={[]} navigate={navigate} close={vi.fn()} restoreFocus={restoreFocus}/>);
  await user.click(screen.getByRole('button',{name:/Tennis club/}));
  expect(navigate).toHaveBeenCalledWith('tennis');
  view.unmount();
  expect(cabin).toHaveFocus();
  cabin.remove();
});
