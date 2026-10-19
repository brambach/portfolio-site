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
    expect(screen.getByText('somewhere with good light')).toBeInTheDocument();
  });

  it('promises the fog will lift', () => {
    render(<HeroDawn />);
    expect(screen.getByText('the fog lifts as you scroll')).toBeInTheDocument();
  });
});
