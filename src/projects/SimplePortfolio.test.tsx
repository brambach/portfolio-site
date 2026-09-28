import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SimplePortfolio from './SimplePortfolio';
import { projects } from './catalog';

describe('SimplePortfolio', () => {
  it('puts every project on a billboard that opens its study', () => {
    render(<SimplePortfolio />);
    for (const project of projects) {
      expect(screen.getByRole('link', { name: `${project.name}: ${project.line}` })).toHaveAttribute('href', `/projects/${project.id}`);
    }
  });

  it('ends the drive with a way into the 3D Porsche', () => {
    render(<SimplePortfolio />);
    expect(screen.getByRole('link', { name: /take the wheel/i })).toHaveAttribute('href', '/');
  });
});
