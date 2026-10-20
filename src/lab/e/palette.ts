/* Direction E's colors. The page picks one palette when it loads, from the visitor's own clock, and keeps it: soft
   dawn pinks and blues in the morning (the colors of the reference), a brighter day, a warm late afternoon and a
   deep night that suits the aurora. Nothing on the page says so. `?hour=` previews another time.

   Every photo is dithered down to its palette's tones, so a beach and an aurora sit on the same page without one
   of them looking pasted in. `paper` is the page behind the dots, `ink` the type on it. */

export type RGB = [number, number, number];
export type TimeName = 'dawn' | 'day' | 'golden' | 'night';
export type Palette = {
  name: TimeName;
  /** The page behind the dots. A dot that dithers to this color is left out. */
  paper: string;
  ink: string;
  /** The cursor and the marks. Gold in every palette, tuned to sit on its paper. */
  accent: string;
  /** What the photos are dithered to, dark to light. */
  tones: string[];
  dark: boolean;
};

export const PALETTES: Record<TimeName, Palette> = {
  dawn: {
    name: 'dawn', paper: '#f4d5e0', ink: '#1b2140', accent: '#e3a13f', dark: false,
    tones: ['#1b2140', '#33497a', '#3d8790', '#86b4cc', '#b9cbe6', '#e99ebf', '#f5bfa2', '#fdeae4'],
  },
  day: {
    name: 'day', paper: '#eef2ee', ink: '#13284f', accent: '#dc9c32', dark: false,
    tones: ['#13284f', '#2a5aa6', '#4f98c8', '#a7d1ea', '#477f57', '#a3be68', '#ecd7a2', '#fbf9f1'],
  },
  golden: {
    name: 'golden', paper: '#f6e0c6', ink: '#2e1a33', accent: '#d4872a', dark: false,
    tones: ['#2e1a33', '#6c3247', '#b5553d', '#e6874a', '#f1bd60', '#7b874c', '#eeb09e', '#fde9d2'],
  },
  night: {
    name: 'night', paper: '#0a0f26', ink: '#ecebe6', accent: '#e9b860', dark: true,
    tones: ['#05081a', '#151d46', '#27407d', '#2b7a84', '#5bcf98', '#6a58a6', '#9eb2dc', '#e9e6da'],
  },
};

/** Which palette an hour of the day gets (0 to 24, fractions allowed). */
export function timeOf(hour: number): TimeName {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 10) return 'dawn';
  if (h >= 10 && h < 16) return 'day';
  if (h >= 16 && h < 19.5) return 'golden';
  return 'night';
}

/** The hour to dress the page for: `?hour=` if it's there and makes sense (7, 17.5 or 17:30), otherwise the
 *  visitor's clock. */
export function hourFor(search: string, now: Date = new Date()): number {
  const raw = new URLSearchParams(search).get('hour');
  if (raw !== null) {
    const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(raw.trim());
    const n = m ? Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0) : Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 24) return n;
  }
  return now.getHours() + now.getMinutes() / 60;
}

export const paletteFor = (search: string, now?: Date) => PALETTES[timeOf(hourFor(search, now))];

export const hex = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
export const lum = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
