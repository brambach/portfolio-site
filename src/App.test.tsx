import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the skip-to-content link', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /Skip to content/i });
    expect(skip).toHaveAttribute('href', '#hero');
  });

  it('renders every section in order', () => {
    render(<App />);
    // All five section landmarks present
    expect(screen.getByRole('navigation', { name: /Primary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Bryce Rambach/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /live enterprise integrations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Projects\./i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /AI & Tools\./i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Let's talk\./i })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
