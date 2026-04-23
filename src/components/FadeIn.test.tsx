import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FadeIn } from './FadeIn';

describe('FadeIn', () => {
  it('renders its children', () => {
    render(<FadeIn>hello world</FadeIn>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('forwards className to the underlying element', () => {
    render(
      <FadeIn className="custom-class">
        <span>inside</span>
      </FadeIn>
    );
    const parent = screen.getByText('inside').parentElement;
    expect(parent?.className).toContain('custom-class');
  });

  it('renders as the tag specified by `as`', () => {
    render(
      <FadeIn as="section">
        <span>body</span>
      </FadeIn>
    );
    expect(screen.getByText('body').parentElement?.tagName).toBe('SECTION');
  });
});
