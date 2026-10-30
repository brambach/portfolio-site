/* The drawings: one pumpkin patch at dusk and a footer strip, in thick wobbly ink and flat Sunday paper colors. All of
   it is original line art. Ids start with pk- so they can't meet another page's. The ink sits in one group so Home.tsx
   can swap its boil filter a few times a second, the way a hand-drawn cartoon's lines shimmer. */

const INK = '#1f1b16';
const stroke = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const, vectorEffect: 'non-scaling-stroke' as const };

/** Filters and shapes. Rendered once per page, before anything that uses them. */
export function Plates() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <defs>
      {[3, 11, 27].map((seed, i) => <filter key={seed} id={`pk-b${i}`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={1} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>)}
      <pattern id="pk-dots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="4.5" cy="4.5" r="2" fill="#e8742a" /></pattern>
      <pattern id="pk-dots-s" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="3.5" cy="3.5" r="1.1" fill="#7a4a22" /></pattern>
      <linearGradient id="pk-fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="1" stopColor="#fff" /></linearGradient>
      <mask id="pk-skyfade" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="440"><rect width="1200" height="440" fill="url(#pk-fadeG)" /></mask>
    </defs>
  </svg>;
}

/** A pumpkin standing on (x, y). The big one has a face that lights up. */
function Pumpkin({ x, y, s, big, i }: { x: number; y: number; s: number; big?: boolean; i: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={big ? 'pump big' : 'pump'} data-i={i}>
      <ellipse cx="0" cy="-2" rx="52" ry="7" fill={INK} opacity=".18" />
      <path d="M-2 -58 C-2 -70 4 -78 12 -80" fill="none" {...stroke} stroke="#3f5b22" strokeWidth={6} />
      <path d="M-2 -58 C-2 -70 4 -78 12 -80" fill="none" {...stroke} />
      <ellipse cx="-22" cy="-30" rx="27" ry="30" fill="#ee7b22" {...stroke} />
      <ellipse cx="22" cy="-30" rx="27" ry="30" fill="#ee7b22" {...stroke} />
      <ellipse cx="0" cy="-31" rx="22" ry="31" fill="#f39234" {...stroke} />
      <path d="M-34 -50 q-6 14 -2 30" fill="none" {...stroke} strokeWidth={2} stroke="#fff3c4" opacity=".7" />
      {big && <g className="face">
        <path d="M-20 -42 l8 -12 l8 12 Z M4 -42 l8 -12 l8 12 Z M-24 -24 q24 20 48 0 l-6 2 l-4 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-4 6 Z" fill="#ffd84a" {...stroke} strokeWidth={2} />
      </g>}
    </g>
  </g>;
}

const PUMPKINS: { x: number; y: number; s: number; big?: boolean }[] = [
  { x: 150, y: 540, s: 1.1 }, { x: 300, y: 492, s: 0.7 }, { x: 410, y: 566, s: 1 }, { x: 590, y: 488, s: 0.62 },
  { x: 720, y: 552, s: 1.75, big: true }, { x: 920, y: 500, s: 0.8 }, { x: 1060, y: 556, s: 1.05 }, { x: 1150, y: 490, s: 0.6 },
];

/** The kid in the bedsheet, standing on (x, y). */
function Ghost({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="ghost">
      <ellipse cx="0" cy="0" rx="46" ry="7" fill={INK} opacity=".18" />
      <ellipse cx="-18" cy="-6" rx="13" ry="7" fill={INK} />
      <ellipse cx="18" cy="-6" rx="13" ry="7" fill={INK} />
      <g className="sheet">
        <path d="M-48 -18 C-52 -90 -40 -172 0 -174 C40 -172 52 -90 48 -18 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 q-8 10 -16 0 Z" fill="#fffdf6" {...stroke} />
        <path d="M-22 -70 q6 28 -2 46 M18 -84 q-4 30 4 58" fill="none" {...stroke} strokeWidth={2} />
        <ellipse cx="-16" cy="-122" rx="7" ry="10" fill={INK} />
        <ellipse cx="16" cy="-122" rx="7" ry="10" fill={INK} />
      </g>
    </g>
  </g>;
}

const Bat = ({ x, y, s, d }: { x: number; y: number; s: number; d: string }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><path className="flap" style={{ animationDelay: d }} d="M0 0 C-6 -8 -16 -10 -26 -4 C-20 -2 -18 4 -20 8 C-14 4 -6 6 0 10 C6 6 14 4 20 8 C18 4 20 -2 26 -4 C16 -10 6 -8 0 0Z" fill={INK} /></g>;

/** The hero panel. Pumpkins bounce when tapped; Home.tsx wires that up. */
export function Scene({ label }: { label: string }) {
  return <svg className="scene" id="pk-scene" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
    <rect width="1200" height="600" fill="#f8d45c" />
    <rect width="1200" height="440" fill="url(#pk-dots)" mask="url(#pk-skyfade)" />
    <g id="pk-ink">
      <g className="moon-g">
        <circle cx="760" cy="150" r="74" fill="#fff6d8" {...stroke} />
        <circle cx="736" cy="128" r="10" fill="none" {...stroke} strokeWidth={2} />
        <circle cx="782" cy="176" r="14" fill="none" {...stroke} strokeWidth={2} />
        <circle cx="790" cy="118" r="6" fill="none" {...stroke} strokeWidth={2} />
      </g>
      <g className="bats-a"><Bat x={560} y={110} s={1} d="0s" /><Bat x={620} y={80} s={0.7} d="-.15s" /><Bat x={880} y={210} s={0.8} d="-.3s" /></g>
      <g className="bats-b"><Bat x={420} y={190} s={0.6} d="-.2s" /><Bat x={1000} y={120} s={0.9} d="-.05s" /></g>
      <path d="M0 330 C120 290 220 300 330 318 C450 270 560 290 640 312 C760 276 880 290 980 316 C1080 292 1150 300 1200 310 L1200 440 L0 440 Z" fill="#8f73b5" {...stroke} />
      <rect x="-10" y="360" width="1220" height="16" fill="#c4834a" {...stroke} />
      <rect x="-10" y="404" width="1220" height="16" fill="#c4834a" {...stroke} />
      {Array.from({ length: 21 }, (_, i) => i * 60 - 10).map((x, i) =>
        <path key={x} d={`M${x} ${352 + (i % 3) * 3} l20 -20 l20 20 v92 h-40 Z`} fill="#dea36a" {...stroke} />)}
      <path d="M0 448 C200 432 380 452 600 440 C820 428 1000 450 1200 438 L1200 600 L0 600 Z" fill="#a8743f" {...stroke} />
      <path d="M0 448 C200 432 380 452 600 440 C820 428 1000 450 1200 438 L1200 600 L0 600 Z" fill="url(#pk-dots-s)" opacity=".35" />
      <path d="M40 520 C120 500 160 560 260 520 s120 -40 160 10 M480 470 c40 -20 80 30 130 0 s60 -20 100 10 M800 540 c50 -30 90 20 140 -10 s80 10 120 -20 M1000 470 c30 -10 60 20 110 0"
        fill="none" {...stroke} stroke="#4f7a2c" strokeWidth={5} />
      <path d="M260 520 c10 -14 26 -6 18 6 M610 470 c8 -14 24 -4 14 8 M940 530 c10 -12 24 -2 12 8" fill="none" {...stroke} stroke="#4f7a2c" strokeWidth={3} />
      <g id="pk-ghost"><Ghost x={520} y={560} /></g>
      {PUMPKINS.map((p, i) => <Pumpkin key={i} i={i} {...p} />)}
    </g>
  </svg>;
}

/** The footer strip: a fence, a row of pumpkins and a ghost waving goodbye. The bats take off as you arrive. */
export function FootArt({ label }: { label: string }) {
  return <svg className="foot-art" viewBox="0 0 1200 220" role="img" aria-label={label}>
    <g id="pk-footInk">
      {[{ x: 300, y: 70, dx: 520, dy: -160 }, { x: 340, y: 50, dx: 640, dy: -120 }, { x: 260, y: 96, dx: 700, dy: -190 }, { x: 380, y: 88, dx: 600, dy: -80 }].map((b, i) =>
        <g key={i} className="fbat" data-dx={b.dx} data-dy={b.dy}><Bat x={b.x} y={b.y} s={0.8} d={`${-i * 0.1}s`} /></g>)}
      <rect x="-10" y="140" width="1220" height="12" fill="#c4834a" {...stroke} />
      {Array.from({ length: 21 }, (_, i) => i * 60 - 10).map(x => <path key={x} d={`M${x} 132 l16 -16 l16 16 v74 h-32 Z`} fill="#dea36a" {...stroke} />)}
      <path d="M0 206 L1200 206" {...stroke} />
      <g className="foot-pumps">
        <Pumpkin x={120} y={210} s={0.8} i={10} /><Pumpkin x={210} y={212} s={0.55} i={11} />
        <Pumpkin x={980} y={212} s={0.6} i={12} /><Pumpkin x={1080} y={210} s={0.9} i={13} />
      </g>
      <g className="waver"><Ghost x={860} y={210} s={0.85} /></g>
    </g>
  </svg>;
}

/** One falling leaf. */
export const Leaf = ({ c }: { c: string }) =>
  <svg viewBox="-12 -14 24 28" aria-hidden="true" focusable="false"><path d="M0 -12 C9 -7 11 4 0 13 C-11 4 -9 -7 0 -12Z" fill={c} {...stroke} strokeWidth={2} /><path d="M0 -10 L0 12" {...stroke} strokeWidth={1.5} /></svg>;
