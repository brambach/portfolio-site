import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DriveControls } from './DriveControls';

describe('touch driving controls', () => {
  it('keeps a pedal held across telemetry renders and releases through the latest callback',()=>{
    const first=vi.fn(),latest=vi.fn(),park=vi.fn();
    const {rerender,unmount}=render(<DriveControls input={first} park={park}/>);
    fireEvent.keyDown(screen.getByRole('button',{name:'Accelerate'}),{key:'Enter'});
    first.mockClear();rerender(<DriveControls input={latest} park={park}/>);
    expect(first).not.toHaveBeenCalled();expect(latest).not.toHaveBeenCalled();
    unmount();expect(latest).toHaveBeenCalledWith('gas',false);
  });
  it('releases held controls when opening a menu removes the controls', () => {
    const input=vi.fn();
    const {unmount}=render(<DriveControls input={input} park={vi.fn()}/>);
    const pedal=screen.getByRole('button',{name:'Accelerate'});
    pedal.setPointerCapture=vi.fn();
    fireEvent.pointerDown(pedal,{pointerId:1});
    fireEvent.keyDown(screen.getByRole('button',{name:'Steer left'}),{key:' '});
    input.mockClear();unmount();
    expect(input).toHaveBeenCalledWith('gas',false);
    expect(input).toHaveBeenCalledWith('left',false);
  });
  it('releases the accelerator when a touch is cancelled or loses capture', () => {
    const input = vi.fn();
    render(<DriveControls input={input} park={vi.fn()} />);
    const pedal = screen.getByRole('button', { name: 'Accelerate' });
    pedal.setPointerCapture = vi.fn();
    fireEvent.pointerDown(pedal, { pointerId: 1 });
    expect(input).toHaveBeenLastCalledWith('gas', true);
    fireEvent.pointerCancel(pedal, { pointerId: 1 });
    expect(input).toHaveBeenLastCalledWith('gas', false);
    fireEvent.pointerDown(pedal, { pointerId: 2 });
    fireEvent.lostPointerCapture(pedal, { pointerId: 2 });
    expect(input).toHaveBeenLastCalledWith('gas', false);
  });

  it('releases keyboard steering on blur and provides a parking action', () => {
    const input = vi.fn(), park = vi.fn();
    render(<DriveControls input={input} park={park} />);
    const left = screen.getByRole('button', { name: 'Steer left' });
    fireEvent.keyDown(left, { key: ' ' });
    expect(input).toHaveBeenLastCalledWith('left', true);
    fireEvent.blur(left);
    expect(input).toHaveBeenLastCalledWith('left', false);
    fireEvent.click(screen.getByRole('button', { name: 'Pull over' }));
    expect(park).toHaveBeenCalledOnce();
  });
});

it('keeps a keyboard pedal held when an unrelated key is released',()=>{
  const input=vi.fn();render(<DriveControls input={input} park={vi.fn()}/>);
  const pedal=screen.getByRole('button',{name:'Accelerate'});
  fireEvent.keyDown(pedal,{key:' '});input.mockClear();
  fireEvent.keyUp(pedal,{key:'Shift'});expect(input).not.toHaveBeenCalled();
  fireEvent.keyUp(pedal,{key:' '});expect(input).toHaveBeenLastCalledWith('gas',false);
});
