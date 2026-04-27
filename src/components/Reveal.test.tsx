import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  it('renders children inside an animated wrapper', () => {
    render(<Reveal><span>hello world</span></Reveal>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('accepts a delay prop without crashing', () => {
    render(<Reveal delay={3}><span>delayed content</span></Reveal>);
    expect(screen.getByText('delayed content')).toBeInTheDocument();
  });

  it('renders with a wrapper element when no `as` prop is given', () => {
    const { container } = render(<Reveal><p>x</p></Reveal>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
