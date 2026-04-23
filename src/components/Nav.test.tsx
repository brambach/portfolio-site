import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders the logomark as a link to #hero', () => {
    render(<Nav />);
    const logo = screen.getByRole('link', { name: /Bryce Rambach/i });
    expect(logo).toHaveAttribute('href', '#hero');
  });

  it('renders the four section links', () => {
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: /AI & Tools/i })).toHaveAttribute('href', '#stack');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  it('renders the Résumé CTA', () => {
    render(<Nav />);
    const resume = screen.getAllByRole('link', { name: /Résumé/i })[0];
    expect(resume).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
    expect(resume).toHaveAttribute('target', '_blank');
  });

  it('has a primary navigation landmark', () => {
    render(<Nav />);
    expect(screen.getByRole('navigation', { name: /Primary/i })).toBeInTheDocument();
  });
});
