/**
 * The hare is the pen. It chases the tip of the trail (the reader's mapped
 * position along the path) with a lag and a speed cap, so it visibly runs
 * rather than teleporting, and the dotted trail is laid down behind it.
 */

/** top speed in path px per ms (~1.7k px/s: quick, but you can watch it run) */
export const MAX_SPEED = 1.7;

/** time constant of the chase, ms - higher = lazier pursuit */
const SMOOTHING_MS = 170;

export function pursue(pos: number, target: number, dtMs: number): number {
  const gain = 1 - Math.exp(-dtMs / SMOOTHING_MS);
  let step = (target - pos) * gain;
  const cap = MAX_SPEED * dtMs;
  if (step > cap) step = cap;
  else if (step < -cap) step = -cap;
  return pos + step;
}
