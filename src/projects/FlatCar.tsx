import { motion, type MotionValue } from 'motion/react';
import './simple.css';

/* The flat green 911 shared by /work and the drive's arrival cover. */
export type CarProps = { pitch: MotionValue<number>; wheel: MotionValue<number>; blur: MotionValue<number>; exhaust: MotionValue<number>; lights: MotionValue<number>; revving: boolean };

// A flat side-on 911, facing right. Wheels turn with distance; the body rides on the springs.
// Paint, glass and rims come from CSS variables in simple.css, so it needs an .sp-page (or .sp-arrival) around it.
export function Car({ pitch, wheel, blur, exhaust, lights, revving }: CarProps) {
  return <div className={revving ? 'sp-car sp-car--rev' : 'sp-car'}>
    <motion.div className="sp-car__beam" style={{ opacity: lights }} />
    <motion.div className="sp-car__exhaust" style={{ opacity: exhaust }}><i /><i /><i /></motion.div>
    <svg viewBox="0 0 320 120" role="img">
      <defs>
        <linearGradient id="sp-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="sp-paint-hi" />
          <stop offset="0.55" className="sp-paint" />
          <stop offset="1" className="sp-paint-lo" />
        </linearGradient>
        <linearGradient id="sp-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="sp-glass-hi" />
          <stop offset="1" className="sp-glass" />
        </linearGradient>
        <radialGradient id="sp-shadow"><stop offset="0" className="sp-shadow" /><stop offset="1" className="sp-shadow" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="160" cy="108" rx="150" ry="8" fill="url(#sp-shadow)" />
      <motion.g className="sp-car__body" style={{ rotate: pitch, originX: '50%', originY: '90%' }}>
        <g className="sp-car__idle">
          <path fill="url(#sp-paint)" d="M24 90 C14 89 9 82 11 73 C13 64 22 57 36 51 C60 39 92 23 128 18 C150 15 170 16 184 22 C196 28 206 38 215 46 L238 50 C260 52 282 56 297 62 C306 66 310 74 308 82 C306 88 300 90 292 90 Z" />
          <path fill="url(#sp-paint)" d="M236 60 C244 44 276 42 292 58 Z" />
          <path className="sp-car__duck" fill="url(#sp-paint)" d="M34 52 L20 45 L44 42 Z" />
          <path className="sp-car__crease" fill="none" strokeWidth="2" strokeLinecap="round" d="M44 46 C70 32 100 21 130 19 C152 17 170 18 182 24" />
          <path className="sp-car__glass" fill="url(#sp-glass)" d="M98 44 C120 30 146 23 170 23 C184 23 194 30 203 42 L203 44 Z" />
          <path className="sp-car__pillar" strokeWidth="5" d="M160 23 L158 45" />
          <path className="sp-car__seam" fill="none" strokeWidth="1.2" d="M158 49 L156 82 M210 46 C214 60 214 74 210 84" />
          <rect className="sp-car__seam-fill" x="186" y="56" width="14" height="2.5" rx="1.25" />
          <path fill="url(#sp-paint)" d="M204 41 C206 36 214 34 217 38 L214 42 Z" />
          <ellipse className="sp-car__lamp" cx="278" cy="52" rx="7" ry="6" transform="rotate(-18 278 52)" />
          <circle className="sp-car__lamp-core" cx="279" cy="52" r="2.5" />
          <rect className="sp-car__tail" x="10" y="70" width="12" height="4" rx="2" />
          <rect className="sp-car__stripe" x="100" y="75" width="112" height="2" rx="1" />
          <circle className="sp-car__arch" cx="72" cy="90" r="25" />
          <circle className="sp-car__arch" cx="250" cy="90" r="25" />
        </g>
      </motion.g>
      <Wheel cx={72} rotate={wheel} blur={blur} />
      <Wheel cx={250} rotate={wheel} blur={blur} />
    </svg>
  </div>;
}

function Wheel({ cx, rotate, blur }: { cx: number; rotate: MotionValue<number>; blur: MotionValue<number> }) {
  return <g transform={`translate(${cx} 90)`}>
    <circle className="sp-tyre" r="20" />
    <motion.g style={{ rotate }}>
      <circle className="sp-rim" r="12.5" />
      {[0, 72, 144, 216, 288].map(a => <path key={a} className="sp-spoke" transform={`rotate(${a})`} d="M-3 -2 L-2 -11 L2 -11 L3 -2 Z" />)}
      <circle className="sp-hub" r="3" />
    </motion.g>
    {/* at speed the spokes smear into a disc */}
    <motion.circle className="sp-rim-blur" r="12.5" style={{ opacity: blur }} />
  </g>;
}
