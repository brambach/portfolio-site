import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppleButton } from './AppleButton';

describe('AppleButton', () => {
  it('renders a <button> by default', () => {
    render(<AppleButton variant="primary">Click</AppleButton>);
    const el = screen.getByRole('button', { name: 'Click' });
    expect(el.tagName).toBe('BUTTON');
  });

  it('renders an <a> when href is provided', () => {
    render(
      <AppleButton variant="ghost" href="/resume.pdf">
        Résumé
      </AppleButton>
    );
    const el = screen.getByRole('link', { name: 'Résumé' });
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '/resume.pdf');
  });

  it('applies primary variant classes', () => {
    render(<AppleButton variant="primary">Go</AppleButton>);
    const el = screen.getByRole('button');
    expect(el.className).toMatch(/primary/);
  });

  it('applies ghost variant classes', () => {
    render(<AppleButton variant="ghost">Go</AppleButton>);
    const el = screen.getByRole('button');
    expect(el.className).toMatch(/ghost/);
  });

  it('forwards target and rel on anchor variant', () => {
    render(
      <AppleButton variant="primary" href="/x" target="_blank" rel="noopener">
        Open
      </AppleButton>
    );
    const el = screen.getByRole('link');
    expect(el).toHaveAttribute('target', '_blank');
    expect(el).toHaveAttribute('rel', 'noopener');
  });

  it('forwards onClick on button variant', async () => {
    let clicked = false;
    render(
      <AppleButton variant="primary" onClick={() => { clicked = true; }}>
        Tap
      </AppleButton>
    );
    screen.getByRole('button').click();
    expect(clicked).toBe(true);
  });
});
