import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard><p>card body</p></GlassCard>);
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('applies className overrides', () => {
    const { container } = render(<GlassCard className="custom-x"><p>x</p></GlassCard>);
    expect(container.firstChild).toHaveClass('custom-x');
  });

  it('passes through `as` element type', () => {
    render(<GlassCard as="article"><p>art</p></GlassCard>);
    expect(screen.getByText('art').closest('article')).toBeInTheDocument();
  });
});
