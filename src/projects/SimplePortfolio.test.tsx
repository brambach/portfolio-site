import { fireEvent, render, screen } from '@testing-library/react';
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

describe('SimplePortfolio design directions', () => {
  it('switches the look from the direction picker and keeps it in the URL', () => {
    render(<SimplePortfolio />);
    const page = screen.getByRole('main');
    expect(page).toHaveAttribute('data-look', 'plus');
    fireEvent.click(screen.getByRole('radio', { name: 'Graphite' }));
    expect(page).toHaveAttribute('data-look', 'graphite');
    expect(window.location.search).toContain('look=graphite');
    window.history.replaceState(null, '', '/');
  });

  it('keeps the moving Original+ headline readable as one heading', () => {
    render(<SimplePortfolio />);
    expect(screen.getByRole('heading', { level: 1, name: 'Hi, I’m Bryce. I design and build software you can feel.' })).toBeInTheDocument();
  });
});
