import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import ProjectReader from './ProjectReader';

beforeAll(()=>{
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
});
beforeEach(()=>history.replaceState(null,'','/projects'));

it('offers six projects, the archive and contact without loading a scene',()=>{
  render(<ProjectReader/>);
  expect(document.querySelectorAll('.ps-project')).toHaveLength(6);
  expect(screen.getByText(/10 more projects/)).toBeInTheDocument();
  expect(screen.getAllByRole('link',{name:/Say hello/})[0]).toHaveAttribute('href','mailto:bryce.rambach@gmail.com');
  expect(document.querySelector('canvas')).toBeNull();
});

it('opens a project in the reader and restores the selected cover on return',async()=>{
  const user=userEvent.setup();
  render(<ProjectReader/>);
  await user.click(screen.getByRole('link',{name:'View Arro'}));
  expect(location.pathname).toBe('/projects/arro');
  const viewer=screen.getByRole('dialog',{name:'Arro project'});
  expect(viewer.parentElement).toBe(document.body);
  fireEvent(viewer,new Event('cancel',{bubbles:true,cancelable:true}));
  await waitFor(()=>expect(location.pathname).toBe('/projects'));
  await waitFor(()=>expect(screen.getByRole('link',{name:'View Arro'})).toHaveFocus());
});

it('opens a direct project link and closes without leaving the portfolio',async()=>{
  history.replaceState(null,'','/projects/agentsky');
  render(<ProjectReader/>);
  expect(screen.getByRole('dialog',{name:'AgentSky project'})).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'← All projects'}));
  expect(location.pathname).toBe('/projects');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('canvas')).toBeNull();
});
