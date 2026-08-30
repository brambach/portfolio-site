import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { sprintProgress, stepHare, type HareState } from '../lib/hare-state';
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
  const raf = useRef(0);
  const lastDrawn = useRef(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom]);

  const placeHare = (len: number, movingForward: boolean, sprinting: boolean) => {
    const path = pathRef.current;
    const g = hareRef.current;
    if (!path || !g) return;
    const L = path.getTotalLength();
    const l = Math.min(Math.max(len, 1), L - 1);
    const pt = path.getPointAtLength(l);
    let ang = 0;
    if (sprinting) {
      const ahead = path.getPointAtLength(Math.min(l + 10, L));
      ang = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      ang = Math.max(-24, Math.min(24, ang));
      facing.current = movingForward ? 1 : -1;
    }
    const flip = facing.current === -1 ? -1 : 1;
    g.setAttribute(
      'transform',
      `translate(${pt.x}, ${pt.y}) rotate(${(ang * flip).toFixed(1)}) scale(${0.52 * flip}, 0.52) translate(-62, -50)`,
    );
    g.style.opacity = '1';
  };

  const tick = () => {
    const now = performance.now();
    const state = hare.current;
    if (state.kind !== 'sprinting') return;
    const f = sprintProgress(state, now);
    const from = wpLens.current[state.from] ?? 0;
    const to = wpLens.current[state.to] ?? 0;
    placeHare(from + (to - from) * f, to >= from, true);
    const next = stepHare(state, state.to, now);
    if (next.kind === 'sprinting') {
      raf.current = requestAnimationFrame(tick);
    } else {
      hare.current = next;
      setPose('sitting');
      if (next.kind === 'resting') placeHare(wpLens.current[next.at] ?? 0, true, false);
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
        placeHare(wpLens.current[next.at] ?? 0, true, false);
      }
    } else if (prev.kind !== 'sprinting') {
      setPose('running');
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
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
        <HareBody pose={pose} strokeWidth={3} />
      </g>
    </svg>
  );
}
