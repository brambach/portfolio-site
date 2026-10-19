import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DirectionB from './DirectionB';

// jsdom has no canvas, scrolling, matchMedia or font loading; the motion simply doesn't start.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => vi.restoreAllMocks());

describe('Direction B', () => {
  it('leads with the tagline and ends with a way to say hello', () => {
    const { unmount } = render(<DirectionB />);
    expect(screen.getByRole('heading', { level: 1, name: 'I design it, make it move, and build it.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryce\.rambach@gmail\.com/ })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getAllByRole('link', { name: /Dervo/ }).some(a => a.getAttribute('href') === '/projects/dervo')).toBe(true);
    unmount();
  });
});
