import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { finePointer, narrow, reducedMotion, WORK } from './content';
import { pageWorkById } from './work';
import type { WorkId } from './routes';
import { startDots, type Dots } from './dots';
import { buildScene, srcOf, type Built, type BuildJob } from './build';
import { saveHandoff, saveReturn, snapshotOf, startCursor } from './chrome';
import { FIELD_SIZE, fieldColor, makeGrid, sampleType, withType, type Formation, type Grid } from './field';
import { hex, type Palette } from './palette';
import { peekPainter, portPicture } from './pixels';
import { ART, bandShown, layoutFor, SCENE_ORDER, sideways, type SceneId } from './scenes';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* All of the home page's movement, in one gsap.context so leaving the page reverts every split, tween and trigger at
   once, and every listener added here comes off with it.

   Each part of the page has one moment, and it's the dots: when a part reaches the middle of the screen, the dots
   leave the last object and fly to their places in the next one, arrive a little loose and snap sharp. That's a
   trigger, not a scrub, so the scene always finishes the move it started, whatever the scroll does next.
   Everything else is quiet. Blocks rise a few pixels and fade in once, and the type moves the way B's does.

   With reduced motion nothing splits or flies. Each part's picture is drawn as still dots when you reach it. */

export type EMotion = { stop: () => void; leave: (id: WorkId, href: string) => void };

const EXPO = 'expo.out', POWER = 'power4.out';

/** Everything to read on the home page past the hero: every block of every part but its screen-reader text. A phone's
 *  dots fade by these (startHome), so a label or hint added to a part is counted without being listed. */
export const READING = '[data-scene]:not([data-scene="hero"]) > :not(.e-sr)';

/** Sentient comes from Fontshare with its stylesheet loading late, so wait (briefly) for it before splitting, or
 *  the lines would be measured in Georgia. */
export async function fontsReady(limit = 1100) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const until = performance.now() + limit;
  const declared = () => [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Sentient');
  while (!declared() && performance.now() < until) await new Promise(r => setTimeout(r, 40));
  await Promise.race([
    Promise.all([document.fonts.load('400 100px Sentient'), document.fonts.load('italic 400 100px Sentient')]).catch(() => {}),
    new Promise(r => setTimeout(r, Math.max(0, until - performance.now()))),
  ]);
}

const offThread = typeof window !== 'undefined' && typeof Worker === 'function' && typeof OffscreenCanvas === 'function' && typeof createImageBitmap === 'function';
const early = new Map<string, Promise<Blob | null>>();
export const fetchArt = (src: string) => {
  let p = early.get(src);
  if (!p) { p = fetch(src).then(r => (r.ok ? r.blob() : null)).catch(() => null); early.set(src, p); }
  return p;
};

/** Turns pictures into dots: in a worker where there is one, so it never takes frames from the dots, and on the main
 *  thread otherwise. */
export function builder() {
  let worker: Worker | null = null, key = 0;
  const waiting = new Map<number, (b: Built | null) => void>();
  if (offThread) {
    try {
      worker = new Worker(new URL('./build.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ key: number; built?: Built; error?: string }>) => { waiting.get(e.data.key)?.(e.data.built ?? null); waiting.delete(e.data.key); };
      worker.onerror = () => { worker?.terminate(); worker = null; waiting.forEach(done => done(null)); waiting.clear(); };
    } catch { worker = null; }
  }
  async function onMain(job: BuildJob): Promise<Built | null> {
    let img: HTMLImageElement | null = null;
    const src = srcOf(job);
    if (src) {
      // An image that isn't in the page is as wide as its file, which is what the builder reads.
      img = await new Promise<HTMLImageElement | null>(done => {
        const el = new Image();
        el.onload = () => done(el); el.onerror = () => done(null);
        el.src = src;
      });
      if (!img) return null;
      await img.decode().catch(() => {});
    }
    const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c.getContext('2d', { willReadFrequently: true }); };
    return buildScene(job, img, canvas);
  }
  return {
    async build(job: BuildJob): Promise<Built | null> {
      if (worker) {
        const src = srcOf(job), blob = src ? (await fetchArt(src)) ?? undefined : undefined;
        const got = await new Promise<Built | null>(done => { const k = ++key; waiting.set(k, done); worker!.postMessage({ ...job, key: k, blob }); });
        if (got) return got;
      }
      return onMain(job);
    },
    stop() { worker?.terminate(); worker = null; waiting.forEach(done => done(null)); waiting.clear(); },
  };
}

export function startHome(root: HTMLElement, palette: Palette): EMotion {
  const still = reducedMotion(), fine = finePointer() && !still, phone = narrow();
  const q = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const off: (() => void)[] = [];
  const on = (t: Window | Element | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    off.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  // The picture the page opens on starts coming first.
  if (offThread) void fetchArt(ART.hero.src);
  let stopped = false, leaving = false;
  const ctx = gsap.context(() => {}, root);

  // ---- the dots -------------------------------------------------------------------------------------------------
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dots]')!;
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight] as const;
  let grid: Grid = makeGrid(...size(), phone);
  const dots: Dots | null = typeof window.WebGLRenderingContext === 'function' ? startDots(canvas, grid, { still, phone, dark: hex(palette.object[0]), field: fieldColor(palette) }) : null;
  // Without WebGL the pictures are still drawn as dots, just once each and without moving.
  const flat = dots ? null : canvas.getContext('2d');
  if (!dots && !flat) canvas.style.display = 'none';

  // Each part's dots for the current grid, built once, off the main thread where the browser allows.
  const build = builder();
  off.push(() => build.stop());
  const job = (id: SceneId, plan = false): BuildJob => ({ id, w: grid.w, h: grid.h, phone, still, palette: palette.name, plan });
  const formations = new Map<SceneId, Formation>();
  let pending = new Map<SceneId, Promise<Formation | null>>();
  function formationFor(id: SceneId): Promise<Formation | null> {
    let p = pending.get(id);
    if (!p) {
      const g = grid;
      p = build.build(job(id)).then(b => { if (!b || g !== grid) return null; formations.set(id, b.f); return b.f; });
      pending.set(id, p);
    }
    return p;
  }

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

  // ---- the tagline as dots ---------------------------------------------------------------------------------------
  const tag = root.querySelector<HTMLElement>('[data-tag]')!;
  const tagLines = q('[data-line]');
  let tagShown = true, tagTop = 0, followTag = false;
  const ink = hex(palette.ink), accent = hex(palette.accent);
  /** Draws the tagline as it sits on screen right now (each letter where it is, the pen line and the beam) and
   *  samples it into points for the type dots. */
  function tagGlyphs() {
    const box = tag.getBoundingClientRect(), padding = 40;
    const w = Math.ceil(box.width + padding * 2), h = Math.ceil(box.height + padding * 2), left = box.left - padding, top = box.top - padding;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true });
    if (!cx) return [];
    cx.fillStyle = palette.ink;
    for (const ch of q('[data-tag] .e-ch')) {
      const r = ch.getBoundingClientRect(), cs = getComputedStyle(ch), text = ch.textContent ?? '';
      if (!text.trim() || !r.width) continue;
      cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = cx.measureText(text), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      cx.fillText(text, r.left - left, r.top - top + (r.height - (asc + desc)) / 2 + asc);
    }
    const beam = tag.querySelector('.e-tag__beam')?.getBoundingClientRect();
    if (beam) cx.fillRect(beam.left - left, beam.top - top, beam.width, Math.max(2, beam.height));
    const svg = tag.querySelector('svg')?.getBoundingClientRect(), d = tag.querySelector('path')?.getAttribute('d');
    if (svg && d) {
      cx.save();
      cx.translate(svg.left - left, svg.top - top);
      cx.scale(svg.width / 300, svg.height / 24);
      cx.strokeStyle = palette.accent; cx.lineWidth = 3.2; cx.lineCap = 'round';
      cx.stroke(new Path2D(d));
      cx.restore();
    }
    const px = cx.getImageData(0, 0, w, h).data;
    tagTop = box.top;
    return sampleType(
      (x, y) => px[(y * w + x) * 4 + 3] / 255,
      (x, y) => { const o = (y * w + x) * 4; return px[o] > px[o + 2] + 40 ? accent : ink; },
      w, h, left, top, grid.typeGap, grid.typeSlots,
    );
  }
  const showTag = (v: boolean, fade = 0) => {
    tagShown = v;
    gsap.to(tagLines, { opacity: v ? 1 : 0, duration: fade, ease: 'power2.out', overwrite: 'auto' });
  };

  // ---- which scene is up -----------------------------------------------------------------------------------------
  const captionEl = root.querySelector<HTMLElement>('[data-caption]')!;
  function swap(host: HTMLElement, text: string, dir: number) {
    const old = [...host.children] as HTMLElement[];
    const next = document.createElement('span');
    next.textContent = text;
    host.appendChild(next);
    if (still) { old.forEach(el => el.remove()); return; }
    ctx.add(() => {
      gsap.fromTo(next, { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: EXPO });
      gsap.to(old, { yPercent: -110 * dir, opacity: 0, duration: 0.8, ease: EXPO, onComplete: () => old.forEach(el => el.remove()) });
    });
  }

  let scene: SceneId | null = null, wanted: SceneId = 'hero', started = false, splitDone = false;
  /** Move the dots to a part's picture. Until the intro has started, this only notes where the page is. */
  async function go(id: SceneId) {
    wanted = id;
    if (!started || leaving) return;
    const f = await formationFor(id);
    if (stopped || leaving || wanted !== id || id === scene || !f) return;
    const from = scene;
    scene = id;
    const at = SCENE_ORDER.indexOf(id), was = from ? SCENE_ORDER.indexOf(from) : 0;
    const caption = id === 'work' ? '' : ART[id].caption;
    swap(captionEl, caption, at >= was ? 1 : -1);
    if (!dots) { paintFlat(f); return; }
    if (still) { dots.set(f); return; }
    // Leaving the tagline: the letters become dots where they stand, and they go first.
    if (from === 'hero' && tagShown && splitDone && tagInView()) {
      const typed = withType(grid, formations.get('hero')!, tagGlyphs(), palette);
      dots.adopt(typed);
      showTag(false);
      followTag = false;
      dots.morph(f, { typeFirst: true });
      return;
    }
    // Coming back to it: the dots spell it out again, then the type takes over.
    if (id === 'hero' && !tagShown) {
      const typed = withType(grid, f, tagGlyphs(), palette);
      followTag = true;
      dots.morph(typed, {
        dur: 1.3, order: 'sweep', focus: false,
        onDone: () => {
          showTag(true, 0.35);
          ctx.add(() => gsap.fromTo(fadeT, { v: 1 }, { v: 0, duration: 0.35, ease: 'power2.out', onUpdate: () => dots.typeFade(fadeT.v), onComplete: () => { followTag = false; } }));
        },
      });
      return;
    }
    dots.morph(f);
  }
  const fadeT = { v: 1 };

  // ---- the scroll cue: a slow trickle of grains off the bottom of the plane, past the bottom of the screen ----
  // It's the dots, so there's nothing in the page for it, and the line under the tagline stays the first thing
  // painted. Scrolling stops it for good: grains already falling finish, and no new ones set off.
  let scrolled = false, dripAt = 1e9;
  const drip = () => { if (dots && !still && !scrolled) { dripAt = performance.now() / 1000; dots.drip(dripAt, 1e9); } };
  on(window, 'scroll', () => {
    if (scrolled || window.scrollY < 4) return;
    scrolled = true;
    dots?.drip(dripAt, performance.now() / 1000);
  }, { passive: true });
  const tagInView = () => { const r = tag.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  // The part in the middle of the screen is the one the dots make.
  function sceneAtMiddle(): SceneId {
    const y = innerHeight * 0.58;
    let id: SceneId = 'hero';
    for (const el of q('[data-scene]')) if (el.getBoundingClientRect().top <= y) id = el.dataset.scene as SceneId;
    return id;
  }

  // On a phone the dots sit in a band near the top of the screen and the words scroll up through it. So the band
  // fades out by however much reading text covers it: the dots are only ever at full strength in their own clear
  // space above the words, and never morph under something being read. The band is where the current scene's
  // picture sits (layoutFor), so the hand, like every other scene, shows above Say hello and fades as the words
  // and links rise over it, rather than waving a second time at the foot of the page.
  const reading = q<HTMLElement>(READING);
  let shown = 1;
  const fade = (dt: number) => {
    if (!scene) return;
    const H = grid.h, [, y0, , y1] = layoutFor(scene, phone, sideways(grid.w, grid.h)).rect;
    const target = bandShown(y0 * H, y1 * H, reading.map(el => el.getBoundingClientRect()));
    shown += (target - shown) * (1 - Math.exp(-dt / 0.075));
    // It's eased here, so the canvas's own half-second opacity transition (for its first showing, and for leaving)
    // is off while this runs. Restarted every frame, it left the dots trailing the words by half their fade.
    const on = shown < 0.995;
    canvas.style.transition = on ? 'none' : '';
    canvas.style.opacity = on ? shown.toFixed(3) : '';
  };

  let last = performance.now();
  const frame = () => {
    if (stopped) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !dots) return;
    if (followTag) dots.shift([0, 0], [0, tag.getBoundingClientRect().top - tagTop]);
    if (phone && !leaving) fade(dt);
    dots.frame(now / 1000, dt);
  };
  gsap.ticker.add(frame);
  off.push(() => gsap.ticker.remove(frame));

  // A new size means a new grid, so the dots are rebuilt where they'd be, without flying.
  let resizeT = 0;
  on(window, 'resize', () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      const [w, h] = size();
      if (Math.abs(w - grid.w) < 2 && Math.abs(h - grid.h) < 2) return;
      grid = makeGrid(w, h, phone);
      formations.clear(); pending = new Map();
      const g = grid;
      void formationFor(scene ?? first).then(f => {
        if (stopped || g !== grid) return;
        if (dots) dots.reset(grid, f); else if (f) paintFlat(f);
      });
      if (!tagShown) showTag(true);
      followTag = false;
    }, 250);
  });
  off.push(() => window.clearTimeout(resizeT));

  // The page opens on a quiet field of still dots that fades in as soon as there's something to draw it with. The
  // first picture assembles out of it. With reduced motion there's no field: the picture just appears.
  const first = sceneAtMiddle();
  const showDots = () => root.classList.add('has-dots');
  if (dots && !still) { dots.field(); requestAnimationFrame(showDots); }

  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(root);
  off.push(() => ro.disconnect());

  // ---- the pointer: the dots get out of its way -------------------------------------------------------------------
  if (dots && !still) {
    on(window, 'pointermove', (e: PointerEvent) => dots.pointer(e.clientX, e.clientY));
    on(document.documentElement, 'pointerleave', () => dots.leave());
    on(window, 'pointerup', (e: PointerEvent) => { if (e.pointerType !== 'mouse') dots.leave(); });
    on(window, 'pointercancel', () => dots.leave());
  }

  // ---- the pointer: four dots that trail it, and point over links (chrome.ts) ------------------------------------
  if (fine) {
    startCursor(root, on);

    // Magnetic: links marked for it lean toward the pointer, and settle back when it leaves.
    q('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      on(el, 'pointermove', (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.26); my((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      on(el, 'pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: true }); });
    });
  }

  // ---- the work index: the picture follows the pointer, and changes project in blocks ----------------------------
  const peek = root.querySelector<HTMLElement>('[data-peek]')!, list = root.querySelector<HTMLElement>('[data-index]')!;
  const peekPaint = peekPainter(root.querySelector<HTMLCanvasElement>('[data-peek-canvas]')!);
  off.push(() => peekPaint.stop());
  if (fine) {
    const px = gsap.quickTo(peek, 'x', { duration: 0.7, ease: 'power3.out' }), py = gsap.quickTo(peek, 'y', { duration: 0.7, ease: 'power3.out' });
    const lean = gsap.quickTo(peek, 'skewX', { duration: 0.5, ease: 'power3.out' }), turn = gsap.quickTo(peek, 'rotate', { duration: 0.6, ease: 'power3.out' });
    let lastX = 0, current = '', visible = false, settle = 0;
    const pics = new Map<string, HTMLImageElement | HTMLCanvasElement>();
    const picFor = (id: string) => {
      if (!pics.has(id)) {
        const work = WORK.find(w => w.id === id)!;
        if (work.hero.port) pics.set(id, portPicture(palette.accent));
        else { const img = new Image(); img.src = work.hero.src; pics.set(id, img); }
      }
      return pics.get(id)!;
    };
    const show = (id: string) => {
      if (id === current) return;
      current = id;
      const pic = picFor(id);
      if (pic instanceof HTMLImageElement && !pic.complete) pic.decode().then(() => { if (current === id) { peekPaint.show(null); peekPaint.show(pic); } }).catch(() => {});
      else peekPaint.show(pic);
      if (!visible) { visible = true; gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EXPO, overwrite: 'auto' }); }
    };
    const hide = () => { current = ''; visible = false; peekPaint.show(null); gsap.to(peek, { autoAlpha: 0, scale: 0.92, duration: 0.45, delay: 0.1, ease: 'power3.in', overwrite: 'auto' }); };
    gsap.set(peek, { autoAlpha: 0, scale: 0.92, xPercent: -50, yPercent: -50 });
    on(list, 'pointermove', (e: PointerEvent) => {
      const row = (e.target as Element).closest<HTMLElement>('[data-work]');
      if (row) show(row.dataset.work!);
      px(e.clientX); py(e.clientY);
      const v = gsap.utils.clamp(-20, 20, (e.clientX - lastX) * 0.8);
      lastX = e.clientX;
      lean(-v); turn(v * 0.25);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => { lean(0); turn(0); }, 90);
    });
    on(list, 'pointerenter', (e: PointerEvent) => { lastX = e.clientX; gsap.set(peek, { x: e.clientX, y: e.clientY }); WORK.forEach(w => picFor(w.id)); });
    on(list, 'pointerleave', hide);
    off.push(() => window.clearTimeout(settle));
  }

  // ---- leaving for a project: the words step back and the dots gather into the project's own object, where its
  // page will draw it. That page picks them up in place (see chrome.ts and WorkPage.tsx).
  const main = root.querySelector('main'), head = root.querySelector('.e-head');
  function leave(id: WorkId, href: string) {
    saveReturn(window.scrollY);
    const work = pageWorkById(id);
    if (still || stopped || !dots || !work) { location.href = href; return; }
    if (leaving) return;
    leaving = true;
    canvas.style.transition = ''; canvas.style.opacity = '';
    gsap.to(peek, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
    gsap.to([main, head], { autoAlpha: 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
    const g = grid, built = build.build({ ...job('work'), ...('ring' in work.hero ? { id: 'ring' } : { id: 'shot', src: work.hero.src }) });
    // If the picture is slow, don't keep the visitor waiting on it.
    const late = window.setTimeout(() => { location.href = href; }, 2200);
    void built.then(b => {
      if (!leaving) return;
      if (!b || g !== grid) { window.clearTimeout(late); location.href = href; return; }
      // Go once the dots have snapped sharp (the focus pull ends about a quarter second after the move does).
      dots.morph(b.f, { order: 'center', dur: 0.95, spread: 0.45, onDone: () => window.setTimeout(() => {
        window.clearTimeout(late);
        if (!leaving) return;
        saveHandoff(id, g.w, g.h, snapshotOf(b.f, g.cells));
        location.href = href;
      }, 300) });
    });
  }
  // Coming back with the browser's back button, the page may come out of the cache as it was left: words gone and
  // the dots drawing the project. Put the part back.
  on(window, 'pageshow', (e: PageTransitionEvent) => {
    if (!e.persisted || !leaving) return;
    leaving = false; shown = 1; canvas.style.transition = ''; canvas.style.opacity = '';
    gsap.to([main, head], { autoAlpha: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    const f = scene && formations.get(scene);
    if (f && dots) dots.morph(f, { order: 'center', dur: 0.9, spread: 0.4 });
  });

  // ---- the parts: each one makes the dots move when it reaches the middle of the screen -------------------------
  function triggers() {
    q('[data-scene]').forEach(el => {
      const id = el.dataset.scene as SceneId;
      ScrollTrigger.create({ trigger: el, start: id === 'hero' ? 'top top' : 'top 58%', end: 'bottom 58%', onToggle: self => { if (self.isActive) void go(id); } });
    });
  }

  // ---- the intro: nothing moves until everything it needs is ready ---------------------------------------------
  // The first picture's dots and the plan for assembling it are worked out in the worker while the field is up and
  // the font loads. Then, with the dots held still, the tagline is split and the triggers measured, which takes a
  // frame or two that nobody sees. One frame later the dots and the words start together, from rest.
  const ready = () => root.classList.add('is-ready');
  if (still) ready();
  const g0 = grid;
  const firstBuilt = build.build(job(first, !!dots && !still)).then(b => {
    if (!b || g0 !== grid) return null;
    formations.set(first, b.f); pending.set(first, Promise.resolve(b.f));
    return b;
  });
  /** The rest of the pictures, one at a time, once the intro is over. */
  function later() {
    const rest = SCENE_ORDER.filter(id => !formations.has(id));
    let k = 0;
    const next = () => { if (!stopped && k < rest.length) void formationFor(rest[k++]).then(() => window.setTimeout(next, 60)); };
    window.setTimeout(next, 300);
  }
  Promise.all([fontsReady(), Promise.race([firstBuilt, new Promise<null>(r => setTimeout(() => r(null), 2500))])]).then(([, b]) => {
    if (stopped) return;
    ScrollTrigger.refresh();
    let words: gsap.core.Timeline | undefined;
    ctx.add(() => {
      if (!still) { words = hero(); quiet(); hello(); }
      triggers();
    });
    ready();
    if (b) {
      scene = first;
      if (first !== 'hero') swap(captionEl, first === 'work' ? '' : ART[first].caption, 1);
      if (!dots) { paintFlat(b.f); showDots(); }
      else if (still || !b.plan) { dots.set(b.f); showDots(); }
      // Once the plane has settled, grains start dripping off it, until the visitor scrolls.
      else dots.intro(b.f, b.plan, { onDone: () => { if (first === 'hero') drip(); later(); } });
    }
    let ticks = 0;
    const begin = () => {
      if (++ticks < 2) return;
      gsap.ticker.remove(begin);
      performance.mark?.('e:intro');
      dots?.play();
      words?.play();
      started = true;
      if (!b || !dots || still || !b.plan) later();
      if (wanted !== scene) void go(wanted);
    };
    gsap.ticker.add(begin);
    off.push(() => gsap.ticker.remove(begin));
  });

  // The hero's moment: each beat of the tagline moves the way it reads, while the dots fly in out of the static.
  function hero() {
    const l1 = root.querySelector<HTMLElement>('[data-line="design"]')!, l2 = root.querySelector<HTMLElement>('[data-line="move"]')!, l3 = root.querySelector<HTMLElement>('[data-line="build"]')!;
    const s1 = SplitText.create(l1, { type: 'chars', mask: 'chars', aria: 'none', ignore: 'svg', charsClass: 'e-ch' });
    const s2 = SplitText.create(l2, { type: 'words,chars', aria: 'none', charsClass: 'e-ch' });
    const s3 = SplitText.create(l3, { type: 'chars', mask: 'chars', aria: 'none', charsClass: 'e-ch' });
    const move = l2.querySelector('.e-tag__move')!;
    const moveChars = s2.chars.filter(c => move.contains(c)), makeChars = s2.chars.filter(c => !move.contains(c));
    const path = l1.querySelector('path')!, beam = l3.querySelector('.e-tag__beam')!;
    const head = root.querySelector('.e-head')!, foot = root.querySelector('[data-hero-foot]')!, sub = foot.querySelector('.e-hero__sub')!;

    const words = gsap.timeline({ paused: true, delay: 0.15, onComplete: () => { splitDone = true; } })
      // "I design it," : the letters come up out of their masks and lean upright, then a pen line draws under design.
      .from(s1.chars, { yPercent: 115, rotate: 10, skewX: -12, duration: 1.15, stagger: 0.035, ease: POWER }, 0.1)
      .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'expo.inOut' }, 0.65)
      // "make it move," : make it rises the same way, and move slides in along the line, leaning, and settles with
      // the page's one overshoot.
      .from(makeChars, { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.03, ease: POWER }, 0.45)
      .from(moveChars, { x: () => innerWidth * (phone ? 0.45 : 0.36), skewX: -26, opacity: 0, duration: 1.05, stagger: 0.07, ease: 'back.out(1.4)' }, 0.65)
      // "and build it." : the letters go up like columns from the baseline, middle first, and a beam goes in under them.
      .from(s3.chars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.75, stagger: { each: 0.035, from: 'center' }, ease: EXPO }, 0.95)
      .fromTo(beam, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 1.2)
      // Then the line under it, once the tagline is most of the way up, and the header last. Both start hidden in
      // the CSS (e.css), so they go from and to stated values.
      .fromTo(sub, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: EXPO }, 0.8)
      .fromTo(head, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.9, ease: EXPO }, 1.05);

    // Scrolling away, the three lines drift apart a little, at different speeds.
    const away = { trigger: '.e-hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to(l1, { xPercent: -5, ease: 'none', scrollTrigger: away });
    gsap.to(l2, { xPercent: 6, ease: 'none', scrollTrigger: away });
    gsap.to(l3, { xPercent: -2, yPercent: -18, ease: 'none', scrollTrigger: away });
    gsap.to(foot, { opacity: 0, y: -30, ease: 'none', scrollTrigger: { ...away, end: '40% top' } });
    return words;
  }

  // Everything else is quiet: a block rises a few pixels and fades in, all of it together, once.
  function quiet() {
    q('[data-rule]').forEach(el => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    q('[data-quiet]').forEach(el => gsap.fromTo(el, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    // The big paragraph about Bryce lights up word by word as you read down it. Its words stay readable as they are
    // (aria 'none'), since a label on the paragraph would hide the name of the Dervo link inside it.
    q('[data-read]').forEach(el => {
      SplitText.create(el, {
        type: 'words', aria: 'none', autoSplit: true,
        onSplit: self => gsap.fromTo(self.words, { opacity: 0.2 }, { opacity: 1, stagger: 0.05, ease: 'power1.inOut', scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: 0.8 } }),
      });
    });
    const mail = root.querySelector('.e-mail');
    if (mail) gsap.from(mail, { y: 22, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: mail, start: 'top 92%', once: true } });
  }

  // Say hello comes up letter by letter, and reaching for it parts the letters around your hand (from B and D).
  function hello() {
    const el = root.querySelector<HTMLElement>('[data-hello]')!;
    const split = SplitText.create(el, { type: 'chars', aria: 'auto' });
    const chars = split.chars as HTMLElement[];
    gsap.from(chars, { yPercent: 60, opacity: 0, duration: 1.4, stagger: 0.05, ease: POWER, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    const movers = chars.map(c => ({ x: gsap.quickTo(c, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 0.8, ease: 'power3.out' }), r: gsap.quickTo(c, 'rotate', { duration: 0.9, ease: 'power3.out' }) }));
    let centers: { x: number; y: number }[] = [];
    const measureChars = () => { centers = chars.map(c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); };
    const push = (x: number, y: number, strength = 1) => {
      const h = el.clientHeight, top = el.getBoundingClientRect();
      const nearBy = Math.exp(-(((y - (top.top + h / 2)) / h) ** 2)) * strength;
      chars.forEach((_, i) => {
        const dx = centers[i].x - x, spread = Math.sign(dx) * (1 - Math.exp(-Math.abs(dx) / (h * 0.45)));
        const close = Math.exp(-((dx / (h * 0.6)) ** 2));
        movers[i].x(spread * h * 0.18 * nearBy); movers[i].y(-close * h * 0.07 * nearBy); movers[i].r(spread * close * 7 * nearBy);
      });
    };
    const home = () => movers.forEach(m => { m.x(0); m.y(0); m.r(0); });
    on(el, 'pointerenter', measureChars);
    on(el, 'pointermove', (e: PointerEvent) => { if (e.pointerType === 'mouse') push(e.clientX, e.clientY); });
    on(el, 'pointerleave', home);
    let back = 0;
    on(el, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      measureChars(); push(e.clientX, e.clientY, 1.3);
      window.clearTimeout(back); back = window.setTimeout(home, 420);
    });
    off.push(() => window.clearTimeout(back));
  }

  return {
    leave,
    stop() {
      stopped = true;
      off.forEach(fn => fn());
      ctx.revert();
      dots?.stop();
      root.classList.remove('is-ready', 'has-cursor', 'has-dots');
    },
  };
}
