import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectLaptop } from './ProjectLaptop';
import { CabinObjects } from './CabinObjects';

beforeAll(() => {
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

describe('project laptop', () => {
  it('opens every project and returns to the collection without navigating away', async () => {
    const user = userEvent.setup();
    const location = window.location.href;
    render(<CabinObjects object="laptop" close={vi.fn()} />);
    for (const name of ['AgentSky', 'Dervo', 'Lucid', 'Arro', 'Port', 'Integration portal']) {
      await user.click(screen.getByRole('link', { name: `View ${name}` }));
      const viewer = screen.getByRole('dialog', { name: `${name} project` });
      await within(viewer).findByRole('heading', { level: 1 });
      expect(viewer.parentElement).toBe(document.body);
      expect(window.location.href).toBe(location);
      await user.click(screen.getByRole('button', {name:/All projects/}));
      await waitFor(() => expect(screen.getByRole('link', {name:`View ${name}`})).toHaveFocus());
    }
    expect(screen.getByRole('dialog', {name:'Project laptop'})).toBeInTheDocument();
  },15000);

  it('returns control to the cabin when the object is put down', async () => {
    const close = vi.fn();
    render(<CabinObjects object="card" close={close} />);
    await userEvent.click(screen.getByRole('button', {name:'Put down object'}));
    expect(close).toHaveBeenCalledOnce();
  });
});

it('restores cabin keyboard controls when the object menu has closed', async () => {
  const cabin=render(<><div className="live-entrance__scene"><canvas tabIndex={0} aria-label="Cabin" /></div><button>Open photo board</button></>);
  const opener=screen.getByRole('button',{name:'Open photo board'});
  opener.focus();
  const object=render(<CabinObjects object="journal" close={vi.fn()} />);
  cabin.rerender(<><div className="live-entrance__scene"><canvas tabIndex={0} aria-label="Cabin" /></div></>);
  object.unmount();
  await waitFor(() => expect(screen.getByLabelText('Cabin')).toHaveFocus());
});

it('preserves the introduction action on the embedded laptop',async()=>{
  const close=vi.fn();
  render(<ProjectLaptop embedded close={close} closeLabel="Ready for the keys"/>);
  await userEvent.click(screen.getByRole('button',{name:'Ready for the keys'}));
  expect(close).toHaveBeenCalledOnce();
});

it('keeps laptop keyboard input out of the driving controls',async()=>{
  const drivingKey=vi.fn();
  render(<div onKeyDown={drivingKey}><ProjectLaptop embedded close={vi.fn()}/></div>);
  screen.getByRole('link',{name:'View Arro'}).focus();
  await userEvent.keyboard('kr');
  expect(drivingKey).not.toHaveBeenCalled();
});
