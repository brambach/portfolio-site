import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CosmicBackground } from './CosmicBackground';

describe('CosmicBackground', () => {
  it('renders a fixed, aria-hidden background stage', () => {
    const { container } = render(<CosmicBackground />);
    const stage = container.firstChild as HTMLElement;
    expect(stage).toHaveAttribute('aria-hidden', 'true');
    expect(stage.className).toContain('cosmic-bg');
  });
});
