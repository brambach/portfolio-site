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
  await user.click(screen.getByRole('button',{name:/^02.*Tennis club/}));
  expect(navigate).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:/Take the scenic route.*Tennis club/}));
  expect(navigate).toHaveBeenCalledWith('tennis');
  view.unmount();
  expect(cabin).toHaveFocus();
  cabin.remove();
});

it('discloses the actual scenic route and keeps straight-there separate',async()=>{
  const user=userEvent.setup(),navigate=vi.fn(),goStraight=vi.fn();
  render(<JourneyMap distance={294.37} visited={['cafe']} navigate={navigate} goStraight={goStraight} close={vi.fn()}/>);
  await user.click(screen.getByRole('button',{name:/^05.*Lakeside/}));
  expect(screen.getByText(/Scenic route:/)).toHaveTextContent(/about/);
  expect(screen.getByText(/Scenic route:/)).toHaveTextContent(/extra lap|from here/);
  await user.click(screen.getByRole('button',{name:/Take the scenic route.*Lakeside/}));
  expect(navigate).toHaveBeenCalledWith('lake');
  expect(goStraight).not.toHaveBeenCalled();
});

it('offers straight-there without changing the scenic default',async()=>{
  const user=userEvent.setup(),navigate=vi.fn(),goStraight=vi.fn();
  render(<JourneyMap distance={294.37} visited={['cafe']} navigate={navigate} goStraight={goStraight} close={vi.fn()}/>);
  await user.click(screen.getByRole('button',{name:/^01.*Neighbourhood café/}));
  await user.click(screen.getByRole('button',{name:/Go straight there.*Neighbourhood café/}));
  expect(goStraight).toHaveBeenCalledWith('cafe');
  expect(navigate).not.toHaveBeenCalled();
});

it('closes the map instead of starting a same-stop scenic loop',async()=>{
  const user=userEvent.setup(),navigate=vi.fn(),goStraight=vi.fn(),close=vi.fn();
  render(<JourneyMap distance={294.37} visited={['cafe']} navigate={navigate} goStraight={goStraight} close={close} routePreview={()=>({
    id:'cafe',
    plannedDistance:4350,
    travelDistance:0,
    centreGap:45,
    extraLap:true,
    estimateSeconds:0,
    approximateSeconds:0,
    alreadyAtStop:true,
  })}/>);
  await user.click(screen.getByRole('button',{name:/^01.*Neighbourhood café/}));
  expect(screen.getByText("You're already here.")).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/Go straight there.*Neighbourhood café/})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/Back to the stop.*Neighbourhood café/}));
  expect(close).toHaveBeenCalledOnce();
  expect(navigate).not.toHaveBeenCalled();
  expect(goStraight).not.toHaveBeenCalled();
});
