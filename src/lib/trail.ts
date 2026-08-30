/**
 * Geometry for the trail spine. The path meanders between waypoints with
 * cubic curves whose control points pull vertically, so the line flows like
 * a walked route rather than a wire diagram.
 */
export function buildTrailPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const pull = (b.y - a.y) * 0.4;
    parts.push(`C ${a.x} ${a.y + pull} ${b.x} ${b.y - pull} ${b.x} ${b.y}`);
  }
  return parts.join(' ');
}

/**
 * Scroll progress (0..1) at which each waypoint counts as reached: when its
 * document y sits 60% down the viewport. Clamped and monotonic by input
 * order (callers pass waypoints top to bottom).
 */
export function waypointThresholds(
  ys: number[],
  docHeight: number,
  viewport: number,
): number[] {
  const maxScroll = Math.max(1, docHeight - viewport);
  return ys.map((y) => Math.min(1, Math.max(0, (y - viewport * 0.6) / maxScroll)));
}
