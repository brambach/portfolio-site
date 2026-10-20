import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { finePointer, narrow, reducedMotion, WORK } from '../content';
import { startDots, type Dots } from './dots';
import { dustFormation, makeGrid, objectFormation, photoFormation, sampleType, staticFormation, withType, type Formation, type Grid } from './field';
import { hex, type Palette } from './palette';
import { curtainPainter, peekPainter, portPicture } from './pixels';
import { ART, coverCrop, layoutFor, SCENE_ORDER, type SceneId } from './scenes';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* All of Direction E's movement, in one gsap.context so leaving the page reverts every split, tween and trigger at
   once, and every listener added here comes off with it.

   Each part of the page has one moment, and it's the dots: when a part reaches the middle of the screen, the dots
   leave the last object and fly to their places in the next one, arrive a little loose and snap sharp. That's a
   trigger, not a scrub, so the scene always finishes the move it started, whatever the scroll does next.
   Everything else is quiet. Blocks rise a few pixels and fade in once, and the type moves the way B's does.

   With reduced motion nothing splits or flies. Each part's picture is drawn as still dots when you reach it. */

export type EMotion = { stop: () => void; curtain: (name: string, href: string) => void };

const EXPO = 'expo.out', POWER = 'power4.out';

/** Sentient comes from Fontshare with its stylesheet loading late, so wait (briefly) for it before splitting, or
 *  the lines would be measured in Georgia. */
async function fontsReady(limit = 1100) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const until = performance.now() + limit;
  const declared = () => [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Sentient');
  while (!declared() && performance.now() < until) await new Promise(r => setTimeout(r, 40));
  await Promise.race([
    Promise.all([document.fonts.load('400 100px Sentient'), document.fonts.load('italic 400 100px Sentient')]).catch(() => {}),
    new Promise(r => setTimeout(r, Math.max(0, until - performance.now()))),
  ]);
}

const loadImage = (src: string) => new Promise<HTMLImageElement | null>(done => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => done(img);
  img.onerror = () => done(null);
  img.src = src;
});

export function startDirectionE(root: HTMLElement, palette: Palette): EMotion {
  const still = reducedMotion(), fine = finePointer() && !still, phone = narrow();
  const q = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const off: (() => void)[] = [];
  const on = (t: Window | Element | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    off.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  let stopped = false, lenis: Lenis | null = null;
  const ctx = gsap.context(() => {}, root);

  // ---- the dots -------------------------------------------------------------------------------------------------
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dots]')!;
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight] as const;
  let grid: Grid = makeGrid(...size(), phone);
  const dots: Dots | null = typeof window.WebGLRenderingContext === 'function' ? startDots(canvas, grid, { still, phone, dark: hex(palette.object[0]) }) : null;
  // Without WebGL the pictures are still drawn as dots, just once each and without moving.
  const flat = dots ? null : canvas.getContext('2d');
  if (!dots && !flat) canvas.style.display = 'none';

  const photos = new Map<SceneId, HTMLImageElement | null>();
  const loading = new Map<SceneId, Promise<HTMLImageElement | null>>();
  const photo = (id: SceneId) => {
    if (id === 'work') return Promise.resolve(null);
    let p = loading.get(id);
    if (!p) { p = loadImage(ART[id].src).then(img => { photos.set(id, img); return img; }); loading.set(id, p); }
    return p;
  };
  const formations = new Map<SceneId, Formation>();
  /** A part's dots, built the first time they're needed for this screen size. */
  function formation(id: SceneId): Formation | null {
    let f = formations.get(id);
    if (f) return f;
    if (id === 'work') f = dustFormation(grid, palette);
    else {
      const img = photos.get(id);
      if (!img) return null;
      const art = ART[id], layout = layoutFor(id, phone), seed = SCENE_ORDER.indexOf(id) + 1;
      if (art.kind === 'object') {
        // The whole picture, at about three pixels to a dot: the dots read the pink and the four tones off it
        // themselves, and that's plenty to keep the plane's thin trail without keying every pixel of the file.
        const across = ((layout.rect[2] - layout.rect[0]) * grid.w) / grid.cell, k = Math.min(1, (across * 3) / img.naturalWidth);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        const cx = c.getContext('2d', { willReadFrequently: true });
        if (!cx) return null;
        cx.imageSmoothingQuality = 'high';
        cx.drawImage(img, 0, 0, c.width, c.height);
        f = objectFormation(grid, layout, art, cx.getImageData(0, 0, c.width, c.height), palette, { seed, drips: id === 'hero', still });
        formations.set(id, f);
        return f;
      }
      const [x0, y0, x1, y1] = layout.rect;
      const rw = (x1 - x0) * grid.w, rh = (y1 - y0) * grid.h;
      const pw = Math.max(1, Math.round(rw / grid.cell)), ph = Math.max(1, Math.round(rh / grid.cell));
      const c = document.createElement('canvas');
      c.width = pw; c.height = ph;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (!cx) return null;
      const crop = coverCrop(img.naturalWidth, img.naturalHeight, rw, rh, art.focus ?? [0.5, 0.5]);
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);
      f = photoFormation(grid, layout, art, cx.getImageData(0, 0, pw, ph), palette, seed);
    }
    formations.set(id, f);
    return f;
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

  let scene: SceneId | null = null, wanted: SceneId = 'hero', built = false, splitDone = false;
  /** Move the dots to a part's photo. The first time, they come out of the static. */
  async function go(id: SceneId) {
    wanted = id;
    await photo(id);
    if (stopped || wanted !== id || id === scene) return;
    const f = formation(id);
    if (!f) return;
    const from = scene;
    scene = id;
    const at = SCENE_ORDER.indexOf(id), was = from ? SCENE_ORDER.indexOf(from) : 0;
    const caption = id === 'work' ? '' : ART[id].caption;
    swap(captionEl, caption, at >= was ? 1 : -1);
    if (!dots) { paintFlat(f); return; }
    if (still) { dots.set(f); return; }
    if (!built) {
      built = true;
      // Once the plane has settled, grains start dripping off it, until the visitor scrolls.
      dots.morph(f, { dur: 1.7, order: 'center', spread: 1.3, onDone: () => { if (id === 'hero') drip(); } });
      return;
    }
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

  // On a phone the words scroll up over the photo, so once a part's words reach the top half of the screen its
  // scene steps back to let them be read. The next part brings it back with its morph.
  let backed = false;
  const stepBack = () => {
    const el = scene && scene !== 'hero' ? root.querySelector<HTMLElement>(`[data-scene="${scene}"]`) : null;
    const back = !!el && el.getBoundingClientRect().top < -innerHeight * 0.08;
    if (back !== backed) { backed = back; canvas.style.opacity = back ? '0.32' : ''; }
  };

  let last = performance.now();
  const frame = () => {
    if (stopped) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !dots) return;
    if (followTag) dots.shift([0, 0], [0, tag.getBoundingClientRect().top - tagTop]);
    if (phone) stepBack();
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
      formations.clear();
      const f = formation(scene ?? 'hero') ?? staticFormation(grid, palette);
      if (dots) dots.reset(grid, f); else paintFlat(f);
      if (!tagShown) showTag(true);
      followTag = false;
    }, 250);
  });
  off.push(() => window.clearTimeout(resizeT));

  // The page opens on static, which the first photo is built out of. With reduced motion there's no static: the
  // first photo just appears.
  if (dots && !still) dots.set(staticFormation(grid, palette));

  // ---- smooth scrolling, on the same clock as GSAP --------------------------------------------------------------
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

  // ---- the pointer: the dots get out of its way -------------------------------------------------------------------
  if (dots && !still) {
    on(window, 'pointermove', (e: PointerEvent) => dots.pointer(e.clientX, e.clientY));
    on(document.documentElement, 'pointerleave', () => dots.leave());
    on(window, 'pointerup', (e: PointerEvent) => { if (e.pointerType !== 'mouse') dots.leave(); });
    on(window, 'pointercancel', () => dots.leave());
  }

  // ---- the cursor: a dot, and a ring that grows into a gold disc with a word over anything you can open --------
  const cursor = root.querySelector<HTMLElement>('[data-cursor-el]')!;
  const ring = cursor.querySelector<HTMLElement>('.e-cursor__ring')!, label = cursor.querySelector<HTMLElement>('[data-cursor-label]')!;
  const dot = cursor.querySelector<HTMLElement>('.e-cursor__dot')!;
  if (fine) {
    root.classList.add('has-cursor');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
    let shown = false;
    on(window, 'pointermove', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); cursor.classList.add('is-on'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });
    on(document.documentElement, 'pointerleave', () => { shown = false; cursor.classList.remove('is-on'); });
    on(root, 'pointerover', (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>('[data-cursor], a, button');
      const word = target?.dataset.cursor ?? '';
      cursor.classList.toggle('is-label', !!word);
      cursor.classList.toggle('is-link', !!target && !word);
      if (word) label.textContent = word;
    });
    on(root, 'pointerdown', () => cursor.classList.add('is-down'));
    on(window, 'pointerup', () => cursor.classList.remove('is-down'));

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

  // ---- the curtain: leaving for a project, the page breaks into blocks and the name comes up in them -------------
  const curtainEl = root.querySelector<HTMLElement>('[data-curtain]')!, curtainName = root.querySelector<HTMLElement>('[data-curtain-name]')!;
  const curtainPaint = curtainPainter(root.querySelector<HTMLCanvasElement>('[data-curtain-canvas]')!, palette);
  function curtain(name: string, href: string) {
    if (still || stopped) { location.href = href; return; }
    curtainName.textContent = name;
    lenis?.stop();
    gsap.to(peek, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
    curtainPaint.fit();
    ctx.add(() => {
      const state = { p: 0 };
      const split = SplitText.create(curtainName, { type: 'chars', mask: 'chars' });
      gsap.timeline({ onComplete: () => { location.href = href; } })
        .set(curtainEl, { visibility: 'visible' })
        .to(state, { p: 1, duration: 0.95, ease: 'power1.inOut', onUpdate: () => curtainPaint.draw(state.p) })
        .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.04, ease: EXPO }, 0.6)
        .to({}, { duration: 0.15 });
    });
  }
  // Coming back with the back button, the page may come out of the cache with the blocks still up.
  on(window, 'pageshow', (e: PageTransitionEvent) => { if (e.persisted) { gsap.set(curtainEl, { visibility: 'hidden' }); curtainPaint.draw(0); lenis?.start(); } });

  // ---- the parts: each one makes the dots move when it reaches the middle of the screen -------------------------
  function triggers() {
    q('[data-scene]').forEach(el => {
      const id = el.dataset.scene as SceneId;
      ScrollTrigger.create({ trigger: el, start: id === 'hero' ? 'top top' : 'top 58%', end: 'bottom 58%', onToggle: self => { if (self.isActive) void go(id); } });
    });
  }

  // ---- everything that needs the type measured first ---------------------------------------------------------
  const ready = () => root.classList.add('is-ready');
  if (still) ready();
  const first = sceneAtMiddle();
  // The photo for where the page opens comes first. The rest load after it, a little at a time.
  const firstPhoto = photo(first);
  Promise.all([fontsReady(), Promise.race([firstPhoto, new Promise(r => setTimeout(r, 1800))])]).then(() => {
    if (stopped) return;
    ScrollTrigger.refresh();
    ctx.add(() => {
      if (!still) { hero(); quiet(); hello(); }
      triggers();
    });
    void go(sceneAtMiddle());
    ready();
    let k = 0;
    const rest = SCENE_ORDER.filter(id => id !== first);
    // Each one is turned into dots while the page is idle, so reaching a part never has to wait for that.
    const idle = (fn: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 60));
    const next = () => {
      if (stopped || k >= rest.length) return;
      const id = rest[k++];
      void photo(id).then(() => idle(() => { if (!stopped) formation(id); window.setTimeout(next, 80); }));
    };
    window.setTimeout(next, 600);
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
    const head = root.querySelector('.e-head')!, foot = root.querySelector('[data-hero-foot]')!;

    gsap.timeline({ delay: 0.15, onComplete: () => { splitDone = true; } })
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
      .from(head, { opacity: 0, y: -12, duration: 1, ease: EXPO }, 1.1);

    // Scrolling away, the three lines drift apart a little, at different speeds.
    const away = { trigger: '.e-hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to(l1, { xPercent: -5, ease: 'none', scrollTrigger: away });
    gsap.to(l2, { xPercent: 6, ease: 'none', scrollTrigger: away });
    gsap.to(l3, { xPercent: -2, yPercent: -18, ease: 'none', scrollTrigger: away });
    gsap.to(foot, { opacity: 0, y: -30, ease: 'none', scrollTrigger: { ...away, end: '40% top' } });
  }

  // Everything else is quiet: a block rises a few pixels and fades in, all of it together, once.
  function quiet() {
    q('[data-rule]').forEach(el => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    q('[data-quiet]').forEach(el => gsap.from(el, { y: 22, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    // The big paragraph about Bryce lights up word by word as you read down it.
    q('[data-read]').forEach(el => {
      SplitText.create(el, {
        type: 'words', aria: 'auto', autoSplit: true,
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
    curtain,
    stop() {
      stopped = true;
      off.forEach(fn => fn());
      gsap.ticker.remove(tick);
      lenis?.destroy();
      ctx.revert();
      dots?.stop();
      root.classList.remove('is-ready', 'has-cursor');
    },
  };
}
