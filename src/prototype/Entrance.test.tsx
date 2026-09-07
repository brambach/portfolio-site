import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Entrance from './Entrance';

const scene = vi.hoisted(() => ({ fail: false, replayRace:vi.fn(()=>true), ringCall:vi.fn(), stopCall:vi.fn(), setSpeedHold:vi.fn(), honk:vi.fn(), reduceMotion: vi.fn(), stopEngine: vi.fn(), startDrive: vi.fn(), openMap: vi.fn(), openLaptop: vi.fn(), closeLaptop: vi.fn(), dispose: vi.fn() }));
vi.mock('./car-scene', () => ({
  createCarScene: vi.fn(async (host: HTMLElement, ready: () => void, arrived: (inside: boolean) => void) => {
    if (scene.fail) throw new Error('WebGL unavailable');
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Porsche cabin');
    const display = document.createElement('div');
    display.hidden = true;
    host.append(canvas, display);
    scene.openLaptop.mockImplementation(() => { display.hidden = false; host.dispatchEvent(new CustomEvent('car-laptop', { detail: 'reading' })); });
    scene.closeLaptop.mockImplementation(() => { display.hidden = true; host.dispatchEvent(new CustomEvent('car-laptop', { detail: 'idle' })); canvas.focus(); });
    scene.openMap.mockImplementation(()=>{canvas.focus();host.dispatchEvent(new Event("car-map"));});
    ready();
    return {
      screenElement: display,
      enter: () => { host.dispatchEvent(new Event('car-enter')); arrived(true); canvas.focus(); },
      exit: () => arrived(false), center: vi.fn(), look: vi.fn(), mute: vi.fn(), volume: vi.fn(), reduceMotion: scene.reduceMotion, putDownObject: vi.fn(), rev: vi.fn(),
      replayRace:scene.replayRace, setSpeedHold:scene.setSpeedHold,honk:scene.honk,skipApproach:vi.fn(),
      ringCall:scene.ringCall,stopCall:scene.stopCall,setMusic:vi.fn(), allowIgnition: () => canvas.focus({preventScroll:true}), inspect: (item:string)=>host.dispatchEvent(new CustomEvent("car-artifact",{detail:item})),
      openMap: scene.openMap, stopEngine: scene.stopEngine, startDrive: scene.startDrive,
      openLaptop: scene.openLaptop, closeLaptop: scene.closeLaptop,
      dispose: () => { scene.dispose(); canvas.remove(); display.remove(); },
    };
  }),
}));
beforeAll(() => { HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');}; HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; });
afterEach(()=>{history.replaceState({},'', '/');});
beforeEach(() => { scene.fail = false; vi.clearAllMocks(); localStorage.removeItem('bryce-portfolio-reduce-motion'); localStorage.removeItem('bryce-journey-v2'); });

async function finishIntro(user: ReturnType<typeof userEvent.setup>) {
  if(!screen.queryByRole('button',{name:'Fine, show me your stuff'})) return;
  await user.click(screen.getByRole('button',{name:'Fine, show me your stuff'}));
  await user.click(await screen.findByRole('button',{name:/Ready for the road/}));
  await user.click(await screen.findByRole('button',{name:'Hand over the keys'}));
  scene.openLaptop.mockClear();scene.closeLaptop.mockClear();
}

it('leaves modified ignition keys available to browser shortcuts', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const canvas=screen.getByLabelText('Porsche cabin');
  for(const modifier of ['metaKey','ctrlKey','altKey']){
    expect(fireEvent.keyDown(canvas,{key:'k',code:'KeyK',[modifier]:true})).toBe(true);
  }
  expect(scene.startDrive).not.toHaveBeenCalled();
  fireEvent.keyDown(canvas,{key:'k',code:'KeyK'});
  expect(scene.startDrive).toHaveBeenCalledOnce();
});

it('returns keyboard focus to the cabin after skipping the approach', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await screen.findByRole('button',{name:'Get in the Porsche'});
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  await user.click(screen.getByRole('button',{name:'Skip approach'}));
  expect(screen.queryByRole('navigation',{name:'Site menu'})).not.toBeInTheDocument();
  expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
});

it('keeps projects available after a running scene becomes unavailable', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new Event('car-unavailable'));
  expect(scene.dispose).toHaveBeenCalledOnce();
  expect(document.querySelector('canvas')).toBeNull();
  expect(screen.getByRole('region',{name:'Scene unavailable'})).toHaveFocus();
  expect(screen.queryByRole('button',{name:'Turn the ignition key'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Open personal projects'}));
  await user.click(screen.getByRole('button',{name:/^trace:/}));
  expect(screen.getByRole('link',{name:'View source on GitHub ↗'})).toHaveAttribute('href','https://github.com/brambach/trace');
  expect(scene.openLaptop).not.toHaveBeenCalled();
});

describe('the cabin reading sequence', () => {
  it('uses the physical laptop inside and restores the seat when it closes', async () => {
    const user = userEvent.setup();
    render(<Entrance />);
    await user.click(await screen.findByRole('button', { name: 'Get in the Porsche' }));
  await finishIntro(user);
    expect(screen.queryByRole('button', { name: 'Face forward' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open site menu' }));
    await user.click(screen.getByRole('button', { name: 'Personal projects' }));
    expect(scene.openLaptop).toHaveBeenCalledOnce();
    expect(document.querySelector('dialog')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Project laptop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open site menu' })).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: /^arro:/ }));
    expect(screen.getByRole('heading', { name: 'arro' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('article'), { key: 'Escape' });
    expect(scene.closeLaptop).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Open site menu' }));
    await user.click(screen.getByRole('button', { name: 'Personal projects' }));
    expect(screen.getByRole('heading', { name: 'arro' })).toBeInTheDocument();
  });
  it('keeps projects available before entry and if the scene fails to load', async () => {
    scene.fail = true;
    const user = userEvent.setup();
    render(<Entrance />);
    await screen.findByText("The car couldn't load.");
    await user.click(screen.getByRole('button', { name: 'Open personal projects' }));
    expect(screen.getByRole('dialog', { name: 'Project laptop' }).tagName).toBe('DIALOG');
    expect(scene.openLaptop).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^throughline:/ }));
    expect(screen.getByRole('heading', { name: 'throughline' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Put down object' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

it('opens the journey map from the keyboard menu and returns focus to the cabin',async()=>{
  history.replaceState({},'', '/?journey');
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  expect(screen.queryByRole('navigation',{name:'Explore the cabin'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  await user.click(screen.getByRole('button',{name:'Route map'}));
  expect(scene.openMap).toHaveBeenCalledOnce();
  expect(screen.getByRole('dialog',{name:'Where to next?'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Close route map'}));
  expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
});


it('keeps the release cabin focused and provides contact before entry', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await screen.findByRole('button',{name:'Get in the Porsche'});
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  expect(screen.queryByRole('button',{name:'Photo board'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Route map'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'About & contact'}));
  expect(screen.getByRole('link',{name:/bryce.rambach@gmail.com/})).toHaveAttribute('href','mailto:bryce.rambach@gmail.com');
  await user.click(screen.getByRole('button',{name:'Put down object'}));
  await user.click(screen.getByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  expect(screen.queryByRole('navigation',{name:'Explore the cabin'})).not.toBeInTheDocument();
  expect(screen.queryByText('A tiny toll before the keys.')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Turn the ignition key'}));
  expect(scene.startDrive).toHaveBeenCalledOnce();
  expect(screen.queryByText('Look around. The laptop, racket and contact card are yours to pick up.')).not.toBeInTheDocument();
});

it('lets a parked visitor turn the engine off and resume from the same seat', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parked',overlook:true}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:900,gear:1,engineOn:true,automatic:true,collision:false,distance:2400,x:0,z:0,stop:'lake'}}));
  expect(screen.getByRole('heading',{name:'This one’s for the lake.'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Stay a little longer'}));
  await user.click(screen.getByRole('button',{name:'Turn engine off'}));
  expect(scene.stopEngine).toHaveBeenCalledOnce();
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:0,gear:1,engineOn:false,automatic:true,collision:false,distance:2400,x:0,z:0,stop:'lake'}}));
  expect(screen.getByRole('button',{name:'Engine off'})).toBeDisabled();
  expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
  await user.click(screen.getByRole('button',{name:'Back on the road'}));
  expect(scene.startDrive).toHaveBeenCalledOnce();
});


it('lets visitors reduce movement and restores the preference on the next mount',async()=>{
  const user=userEvent.setup(),view=render(<Entrance/>);await screen.findByRole('button',{name:'Get in the Porsche'});
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  await user.selectOptions(screen.getByRole('combobox',{name:'Movement'}),'reduce');
  expect(scene.reduceMotion).toHaveBeenLastCalledWith(true);expect(screen.getByRole('main')).toHaveClass('has-reduced-motion');
  view.unmount();render(<Entrance/>);await screen.findByRole('button',{name:'Get in the Porsche'});
  expect(scene.reduceMotion).toHaveBeenLastCalledWith(true);
  await user.click(screen.getByRole('button',{name:'Open site menu'}));await user.selectOptions(screen.getByRole('combobox',{name:'Movement'}),'device');
  expect(scene.reduceMotion).toHaveBeenLastCalledWith(false);expect(screen.getByRole('main')).not.toHaveClass('has-reduced-motion');
});

it('explains speed hold and announces its captured speed without reading every speedometer change',async()=>{
  history.replaceState({},'', '/?forest');
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  const telemetry={speed:0,rpm:900,gear:1,engineOn:true,automatic:false,speedHold:null as number|null,collision:false,distance:100,x:0,z:0,stop:null};
  const publish=(changes:Partial<typeof telemetry>)=>fireEvent(host,new CustomEvent('car-telemetry',{detail:{...telemetry,...changes}}));
  publish({});expect(screen.getByRole('button',{name:'Hold current speed'})).toBeDisabled();
  expect(screen.getByText('Reach 11 km/h to hold your speed. A / D steer.')).toBeInTheDocument();
  publish({speed:36});await user.click(screen.getByRole('button',{name:'Hold current speed'}));
  expect(scene.setSpeedHold).toHaveBeenLastCalledWith(true);
  publish({speed:36,speedHold:10});const announcement=screen.getByRole('status').textContent;
  expect(announcement).toContain('Holding 36 kilometres per hour');expect(announcement).toContain('Gas, brake or C releases');
  publish({speed:35,speedHold:10});expect(screen.getByRole('status').textContent).toBe(announcement);
  await user.click(screen.getByRole('button',{name:'Release speed hold'}));expect(scene.setSpeedHold).toHaveBeenLastCalledWith(false);
  await user.click(screen.getByRole('button',{name:'Honk horn'}));expect(scene.honk).toHaveBeenCalledOnce();
  publish({speed:34});expect(screen.getByRole('status')).not.toHaveTextContent('Holding 36');
});

it('keeps speed hold unavailable while parking and restores its driving guidance afterward',async()=>{
  history.replaceState({},'', '/?forest');
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:36,rpm:2800,gear:2,engineOn:true,automatic:false,turbo:false,speedHold:null,collision:false,distance:100,x:0,z:0,stop:null}}));
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parking',overlook:false}}));
  const hold=screen.getByRole('button',{name:'Hold current speed'});
  expect(hold).toBeDisabled();await user.click(hold);expect(scene.setSpeedHold).not.toHaveBeenCalled();
  expect(document.getElementById('driving-mode-help')).toHaveTextContent('Pulling over.');
  await user.click(screen.getByRole('button',{name:'Honk horn'}));expect(scene.honk).toHaveBeenCalledOnce();
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  expect(hold).toBeEnabled();expect(document.getElementById('driving-mode-help')).toHaveTextContent('C holds speed');
});

it('keeps ignition locked until the cabin tour finishes and offers projects at the lake',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  fireEvent.keyDown(screen.getByLabelText('Porsche cabin'),{key:'k',code:'KeyK'});
  expect(scene.startDrive).not.toHaveBeenCalled();
  expect(screen.queryByRole('button',{name:'Turn the ignition key'})).not.toBeInTheDocument();
  await finishIntro(user);
  await user.click(screen.getByRole('button',{name:'Turn the ignition key'}));
  expect(scene.startDrive).toHaveBeenCalledOnce();
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parked',overlook:true}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:900,gear:1,engineOn:true,automatic:true,collision:false,distance:2400,x:0,z:0,stop:'lake'}}));
  expect(screen.getByText(/My family lives by the lake/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Read the full portfolio ↗'})).toHaveAttribute('href','/projects');
  await user.click(screen.getByRole('button',{name:'Open my projects'}));
  expect(screen.getByRole('dialog',{name:'Project laptop'})).toBeInTheDocument();
});


it('stops the phone when the menu hides its controls and does not ring again', async () => {
  history.replaceState({}, '', '/?town');
  const user=userEvent.setup();
  render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  const telemetry={speed:36,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:1000,x:0,z:0,stop:null};
  fireEvent(host,new CustomEvent('car-telemetry',{detail:telemetry}));
  expect(await screen.findByRole('button',{name:'Answer'})).toBeInTheDocument();
  expect(scene.ringCall).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  expect(scene.stopCall).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button',{name:'Answer'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{...telemetry,distance:1010}}));
  expect(scene.ringCall).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button',{name:'Answer'})).not.toBeInTheDocument();
});

it.each(['Answer','Ignore'])('returns driving-key focus after %s on the phone', async action => {
  history.replaceState({}, '', '/?town');
  const user=userEvent.setup();
  render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const canvas=screen.getByLabelText('Porsche cabin'),host=canvas.parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:36,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:1000,x:0,z:0,stop:null}}));
  await user.click(await screen.findByRole('button',{name:action}));
  expect(canvas).toHaveFocus();
  expect(scene.stopCall).toHaveBeenCalledOnce();
});

it('returns driving-key focus after declining an optional stop', async () => {
  history.replaceState({}, '', '/?town');
  const user=userEvent.setup();
  render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const canvas=screen.getByLabelText('Porsche cabin'),host=canvas.parentElement!;
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:0,gear:1,engineOn:false,automatic:true,collision:false,distance:101,x:0,z:0,stop:null}}));
  await user.click(await screen.findByRole('button',{name:'Keep going'}));
  expect(canvas).toHaveFocus();
});

it('keeps keyboard ignition available immediately after handing over the keys', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
  await user.keyboard('k');
  expect(scene.startDrive).toHaveBeenCalledOnce();
});

it('returns focus to the cabin after staying at the lake or facing forward', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const canvas=screen.getByLabelText('Porsche cabin'),host=canvas.parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parked',overlook:true}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:0,gear:1,engineOn:false,automatic:true,collision:false,distance:2400,x:0,z:0,stop:'lake'}}));
  await user.click(screen.getByRole('button',{name:'Stay a little longer'}));
  expect(canvas).toHaveFocus();
  await user.click(screen.getByRole('button',{name:'Open site menu'}));
  await user.click(screen.getByRole('button',{name:'Face forward'}));
  expect(canvas).toHaveFocus();
});

it('shows autopilot guidance and keeps manual mode switches out of the outward tour',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  expect(screen.getByText('Autopilot · enjoy the view')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Hold current speed'})).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Accelerate'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Steer left'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Brake'})).toBeEnabled();
  await user.click(screen.getByRole('button',{name:'Honk horn'}));expect(scene.honk).toHaveBeenCalledOnce();
});

it('allows car shortcut letters in the leaderboard name without starting the engine',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-race',{detail:{phase:'finished',countdown:0,elapsed:41106,remaining:0,progress:1}}));
  const name=screen.getByLabelText('Name on the board');
  await user.type(name,'Rory Kirk');
  expect(name).toHaveValue('Rory Kirk');
  expect(scene.startDrive).not.toHaveBeenCalled();
  expect(name).toHaveFocus();
});
it('recognizes a completed introduction without requiring every object again',async()=>{
  localStorage.setItem('bryce-journey-v2',JSON.stringify({onboarded:true,lake:false,discoveries:['card']}));
  const user=userEvent.setup();render(<Entrance/>);await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  expect(screen.getByRole('region',{name:'Welcome back'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:/Back to the race/})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/Take another drive/}));expect(screen.getByRole('button',{name:'Turn the ignition key'})).toBeInTheDocument();
});

it('offers the race shortcut only after the lake and starts it explicitly',async()=>{
  localStorage.setItem('bryce-journey-v2',JSON.stringify({onboarded:true,lake:true,discoveries:['lake']}));
  const user=userEvent.setup();render(<Entrance/>);await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await user.click(screen.getByRole('button',{name:/Back to the race/}));expect(scene.replayRace).toHaveBeenCalledOnce();expect(screen.queryByRole('region',{name:'Welcome back'})).not.toBeInTheDocument();
});
