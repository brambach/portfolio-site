import { describe, expect, it } from 'vitest';
import { getStageState } from './projects-progress';

describe('getStageState', () => {
  const STAGES = 4;

  it('at progress 0 activates stage 0 at full opacity', () => {
    const s = getStageState(0, STAGES);
    expect(s.activeIndex).toBe(0);
    expect(s.opacities[0]).toBeCloseTo(1, 2);
    expect(s.opacities[1]).toBeCloseTo(0, 2);
  });

  it('at progress 0.125 (middle of stage 0) still shows stage 0 fully', () => {
    const s = getStageState(0.125, STAGES);
    expect(s.activeIndex).toBe(0);
    expect(s.opacities[0]).toBeCloseTo(1, 2);
  });

  it('at progress 0.25 (boundary 0→1) is mid-crossfade', () => {
    const s = getStageState(0.25, STAGES);
    expect(s.opacities[0]).toBeCloseTo(0.5, 1);
    expect(s.opacities[1]).toBeCloseTo(0.5, 1);
  });

  it('at progress 0.30 stage 1 is fully active', () => {
    const s = getStageState(0.30, STAGES);
    expect(s.activeIndex).toBe(1);
    expect(s.opacities[1]).toBeCloseTo(1, 2);
    expect(s.opacities[0]).toBeCloseTo(0, 2);
  });

  it('at progress 1 the last stage is fully active', () => {
    const s = getStageState(1, STAGES);
    expect(s.activeIndex).toBe(STAGES - 1);
    expect(s.opacities[STAGES - 1]).toBeCloseTo(1, 2);
  });

  it('returns opacities array of the correct length', () => {
    const s = getStageState(0.5, STAGES);
    expect(s.opacities).toHaveLength(STAGES);
  });

  it('ticks fill cumulatively as progress advances', () => {
    expect(getStageState(0, 4).tickFills).toEqual([1, 0, 0, 0]);
    expect(getStageState(0.30, 4).tickFills).toEqual([1, 1, 0, 0]);
    expect(getStageState(0.55, 4).tickFills).toEqual([1, 1, 1, 0]);
    expect(getStageState(0.80, 4).tickFills).toEqual([1, 1, 1, 1]);
  });
});
