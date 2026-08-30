import { describe, expect, it } from 'vitest';
import { email, projects, streakDay, vibeCards } from './site';

describe('site data', () => {
  it('lists the four projects in order with human one-liners', () => {
    expect(projects.map((p) => p.name)).toEqual(['arro', 'trace', 'throughline', 'bryce-os']);
    expect(projects[0].oneLiner).toBe('a running-streak ritual my family actually keeps');
  });

  it('keeps the streak and email', () => {
    expect(streakDay).toBe(214);
    expect(email).toBe('bryce.rambach@gmail.com');
  });

  it('has a vibe card per photo plus the note', () => {
    expect(vibeCards.filter((c) => c.kind === 'photo')).toHaveLength(4);
    expect(vibeCards.filter((c) => c.kind === 'note')).toHaveLength(1);
  });
});
