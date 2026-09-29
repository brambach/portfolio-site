import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import PortalStudy from './PortalStudy';

it('walks the client through a mapping and into the build', async () => {
  const user = userEvent.setup();
  render(<PortalStudy />);
  await user.click(screen.getByRole('button', { name: /review mapping/i }));
  const confirm = screen.getByRole('button', { name: 'Confirm and continue' });
  expect(confirm).toBeDisabled();
  await user.click(screen.getByRole('radio', { name: /Overtime loading 25%/ }));
  expect(confirm).toBeEnabled();
  await user.click(confirm);
  expect(screen.getByText('Mapping confirmed')).toBeInTheDocument();
  expect(screen.getByText('You chose Overtime loading 25%')).toBeInTheDocument();
});

it('lets you skip ahead to a live integration with an issue', async () => {
  const user = userEvent.setup();
  render(<PortalStudy />);
  await user.click(screen.getByRole('button', { name: /An issue/ }));
  expect(screen.getByText(/Leave sync paused since 09:12/)).toBeInTheDocument();
});

it('recovers the incident after a retry', async () => {
  const user = userEvent.setup();
  render(<PortalStudy />);
  await user.click(screen.getByRole('button', { name: 'Ongoing support' }));
  await user.click(screen.getByRole('button', { name: 'Retry sync' }));
  expect(await screen.findByText('Recovered', undefined, { timeout: 3000 })).toBeInTheDocument();
});
