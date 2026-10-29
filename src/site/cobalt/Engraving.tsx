/* The engraving: one Lake Tahoe scene drawn in cobalt line work on paper. Hatching is SVG patterns, the outlines draw
   in with a dash offset (pathLength 1), and the layers are grouped so Home.tsx can move them on scroll and set the
   sun by the visitor's clock. Ids start with c- so they can't meet another page's. */

/* Where the trees and flowers stand, in the scene's units. Pines are [x, y, width, height]; aspens are [x, trunk]. */
const PINES = [[6, 320, 34, 88], [34, 340, 26, 68], [54, 306, 40, 102], [90, 346, 24, 62], [108, 330, 30, 78], [134, 352, 22, 56], [152, 338, 28, 70], [178, 358, 20, 50], [196, 350, 22, 58], [218, 364, 18, 44], [238, 370, 15, 38], [256, 374, 13, 34], [380, 378, 12, 30], [394, 372, 14, 36], [560, 380, 12, 28], [574, 376, 14, 32], [704, 378, 13, 30], [790, 374, 15, 34], [1000, 360, 20, 50], [1020, 342, 28, 68], [1046, 356, 22, 54], [1066, 322, 36, 88], [1098, 344, 26, 66], [1122, 310, 40, 100], [1158, 336, 30, 74]] as const;
const ASPENS = [[300, 16], [322, 20], [344, 14], [438, 18], [462, 22], [488, 15], [512, 19], [612, 17], [636, 21], [660, 15], [740, 18], [764, 14], [840, 20], [866, 16]] as const;
const FLOWERS = [[284, 402], [292, 405], [362, 403], [372, 400], [420, 404], [452, 401], [500, 405], [530, 402], [598, 404], [688, 401], [722, 405], [812, 403], [884, 402], [930, 405]] as const;

/** Snow for the winter sky: a fixed scatter, drawn twice so the fall can loop without a seam. */
const FLAKES = Array.from({ length: 70 }, (_, i) => [(i * 173.3) % 1200, (i * 97.7) % 560, 0.9 + (i % 4) * 0.35] as const);
const LEAVES = Array.from({ length: 12 }, (_, i) => ({ x: 120 + ((i * 211) % 980), d: 14 + (i % 5) * 3, delay: -(i * 2.3) }));

/** The shared patterns and shapes. Rendered once per page, before anything that uses them. */
export function Plates() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
<defs>
<defs>
<pattern id="c-hz" width="6" height="3.6" patternUnits="userSpaceOnUse"><line x1="0" y1="1.8" x2="6" y2="1.8" strokeWidth=".7" stroke="#2440a0" /></pattern>
<pattern id="c-hzs" width="8" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="3" x2="8" y2="3" strokeWidth=".5" stroke="#2440a0" /></pattern>
<pattern id="c-sky" width="12" height="11" patternUnits="userSpaceOnUse"><line x1="0" y1="5.5" x2="12" y2="5.5" strokeWidth=".45" stroke="#2440a0" /></pattern>
<pattern id="c-dg" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="2" x2="4" y2="2" strokeWidth=".85" stroke="#2440a0" /></pattern>
<pattern id="c-dgx" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="2" x2="4" y2="2" strokeWidth=".7" stroke="#2440a0" /><line x1="2" y1="0" x2="2" y2="4" strokeWidth=".5" stroke="#2440a0" /></pattern>
<pattern id="c-dot2" width="2.2" height="2.2" patternUnits="userSpaceOnUse"><circle cx="1.1" cy="1.1" r=".7" fill="#2440a0" /></pattern>
<pattern id="c-dot" width="4.5" height="4.5" patternUnits="userSpaceOnUse"><circle cx="2.25" cy="2.25" r=".6" fill="#2440a0" /></pattern>
<linearGradient id="c-fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset=".55" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" /></linearGradient>
<mask id="c-skyfade" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="400"><rect x="0" y="0" width="1200" height="400" fill="url(#c-fadeG)" /></mask>
<path id="c-far" pathLength="1" d="M0 318 L50 300 L110 310 L170 282 L230 296 L300 262 L360 284 L430 270 L500 292 L560 258 L620 276 L690 262 L760 288 L830 270 L900 282 L960 250 L1030 274 L1090 262 L1150 280 L1200 272 L1200 400 L0 400 Z" />
<path id="c-nearL" pathLength="1" d="M0 372 L70 336 L140 306 L200 262 L250 222 L270 216 L296 236 L340 268 L400 304 L470 334 L540 356 L620 376 L620 400 L0 400 Z" />
<path id="c-nearR" pathLength="1" d="M640 382 L720 350 L790 322 L850 300 L905 284 L950 296 L1000 276 L1050 290 L1110 308 L1160 322 L1200 330 L1200 400 L640 400 Z" />
<symbol id="c-pine" viewBox="0 0 20 52" overflow="visible"><path pathLength="1" d="M10 1 L13 11 L11.5 11 L15.5 21 L13 21 L17.5 32 L14 32 L19 44 L1 44 L6 32 L2.5 32 L7 21 L4.5 21 L8.5 11 L7 11 Z" fill="url(#c-dg)" strokeWidth=".9" strokeLinejoin="round" stroke="#2440a0" /><line pathLength="1" x1="10" y1="44" x2="10" y2="52" strokeWidth="1.2" stroke="#2440a0" /></symbol>
<symbol id="c-pineSnow" viewBox="0 0 20 52" overflow="visible"><path className="nos" fill="#f6f3ec" d="M10 1 L11.8 7 L8.2 7 Z M8.5 11 L11.5 11 L13.4 16 L6.6 16 Z M7 21 L13 21 L15 26 L5 26 Z M6 32 L14 32 L16.2 37 L3.8 37 Z" /></symbol>
</defs></defs>
  </svg>;
}

/** The hero scene. The sun is the one thing you can grab. */
export function Scene({ label }: { label: string }) {
  return <svg className="eng scene" id="c-scene" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
<rect x="0" y="0" width="1200" height="400" fill="url(#c-sky)" mask="url(#c-skyfade)" />
<g className="night" id="c-night" style={{ opacity: '0' }}>
<rect x="0" y="0" width="1200" height="400" fill="url(#c-hz)" mask="url(#c-skyfade)" />
<g fill="#f6f3ec">
<circle className="nos" cx="80" cy="60" r="1.8" /><circle className="nos" cx="190" cy="120" r="1.2" /><circle className="nos" cx="300" cy="44" r="1.5" /><circle className="nos" cx="420" cy="96" r="1.1" /><circle className="nos" cx="520" cy="38" r="1.9" /><circle className="nos" cx="600" cy="140" r="1.2" /><circle className="nos" cx="700" cy="70" r="1.4" /><circle className="nos" cx="780" cy="30" r="1.1" /><circle className="nos" cx="960" cy="56" r="1.7" /><circle className="nos" cx="1040" cy="132" r="1.2" /><circle className="nos" cx="1120" cy="48" r="1.5" /><circle className="nos" cx="1160" cy="170" r="1.1" /><circle className="nos" cx="360" cy="180" r="1" /><circle className="nos" cx="880" cy="110" r="1.3" /><circle className="nos" cx="250" cy="220" r="1" /><circle className="nos" cx="470" cy="210" r="1.3" /><circle className="nos" cx="740" cy="190" r="1" />
</g>
<path className="nos" d="M640 60 l0 -9 M640 60 l0 9 M640 60 l-9 0 M640 60 l9 0" style={{ stroke: '#f6f3ec' }} strokeWidth="1.2" />
</g>

<g id="c-pSun">
<g className="sun" id="c-sun">
<circle cx="0" cy="0" r="110" fill="transparent" className="nos" />
<g id="c-sunDay">
<circle cx="0" cy="0" r="84" fill="none" strokeWidth=".5" strokeDasharray="2 5" className="hatch" />
<circle cx="0" cy="0" r="70" fill="#f6f3ec" strokeWidth=".6" pathLength="1" className="ink" />
<circle cx="0" cy="0" r="56" fill="url(#c-hz)" className="nos hatch" />
<circle cx="0" cy="0" r="56" fill="none" strokeWidth="1" pathLength="1" className="ink" />
</g>
<g id="c-sunNight" style={{ opacity: '0' }}>
<circle cx="0" cy="0" r="52" fill="#f6f3ec" className="nos" />
<path d="M0 -46 A46 46 0 1 0 0 46 A36 36 0 1 1 0 -46 Z" fill="url(#c-hzs)" strokeWidth="1" />
</g>
</g>
</g>

<g className="birds-a">
<path d="M640 132 q6 -6 12 0 q6 -6 12 0" fill="none" strokeWidth="1.2" />
<path d="M684 150 q5 -5 10 0 q5 -5 10 0" fill="none" strokeWidth="1.1" />
<path d="M612 162 q4 -4 8 0 q4 -4 8 0" fill="none" strokeWidth="1" />
</g>
<g className="birds-b">
<path d="M742 112 q4 -4 8 0 q4 -4 8 0" fill="none" strokeWidth="1" />
<path d="M770 124 q3 -3 6 0 q3 -3 6 0" fill="none" strokeWidth=".9" />
</g>

<g id="c-pFar">
<use href="#c-far" fill="#f6f3ec" strokeWidth=".8" className="ink" />
<use href="#c-far" fill="url(#c-dot)" className="nos hatch" />
<g className="hatch"><g className="s s-w s-sp">
<path d="M272 276 L300 262 L330 272 L322 274 L314 270 L306 276 L296 270 L286 278 Z" fill="#f6f3ec" strokeWidth=".7" />
<path d="M532 274 L560 258 L590 267 L580 270 L572 266 L562 273 L552 267 L542 275 Z" fill="#f6f3ec" strokeWidth=".7" />
<path d="M930 266 L960 250 L995 262 L985 265 L975 260 L964 268 L952 262 L942 270 Z" fill="#f6f3ec" strokeWidth=".7" />
</g></g>
</g>
<g id="c-pNear">
<use href="#c-nearL" fill="#f6f3ec" strokeWidth="1.1" className="ink l2" />
<use href="#c-nearL" fill="url(#c-hzs)" className="nos hatch" />
<path d="M270 216 L296 236 L340 268 L400 304 L470 334 L540 356 L620 376 L620 400 L420 400 L380 352 L330 300 L292 252 Z" fill="url(#c-dgx)" className="nos hatch" />
<path d="M250 222 L236 244 L248 240 L240 262 M270 216 L262 240 L274 236 M296 236 L292 256" fill="none" strokeWidth=".8" className="hatch" />
<use href="#c-nearR" fill="#f6f3ec" strokeWidth="1.1" className="ink l3" />
<use href="#c-nearR" fill="url(#c-hzs)" className="nos hatch" />
<path d="M905 284 L950 296 L1000 276 L1050 290 L1110 308 L1160 322 L1200 330 L1200 400 L1010 400 L980 340 Z" fill="url(#c-dg)" className="nos hatch" />
<g className="hatch"><g className="s s-w">
<path d="M222 244 L250 222 L270 216 L296 236 L312 248 L300 246 L290 254 L280 244 L268 256 L258 244 L244 252 L234 244 Z" fill="#f6f3ec" strokeWidth=".8" />
<path d="M878 292 L905 284 L930 291 L922 293 L914 290 L906 295 L896 290 L888 295 Z" fill="#f6f3ec" strokeWidth=".7" />
<path d="M972 287 L1000 276 L1028 284 L1018 286 L1010 283 L1001 289 L992 283 L982 289 Z" fill="#f6f3ec" strokeWidth=".7" />
</g></g>
</g>
<g id="c-pFront">
<path className="hatch" d="M0 402 Q180 392 360 398 T720 396 T1200 398 L1200 412 L0 412 Z" fill="url(#c-hz)" strokeWidth=".9" />
<g className="pines">{PINES.map(([x, y, w, h]) => <use key={x} href="#c-pine" x={x} y={y} width={w} height={h} />)}</g>
<g className="hatch"><g className="s s-w">{PINES.map(([x, y, w, h]) => <use key={x} href="#c-pineSnow" x={x} y={y} width={w} height={h} />)}</g></g>
<g className="hatch">
<g className="s s-sp">{FLOWERS.map(([x, y], i) => <g key={i}><line x1={x} y1={y + 6} x2={x} y2={y + 1.6} strokeWidth=".6" /><circle cx={x} cy={y} r="1.6" fill="#f6f3ec" strokeWidth=".7" /></g>)}</g>
{ASPENS.map(([x, h], i) => <g key={i}>
<line x1={x} y1={410} x2={x} y2={410 - h} strokeWidth=".9" />
<g className="s s-w"><path d={`M${x} ${410 - h * .7} l-6 -7 M${x} ${410 - h * .85} l5 -8 M${x} ${410 - h} l-3 -6 M${x} ${410 - h} l3 -7`} fill="none" strokeWidth=".7" /></g>
<g className="s s-sp"><ellipse cx={x} cy={410 - h - 4} rx={5} ry={7} fill="url(#c-dot)" strokeWidth=".6" /></g>
<g className="s s-su"><ellipse cx={x} cy={410 - h - 6} rx={8} ry={11} fill="url(#c-dg)" strokeWidth=".8" /></g>
<g className="s s-f"><ellipse cx={x} cy={410 - h - 6} rx={8} ry={11} fill="#f6f3ec" strokeWidth="1" /><ellipse cx={x} cy={410 - h - 6} rx={8} ry={11} fill="url(#c-dot2)" className="nos" /></g>
</g>)}
</g>
<g className="water-in">
<g className="water" fill="none">
<line x1="0" y1="420" x2="1200" y2="420" strokeWidth=".7" strokeDasharray="120 6 40 4 220 10 60 5" />
<line x1="0" y1="427" x2="1200" y2="427" strokeWidth=".6" strokeDasharray="80 8 30 5 160 12 50 6" />
<line x1="0" y1="435" x2="1200" y2="435" strokeWidth=".6" strokeDasharray="200 10 60 6 90 14" />
<line x1="0" y1="444" x2="1200" y2="444" strokeWidth=".55" strokeDasharray="60 9 140 7 30 12 110 8" />
<line x1="0" y1="454" x2="1200" y2="454" strokeWidth=".55" strokeDasharray="180 14 50 8 100 16" />
<line x1="0" y1="465" x2="1200" y2="465" strokeWidth=".5" strokeDasharray="90 12 40 10 220 18" />
<line x1="0" y1="477" x2="1200" y2="477" strokeWidth=".5" strokeDasharray="140 16 60 12 80 20" />
<line x1="0" y1="490" x2="1200" y2="490" strokeWidth=".45" strokeDasharray="70 18 160 14 50 22" />
<line x1="0" y1="504" x2="1200" y2="504" strokeWidth=".45" strokeDasharray="200 24 60 16 120 26" />
<line x1="0" y1="519" x2="1200" y2="519" strokeWidth=".4" strokeDasharray="110 28 70 20 180 30" />
<line x1="0" y1="535" x2="1200" y2="535" strokeWidth=".4" strokeDasharray="160 34 90 26 60 36" />
<line x1="0" y1="552" x2="1200" y2="552" strokeWidth=".35" strokeDasharray="240 40 100 30" />
</g>
<g fill="none" className="refl" id="c-refl">
<line x1="-42" y1="424" x2="42" y2="424" strokeWidth="1.6" strokeDasharray="14 4 22 3 18 5" />
<line x1="-34" y1="432" x2="34" y2="432" strokeWidth="1.4" strokeDasharray="10 5 18 4 12" />
<line x1="-28" y1="441" x2="28" y2="441" strokeWidth="1.3" strokeDasharray="8 4 14 6 10" />
<line x1="-22" y1="451" x2="22" y2="451" strokeWidth="1.1" strokeDasharray="6 5 12 6" />
<line x1="-16" y1="462" x2="16" y2="462" strokeWidth="1" strokeDasharray="5 6 9" />
<line x1="-12" y1="474" x2="12" y2="474" strokeWidth=".9" strokeDasharray="4 6 6" />
<line x1="-8" y1="487" x2="8" y2="487" strokeWidth=".8" strokeDasharray="3 5 4" />
</g>
</g>
<path d="M940 486 L1200 474 L1200 490 L942 498 Z" fill="url(#c-dg)" strokeWidth="1" />
<path d="M942 498 L942 548 M990 496 L990 552 M1040 494 L1040 556 M1090 492 L1090 558 M1140 490 L1140 560 M1190 488 L1190 560" fill="none" strokeWidth="2" />
<path d="M960 486 L960 470 M1180 475 L1180 458" fill="none" strokeWidth="1.6" />
<g className="hatch"><g className="s s-su"><g className="boat">
<path d="M500 470 L500 414" fill="none" strokeWidth="1" />
<path d="M503 416 L503 466 L532 466 Z" fill="url(#c-hzs)" strokeWidth=".9" />
<path d="M497 422 L497 466 L476 466 Z" fill="#f6f3ec" strokeWidth=".9" />
<path d="M466 470 L534 470 L526 479 L474 479 Z" fill="url(#c-dg)" strokeWidth=".9" />
<path d="M478 486 L522 486 M486 492 L514 492" fill="none" strokeWidth=".6" strokeDasharray="6 4" />
</g></g></g>
</g>
<g className="hatch"><g className="s s-w">{[0, 1].map(k => <g key={k} className={`snowfall s${k}`}>{FLAKES.filter((_, i) => i % 2 === k).map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r} fill="#f6f3ec" strokeWidth=".6" /><circle cx={x} cy={y - 560} r={r} fill="#f6f3ec" strokeWidth=".6" /></g>)}</g>)}</g></g>
<g className="hatch"><g className="s s-f">{LEAVES.map((l, i) => <g key={i} className="leaf" style={{ animationDuration: `${l.d}s`, animationDelay: `${l.delay}s` }}><path d={`M${l.x} -10 q5 -5 10 0 q-5 5 -10 0 Z`} fill="url(#c-dg)" strokeWidth=".7" /></g>)}</g></g>  </svg>;
}

/** The footer strip: a shoreline, a few pines, and birds that take off as you reach the bottom. */
export function FootArt() {
  return <svg className="eng foot-art" viewBox="0 0 1200 200" aria-hidden="true" focusable="false">
<g className="fbird" data-dx="760" data-dy="-150"><path className="flap" d="M120 150 q7 -7 14 0 q7 -7 14 0" fill="none" strokeWidth="1.3" /></g>
<g className="fbird" data-dx="820" data-dy="-120"><path className="flap" d="M160 166 q6 -6 12 0 q6 -6 12 0" fill="none" strokeWidth="1.2" style={{ animationDelay: '-.2s' }} /></g>
<g className="fbird" data-dx="700" data-dy="-170"><path className="flap" d="M96 172 q5 -5 10 0 q5 -5 10 0" fill="none" strokeWidth="1.1" style={{ animationDelay: '-.1s' }} /></g>
<g className="fbird" data-dx="880" data-dy="-100"><path className="flap" d="M210 158 q6 -6 12 0 q6 -6 12 0" fill="none" strokeWidth="1.2" style={{ animationDelay: '-.3s' }} /></g>
<g className="fbird" data-dx="640" data-dy="-190"><path className="flap" d="M60 160 q5 -5 10 0 q5 -5 10 0" fill="none" strokeWidth="1" style={{ animationDelay: '-.25s' }} /></g>
<g className="fbird" data-dx="900" data-dy="-140"><path className="flap" d="M250 176 q4 -4 8 0 q4 -4 8 0" fill="none" strokeWidth="1" style={{ animationDelay: '-.05s' }} /></g>
<g className="fbird" data-dx="780" data-dy="-80"><path className="flap" d="M190 182 q4 -4 8 0 q4 -4 8 0" fill="none" strokeWidth=".9" style={{ animationDelay: '-.35s' }} /></g>
<use href="#c-pine" x="0" y="128" width="22" height="60" /><use href="#c-pine" x="20" y="146" width="16" height="42" /><use href="#c-pine" x="34" y="116" width="26" height="72" />
<line x1="0" y1="190" x2="1200" y2="190" strokeWidth=".9" />
<line x1="60" y1="196" x2="1200" y2="196" strokeWidth=".5" strokeDasharray="80 10 30 8 160 14" />
<use href="#c-pine" x="1144" y="132" width="20" height="56" /><use href="#c-pine" x="1160" y="116" width="26" height="72" /><use href="#c-pine" x="1182" y="146" width="16" height="42" />  </svg>;
}
