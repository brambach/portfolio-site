import { describe, expect, it } from 'vitest';
import { email, projects, streakDay, streakDayOn, vibeCards } from './site';

describe('site data', () => {
  it('lists the four projects in order with human one-liners', () => {
    expect(projects.map((p) => p.name)).toEqual(['arro', 'trace', 'throughline', 'bryce-os']);
    expect(projects[0].oneLiner).toBe('a running-streak ritual my family actually keeps');
  });

  it('keeps the streak and email', () => {
    expect(streakDay).toBe(streakDayOn(new Date()));
    expect(email).toBe('bryce.rambach@gmail.com');
  });

  it('has a vibe card per photo plus the note', () => {
    expect(vibeCards.filter((c) => c.kind === 'photo')).toHaveLength(4);
    expect(vibeCards.filter((c) => c.kind === 'note')).toHaveLength(1);
  });
});

describe('streakDayOn', () => {
  it('knows day 214 fell on 2026-08-30', () => {
    expect(streakDayOn(new Date(Date.UTC(2026, 7, 30, 12)))).toBe(214);
  });

  it('ticks over the next day', () => {
    expect(streakDayOn(new Date(Date.UTC(2026, 7, 31, 12)))).toBe(215);
  });

  it('never reports less than day one', () => {
    expect(streakDayOn(new Date(Date.UTC(2020, 0, 1)))).toBe(1);
  });
});
