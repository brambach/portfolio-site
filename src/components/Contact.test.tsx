import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Contact } from './Contact';

describe('Contact', () => {
  it('renders the headline', () => {
    render(<Contact />);
    expect(screen.getByRole('heading', { name: /Let's talk/i })).toBeInTheDocument();
  });

  it('renders the availability paragraph', () => {
    render(<Contact />);
    expect(screen.getByText(/Solutions Engineer or Full-Stack roles/i)).toBeInTheDocument();
  });

  it('renders a mailto link for the primary CTA', () => {
    render(<Contact />);
    const email = screen.getByRole('link', { name: /Email me/i });
    expect(email).toHaveAttribute('href', 'mailto:bryce.rambach@gmail.com');
  });

  it('renders the Résumé CTA pointing at the PDF', () => {
    render(<Contact />);
    const resume = screen.getByRole('link', { name: /Résumé/i });
    expect(resume).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
    expect(resume).toHaveAttribute('target', '_blank');
  });

  it('renders spec-table rows for Email / Phone / LinkedIn / GitHub / Based', () => {
    render(<Contact />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Based')).toBeInTheDocument();
  });
});
