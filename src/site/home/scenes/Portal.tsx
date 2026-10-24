import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { loadGsap } from '../gsap';
import { useMotionMode } from '../motion-mode';
import { FAILED, PortalLayout, messy } from './PortalStill';

/* ii. the portal: a messy export becomes a clean payroll mapping. Each exported value travels from its crooked spot
   in the tray to its slot in the mapped table on a gentle arc, straightens, takes the table's size and resolves to its
   clean value as it lands. The table fills from the bottom row up in a loose diagonal sweep, a few at a time, and
   each path is planned so it never crosses a value that's already landed (it drops into its slot from above, through
   rows still empty). The spot a cell leaves in the tray fades out behind it. One department code has no match: it
   lands crooked and unresolved, and its row asks for a person.
   full: scrubbed by the scroll as the figure passes through the window (no pin), smoothed by a 0.6s scrub.
   lite: plays once when the figure comes into view. still: PortalLayout's finished table. */

export default function Portal() {
  const mode = useMotionMode();
  return mode === 'full' ? <Full key="full" /> : mode === 'lite' ? <Lite key="lite" /> : <PortalLayout mode="still" />;
}

type Cell = {
  chip: HTMLElement; raw: HTMLElement; clean?: HTMLElement; fly: HTMLElement; well: HTMLElement; ghost?: HTMLElement;
  /** Where it sits in the tray (px, deg) and where it lands, as an offset from its tray spot and a scale, in the
   *  tray's own (tilted) frame; c1 and c2 are the path's control points. */
  from: { x: number; y: number; r: number }; to: { x: number; y: number; r: number; s: number }; c1: Pt; c2: Pt;
  /** When it leaves, from 0 to 1 over the run. */
  order: number; failed: boolean;
  /** Sitting in its slot: drawn at scale 1 with no scale pair, so the table's text is crisp. */
  landed: boolean;
};
/** The stuck row's note and its rule, found once with the cells so a scroll tick never searches the page. */
type Parts = { cells: Cell[]; note: HTMLElement | null; rule: HTMLElement | null };

type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const clamp = (t: number) => Math.min(1, Math.max(0, t));
/** Eases in gently and out long, so a cell clears the tray quickly and settles slowly into its own slot. */
const ease = (t: number) => (1 - Math.cos(Math.PI * t ** 0.8)) / 2;
const bez = (a: number, b: number, c: number, d: number, e: number) => { const u = 1 - e; return u * u * u * a + 3 * u * u * e * b + 3 * u * e * e * c + e * e * e * d; };
/** How much a cell grows at e: from the tray's size to the slot's, lifted a touch at the top of the arc. */
const grow = (s: number, e: number) => lerp(1, s, e) * (1 + 0.04 * Math.sin(Math.PI * e));
/** Along the path at e: a cubic curve through c1 and c2. */
const pose = (c: Cell, e: number) =>
  `translate3d(${bez(c.from.x, c.c1.x, c.c2.x, c.to.x, e)}px,${bez(c.from.y, c.c1.y, c.c2.y, c.to.y, e)}px,0) rotate(${lerp(c.from.r, c.to.r, e)}deg) scale(${grow(c.to.s, e)})`;
const rest = (c: Cell) => `translate3d(${c.to.x}px,${c.to.y}px,0)${c.to.r ? ` rotate(${c.to.r}deg)` : ''}`;
/** A fixed 0..1 per cell, so the sweep and the bows are the same every visit. */
const hash = (k: number, s: number) => { const v = Math.sin(k * 91.17 + s * 47.43) * 24634.6345; return v - Math.floor(v); };
/** Room kept around a cell when checking a path, for the few degrees a cell turns. */
const PAD = 4;
const hits = (a: Box, b: Box) => a.x < b.x + b.w + PAD && b.x < a.x + a.w + PAD && a.y < b.y + b.h + PAD && b.y < a.y + a.h + PAD;

/** The cells' spots in the tray and their slots in the table, measured from layout (never on scroll): on mount, when
 *  anything resizes, and once the web fonts land. A column the phone hides is left out. */
function useCells(stage: RefObject<HTMLElement | null>, onMeasure: (parts: Parts) => void) {
  useLayoutEffect(() => {
    const el = stage.current!;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const chips = [...el.querySelectorAll<HTMLElement>('.pt__go')], wells = [...el.querySelectorAll<HTMLElement>('.pt__well')];
      const cols = el.querySelectorAll('.pt__xr--head .pt__xh').length, rows = Math.ceil(chips.length / cols);
      const nudge = innerWidth < 760 ? 2 : 10;
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
      const trips = chips.flatMap((chip, k) => {
        const a = chip.parentElement!.getBoundingClientRect(), b = wells[k].parentElement!.getBoundingClientRect();
        if (!a.width || !b.width) return [];
        const row = Math.floor(k / cols), col = k % cols;
        const failed = row === FAILED && !chip.querySelector('.pt__clean');
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
        // The table fills from the bottom row up, each row from the right, shuffled a little: a loose diagonal sweep.
        const order = (rows - 1 - row) + (cols - 1 - col) * 0.16 + hash(k, 2) * 0.3;
        // Its size as it flies: the tray's cell, or the clean value (the slot's size) once that shows.
        const size = { w: Math.max(a.width, b.width / s), h: Math.max(a.height, b.height / s) };
        // Once landed: the slot, or the stuck value sitting crooked in it.
        const lands: Box = failed ? { x: b.left + nudge, y: b.top + 5, w: a.width, h: a.height } : { x: b.left, y: b.top, w: b.width, h: b.height };
        return [{ k, chip, clean, well: wells[k], failed, s, m, to, ax, ay, order, size, lands, col }];
      });
      tray.style.transform = '';
      trips.sort((p, q) => p.order - q.order);
      // Plan the paths in the order they land, each on the page (a cell's top left corner, since it grows right and
      // down from there), keeping clear of the words and of every slot filled before it.
      const filled: Box[] = [];
      const cells = trips.map((t, i): Cell => {
        const { m, to, ax, ay, s, size } = t;
        const page = (p: Pt) => { const q = rot(p); return { x: ax + q.x, y: ay + q.y }; };
        const p0 = page(m), p3 = page(to);
        const clear = (c1: Pt, c2: Pt) => {
          for (let j = 1; j < 48; j++) {
            const e = j / 48, x = bez(p0.x, c1.x, c2.x, p3.x, e), y = bez(p0.y, c1.y, c2.y, p3.y, e);
            if (x < wr && y < wb) return false;
            const g = grow(s, e), at = { x, y, w: size.w * g, h: size.h * g };
            if (filled.some(f => hits(at, f))) return false;
          }
          return true;
        };
        // The bowed arc is the first choice: it bows to one side or the other by 8 to 20% of the trip, alternating
        // like a checkerboard so neighbours part ways; the last column always bows inward. Failing that, it
        // drops in from above its slot, through rows still empty, crossing over sooner or later and from higher
        // or lower, until it finds a clear way.
        const side = t.col === cols - 1 ? 1 : ((Math.floor(t.k / cols) + t.k) % 2) * 2 - 1;
        const bow = side * (0.08 + 0.12 * hash(t.k, 1));
        const arc = (bw: number): [Pt, Pt] => {
          const v = { x: (p0.x + p3.x) / 2 - (p3.y - p0.y) * bw, y: (p0.y + p3.y) / 2 + (p3.x - p0.x) * bw };
          return [mix(p0, v, 2 / 3), mix(p3, v, 2 / 3)];
        };
        const tries: [Pt, Pt][] = [arc(bow), arc(-bow)];
        for (const k of [56, 110, 180]) for (const over of [0.85, 0.5, 0.15, 0]) {
          tries.push([{ x: lerp(p0.x, p3.x, over), y: lerp(p0.y, p3.y - k, 0.35) }, { x: p3.x, y: p3.y - k }]);
        }
        const [c1, c2] = tries.find(([a, b]) => clear(a, b)) ?? tries[tries.length - 1];
        filled.push(t.lands);
        const frame = (p: Pt) => unrot({ x: p.x - ax, y: p.y - ay });
        const chip = t.chip;
        return {
          chip, raw: chip.querySelector('.pt__raw')!, clean: t.clean, fly: chip.querySelector('.pt__fly')!, well: t.well,
          ghost: chip.previousElementSibling as HTMLElement | undefined,
          from: m, to, c1: frame(c1), c2: frame(c2), order: i / Math.max(1, trips.length - 1), failed: t.failed, landed: false,
        };
      });
      onMeasure({ cells, note: el.querySelector('.pt__note'), rule: el.querySelector('.pt__rule') });
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
/** Over each trip: the raw value fades out over this stretch, then the clean one fades in from CLEAN_IN to the end.
 *  The spot it left in the tray is gone by GHOST_OUT. */
const RAW_OUT: [number, number] = [0.6, 0.83], CLEAN_IN = 0.86, GHOST_OUT = 0.25;

function paint({ cells, note, rule }: Parts, p: number) {
  for (const c of cells) {
    const t = clamp((p - c.order * LEAVE) / TRAVEL);
    if (c.ghost) c.ghost.style.opacity = String(1 - clamp(t / GHOST_OUT));
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
  const q = clamp((p - NOTE[0]) / (NOTE[1] - NOTE[0]));
  if (note) {
    note.style.opacity = String(q);
    note.style.transform = `translateY(${(1 - q) * 6}px)`;
  }
  if (rule) rule.style.transform = `scaleY(${q})`;
}

function Full() {
  const stage = useRef<HTMLElement>(null);
  const clock = useRef({ p: 0, parts: { cells: [], note: null, rule: null } as Parts, alive: false });
  // ScrollTrigger can call in while the scene is being torn down (a resize or motion change swaps it out).
  const draw = () => { const c = clock.current; if (c.alive) paint(c.parts, c.p); };

  useLayoutEffect(() => {
    const c = clock.current;
    c.alive = true;
    return () => { c.alive = false; };
  }, []);

  useCells(stage, parts => { clock.current.parts = parts; draw(); });

  useEffect(() => {
    let alive = true, revert = () => {};
    void loadGsap().then(({ gsap }) => {
      if (!alive) return;
      const ctx = gsap.context(() => {
        const t = { p: 0 };
        gsap.to(t, {
          p: 1, ease: 'none',
          scrollTrigger: { trigger: stage.current, start: () => (wide() ? 'top 40%' : 'top 70%'), end: () => (wide() ? 'bottom 75%' : 'center 38%'), scrub: 0.6, toggleClass: { targets: stage.current!, className: 'pt--on' } },
          onUpdate: () => { if (!alive) return; clock.current.p = t.p; draw(); },
        });
      });
      revert = () => ctx.revert();
    }, () => {
      // No GSAP, no scrub: the cells sit in their slots (and stay there through any remeasure).
      if (!alive) return;
      clock.current.p = 1;
      draw();
    });
    return () => { alive = false; revert(); };
  }, []);

  return <PortalLayout mode="full" stageRef={stage} />;
}

/** Side by side (the words and the tray share a row), the run starts once the tray's in full view. Reread on
 *  every ScrollTrigger refresh. */
const wide = () => matchMedia('(min-width: 1100px)').matches;

const STATEMENT = 'cubic-bezier(.16,1,.3,1)';

/** Phones: when the figure's top is in the upper 60% of the screen (short and landscape screens too) the cells travel once, 900ms each, 40ms apart. */
function Lite() {
  const stage = useRef<HTMLElement>(null);
  const state = useRef({ parts: { cells: [], note: null, rule: null } as Parts, played: false, running: [] as Animation[] });

  useCells(stage, parts => {
    const s = state.current;
    s.parts = parts;
    // After the play (or a resize mid play), the cells simply sit in their slots.
    if (s.played) { s.running.forEach(a => a.cancel()); s.running = []; paint(parts, 1); }
  });

  useEffect(() => {
    const el = stage.current, s = state.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (s.played || !entries.some(e => e.isIntersecting)) return;
      s.played = true;
      io.disconnect();
      const { cells, note, rule } = s.parts, by = [...cells].sort((a, b) => a.order - b.order);
      by.forEach((c, i) => {
        const delay = i * 40, trip = { duration: 900, delay, fill: 'both' as const };
        // The raw value is out by 60% of the time (the cell's mostly there by then) and the clean one in after 70%.
        const rawOut = [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }];
        const cleanIn = [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }];
        const path = Array.from({ length: 17 }, (_, j) => ({ transform: pose(c, j / 16) }));
        s.running.push(c.chip.animate(path, { ...trip, easing: STATEMENT }));
        if (c.ghost) s.running.push(c.ghost.animate([{ opacity: 1 }, { opacity: 0, offset: GHOST_OUT }, { opacity: 0 }], trip));
        s.running.push(c.fly.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.35 }, { opacity: c.failed ? 0.35 : 0 }], trip));
        s.running.push(c.well.animate(c.failed ? rawOut : cleanIn.map(k => ({ ...k, opacity: 1 - k.opacity })), trip));
        if (c.failed) return;
        s.running.push(c.raw.animate(rawOut, trip));
        if (c.clean) s.running.push(c.clean.animate(cleanIn, trip));
      });
      const after = { delay: by.length * 40 + 760, fill: 'both' as const, easing: STATEMENT };
      if (note) s.running.push(note.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { ...after, duration: 480 }));
      if (rule) s.running.push(rule.animate([{ transform: 'scaleY(0)' }, { transform: 'none' }], { ...after, duration: 480 }));
      const running = s.running;
      void Promise.all(running.map(a => a.finished)).then(() => {
        if (s.running !== running) return;
        paint(s.parts, 1);
        running.forEach(a => a.cancel());
        s.running = [];
      }, () => {});
    }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });
    io.observe(el);
    return () => { io.disconnect(); s.running.forEach(a => a.cancel()); };
  }, []);

  return <PortalLayout mode="lite" stageRef={stage} />;
}
