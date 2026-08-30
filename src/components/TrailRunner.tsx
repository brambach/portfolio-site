import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { sprintProgress, stepHare, type HareState } from '../lib/hare-state';
import { buildTrailPath, waypointThresholds } from '../lib/trail';
import { HareBody } from './HareMark';

const DOT_STEP = 16;

/** the hare pulls up just past each waypoint ring, not on top of it */
const REST_OFFSET = 24;

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
 * The trail spine and its runner. Dots draw with the reader's progress; the
 * hare rests at the last waypoint and sprints ahead in one burst when the
 * next threshold is crossed (dash-and-rest, never scrollbar-glued). Desktop
 * only; ink follows html[data-arc].
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

  const dotEls = useRef<SVGCircleElement[]>([]);
  const wpLens = useRef<number[]>([]);
  const hare = useRef<HareState>({ kind: 'hidden' });
  const facing = useRef<1 | -1>(1);
  const tilt = useRef(0);
  const raf = useRef(0);
  const lastDrawn = useRef(0);

  /** path length at a (possibly fractional) waypoint index */
  const lenAtIdx = (idx: number) => {
    const lens = wpLens.current;
    if (lens.length === 0) return 0;
    const lo = Math.max(0, Math.min(lens.length - 1, Math.floor(idx)));
    const hi = Math.max(0, Math.min(lens.length - 1, Math.ceil(idx)));
    return lens[lo] + (lens[hi] - lens[lo]) * (idx - lo);
  };

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
        return { doc: y, x: X_FRACTIONS[i % X_FRACTIONS.length] * w };
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
      lens.map((l) => {
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
    update(scrollYProgress.get());
    // after a re-measure, a resting hare must move to its waypoint's new spot
    if (hare.current.kind === 'resting')
      placeHare(lenAtIdx(hare.current.at) + REST_OFFSET, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom]);

  /**
   * The hare stays essentially level and faces its direction of travel;
   * the path's slope only tips it a little. Facing is fixed once per sprint
   * and the tilt is smoothed, so a near-vertical path can't make it flap.
   */
  const placeHare = (len: number, dirSign: 1 | -1, sprinting: boolean) => {
    const path = pathRef.current;
    const g = hareRef.current;
    if (!path || !g) return;
    const L = path.getTotalLength();
    const l = Math.min(Math.max(len, 1), L - 1);
    const pt = path.getPointAtLength(l);
    let target = 0;
    if (sprinting) {
      const ahead = path.getPointAtLength(Math.min(Math.max(l + 24 * dirSign, 0), L));
      const mdx = ahead.x - pt.x;
      const mdy = ahead.y - pt.y;
      // slope against a softened horizontal so vertical stretches read as a
      // downhill bound, not a nosedive
      target = (Math.atan2(mdy, Math.abs(mdx) + 34) * 180) / Math.PI;
      target = Math.max(-26, Math.min(26, target));
    }
    tilt.current += (target - tilt.current) * (sprinting ? 0.22 : 1);
    const flip = facing.current;
    g.setAttribute(
      'transform',
      `translate(${pt.x}, ${pt.y}) rotate(${(tilt.current * flip).toFixed(1)}) scale(${0.52 * flip}, 0.52) translate(-62, -50)`,
    );
    g.style.opacity = '1';
  };

  /** face where this sprint is headed; on a vertical hop keep the old facing */
  const setFacing = (fromIdx: number, toIdx: number) => {
    const netDx =
      (pathRef.current?.getPointAtLength(lenAtIdx(toIdx)).x ?? 0) -
      (pathRef.current?.getPointAtLength(lenAtIdx(fromIdx)).x ?? 0);
    if (Math.abs(netDx) > 8) facing.current = netDx >= 0 ? 1 : -1;
  };

  const tick = () => {
    const now = performance.now();
    const state = hare.current;
    if (state.kind !== 'sprinting') return;
    const f = sprintProgress(state, now);
    const from = lenAtIdx(state.from);
    const to = lenAtIdx(state.to);
    placeHare(from + (to - from) * f, to >= from ? 1 : -1, true);
    const next = stepHare(state, state.to, now);
    if (next.kind === 'sprinting') {
      raf.current = requestAnimationFrame(tick);
    } else {
      hare.current = next;
      setPose('sitting');
      if (next.kind === 'resting') placeHare(lenAtIdx(next.at) + REST_OFFSET, 1, false);
    }
  };

  const update = (t: number) => {
    const geo = geom;
    const path = pathRef.current;
    if (!geo || !path) return;
    const { thresholds } = geo;

    // dots draw between waypoints, tracking the reader
    const L = path.getTotalLength();
    let drawn = 0;
    if (t >= thresholds[0]) {
      let i = 0;
      while (i < thresholds.length - 1 && t >= thresholds[i + 1]) i++;
      if (i >= thresholds.length - 1) {
        drawn = L;
      } else {
        const f = (t - thresholds[i]) / Math.max(1e-6, thresholds[i + 1] - thresholds[i]);
        const a = wpLens.current[i] ?? 0;
        const b = wpLens.current[i + 1] ?? L;
        drawn = a + (b - a) * f + 30;
      }
    }
    const n = Math.min(dotEls.current.length, Math.floor(drawn / DOT_STEP));
    if (reduce) {
      dotEls.current.forEach((d) => d.setAttribute('opacity', '0.85'));
    } else if (n > lastDrawn.current) {
      for (let i = lastDrawn.current; i < n; i++) dotEls.current[i].setAttribute('opacity', '0.85');
      lastDrawn.current = n;
    } else if (n < lastDrawn.current) {
      for (let i = n; i < lastDrawn.current; i++) dotEls.current[i].setAttribute('opacity', '0');
      lastDrawn.current = n;
    }

    // waypoint stamps
    let target = -1;
    for (let i = 0; i < thresholds.length; i++) if (t >= thresholds[i]) target = i;
    stampsRef.current?.querySelectorAll('.wp').forEach((el, i) => {
      el.classList.toggle('stamped', reduce || i <= target);
    });

    // the hare
    if (reduce) {
      if (hareRef.current) hareRef.current.style.opacity = '0';
      return;
    }
    const now = performance.now();
    const prev = hare.current;
    const next = stepHare(prev, target, now);
    hare.current = next;
    if (next.kind === 'hidden') {
      if (hareRef.current) hareRef.current.style.opacity = '0';
      setPose('sitting');
    } else if (next.kind === 'resting') {
      if (prev.kind !== 'resting' || prev.at !== next.at) {
        setPose('sitting');
        placeHare(lenAtIdx(next.at) + REST_OFFSET, 1, false);
      }
    } else if (prev.kind !== 'sprinting' || prev.to !== next.to) {
      // a new sprint, or a retarget: fix the facing for this leg
      setFacing(next.from, next.to);
      if (prev.kind !== 'sprinting') {
        setPose('running');
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(tick);
      }
    }
  };

  useMotionValueEvent(scrollYProgress, 'change', update);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (!desktop || !geom) return null;

  return (
    <svg
      className="trail-ink pointer-events-none absolute left-0 top-0 z-0"
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
        <g className={pose === 'running' ? 'hare-gallop' : undefined}>
          <HareBody pose={pose} strokeWidth={3} />
        </g>
      </g>
    </svg>
  );
}
