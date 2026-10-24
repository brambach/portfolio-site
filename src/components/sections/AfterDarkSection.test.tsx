import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { email } from '../../lib/site';
import { AfterDarkSection } from './AfterDarkSection';

describe('AfterDarkSection', () => {
  it('pulls up a chair', () => {
    render(<AfterDarkSection />);
    expect(screen.getByRole('heading', { name: 'Pull up a chair.' })).toBeInTheDocument();
    expect(screen.getByText(/spikeball until nobody can see the ball/)).toBeInTheDocument();
  });

  it('says hi by mail, address in the open', () => {
    render(<AfterDarkSection />);
    expect(screen.getByRole('link', { name: /say hi/ })).toHaveAttribute(
      'href',
      `mailto:${email}`,
    );
    expect(screen.getByText(email)).toBeInTheDocument();
  });

  it('lets the forest keep going', () => {
    render(<AfterDarkSection />);
    expect(screen.getByText('the forest keeps going · goodnight')).toBeInTheDocument();
    expect(screen.getByText('the good part of the day')).toBeInTheDocument();
    expect(screen.getByText('made it.')).toBeInTheDocument();
  });

  it('is open to moving and names no city', () => {
    const { container } = render(<AfterDarkSection />);
    expect(screen.getByText('open to moving · soon')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk/i);
  });
});
