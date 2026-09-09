import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PortStudy from './PortStudy';

let reducedMotion = false;

vi.mock('motion/react', () => ({
  useReducedMotion: () => reducedMotion,
}));

beforeEach(() => {
  reducedMotion = false;
  vi.useFakeTimers();
  const focus = HTMLElement.prototype.focus;
  vi.spyOn(HTMLButtonElement.prototype, 'focus').mockImplementation(function focusIfEnabled(options?: FocusOptions) {
    if (this.disabled) return;
    focus.call(this, options);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function finishTimers(ms = 0) {
  await act(async () => {
    if (ms) vi.advanceTimersByTime(ms);
    vi.runOnlyPendingTimers();
  });
}

async function advanceTimers(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

async function finishCloseDelay(ms: number) {
  await act(async () => {
    if (ms) vi.advanceTimersByTime(ms);
    else vi.runOnlyPendingTimers();
  });
}

it.each([
  ['normal motion', false, 1666],
  ['reduced motion', true, 0],
] as const)('keeps %s native blur/leave completion closed until fresh pointer activation', async (_name, motion, closeDelay) => {
  reducedMotion = motion;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await advanceTimers(1000);

  expect(close).toBeDisabled();
  fireEvent.blur(close);
  fireEvent.pointerLeave(close);
  await finishCloseDelay(closeDelay);

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  expect(screen.getByRole('status')).toHaveTextContent('Port closed');

  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port closed');

  fireEvent.pointerDown(reopen, { button: 0 });
  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it('keeps reduced-motion pointer completion closed after the release click', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await finishTimers(1000);

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  expect(screen.getByRole('status')).toHaveTextContent('Port closed');

  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port closed');
  expect(screen.getByRole('button', { name: 'Open Port' })).toBeInTheDocument();
});

it('restores Open Port focus after keyboard completion commits the enabled state', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  close.focus();
  fireEvent.click(close, { detail: 0 });
  await finishTimers();

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  expect(reopen).toHaveFocus();
});

it('keeps normal-motion completion closed after releasing the completed hold', async () => {
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByRole('button', { name: 'Close Port' })).toBeDisabled();
  await act(async () => {
    vi.advanceTimersByTime(1666);
  });

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port closed');
});

it('reopens on the first fresh click after normal-motion release while disabled dispatched no click', async () => {
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  fireEvent.pointerUp(screen.getByRole('button', { name: 'Close Port' }));
  await act(async () => {
    vi.advanceTimersByTime(1666);
  });

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.pointerDown(reopen, { button: 0 });
  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it('allows fresh keyboard activation after a completed pointer guard receives no release click', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await finishTimers(1000);

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.pointerUp(reopen);
  expect(screen.getByRole('status')).toHaveTextContent('Port closed');

  fireEvent.keyDown(reopen, { key: 'Enter' });
  fireEvent.click(reopen, { detail: 0 });

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it('reopens on the first ordinary click after a completed pointer cancel', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await finishTimers(1000);
  const reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.pointerCancel(reopen);
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it.each([
  ['release', (button: HTMLElement) => fireEvent.pointerUp(button)],
  ['cancel', (button: HTMLElement) => fireEvent.pointerCancel(button)],
  ['leave', (button: HTMLElement) => fireEvent.pointerLeave(button)],
])('cancels an early pointer hold on %s', async (_name, release) => {
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  release(close);
  await finishTimers(1000);

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
  expect(screen.getByRole('button', { name: 'Close Port' })).toBeEnabled();
});

it('allows the next ordinary click to reopen after a completed pointer release was ignored', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  fireEvent.pointerDown(close, { button: 0 });
  await finishTimers(1000);
  let reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.pointerUp(reopen);
  fireEvent.click(reopen);
  expect(screen.getByRole('status')).toHaveTextContent('Port closed');

  reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.click(reopen);

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it.each(['Enter', ' '] as const)('supports keyboard-origin %s completion and ordinary reopen', async key => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  close.focus();
  fireEvent.keyDown(close, { key });
  fireEvent.click(close, { detail: 0 });
  await finishTimers();

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  expect(reopen).toHaveFocus();
  fireEvent.keyUp(reopen, { key });
  fireEvent.click(reopen, { detail: 0 });

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it('ignores repeated keyboard activation while closed without consuming the next real activation', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  close.focus();
  fireEvent.keyDown(close, { key: 'Enter' });
  fireEvent.click(close, { detail: 0 });
  await finishTimers();

  const reopen = screen.getByRole('button', { name: 'Open Port' });
  fireEvent.keyDown(reopen, { key: 'Enter', repeat: true });
  expect(screen.getByRole('status')).toHaveTextContent('Port closed');
  fireEvent.keyDown(reopen, { key: 'Enter' });
  fireEvent.click(reopen, { detail: 0 });

  expect(screen.getByRole('status')).toHaveTextContent('Port open');
});

it('does not steal focus when the user moves elsewhere before completion commits', async () => {
  reducedMotion = true;
  render(<PortStudy />);

  const close = screen.getByRole('button', { name: 'Close Port' });
  const sound = screen.getByRole('button', { name: 'Sound off' });
  close.focus();
  fireEvent.click(close, { detail: 0 });
  sound.focus();
  await finishTimers();

  expect(screen.getByRole('button', { name: 'Open Port' })).toBeInTheDocument();
  expect(sound).toHaveFocus();
});
