import type { ReactNode } from 'react';
import { Ghost, INK, Pumpkin, stroke } from '../patch/Art';

/* The drawings for the dinner table look: the pumpkin patch's yard a month later, in the same thick wobbly ink and
   flat Sunday paper colors. All of it is original line art. Ids start with hv- so they can't meet another page's.

   The hero is a stack of layers that share one viewBox, so the scroll can move one without repainting the rest:
   the sky (plain HTML plates, see Home.tsx), Far (sun, geese, stars), Back (hills, tree, fence, ground), Tint (dusk
   falling over the yard), Live (the table and everything you can tap) and Lights (the string of bulbs, the steam and
   the tree's last leaves). The ink of Back and Live sits in a group each so the page can boil their lines. */

const VB = '0 0 1200 600';
const layer = { viewBox: VB, preserveAspectRatio: 'xMidYMax slice', focusable: false as const };
const thin = { ...stroke, strokeWidth: 2 };
const LEAF = 'M0 -12 C9 -7 11 4 0 13 C-11 4 -9 -7 0 -12Z';
const COLORS = ['#e8742a', '#d8432c', '#f2b632', '#b8572a'];
const BULBS = ['#ffd84a', '#ff9a3c', '#f2634a', '#fff1a8'];
const HILLS_FAR = 'M0 292 C130 246 250 250 370 280 C500 232 640 240 760 276 C880 240 1040 244 1200 270';
const HILLS_NEAR = 'M0 336 C120 300 220 306 330 322 C450 284 560 296 640 316 C760 286 880 296 980 320 C1080 300 1150 306 1200 314';

/** Filters, patterns and the bulbs' glow. Rendered once per page, before anything that uses them. */
export function Plates() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <defs>
      {[5, 14, 23].map((seed, i) => <filter key={seed} id={`hv-b${i}`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={1} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>)}
      <pattern id="hv-dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="3.5" cy="3.5" r="1.1" fill="#6b3d1c" /></pattern>
      <pattern id="hv-check" width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="14" height="28" fill="#c9402a" opacity=".5" /><rect width="28" height="14" fill="#c9402a" opacity=".5" />
      </pattern>
      <pattern id="hv-stars" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><circle cx="9" cy="12" r="1.5" fill="#fff3c9" /><circle cx="33" cy="34" r="1" fill="#fff3c9" /></pattern>
      <radialGradient id="hv-glow"><stop offset="0" stopColor="#ffe27a" stopOpacity=".85" /><stop offset=".45" stopColor="#ffd84a" stopOpacity=".32" /><stop offset="1" stopColor="#ffd84a" stopOpacity="0" /></radialGradient>
    </defs>
  </svg>;
}

/** A goose seen from far off: two wings and a dash of a body. */
const Goose = ({ x, y, s = 1, d }: { x: number; y: number; s?: number; d: string }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path className="wing" style={{ animationDelay: d }} d="M-17 -8 Q-8 -1 0 0 Q8 -1 17 -8" fill="none" {...stroke} strokeWidth={3.5} />
    <path d="M-5 1 L4 2" fill="none" {...stroke} strokeWidth={3.5} />
  </g>;

const VEE = [[0, 0], [30, -13], [30, 15], [60, -26], [60, 30], [90, 45]];

/** The far layer: a low sun that sets as you scroll, geese heading south and the first stars. */
export function Far() {
  return <svg className="far" {...layer} aria-hidden="true">
    <g className="stars">
      {[[120, 70], [260, 150], [420, 60], [560, 190], [660, 80], [900, 60], [1010, 170], [1120, 90], [330, 230], [800, 130]].map(([x, y], i) =>
        <path key={i} className="star" transform={`translate(${x} ${y}) scale(${0.7 + (i % 3) * 0.25})`} d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" fill="#fff3c9" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" opacity="0" />)}
    </g>
    <g id="hv-sun">
      <g className="rays">{Array.from({ length: 12 }, (_, i) => <path key={i} d="M745 119 L745 101" transform={`rotate(${i * 30} 745 205)`} fill="none" {...stroke} strokeWidth={3.5} />)}</g>
      <circle className="disc" cx="745" cy="205" r="66" fill="#ffe9a8" {...stroke} />
      <path d="M708 178 q10 -24 34 -30" fill="none" {...thin} stroke="#fffdf6" />
    </g>
    <g id="hv-geese"><g className="skein" transform="translate(880 96)">{VEE.map(([x, y], i) => <Goose key={i} x={x} y={y} s={1 - i * 0.04} d={`${-i * 0.13}s`} />)}</g></g>
  </svg>;
}

/** Leaves that have already come down, scattered over the yard. */
const FALLEN = [[70, 520, 30], [150, 590, -40], [236, 500, 80], [352, 486, 10], [560, 590, 120], [700, 592, -20], [828, 500, 60], [900, 590, -70], [1010, 520, 20], [1090, 500, 140], [1170, 584, -30], [480, 478, 200]];

/** The back layer: two rows of hills, the bare tree, the fence and the yard. It never changes, so only the boil
 *  repaints it. */
export function Back() {
  return <svg className="back" {...layer} aria-hidden="true">
    <g id="hv-backInk">
      <path d={`${HILLS_FAR} L1200 440 L0 440 Z`} fill="#e0a04a" {...stroke} />
      <path d={`${HILLS_NEAR} L1200 440 L0 440 Z`} fill="#b5562f" {...stroke} />
      <path d={`${HILLS_NEAR} L1200 440 L0 440 Z`} fill="url(#hv-dots)" opacity=".3" />
      {/* The tree: every limb is drawn twice, a wide ink stroke under a narrower bark one, so it reads as outlined. */}
      {[['M1046 446 C1040 390 1050 340 1040 290 C1036 262 1040 240 1034 214', 22], ['M1040 300 C1010 270 990 262 962 232', 12], ['M1042 280 C1070 250 1096 250 1124 214', 12],
        ['M1036 240 C1020 210 1012 190 996 168', 10], ['M1036 226 C1052 196 1070 180 1076 150', 10], ['M990 258 C976 256 966 262 952 266', 6], ['M1100 240 C1112 240 1124 248 1138 246', 6]].map(([d, w]) =>
        <g key={d}><path d={d as string} fill="none" {...stroke} strokeWidth={(w as number) + 6} /><path d={d as string} fill="none" {...stroke} stroke="#7a4a26" strokeWidth={w as number} /></g>)}
      <rect x="-10" y="360" width="1220" height="16" fill="#c4834a" {...stroke} />
      <rect x="-10" y="404" width="1220" height="16" fill="#c4834a" {...stroke} />
      {Array.from({ length: 21 }, (_, i) => i * 60 - 10).map((x, i) =>
        <path key={x} d={`M${x} ${352 + (i % 3) * 3} l20 -20 l20 20 v92 h-40 Z`} fill="#dea36a" {...stroke} />)}
      {/* The rake, leaning on the fence where the raking stopped. */}
      <g transform="translate(640 0)"><path d="M232 474 L262 304" fill="none" {...stroke} strokeWidth={10} /><path d="M232 474 L262 304" fill="none" {...stroke} stroke="#b98a4e" strokeWidth={5} />
        <path d="M262 304 L242 272 M262 304 L252 266 M262 304 L264 264 M262 304 L276 268 M262 304 L286 276 M246 280 Q264 268 284 282" fill="none" {...stroke} /></g>
      <path d="M0 448 C200 432 380 452 600 440 C820 428 1000 450 1200 438 L1200 600 L0 600 Z" fill="#a8743f" {...stroke} />
      <path d="M0 448 C200 432 380 452 600 440 C820 428 1000 450 1200 438 L1200 600 L0 600 Z" fill="url(#hv-dots)" opacity=".3" />
      <path d="M96 470 q6 -14 10 0 q6 -12 10 0 M610 596 q6 -14 10 0 q6 -12 10 0 M936 470 q6 -14 10 0 q6 -12 10 0 M1146 540 q6 -14 10 0 q6 -12 10 0" fill="none" {...stroke} stroke="#4f7a2c" />
      {FALLEN.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(.9)`}><path d={LEAF} fill={COLORS[i % 4]} {...thin} /><path d="M0 -10 L0 11" fill="none" {...thin} strokeWidth={1.5} /></g>)}
    </g>
  </svg>;
}

/** Dusk, as one flat wash multiplied over the hills and the yard. The table sits above it, so it stays warm. */
export function Tint() {
  return <svg className="tint" {...layer} aria-hidden="true"><path d={`${HILLS_FAR} L1200 600 L0 600 Z`} fill="#a79ad6" /></svg>;
}

/** Something on the table that hops when the table is bumped, standing on (x, y). */
const Dish = ({ x, y, children, kind = 'dish' }: { x: number; y: number; children: ReactNode; kind?: string }) =>
  <g transform={`translate(${x} ${y})`}><g className={kind}>{children}</g></g>;

const Candle = ({ x, y, h = 42 }: { x: number; y: number; h?: number }) => <Dish x={x} y={y}>
  <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="#d9b25a" {...stroke} />
  <rect x="-5" y={-h - 2} width="10" height={h} rx="2" fill="#a8324a" {...stroke} />
  <path d={`M0 ${-h - 2} v-5`} fill="none" {...thin} />
  <path className="flame" d={`M0 ${-h - 26} C8 ${-h - 16} 7 ${-h - 8} 0 ${-h - 6} C-7 ${-h - 8} -8 ${-h - 16} 0 ${-h - 26}Z`} fill="#ffd84a" {...thin} />
</Dish>;

/* The pie is drawn from a little above, so its four slices can be told apart: an ellipse of crust and filling cut on
   both axes. [name, the crust's wedge, the filling's wedge]. Three get taken and the front left one is left for you. */
const wedge = (rx: number, ry: number, a: [number, number], b: [number, number]) => `M0 0 L${a[0] * rx} ${a[1] * ry} A${rx} ${ry} 0 0 1 ${b[0] * rx} ${b[1] * ry} Z`;
const QUADS: [string, [number, number], [number, number]][] = [['bl', [-1, 0], [0, -1]], ['br', [0, -1], [1, 0]], ['fl', [0, 1], [-1, 0]], ['fr', [1, 0], [0, 1]]];

function Pie({ x, y, left = QUADS.map(q => q[0]) }: { x: number; y: number; left?: string[] }) {
  return <Dish x={x} y={y} kind="dish pie">
    <path d="M-60 -20 L-52 -4 Q0 8 52 -4 L60 -20 Z" fill="#c9c4b8" {...stroke} />
    <ellipse cx="0" cy="-20" rx="60" ry="16" fill="#e4dfd2" {...stroke} />
    <ellipse cx="0" cy="-20" rx="48" ry="11.5" fill="none" {...thin} opacity=".45" />
    {QUADS.filter(q => left.includes(q[0])).map(([name, a, b]) => <g key={name} transform="translate(0 -20)"><g className="slice" data-slice={name}>
      <path d={wedge(60, 16, a, b)} fill="#dfa255" {...stroke} />
      <path d={wedge(49, 12, a, b)} fill="#e8742a" {...thin} />
    </g></g>)}
  </Dish>;
}

/** A slice of pie from the side, lying with its point to the left. */
const Slice = () => <>
  <path d="M-20 0 L16 -13 L18 0 Z" fill="#e8742a" {...thin} />
  <path d="M16 -14 q8 4 3 14 l-4 0 Z" fill="#dfa255" {...thin} />
</>;

const PUMPKINS = [{ x: 930, y: 580, s: 0.78 }, { x: 290, y: 568, s: 0.92 }, { x: 150, y: 548, s: 0.6 }, { x: 1010, y: 552, s: 0.6 }, { x: 1112, y: 574, s: 1.05 }];
const PILE = [[-52, -8, -50, 0], [-30, -26, 20, 1], [-8, -12, 80, 2], [16, -30, -20, 3], [34, -10, 130, 0], [56, -6, 40, 1], [-2, -40, 160, 2], [-34, -4, 100, 3], [10, -2, -80, 1]];

/** A raked pile of leaves standing on (x, y). The loose ones on top fly when it's kicked. */
function Pile({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><g className="pile" id={id}>
    <g className="mound">
      <path d="M-76 0 C-72 -32 -38 -54 0 -52 C40 -56 74 -32 78 0 Z" fill="#d9772b" {...stroke} />
      {PILE.map(([px, py, r, c], i) => <g key={i} transform={`translate(${px} ${py}) rotate(${r})`}><path d={LEAF} fill={COLORS[c]} {...thin} /><path d="M0 -10 L0 11" fill="none" {...thin} strokeWidth={1.5} /></g>)}
    </g>
    {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`translate(${-40 + i * 7} -30)`}><g className="loose"><path d={LEAF} fill={COLORS[i % 4]} {...thin} /></g></g>)}
  </g></g>;
}

/** The table and its cloth, standing between x and x + w with its top at y. */
function Table({ x, y, w, drop = 70, legs = 62 }: { x: number; y: number; w: number; drop?: number; legs?: number }) {
  const n = Math.round(w / 24), step = w / n;
  const cloth = `M${x + 2} ${y + 14} H${x + w - 2} L${x + w} ${y + drop} ${`q${-step / 2} 11 ${-step} 0 `.repeat(n)}Z`;
  return <>
    <ellipse cx={x + w / 2} cy={y + drop + legs - 4} rx={w / 2 + 10} ry="8" fill={INK} opacity=".18" />
    <rect x={x + 14} y={y + drop - 4} width="12" height={legs} fill="#8a5a2e" {...stroke} />
    <rect x={x + w - 26} y={y + drop - 4} width="12" height={legs} fill="#8a5a2e" {...stroke} />
    <path d={cloth} fill="#fffaf0" />
    <path d={cloth} fill="url(#hv-check)" {...stroke} />
    <path d={`M${x + 6} ${y} H${x + w - 6} L${x + w + 8} ${y + 18} H${x - 8} Z`} fill="#fffaf0" />
    <path d={`M${x + 6} ${y} H${x + w - 6} L${x + w + 8} ${y + 18} H${x - 8} Z`} fill="url(#hv-check)" {...stroke} />
  </>;
}

/** The live layer: the table, the kid, the pumpkins and the leaf pile. Home.tsx wires up the taps. */
export function Live({ label }: { label: string }) {
  return <svg className="live" id="hv-scene" {...layer} role="img" aria-label={label}>
    <g id="hv-liveInk">
      {[430, 800].map(x => <g key={x}><path d={`M${x} 316 V524`} fill="none" {...stroke} strokeWidth={10} /><path d={`M${x} 316 V524`} fill="none" {...stroke} stroke="#b98a4e" strokeWidth={5} /></g>)}
      <g id="hv-kid"><Ghost x={520} y={556} /></g>
      <Table x={452} y={454} w={336} />
      <Dish x={535} y={465} kind="dish plate">
        <ellipse cx="0" cy="0" rx="33" ry="8.5" fill="#fffdf6" {...stroke} />
        <ellipse cx="0" cy="-.5" rx="21" ry="4.6" fill="none" {...thin} opacity=".5" />
        {[0, 1, 2].map(i => <g key={i} transform={`translate(${i === 1 ? 3 : -2} ${-2 - i * 9}) rotate(${[-4, 5, -8][i]})`}><g className="got"><Slice /></g></g>)}
      </Dish>
      <Candle x={592} y={466} />
      <Pie x={655} y={468} />
      <Candle x={726} y={466} />
      <Dish x={764} y={468}>
        {/* A blue and white jug, the one thing on the table from the other look. */}
        <path d="M13 -30 c14 -2 14 20 1 20" fill="none" {...stroke} />
        <path d="M-13 0 C-18 -14 -15 -28 -10 -38 L-14 -44 L11 -40 C16 -28 18 -14 13 0 Z" fill="#fffdf6" {...stroke} />
        <path d="M-15.5 -18 H15.5" fill="none" {...stroke} stroke="#2440a0" strokeWidth={5} />
      </Dish>
      {PUMPKINS.map((p, i) => <Pumpkin key={i} i={i} {...p} />)}
      <Pile x={800} y={590} id="hv-pile" />
    </g>
  </svg>;
}

/* The string of lights: three swags, from off the left edge to a pole, across the table to the other pole, and up
   into the tree. Each is a quadratic curve [from, control, to, bulbs]. */
type P = [number, number];
const SWAGS: [P, P, P, number][] = [[[-10, 268], [210, 352], [430, 318], 6], [[430, 318], [615, 392], [800, 318], 7], [[800, 318], [930, 334], [1034, 238], 5]];
const along = (a: P, c: P, b: P, t: number): P => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
const GLASS = 'M0 5 C8 7 9 18 0 25 C-9 18 -8 7 0 5Z';

/** One bulb hanging from (x, y). Unlit it's milk glass; `on` gives it its color and a glow. */
function Bulb({ x, y, i, on }: { x: number; y: number; i: number; on?: boolean }) {
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><g className="bulb">
    <rect x="-3.5" y="-1" width="7" height="7" fill={INK} />
    <path d={GLASS} fill="#f3e6c4" {...thin} />
    <g className="shine" opacity={on ? 1 : 0}>
      <circle className="glow" cx="0" cy="15" r="30" fill="url(#hv-glow)" />
      <path d={GLASS} fill={BULBS[i % 4]} {...thin} />
    </g>
  </g></g>;
}

/* [x, y, color, how far it falls]. */
const TREE_LEAVES = [[962, 232, 0, 250], [1124, 214, 1, 330], [996, 168, 2, 300], [1076, 150, 3, 400], [952, 266, 1, 300], [1138, 246, 0, 240]];

/** The top layer: the lights, the steam off the pie and the last leaves on the tree. Nothing here takes a tap. */
export function Lights() {
  let n = 0;
  return <svg className="lights" id="hv-lights" {...layer} aria-hidden="true">
    {TREE_LEAVES.map(([x, y, c, fall], i) => <g key={i} transform={`translate(${x} ${y})`}><g className="tree-leaf" data-fall={fall}><path d={LEAF} fill={COLORS[c]} {...thin} /><path d="M0 -10 L0 11" fill="none" {...thin} strokeWidth={1.5} /></g></g>)}
    {SWAGS.map(([a, c, b], i) => <path key={i} d={`M${a} Q${c} ${b}`} fill="none" {...thin} strokeWidth={2.5} />)}
    {SWAGS.flatMap(([a, c, b, count]) => Array.from({ length: count }, (_, k) => { const [x, y] = along(a, c, b, (k + 1) / (count + 1)), i = n++; return <Bulb key={i} i={i} x={x} y={y} />; }))}
    <g className="steam">{['M640 428 c-9 -9 9 -17 0 -28', 'M657 424 c-9 -10 9 -18 0 -30', 'M674 428 c-9 -9 9 -17 0 -28'].map(d => <path key={d} className="wisp" d={d} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" opacity=".75" />)}</g>
  </svg>;
}

/** The footer: the same yard that night. The lights are on, one slice is left, and the geese take off as you arrive. */
export function FootArt({ label }: { label: string }) {
  const posts = Array.from({ length: 9 }, (_, i) => i * 150);
  let n = 0;
  return <svg className="foot-art" id="hv-night" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
    <rect width="1200" height="320" fill="#54447f" />
    <rect width="1200" height="200" fill="url(#hv-stars)" />
    <g id="hv-footInk">
      <g id="hv-moon">
        <circle cx="770" cy="84" r="46" fill="#fff6d8" {...stroke} />
        <circle cx="754" cy="70" r="7" fill="none" {...thin} /><circle cx="784" cy="100" r="9" fill="none" {...thin} /><circle cx="790" cy="64" r="4" fill="none" {...thin} />
      </g>
      {[[440, 132, 820, -190], [470, 118, 900, -160], [470, 148, 940, -210], [500, 104, 860, -150], [500, 164, 900, -200]].map(([x, y, dx, dy], i) =>
        <g key={i} className="fgoose" data-dx={dx} data-dy={dy}><Goose x={x} y={y} s={0.8} d={`${-i * 0.13}s`} /></g>)}
      <path d="M0 196 C150 156 300 166 420 188 C560 146 700 156 820 184 C940 156 1080 162 1200 178 L1200 280 L0 280 Z" fill="#3d3166" {...stroke} />
      <rect x="-10" y="212" width="1220" height="11" fill="#8d6a6c" {...stroke} />
      <rect x="-10" y="244" width="1220" height="11" fill="#8d6a6c" {...stroke} />
      {Array.from({ length: 21 }, (_, i) => i * 60 - 10).map(x => <path key={x} d={`M${x} 204 l16 -16 l16 16 v78 h-32 Z`} fill="#b08a86" {...stroke} />)}
      <rect x="-10" y="280" width="1220" height="50" fill="#6a4d4a" {...stroke} />
    </g>
    <g className="foot-lights">
      {posts.slice(0, -1).map(x => <path key={x} d={`M${x} 174 Q${x + 75} 202 ${x + 150} 174`} fill="none" {...thin} strokeWidth={2.5} />)}
      {posts.slice(0, -1).flatMap(x => [0.25, 0.5, 0.75].map(t => { const [bx, by] = along([x, 174], [x + 75, 202], [x + 150, 174], t), i = n++; return <Bulb key={i} i={i} x={bx} y={by} on />; }))}
    </g>
    <g id="hv-footFront">
      <g className="foot-pumps"><Pumpkin x={150} y={314} s={0.8} i={10} /><Pumpkin x={300} y={316} s={0.55} i={11} /><Pumpkin x={900} y={316} s={0.62} i={12} /><Pumpkin x={1060} y={314} s={0.9} i={13} /></g>
      <Table x={506} y={236} w={208} drop={52} legs={30} />
      <Candle x={548} y={246} h={18} />
      <Pie x={612} y={249} left={['fl']} />
      <Candle x={676} y={246} h={24} />
      <g className="waver"><Ghost x={800} y={314} s={0.8} /></g>
      <Pile x={410} y={318} s={0.8} id="hv-footPile" />
    </g>
    <g className="candle-glow">{[[548, 226], [676, 220]].map(([x, y]) => <circle key={x} className="glow" cx={x} cy={y} r="34" fill="url(#hv-glow)" />)}</g>
  </svg>;
}
