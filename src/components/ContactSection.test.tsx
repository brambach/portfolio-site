import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContactSection } from './ContactSection';

describe('ContactSection', () => {
  it('renders headline and four direct contact links', () => {
    render(<ContactSection />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(/load-bearing/i);
    expect(screen.getByRole('link', { name: /bryce.rambach@gmail.com/i })).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
    expect(screen.getByRole('link', { name: /\(831\) 236-1922/ })).toHaveAttribute('href', 'tel:+18312361922');
    expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });
});
