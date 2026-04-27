import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Chrome } from './Chrome';

describe('Chrome', () => {
  it('renders the brand mark and the four section links', () => {
    render(<Chrome />);
    expect(screen.getByText(/BR/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /archive/i })).toHaveAttribute('href', '#archive');
    expect(screen.getByRole('link', { name: /systems/i })).toHaveAttribute('href', '#systems');
    expect(screen.getByRole('link', { name: /concept/i })).toHaveAttribute('href', '#sidequest');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '#contact');
  });
});
