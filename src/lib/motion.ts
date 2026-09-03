/**
 * The house motion system.
 *
 * Every duration and curve on the site resolves here. Before this file the
 * same values were retyped at each call site and had drifted to nine
 * statement durations and four staggers, which is drift, not taste.
 *
 * Structure follows the studio motion default
 * (`claude-hub/personal-projects/design/motion/default/`). The values are
 * this site's own, measured off the Oak and Clay build. The kit prescribes
 * the tiers and the rationing rule; it does not prescribe the numbers.
 *
 * Mirrored as CSS custom properties in `index.css` under "motion system".
 * Change a value here and change it there.
 */

/* --- Curves ---------------------------------------------------------------
 * The overshoot ladder is the house signature. Three curves that all pass
 * their target and settle back, tuned by how much weight the thing has.
 * Nothing else measured in the motion library varies overshoot per element,
 * so this is deliberate and stays.
 */

/** Statement entrances. Overshoot 1.35: a letterpress plate settling. */
export const EASE_SETTLE = [0.16, 1, 0.3, 1.35] as const;

/** The signature. Overshoot 1.4, the most of the three. Stamps and pokes. */
export const EASE_STAMP = [0.2, 1.4, 0.4, 1] as const;

/** Scatter. Overshoot 1.2, the softest, for things landing from a height. */
export const EASE_SCATTER = [0.16, 1, 0.3, 1.2] as const;

/** A pen. Ease-in-out, so the stroke accelerates and slows. No overshoot. */
export const EASE_INK = [0.6, 0.05, 0.3, 0.95] as const;

/** A sheet lifting away. Slow to commit, fast to clear. No overshoot. */
export const EASE_COVER = [0.5, 0, 0.15, 1] as const;

/* --- Durations, in seconds (Motion's unit) ------------------------------- */

export const DUR = {
  /** The one entrance move. Rationed: at most one per viewport. */
  statement: 0.75,
  /** Entrances that travel a long way: a cover lifting, a pen stroke. */
  statementLong: 1.05,
  /** The signature move. Shorter than a statement, so it reads as a hit. */
  signature: 0.5,
  /** Ink arriving ahead of the movement. Always shorter than its parent. */
  ink: 0.4,
  /** Interaction feedback. */
  utility: 0.3,
  /** Leaving is faster than arriving. Exactly half of utility, by rule. */
  exit: 0.15,
} as const;

/* --- Stagger, in seconds per sibling -------------------------------------- */

export const STAGGER = {
  /** Reads as a wave. Type, rows, letters. */
  wave: 0.08,
  /** Reads as a queue, on purpose. Physically scattered objects. */
  scatter: 0.12,
} as const;

/* --- Composed transitions ------------------------------------------------- */

/**
 * The statement entrance, with opacity running ahead of the movement so ink
 * arrives before the plate has finished settling.
 */
export const settleTransition = (delay = 0) => ({
  duration: DUR.statement,
  ease: EASE_SETTLE,
  delay,
  opacity: { duration: DUR.ink, ease: 'easeOut' as const, delay },
});

/** Viewport config for a statement move. Once, never replayed. */
export const ONCE = { once: true, amount: 0.25 } as const;

/* --- Mist ------------------------------------------------------------------
 * The fog-forest entrance: type arrives the way trees do in mist, blur
 * settling to sharp. Reserved for display type - blur on photographs or
 * long copy costs paint time and reads as a broken lens, not weather.
 */

/** How deep in the fog type starts, in px of blur. */
export const MIST_BLUR = 6;

/**
 * The mist entrance. Movement runs the statement tier on the settle curve;
 * the blur clears just before the settle lands, so sharpness IS the
 * arrival; opacity still runs ahead, like every entrance in the house.
 */
export const mistTransition = (delay = 0) => ({
  duration: DUR.statement,
  ease: EASE_SETTLE,
  delay,
  filter: { duration: DUR.statement * 0.8, ease: 'easeOut' as const, delay },
  opacity: { duration: DUR.ink, ease: 'easeOut' as const, delay },
});
