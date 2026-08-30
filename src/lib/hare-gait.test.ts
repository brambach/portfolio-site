import { describe, expect, it } from 'vitest';
import {
  DEADBAND_PX,
  MAX_CADENCE,
  MIN_CADENCE,
  advancePhase,
  bobY,
  ignoreWhileSitting,
  pitchDeg,
  strideCadence,
  strideFrame,
  sitSpotClearOfRings,
  RING_CLEARANCE_PX,
} from './hare-gait';

describe('strideCadence', () => {
  it('caps at a real gallop when the hare sprints flat out', () => {
    expect(strideCadence(1.7)).toBe(MAX_CADENCE);
  });

  it('never churns slower than a legible hop while moving', () => {
    expect(strideCadence(0.05)).toBe(MIN_CADENCE);
  });

  it('scales with ground speed in between', () => {
    const slow = strideCadence(0.4);
    const brisk = strideCadence(0.8);
    expect(brisk).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(MIN_CADENCE);
    expect(brisk).toBeLessThan(MAX_CADENCE);
  });
});

describe('advancePhase', () => {
  it('moves the stride forward with time at a speed-set cadence', () => {
    const next = advancePhase(0, 1.7, 250);
    expect(next).toBeCloseTo(MAX_CADENCE * 0.25, 5);
  });

  it('is frame-rate independent at constant speed', () => {
    let a = 0;
    for (let i = 0; i < 4; i++) a = advancePhase(a, 0.8, 16);
    const b = advancePhase(0, 0.8, 64);
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('strideFrame', () => {
  it('shows the stretch through the airborne half', () => {
    expect(strideFrame(0.2)).toBe('stretch');
  });

  it('shows the gather at the landing', () => {
    expect(strideFrame(0.8)).toBe('gather');
  });

  it('wraps past a full stride', () => {
    expect(strideFrame(1.2)).toBe('stretch');
  });
});

describe('bobY', () => {
  it('is on the ground at the start of a stride', () => {
    expect(bobY(0, 1.7)).toBeCloseTo(0, 5);
  });

  it('lifts to its apex mid-stride', () => {
    const apex = bobY(0.5, 1.7);
    expect(apex).toBeLessThan(bobY(0.1, 1.7));
    expect(apex).toBeLessThan(-3);
  });

  it('bounds high at speed, barely hops at a crawl', () => {
    expect(Math.abs(bobY(0.5, 1.7))).toBeGreaterThan(Math.abs(bobY(0.5, 0.1)) * 2);
  });
});

describe('pitchDeg', () => {
  it('pitches nose-up on the way up', () => {
    expect(pitchDeg(0.25, 1.7)).toBeLessThan(0);
  });

  it('pitches nose-down into the landing', () => {
    expect(pitchDeg(0.75, 1.7)).toBeGreaterThan(0);
  });

  it('stays nearly level at a crawl', () => {
    expect(Math.abs(pitchDeg(0.25, 0.05))).toBeLessThan(Math.abs(pitchDeg(0.25, 1.7)) / 2);
  });
});

describe('ignoreWhileSitting', () => {
  it('lets a resting hare ignore a nudge smaller than a hop', () => {
    expect(ignoreWhileSitting(DEADBAND_PX - 2)).toBe(true);
    expect(ignoreWhileSitting(-(DEADBAND_PX - 2))).toBe(true);
  });

  it('gets up once the reader has really moved', () => {
    expect(ignoreWhileSitting(DEADBAND_PX + 6)).toBe(false);
  });
});

describe('sitSpotClearOfRings', () => {
  const rings = [0, 400, 900];

  it('leaves the spot alone away from any ring', () => {
    expect(sitSpotClearOfRings(200, rings, 1, 900)).toBeNull();
  });

  it('sidesteps to just short of a ring it would squat on', () => {
    expect(sitSpotClearOfRings(898, rings, 1, 900)).toBe(900 - RING_CLEARANCE_PX);
  });

  it('sidesteps forward off the trail head when facing back up the page', () => {
    expect(sitSpotClearOfRings(4, rings, -1, 900)).toBe(RING_CLEARANCE_PX);
  });

  it('never sidesteps outside the path', () => {
    const spot = sitSpotClearOfRings(899, rings, -1, 900);
    expect(spot).toBeLessThanOrEqual(900);
    expect(spot).toBeGreaterThanOrEqual(0);
  });
});
