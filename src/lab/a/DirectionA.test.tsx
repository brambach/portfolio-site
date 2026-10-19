import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DirectionA from './DirectionA';

// jsdom has no WebGL, so the sky falls back to its CSS gradient. Reduced motion keeps GSAP and Lenis out of it.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduce'), media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;
});
afterEach(() => vi.restoreAllMocks());

describe('Direction A', () => {
  it('leads with the name and the tagline, and ends with a way to say hello', () => {
    render(<DirectionA />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bryce Rambach');
    expect(screen.getByLabelText('I design it, make it move, and build it.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'bryce.rambach@gmail.com' })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('link', { name: /Open Dervo/ })).toHaveAttribute('href', '/projects/dervo');
  });
});
