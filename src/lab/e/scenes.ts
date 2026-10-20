import type { RGB } from './palette';

/* Which photo each part of the page is made of, where it sits on screen and how it moves while you read.

   A photo fills a rectangle of the screen (fractions of the viewport) and dissolves at its edges in blocks, the
   way the reference does, toward wherever the words are. `wash` says how far a spot is dissolved (0 the photo,
   1 paper). `life` says what each dot does while it waits: water ripples, leaves catch the wind, the aurora drifts
   and shimmers, snow and stars glint now and then. It gets the spot in the photo's own coordinates (0 to 1 across
   and down the whole photo) and the photo's color there. */

export type SceneId = 'hero' | 'intro' | 'integrations' | 'agents' | 'harnesses' | 'design' | 'product' | 'work' | 'contact';
/** What a dot does while it's home. 0 sits still. Type and static only happen in code, never in a photo. */
export const LIFE = { still: 0, water: 1, leaves: 2, aurora: 3, glint: 4, dust: 5, static: 6, type: 9 } as const;

export type Photo = {
  src: string;
  /** Said once, quietly, in the header while the scene is up. No place names. */
  caption: string;
  /** Where the photo's crop sits when the screen's shape cuts some of it off (0 to 1 across and down). */
  focus: [number, number];
  life: (u: number, v: number, c: RGB) => number;
};

const L = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

export const PHOTOS: Record<Exclude<SceneId, 'work'>, Photo> = {
  hero: {
    src: '/lab/e/lake.jpg', caption: 'A lake at golden hour', focus: [0.42, 0.55],
    life: (u, v, [r, g, b]) => {
      if (v > 0.52 && u < 0.66 && b > r) return LIFE.water;
      if (v > 0.36 && u > 0.44 && g > b && r > 0.3) return LIFE.leaves;
      if (v > 0.4 && v < 0.5 && L([r, g, b]) > 0.72) return LIFE.glint;
      return LIFE.still;
    },
  },
  intro: { src: '/lab/e/headshot.jpg', caption: 'A portrait', focus: [0.5, 0.3], life: () => LIFE.still },
  integrations: {
    src: '/lab/e/creek.jpg', caption: 'A creek through tall trees', focus: [0.5, 0.6],
    life: (_u, v, [r, g, b]) => {
      if (v > 0.84) return LIFE.water;
      if (v < 0.8 && g >= r * 0.92 && g > b * 1.05) return LIFE.leaves;
      return LIFE.still;
    },
  },
  agents: {
    src: '/lab/e/aspen-trail.jpg', caption: 'A trail under yellow leaves', focus: [0.5, 0.45],
    life: (_u, v, [r, g, b]) => (v < 0.86 && r > 0.42 && g > 0.38 && b < g * 0.78 ? LIFE.leaves : LIFE.still),
  },
  harnesses: {
    src: '/lab/e/snow-ridge.jpg', caption: 'A snowy ridge in winter', focus: [0.62, 0.5],
    life: (_u, v, c) => (v > 0.42 && L(c) > 0.74 ? LIFE.glint : LIFE.still),
  },
  design: {
    src: '/lab/e/beach.jpg', caption: 'A beach under a clear sky', focus: [0.3, 0.5],
    life: (u, v, [r, g, b]) => {
      if (u < 0.34 && v > 0.7 && v < 0.86) return LIFE.water;
      if (v > 0.52 && v < 0.7 && g > b) return LIFE.leaves;
      return LIFE.still;
    },
  },
  product: {
    src: '/lab/e/aurora-field.jpg', caption: 'An aurora over a snowy field', focus: [0.62, 0.45],
    life: (_u, v, [r, g, b]) => {
      if (v < 0.76 && g > r * 1.2 && g > b * 0.8 && g > 0.22) return LIFE.aurora;
      if (v < 0.7 && L([r, g, b]) > 0.5) return LIFE.glint;
      return LIFE.still;
    },
  },
  contact: {
    src: '/lab/e/aurora-road.jpg', caption: 'An aurora over a winter road', focus: [0.5, 0.4],
    life: (_u, v, [r, g, b]) => {
      if (v < 0.7 && g > r * 1.2 && g > b * 0.8 && g > 0.2) return LIFE.aurora;
      if (v < 0.6 && L([r, g, b]) > 0.5) return LIFE.glint;
      return LIFE.still;
    },
  },
};

export const SCENE_ORDER: SceneId[] = ['hero', 'intro', 'integrations', 'agents', 'harnesses', 'design', 'product', 'work', 'contact'];

export type Layout = {
  rect: [x0: number, y0: number, x1: number, y1: number];
  /** How dissolved a spot is, from where it sits on screen (x, y) and in the rectangle (u, v), all 0 to 1. */
  wash: (x: number, y: number, u: number, v: number) => number;
};

const ramp = (a: number, b: number, t: number) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
/** Edges that dissolve all the way round, for the portrait. */
const frame = (edge: number) => (_x: number, _y: number, u: number, v: number) => 1 - ramp(0, edge, Math.min(u, 1 - u, v, 1 - v));

/** Where a scene sits. On a wide screen the words keep the left and the photo takes the right, dissolving toward
 *  them. On a phone the photo takes the top of the screen and dissolves downward. The hero is the one that fills
 *  the screen: the lake's sky melts into the paper the tagline is set on. */
export function layoutFor(id: SceneId, phone: boolean): Layout {
  if (id === 'hero') return phone
    ? { rect: [0, 0.38, 1, 1], wash: (_x, y) => 1 - ramp(0.4, 0.6, y) }
    : { rect: [0, 0.28, 1, 1], wash: (x, y) => Math.max(1 - ramp(0.3, 0.5, y), (1 - ramp(0.36, 0.56, y)) * (1 - ramp(0.45, 0.8, x))) };
  if (id === 'intro') return phone ? { rect: [0.1, 0.07, 0.9, 0.5], wash: frame(0.14) } : { rect: [0.55, 0.11, 0.93, 0.93], wash: frame(0.12) };
  return phone
    ? { rect: [0, 0, 1, 0.6], wash: (_x, y) => ramp(0.32, 0.6, y) }
    : { rect: [0.42, 0, 1, 1], wash: (x, y) => Math.max(1 - ramp(0.44, 0.68, x), (1 - ramp(0, 0.12, y)) * 0.6) };
}

/** The cover crop of a photo into a rectangle with the given shape, in the photo's pixels. */
export function coverCrop(pw: number, ph: number, rw: number, rh: number, focus: [number, number]) {
  const scale = Math.max(rw / pw, rh / ph), sw = rw / scale, sh = rh / scale;
  return { sx: (pw - sw) * focus[0], sy: (ph - sh) * focus[1], sw, sh };
}
