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
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); history.replaceState(null, '', '/'); });

const at = (path: string) => history.replaceState(null, '', path);
const SKILL_ROWS = [['01', 'Integrations', 'integrations'], ['02', 'Agents', 'agents'], ['03', 'Harnesses', 'harnesses'], ['04', 'Design', 'design'], ['05', 'Product taste', 'product']] as const;

describe('the home page', () => {
  it('leads with the claim and lists the five things it covers', () => {
    at('/');
    render(<SkyApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bryce Rambach' })).toBeInTheDocument();
    expect(screen.getByText('I build the whole thing.')).toBeInTheDocument();
    const index = screen.getByRole('navigation', { name: 'What that covers' });
    for (const [no, name, id] of SKILL_ROWS) {
      expect(within(index).getByRole('link', { name: new RegExp(`^${no} ${name}`) })).toHaveAttribute('href', `#${id}`);
    }
    expect(screen.getByRole('link', { name: /Resume/ })).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
    expect(screen.getByRole('link', { name: 'The drive' })).toHaveAttribute('href', '/drive');
    expect(screen.getByRole('link', { name: 'The road' })).toHaveAttribute('href', '/work');
    expect(document.title).toBe('Bryce Rambach');
    expect(document.documentElement).toHaveAttribute('data-sky');
  });

  it('backs each skill with a section of proof further down', () => {
    at('/');
    render(<SkyApp />);
    for (const [, name, id] of SKILL_ROWS) {
      const section = document.getElementById(id)!;
      expect(within(section).getByRole('heading', { level: 3, name: new RegExp(name) })).toBeInTheDocument();
      expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0);
    }
    const harnesses = document.getElementById('harnesses')!;
    expect(within(harnesses).getByRole('link', { name: 'dervo_harness' })).toHaveAttribute('href', 'https://github.com/brambach/dervo/tree/main/backend/dervo_harness');
  });

  it('raises a skill on the first tap and goes to its proof on the second', async () => {
    at('/');
    const user = userEvent.setup();
    render(<SkyApp />);
    const row = screen.getByRole('link', { name: /^03 Harnesses/ });
    await user.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    await user.click(row);
    expect(location.hash).toBe('#harnesses');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3, name: /Harnesses/ }));
  });

  it('walks the sun through every skill once, and stops when you take over', () => {
    vi.useFakeTimers();
    at('/');
    render(<SkyApp />);
    const label = screen.getByRole('heading', { name: 'What that covers' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2300); });
    expect(label).toHaveTextContent('01 / 05');
    act(() => { vi.advanceTimersByTime(3600); });
    expect(label).toHaveTextContent('02 / 05');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(20000); });
    expect(label).toHaveTextContent('02 / 05');
  });

  it('lets the arrow keys step through the skills', () => {
    at('/');
    render(<SkyApp />);
    const label = screen.getByRole('heading', { name: 'What that covers' });
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowRight' }); });
    expect(label).toHaveTextContent('01 / 05');
    act(() => { fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' }); });
    expect(label).toHaveTextContent('05 / 05');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /^05 Product taste/ }));
  });

  it('opens a project page from a proof link', async () => {
    at('/');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(within(document.getElementById('design')!).getByRole('link', { name: 'Port' }));
    expect(location.pathname).toBe('/projects/port');
    expect(screen.getByRole('heading', { level: 1, name: 'Port' })).toBeInTheDocument();
    expect(document.title).toBe('Port · Bryce Rambach');
  });
});

describe('a project page', () => {
  it('shows the catalog’s words and moves on with the arrow keys', () => {
    at('/projects/dervo');
    render(<SkyApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dervo' })).toBeInTheDocument();
    expect(screen.getByText(/A Mac app for running Claude Code and Codex side by side/)).toBeInTheDocument();
    expect(screen.getByText(/I parked Dervo in October/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the source on GitHub/ })).toHaveAttribute('href', 'https://github.com/brambach/dervo');
    expect(screen.getByText('01 / 03')).toBeInTheDocument();
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowRight' }); });
    expect(location.pathname).toBe('/projects/arro');
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Arro' }));
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowLeft' }); });
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowLeft' }); });
    expect(location.pathname).toBe('/projects/port');
  });

  it('goes back to the list from the back link, onto the row it came from', async () => {
    at('/projects/arro');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('link', { name: /Bryce Rambach/ }));
    expect(location.pathname).toBe('/');
    expect(location.hash).toBe('#work');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /^05 Product taste/ }));
  });

  it('hands the Dervo thread to Codex', async () => {
    at('/projects/dervo');
    const user = userEvent.setup();
    render(<SkyApp />);
    await user.click(screen.getByRole('button', { name: /Continue in Codex/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Continuing in Codex');
    expect(screen.getByText(/Codex picked up where Claude stopped/)).toBeInTheDocument();
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
});
