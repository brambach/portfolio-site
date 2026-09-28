import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Entrance from './Entrance';

const scene = vi.hoisted(() => ({ fail: false, replayRace:vi.fn(()=>true), routePreview:vi.fn(), ringCall:vi.fn(), stopCall:vi.fn(), setSpeedHold:vi.fn(), honk:vi.fn(), reduceMotion: vi.fn(), stopEngine: vi.fn(), startDrive: vi.fn(), navigate: vi.fn(), openMap: vi.fn(), goStraightTo: vi.fn(), openLaptop: vi.fn(), closeLaptop: vi.fn(), dispose: vi.fn() }));
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
      orderCoffee:vi.fn(), exit: () => arrived(false), center: vi.fn(), lookAtLake: vi.fn(), look: vi.fn(), mute: vi.fn(), volume: vi.fn(), reduceMotion: scene.reduceMotion, putDownObject: vi.fn(), rev: vi.fn(),
      replayRace:scene.replayRace, setSpeedHold:scene.setSpeedHold,honk:scene.honk,skipApproach:vi.fn(),
      ringCall:scene.ringCall,stopCall:scene.stopCall,setMusic:vi.fn(), allowIgnition: () => canvas.focus({preventScroll:true}), inspect: (item:string)=>host.dispatchEvent(new CustomEvent("car-artifact",{detail:item})),
      openMap: scene.openMap, routePreview: scene.routePreview, goStraightTo: scene.goStraightTo, navigate: scene.navigate, stopEngine: scene.stopEngine, startDrive: scene.startDrive,
      openLaptop: scene.openLaptop, closeLaptop: scene.closeLaptop,
      dispose: () => { scene.dispose(); canvas.remove(); display.remove(); },
    };
  }),
}));
beforeAll(() => { HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');}; HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; });
afterEach(()=>{cleanup();history.replaceState({},'', '/');vi.unstubAllGlobals();});
beforeEach(() => { scene.fail = false; vi.clearAllMocks(); scene.routePreview.mockReturnValue(undefined); localStorage.removeItem('bryce-portfolio-reduce-motion'); localStorage.removeItem('bryce-journey-v2'); sessionStorage.clear(); });

function mockMobileViewport(matches:boolean){
  let current=matches;
  const listeners=new Set<(event:MediaQueryListEvent)=>void>();
  const query={
    get matches(){return current;},
    media:'(max-width:700px)',
    onchange:null,
    addEventListener:vi.fn((_event:string,listener:(event:MediaQueryListEvent)=>void)=>listeners.add(listener)),
    removeEventListener:vi.fn((_event:string,listener:(event:MediaQueryListEvent)=>void)=>listeners.delete(listener)),
    addListener:vi.fn((listener:(event:MediaQueryListEvent)=>void)=>listeners.add(listener)),
    removeListener:vi.fn((listener:(event:MediaQueryListEvent)=>void)=>listeners.delete(listener)),
    dispatchEvent:vi.fn(()=>true),
  };
  vi.stubGlobal('matchMedia',vi.fn(()=>query));
  return {set(next:boolean){current=next;listeners.forEach(listener=>listener({matches:current,media:query.media} as MediaQueryListEvent));}};
}

async function finishIntro(user: ReturnType<typeof userEvent.setup>) {
  if(!screen.queryByRole('button',{name:'Meet Bryce'})) return;
  await user.click(screen.getByRole('button',{name:'Meet Bryce'}));
  await user.click(await screen.findByRole('button',{name:/Ready for the road/}));
  await user.click(await screen.findByRole('button',{name:'Start the journey'}));
  scene.openLaptop.mockClear();scene.closeLaptop.mockClear();
}

it('leaves modified ignition keys available to browser shortcuts', async () => {
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  scene.startDrive.mockClear();scene.navigate.mockClear();
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
  await user.click(screen.getByRole('link',{name:'View Lucid'}));
  expect(screen.getByRole('dialog',{name:'Lucid project'})).toBeInTheDocument();
  expect(scene.openLaptop).not.toHaveBeenCalled();
});

it('renders readable wrapped recovery actions in the unavailable scene section', async () => {
  scene.fail = true;
  render(<Entrance/>);
  const region=await screen.findByRole('region',{name:'Scene unavailable'});
  expect(region).toHaveFocus();
  const actions=screen.getByRole('group',{name:'Scene recovery actions'});
  expect(region).toContainElement(actions);
  const controls=[
    screen.getByRole('button',{name:'Try again'}),
    screen.getByRole('button',{name:'Open personal projects'}),
    screen.getByRole('link',{name:'Read without the scene'}),
    screen.getByRole('link',{name:'Contact Bryce'}),
  ];
  expect(controls.every(control=>actions.contains(control))).toBe(true);
  controls.forEach(control=>expect(control.parentElement).toBe(actions));
});

it('returns focus to the persistent site menu opener after race times cancel and close',async()=>{
  const fetcher=vi.fn(async()=>({ok:false,json:async()=>({})}));
  vi.stubGlobal('fetch',fetcher);
  const user=userEvent.setup();
  render(<Entrance/>);
  await screen.findByRole('button',{name:'Get in the Porsche'});
  const menuButton=screen.getByRole('button',{name:'Open site menu'});
  await user.click(menuButton);
  await user.click(screen.getByRole('button',{name:'Race times'}));
  await user.click(await screen.findByRole('button',{name:'Try again'}));
  const dialog=screen.getByRole('dialog',{name:'Race times.'});
  expect(fireEvent(dialog,new Event('cancel',{bubbles:false,cancelable:true}))).toBe(false);
  await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Race times.'})).not.toBeInTheDocument());
  expect(menuButton).toHaveFocus();

  await user.click(menuButton);
  await user.click(screen.getByRole('button',{name:'Race times'}));
  await user.click(await screen.findByRole('button',{name:'Try again'}));
  await user.click(screen.getByRole('button',{name:'Close race times'}));
  await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Race times.'})).not.toBeInTheDocument());
  expect(menuButton).toHaveFocus();
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
    await user.click(screen.getByRole('link', { name: 'View Arro' }));
    const viewer=screen.getByRole('dialog',{name:'Arro project'});
    fireEvent.keyDown(viewer,{key:'k',code:'KeyK'});
    expect(scene.startDrive).not.toHaveBeenCalled();
    fireEvent(viewer,new Event('cancel',{bubbles:true,cancelable:true}));
    await waitFor(()=>expect(screen.getByRole('link',{name:'View Arro'})).toHaveFocus());
    expect(scene.closeLaptop).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button',{name:'Close laptop and return to seat'}));
    expect(scene.closeLaptop).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Open site menu' }));
    await user.click(screen.getByRole('button', { name: 'Personal projects' }));
    expect(screen.getByRole('link', { name: 'View Arro' })).toHaveAttribute('aria-current','true');
  });
  it('keeps projects available before entry and if the scene fails to load', async () => {
    scene.fail = true;
    const user = userEvent.setup();
    render(<Entrance />);
    await screen.findByText("The car couldn't load.");
    await user.click(screen.getByRole('button', { name: 'Open personal projects' }));
    expect(screen.getByRole('dialog', { name: 'Project laptop' }).tagName).toBe('DIALOG');
    expect(scene.openLaptop).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: 'View Dervo' }));
    expect(screen.getByRole('dialog', { name: 'Dervo project' })).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'← All projects'}));
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

it('keeps scenic map navigation default and offers straight-through placement',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-laptop',{detail:'idle'}));
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parked',overlook:true}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:900,gear:1,engineOn:true,automatic:true,collision:false,distance:294.37,x:66,z:282,stop:'cafe'}}));
  await user.click(screen.getByRole('button',{name:'Route map'}));
  await user.click(screen.getByRole('button',{name:/^03.*Lakeside/}));
  await user.click(screen.getByRole('button',{name:/Take the scenic route.*Lakeside/}));
  expect(scene.goStraightTo).not.toHaveBeenCalled();
  expect(scene.navigate).toHaveBeenCalledWith('lake');
  await user.click(screen.getByRole('button',{name:'Route map'}));
  await user.click(screen.getByRole('button',{name:/Go straight there.*Tennis club/}));
  expect(await screen.findByText('Heading to Tennis club.')).toBeInTheDocument();
  await waitFor(()=>expect(scene.goStraightTo).toHaveBeenCalledWith('tennis'));
  await waitFor(()=>expect(screen.queryByText('Heading to Tennis club.')).not.toBeInTheDocument(),{timeout:1400});
});

it('explains a blocked forced lake approach and keeps controls reachable',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-route-blocked',{detail:{requested:'tennis',required:'lake'}}));
  expect(screen.getByText(/already committed to the lake turnout/)).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Go straight to Tennis club'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Stay on the approach'}));
  expect(screen.queryByText(/already committed/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Porsche cabin')).toHaveFocus();
  fireEvent(host,new CustomEvent('car-route-blocked',{detail:{requested:'tennis',required:'lake'}}));
  await user.click(screen.getByRole('button',{name:'Go straight to Tennis club'}));
  await waitFor(()=>expect(scene.goStraightTo).toHaveBeenCalledWith('tennis'));
  await waitFor(()=>expect(screen.queryByText('Heading to Tennis club.')).not.toBeInTheDocument(),{timeout:1400});
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
  expect(screen.queryByText('Before we go.')).not.toBeInTheDocument();
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
  expect(screen.getByRole('heading',{name:'Stay for a moment.'})).toBeInTheDocument();
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

it('keeps ignition locked until the cabin tour finishes and offers projects at Tahoe',async()=>{
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
  expect(screen.getByText(/Lake Tahoe means a lot to me/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Read the full portfolio ↗'})).toHaveAttribute('href','/work');
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

it('defers road notes while an optional stop card has priority',async()=>{
  history.replaceState({},'', '/?town');
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('complementary',{name:'Tennis courts ahead'})).toBeInTheDocument();
  expect(screen.getByRole('complementary',{name:'A little about Bryce'})).toHaveClass('is-deferred');
  await user.click(screen.getByRole('button',{name:'A little more'}));
  await user.click(screen.getByRole('button',{name:'Keep going'}));
  expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
});

it('moves focus from a newly hidden mobile road note to the optional stop action',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(true);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:190,x:0,z:0,stop:null}}));
  // The narrow note opens from its peek before it offers the longer read.
  await user.click(await screen.findByRole('button',{name:/a little about bryce/i}));
  await user.click(await screen.findByRole('button',{name:'A little more'}));
  expect(screen.getByRole('button',{name:'Less'})).toHaveFocus();
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('complementary',{name:'Tennis courts ahead'})).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:/Optional stop/})).toHaveFocus());
});

it('does not steal unrelated mobile focus when road notes become deferred',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(true);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  const honk=screen.getByRole('button',{name:'Honk horn'});
  honk.focus({preventScroll:true});
  await waitFor(()=>expect(honk).toHaveFocus());
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('complementary',{name:'Tennis courts ahead'})).toBeInTheDocument();
  expect(honk).toHaveFocus();
});

it('keeps desktop road note focus when the stop card defers without hiding it',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(false);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:190,x:0,z:0,stop:null}}));
  const more=await screen.findByRole('button',{name:'A little more'});
  more.focus();
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('complementary',{name:'Tennis courts ahead'})).toBeInTheDocument();
  expect(screen.getByRole('complementary',{name:'A little about Bryce'})).toHaveClass('is-deferred');
  expect(more).toHaveFocus();
});

it('hands focus to the stop action when a resize hides a focused deferred note',async()=>{
  history.replaceState({},'', '/?town');
  const viewport=mockMobileViewport(false);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('complementary',{name:'Tennis courts ahead'})).toBeInTheDocument();
  screen.getByRole('button',{name:'A little more'}).focus();
  viewport.set(true);
  await waitFor(()=>expect(screen.getByRole('button',{name:/Optional stop/})).toHaveFocus());
});

it('restores mobile road note controls after the stop invitation is dismissed',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(true);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:190,x:0,z:0,stop:null}}));
  await user.click(await screen.findByRole('button',{name:/a little about bryce/i}));
  await user.click(await screen.findByRole('button',{name:'A little more'}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  await user.click(await screen.findByRole('button',{name:/Optional stop/}));
  await user.click(await screen.findByRole('button',{name:'Keep going'}));
  expect(screen.getByRole('complementary',{name:'A little about Bryce'})).not.toHaveClass('is-mobile-deferred');
  expect(screen.getByRole('button',{name:'Less'})).toBeEnabled();
  expect(screen.getByText('The laptop brings those sides together: interface studies, desktop tools, mobile prototypes and integration work. Each project has something you can explore.')).toBeInTheDocument();
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
  localStorage.setItem('bryce-journey-v2',JSON.stringify({onboarded:true,tahoe:false,discoveries:['card']}));
  const user=userEvent.setup();render(<Entrance/>);await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  expect(screen.getByRole('region',{name:'Welcome back'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:/Back to the race/})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/Take another drive/}));expect(screen.getByRole('button',{name:'Turn the ignition key'})).toBeInTheDocument();
});

it('offers the race shortcut only after Tahoe and starts it explicitly',async()=>{
  localStorage.setItem('bryce-journey-v2',JSON.stringify({onboarded:true,tahoe:true,discoveries:['lake']}));
  const user=userEvent.setup();render(<Entrance/>);await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await user.click(screen.getByRole('button',{name:/Back to the race/}));expect(scene.replayRace).toHaveBeenCalledOnce();expect(screen.queryByRole('region',{name:'Welcome back'})).not.toBeInTheDocument();
});

it('starts a fresh request on retry without registering the previous finish again',async()=>{
  localStorage.setItem('bryce-journey-v2',JSON.stringify({onboarded:true,tahoe:true,discoveries:['lake']}));
  const calls:Record<string,unknown>[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
    const body=options?.body?JSON.parse(String(options.body)):null;if(body)calls.push(body);
    return {ok:true,json:async()=>body?.action==='start'?{id:'run-'+calls.length}:body?{}:{entries:[]}};
  }));
  try {
    const user=userEvent.setup();render(<Entrance/>);
    await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
    await user.click(screen.getByRole('button',{name:/Take another drive/}));
    const host=screen.getByLabelText('Porsche cabin').parentElement!;
    fireEvent(host,new CustomEvent('car-race',{detail:{phase:'finished',countdown:0,elapsed:41106,remaining:0,progress:1}}));
    await waitFor(()=>expect(calls.filter(call=>call.action==='finish')).toHaveLength(1));
    await user.click(screen.getByRole('button',{name:'Race again ↗'}));
    expect(screen.getByRole('region',{name:'Race countdown'})).toBeInTheDocument();
    await waitFor(()=>expect(calls.filter(call=>call.action==='start')).toHaveLength(2));
    expect(calls.filter(call=>call.action==='finish')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('bryce-last-race')!).elapsed).toBe(41106);
  }finally{vi.unstubAllGlobals();}
});

it('gives the cafe a coffee interaction and a direct route into the laptop',async()=>{
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));
  await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'parked',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:900,gear:1,engineOn:true,automatic:true,collision:false,distance:500,x:0,z:0,stop:'cafe'}}));
  expect(screen.getByText(/Coffee and something/)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'A flat white, please'}));
  fireEvent(host,new CustomEvent('car-visit',{detail:{phase:'idle',coffee:true,stop:null}}));
  expect(screen.getByText('One flat white.')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Open the laptop'}));
  expect(scene.openLaptop).toHaveBeenCalledOnce();
});

// On a narrow viewport the optional-stop card covered the whole scenery band
// while driving. It collapses to a disclosure that still carries every action.
it('collapses the driving optional stop into a disclosure on a narrow viewport',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(true);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  const toggle=await screen.findByRole('button',{name:/Optional stop/});
  expect(toggle).toHaveAttribute('aria-expanded','false');
  expect(screen.queryByRole('button',{name:'Pull in'})).toBeNull();
  expect(screen.queryByText('The young prodigy’s natural habitat.')).toBeNull();
  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded','true');
  expect(screen.getByText('The young prodigy’s natural habitat.')).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:/Optional stop/})).toHaveFocus());
  expect(screen.getByRole('button',{name:'Keep going'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Pull in'}));
  expect(scene.navigate).toHaveBeenCalledWith('tennis');
});

it('keeps the full optional stop card on a wide viewport',async()=>{
  history.replaceState({},'', '/?town');
  mockMobileViewport(false);
  const user=userEvent.setup();render(<Entrance/>);
  await user.click(await screen.findByRole('button',{name:'Get in the Porsche'}));await finishIntro(user);
  const host=screen.getByLabelText('Porsche cabin').parentElement!;
  fireEvent(host,new CustomEvent('car-drive',{detail:{phase:'driving',overlook:false}}));
  fireEvent(host,new CustomEvent('car-telemetry',{detail:{speed:0,rpm:2800,gear:2,engineOn:true,automatic:true,collision:false,distance:325,x:0,z:0,stop:null}}));
  expect(await screen.findByRole('button',{name:'Pull in'})).toBeInTheDocument();
  expect(screen.getByText('The young prodigy’s natural habitat.')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/Optional stop/})).toBeNull();
});
