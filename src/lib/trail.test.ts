import { describe, expect, it } from 'vitest';
import { buildTrailPath, waypointThresholds } from './trail';

describe('buildTrailPath', () => {
  it('starts at the first point and visits every point', () => {
    const d = buildTrailPath([
      { x: 450, y: 600 },
      { x: 90, y: 1500 },
      { x: 260, y: 2400 },
    ]);
    expect(d.startsWith('M 450 600')).toBe(true);
    expect(d).toContain('90 1500');
    expect(d).toContain('260 2400');
  });

  it('returns empty string for fewer than 2 points', () => {
    expect(buildTrailPath([{ x: 1, y: 2 }])).toBe('');
    expect(buildTrailPath([])).toBe('');
  });
});

describe('waypointThresholds', () => {
  it('maps waypoint document positions to 0..1 scroll progress', () => {
    const t = waypointThresholds([0, 2000, 4000], 5000, 1000);
    expect(t[0]).toBe(0);
    expect(t[1]).toBeCloseTo((2000 - 600) / 4000);
    expect(t[2]).toBeLessThanOrEqual(1);
  });

  it('is monotonic and clamped', () => {
    const t = waypointThresholds([100, 900, 3000, 4900], 5000, 1000);
    expect([...t].sort((a, b) => a - b)).toEqual(t);
    expect(t.every((v) => v >= 0 && v <= 1)).toBe(true);
  });
});
