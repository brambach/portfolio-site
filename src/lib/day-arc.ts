/**
 * The scroll is one day. Five stops of scroll progress, dawn paper to city
 * night; the body background lerps between them. Values start from the
 * Motion Study artboard and get tuned against real content.
 */
export const DAY_STOPS: ReadonlyArray<readonly [number, readonly [number, number, number]]> = [
  [0, [242, 235, 221]], // paper · dawn fog
  [0.26, [232, 201, 143]], // golden · shafts through the canopy
  [0.5, [28, 53, 39]], // oak dusk · off the clock
  [0.72, [19, 38, 36]], // fir blue hour · the vibe board
  [1, [13, 23, 18]], // forest night · after dark
];

export type ArcStops = ReadonlyArray<readonly [number, readonly [number, number, number]]>;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function channelsAt(t: number, stops: ArcStops): [number, number, number] {
  const x = clamp01(t);
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (x >= stops[i][0] && x <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const f = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
  return [0, 1, 2].map((i) => Math.round(a[1][i] + (b[1][i] - a[1][i]) * f)) as [
    number,
    number,
    number,
  ];
}

export function dayArcColor(t: number, stops: ArcStops = DAY_STOPS): string {
  return `rgb(${channelsAt(t, stops).join(',')})`;
}

/** Which hour of the day each chapter anchors. Sections without an entry let
 * the lerp run straight through them. */
const HOUR_BY_SECTION: Record<string, readonly [number, number, number]> = {
  hero: [242, 235, 221], // dawn paper
  work: [232, 201, 143], // golden hour
  made: [232, 201, 143], // golden holds through the index
  'off-the-clock': [28, 53, 39], // oak dusk
  'vibe-board': [19, 38, 36], // fir blue hour
  'after-dark': [13, 23, 18], // forest night
};

/**
 * Build the day's stops from where the chapters actually sit on the page,
 * so the light reaches each hour exactly when its section does. Input is
 * section id → scroll progress at which that section owns the viewport.
 * The day always begins on paper at 0 and lands on night at 1.
 */
export function arcStops(positions: Record<string, number>): ArcStops {
  const stops: [number, readonly [number, number, number]][] = [];
  for (const [id, color] of Object.entries(HOUR_BY_SECTION)) {
    const t = positions[id];
    if (t !== undefined) stops.push([clamp01(t), color]);
  }
  stops.sort((a, b) => a[0] - b[0]);
  if (stops.length === 0 || stops[0][0] > 0) stops.unshift([0, HOUR_BY_SECTION.hero]);
  const last = stops[stops.length - 1];
  if (last[0] < 1) stops.push([1, last[1]]);
  return stops;
}

const linearize = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** True once the lerped ground is dark enough to need paper-colored ink. */
export function isDarkAt(t: number, stops: ArcStops = DAY_STOPS): boolean {
  const [r, g, b] = channelsAt(t, stops);
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance < 0.35;
}
