import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { loadGsap } from '../gsap';
import { useMotionMode } from '../motion-mode';
import { FAILED, PortalLayout, messy } from './PortalStill';

/* ii. the portal: a messy export becomes a clean payroll mapping. Each exported value travels from its crooked spot
   in the tray to its slot in the mapped table, straightens, grows to the table's size and resolves to its clean value
   as it lands. One department code has no match: it lands crooked and unresolved, and its row asks for a person.
   full: scrubbed by the scroll as the figure passes through the window (no pin), smoothed by a 0.6s scrub.
   lite: plays once when the figure comes into view. still: PortalLayout's finished table. */

export default function Portal() {
  const mode = useMotionMode();
  return mode === 'full' ? <Full key="full" /> : mode === 'lite' ? <Lite key="lite" /> : <PortalLayout mode="still" />;
}

type Cell = {
  chip: HTMLElement; raw: HTMLElement; clean?: HTMLElement; fly: HTMLElement; well: HTMLElement;
  /** Where it sits in the tray (px, deg) and where it lands, as an offset from its tray spot and a scale. */
  from: { x: number; y: number; r: number }; to: { x: number; y: number; r: number; s: number };
  /** When it leaves, from 0 to 1 over the run, column by column. */
  order: number; failed: boolean;
  /** Sitting in its slot: drawn at scale 1 with no scale pair, so the table's text is crisp. */
  landed: boolean;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (t: number) => Math.min(1, Math.max(0, t));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const pose = (c: Cell, e: number) =>
  `translate3d(${lerp(c.from.x, c.to.x, e)}px,${lerp(c.from.y, c.to.y, e)}px,0) rotate(${lerp(c.from.r, c.to.r, e)}deg) scale(${lerp(1, c.to.s, e)})`;

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
      chips.forEach((chip, k) => {
        const a = chip.parentElement!.getBoundingClientRect(), b = wells[k].parentElement!.getBoundingClientRect();
        if (!a.width || !b.width) return;
        const failed = Math.floor(k / cols) === FAILED && !chip.querySelector('.pt__clean');
        const s = failed ? 1 : b.height / a.height, m = messy(k);
        const clean = chip.querySelector<HTMLElement>('.pt__clean') ?? undefined;
        // The clean value is laid out at the slot's own size and font, then shrunk by the scale the cell grows by,
        // so it's exactly the table's text when the cell lands.
        if (clean) Object.assign(clean.style, { width: `${b.width}px`, height: `${b.height}px`, transform: `scale(${1 / s})` });
        cells.push({
          chip, raw: chip.querySelector('.pt__raw')!, clean, fly: chip.querySelector('.pt__fly')!, well: wells[k],
          from: m, to: { x: Math.round(b.left - a.left) + (failed ? nudge : 0), y: Math.round(b.top - a.top) + (failed ? 5 : 0), r: failed ? 2.4 : 0, s },
          order: (k % cols) * 100 + Math.floor(k / cols), failed, landed: false,
        });
      });
      // Column by column, top to bottom in each.
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
const LEAVE = 0.5, TRAVEL = 0.36, NOTE: [number, number] = [0.84, 0.98];

function paint(cells: Cell[], root: HTMLElement, p: number) {
  for (const c of cells) {
    const t = clamp((p - c.order * LEAVE) / TRAVEL);
    const landed = t === 1 && !!c.clean;
    c.chip.style.transform = landed ? `translate3d(${c.to.x}px,${c.to.y}px,0)` : pose(c, inOut(t));
    if (landed !== c.landed) { c.landed = landed; c.clean!.style.transform = landed ? 'none' : `scale(${1 / c.to.s})`; }
    // The stuck one stays a little lifted, a loose scrap on the table.
    c.fly.style.opacity = String(c.failed && t > 0.5 ? lerp(0.9, 0.35, (t - 0.5) * 2) : Math.sin(Math.PI * t) * 0.9);
    // The value resolves in the last part of the trip, as a crossfade, once it's nearly over its slot.
    const f = clamp((t - 0.7) / 0.27);
    c.well.style.opacity = String(1 - f);
    if (c.failed) continue;
    c.raw.style.opacity = String(1 - f);
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
          scrollTrigger: { trigger: stage.current, start: 'top 70%', end: 'center 38%', scrub: 0.6, toggleClass: { targets: stage.current!, className: 'pt--on' } },
          onUpdate: () => { clock.current.p = t.p; draw(); },
        });
      });
      revert = () => ctx.revert();
    });
    return () => { alive = false; revert(); };
  }, []);

  return <PortalLayout mode="full" stageRef={stage} />;
}

const STATEMENT = 'cubic-bezier(.16,1,.3,1)', OUT = 'cubic-bezier(.2,.7,.2,1)';

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
        const delay = i * 40, fade = { duration: 380, delay: delay + 480, easing: OUT, fill: 'both' as const };
        s.running.push(c.chip.animate([{ transform: pose(c, 0) }, { transform: pose(c, 1) }], { duration: 900, delay, easing: STATEMENT, fill: 'both' }));
        s.running.push(c.fly.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.35 }, { opacity: c.failed ? 0.35 : 0 }], { duration: 900, delay, fill: 'both' }));
        s.running.push(c.well.animate([{ opacity: 1 }, { opacity: 0 }], fade));
        if (c.failed) return;
        s.running.push(c.raw.animate([{ opacity: 1 }, { opacity: 0 }], fade));
        if (c.clean) s.running.push(c.clean.animate([{ opacity: 0 }, { opacity: 1 }], fade));
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
