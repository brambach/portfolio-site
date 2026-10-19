import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkSection } from './WorkSection';

describe('WorkSection', () => {
  it('tells the day job straight', () => {
    render(<WorkSection />);
    expect(screen.getByRole('heading', { name: 'Systems, wired together.' })).toBeInTheDocument();
    expect(screen.getByText(/plumbing nobody notices/)).toBeInTheDocument();
    expect(screen.getByText('payroll · hr · finance')).toBeInTheDocument();
  });

  it('shows the desk at golden hour', () => {
    render(<WorkSection />);
    expect(screen.getByAltText(/desk/i)).toBeInTheDocument();
    expect(screen.getByText('the desk, 6pm')).toBeInTheDocument();
  });
});
