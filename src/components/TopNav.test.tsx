import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopNav } from './TopNav';

describe('TopNav', () => {
  it('anchors the four quiet links', () => {
    render(<TopNav />);
    expect(screen.getByRole('link', { name: 'work' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'life' })).toHaveAttribute('href', '#off-the-clock');
    expect(screen.getByRole('link', { name: 'now' })).toHaveAttribute('href', '#vibe-board');
    expect(screen.getByRole('link', { name: 'say hi' })).toHaveAttribute('href', '#after-dark');
  });

  it('marks the way home with the hare', () => {
    render(<TopNav />);
    expect(screen.getByRole('link', { name: 'back to the top' })).toHaveAttribute('href', '#hero');
  });
});
