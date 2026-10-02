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

it('keeps the focus ring quiet on the close button until a key is pressed',async()=>{
  history.replaceState(null,'','/projects/dervo');
  render(<ProjectReader/>);
  const viewer=screen.getByRole('dialog',{name:'Dervo project'});
  expect(screen.getByRole('button',{name:'← All projects'})).toHaveFocus();
  expect(viewer).toHaveAttribute('data-quiet-focus');
  await userEvent.keyboard('{Tab}');
  expect(viewer).not.toHaveAttribute('data-quiet-focus');
});

it('counts the projects in the viewer nav and ends on a next-project arrow',async()=>{
  history.replaceState(null,'','/projects/dervo');
  render(<ProjectReader/>);
  expect(screen.getByRole('navigation',{name:'Project navigation'})).toHaveTextContent('01 / 06');
  expect(document.querySelector('.ps-next')).toHaveTextContent('→');
});

it('wears the night look by default and sends you back to the home page',async()=>{
  history.replaceState(null,'','/projects/lucid');
  render(<ProjectReader/>);
  expect(screen.getByRole('dialog',{name:'Lucid project'})).toHaveAttribute('data-look','green');
  expect(document.querySelector('.ps-page')).toHaveAttribute('data-look','green');
  expect(screen.getByRole('link',{name:'← Back home'})).toHaveAttribute('href','/');
  expect(screen.getByRole('link',{name:'Direct link to Lucid'})).toHaveAttribute('href','/projects/lucid');
  expect(screen.getByRole('link',{name:'View Arro'})).toHaveAttribute('href','/projects/arro');
  expect(document.querySelector('link[data-qi-font="sentient"]')).not.toBeNull();
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content','#09130e');
});

it('carries an explicit look through its links and keeps it when you close a study',async()=>{
  history.replaceState(null,'','/projects/dervo?look=bone');
  render(<ProjectReader/>);
  expect(screen.getByRole('dialog',{name:'Dervo project'})).toHaveAttribute('data-look','bone');
  expect(screen.getByRole('link',{name:'Direct link to Dervo'})).toHaveAttribute('href','/projects/dervo?look=bone');
  expect(screen.getByRole('link',{name:'← Back home'})).toHaveAttribute('href','/?look=bone');
  expect(screen.getByRole('link',{name:'View Lucid'})).toHaveAttribute('href','/projects/lucid?look=bone');
  await userEvent.click(screen.getByRole('button',{name:'← All projects'}));
  expect(location.pathname+location.search).toBe('/projects?look=bone');
});

it('falls back to the green look when the look in the URL is unknown',()=>{
  history.replaceState(null,'','/projects/dervo?look=paper');
  render(<ProjectReader/>);
  expect(screen.getByRole('dialog',{name:'Dervo project'})).toHaveAttribute('data-look','green');
  expect(screen.getByRole('link',{name:'← Back home'})).toHaveAttribute('href','/');
});
