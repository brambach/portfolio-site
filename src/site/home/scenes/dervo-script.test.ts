import { describe, expect, it } from 'vitest';
import { DERVO } from '../copy';
import { BEATS, LITE, MOCK, STEPS, TALLIES, beatAt, cursorAt, lineAt, liteStates, stateAt, tallyAt, tallyText } from './dervo-script';

const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
const increasing = (xs: number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);

describe('The dervo script', () => {
  it('has six beats in order, with the brief\'s lines, on a clock from 0 to 1', () => {
    expect(BEATS).toHaveLength(6);
    expect(BEATS.map(b => b.line)).toEqual(DERVO.beats);
    const at = BEATS.map(b => b.at);
    expect(at[0]).toBe(0);
    expect(increasing(at)).toBe(true);
    expect(at.every(a => a >= 0 && a < 1)).toBe(true);
  });

  it('runs its steps in order inside 0 to 1, each beat doing some of the work', () => {
    const at = STEPS.map(s => s.at);
    expect(increasing(at)).toBe(true);
    expect(at.every(a => a > 0 && a <= 1)).toBe(true);
    for (let i = 0; i < BEATS.length; i++) {
      const end = BEATS[i + 1]?.at ?? 1;
      expect(STEPS.some(s => s.at >= BEATS[i].at && s.at < end), `beat ${i + 1}`).toBe(true);
    }
  });

  it('starts empty and ends approved, split, counted and quiet', () => {
    expect(stateAt(0)).toMatchObject({ threads: 0, open: false, review: 'none' });
    expect(stateAt(1)).toMatchObject({ threads: 3, open: true, agent: 'codex', split: true, beta: true, run: 5, review: 'approved', quiet: true });
    expect(tallyAt(1)).toBe(1);
    expect(TALLIES.map(t => tallyText(t.to, t.plus, 1))).toEqual(['18', '1,500+']);
    expect(tallyText(1500, true, 0.5)).not.toContain('+');
  });

  it('shows one beat line at a time, never two at once', () => {
    for (let p = 0; p <= 1; p += 0.001) {
      const shown = BEATS.filter((_, i) => lineAt(i, p).o > 0.01);
      expect(shown.length).toBeLessThanOrEqual(1);
    }
    expect(beatAt(0.5)).toBe(3);
    expect(lineAt(5, 1).o).toBe(1);
  });

  it('moves the cursor without jumps', () => {
    const anchors = { 'new-thread': [40, 200], 'thread-ideas': [80, 300], 'agent-codex': [400, 90], chips: [520, 90], split: [700, 90], 'sub-threads': [90, 340], beta: [100, 520], 'not-checked': [300, 360], approve: [260, 470] } as const;
    let prev = cursorAt(0, anchors as never, 880, 560);
    for (let p = 0.001; p <= 1; p += 0.001) {
      const now = cursorAt(p, anchors as never, 880, 560);
      expect(Math.hypot(now[0] - prev[0], now[1] - prev[1])).toBeLessThan(40);
      prev = now;
    }
  });

  it('gives each phone frame a step to play that changes or moves something', () => {
    expect(LITE).toHaveLength(6);
    LITE.forEach((l, i) => {
      const { before, after } = liteStates(i);
      expect(STEPS[l.step], `frame ${i + 1}`).toBeDefined();
      expect(STEPS[l.step].at).toBeGreaterThanOrEqual(BEATS[i].at);
      expect(i === 3 || JSON.stringify(before) !== JSON.stringify(after), `frame ${i + 1}`).toBe(true);
    });
  });

  it('keeps the real numbers out of the sample window', () => {
    for (const s of strings(MOCK)) expect(s, s).not.toMatch(/\b18\b|1,?500|beta testers|agent tasks/);
  });

  it('writes its sample data lowercase, with no em or en dashes and no "parked"', () => {
    const all = [...strings(MOCK), ...BEATS.map(b => b.line)];
    for (const s of all) {
      expect(s, s).not.toMatch(/[–—]/);
      expect(s, s).not.toMatch(/parked/i);
      expect(s, s).toBe(s.toLowerCase());
    }
  });
});
