import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnvelopeReveal } from './EnvelopeReveal';
import { InkNote } from './InkNote';
import { Polaroid } from './Polaroid';
import { Settle } from './Settle';
import { StreakNumber } from './StreakNumber';

describe('primitives', () => {
  it('Settle renders its children', () => {
    render(<Settle>hello</Settle>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('InkNote renders handwritten text', () => {
    render(<InkNote>made it.</InkNote>);
    expect(screen.getByText('made it.')).toBeInTheDocument();
  });

  it('EnvelopeReveal renders the image with alt text', () => {
    render(<EnvelopeReveal src="/images/macbook-desk.jpg" alt="the desk at 6pm" />);
    expect(screen.getByAltText('the desk at 6pm')).toBeInTheDocument();
  });

  it('Polaroid shows its caption', () => {
    render(
      <Polaroid src="/images/green-911.jpg" alt="a green 911" caption="the someday car" rotate={1.6} />,
    );
    expect(screen.getByText('the someday car')).toBeInTheDocument();
  });

  it('StreakNumber lands on the target', async () => {
    render(<StreakNumber value={214} />);
    // generous: the count is 1.3s of rAF, but a loaded event loop
    // (parallel suites) can stretch it well past that
    await screen.findByText('214', undefined, { timeout: 10000 });
  }, 12000);
});
