/**
 * Dash-and-rest. The hare is never glued to the scrollbar: it rests at the
 * last waypoint it reached, and when the reader's progress crosses the next
 * threshold it sprints there in one burst, then sits again. A fling that
 * crosses several thresholds retargets the sprint mid-flight.
 */
export type HareState =
  | { kind: 'hidden' }
  | { kind: 'resting'; at: number }
  | { kind: 'sprinting'; from: number; to: number; start: number };

export const SPRINT_MS = 900;

const easeOutCubic = (f: number) => 1 - (1 - f) ** 3;

export function stepHare(state: HareState, targetWp: number, now: number): HareState {
  if (targetWp < 0) return state.kind === 'hidden' ? state : { kind: 'hidden' };

  switch (state.kind) {
    case 'hidden':
      // first appearance: no entrance sprint, it was simply already there
      return { kind: 'resting', at: targetWp };
    case 'resting':
      if (state.at === targetWp) return state;
      return { kind: 'sprinting', from: state.at, to: targetWp, start: now };
    case 'sprinting': {
      if (now - state.start >= SPRINT_MS) {
        const landed: HareState = { kind: 'resting', at: state.to };
        return stepHare(landed, targetWp, now);
      }
      if (state.to !== targetWp) {
        // retarget mid-flight from the current position in time
        return { kind: 'sprinting', from: state.from, to: targetWp, start: state.start };
      }
      return state;
    }
  }
}

/** Eased 0..1 progress of the current sprint; 1 when not sprinting. */
export function sprintProgress(state: HareState, now: number): number {
  if (state.kind !== 'sprinting') return 1;
  return easeOutCubic(Math.min(1, (now - state.start) / SPRINT_MS));
}
