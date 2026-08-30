import { describe, expect, it } from 'vitest';
import { SPRINT_MS, sprintProgress, stepHare } from './hare-state';

describe('stepHare', () => {
  it('stays hidden before the first waypoint', () => {
    expect(stepHare({ kind: 'hidden' }, -1, 0)).toEqual({ kind: 'hidden' });
  });

  it('appears resting at the first waypoint it reaches', () => {
    expect(stepHare({ kind: 'hidden' }, 0, 500)).toEqual({ kind: 'resting', at: 0 });
  });

  it('sprints when the target moves ahead', () => {
    expect(stepHare({ kind: 'resting', at: 0 }, 1, 1000)).toEqual({
      kind: 'sprinting',
      from: 0,
      to: 1,
      start: 1000,
    });
  });

  it('retargets mid-sprint without restarting from rest', () => {
    const s = stepHare({ kind: 'sprinting', from: 0, to: 1, start: 1000 }, 2, 1200);
    expect(s).toMatchObject({ kind: 'sprinting', to: 2 });
  });

  it('settles to resting when the sprint completes', () => {
    const s = stepHare({ kind: 'sprinting', from: 0, to: 1, start: 0 }, 1, SPRINT_MS + 1);
    expect(s).toEqual({ kind: 'resting', at: 1 });
  });

  it('sprints backward on scroll up', () => {
    expect(stepHare({ kind: 'resting', at: 2 }, 1, 0)).toMatchObject({
      kind: 'sprinting',
      from: 2,
      to: 1,
    });
  });

  it('does nothing while resting at the target', () => {
    expect(stepHare({ kind: 'resting', at: 1 }, 1, 99)).toEqual({ kind: 'resting', at: 1 });
  });
});

describe('sprintProgress', () => {
  it('eases out: past halfway before half time', () => {
    const mid = sprintProgress({ kind: 'sprinting', from: 0, to: 1, start: 0 }, SPRINT_MS / 2);
    expect(mid).toBeGreaterThan(0.5);
    expect(sprintProgress({ kind: 'sprinting', from: 0, to: 1, start: 0 }, SPRINT_MS)).toBe(1);
  });

  it('is 1 for non-sprinting states', () => {
    expect(sprintProgress({ kind: 'resting', at: 0 }, 100)).toBe(1);
    expect(sprintProgress({ kind: 'hidden' }, 100)).toBe(1);
  });
});
