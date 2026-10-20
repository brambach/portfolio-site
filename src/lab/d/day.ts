import { DAY_BEATS } from '../content';

/* Direction D's day, as numbers. Both the landscape shader (land.ts) and the life drawn over it (life.ts) read the
   same values from here, so the light on the clouds, the haze on the ridges and the color of the grass always
   agree. There's no sun anywhere: the day is told by where the light comes from (low on the left at dawn, high
   overhead at midday, low on the right at dusk, always out of frame) and by the colors below. All of them stay
   dark enough that the cream type reads at every hour. */

export type RGB = [number, number, number];
/** What the landscape looks like at one point in the day. */
export type Look = { zenith: RGB; middle: RGB; haze: RGB; land: RGB; light: RGB; mist: number };

type Stop = [at: number, zenith: string, middle: string, haze: string, land: string, light: string, mist: number];
const STOPS: Stop[] = [
  [0.00, '#090d22', '#262a50', '#a0675e', '#0b0c1a', '#ff9468', 0.95],
  [0.12, '#0d1a3c', '#34437a', '#c69585', '#0f1628', '#ffbd8c', 0.7],
  [0.26, '#0f2852', '#2c5288', '#8ea8c0', '#122036', '#ffeedb', 0.3],
  [0.44, '#0d2d5c', '#265890', '#93b0c8', '#14263e', '#f4f6ff', 0.12],
  [0.60, '#11295a', '#2f5288', '#a4a8b4', '#152234', '#ffe7c0', 0.14],
  [0.76, '#162650', '#4a4577', '#d39a72', '#171728', '#ffb468', 0.26],
  [0.88, '#130e2a', '#4c2446', '#de7a4a', '#130c1c', '#ff7a40', 0.38],
  [1.00, '#06071a', '#1f1432', '#7a3a44', '#07060f', '#d4583e', 0.5],
];
const hex = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const LOOKS = STOPS.map(([at, z, m, h, l, li, mist]) => ({ at, look: { zenith: hex(z), middle: hex(m), haze: hex(h), land: hex(l), light: hex(li), mist } }));
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixC = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** The landscape's colors at a point in the day (0 first light, 1 dusk). */
export function lookAt(day: number): Look {
  let i = 0;
  while (i < LOOKS.length - 2 && day > LOOKS[i + 1].at) i++;
  const a = LOOKS[i], b = LOOKS[i + 1];
  const t = smooth(clamp((day - a.at) / (b.at - a.at)));
  return {
    zenith: mixC(a.look.zenith, b.look.zenith, t), middle: mixC(a.look.middle, b.look.middle, t), haze: mixC(a.look.haze, b.look.haze, t),
    land: mixC(a.look.land, b.look.land, t), light: mixC(a.look.light, b.look.light, t), mist: mix(a.look.mist, b.look.mist, t),
  };
}

/** Where the light comes from, in screen terms (0 to 1 across, and up from the bottom), and how high it is. It
 *  enters from beyond the left edge at dawn, passes above the top of the frame at midday and leaves past the right
 *  edge at dusk, so it never shows as a disc. */
export function lightAt(day: number, horizon: number) {
  // An arc around the frame, wide enough and tall enough that it clears the edges all the way over.
  const a = Math.PI * (1 - clamp(day)), elev = Math.sin(a);
  return { x: 0.5 + 0.85 * Math.cos(a), y: horizon - 0.05 + 1.3 * elev, elev };
}

/** Where the horizon sits on screen (0 bottom, 1 top). The view starts low on the water at first light, looks up a
 *  little through the working day so there's more sky behind the reading, and comes back down to the water for
 *  the evening. Phones sit a little lower because the screen is tall. */
export function horizonAt(day: number, tall = false) {
  const up = smooth(clamp((day - 0.05) / 0.17)), down = smooth(clamp((day - 0.8) / 0.14));
  const [start, mid, end] = tall ? [0.3, 0.15, 0.29] : [0.36, 0.17, 0.34];
  return start + (mid - start) * up + (end - mid) * down;
}

/** Stars only come out in the last minutes of the page. */
export const starsAt = (day: number) => smooth(clamp((day - 0.93) / 0.07));

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (t: string) => {
  const [, h, m, ap] = /(\d+):(\d+) (am|pm)/.exec(t)!;
  return ((Number(h) % 12) + (ap === 'pm' ? 12 : 0)) * 60 + Number(m);
};
const BEAT_MIN = DAY_BEATS.map(b => toMinutes(b.time));
/** The clock at a point in the day, so it reads each part's own hour exactly when you're on it. */
export function clockAt(day: number) {
  let i = 0;
  while (i < DAY_BEATS.length - 2 && day > DAY_BEATS[i + 1].at) i++;
  const a = DAY_BEATS[i], b = DAY_BEATS[i + 1];
  const t = clamp((day - a.at) / (b.at - a.at));
  const m = Math.round(BEAT_MIN[i] + (BEAT_MIN[i + 1] - BEAT_MIN[i]) * t), h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${pad(m % 60)} ${h < 12 ? 'am' : 'pm'}`;
}

export const beatOf = (id: string) => DAY_BEATS.find(b => b.id === id)!;
export const beatIndex = (id: string) => DAY_BEATS.findIndex(b => b.id === id);

/** Without WebGL: the same colors as a gradient, sky to haze to water. */
export function cssLand(day: number) {
  const { zenith, middle, haze, land } = lookAt(day);
  const c = (v: RGB) => `rgb(${v.map(n => Math.round(n * 255)).join(' ')})`;
  const h = Math.round((1 - horizonAt(day)) * 100);
  return `linear-gradient(to bottom, ${c(zenith)}, ${c(middle)} ${h - 22}%, ${c(haze)} ${h}%, ${c(land)} ${h + 1}%, ${c(land)})`;
}
