import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QuietIndex from './QuietIndex';
import { projects } from './catalog';

describe('QuietIndex', () => {
  it('lists the work with Dervo first, each row opening its study', () => {
    render(<QuietIndex />);
    const work = screen.getByRole('heading', { name: 'work' }).closest('section') as HTMLElement;
    const rows = within(work).getAllByRole('link');
    expect(rows[0]).toHaveAccessibleName(/^Dervo/);
    expect(rows).toHaveLength(projects.length);
    for (const project of projects) {
      expect(within(work).getByRole('link', { name: new RegExp(`^${project.name}`) })).toHaveAttribute('href', `/projects/${project.id}`);
    }
  });

  it('keeps the road and the 3D drive one link away', () => {
    render(<QuietIndex />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(within(nav).getByRole('link', { name: 'the drive' })).toHaveAttribute('href', '/drive');
    expect(within(nav).getByRole('link', { name: 'the road' })).toHaveAttribute('href', '/work');
  });

  it('reads the headline as plain words, not letter by letter', () => {
    render(<QuietIndex />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('I’m Bryce.');
    const letters = document.querySelectorAll('[data-glyph]');
    expect(letters.length).toBeGreaterThan(100);
    for (const letter of letters) expect(letter.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows the four photos with captions and no tape or tyre marks', () => {
    const { container } = render(<QuietIndex />);
    const photos = screen.getByRole('complementary', { name: 'Photos' });
    expect(within(photos).getAllByRole('img').map(img => img.getAttribute('alt'))).toHaveLength(4);
    for (const caption of ['the someday car', 'clay season', 'dawn miles', 'winter, occasionally']) {
      expect(within(photos).getByText(caption)).toBeInTheDocument();
    }
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('[class*="tape"]')).toBeNull();
  });

  it('opens in the green look and switches with ?look=', () => {
    const { container, unmount } = render(<QuietIndex />);
    expect(container.querySelector('.qi')).toHaveAttribute('data-look', 'green');
    unmount();
    window.history.pushState({}, '', '/next?look=bone');
    const bone = render(<QuietIndex />);
    expect(bone.container.querySelector('.qi')).toHaveAttribute('data-look', 'bone');
    bone.unmount();
    window.history.pushState({}, '', '/next?look=nonsense');
    const odd = render(<QuietIndex />);
    expect(odd.container.querySelector('.qi')).toHaveAttribute('data-look', 'green');
    window.history.pushState({}, '', '/');
  });
});
