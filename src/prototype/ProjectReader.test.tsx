import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import ProjectReader from './ProjectReader';

it('provides biography, real project descriptions and contact without loading a scene', async () => {
  const user = userEvent.setup();
  render(<ProjectReader />);
  expect(screen.getByRole('heading', { name: 'Bryce Rambach.' })).toBeInTheDocument();
  expect(screen.getByText(/At the consultancy/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Say hello/ })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
  expect(document.querySelector('canvas')).toBeNull();
  await user.click(screen.getByRole('button', { name: /^arro:/ }));
  expect(screen.getByRole('heading', { name: 'arro' })).toBeInTheDocument();
  expect(screen.getByText(/A running streak with my family/)).toBeInTheDocument();
});

it('keeps Escape in the lightweight reader and returns focus to the project folder', async () => {
  const user = userEvent.setup();
  render(<ProjectReader />);
  expect(screen.queryByRole('button', { name: /Put down object/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^bryce-os:/ }));
  await user.keyboard('{Escape}');
  const folder = screen.getByRole('button', { name: /^bryce-os:/ });
  await waitFor(() => expect(folder).toHaveFocus());
  await user.keyboard('{Escape}');
  expect(folder).toHaveFocus();
  expect(document.querySelector('canvas')).toBeNull();
});


it('offers the AgentSky design study from the shared project reader', async () => {
  const user = userEvent.setup();
  render(<ProjectReader />);
  await user.click(screen.getByRole('button', { name: /^AgentSky:/ }));
  expect(screen.getByText(/Runs and outputs are simulated/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Read the design study/ })).toHaveAttribute('href', '/projects/agentsky');
  expect(screen.getByRole('link',{name:/Read the design study/})).not.toHaveAttribute('target');
  expect(document.querySelector('canvas')).toBeNull();
});
