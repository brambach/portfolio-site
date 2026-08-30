import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
  advancePhase,
  bobY,
  ignoreWhileSitting,
  pitchDeg,
  sitSpotClearOfRings,
  strideFrame,
} from '../lib/hare-gait';
import { pursue } from '../lib/hare-pursuit';
import { buildTrailPath, waypointThresholds } from '../lib/trail';
import { HareBody } from './HareMark';

const DOT_STEP = 16;

/** Lateral position of each waypoint across the main column, top to bottom:
 * trail head under the hero, left rail past work, out and back through dusk
 * and blue hour, then in to the flag at the end. */
const X_FRACTIONS = [0.5, 0.07, 0.16, 0.07, 0.42];

type Geometry = {
  w: number;
  h: number;
  d: string;
  thresholds: number[];
  /** index of each waypoint within the path's point list (vias in between) */
  wpIdx: number[];
};

/**
 * The trail and its runner, one system: the hare is the pen. It chases the
 * reader's position along the path with a lag and a speed cap (so it runs,
 * never teleports), lays the dotted trail down behind itself, stamps each
 * waypoint ring as it passes, and sits wherever you stop. Desktop only;
 * ink follows html[data-arc].
 */
export function TrailRunner() {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const [geom, setGeom] = useState<Geometry | null>(null);
  const [stampPts, setStampPts] = useState<{ x: number; y: number }[]>([]);
  const [pose, setPose] = useState<'running' | 'sitting'>('sitting');

  const pathRef = useRef<SVGPathElement>(null);
  const dotsRef = useRef<SVGGElement>(null);
  const stampsRef = useRef<SVGGElement>(null);
  const hareRef = useRef<SVGGElement>(null);
  const bobRef = useRef<SVGGElement>(null);
  const frameA = useRef<SVGGElement | null>(null);
  const frameB = useRef<SVGGElement | null>(null);

  const dotEls = useRef<SVGCircleElement[]>([]);
  const wpLens = useRef<number[]>([]);
  const lastDrawn = useRef(0);

  const hareLen = useRef(0);
  const targetLen = useRef(0);
  const placed = useRef(false);
  const loopOn = useRef(false);
  const lastTs = useRef(0);
  const settledSince = useRef(0);
  const poseRef = useRef<'running' | 'sitting'>('sitting');
  const facing = useRef<1 | -1>(1);
  const lastDir = useRef<1 | -1>(1);
  const dirAcc = useRef(0);
  const tilt = useRef(0);
  const raf = useRef(0);
  const spd = useRef(0);
  const phase = useRef(0);
  const lastFrame = useRef<'stretch' | 'gather' | null>(null);
  const readerLen = useRef(0);
  const restAt = useRef(0);

  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const on = () => setDesktop(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);

  // measure the chapters and lay the path through them
  useEffect(() => {
    if (!desktop) return;
    const measure = () => {
      const main = document.querySelector('main');
      if (!main) return;
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      const w = main.clientWidth;
      const sections = [...document.querySelectorAll<HTMLElement>('[data-waypoint]')].sort(
        (a, b) => Number(a.dataset.waypoint) - Number(b.dataset.waypoint),
      );
      if (sections.length < 2) return;

      const anchors = sections.map((el, i) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        let y = top + r.height * 0.42;
        if (i === 0) y = top + r.height - 16; // trail head at the torn paper edge
        const end = el.querySelector<HTMLElement>('[data-trail-end]');
        if (end) {
          const er = end.getBoundingClientRect();
          y = er.top + window.scrollY + er.height / 2;
        }
        // the head sits a fixed hand's width right of the centered
        // "follow the trail" line, where the hare waits at load
        const x = i === 0 ? w * 0.5 + 128 : X_FRACTIONS[i % X_FRACTIONS.length] * w;
        return { doc: y, x };
      });

      // path points: the waypoints, plus vias that hold the left rail through
      // the after-dark content so the final approach never crosses the text
      const pts: { x: number; y: number }[] = [];
      const wpIdx: number[] = [];
      anchors.forEach((a, i) => {
        const isLast = i === anchors.length - 1;
        if (isLast) {
          const ad = sections[i].getBoundingClientRect();
          const adTop = ad.top + window.scrollY - mainTop;
          pts.push({ x: 0.06 * w, y: adTop + ad.height * 0.18 });
          pts.push({ x: 0.06 * w, y: adTop + ad.height * 0.74 });
        }
        wpIdx.push(pts.length);
        pts.push({ x: a.x, y: a.doc - mainTop });
      });
      setGeom({
        w,
        h: main.scrollHeight,
        d: buildTrailPath(pts),
        wpIdx,
        thresholds: waypointThresholds(
          anchors.map((a) => a.doc),
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    const main = document.querySelector('main');
    if (main) ro.observe(main);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [desktop]);

  // build dots, waypoint lengths, and stamp positions once the path is real
  useEffect(() => {
    const path = pathRef.current;
    const dots = dotsRef.current;
    if (!geom || !path || !dots) return;

    const L = path.getTotalLength();

    // prefix lengths at every path point, then pick out the waypoints
    const probe = path.cloneNode() as SVGPathElement;
    const segments = geom.d.split(' C ');
    const lens: number[] = [0];
    let acc = segments[0];
    for (let i = 1; i < segments.length; i++) {
      acc += ' C ' + segments[i];
      probe.setAttribute('d', acc);
      lens.push(probe.getTotalLength());
    }
    wpLens.current = geom.wpIdx.map((i) => lens[i] ?? 0);
    setStampPts(
      wpLens.current.map((l) => {
        const pt = path.getPointAtLength(Math.min(l, L - 1));
        return { x: pt.x, y: pt.y };
      }),
    );

    dots.replaceChildren();
    dotEls.current = [];
    for (let l = 0; l <= L; l += DOT_STEP) {
      const pt = path.getPointAtLength(l);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(pt.x));
      c.setAttribute('cy', String(pt.y));
      c.setAttribute('r', '2.4');
      c.setAttribute('opacity', '0');
      dots.appendChild(c);
      dotEls.current.push(c);
    }
    lastDrawn.current = 0;
    // on re-measure (resize, images settling) the hare keeps its spot -
    // clamped to the new path - and visibly runs to wherever the reader
    // now maps. It relocates; it never teleports.
    if (placed.current) {
      hareLen.current = Math.min(hareLen.current, L);
      targetLen.current = Math.min(targetLen.current, L);
    }
    update(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom]);

  /** reader's position mapped to path length: lerp between waypoint lengths */
  const targetFor = (t: number): number => {
    const geo = geom;
    const path = pathRef.current;
    if (!geo || !path) return 0;
    const { thresholds } = geo;
    if (t < thresholds[0]) return 0;
    let i = 0;
    while (i < thresholds.length - 1 && t >= thresholds[i + 1]) i++;
    if (i >= thresholds.length - 1) return path.getTotalLength();
    const f = (t - thresholds[i]) / Math.max(1e-6, thresholds[i + 1] - thresholds[i]);
    const a = wpLens.current[i] ?? 0;
    const b = wpLens.current[i + 1] ?? path.getTotalLength();
    return a + (b - a) * f;
  };

  const drawDots = (upTo: number) => {
    const n = Math.min(dotEls.current.length, Math.max(0, Math.floor(upTo / DOT_STEP)));
    if (n > lastDrawn.current) {
      for (let i = lastDrawn.current; i < n; i++) dotEls.current[i].setAttribute('opacity', '0.85');
    } else if (n < lastDrawn.current) {
      for (let i = n; i < lastDrawn.current; i++) dotEls.current[i].setAttribute('opacity', '0');
    }
    lastDrawn.current = n;
  };

  /** stamped as the pen passes over, un-stamped only on a real retreat:
   * the gap keeps the sit-beside-the-ring sidestep from wiping a ring it
   * just stamped, and a ring the hare rests near but hasn't reached stays
   * unstamped - including the origin ring under the hare at load, which
   * appears only as it departs */
  const stamp = (upTo: number) => {
    const L = pathRef.current?.getTotalLength() ?? Infinity;
    stampsRef.current?.querySelectorAll('.wp').forEach((el, i) => {
      const w = wpLens.current[i] ?? Infinity;
      if (reduce || upTo >= Math.min(w + 6, L - 1)) el.classList.add('stamped');
      else if (upTo < w - 40) el.classList.remove('stamped');
    });
  };

  /**
   * The hare stays essentially level and faces its direction of travel;
   * the path's slope only tips it a little (smoothed), so a near-vertical
   * stretch can't make it flap. Its feet sit on the trail line.
   */
  const placeHare = (len: number, dirSign: 1 | -1, running: boolean, pitch = 0, moved = 0) => {
    const path = pathRef.current;
    const g = hareRef.current;
    if (!path || !g) return;
    const L = path.getTotalLength();
    const l = Math.min(Math.max(len, 1), L - 1);
    const pt = path.getPointAtLength(l);
    let target = 0;
    if (running) {
      const ahead = path.getPointAtLength(Math.min(Math.max(l + 24 * dirSign, 0), L));
      const mdx = ahead.x - pt.x;
      const mdy = ahead.y - pt.y;
      // the body faces where it's going ON SCREEN, not along the path's
      // parameter: the trail zigzags, so forward can mean leftward. Facing
      // flips only after committed horizontal travel; near-vertical
      // stretches (mdx ~ 0) keep the last facing.
      dirAcc.current = Math.max(-40, Math.min(40, dirAcc.current + Math.sign(mdx) * moved));
      if (dirAcc.current > 14) facing.current = 1;
      else if (dirAcc.current < -14) facing.current = -1;
      target = (Math.atan2(mdy, Math.abs(mdx) + 34) * 180) / Math.PI;
      target = Math.max(-26, Math.min(26, target));
    }
    tilt.current += (target - tilt.current) * (running ? 0.22 : 0.4);
    const flip = facing.current;
    g.setAttribute(
      'transform',
      `translate(${pt.x}, ${pt.y}) rotate(${((tilt.current + pitch) * flip).toFixed(1)}) scale(${0.52 * flip}, 0.52) translate(-62, -60)`,
    );
    g.style.opacity = '1';
  };

  const loop = (now: number) => {
    if (!loopOn.current) return;
    const dt = Math.min(48, Math.max(8, now - lastTs.current));
    lastTs.current = now;

    const prev = hareLen.current;
    const next = pursue(prev, targetLen.current, dt);
    hareLen.current = next;
    const delta = next - prev;

    // smoothed ground speed feeds the gait: cadence, bounce, and pitch
    spd.current += (Math.abs(delta) / dt - spd.current) * (1 - Math.exp(-dt / 70));

    if (delta > 0) lastDir.current = 1;
    else if (delta < 0) lastDir.current = -1;

    const speedy = Math.abs(delta) > 0.02 * dt;
    if (speedy) {
      settledSince.current = now;
      if (poseRef.current !== 'running') {
        poseRef.current = 'running';
        setPose('running');
        phase.current = 0; // every run starts at the launch of a bound
      }
    } else if (poseRef.current === 'running' && now - settledSince.current > 300) {
      // a polite hare sits beside the ring it stamped, never on it
      const clear = sitSpotClearOfRings(
        next,
        wpLens.current,
        lastDir.current,
        pathRef.current?.getTotalLength() ?? next,
      );
      if (clear !== null && Math.abs(clear - next) > 1) {
        targetLen.current = clear;
        settledSince.current = now;
      } else {
        poseRef.current = 'sitting';
        setPose('sitting');
        restAt.current = readerLen.current;
        spd.current = 0;
        lastFrame.current = null;
        bobRef.current?.removeAttribute('transform');
      }
    }

    let pitch = 0;
    if (poseRef.current === 'running') {
      phase.current = advancePhase(phase.current, spd.current, dt);
      const frame = strideFrame(phase.current);
      if (frame !== lastFrame.current && frameA.current && frameB.current) {
        frameA.current.style.visibility = frame === 'stretch' ? 'visible' : 'hidden';
        frameB.current.style.visibility = frame === 'gather' ? 'visible' : 'hidden';
        lastFrame.current = frame;
      }
      bobRef.current?.setAttribute(
        'transform',
        `translate(0, ${bobY(phase.current, spd.current).toFixed(2)})`,
      );
      pitch = pitchDeg(phase.current, spd.current);
    }

    placeHare(next, delta >= 0 ? 1 : -1, poseRef.current === 'running', pitch, Math.abs(delta));
    drawDots(next - 8);
    stamp(next);

    const arrived = Math.abs(targetLen.current - next) < 0.6;
    if (!arrived || poseRef.current === 'running') {
      raf.current = requestAnimationFrame(loop);
    } else {
      loopOn.current = false;
    }
  };

  const kick = () => {
    if (loopOn.current || reduce) return;
    loopOn.current = true;
    lastTs.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  };

  const update = (t: number) => {
    if (!geom || !pathRef.current) return;
    if (reduce) {
      dotEls.current.forEach((d) => d.setAttribute('opacity', '0.85'));
      stamp(Infinity);
      if (hareRef.current) hareRef.current.style.opacity = '0';
      return;
    }
    const tl = targetFor(t);
    // a resting hare doesn't chase every inch: it gets up only once the
    // reader has moved a real hop's worth from where it settled
    if (placed.current && poseRef.current === 'sitting' && ignoreWhileSitting(tl - restAt.current)) {
      readerLen.current = tl;
      return;
    }
    readerLen.current = tl;
    targetLen.current = tl;
    if (!placed.current) {
      // the first sit spot gets the same courtesy as a settle: never on a
      // stamped ring. The exception is the trail head at the very top -
      // its ring is still invisible, and the hare waiting exactly there,
      // beside the invitation, IS the composition.
      const clear =
        tl > 0.5
          ? sitSpotClearOfRings(tl, wpLens.current, lastDir.current, pathRef.current.getTotalLength())
          : null;
      if (clear !== null) targetLen.current = clear;
      // on a mid-page load, start close by and run in - not across the page
      hareLen.current = Math.max(0, targetLen.current - 500);
      restAt.current = tl;
      placed.current = true;
    }
    kick();
  };

  // the hare notices a cursor that comes close while it rests: one ear
  // flick hello. Tracked from pointer position because the trail svg sits
  // behind the content layers, where :hover can't reach.
  useEffect(() => {
    if (!desktop || reduce) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const g = hareRef.current;
        if (!g) return;
        const r = g.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        if (d < 52 && poseRef.current === 'sitting') g.classList.add('hare-hello');
        else if (d > 84 || poseRef.current !== 'sitting') g.classList.remove('hare-hello');
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [desktop, reduce]);

  // the run drawing remounts on pose changes; re-find its two frames
  useEffect(() => {
    frameA.current = hareRef.current?.querySelector<SVGGElement>('.hare-fA') ?? null;
    frameB.current = hareRef.current?.querySelector<SVGGElement>('.hare-fB') ?? null;
    lastFrame.current = null;
  }, [pose]);

  useMotionValueEvent(scrollYProgress, 'change', update);
  useEffect(
    () => () => {
      loopOn.current = false;
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  if (!desktop || !geom) return null;

  return (
    <svg
      className="trail-ink pointer-events-none absolute left-0 top-0 z-10"
      width="100%"
      height={geom.h}
      viewBox={`0 0 ${geom.w} ${geom.h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path ref={pathRef} d={geom.d} fill="none" stroke="none" />
      <g ref={dotsRef} className="trail-dots" />
      <g ref={stampsRef}>
        {stampPts.map((pt, i) => (
          <g key={i} className="wp" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            <circle cx={pt.x} cy={pt.y} r="7" strokeWidth="1.6" />
          </g>
        ))}
      </g>
      <g ref={hareRef} style={{ opacity: 0, transition: 'opacity 0.4s ease' }}>
        <g ref={bobRef}>
          <HareBody pose={pose} strokeWidth={3} />
        </g>
      </g>
    </svg>
  );
}
