import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { projects } from '../../lib/site';
import { MadeSection } from './MadeSection';

describe('MadeSection', () => {
  it('renders a dot-leader row per project', () => {
    render(<MadeSection />);
    for (const p of projects) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
      expect(screen.getByText(p.oneLiner)).toBeInTheDocument();
      expect(screen.getByText(p.tag)).toBeInTheDocument();
    }
  });

  it('links only the projects that have somewhere to go', () => {
    render(<MadeSection />);
    const linked = projects.filter((p) => p.href).length;
    expect(screen.queryAllByRole('link', { name: /take a look/ })).toHaveLength(linked);
  });

  it('keeps the quiet lowercase label', () => {
    render(<MadeSection />);
    expect(screen.getByText("things I've made")).toBeInTheDocument();
  });
});
