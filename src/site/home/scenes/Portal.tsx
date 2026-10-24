import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { loadGsap } from '../gsap';
import { useMotionMode } from '../motion-mode';
import { FAILED, PortalLayout, messy } from './PortalStill';

/* ii. the portal: a messy export becomes a clean payroll mapping. Each exported value travels from its crooked spot
   in the tray to its slot in the mapped table on a gentle arc, straightens, takes the table's size and resolves to its
   clean value as it lands. They leave in a loose diagonal sweep, a few at a time, each bowing its own way, so they
   spread over the gap instead of queueing at the tray's edge. One department code has no match: it lands crooked and unresolved, and its row asks for a person.
   full: scrubbed by the scroll as the figure passes through the window (no pin), smoothed by a 0.6s scrub.
   lite: plays once when the figure comes into view. still: PortalLayout's finished table. */

export default function Portal() {
  const mode = useMotionMode();
  return mode === 'full' ? <Full key="full" /> : mode === 'lite' ? <Lite key="lite" /> : <PortalLayout mode="still" />;
}

type Cell = {
  chip: HTMLElement; raw: HTMLElement; clean?: HTMLElement; fly: HTMLElement; well: HTMLElement;
  /** Where it sits in the tray (px, deg) and where it lands, as an offset from its tray spot and a scale, in the
   *  tray's own (tilted) frame; c1 and c2 are the path's control points. */
  from: { x: number; y: number; r: number }; to: { x: number; y: number; r: number; s: number }; c1: Pt; c2: Pt;
  /** When it leaves, from 0 to 1 over the run. */
  order: number; failed: boolean;
  /** Sitting in its slot: drawn at scale 1 with no scale pair, so the table's text is crisp. */
  landed: boolean;
};

type Pt = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const clamp = (t: number) => Math.min(1, Math.max(0, t));
/** Eases in gently and out long, so a cell clears the tray quickly and settles slowly into its own slot. */
const ease = (t: number) => (1 - Math.cos(Math.PI * t ** 0.8)) / 2;
const bez = (a: number, b: number, c: number, d: number, e: number) => { const u = 1 - e; return u * u * u * a + 3 * u * u * e * b + 3 * u * e * e * c + e * e * e * d; };
/** Along the path at e: a cubic curve through c1 and c2, lifted a touch at the top of the arc. */
const pose = (c: Cell, e: number) => {
  const lift = Math.sin(Math.PI * e);
  return `translate3d(${bez(c.from.x, c.c1.x, c.c2.x, c.to.x, e)}px,${bez(c.from.y, c.c1.y, c.c2.y, c.to.y, e)}px,0) rotate(${lerp(c.from.r, c.to.r, e)}deg) scale(${lerp(1, c.to.s, e) * (1 + 0.04 * lift)})`;
};
const rest = (c: Cell) => `translate3d(${c.to.x}px,${c.to.y}px,0)${c.to.r ? ` rotate(${c.to.r}deg)` : ''}`;
/** A fixed 0..1 per cell, so the sweep and the bows are the same every visit. */
const hash = (k: number, s: number) => { const v = Math.sin(k * 91.17 + s * 47.43) * 24634.6345; return v - Math.floor(v); };

/** The cells' spots in the tray and their slots in the table, measured from layout (never on scroll): on mount, when
 *  anything resizes, and once the web fonts land. A column the phone hides is left out. */
function useCells(stage: RefObject<HTMLElement | null>, onMeasure: (cells: Cell[]) => void) {
  useLayoutEffect(() => {
    const el = stage.current!;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const chips = [...el.querySelectorAll<HTMLElement>('.pt__go')], wells = [...el.querySelectorAll<HTMLElement>('.pt__well')];
      const cols = el.querySelectorAll('.pt__xr--head .pt__xh').length;
      const cells: Cell[] = [], nudge = innerWidth < 760 ? 2 : 10;
      // The tray may sit tilted (wide screens). Measure it level, then turn each trip into the tray's frame: where a
      // cell's spot really is once turned, and the trip to its slot turned back by the tilt.
      const tray = el.querySelector<HTMLElement>('.pt__tray')!;
      const tilt = parseFloat(getComputedStyle(tray).getPropertyValue('--tilt')) || 0, th = (tilt * Math.PI) / 180;
      const cos = Math.cos(th), sin = Math.sin(th);
      const rot = (p: Pt): Pt => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos });
      const unrot = (p: Pt): Pt => ({ x: p.x * cos + p.y * sin, y: -p.x * sin + p.y * cos });
      // The words' block (side by side, the cells cross the page beside it): no cell's corner may enter it.
      let wr = -Infinity, wb = -Infinity;
      for (const w of el.parentElement!.querySelector('.pt__text')?.children ?? []) {
        const r = w.getBoundingClientRect();
        if (r.width) { wr = Math.max(wr, r.right + 16); wb = Math.max(wb, r.bottom + 16); }
      }
      tray.style.transform = 'none';
      const box = tray.getBoundingClientRect(), ox = box.left + box.width / 2, oy = box.top + box.height / 2;
      chips.forEach((chip, k) => {
        const a = chip.parentElement!.getBoundingClientRect(), b = wells[k].parentElement!.getBoundingClientRect();
        if (!a.width || !b.width) return;
        const failed = Math.floor(k / cols) === FAILED && !chip.querySelector('.pt__clean');
        const s = failed ? 1 : b.height / a.height, m = messy(k);
        const clean = chip.querySelector<HTMLElement>('.pt__clean') ?? undefined;
        // The clean value is laid out at the slot's own size and font, then shrunk by the scale the cell grows by,
        // so it's exactly the table's text when the cell lands.
        if (clean) Object.assign(clean.style, { width: `${b.width}px`, height: `${b.height}px`, transform: `scale(${1 / s})` });
        const ax = ox + (a.left - ox) * cos - (a.top - oy) * sin, ay = oy + (a.left - ox) * sin + (a.top - oy) * cos;
        const dx = b.left - ax + (failed ? nudge : 0), dy = b.top - ay + (failed ? 5 : 0);
        // Level, whole pixels keep the landed text crisp; tilted, exact values keep it on the table's grid.
        const px = (v: number) => (tilt ? v : Math.round(v));
        const to = { x: px(dx * cos + dy * sin), y: px(-dx * sin + dy * cos), r: (failed ? 2.4 : 0) - tilt, s };
        // The arc bows to one side or the other by 8 to 20% of the trip, alternating like a checkerboard so
        // neighbours part ways; the last column always bows inward, never out past the table's edge.
        const side = k % cols === cols - 1 ? 1 : ((Math.floor(k / cols) + k) % 2) * 2 - 1;
        const bow = side * (0.08 + 0.12 * hash(k, 1));
        const via = { x: (m.x + to.x) / 2 - (to.y - m.y) * bow, y: (m.y + to.y) / 2 + (to.x - m.x) * bow };
        // Plan the path on the page (a cell's top left corner, since it grows right and down from there). The bowed
        // arc is the first choice; if it would cut across the words, it bends towards falling first and turning
        // left only once it's below them, then falls a little deeper, until it's clear.
        const page = (p: Pt) => { const q = rot(p); return { x: ax + q.x, y: ay + q.y }; };
        const p0 = page(m), p3 = page(to), v = page(via);
        const clear = (c1: Pt, c2: Pt) => {
          for (let i = 1; i < 40; i++) {
            const e = i / 40;
            if (bez(p0.x, c1.x, c2.x, p3.x, e) < wr && bez(p0.y, c1.y, c2.y, p3.y, e) < wb) return false;
          }
          return true;
        };
        let c1 = mix(p0, v, 2 / 3), c2 = mix(p3, v, 2 / 3);
        if (!clear(c1, c2)) {
          const d1 = c1, d2 = c2;
          for (let j = 1; j <= 12; j++) {
            const turn = { x: Math.max(p0.x, wr), y: p3.y + Math.max(0, j - 4) * 14 };
            c1 = mix(d1, turn, Math.min(1, j / 4));
            c2 = mix(d2, { x: lerp(turn.x, p3.x, 0.25), y: turn.y }, Math.min(1, j / 4));
            if (clear(c1, c2)) break;
          }
        }
        const frame = (p: Pt) => unrot({ x: p.x - ax, y: p.y - ay });
        cells.push({
          chip, raw: chip.querySelector('.pt__raw')!, clean, fly: chip.querySelector('.pt__fly')!, well: wells[k],
          from: m, to, c1: frame(c1), c2: frame(c2),
          // A loose diagonal sweep from the tray's top left, shuffled a little.
          order: Math.floor(k / cols) + (k % cols) * 0.7 + hash(k, 2) * 1.6, failed, landed: false,
        });
      });
      tray.style.transform = '';
      const sorted = [...cells].sort((p, q) => p.order - q.order);
      sorted.forEach((c, i) => { c.order = i / Math.max(1, sorted.length - 1); });
      onMeasure(cells);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    void document.fonts?.ready.then(measure);
    return () => { alive = false; ro.disconnect(); };
  }, []);
}

/** The run's shape: the first cell leaves at 0, the last at LEAVE, each takes TRAVEL, and the stuck row's note
 *  arrives over the last stretch. */
const LEAVE = 0.54, TRAVEL = 0.3, NOTE: [number, number] = [0.84, 0.98];
/** Over each trip: the raw value fades out over this stretch, then the clean one fades in from CLEAN_IN to the end. */
const RAW_OUT: [number, number] = [0.6, 0.83], CLEAN_IN = 0.86;

function paint(cells: Cell[], root: HTMLElement, p: number) {
  for (const c of cells) {
    const t = clamp((p - c.order * LEAVE) / TRAVEL);
    const landed = t === 1 && !!c.clean;
    c.chip.style.transform = landed ? rest(c) : pose(c, ease(t));
    if (landed !== c.landed) { c.landed = landed; c.clean!.style.transform = landed ? 'none' : `scale(${1 / c.to.s})`; }
    // The stuck one stays a little lifted, a loose scrap on the table.
    c.fly.style.opacity = String(c.failed && t > 0.5 ? lerp(0.9, 0.35, (t - 0.5) * 2) : Math.sin(Math.PI * t) * 0.9);
    // The value resolves as it comes over its slot: the raw one is gone before the clean one shows, never both.
    const out = clamp((t - RAW_OUT[0]) / (RAW_OUT[1] - RAW_OUT[0])), f = clamp((t - CLEAN_IN) / (1 - CLEAN_IN));
    c.well.style.opacity = String(1 - (c.failed ? out : f));
    if (c.failed) continue;
    c.raw.style.opacity = String(1 - out);
    if (c.clean) c.clean.style.opacity = String(f);
  }
  const q = clamp((p - NOTE[0]) / (NOTE[1] - NOTE[0])), note = root.querySelector<HTMLElement>('.pt__note')!;
  note.style.opacity = String(q);
  note.style.transform = `translateY(${(1 - q) * 6}px)`;
  root.querySelector<HTMLElement>('.pt__rule')!.style.transform = `scaleY(${q})`;
}

function Full() {
  const stage = useRef<HTMLElement>(null);
  const clock = useRef({ p: 0, cells: [] as Cell[] });
  const draw = () => paint(clock.current.cells, stage.current!, clock.current.p);

  useCells(stage, cells => { clock.current.cells = cells; draw(); });

  useEffect(() => {
    let alive = true, revert = () => {};
    void loadGsap().then(({ gsap }) => {
      if (!alive) return;
      const ctx = gsap.context(() => {
        const t = { p: 0 };
        gsap.to(t, {
          p: 1, ease: 'none',
          scrollTrigger: { trigger: stage.current, start: () => (wide() ? 'top 40%' : 'top 70%'), end: () => (wide() ? 'bottom 75%' : 'center 38%'), scrub: 0.6, toggleClass: { targets: stage.current!, className: 'pt--on' } },
          onUpdate: () => { clock.current.p = t.p; draw(); },
        });
      });
      revert = () => ctx.revert();
    });
    return () => { alive = false; revert(); };
  }, []);

  return <PortalLayout mode="full" stageRef={stage} />;
}

/** Side by side (the words and the tray share a row), the run starts once the tray's in full view. Reread on
 *  every ScrollTrigger refresh. */
const wide = () => matchMedia('(min-width: 1100px)').matches;

const STATEMENT = 'cubic-bezier(.16,1,.3,1)';

/** Phones: when most of the figure is on screen the cells travel once, 900ms each, 40ms apart. */
function Lite() {
  const stage = useRef<HTMLElement>(null);
  const state = useRef({ cells: [] as Cell[], played: false, running: [] as Animation[] });

  useCells(stage, cells => {
    const s = state.current;
    s.cells = cells;
    // After the play (or a resize mid play), the cells simply sit in their slots.
    if (s.played) { s.running.forEach(a => a.cancel()); s.running = []; paint(cells, stage.current!, 1); }
  });

  useEffect(() => {
    const el = stage.current!, s = state.current;
    const io = new IntersectionObserver(entries => {
      if (s.played || !entries.some(e => e.isIntersecting)) return;
      s.played = true;
      io.disconnect();
      const by = [...s.cells].sort((a, b) => a.order - b.order);
      by.forEach((c, i) => {
        const delay = i * 40, trip = { duration: 900, delay, fill: 'both' as const };
        // The raw value is out by 60% of the time (the cell's mostly there by then) and the clean one in after 70%.
        const rawOut = [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }];
        const cleanIn = [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }];
        const path = Array.from({ length: 17 }, (_, j) => ({ transform: pose(c, j / 16) }));
        s.running.push(c.chip.animate(path, { ...trip, easing: STATEMENT }));
        s.running.push(c.fly.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.35 }, { opacity: c.failed ? 0.35 : 0 }], trip));
        s.running.push(c.well.animate(c.failed ? rawOut : cleanIn.map(k => ({ ...k, opacity: 1 - k.opacity })), trip));
        if (c.failed) return;
        s.running.push(c.raw.animate(rawOut, trip));
        if (c.clean) s.running.push(c.clean.animate(cleanIn, trip));
      });
      const after = { delay: by.length * 40 + 760, fill: 'both' as const, easing: STATEMENT };
      s.running.push(
        el.querySelector('.pt__note')!.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { ...after, duration: 480 }),
        el.querySelector('.pt__rule')!.animate([{ transform: 'scaleY(0)' }, { transform: 'none' }], { ...after, duration: 480 }),
      );
      const running = s.running;
      void Promise.all(running.map(a => a.finished)).then(() => {
        if (s.running !== running) return;
        paint(s.cells, el, 1);
        running.forEach(a => a.cancel());
        s.running = [];
      }, () => {});
    }, { threshold: 0.45 });
    io.observe(el);
    return () => { io.disconnect(); s.running.forEach(a => a.cancel()); };
  }, []);

  return <PortalLayout mode="lite" stageRef={stage} />;
}
