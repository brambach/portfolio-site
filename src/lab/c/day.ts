/* Direction C's day. The visitor's own clock decides where the day starts: open the page at 2 pm and the sky is
   2 pm, and the page runs from there to sunset, with each section taking its share of what's left. Before dawn or
   after dark it starts at first light. ?hour= previews any hour, like the live site. */

export const DAWN = 348, DUSK = 1184; // 5:48 am and 7:44 pm, in minutes
/** The latest a day can start, so there's always an afternoon left to scroll through: 3:30 pm. */
export const LATEST_START = (15 * 60 + 30 - DAWN) / (DUSK - DAWN);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export type Local = { hour: number; minute: number; preview: boolean };
export function readLocal(search = typeof location === 'undefined' ? '' : location.search, now = new Date()): Local {
  const asked = new URLSearchParams(search).get('hour');
  const hour = asked === null || asked === '' ? NaN : Number(asked);
  if (Number.isInteger(hour) && hour >= 0 && hour < 24) return { hour, minute: 0, preview: true };
  return { hour: now.getHours(), minute: now.getMinutes(), preview: false };
}

/** Where a clock time sits in the day: 0 at dawn, 1 at dusk, outside that range at night. */
export const dayAt = (hour: number, minute = 0) => (hour * 60 + minute - DAWN) / (DUSK - DAWN);

export type Start = { D: number; kind: 'now' | 'late' | 'night' };
export function startOf({ hour, minute }: Local): Start {
  const D = dayAt(hour, minute);
  if (D < 0 || D > 1) return { D: 0, kind: 'night' };
  if (D > LATEST_START) return { D: LATEST_START, kind: 'late' };
  return { D, kind: 'now' };
}

/** A beat's place in the visitor's day: its share of whatever's left after the start. */
export const remap = (start: number, at: number) => start + (1 - start) * at;

export function clockAt(D: number) {
  const m = Math.round(DAWN + (DUSK - DAWN) * clamp(D, 0, 1)), h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
export function clockOf({ hour, minute }: Local) {
  return `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

/** The line under the tagline that says where the day starts. */
export function startNote(local: Local, start: Start) {
  const now = clockOf(local);
  const where = local.preview ? `Previewing ${now}` : `It’s ${now} where you are`;
  if (start.kind === 'night') return `${where}, so the day starts at first light.`;
  if (start.kind === 'late') return `${where}. The page starts at ${clockAt(start.D)}, so there’s some afternoon left to scroll through.`;
  return `${where}, so the day starts right now.`;
}

/** Scroll position to time of day and back, through anchors sorted by y. */
export type Anchor = { y: number; D: number };
export function dayFromScroll(anchors: Anchor[], y: number) {
  if (!anchors.length) return 0;
  if (y <= anchors[0].y) return anchors[0].D;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1], b = anchors[i];
    if (y <= b.y) return a.D + (b.D - a.D) * ((y - a.y) / Math.max(1, b.y - a.y));
  }
  return anchors[anchors.length - 1].D;
}
export function scrollFromDay(anchors: Anchor[], D: number) {
  if (!anchors.length) return 0;
  if (D <= anchors[0].D) return anchors[0].y;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1], b = anchors[i];
    if (D <= b.D) return a.y + (b.y - a.y) * ((D - a.D) / Math.max(1e-6, b.D - a.D));
  }
  return anchors[anchors.length - 1].y;
}

// ---- colour -----------------------------------------------------------------------------------------------
export type RGB = [number, number, number];
/** oklch to sRGB 0..1. */
export function oklch(L: number, C: number, h: number): RGB {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map(x => { x = clamp(x, 0, 1); return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }) as RGB;
}
const mix3 = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (t: number) => t * t * (3 - 2 * t);

// The sky through the day (top, middle, horizon), the same stops the live home page uses in src/sky/day.ts, with
// the hue unwrapped so the afternoon goes through violet and rose to amber.
type Stop = [number, [number, number, number], [number, number, number], [number, number, number]];
const DAY: Stop[] = [
  [0.00, [0.165, 0.030, 264], [0.200, 0.024, 284], [0.235, 0.040, 330]],
  [0.14, [0.180, 0.032, 260], [0.205, 0.030, 300], [0.240, 0.040, 340]],
  [0.38, [0.205, 0.036, 252], [0.220, 0.032, 245], [0.245, 0.028, 236]],
  [0.56, [0.222, 0.040, 246], [0.228, 0.032, 250], [0.250, 0.026, 262]],
  [0.76, [0.200, 0.030, 262], [0.215, 0.030, 300], [0.250, 0.050, 382]],
  [0.90, [0.185, 0.026, 285], [0.205, 0.028, 320], [0.255, 0.056, 396]],
  [1.00, [0.170, 0.024, 282], [0.200, 0.022, 305], [0.250, 0.050, 400]],
];
const ok = ([L, C, h]: [number, number, number]) => oklch(L, C, h % 360);
const SKIES = DAY.map(([at, t, m, b]) => [at, ok(t), ok(m), ok(b)] as const);

export function skyAt(D: number): { top: RGB; mid: RGB; low: RGB } {
  D = clamp(D, 0, 1);
  let i = 0;
  while (i < SKIES.length - 2 && D > SKIES[i + 1][0]) i++;
  const a = SKIES[i], b = SKIES[i + 1], t = smooth(clamp((D - a[0]) / (b[0] - a[0]), 0, 1));
  return { top: mix3(a[1], b[1], t), mid: mix3(a[2], b[2], t), low: mix3(a[3], b[3], t) };
}

const c255 = (r: number, g: number, b: number): RGB => [r / 255, g / 255, b / 255];
const SUN_DAWN: [RGB, RGB] = [c255(222, 140, 98), c255(246, 200, 116)];
const SUN_NOON: [RGB, RGB] = [c255(232, 190, 120), c255(252, 232, 186)];
const SUN_DUSK: [RGB, RGB] = [c255(214, 116, 88), c255(244, 168, 92)];
/** The sun's two colours (its glow and its core): warm at either end of the day, paler at noon. */
export function sunAt(D: number): [RGB, RGB] {
  const high = Math.sin(Math.PI * clamp(D, 0, 1));
  const end = D < 0.5 ? SUN_DAWN : SUN_DUSK;
  return [mix3(end[0], SUN_NOON[0], high), mix3(end[1], SUN_NOON[1], high)];
}
