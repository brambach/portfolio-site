import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CabinObjects } from './CabinObjects';
import { ProjectLaptop } from './ProjectLaptop';

beforeAll(() => {
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

describe('project laptop', () => {
  it('opens every project and returns to the collection without navigating away', async () => {
    const user = userEvent.setup();
    const location = window.location.href;
    render(<CabinObjects object="laptop" close={vi.fn()} />);
    for (const name of ['AgentSky', 'arro', 'trace', 'throughline', 'bryce-os']) {
      await user.click(screen.getByRole('button', { name: new RegExp(name) }));
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
      if(name==='AgentSky')expect(screen.getByRole('link',{name:/Read the design study/})).toHaveAttribute('href','/projects/agentsky');
      else if(name==='trace')expect(screen.getByRole('link',{name:/View source on GitHub/})).toHaveAttribute('href','https://github.com/brambach/trace');
      else expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(window.location.href).toBe(location);
      await user.click(screen.getByRole('button', {name:/All projects/}));
    }
    expect(screen.getByRole('heading', {name:'Projects'})).toBeInTheDocument();
  });

  it('returns control to the cabin when the object is put down', async () => {
    const close = vi.fn();
    render(<CabinObjects object="card" close={close} />);
    await userEvent.click(screen.getByRole('button', {name:'Put down object'}));
    expect(close).toHaveBeenCalledOnce();
  });
});

it('restores cabin keyboard controls when the object menu has closed', () => {
  const cabin=render(<><div className="live-entrance__scene"><canvas tabIndex={0} aria-label="Cabin" /></div><button>Open photo board</button></>);
  const opener=screen.getByRole('button',{name:'Open photo board'});
  opener.focus();
  const object=render(<CabinObjects object="journal" close={vi.fn()} />);
  cabin.rerender(<><div className="live-entrance__scene"><canvas tabIndex={0} aria-label="Cabin" /></div></>);
  object.unmount();
  expect(screen.getByLabelText('Cabin')).toHaveFocus();
});


it('keeps the cabin page available when opening a full project study', async () => {
  const user=userEvent.setup();
  render(<ProjectLaptop embedded close={vi.fn()}/>);
  await user.click(screen.getByRole('button',{name:/^AgentSky:/}));
  const study=screen.getByRole('link',{name:'Read the design study (opens in a new tab)'});
  expect(study).toHaveAttribute('href','/projects/agentsky');
  expect(study).toHaveAttribute('target','_blank');
  expect(study).toHaveAttribute('rel','noopener noreferrer');
});

it('returns keyboard focus to the selected folder without a deferred frame', async () => {
  const user = userEvent.setup();
  render(<ProjectLaptop />);
  await user.click(screen.getByRole('button', { name: /^arro:/ }));
  expect(screen.getByRole('article', { name: 'arro project notes' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: /^arro:/ })).toHaveFocus();
});
