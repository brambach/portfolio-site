import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OffTheClockSection } from './OffTheClockSection';

describe('OffTheClockSection', () => {
  it('runs it in the family', () => {
    render(<OffTheClockSection />);
    expect(screen.getByRole('heading', { name: 'Run it in the family.' })).toBeInTheDocument();
    expect(screen.getByText(/and counting/)).toBeInTheDocument();
    expect(screen.getByText('dawn miles · clay courts when I can get them')).toBeInTheDocument();
  });

  it('counts the streak to 214', async () => {
    render(<OffTheClockSection />);
    // generous: the count is 1.3s of rAF, but a loaded event loop
    // (parallel suites) can stretch it well past that
    await screen.findByText('214', undefined, { timeout: 10000 });
  }, 12000);

  it('keeps the dream garage', () => {
    render(<OffTheClockSection />);
    expect(screen.getByText('911 · oak green over cognac')).toBeInTheDocument();
    expect(screen.getByText('someday. after the streak hits 1,000')).toBeInTheDocument();
  });
});
