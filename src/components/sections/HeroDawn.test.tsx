import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroDawn } from './HeroDawn';

describe('HeroDawn', () => {
  it('sets the wordmark with the clay full stop', () => {
    render(<HeroDawn />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('bryce.');
  });

  it('carries the subline and the coordinates', () => {
    render(<HeroDawn />);
    expect(screen.getByText(/run before the sun's up/)).toBeInTheDocument();
    expect(screen.getByText('the home city')).toBeInTheDocument();
  });

  it('invites the scroll down the trail', () => {
    render(<HeroDawn />);
    expect(screen.getByText('follow the trail')).toBeInTheDocument();
  });
});
