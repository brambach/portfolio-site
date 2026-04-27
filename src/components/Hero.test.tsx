import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the headline, lede, and contact links', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/digital archive/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryce.rambach@gmail.com/i })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('link', { name: /résumé/i })).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
  });

  it('renders the scroll-to-archive footer', () => {
    render(<Hero />);
    expect(screen.getByText(/SCROLL TO ENTER ARCHIVE/i)).toBeInTheDocument();
  });
});
