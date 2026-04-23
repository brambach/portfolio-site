import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the name at h1', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1, name: /Bryce Rambach/i })).toBeInTheDocument();
  });

  it('renders the availability eyebrow', () => {
    render(<Hero />);
    expect(screen.getByText(/Available summer 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/the city \/ the city/i)).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Hero />);
    expect(screen.getByText(/Full-stack engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Ships production solo/i)).toBeInTheDocument();
  });

  it('renders the View projects CTA linking to #projects', () => {
    render(<Hero />);
    const cta = screen.getByRole('link', { name: /View projects/i });
    expect(cta).toHaveAttribute('href', '#projects');
  });

  it('renders the Résumé CTA linking to the PDF', () => {
    render(<Hero />);
    const resume = screen.getByRole('link', { name: /Résumé/i });
    expect(resume).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
  });
});
