import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the three footer items', () => {
    render(<Footer />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/BUILT SOLO/i)).toBeInTheDocument();
    expect(screen.getByText(/v\.4\.0/i)).toBeInTheDocument();
  });
});
