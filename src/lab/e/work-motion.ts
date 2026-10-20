import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { finePointer, narrow, reducedMotion } from '../content';
import type { EWorkId } from '../routes';
import type { BuildJob } from './build';
import { saveHandoff, snapshotOf, startCursor } from './chrome';
import { startDots, type Dots } from './dots';
import { fieldColor, makeGrid, type Formation, type Grid } from './field';
import { builder, fetchArt, fontsReady } from './motion';
import { hex, type Palette } from './palette';
import type { EWork } from './work';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* The motion on E's project pages. The same dots as E's home page, the same caps and the same way of starting:
   nothing moves until the picture's dots and the font are ready, then the project's object assembles out of a
   quiet field while its name comes up. Arriving from E, or from the project before, the dots are already the
   object and are picked up where they are, so nothing assembles twice.

   Three moments as you read: the object at the top, a little dust behind the words, and the next project's object
   at the foot, drawn where its own page will draw it, so following the link hands the dots over in place.

   Port's object is its ring, and holding it compresses the dots, the way the app's hold closes the phone. */

export type WorkMotion = {
  stop: () => void;
  leave: (id: EWorkId, href: string) => void;
  /** Port's hold: press, let go early, or press again once closed to open it. */
  hold: { press: () => void; release: () => void; close: () => void; open: () => void };
};

type Part = 'top' | 'body' | 'next';
const EXPO = 'expo.out', POWER = 'power4.out';

/** What the dots draw for a project: its ring, or its screen. */
const heroJob = (w: EWork): Pick<BuildJob, 'id' | 'src'> => ('ring' in w.hero ? { id: 'ring' } : { id: 'shot', src: w.hero.src });

export function startWorkE(root: HTMLElement, palette: Palette, work: EWork, next: EWork, o: { arriving: boolean; onHold: (phase: 'open' | 'holding' | 'closed') => void; onDrawn?: () => void }): WorkMotion {
  const still = reducedMotion(), fine = finePointer() && !still, phone = narrow();
  const q = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const off: (() => void)[] = [];
  const on = (t: Window | Element | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    off.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  const hj = heroJob(work);
  if (hj.src) void fetchArt(hj.src);
  let stopped = false, leaving = false, lenis: Lenis | null = null;
  const ctx = gsap.context(() => {}, root);

  // ---- the dots -------------------------------------------------------------------------------------------------
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dots]')!;
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight] as const;
  let grid: Grid = makeGrid(...size(), phone);
  const dots: Dots | null = typeof window.WebGLRenderingContext === 'function' ? startDots(canvas, grid, { still, phone, dark: hex(palette.object[0]), field: fieldColor(palette) }) : null;
  const flat = dots ? null : canvas.getContext('2d');
  if (!dots && !flat) canvas.style.display = 'none';
  const build = builder();
  off.push(() => build.stop());

  const job = (j: Pick<BuildJob, 'id' | 'src' | 'closed'>, plan = false): BuildJob => ({ ...j, w: grid.w, h: grid.h, phone, still, palette: palette.name, plan });
  const formations = new Map<string, Promise<Formation | null>>();
  /** A formation for the current grid by name, built once. */
  function formation(name: string, j: Pick<BuildJob, 'id' | 'src' | 'closed'>) {
    let p = formations.get(name);
    if (!p) {
      const g = grid;
      p = build.build(job(j)).then(b => (b && g === grid ? b.f : null));
      formations.set(name, p);
    }
    return p;
  }
  const PARTS: Record<Part, () => Promise<Formation | null>> = {
    top: () => formation('top', hj),
    body: () => formation('body', { id: 'work' }),
    next: () => formation('next', heroJob(next)),
  };

  function paintFlat(f: Formation) {
    if (!flat) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(grid.w * dpr); canvas.height = Math.round(grid.h * dpr);
    flat.setTransform(dpr, 0, 0, dpr, 0, 0);
    flat.clearRect(0, 0, grid.w, grid.h);
    const r = grid.cell * 0.43;
    for (let i = 0; i < grid.cells; i++) {
      if (!f.size[i]) continue;
      flat.fillStyle = `rgb(${f.col[i * 3] * 255} ${f.col[i * 3 + 1] * 255} ${f.col[i * 3 + 2] * 255})`;
      flat.beginPath(); flat.arc(f.pos[i * 2], f.pos[i * 2 + 1], r * f.size[i], 0, Math.PI * 2); flat.fill();
    }
  }
  const show = (f: Formation, morph?: Parameters<Dots['morph']>[1]) => {
    if (!dots) paintFlat(f);
    else if (still || !morph) dots.set(f);
    else dots.morph(f, morph);
  };

  let part: Part | null = null, wanted: Part = 'top', started = false, holding: 'open' | 'holding' | 'closed' = 'open';
  async function go(id: Part) {
    wanted = id;
    if (!started || leaving) return;
    const f = await PARTS[id]();
    if (stopped || leaving || wanted !== id || id === part || !f) return;
    part = id;
    root.dataset.part = id;
    if (id === 'top' && holding !== 'open') { holding = 'open'; o.onHold('open'); }
    show(f, { order: id === 'body' ? 'random' : 'center', dur: id === 'body' ? 1.1 : 1.2 });
  }

  let last = performance.now();
  const frame = () => {
    if (stopped) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !dots) return;
    dots.frame(now / 1000, dt);
  };
  gsap.ticker.add(frame);
  off.push(() => gsap.ticker.remove(frame));

  let resizeT = 0;
  on(window, 'resize', () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      const [w, h] = size();
      if (Math.abs(w - grid.w) < 2 && Math.abs(h - grid.h) < 2) return;
      grid = makeGrid(w, h, phone);
      formations.clear();
      const g = grid;
      void PARTS[part ?? 'top']().then(f => { if (stopped || g !== grid) return; if (dots) dots.reset(grid, f); else if (f) paintFlat(f); });
    }, 250);
  });
  off.push(() => window.clearTimeout(resizeT));

  // ---- smooth scrolling, the pointer -----------------------------------------------------------------------------
  const tick = (t: number) => lenis?.raf(t * 1000);
  if (!still) {
    lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(root);
  off.push(() => ro.disconnect());
  if (dots && !still) {
    on(window, 'pointermove', (e: PointerEvent) => { if (holding === 'open') dots.pointer(e.clientX, e.clientY); });
    on(document.documentElement, 'pointerleave', () => dots.leave());
    on(window, 'pointerup', (e: PointerEvent) => { if (e.pointerType !== 'mouse') dots.leave(); });
    on(window, 'pointercancel', () => dots.leave());
  }
  if (fine) startCursor(root, on);

  // ---- the start ---------------------------------------------------------------------------------------------
  const showDots = () => root.classList.add('has-dots');
  const ready = () => root.classList.add('is-ready');
  if (still) ready();
  const arriving = o.arriving && !!dots && !still;
  // Picked up from the page before: the dots go straight to the object, with no field and no fade, and the page
  // before (which the browser is still holding on screen) is let go once they're drawn.
  // The field also fills the dots' buffer, so there's always something valid to draw. Arriving, it stays hidden.
  if (dots && !still) dots.field();
  if (arriving) canvas.style.transition = 'none';
  else if (dots && !still) requestAnimationFrame(showDots);
  const g0 = grid;
  const first = build.build(job(hj, !arriving && !!dots && !still)).then(b => {
    if (!b || g0 !== grid) return null;
    formations.set('top', Promise.resolve(b.f));
    return b;
  });
  const letGo = () => (window as { __eReveal?: { skipTransition?: () => void } }).__eReveal?.skipTransition?.();
  off.push(() => { delete document.documentElement.dataset.eArriving; });

  Promise.all([fontsReady(arriving ? 600 : 1100), Promise.race([first, new Promise<null>(r => setTimeout(() => r(null), 2500))])]).then(([, b]) => {
    if (stopped) return;
    ScrollTrigger.refresh();
    let words: gsap.core.Timeline | undefined;
    ctx.add(() => {
      if (!still) { words = intro(); quiet(); }
      q('[data-part]').forEach(el => {
        const id = el.dataset.part as Part;
        ScrollTrigger.create({ trigger: el, start: id === 'top' ? 'top top' : 'top 58%', end: 'bottom 58%', onToggle: self => { if (self.isActive) void go(id); } });
      });
    });
    ready();
    if (b) {
      part = 'top';
      root.dataset.part = 'top';
      if (!dots) { paintFlat(b.f); showDots(); }
      else if (arriving || still || !b.plan) { dots.set(b.f); showDots(); }
      else dots.intro(b.f, b.plan, { dur: 1.3, onDone: later });
    }
    let ticks = 0;
    const begin = () => {
      if (++ticks < 2) return;
      gsap.ticker.remove(begin);
      performance.mark?.('lab-e:work-intro');
      if (arriving) { letGo(); canvas.style.transition = ''; }
      o.onDrawn?.();
      dots?.play();
      words?.play();
      started = true;
      if (!b || !dots || still || !b.plan) later();
      if (wanted !== part) void go(wanted);
    };
    gsap.ticker.add(begin);
    off.push(() => gsap.ticker.remove(begin));
  });
  // If anything above is slow, don't leave the visitor looking at the page before.
  const loose = window.setTimeout(() => { letGo(); o.onDrawn?.(); }, 1800);
  off.push(() => window.clearTimeout(loose));

  /** The other moments, one at a time, once the start is over. */
  function later() {
    window.setTimeout(() => { if (!stopped) void PARTS.body().then(() => !stopped && PARTS.next()); }, 300);
  }

  // The name comes up letter by letter out of its line, the way E's parts do, and the rest settles in under it.
  function intro() {
    const name = root.querySelector<HTMLElement>('[data-title]')!, head = root.querySelector('.e-head')!;
    const split = SplitText.create(name, { type: 'chars', mask: 'chars', aria: 'none' });
    return gsap.timeline({ paused: true, delay: 0.1 })
      .from(split.chars, { yPercent: 115, rotate: 8, duration: 1.1, stagger: 0.04, ease: POWER }, 0)
      .from('[data-lead]', { y: 18, opacity: 0, duration: 1, stagger: 0.08, ease: EXPO }, 0.35)
      .fromTo('[data-top-rule]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 0.2)
      .from(head, { opacity: 0, y: -12, duration: 1, ease: EXPO }, 0.5);
  }
  function quiet() {
    q('[data-rule]').forEach(el => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    q('[data-quiet]').forEach(el => gsap.from(el, { y: 22, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  }

  // ---- leaving for the next project: the words step back and the dots become its object, if they aren't already
  const main = root.querySelector('main'), head = root.querySelector('.e-head');
  function leave(id: EWorkId, href: string) {
    if (still || stopped || !dots) { location.href = href; return; }
    if (leaving) return;
    leaving = true;
    lenis?.stop();
    gsap.to([main, head], { autoAlpha: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    const g = grid, already = part === 'next' && !dots.busy;
    const late = window.setTimeout(() => { location.href = href; }, 2200);
    void PARTS.next().then(f => {
      if (!leaving) return;
      if (!f || g !== grid) { window.clearTimeout(late); location.href = href; return; }
      const away = () => { window.clearTimeout(late); if (!leaving) return; saveHandoff(id, g.w, g.h, snapshotOf(f, g.cells)); location.href = href; };
      if (already) window.setTimeout(away, 420);
      else dots.morph(f, { order: 'center', dur: 0.95, spread: 0.45, onDone: () => window.setTimeout(away, 300) });
    });
  }
  on(window, 'pageshow', (e: PageTransitionEvent) => {
    if (!e.persisted || !leaving) return;
    leaving = false;
    gsap.to([main, head], { autoAlpha: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    lenis?.start();
    const p = part;
    part = null;
    if (p) void go(p);
  });

  // ---- Port's hold ---------------------------------------------------------------------------------------------
  const timers: number[] = [];
  let audio: HTMLAudioElement | null = null;
  const clear = () => { timers.forEach(t => window.clearTimeout(t)); timers.length = 0; };
  off.push(clear);
  const ring = (closed: boolean) => formation(closed ? 'closed' : 'top', { id: 'ring', closed });
  const sound = () => root.dataset.sound !== 'off';
  const hold = {
    press() {
      if (holding === 'closed') { hold.open(); return; }
      if (holding !== 'open' || part !== 'top') return;
      holding = 'holding'; o.onHold('holding');
      dots?.leave();
      // The dots draw in over the second the hold takes, and it closes when they get there.
      void ring(true).then(f => { if (f && holding === 'holding') show(f, { order: 'center', dur: 0.85, spread: 0.15, focus: false }); });
      timers.push(window.setTimeout(() => { if (holding === 'holding') hold.close(); }, 1000));
    },
    release() {
      if (holding !== 'holding') return;
      clear();
      holding = 'open'; o.onHold('open');
      void ring(false).then(f => { if (f && holding === 'open') show(f, { order: 'center', dur: 0.6, spread: 0.2 }); });
    },
    close() {
      clear();
      const was = holding;
      holding = 'closed'; o.onHold('closed');
      if (was !== 'holding') void ring(true).then(f => { if (f) show(f, { order: 'center', dur: 0.85, spread: 0.15, focus: false }); });
      if (sound()) timers.push(window.setTimeout(() => {
        audio ??= new Audio('/projects/port/close.wav');
        audio.currentTime = 0;
        audio.play()?.catch(() => {});
      }, still ? 0 : 380));
    },
    open() {
      clear();
      holding = 'open'; o.onHold('open');
      void ring(false).then(f => { if (f) show(f, { order: 'center', dur: 0.8, spread: 0.3 }); });
    },
  };
  off.push(() => audio?.pause());

  return {
    leave,
    hold,
    stop() {
      stopped = true;
      off.forEach(fn => fn());
      gsap.ticker.remove(tick);
      lenis?.destroy();
      ctx.revert();
      dots?.stop();
      root.classList.remove('is-ready', 'has-cursor', 'has-dots');
    },
  };
}
