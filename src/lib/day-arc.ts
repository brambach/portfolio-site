/**
 * The scroll is one day. Five stops of scroll progress, dawn paper to city
 * night; the body background lerps between them. Values start from the
 * Motion Study artboard and get tuned against real content.
 */
export const DAY_STOPS: ReadonlyArray<readonly [number, readonly [number, number, number]]> = [
  [0, [242, 235, 221]], // paper · dawn
  [0.26, [232, 201, 143]], // golden · the work
  [0.5, [28, 53, 39]], // oak dusk · off the clock
  [0.72, [20, 36, 44]], // blue hour · the vibe board
  [1, [14, 20, 26]], // night · after dark
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function channelsAt(t: number): [number, number, number] {
  const x = clamp01(t);
  let a = DAY_STOPS[0];
  let b = DAY_STOPS[DAY_STOPS.length - 1];
  for (let i = 0; i < DAY_STOPS.length - 1; i++) {
    if (x >= DAY_STOPS[i][0] && x <= DAY_STOPS[i + 1][0]) {
      a = DAY_STOPS[i];
      b = DAY_STOPS[i + 1];
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

export function dayArcColor(t: number): string {
  return `rgb(${channelsAt(t).join(',')})`;
}

const linearize = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** True once the lerped ground is dark enough to need paper-colored ink. */
export function isDarkAt(t: number): boolean {
  const [r, g, b] = channelsAt(t);
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance < 0.35;
}
