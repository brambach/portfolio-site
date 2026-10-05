import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SkyApp from './SkyApp';

// jsdom has no canvas or scrolling; the horizons and water simply don't draw.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { vi.restoreAllMocks(); history.replaceState(null, '', '/'); });

const at = (path: string) => history.replaceState(null, '', path);

describe('the home page', () => {
  it('names you once for screen readers and lists the work', () => {
    at('/');
    render(<SkyApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Selected work' })).toBeInTheDocument();
    for (const name of ['Dervo', 'Integration portal', 'Lucid', 'Arro', 'Port', 'AgentSky']) {
      expect(screen.getAllByRole('link', { name: new RegExp(`^\\d\\d ${name}`) })[0]).toHaveAttribute('href', expect.stringMatching(/^\/projects\//));
    }
    expect(screen.getByRole('link', { name: /Resume/ })).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
    expect(screen.getByRole('link', { name: 'The drive' })).toHaveAttribute('href', '/drive');
    expect(screen.getByRole('link', { name: 'The road' })).toHaveAttribute('href', '/work');
    expect(document.title).toBe('Bryce Rambach');
    expect(document.documentElement).toHaveAttribute('data-sky');
  });

  it('opens a preview on the first tap and the project on the second', async () => {
    at('/');
    const user = userEvent.setup();
    render(<SkyApp />);
    const row = screen.getByRole('link', { name: /^03 Lucid/ });
    await user.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(location.pathname).toBe('/');
    await user.click(row);
    expect(location.pathname).toBe('/projects/lucid');
    expect(screen.getByRole('heading', { level: 1, name: 'Lucid' })).toBeInTheDocument();
    expect(document.title).toBe('Lucid · Bryce Rambach');
  });
});

describe('a project page', () => {
  it('shows the catalog’s words and moves on with the arrow keys', () => {
    at('/projects/dervo');
    render(<SkyApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dervo' })).toBeInTheDocument();
    expect(screen.getByText(/A Mac app for running Claude Code and Codex side by side/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Join the waitlist/ })).toHaveAttribute('href', 'https://trydervo.com/#waitlist');
    expect(screen.getByText('01 / 06')).toBeInTheDocument();
    act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }); });
    expect(location.pathname).toBe('/projects/integration-portal');
    act(() => { fireEvent.keyDown(window, { key: 'ArrowLeft' }); });
    act(() => { fireEvent.keyDown(window, { key: 'ArrowLeft' }); });
    expect(location.pathname).toBe('/projects/agentsky');
  });

  it('leaves the arrow keys alone inside a group of choices, and lands focus on the new title', async () => {
    at('/projects/integration-portal');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /review mapping/i }));
    const radio = screen.getByRole('radio', { name: /Overtime loading 25%/ });
    act(() => { fireEvent.keyDown(radio, { key: 'ArrowRight' }); });
    expect(location.pathname).toBe('/projects/integration-portal');
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowRight' }); });
    expect(location.pathname).toBe('/projects/lucid');
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Lucid' }));
  });

  it('goes back to the list from the back link', async () => {
    at('/projects/arro');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('link', { name: /Bryce Rambach/ }));
    expect(location.pathname).toBe('/');
    expect(location.hash).toBe('#work');
  });

  it('hands the Dervo thread to Codex', async () => {
    at('/projects/dervo');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /Continue in Codex/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Continuing in Codex');
    expect(screen.getByText(/Codex picked up where Claude stopped/)).toBeInTheDocument();
  });

  it('explains a Lucid field and holds it for review', async () => {
    at('/projects/lucid');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /department/ }));
    expect(screen.getByText(/renamed department could break it/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /customField\.c_super/ }));
    await user.click(screen.getByRole('button', { name: 'Hold this field for review' }));
    expect(screen.getByText('One field held for review in this example.')).toBeInTheDocument();
  });

  it('walks the portal journey on the sky page', async () => {
    at('/projects/integration-portal');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /review mapping/i }));
    await user.click(screen.getByRole('radio', { name: /Overtime loading 25%/ }));
    await user.click(screen.getByRole('button', { name: 'Confirm and continue' }));
    expect(screen.getByText('You chose Overtime loading 25%')).toBeInTheDocument();
  });

  it('sends Arro’s sample cheer', async () => {
    at('/projects/arro');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /Send a sample cheer/ }));
    expect(screen.getByRole('button', { name: /Cheer sent/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('closes Port from the keyboard, then opens it again', async () => {
    at('/projects/port');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    render(<SkyApp />);
    const hold = screen.getByRole('button', { name: 'Hold to close Port' });
    act(() => { fireEvent.keyDown(hold, { key: 'Enter' }); });
    expect(await screen.findByText('Quiet.', undefined, { timeout: 3000 })).toBeInTheDocument();
    const open = screen.getByRole('button', { name: 'Open Port' });
    act(() => { fireEvent.keyDown(open, { key: 'Enter' }); });
    expect(screen.getByRole('button', { name: 'Hold to close Port' })).toBeInTheDocument();
  });

  it('offers the AgentSky film with chapters', () => {
    at('/projects/agentsky');
    render(<SkyApp />);
    const chapters = screen.getByRole('navigation', { name: 'Film chapters' });
    expect(within(chapters).getAllByRole('button')).toHaveLength(3);
    expect(screen.getByLabelText('Recorded AgentSky concept walkthrough')).toHaveAttribute('src', '/project-lab/walkthrough.webm');
  });
});
