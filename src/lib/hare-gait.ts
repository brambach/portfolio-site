/**
 * The gait: how the hare's body moves for the ground it actually covers.
 * The stride is a phase (0..1 per bound) advanced by speed, so a slow chase
 * means slow, deliberate hops and a flat-out sprint means a real gallop -
 * the legs never churn faster than the ground goes by. Bounce and body
 * pitch ride the same phase and both flatten out at a crawl.
 */

/** path px one full bound covers in the proportional band */
const STRIDE_PX = 260;

/** strides per second: the legible floor and the flat-out ceiling */
export const MIN_CADENCE = 0.75;
export const MAX_CADENCE = 4.0;

/** speed (px/ms) at which the gait reaches full extension */
const FULL_SPEED = 1.4;

const BOB_MIN = 1.1;
const BOB_MAX = 6.5;
const PITCH_MIN = 0.8;
const PITCH_MAX = 5;

/** a sitting hare ignores target nudges smaller than one small hop */
export const DEADBAND_PX = 12;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const speedT = (speedPxPerMs: number) => clamp01(speedPxPerMs / FULL_SPEED);

/** strides per second for a given ground speed */
export function strideCadence(speedPxPerMs: number): number {
  const raw = (speedPxPerMs * 1000) / STRIDE_PX;
  return Math.min(MAX_CADENCE, Math.max(MIN_CADENCE, raw));
}

export function advancePhase(phase: number, speedPxPerMs: number, dtMs: number): number {
  return phase + strideCadence(speedPxPerMs) * (dtMs / 1000);
}

/** stretch through the airborne part of the bound, gather at the landing */
export function strideFrame(phase: number): 'stretch' | 'gather' {
  const p = ((phase % 1) + 1) % 1;
  return p < 0.62 ? 'stretch' : 'gather';
}

/** vertical lift within the bound, in hare-local px (negative = up) */
export function bobY(phase: number, speedPxPerMs: number): number {
  const p = ((phase % 1) + 1) % 1;
  const amp = BOB_MIN + (BOB_MAX - BOB_MIN) * speedT(speedPxPerMs);
  return -amp * 0.5 * (1 - Math.cos(2 * Math.PI * p));
}

/** body pitch within the bound: nose up on launch, down into the landing */
export function pitchDeg(phase: number, speedPxPerMs: number): number {
  const p = ((phase % 1) + 1) % 1;
  const amp = PITCH_MIN + (PITCH_MAX - PITCH_MIN) * speedT(speedPxPerMs);
  return -amp * Math.sin(2 * Math.PI * p);
}

export function ignoreWhileSitting(gapPx: number): boolean {
  return Math.abs(gapPx) < DEADBAND_PX;
}

/** how close to a waypoint ring counts as squatting on it */
const RING_NEAR_PX = 13;

/** where the hare sits instead: fully beside the ring, on its approach side
 * (the sit drawing spans ~15px around its anchor, the ring another 7) */
export const RING_CLEARANCE_PX = 24;

/**
 * A polite hare sits beside the marker it stamped, never on it. Returns the
 * adjusted sit spot when the given position would squat on a ring, or null
 * when the spot is already clear.
 */
export function sitSpotClearOfRings(
  posPx: number,
  ringsPx: number[],
  facing: 1 | -1,
  totalPx: number,
): number | null {
  const ring = ringsPx.find((r) => Math.abs(posPx - r) < RING_NEAR_PX);
  if (ring === undefined) return null;
  let spot = ring - RING_CLEARANCE_PX * facing;
  if (spot < 0 || spot > totalPx) spot = ring + RING_CLEARANCE_PX * facing;
  return spot;
}
