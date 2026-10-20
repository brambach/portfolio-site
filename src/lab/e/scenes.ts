/* What each part of the page is made of, where it sits on screen and how it moves while you read.

   Every part but About is one bold object on plain pink, drawn in four tones (navy, teal, peach, cream). The pink
   is keyed out, so the object stands alone on the paper as a clear silhouette, and each of its four tones becomes
   one of the palette's (see `object` in palette.ts). About is the headshot, dithered into the same four tones.

   `life` says what a dot does while it waits, from where it sits in the original art (in its pixels, so the
   numbers below can be checked against the files in photos2) and which of the four tones it is. It returns the
   kind of life, and for some kinds two numbers that go with it, like how far along the plane's trail a dot is. */

export type SceneId = 'hero' | 'intro' | 'integrations' | 'agents' | 'harnesses' | 'design' | 'product' | 'work' | 'contact';

/** What a dot does while it's home. 0 sits still. Type, static, dust and drips only happen in code. Type is the
 *  highest, and the shader tells it apart by that. */
export const LIFE = {
  still: 0, bob: 1, trail: 2, plugL: 3, plugR: 4, drift: 5, loop: 6, glint: 7,
  draw: 10, steam: 11, wave: 12, lines: 13, dust: 14, static: 15, drip: 16, type: 20,
} as const;
export const TYPE_LIFE = LIFE.type;

/** The four tones of the art, in the order palette.object lists them. */
export const ROLE = { navy: 0, teal: 1, peach: 2, cream: 3 } as const;

export type Life = number | [kind: number, a: number, b: number];

export type Art = {
  src: string;
  /** Said once, quietly, in the header while the scene is up. Generic, no place names. */
  caption: string;
  /** 'object' is keyed out of its pink. 'photo' is dithered whole and dissolves at its edges. */
  kind: 'object' | 'photo';
  /** The original art's size, and the part of it the shipped file was cropped to, in its pixels. */
  size: [number, number];
  crop: [x0: number, y0: number, x1: number, y1: number];
  /** For kinds that turn (the hand, the rope): the point they turn about, in the art's pixels. The dot's two
   *  numbers are then its offset from there on screen. */
  pivot?: [number, number];
  /** For a photo: where its crop sits when the screen's shape cuts some of it off (0 to 1 across and down). */
  focus?: [number, number];
  life: (x: number, y: number, role: number) => Life;
};

/** Is (x, y) inside the polygon? */
function inside(pts: number[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
/** How far round a loop about (cx, cy) a point is, 0 to 1, starting at angle `from` (degrees, y down) and going
 *  against the clock. */
const around = (x: number, y: number, cx: number, cy: number, from: number) => {
  const a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  return ((((from - a) % 360) + 360) % 360) / 360;
};

const PLANE = [650, 228, 1178, 80, 980, 455, 803, 448];
const ARROW = [440, 360, 866, 152, 712, 636, 470, 590];

export const ART: Record<Exclude<SceneId, 'work'>, Art> = {
  // The plane bobs, and light runs back along its trail, away from it.
  hero: {
    src: '/lab/e/plane.jpg', caption: 'A paper airplane', kind: 'object', size: [1280, 720], crop: [65, 44, 1213, 685],
    life: (x, y) => (inside(PLANE, x, y) ? LIFE.bob : [LIFE.trail, around(x, y, 330, 450, 7), 0]),
  },
  // The wall and the plant behind him are keyed out of the file (they're its alpha), so only he is drawn.
  intro: { src: '/lab/e/headshot.webp', caption: 'A portrait', kind: 'photo', size: [480, 480], crop: [0, 0, 480, 480], focus: [0.5, 0.3], life: () => LIFE.still },
  // The plugs nudge closer, click, and ease apart. The prong and the socket light up as they meet.
  integrations: {
    src: '/lab/e/plugs.jpg', caption: 'Two plugs', kind: 'object', size: [1152, 864], crop: [67, 229, 1087, 638],
    life: (x, y) => {
      const contact = (x > 560 && x < 730 && y > 380 && y < 485) ? 1 : 0;
      return [x < 637 ? LIFE.plugL : LIFE.plugR, contact, 0];
    },
  },
  // The cursor drifts round a little loop, light runs along its dotted path toward it, and the sparkles twinkle.
  agents: {
    src: '/lab/e/cursor.jpg', caption: 'A cursor', kind: 'object', size: [1152, 864], crop: [198, 130, 892, 712],
    life: (x, y, role) => {
      if ((role === ROLE.teal && y < 290 && x < 620) || (role === ROLE.peach && x > 770 && y > 470)) return LIFE.glint;
      if (role === ROLE.navy && !inside(ARROW, x, y) && x < 540) return [LIFE.loop, around(x, y, 350, 500, -64), 0];
      return LIFE.drift;
    },
  },
  // Just the waist belt, its buckle and the leg loops: the rope and carabiner above them read as stripes at this
  // size, so they're painted out of the file. The buckles catch the light now and then.
  harnesses: {
    src: '/lab/e/harness.jpg', caption: 'A climbing harness', kind: 'object', size: [1152, 864], crop: [322, 422, 830, 806],
    life: (_x, _y, role) => (role === ROLE.peach ? LIFE.glint : LIFE.still),
  },
  // The pen's curve draws itself from one anchor to the other, holds, and clears to draw again.
  design: {
    src: '/lab/e/pen.jpg', caption: 'A pen drawing a curve', kind: 'object', size: [1152, 864], crop: [172, 44, 984, 823],
    life: (x, y, role) => {
      if (role !== ROLE.cream || x < 320 || x > 910 || y < 110 || y > 650) return LIFE.still;
      const t = ((x - 350) * 535 - (y - 620) * 480) / (535 * 535 + 480 * 480);
      return [LIFE.draw, Math.min(1, Math.max(0, t)), 0];
    },
  },
  // Steam rises off the cup.
  product: {
    src: '/lab/e/cup.jpg', caption: 'A steaming cup', kind: 'object', size: [1152, 864], crop: [225, 43, 935, 794],
    life: (x, y, role) => (role === ROLE.cream && y < 285 && x > 480 && x < 660 ? [LIFE.steam, (285 - y) / 220, 0] : LIFE.still),
  },
  // The hand waves from the wrist, twice, then rests, and the lines beside it flick with each wave.
  contact: {
    src: '/lab/e/hand.jpg', caption: 'A waving hand', kind: 'object', size: [1152, 864], crop: [176, 72, 965, 864],
    pivot: [515, 860],
    life: (x, _y, role) => (role === ROLE.teal && x > 780 ? LIFE.lines : LIFE.wave),
  },
};

export const SCENE_ORDER: SceneId[] = ['hero', 'intro', 'integrations', 'agents', 'harnesses', 'design', 'product', 'work', 'contact'];

export type Layout = {
  rect: [x0: number, y0: number, x1: number, y1: number];
  /** Where an object sits in its rectangle when it doesn't fill it (0 to 1 across and down). */
  align: [number, number];
  /** How dissolved a spot is, from where it sits on screen (x, y) and in the rectangle (u, v), all 0 to 1. Only
   *  the portrait uses it: the objects stand on the paper with nothing round them. */
  wash: (x: number, y: number, u: number, v: number) => number;
};

const ramp = (a: number, b: number, t: number) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
/** Edges that dissolve all the way round, for the portrait. */
const frame = (edge: number) => (_x: number, _y: number, u: number, v: number) => 1 - ramp(0, edge, Math.min(u, 1 - u, v, 1 - v));
const none = () => 0;

/** Where a scene sits. On a wide screen the words keep the left and the object takes the right half, as big as
 *  it fits. On a phone it takes the top of the screen. The hero's plane flies in under the tagline, low on the
 *  right, so the dots dripping off it have the bottom of the screen to fall through. */
export function layoutFor(id: SceneId, phone: boolean): Layout {
  if (id === 'hero') return phone
    ? { rect: [0.05, 0.6, 0.95, 0.88], align: [0.5, 0.5], wash: none }
    : { rect: [0.3, 0.44, 0.97, 0.93], align: [0.75, 0.5], wash: none };
  if (id === 'intro') return phone
    ? { rect: [0.1, 0.07, 0.9, 0.5], align: [0.5, 0.5], wash: frame(0.14) }
    : { rect: [0.55, 0.11, 0.93, 0.93], align: [0.5, 0.5], wash: frame(0.12) };
  return phone
    ? { rect: [0.08, 0.08, 0.92, 0.42], align: [0.5, 0.5], wash: none }
    : { rect: [0.48, 0.1, 0.96, 0.92], align: [0.5, 0.5], wash: none };
}

/** The cover crop of a photo into a rectangle with the given shape, in the photo's pixels. */
export function coverCrop(pw: number, ph: number, rw: number, rh: number, focus: [number, number]) {
  const scale = Math.max(rw / pw, rh / ph), sw = rw / scale, sh = rh / scale;
  return { sx: (pw - sw) * focus[0], sy: (ph - sh) * focus[1], sw, sh };
}

/** Where an object of the given shape sits in a rectangle when it's fitted whole, in screen pixels. */
export function containBox(pw: number, ph: number, rx: number, ry: number, rw: number, rh: number, align: [number, number]) {
  const scale = Math.min(rw / pw, rh / ph), w = pw * scale, h = ph * scale;
  return { x: rx + (rw - w) * align[0], y: ry + (rh - h) * align[1], w, h };
}
