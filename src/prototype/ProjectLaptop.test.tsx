import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { beforeAll, expect, it, vi } from 'vitest';
import { ProjectLaptop } from './ProjectLaptop';

beforeAll(() => {
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

it('opens the embedded laptop collection full-size and returns focus across nested viewer escapes', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<ProjectLaptop embedded close={close} />);

  const expand = screen.getByRole('button', { name: 'Open full-size collection' });
  expect(screen.getByRole('dialog', { name: 'Project laptop' })).not.toContainElement(expand);
  expect(expand.parentElement).toHaveClass('ps-laptop-action');
  const css = readFileSync('src/prototype/project-laptop.css', 'utf8');
  const match = css.match(/\.ps-laptop__expand\s*\{[^}]*min-height:\s*(\d+)px/s);
  expect(match).not.toBeNull();
  expect(Number(match?.[1])).toBeGreaterThanOrEqual(48);
  expect(css).toMatch(/\.ps-laptop__expand\s*\{[^}]*width:\s*min\(360px,\s*calc\(100vw - 32px\)\)/s);
  expect(css).toMatch(/\.ps-laptop__expand:focus-visible/);

  expand.focus();
  expect(expand).toHaveFocus();
  await user.keyboard('{Enter}');

  expect(screen.queryByRole('button', { name: 'Open full-size collection' })).not.toBeInTheDocument();
  const collection = screen.getByRole('dialog', { name: 'Full-size project collection' });
  expect(collection).toHaveClass('ps-page');
  expect(screen.getByRole('dialog', { name: 'Project laptop' })).toHaveAttribute('inert', '');
  expect(within(collection).getByRole('link', { name: 'View Arro' })).toBeInTheDocument();

  await user.click(within(collection).getByRole('link', { name: 'View Arro' }));
  expect(screen.getByRole('dialog', { name: 'Arro project' })).toBeInTheDocument();
  fireEvent(screen.getByRole('dialog', { name: 'Arro project' }), new Event('cancel', { bubbles: true, cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Arro project' })).not.toBeInTheDocument());
  await waitFor(() => expect(within(collection).getByRole('link', { name: 'View Arro' })).toHaveFocus());
  expect(collection).toBeInTheDocument();

  fireEvent(collection, new Event('cancel', { bubbles: true, cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Full-size project collection' })).not.toBeInTheDocument());
  const restoredExpand = screen.getByRole('button', { name: 'Open full-size collection' });
  await waitFor(() => expect(restoredExpand).toHaveFocus());
  expect(close).not.toHaveBeenCalled();
});

it('keeps the full-size action visible only while the embedded laptop collection is active', async () => {
  const { rerender } = render(<ProjectLaptop embedded active close={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Open full-size collection' })).toBeInTheDocument();

  rerender(<ProjectLaptop embedded active={false} close={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Open full-size collection' })).not.toBeInTheDocument();

  rerender(<ProjectLaptop active close={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Open full-size collection' })).not.toBeInTheDocument();
});

it('hides the full-size action while the embedded compact viewer is open', async () => {
  render(<ProjectLaptop embedded active close={vi.fn()} />);
  await userEvent.click(screen.getByRole('link', { name: 'View Arro' }));
  expect(screen.getByRole('dialog', { name: 'Arro project' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open full-size collection' })).not.toBeInTheDocument();
});

it('does not double-close the embedded laptop when the full-size collection is dismissed', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<ProjectLaptop embedded close={close} />);

  await user.click(screen.getByRole('button', { name: 'Open full-size collection' }));
  fireEvent(screen.getByRole('dialog', { name: 'Full-size project collection' }), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(close).not.toHaveBeenCalled();

  await waitFor(() => expect(screen.getByRole('button', { name: 'Open full-size collection' })).toHaveFocus());
  await user.keyboard('{Escape}');
  expect(close).toHaveBeenCalledTimes(1);
});

it('lets Escape on the body-level action close the embedded laptop through React propagation', async () => {
  const close = vi.fn();
  render(<ProjectLaptop embedded close={close} />);
  const expand = screen.getByRole('button', { name: 'Open full-size collection' });

  expand.focus();
  await userEvent.keyboard('{Escape}');

  expect(close).toHaveBeenCalledOnce();
});

it('does not restore focus to the hidden full-size action after the laptop becomes inactive', async () => {
  const outside = document.createElement('button');
  outside.textContent = 'Outside control';
  document.body.append(outside);
  const { rerender } = render(<ProjectLaptop embedded active close={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: 'Open full-size collection' }));
  expect(screen.getByRole('dialog', { name: 'Full-size project collection' })).toBeInTheDocument();
  outside.focus();
  rerender(<ProjectLaptop embedded active={false} close={vi.fn()} />);

  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Full-size project collection' })).not.toBeInTheDocument());
  await new Promise(requestAnimationFrame);
  expect(outside).toHaveFocus();
  outside.remove();
});

it('documents viewport-safe full-size dialog sizing without using jsdom layout', () => {
  const css = readFileSync('src/prototype/project-laptop.css', 'utf8');
  expect(css).toMatch(/\.ps-laptop-full\.ps-page\s*\{[^}]*min-height:\s*0/s);
  expect(css).toMatch(/\.ps-laptop-full\s*\{[^}]*box-sizing:\s*border-box/s);
  expect(css).toMatch(/\.ps-laptop-full\s*\{[^}]*width:\s*min\(1180px,\s*calc\(100vw - 24px\)\)/s);
  expect(css).toMatch(/\.ps-laptop-full\s*\{[^}]*height:\s*min\(820px,\s*calc\(100dvh - 24px\)\)/s);
});
