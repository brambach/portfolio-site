import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vibeCards } from '../../lib/site';
import { VibeBoardSection } from './VibeBoardSection';

describe('VibeBoardSection', () => {
  it('says what it is', () => {
    render(<VibeBoardSection />);
    expect(screen.getByRole('heading', { name: 'The vibe board.' })).toBeInTheDocument();
    expect(screen.getByText("Things I love, things I'm after. It's the same list.")).toBeInTheDocument();
  });

  it('pins every print and the note', () => {
    render(<VibeBoardSection />);
    for (const card of vibeCards) {
      if (card.kind === 'photo') {
        expect(screen.getByText(card.caption)).toBeInTheDocument();
      } else {
        // the trailing full stop is a separate clay-colored span
        expect(screen.getByText(new RegExp(card.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\.$/, '')))).toBeInTheDocument();
        expect(screen.getByText(card.sub)).toBeInTheDocument();
      }
    }
    expect(screen.getByText('always running')).toBeInTheDocument();
  });
});
