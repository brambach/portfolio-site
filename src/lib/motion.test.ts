import { describe, expect, it } from 'vitest';
import {
  DUR,
  EASE_COVER,
  EASE_INK,
  EASE_SCATTER,
  EASE_SETTLE,
  EASE_STAMP,
  MIST_BLUR,
  ONCE,
  STAGGER,
  mistTransition,
  settleTransition,
} from './motion';

/**
 * The house style is a set of rules about which tier is allowed to cost what.
 * These tests encode the rules, not the numbers, so retuning a value is free
 * and breaking the ordering is not.
 */
describe('motion tiers', () => {
  it('spends time in the right order', () => {
    expect(DUR.exit).toBeLessThan(DUR.utility);
    expect(DUR.utility).toBeLessThan(DUR.signature);
    expect(DUR.signature).toBeLessThan(DUR.statement);
    expect(DUR.statement).toBeLessThan(DUR.statementLong);
  });

  it('leaves faster than it arrives', () => {
    // The whole point of the exit tier. Waiting for something to go is worse
    // than waiting for it to come.
    expect(DUR.exit).toBeLessThanOrEqual(DUR.utility / 2);
  });

  it('lands the ink before the movement finishes', () => {
    expect(DUR.ink).toBeLessThan(DUR.statement);
  });

  it('staggers as a wave, then as a queue', () => {
    expect(STAGGER.wave).toBeLessThan(STAGGER.scatter);
    // Past ~80ms a stagger stops reading as one movement and starts reading
    // as a line of separate ones. The wave has to stay under that.
    expect(STAGGER.wave).toBeLessThanOrEqual(0.08);
  });
});

describe('curves', () => {
  const overshoots = { EASE_SETTLE, EASE_STAMP, EASE_SCATTER };
  const plain = { EASE_INK, EASE_COVER };

  it.each(Object.entries(overshoots))('%s passes its target and returns', (_n, c) => {
    expect(Math.max(c[1], c[3])).toBeGreaterThan(1);
  });

  it.each(Object.entries(plain))('%s does not overshoot', (_n, c) => {
    expect(Math.max(c[1], c[3])).toBeLessThanOrEqual(1);
  });

  it('ranks the overshoot ladder by weight', () => {
    // Softest for things landing from a height, most for the stamp.
    const amount = (c: readonly number[]) => Math.max(c[1], c[3]);
    expect(amount(EASE_SCATTER)).toBeLessThan(amount(EASE_SETTLE));
    expect(amount(EASE_SETTLE)).toBeLessThan(amount(EASE_STAMP));
  });

  it('keeps every control point in a valid bezier range on x', () => {
    for (const c of [EASE_SETTLE, EASE_STAMP, EASE_SCATTER, EASE_INK, EASE_COVER]) {
      expect(c[0]).toBeGreaterThanOrEqual(0);
      expect(c[0]).toBeLessThanOrEqual(1);
      expect(c[2]).toBeGreaterThanOrEqual(0);
      expect(c[2]).toBeLessThanOrEqual(1);
    }
  });
});

describe('settleTransition', () => {
  it('runs opacity ahead of the movement, on the same delay', () => {
    const t = settleTransition(0.3);
    expect(t.duration).toBe(DUR.statement);
    expect(t.delay).toBe(0.3);
    expect(t.opacity.duration).toBeLessThan(t.duration);
    expect(t.opacity.delay).toBe(t.delay);
  });

  it('defaults to no delay', () => {
    expect(settleTransition().delay).toBe(0);
  });
});

describe('mistTransition', () => {
  it('emerges on the statement tier with the settle curve', () => {
    const t = mistTransition(0.2);
    expect(t.duration).toBe(DUR.statement);
    expect(t.ease).toBe(EASE_SETTLE);
    expect(t.delay).toBe(0.2);
  });

  it('clears the blur before the movement finishes', () => {
    // Sharpness is the arrival. If the blur outlives the settle the type
    // reads as broken, not misty.
    const t = mistTransition();
    expect(t.filter.duration).toBeLessThan(t.duration);
  });

  it('runs opacity ahead, like every entrance in the house', () => {
    const t = mistTransition(0.1);
    expect(t.opacity.duration).toBeLessThan(t.duration);
    expect(t.opacity.delay).toBe(0.1);
  });

  it('keeps the blur readable-adjacent, not decorative', () => {
    // Enough to read as fog at arm's length, never so much the layout
    // visibly reflows behind a smear.
    expect(MIST_BLUR).toBeGreaterThanOrEqual(4);
    expect(MIST_BLUR).toBeLessThanOrEqual(8);
  });
});

describe('rationing', () => {
  it('never replays a statement move', () => {
    expect(ONCE.once).toBe(true);
  });
});
