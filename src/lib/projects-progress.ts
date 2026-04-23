export type StageState = {
  activeIndex: number;
  opacities: number[];
  tickFills: number[];
};

/**
 * Given a 0–1 scroll progress across a pinned section with N stages, return the
 * per-stage opacities for a crossfade and the cumulative tick-fill state.
 *
 * The swap window around each boundary spans ±SWAP_HALF progress units (so the
 * crossfade is visible in ~10% of the pin duration around each boundary).
 */
const SWAP_HALF = 0.05; // half-width of each boundary swap window, in progress units

export function getStageState(progress: number, stages: number): StageState {
  const clamped = Math.min(1, Math.max(0, progress));
  const stageLen = 1 / stages;

  // Which stage are we "in" by raw scroll? (integer 0..stages-1)
  let activeIndex = Math.min(stages - 1, Math.floor(clamped / stageLen));

  const opacities = new Array<number>(stages).fill(0);

  for (let i = 0; i < stages; i++) {
    const start = i * stageLen;
    const end = (i + 1) * stageLen;

    // Stage i is at full opacity from [start + SWAP_HALF, end - SWAP_HALF]
    // and crossfades at its boundaries.
    if (clamped < start - SWAP_HALF) {
      opacities[i] = 0;
    } else if (clamped < start + SWAP_HALF) {
      // entering: fade in from 0 → 1
      const t = (clamped - (start - SWAP_HALF)) / (2 * SWAP_HALF);
      opacities[i] = t;
    } else if (clamped < end - SWAP_HALF) {
      opacities[i] = 1;
    } else if (clamped < end + SWAP_HALF) {
      // exiting: fade out from 1 → 0
      const t = (clamped - (end - SWAP_HALF)) / (2 * SWAP_HALF);
      opacities[i] = 1 - t;
    } else {
      opacities[i] = 0;
    }
  }

  // First stage has no entering fade; last stage has no exiting fade.
  opacities[0] = Math.max(opacities[0], clamped < stageLen - SWAP_HALF ? 1 : opacities[0]);
  opacities[stages - 1] = Math.max(
    opacities[stages - 1],
    clamped > 1 - stageLen + SWAP_HALF ? 1 : opacities[stages - 1],
  );

  // Ticks: tick i is lit once progress has advanced at least i*stageLen
  const tickFills = new Array<number>(stages).fill(0);
  for (let i = 0; i < stages; i++) {
    const t = i * stageLen;
    tickFills[i] = clamped >= t ? 1 : 0;
  }

  // activeIndex: the stage with the highest opacity (ties broken by order)
  let maxOp = -1;
  for (let i = 0; i < stages; i++) {
    if (opacities[i] > maxOp) {
      maxOp = opacities[i];
      activeIndex = i;
    }
  }

  return { activeIndex, opacities, tickFills };
}
