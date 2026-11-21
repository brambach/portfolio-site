import { useLayoutEffect, useRef, useState } from 'react';
import { INK, Pumpkin, stroke } from '../patch/Art';

/* The drawings for the snow look: the pumpkin patch's yard two months on, under the first real snow, in the same thick
   wobbly ink and flat Sunday paper colors. All of it is original line art. Ids start with sn- so they can't meet another
   page's.

   The hero is a stack of layers that share one viewBox, so the scroll can move one without repainting the rest: the
   sky (plain HTML plates, see Home.tsx), Far (the moon and the first stars), Yard (hills, the bare tree, the fence and
   the snow), Tint (night falling over the yard), Lights (the string along the fence and up the tree) and Live (the
   kid, the snowman, the little pine and everything else you can tap). The ink of Yard and Live sits in a group each so
   the page can boil their lines. */

const VB = '0 0 1200 600';
const layer = { viewBox: VB, preserveAspectRatio: 'xMidYMax slice', focusable: false as const };
const thin = { ...stroke, strokeWidth: 2 };
const SNOW = '#fbfdff', NIGHT_SNOW = '#e6ebf8';
const PINE = '#2f6b3a', RED = '#c8323a', GOLD = '#f2c14e', BLUE = '#3d63b8', BARK = '#7a4a26';
const BULBS = ['#ffd84a', '#f2634a', '#8fd16a', '#7fb4ff'];
const HILLS_FAR = 'M0 286 C130 244 250 248 370 276 C500 230 640 238 760 272 C880 236 1040 240 1200 266';
const HILLS_NEAR = 'M0 336 C120 300 220 306 330 322 C450 284 560 296 640 316 C760 286 880 296 980 320 C1080 300 1150 306 1200 314';
const GROUND = 'M0 448 C200 432 380 452 600 440 C820 428 1000 450 1200 438 L1200 600 L0 600 Z';

/** A lumpy line of snow from x1 to x2 along y, `k` bumps, each `h` high: the top edge of anything snowed on. */
const lumps = (x1: number, x2: number, y: number, k: number, h = 7) => {
  const step = (x2 - x1) / k;
  return Array.from({ length: k }, (_, i) => `Q${(x1 + step * (i + 0.5)).toFixed(1)} ${y - h * (i % 2 ? 0.7 : 1.15)} ${(x1 + step * (i + 1)).toFixed(1)} ${y}`).join(' ');
};

/** Filters, patterns and the bulbs' glow. Rendered once per page, before anything that uses them. */
export function Plates() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <defs>
      {[7, 19, 31].map((seed, i) => <filter key={seed} id={`sn-b${i}`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={1} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>)}
      <pattern id="sn-shade" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="3.5" cy="3.5" r="1.25" fill="#8fa6d4" /></pattern>
      <pattern id="sn-stars" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><circle cx="9" cy="12" r="1.5" fill="#fff3c9" /><circle cx="33" cy="34" r="1" fill="#fff3c9" /></pattern>
      <radialGradient id="sn-glow"><stop offset="0" stopColor="#ffe27a" stopOpacity=".85" /><stop offset=".45" stopColor="#ffd84a" stopOpacity=".3" /><stop offset="1" stopColor="#ffd84a" stopOpacity="0" /></radialGradient>
    </defs>
  </svg>;
}

const STAR = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z';

/** The far layer: the first stars and a moon that comes up from behind the hills as you scroll. */
export function Far() {
  return <svg className="far" {...layer} aria-hidden="true">
    <g className="stars">
      {[[120, 70], [260, 150], [420, 60], [560, 190], [660, 80], [1000, 60], [1080, 170], [1150, 96], [330, 230], [740, 140]].map(([x, y], i) =>
        <path key={i} className="star" transform={`translate(${x} ${y}) scale(${0.7 + (i % 3) * 0.25})`} d={STAR} fill="#fff3c9" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" opacity="0" />)}
    </g>
    {/* Drawn below the hills. The scroll lifts it 190 into the sky. */}
    <g id="sn-moon">
      <circle cx="880" cy="340" r="54" fill="#fff6d8" {...stroke} />
      <circle cx="862" cy="322" r="8" fill="none" {...thin} /><circle cx="896" cy="356" r="11" fill="none" {...thin} /><circle cx="902" cy="318" r="5" fill="none" {...thin} />
    </g>
  </svg>;
}

/** A small pine on a far hill, standing on (x, y), with snow on its tips. */
const FarPine = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -46 L14 -20 L8 -20 L18 0 L-18 0 L-8 -20 L-14 -20 Z" fill="#3b6b4c" {...thin} />
    <path d="M0 -46 L7 -33 Q3 -30 0 -33 Q-3 -30 -7 -33 Z M-12 -22 Q-8 -19 -4 -21 M4 -21 Q8 -19 12 -22" fill={SNOW} {...thin} />
  </g>;

/* The bare tree, as in the other two looks: every limb is a wide ink stroke under a narrower bark one, and now a line of
   snow along the top of each. [path, width]. */
const LIMBS: [string, number][] = [['M1046 446 C1040 390 1050 340 1040 290 C1036 262 1040 240 1034 214', 22], ['M1040 300 C1010 270 990 262 962 232', 12], ['M1042 280 C1070 250 1096 250 1124 214', 12],
  ['M1036 240 C1020 210 1012 190 996 168', 10], ['M1036 226 C1052 196 1070 180 1076 150', 10], ['M990 258 C976 256 966 262 952 266', 6], ['M1100 240 C1112 240 1124 248 1138 246', 6]];
const LIMB_SNOW = ['M1032 268 C1016 252 998 246 978 230', 'M1048 264 C1068 244 1090 240 1110 222', 'M1030 222 C1022 204 1014 190 1004 176', 'M1040 214 C1052 194 1064 180 1070 164', 'M1034 216 C1034 210 1036 204 1036 200'];

/** Snow on the point of every picket and along the rails. */
function Fence({ y = 352, top = 332, rails = [360, 404], h = 92, w = 40, rail = '#c4834a', picket = '#dea36a', snow = SNOW }: { y?: number; top?: number; rails?: number[]; h?: number; w?: number; rail?: string; picket?: string; snow?: string }) {
  const xs = Array.from({ length: 21 }, (_, i) => i * 60 - 10), half = w / 2, peak = y - top;
  return <>
    {rails.map(r => <g key={r}>
      <rect x="-10" y={r} width="1220" height={rail === '#c4834a' ? 16 : 11} fill={rail} {...stroke} />
      <path d={`M-10 ${r + 1} ${lumps(-10, 1210, r + 1, 40, 5)} Z`} fill={snow} {...stroke} strokeWidth={2.4} />
    </g>)}
    {xs.map((x, i) => { const t = top + (i % 3) * 3, b = t + peak; return <g key={x}>
      <path d={`M${x} ${b} l${half} ${-peak} l${half} ${peak} v${h} h${-w} Z`} fill={picket} {...stroke} />
      <path d={`M${x - 3} ${b + 1} C${x - 4} ${b - 8} ${x + half - 10} ${t - 4} ${x + half} ${t - 6} C${x + half + 10} ${t - 4} ${x + w + 4} ${b - 8} ${x + w + 3} ${b + 1} Q${x + half} ${b + 7} ${x - 3} ${b + 1} Z`} fill={snow} {...stroke} strokeWidth={2.4} />
    </g>; })}
  </>;
}

/** Boot prints in the snow, a pair every step, from the left edge to where the kid stands. */
const PRINTS = Array.from({ length: 13 }, (_, i) => [24 + i * 36, 548 + Math.sin(i * 0.8) * 6 + (i % 2 ? 7 : -3), i % 2 ? 6 : -6]);

/** The yard layer: two rows of snowed-on hills with pines, the bare tree, the fence, the sled and the snow. It never
 *  changes, so only the boil repaints it. */
export function Yard() {
  return <svg className="yard" {...layer} aria-hidden="true">
    <g id="sn-yardInk">
      <path d={`${HILLS_FAR} L1200 440 L0 440 Z`} fill="#eaf0fb" {...stroke} />
      <path d={`${HILLS_FAR} L1200 440 L0 440 Z`} fill="url(#sn-shade)" opacity=".45" />
      {[[70, 276, 0.9], [118, 270, 0.7], [520, 262, 0.8], [566, 270, 1], [940, 268, 0.85], [1160, 272, 0.75]].map(([x, y, s]) => <FarPine key={x} x={x} y={y} s={s} />)}
      <path d={`${HILLS_NEAR} L1200 440 L0 440 Z`} fill={SNOW} {...stroke} />
      <path d={`${HILLS_NEAR} L1200 440 L0 440 Z`} fill="url(#sn-shade)" opacity=".28" />
      {LIMBS.map(([d, w]) => <g key={d}><path d={d} fill="none" {...stroke} strokeWidth={w + 6} /><path d={d} fill="none" {...stroke} stroke={BARK} strokeWidth={w} /></g>)}
      {LIMB_SNOW.map(d => <path key={d} d={d} fill="none" {...stroke} stroke={SNOW} strokeWidth={5} />)}
      <Fence />
      {/* The sled, leaning on the fence where the sledding stopped. */}
      <g transform="translate(236 452) rotate(-74)">
        <path d="M0 0 H96 q16 0 14 -16" fill="none" {...stroke} strokeWidth={9} /><path d="M0 0 H96 q16 0 14 -16" fill="none" {...stroke} stroke="#9aa3ad" strokeWidth={4} />
        <path d="M18 0 v-12 M50 0 v-12 M82 0 v-12" fill="none" {...stroke} strokeWidth={4} />
        <rect x="4" y="-26" width="92" height="15" rx="3" fill={RED} {...stroke} />
        <path d="M30 -26 v15 M62 -26 v15" fill="none" {...thin} />
      </g>
      <path d={GROUND} fill={SNOW} {...stroke} />
      <path d={GROUND} fill="url(#sn-shade)" opacity=".22" />
      <path d="M0 470 C160 462 300 476 470 466 M720 464 C880 456 1040 470 1200 460" fill="none" stroke="#b7c6e4" strokeWidth={3} strokeLinecap="round" />
      {PRINTS.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="3.6" transform={`rotate(${r} ${x} ${y})`} fill="#b7c6e4" />)}
    </g>
  </svg>;
}

/** Night, as one flat wash multiplied over the hills and the snow. The kid, the tree and the snowman sit above it. */
export function Tint() {
  return <svg className="tint" {...layer} aria-hidden="true"><path d={`${HILLS_FAR} L1200 600 L0 600 Z`} fill="#8e97cf" /></svg>;
}

type P = [number, number];
const along = (a: P, c: P, b: P, t: number): P => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
const GLASS = 'M0 5 C8 7 9 18 0 25 C-9 18 -8 7 0 5Z';

/** One bulb hanging from (x, y). Unlit it's milk glass; `on` gives it its color and a glow. */
function Bulb({ x, y, i, on }: { x: number; y: number; i: number; on?: boolean }) {
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><g className="bulb">
    <rect x="-3.5" y="-1" width="7" height="7" fill={INK} />
    <path d={GLASS} fill="#f3e6c4" {...thin} />
    <g className="shine" opacity={on ? 1 : 0}>
      <circle className="glow" cx="0" cy="15" r="30" fill="url(#sn-glow)" />
      <path d={GLASS} fill={BULBS[i % 4]} {...thin} />
    </g>
  </g></g>;
}

/* The string of lights, moved from the dinner table to the fence: three swags along the top of the fence and one up
   into the bare tree. Each is a quadratic curve [from, control, to, bulbs]. */
const SWAGS: [P, P, P, number][] = [[[-10, 318], [200, 350], [410, 322], 6], [[410, 322], [610, 352], [820, 320], 6], [[820, 320], [930, 342], [1040, 300], 3], [[1040, 300], [1000, 250], [1060, 214], 3]];

/** The lights layer: the string along the fence and up the tree. Under the kid and the tree, over the night. */
export function Lights() {
  let n = 0;
  return <svg className="lights" id="sn-lights" {...layer} aria-hidden="true">
    {SWAGS.map(([a, c, b], i) => <path key={i} d={`M${a} Q${c} ${b}`} fill="none" {...thin} strokeWidth={2.5} />)}
    {SWAGS.flatMap(([a, c, b, count]) => Array.from({ length: count }, (_, k) => { const [x, y] = along(a, c, b, (k + 1) / (count + 1)), i = n++; return <Bulb key={i} i={i} x={x} y={y} />; }))}
  </svg>;
}

/** The kid from the pumpkin patch, still in the bedsheet, now with a knit hat and a scarf on top, standing on (x, y). */
export function Kid({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="ghost">
      <ellipse cx="0" cy="0" rx="46" ry="7" fill={INK} opacity=".18" />
      <ellipse cx="-18" cy="-6" rx="13" ry="7" fill={INK} />
      <ellipse cx="18" cy="-6" rx="13" ry="7" fill={INK} />
      <g className="sheet">
        <path d="M-48 -18 C-52 -90 -40 -172 0 -174 C40 -172 52 -90 48 -18 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 Z" fill="#fffdf6" {...stroke} />
        <path d="M-22 -60 q6 24 -2 40 M18 -66 q-4 26 4 46" fill="none" {...stroke} strokeWidth={2} />
        <ellipse cx="-16" cy="-120" rx="7" ry="10" fill={INK} />
        <ellipse cx="16" cy="-120" rx="7" ry="10" fill={INK} />
        {/* The hat: a red knit cap with a white band and a pompom. */}
        <path d="M-37 -150 C-40 -196 40 -196 37 -150 Z" fill={RED} {...stroke} />
        <path d="M-14 -186 q2 14 0 30 M12 -186 q-2 14 0 30" fill="none" {...thin} opacity=".5" />
        <path d="M-41 -150 Q0 -164 41 -150 L42 -137 Q0 -150 -42 -137 Z" fill="#fffdf6" {...stroke} />
        <circle cx="3" cy="-192" r="11" fill="#fffdf6" {...stroke} />
        {/* The scarf, with one end hanging. */}
        <path d="M-50 -92 Q0 -78 50 -92 L50 -77 Q0 -63 -50 -77 Z" fill={PINE} {...stroke} />
        <path d="M-30 -86 l-2 15 M-6 -82 l-1 15 M18 -84 l1 15 M40 -89 l2 14" fill="none" stroke="#f3efe2" strokeWidth={4} />
        <path d="M22 -78 L30 -36 L46 -39 L40 -80 Z" fill={PINE} {...stroke} />
        <path d="M26 -58 L42 -61 M28 -48 L44 -51" fill="none" stroke="#f3efe2" strokeWidth={3.5} />
        <path d="M31 -37 l-1 7 M37 -38 l0 7 M43 -39 l1 7" fill="none" {...thin} />
      </g>
    </g>
  </g>;
}

/** A snowman standing on (x, y). The hat is its own group so it can fly. `head` ids the head, its face and the hat. */
export function Snowman({ x, y, s = 1, ids, fill = SNOW }: { x: number; y: number; s?: number; ids?: { head: string; face: string; hat: string }; fill?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className="snowman">
    <ellipse cx="0" cy="-2" rx="54" ry="8" fill={INK} opacity=".16" />
    <path d="M-30 -110 L-70 -140 M-58 -131 l-4 -14 M-62 -134 l-14 0 M30 -108 L68 -92 M56 -97 l10 -10" fill="none" {...stroke} strokeWidth={4} stroke={BARK} />
    <path d="M-30 -110 L-70 -140 M30 -108 L68 -92" fill="none" {...stroke} strokeWidth={1.5} />
    <circle cx="0" cy="-46" r="46" fill={fill} {...stroke} />
    <path d="M24 -14 A40 40 0 0 0 38 -60" fill="none" stroke="url(#sn-shade)" strokeWidth={10} opacity=".6" />
    <circle cx="0" cy="-110" r="33" fill={fill} {...stroke} />
    {[-122, -106, -90].map(cy => <circle key={cy} cx="2" cy={cy} r="4" fill={INK} />)}
    <g id={ids?.head}><circle cx="0" cy="-164" r="25" fill={fill} {...stroke} /></g>
    <g id={ids?.face}>
      <circle cx="-8" cy="-170" r="3.2" fill={INK} /><circle cx="9" cy="-170" r="3.2" fill={INK} />
      <path d="M1 -163 L30 -158 L1 -154 Z" fill="#ee7b22" {...thin} />
      {[[-10, -152], [-4, -149], [3, -148], [10, -150]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="1.8" fill={INK} />)}
    </g>
    <g id={ids?.hat}><g className="hat">
      <ellipse cx="0" cy="-186" rx="31" ry="6" fill="#36302c" {...stroke} />
      <path d="M-18 -186 L-17 -224 Q0 -228 17 -224 L18 -186 Z" fill="#36302c" {...stroke} />
      <path d="M-18 -196 Q0 -192 18 -196 L18 -188 Q0 -184 -18 -188 Z" fill={RED} {...thin} />
      <Holly x={11} y={-196} s={0.5} />
    </g></g>
  </g></g>;
}

/** A sprig of holly: two leaves and three berries, centered on (x, y). */
export function Holly({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const leaf = 'M0 0 C6 -4 8 -2 12 -6 C12 -2 16 0 20 -2 C18 2 20 6 24 6 C16 10 8 8 0 0 Z';
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={leaf} fill="#3f8a3a" {...thin} />
    <path d={leaf} transform="scale(-1 1)" fill="#3f8a3a" {...thin} />
    {[[-4, -3], [4, -3], [0, 3]].map(([cx, cy]) => <circle key={cx + ',' + cy} cx={cx} cy={cy} r="4" fill={RED} {...thin} />)}
  </g>;
}

/* The little pine the kid is trimming. Three tiers, each a triangle with a scalloped hem and snow on its point:
   [bottom, half width, height]. */
const TIERS: [number, number, number][] = [[-18, 98, 96], [-82, 78, 84], [-146, 56, 74]];
const tier = (by: number, hw: number, h: number) => {
  const n = Math.round(hw / 14), step = (2 * hw) / n;
  return `M0 ${by - h} L${hw} ${by} ${`q${(-step / 2).toFixed(1)} 9 ${(-step).toFixed(1)} 0 `.repeat(n)}Z`;
};
const tierSnow = (by: number, hw: number, h: number) => {
  const t = by - h, k = 0.34, x = hw * k, y = t + h * k;
  return `M0 ${t} L${x.toFixed(1)} ${y.toFixed(1)} ${lumps(x, -x, y, 3, -5)} Z`;
};

/** Where each ornament hangs on the pine, from the pine's foot, and the order the kid hangs them in. */
export const HOOKS = { red: [-39, -50], gold: [33, -110], blue: [-15, -166], star: [0, -228] } as const;
export type Trim = keyof typeof HOOKS;
export const ORDER: Trim[] = ['red', 'gold', 'blue', 'star'];
const BALLS: Record<Exclude<Trim, 'star'>, string> = { red: RED, gold: GOLD, blue: BLUE };
const TREE_LIGHTS: P[] = [[-62, -24], [-30, -18], [2, -16], [34, -19], [66, -26], [-44, -86], [-14, -82], [16, -82], [46, -88], [-26, -150], [-2, -146], [22, -150]];

/** An ornament with its cap and hook, hanging from (0, 0). */
const Ball = ({ c }: { c: string }) => <>
  <path d="M0 0 v4" fill="none" {...thin} strokeWidth={1.6} />
  <rect x="-3.5" y="3" width="7" height="5" rx="1" fill="#c9c4b8" {...thin} strokeWidth={1.6} />
  <circle cx="0" cy="16" r="9.5" fill={c} {...thin} />
  <path d="M-5 12 q2 -4 6 -4" fill="none" stroke="#fffdf6" strokeWidth={2} strokeLinecap="round" opacity=".8" />
</>;

/** The star on top, centered on (0, 0). */
const Topper = () => <path d="M0 -17 L4.8 -5.6 L17 -5.2 L7.6 2.6 L10.6 14.6 L0 7.8 L-10.6 14.6 L-7.6 2.6 L-17 -5.2 L-4.8 -5.6 Z" fill={GOLD} {...stroke} strokeWidth={2.4} />;

/** The little pine standing on (x, y). `trimmed` hangs everything and lights it (the footer's); otherwise the
 *  ornaments wait on their hooks, hidden, for Home.tsx to hang them. */
export function Pine({ x, y, s = 1, trimmed }: { x: number; y: number; s?: number; trimmed?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className={trimmed ? 'pine lit' : 'pine'}>
    <ellipse cx="0" cy="0" rx="70" ry="8" fill={INK} opacity=".16" />
    <rect x="-9" y="-24" width="18" height="24" fill={BARK} {...stroke} />
    {TIERS.map(([by, hw, h]) => <g key={by}><path d={tier(by, hw, h)} fill={PINE} {...stroke} /><path d={tierSnow(by, hw, h)} fill={SNOW} {...stroke} strokeWidth={2.4} /></g>)}
    <path d={`M-70 -30 Q2 -6 74 -32 M-56 -96 Q8 -74 58 -98 M-34 -158 Q0 -140 30 -160`} fill="none" {...thin} strokeWidth={1.6} />
    <g className="tlights">{TREE_LIGHTS.map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}>
      <circle className="tglow glow" cx="0" cy="0" r="16" fill="url(#sn-glow)" opacity="0" />
      <circle cx="0" cy="0" r="4.6" fill="#f3e6c4" {...thin} strokeWidth={1.6} />
      <circle className="tbulb" cx="0" cy="0" r="4.6" fill={BULBS[i % 4]} {...thin} strokeWidth={1.6} opacity="0" />
    </g>)}</g>
    {ORDER.map(name => { const [hx, hy] = HOOKS[name]; return <g key={name} transform={`translate(${hx} ${hy})`}>
      <g className={trimmed ? 'hung on' : 'hung'} data-trim={name}>{name === 'star' ? <Topper /> : <Ball c={BALLS[name]} />}</g>
    </g>; })}
  </g></g>;
}

/** Where the box of ornaments stands, and where each one sits in it, from the box's foot. */
export const IN_BOX = { red: [-16, -32], gold: [0, -38], blue: [16, -32], star: [4, -46] } as const;

/** The box of ornaments next to the kid. The front is drawn last so they peek out over it. */
function Box({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><g className="box">
    <ellipse cx="0" cy="0" rx="36" ry="5" fill={INK} opacity=".16" />
    <path d="M-28 -30 L-40 -42 L-26 -46 L-18 -30 Z M28 -30 L40 -44 L26 -46 L18 -30 Z" fill="#b8874a" {...stroke} />
    {ORDER.map(name => { const [bx, by] = IN_BOX[name]; return <g key={name} transform={`translate(${bx} ${by})`}>
      <g className="boxed" data-trim={name}>{name === 'star' ? <g transform="scale(.8)"><Topper /></g> : <Ball c={BALLS[name]} />}</g>
    </g>; })}
    <path d="M-28 -30 H28 L26 0 H-26 Z" fill="#c99a5c" {...stroke} />
    <path d="M-28 -30 H28" fill="none" {...stroke} />
    <path d="M-12 -18 h24" fill="none" {...thin} opacity=".5" />
  </g></g>;
}

/** A present standing on (x, y). Anything in here hops when it's tapped. */
function Gift({ x, y, w, h, fill, ribbon }: { x: number; y: number; w: number; h: number; fill: string; ribbon: string }) {
  return <g transform={`translate(${x} ${y})`}><g className="gift">
    <ellipse cx="0" cy="0" rx={w / 2 + 6} ry="4" fill={INK} opacity=".16" />
    <rect x={-w / 2} y={-h} width={w} height={h} fill={fill} {...stroke} />
    <rect x="-4" y={-h} width="8" height={h} fill={ribbon} {...thin} />
    <rect x={-w / 2 - 3} y={-h - 9} width={w + 6} height="10" fill={fill} {...stroke} />
    <rect x="-4" y={-h - 9} width="8" height="10" fill={ribbon} {...thin} />
    <path d={`M0 ${-h - 9} C-16 ${-h - 26} -22 ${-h - 8} 0 ${-h - 9} C22 ${-h - 8} 16 ${-h - 26} 0 ${-h - 9} Z`} fill={ribbon} {...thin} />
  </g></g>;
}

/** A drift of snow standing on (x, y). The loose clumps on top fly when it's kicked. */
function Drift({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className="pile" id={id}>
    <g className="mound">
      <path d="M-84 0 C-80 -30 -52 -48 -14 -44 C10 -60 52 -50 70 -26 C82 -18 88 -8 88 0 Z" fill={SNOW} {...stroke} />
      <path d="M-50 -10 C-30 -20 0 -18 30 -10" fill="none" stroke="url(#sn-shade)" strokeWidth={9} opacity=".6" />
    </g>
    {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`translate(${-44 + i * 8} ${-38 + (i % 3) * 6})`}><g className="loose"><circle r={5 + (i % 3) * 2} fill={SNOW} {...thin} /></g></g>)}
  </g></g>;
}

/** Where the kid, the box and the pine stand in the hero, in the drawing's units. */
export const KID = { x: 556, y: 560 }, BOX = { x: 624, y: 582 }, TREE = { x: 716, y: 556 };

/** The live layer: the kid, the snowman, the box of ornaments, the pine and its presents, the drift and one pumpkin
 *  the snow caught. Home.tsx wires up the taps. */
export function Live({ label }: { label: string }) {
  return <svg className="live" id="sn-scene" {...layer} role="img" aria-label={label}>
    <g id="sn-liveInk">
      <Snowman x={446} y={572} s={0.92} />
      <g id="sn-kid"><Kid x={KID.x} y={KID.y} s={0.86} /></g>
      <Pine x={TREE.x} y={TREE.y} />
      <Gift x={668} y={586} w={50} h={34} fill={RED} ribbon={GOLD} />
      <Gift x={778} y={584} w={42} h={30} fill={PINE} ribbon={RED} />
      <Gift x={724} y={594} w={36} h={22} fill={GOLD} ribbon={RED} />
      <Box x={BOX.x} y={BOX.y} />
      <Drift x={978} y={590} id="sn-drift" />
      <g transform="translate(1116 584)">
        <Pumpkin x={0} y={0} s={0.82} i={0} />
        <path d="M-38 -54 C-30 -66 -10 -70 2 -66 C16 -72 34 -64 40 -52 Q0 -42 -38 -54 Z" fill={SNOW} {...stroke} strokeWidth={2.4} pointerEvents="none" />
      </g>
      <Drift x={140} y={596} s={0.7} id="sn-drift2" />
    </g>
  </svg>;
}

/** A reindeer in flight, facing right, as a silhouette. */
const Deer = ({ x, y }: { x: number; y: number }) => <g transform={`translate(${x} ${y})`}>
  <path d="M-11 0 C-10 -5 -2 -6 6 -5 L10 -10 L14 -9 L13 -5 C11 -3 10 0 8 1 L12 6 L9 7 L5 2 L-4 2 L-10 6 L-13 4 L-8 1 L-12 -1 Z" fill={INK} />
  <path d="M11 -10 l-2 -6 M11 -10 l3 -5 M10 -13 l-4 -1 M13 -13 l3 -2" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
  <path d="M-11 -2 l-5 -2" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
</g>;

/** The sleigh and its team, about 110 wide, centered on (0, 0). */
const Sleigh = () => <g>
  <path d="M-46 0 C-36 -6 -12 -14 14 -16" fill="none" stroke={INK} strokeWidth="1.4" />
  {[[2, -16], [24, -20], [46, -24]].map(([x, y]) => <Deer key={x} x={x} y={y} />)}
  <path d="M-62 2 H-24 C-18 2 -16 -4 -20 -8 L-26 -8 L-30 -4 L-50 -4 L-56 -16 L-64 -16 Z" fill={INK} />
  <path d="M-66 8 H-20 q8 0 8 -7" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
  <path d="M-58 8 v-4 M-30 8 v-4" stroke={INK} strokeWidth="2" />
  <path d="M-48 -4 C-50 -12 -44 -18 -38 -16 C-40 -22 -34 -28 -28 -24 L-24 -30 L-26 -20 C-24 -14 -28 -6 -32 -4 Z" fill={INK} />
</g>;

/** The footer: the same yard on Christmas Eve. The moon comes up, the lights come on along the fence, a sleigh crosses
 *  the moon, and the snowman is waiting on its head, which rolls down the whole page to get there. */
export function FootArt({ label }: { label: string }) {
  const posts = Array.from({ length: 9 }, (_, i) => i * 150);
  let n = 0;
  return <svg className="foot-art" id="sn-night" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
    <rect width="1200" height="320" fill="#2b386f" />
    <rect width="1200" height="200" fill="url(#sn-stars)" />
    <g id="sn-footMoon">
      <circle cx="560" cy="78" r="44" fill="#fff6d8" {...stroke} />
      <circle cx="546" cy="64" r="7" fill="none" {...thin} /><circle cx="574" cy="94" r="9" fill="none" {...thin} /><circle cx="580" cy="60" r="4" fill="none" {...thin} />
    </g>
    <g transform="translate(560 78)"><g id="sn-sleigh"><Sleigh /></g></g>
    <g id="sn-footInk">
      <path d="M0 196 C150 156 300 166 420 188 C560 146 700 156 820 184 C940 156 1080 162 1200 178 L1200 280 L0 280 Z" fill="#c3cbe6" {...stroke} />
      <path d="M0 196 C150 156 300 166 420 188 C560 146 700 156 820 184 C940 156 1080 162 1200 178 L1200 280 L0 280 Z" fill="url(#sn-shade)" opacity=".4" />
      {[[120, 186, 0.8], [180, 176, 0.6], [960, 172, 0.7], [1040, 170, 0.9]].map(([x, y, s]) => <FarPine key={x} x={x} y={y} s={s} />)}
      <Fence y={204} top={188} rails={[212, 244]} h={78} w={32} rail="#6f6280" picket="#8f8299" snow={NIGHT_SNOW} />
      <path d="M0 282 C300 274 600 286 900 276 C1000 274 1100 280 1200 276 L1200 330 L0 330 Z" fill={NIGHT_SNOW} {...stroke} />
      <path d="M0 282 C300 274 600 286 900 276 C1000 274 1100 280 1200 276 L1200 330 L0 330 Z" fill="url(#sn-shade)" opacity=".3" />
    </g>
    <g className="foot-lights">
      {posts.slice(0, -1).map(x => <path key={x} d={`M${x} 174 Q${x + 75} 202 ${x + 150} 174`} fill="none" {...thin} strokeWidth={2.5} />)}
      {posts.slice(0, -1).flatMap(x => [0.25, 0.5, 0.75].map(t => { const [bx, by] = along([x, 174], [x + 75, 202], [x + 150, 174], t), i = n++; return <Bulb key={i} i={i} x={bx} y={by} on />; }))}
    </g>
    <g id="sn-footFront">
      <g className="tree-glow"><circle className="glow" cx="456" cy="230" r="80" fill="url(#sn-glow)" opacity=".7" /></g>
      <Pine x={456} y={300} s={0.62} trimmed />
      <Gift x={420} y={306} w={30} h={20} fill={RED} ribbon={GOLD} />
      <Gift x={494} y={306} w={26} h={18} fill={GOLD} ribbon={RED} />
      <Snowman x={676} y={306} s={0.7} fill={NIGHT_SNOW} ids={{ head: 'sn-footHead', face: 'sn-footFace', hat: 'sn-footHat' }} />
      <g className="waver"><Kid x={810} y={312} s={0.6} /></g>
      <g transform="translate(1110 316)"><Pumpkin x={0} y={0} s={0.7} i={13} /><path d="M-32 -46 C-26 -56 -8 -60 2 -56 C14 -60 28 -54 34 -44 Q0 -36 -32 -46 Z" fill={NIGHT_SNOW} {...stroke} strokeWidth={2.4} /></g>
    </g>
  </svg>;
}

/** The snowball that rolls down the page, with a leaf it picked up on the way so you can see it turn. */
export const Snowball = () =>
  <svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
    <circle r="46" fill={SNOW} {...stroke} strokeWidth={5} />
    <path d="M10 34 A36 36 0 0 0 38 -4" fill="none" stroke="url(#sn-shade)" strokeWidth={12} opacity=".55" />
    <g transform="translate(18 -22) rotate(40) scale(1.4)"><path d="M0 -12 C9 -7 11 4 0 13 C-11 4 -9 -7 0 -12Z" fill="#e8742a" {...stroke} strokeWidth={3} /></g>
  </svg>;

/** A cap of snow `w` pixels wide: lumps along the top, a few drips over the edge, drawn 1:1 so the lumps stay round
 *  on a wide panel. `seed` keeps each panel's snow its own shape. */
export function capPath(w: number, seed: number) {
  let r = seed * 9301 + 49297;
  const next = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const base = 15, bottom = 27;
  let x = 12, d = `M2 ${bottom} C0 ${base + 6} 4 ${base} ${x} ${base}`;
  while (x < w - 46) {
    const bw = Math.min(w - 34 - x, 30 + next() * 26), h = 6 + next() * 7;
    d += ` C${(x + bw * 0.15).toFixed(1)} ${(base - h * 1.3).toFixed(1)} ${(x + bw * 0.85).toFixed(1)} ${(base - h * 1.3).toFixed(1)} ${(x + bw).toFixed(1)} ${base}`;
    x += bw;
  }
  d += ` C${(x + (w - x) * 0.5).toFixed(1)} ${base - 9} ${w + 1} ${base - 2} ${w - 2} ${bottom}`;
  // Back along the bottom, with a drip or two hanging over the panel's edge.
  const drips = Math.max(1, Math.round(w / 220));
  for (let i = drips; i >= 1; i--) {
    const dw = 9 + next() * 7, dh = 5 + next() * 5, at = Math.min(w - 24 - dw, (w * (i - 0.4 + next() * 0.5)) / (drips + 0.2));
    d += ` L${(at + dw).toFixed(1)} ${bottom} C${(at + dw).toFixed(1)} ${(bottom + dh * 1.5).toFixed(1)} ${at.toFixed(1)} ${(bottom + dh * 1.5).toFixed(1)} ${at.toFixed(1)} ${bottom}`;
  }
  return `${d} Z`;
}

/** A cap of snow for the top of a panel: the snow piles up on the work as you read. Measures its own width so the
 *  lumps are drawn at their real size. */
export function Cap({ i = 0, grow }: { i?: number; grow?: boolean }) {
  const ref = useRef<SVGSVGElement>(null), [w, setW] = useState(240);
  useLayoutEffect(() => {
    // The used width, not the box on screen: GSAP scales the cap while the snow piles up.
    const el = ref.current!, fit = () => { const n = Math.round(parseFloat(getComputedStyle(el).width)); if (n > 40) setW(n); };
    fit();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, []);
  return <svg ref={ref} className={grow ? 'cap grow' : 'cap'} viewBox={`0 0 ${w} 40`} preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false">
    <path d={capPath(w, i + 1)} fill={SNOW} {...stroke} strokeWidth={2.6} />
  </svg>;
}

/** Holly for a corner of the title box, on its own. */
export const HollySprig = () =>
  <svg className="holly" viewBox="-30 -14 60 26" aria-hidden="true" focusable="false"><Holly x={0} y={0} s={1.1} /></svg>;

