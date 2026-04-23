import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders copyright and colophon', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Bryce Rambach/)).toBeInTheDocument();
    expect(screen.getByText(/Built with React/)).toBeInTheDocument();
  });

  it('uses a <footer> landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
