/* The engraving: one Lake Tahoe scene drawn in cobalt line work on paper. Hatching is SVG patterns, the outlines draw
   in with a dash offset (pathLength 1), and the layers are grouped so Home.tsx can move them on scroll and set the
   sun by the visitor's clock. Ids start with c- so they can't meet another page's. */

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
<pattern id="c-dot" width="4.5" height="4.5" patternUnits="userSpaceOnUse"><circle cx="2.25" cy="2.25" r=".6" fill="#2440a0" /></pattern>
<linearGradient id="c-fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset=".55" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" /></linearGradient>
<mask id="c-skyfade" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="400"><rect x="0" y="0" width="1200" height="400" fill="url(#c-fadeG)" /></mask>
<path id="c-far" pathLength="1" d="M0 318 L50 300 L110 310 L170 282 L230 296 L300 262 L360 284 L430 270 L500 292 L560 258 L620 276 L690 262 L760 288 L830 270 L900 282 L960 250 L1030 274 L1090 262 L1150 280 L1200 272 L1200 400 L0 400 Z" />
<path id="c-nearL" pathLength="1" d="M0 372 L70 336 L140 306 L200 262 L250 222 L270 216 L296 236 L340 268 L400 304 L470 334 L540 356 L620 376 L620 400 L0 400 Z" />
<path id="c-nearR" pathLength="1" d="M640 382 L720 350 L790 322 L850 300 L905 284 L950 296 L1000 276 L1050 290 L1110 308 L1160 322 L1200 330 L1200 400 L640 400 Z" />
<symbol id="c-pine" viewBox="0 0 20 52" overflow="visible"><path pathLength="1" d="M10 1 L13 11 L11.5 11 L15.5 21 L13 21 L17.5 32 L14 32 L19 44 L1 44 L6 32 L2.5 32 L7 21 L4.5 21 L8.5 11 L7 11 Z" fill="url(#c-dg)" strokeWidth=".9" strokeLinejoin="round" stroke="#2440a0" /><line pathLength="1" x1="10" y1="44" x2="10" y2="52" strokeWidth="1.2" stroke="#2440a0" /></symbol>
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
</g>
<g id="c-pNear">
<use href="#c-nearL" fill="#f6f3ec" strokeWidth="1.1" className="ink l2" />
<use href="#c-nearL" fill="url(#c-hzs)" className="nos hatch" />
<path d="M270 216 L296 236 L340 268 L400 304 L470 334 L540 356 L620 376 L620 400 L420 400 L380 352 L330 300 L292 252 Z" fill="url(#c-dgx)" className="nos hatch" />
<path d="M250 222 L236 244 L248 240 L240 262 M270 216 L262 240 L274 236 M296 236 L292 256" fill="none" strokeWidth=".8" className="hatch" />
<use href="#c-nearR" fill="#f6f3ec" strokeWidth="1.1" className="ink l3" />
<use href="#c-nearR" fill="url(#c-hzs)" className="nos hatch" />
<path d="M905 284 L950 296 L1000 276 L1050 290 L1110 308 L1160 322 L1200 330 L1200 400 L1010 400 L980 340 Z" fill="url(#c-dg)" className="nos hatch" />
</g>
<g id="c-pFront">
<path className="hatch" d="M0 402 Q180 392 360 398 T720 396 T1200 398 L1200 412 L0 412 Z" fill="url(#c-hz)" strokeWidth=".9" />
<g className="pines">
<use href="#c-pine" x="6" y="320" width="34" height="88" /><use href="#c-pine" x="34" y="340" width="26" height="68" /><use href="#c-pine" x="54" y="306" width="40" height="102" /><use href="#c-pine" x="90" y="346" width="24" height="62" /><use href="#c-pine" x="108" y="330" width="30" height="78" /><use href="#c-pine" x="134" y="352" width="22" height="56" /><use href="#c-pine" x="152" y="338" width="28" height="70" /><use href="#c-pine" x="178" y="358" width="20" height="50" /><use href="#c-pine" x="196" y="350" width="22" height="58" /><use href="#c-pine" x="218" y="364" width="18" height="44" /><use href="#c-pine" x="238" y="370" width="15" height="38" /><use href="#c-pine" x="256" y="374" width="13" height="34" /><use href="#c-pine" x="380" y="378" width="12" height="30" /><use href="#c-pine" x="394" y="372" width="14" height="36" /><use href="#c-pine" x="560" y="380" width="12" height="28" /><use href="#c-pine" x="574" y="376" width="14" height="32" /><use href="#c-pine" x="704" y="378" width="13" height="30" /><use href="#c-pine" x="790" y="374" width="15" height="34" /><use href="#c-pine" x="1000" y="360" width="20" height="50" /><use href="#c-pine" x="1020" y="342" width="28" height="68" /><use href="#c-pine" x="1046" y="356" width="22" height="54" /><use href="#c-pine" x="1066" y="322" width="36" height="88" /><use href="#c-pine" x="1098" y="344" width="26" height="66" /><use href="#c-pine" x="1122" y="310" width="40" height="100" /><use href="#c-pine" x="1158" y="336" width="30" height="74" />
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
</g>  </svg>;
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
