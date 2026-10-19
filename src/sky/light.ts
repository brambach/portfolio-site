/* The light on the sky site, drawn on canvases: the halftone horizons behind the opening and closing screens, the
   reflection under a picture, and the small ring of dots a click leaves.

   A horizon is a grid of dots whose size is the light reaching it. Above the line: the sun as a disc of full dots,
   a glow around it and a band of light along the horizon. Below: water drawn as flattened dashes, with the sun's
   reflection shimmering in a column that widens toward you. Point at or tap the water and it ripples. A "rise"
   horizon climbs into place when it first shows and keeps climbing as you scroll away (it must sit at the top of
   the page); a "set" horizon sinks as you reach the end of the page. Nothing is drawn more than a few sun-widths
   above the line, so words above it never sit on dots. A page that moves the sun itself (the home page's one sun
   for the whole day) passes hooks instead; see HorizonOptions.

   Cost: everything shares one frame loop, capped at 30 frames a second (a page can raise it while it's open), that
   only runs while something is on screen and something is happening (the sun rising, a ripple, a hook saying it's
   busy, or scrolling and pointing in the last few seconds). After that the water holds still until you move
   again. With reduced motion it draws single still frames.

   At night (visitor's local time, 9pm to 5am) the sun is a silver moon. ?hour=22 previews it. */

export type RGB = [number, number, number];
type Kind = 'rise' | 'set';
export type Spot = { x: number; y: number };
/** What a page can read about a horizon: its size, the waterline and where the sun is now (canvas pixels). */
export type SceneInfo = { readonly W: number; readonly H: number; readonly hz: number; readonly R: number; readonly sx: number; readonly born: number | null; readonly sunX: number; readonly sunY: number };
export type HorizonOptions = {
  R?: number; Rs?: number; water?: number; waters?: number; x?: number; xs?: number;
  /** Water height in pixels, when it depends on the layout. */
  waterAt?: () => number;
  /** Put the sun anywhere (canvas pixels); y can go below the line or far above it. */
  sun?: (s: SceneInfo, now: number) => Spot;
  /** How wide the sun's reflection is, when that changes from frame to frame. */
  reach?: () => number;
  /** The size of the disc and its glow, when it differs from the reflection's width (0 hides the disc). */
  disc?: () => number;
  /** How much of the water at (x, y) sits behind something reflected in front of it, 0 to 1. */
  hide?: (x: number, y: number) => number;
  /** Keep drawing while this says something is moving. */
  busy?: (now: number) => boolean;
};
export type Horizon = { stop: () => void; ripple: (x: number, y: number) => void; scene: SceneInfo };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
export const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
export const rgb = (c: RGB) => `rgb(${c.join(' ')})`;
const WHITE: RGB = [255, 255, 255];
const IDLE_MS = 5000;
let frameMs = 31;

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowScreen = () => document.documentElement.clientWidth < 700;

/** Let the shared loop draw at up to `fps` frames a second (30 by default). Returns a function that puts it back. */
export function frameRate(fps: number) {
  const before = frameMs;
  frameMs = 1000 / fps - 2;
  return () => { frameMs = before; };
}

/** oklch to sRGB, so the canvas dots match the CSS sky exactly. */
export function oklch(L: number, C: number, h: number): RGB {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map(x => {
    x = clamp(x, 0, 1);
    return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
  }) as RGB;
}

// The same four stops as --sky-0..--sky-3 in sky.css.
export const SKY_STOPS: [number, number, number][] = [[0.17, 0.028, 262], [0.205, 0.022, 285], [0.205, 0.014, 262], [0.225, 0.026, 28]];
const SKY = SKY_STOPS.map(s => oklch(...s));
const BASE: Record<Kind, RGB> = { rise: mix(mix(SKY[0], SKY[1], 0.8), WHITE, 0.2), set: mix(SKY[3], WHITE, 0.2) };
export const SUN: Record<Kind, [RGB, RGB]> = { rise: [[222, 140, 98], [246, 200, 116]], set: [[214, 116, 88], [244, 168, 92]] };
export const MOON: Record<Kind, [RGB, RGB]> = { rise: [[138, 154, 186], [226, 232, 242]], set: [[138, 154, 186], [226, 232, 242]] };
// The colour water lends a reflection: the sky near the horizon.
const WATER: RGB = mix(SKY[2], SKY[3], 0.4);

/** The visitor's hour, or ?hour= when previewing. */
export function localHour(search = location.search, now = new Date()) {
  const asked = new URLSearchParams(search).get('hour');
  const hour = asked === null || asked === '' ? NaN : Number(asked);
  return Number.isInteger(hour) && hour >= 0 && hour < 24 ? hour : now.getHours();
}
export const isNight = (hour = localHour()) => hour >= 21 || hour < 5;

type Ripple = { x: number; y: number; t0: number };
type Scene = {
  kind: Kind; host: HTMLElement; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; opt: HorizonOptions;
  visible: boolean; born: number | null; ripples: Ripple[]; last: number;
  W: number; H: number; R: number; gap: number; hz: number; sx: number; sunX: number; sunY: number;
};
type Painter = { target: Element; visible: boolean; layout: () => void; paint: (now: number) => void; rippling: () => boolean };

const scenes = new Set<Scene>();
const painters = new Set<Painter>();
let raf = 0, lastDraw = 0, lastActive = 0, wired = false;
let io: IntersectionObserver | null = null;

function layoutScene(s: Scene) {
  const narrow = narrowScreen(), dpr = Math.min(2, devicePixelRatio || 1);
  s.W = s.host.clientWidth; s.H = s.host.clientHeight;
  s.canvas.width = Math.round(s.W * dpr); s.canvas.height = Math.round(s.H * dpr);
  s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  s.R = (narrow ? s.opt.Rs : s.opt.R) ?? (narrow ? 28 : 46);
  s.gap = narrow ? 9 : 11;
  s.hz = s.H - (s.opt.waterAt?.() ?? (narrow ? s.opt.waters : s.opt.water) ?? (narrow ? 84 : 130));
  s.sx = s.W * ((narrow ? s.opt.xs : s.opt.x) ?? (s.kind === 'rise' ? (narrow ? 0.7 : 0.64) : (narrow ? 0.3 : 0.36)));
}

function sunAt(s: Scene, now: number): Spot {
  if (s.opt.sun) return s.opt.sun(s, now);
  const { R, hz } = s;
  if (s.kind === 'rise') {
    const age = reducedMotion() ? 1 : !s.born ? 0 : 1 - Math.pow(1 - clamp((now - s.born) / 3200, 0, 1), 3);
    const away = clamp(scrollY / Math.max(1, s.H), 0, 1);
    return { x: s.sx, y: hz + R * 1.15 - (R * 1.15 + R * 0.55) * age - R * 1.6 * away };
  }
  const top = s.host.getBoundingClientRect().top + scrollY;
  const p = clamp((scrollY + innerHeight - top) / Math.max(1, document.documentElement.scrollHeight - top), 0, 1);
  return { x: s.sx, y: hz - R * 1.8 + R * 2.25 * smooth(p) };
}

function drawScene(s: Scene, now: number) {
  const { ctx, W, H, hz, gap, opt } = s, t = now / 1000, still = reducedMotion();
  if (!W || !H) return;
  const [mid, high] = (isNight() ? MOON : SUN)[s.kind], base = BASE[s.kind];
  const { x: sx, y: sy } = sunAt(s, now);
  s.sunX = sx; s.sunY = sy;
  const R = Math.max(0.01, opt.reach?.() ?? s.R), Rd = opt.disc ? Math.max(0.01, opt.disc()) : R;
  const light = clamp((hz - sy) / R + 1.1, 0.15, 1);
  const maxR = gap * 0.46, NB = 12;
  const dots = Array.from({ length: NB }, () => new Path2D()), dashes = Array.from({ length: NB }, () => new Path2D());
  s.ripples = s.ripples.filter(rp => t - rp.t0 < 2.8);
  const top = Math.max(0, Math.min(hz, sy) - Math.max(Rd, 30) * 4.5);
  const y0 = gap / 2 + Math.ceil((top - gap / 2) / gap) * gap;
  ctx.clearRect(0, 0, W, H);
  // A faint wash of light around the sun, above the line only. It fades out within five sun-radii.
  const wash = ctx.createRadialGradient(sx, sy, Rd * 0.6, sx, sy, Rd * 5);
  wash.addColorStop(0, `rgb(${high.join(' ')} / ${(0.12 * light).toFixed(3)})`);
  wash.addColorStop(1, `rgb(${high.join(' ')} / 0)`);
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, hz);
  for (let y = y0, row = 0; y < H; y += gap, row++) {
    const water = y >= hz;
    const depth = water ? (y - hz) / (H - hz) : 0;
    const up = water ? 1 - smooth(clamp((depth - 0.55) / 0.45, 0, 1)) : smooth(clamp((y - top) / (Math.max(Rd, 30) * 2.5), 0, 1));
    const offset = water && row % 2 ? gap / 2 : 0;
    for (let x = gap / 2 + offset; x < W; x += gap) {
      const dx = x - sx;
      let B: number;
      if (!water) {
        const d = Math.hypot(dx, y - sy);
        const disc = d < Rd ? 1 : 0;
        const glow = d >= Rd ? Math.exp(-(d - Rd) / (Rd * 1.4)) * 0.7 * light : 0;
        const band = 0.42 * Math.exp(-(hz - y) / 24) * Math.exp(-Math.abs(dx) / (W * 0.32)) * light;
        const haze = 0.05 * Math.exp(-(hz - y) / 70);
        B = Math.max(disc, (glow + band + haze) * up);
      } else {
        const spread = R * 0.75 + depth * R * 2.4;
        const above = clamp((hz + R - sy) / R, 0, 1);
        const shimmer = still ? 0.8 : 0.62 + 0.38 * Math.sin(x * 0.05 + y * 0.6 - t * 1.6) * Math.sin(x * 0.011 - t * 0.55 + y * 0.15);
        B = (Math.exp(-Math.abs(dx) / spread) * (1 - depth * 0.65) * light * above * shimmer * 0.95 + 0.07 * (1 - depth) * light + 0.045) * up;
        for (const rp of s.ripples) {
          const a = t - rp.t0, ring = 10 + a * 80;
          const de = Math.hypot(x - rp.x, (y - rp.y) * 2.4);
          B += Math.exp(-((de - ring) ** 2) / 110) * Math.exp(-a * 1.4) * 0.6 * up;
        }
        if (opt.hide) B *= 1 - opt.hide(x, y);
      }
      const k = clamp(B, 0, 1);
      const r = maxR * Math.pow(k, 0.8);
      if (r < 0.4) continue;
      const b = Math.min(NB - 1, Math.floor(k * NB));
      if (water) {
        const rx = Math.min(r * 1.7, gap * 0.47), ry = r * 0.5;
        dashes[b].moveTo(x + rx, y); dashes[b].ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      } else {
        dots[b].moveTo(x + r, y); dots[b].arc(x, y, r, 0, Math.PI * 2);
      }
    }
  }
  for (let b = 0; b < NB; b++) {
    const k = (b + 0.5) / NB;
    ctx.fillStyle = rgb(k < 0.45 ? mix(base, mid, k / 0.45) : mix(mid, high, (k - 0.45) / 0.55));
    ctx.fill(dots[b]); ctx.fill(dashes[b]);
  }
}

function frame(now: number) {
  raf = 0;
  const shown = [...scenes].filter(s => s.visible), shownPainters = [...painters].filter(p => p.visible);
  if (!shown.length && !shownPainters.length) return;
  if (now - lastDraw >= frameMs) {
    lastDraw = now;
    shown.forEach(s => drawScene(s, now));
    shownPainters.forEach(p => p.paint(now));
  }
  const happening = now - lastActive < IDLE_MS
    || shown.some(s => (s.born !== null && now - s.born < 3400) || s.ripples.length > 0 || s.opt.busy?.(now))
    || shownPainters.some(p => p.rippling());
  if (happening && !document.hidden && !reducedMotion()) raf = requestAnimationFrame(frame);
}

/** Draw now and keep drawing while something is happening. */
export function kick() {
  if (reducedMotion()) {
    const now = performance.now();
    scenes.forEach(s => s.visible && drawScene(s, now));
    painters.forEach(p => p.visible && p.paint(now));
    return;
  }
  if (!raf) raf = requestAnimationFrame(frame);
}
/** Something moved: draw for the next few seconds. */
export function wake() { lastActive = performance.now(); kick(); }
function relayout() { scenes.forEach(layoutScene); painters.forEach(p => p.layout()); kick(); }

function wire() {
  if (wired) return;
  wired = true;
  lastActive = performance.now();
  io = new IntersectionObserver(entries => entries.forEach(entry => {
    const scene = [...scenes].find(s => s.host === entry.target);
    const painter = [...painters].find(p => p.target === entry.target);
    const item = scene ?? painter;
    if (!item) return;
    item.visible = entry.isIntersecting;
    if (scene && scene.visible && !scene.born) scene.born = performance.now();
    if (item.visible) wake();
  }));
  addEventListener('scroll', wake, { passive: true });
  addEventListener('pointermove', wake, { passive: true });
  addEventListener('resize', relayout);
  document.addEventListener('visibilitychange', kick);
  document.fonts?.ready.then(relayout);
}

/** A halftone horizon behind `host`, drawn on `canvas`. */
export function horizon(host: HTMLElement, canvas: HTMLCanvasElement, kind: Kind, opt: HorizonOptions = {}): Horizon {
  wire();
  const ctx = canvas.getContext('2d');
  const none: SceneInfo = { W: 0, H: 0, hz: 0, R: 0, sx: 0, born: null, sunX: 0, sunY: 0 };
  if (!ctx) return { stop: () => {}, ripple: () => {}, scene: none };
  const s: Scene = { kind, host, canvas, ctx, opt, visible: false, born: null, ripples: [], last: 0, W: 0, H: 0, R: 0, gap: 0, hz: 0, sx: 0, sunX: 0, sunY: 0 };
  scenes.add(s); layoutScene(s); io?.observe(host);
  const resize = new ResizeObserver(() => { layoutScene(s); kick(); });
  resize.observe(host);
  const local = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const ripple = (x: number, y: number) => {
    if (reducedMotion() || y < s.hz) return;
    s.ripples.push({ x, y, t0: performance.now() / 1000 });
    if (s.ripples.length > 14) s.ripples.shift();
    kick();
  };
  const move = (e: PointerEvent) => { const [x, y] = local(e), now = performance.now(); if (now - s.last > 110) { s.last = now; ripple(x, y); } };
  const down = (e: PointerEvent) => { const [x, y] = local(e); ripple(x, y); };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerdown', down);
  return {
    scene: s,
    ripple,
    stop() {
      scenes.delete(s); io?.unobserve(host); resize.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerdown', down);
    },
  };
}

/** The picture mirrored into halftone water on `canvas`. Each dash takes the colour of the pixel it reflects, muted
 *  toward the water, and its length from how bright that pixel is. Near the line the reflection is crisp; further
 *  down, toward you, the water sways it side to side in slow bands and breaks it into streaks with gaps, and it
 *  fades out at the sides and the bottom so it never reads as a block. Pointing ripples it. `active`, when given,
 *  says whether to draw at all (for a picture that's out of sight). */
export function reflection(picture: HTMLElement, canvas: HTMLCanvasElement, active?: () => boolean) {
  wire();
  const ctx = canvas.getContext('2d');
  const src = document.createElement('canvas'), sctx = src.getContext('2d', { willReadFrequently: true });
  if (!ctx || !sctx) return () => {};
  let W = 0, H = 0, cols = 0, rows = 0, samples: Float32Array | null = null, ripples: Ripple[] = [], last = 0, gone = false, blank = true;
  const GY = 5, gapX = () => (narrowScreen() ? 5 : 6);
  const cover = (img: HTMLImageElement, w: number, h: number) => {
    const [px, py] = (getComputedStyle(img).objectPosition || '0 0').split(' ').map(v => (parseFloat(v) || 0) / 100);
    const ir = img.naturalWidth / img.naturalHeight, br = w / h;
    let sw = img.naturalWidth, sh = img.naturalHeight;
    if (ir > br) sw = sh * br; else sh = sw / br;
    sctx.drawImage(img, (img.naturalWidth - sw) * px, (img.naturalHeight - sh) * py, sw, sh, 0, 0, w, h);
  };
  const painter: Painter = {
    target: canvas, visible: false,
    rippling: () => ripples.length > 0,
    layout() {
      if (gone) return;
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(W / gapX()); rows = Math.floor(H / GY);
      // Draw the picture as it appears on screen into a small canvas, one pixel per dash column.
      const pr = picture.getBoundingClientRect();
      if (!pr.width || !cols) return;
      const k = cols / pr.width;
      src.width = cols; src.height = Math.max(1, Math.round(pr.height * k));
      sctx.fillStyle = getComputedStyle(picture).backgroundColor; sctx.fillRect(0, 0, src.width, src.height);
      try {
        picture.querySelectorAll('img').forEach(img => {
          if (!img.complete || !img.naturalWidth) return;
          if (getComputedStyle(img).objectFit === 'cover') cover(img, src.width, src.height);
          else { const r = img.getBoundingClientRect(); sctx.drawImage(img, (r.left - pr.left) * k, (r.top - pr.top) * k, r.width * k, r.height * k); }
        });
        const ring = picture.querySelector('.port-ring');
        if (ring) {
          const r = ring.getBoundingClientRect();
          sctx.strokeStyle = 'rgb(255 255 255 / 0.7)'; sctx.lineWidth = Math.max(1, 2 * k);
          sctx.beginPath(); sctx.arc((r.left - pr.left + r.width / 2) * k, (r.top - pr.top + r.height / 2) * k, (r.width / 2) * k, 0, Math.PI * 2); sctx.stroke();
        }
        const data = sctx.getImageData(0, 0, src.width, src.height).data;
        // Row r of the water reflects the picture from its bottom edge upward, a little compressed. Each sample
        // keeps the brightness and the colour, a touch richer and then muted toward the water, so a blue sky
        // reflects blue rather than grey.
        samples = new Float32Array(rows * cols * 4);
        for (let r = 0; r < rows; r++) {
          const y = clamp(src.height - 1 - Math.round(r * GY * 1.5 * k), 0, src.height - 1);
          for (let c = 0; c < cols; c++) {
            const i = (y * src.width + c) * 4, o = (r * cols + c) * 4;
            const R = data[i], G = data[i + 1], B = data[i + 2], Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
            for (let ch = 0; ch < 3; ch++) samples[o + ch] = clamp(Y + (data[i + ch] - Y) * 1.35, 0, 255) * 0.66 + WATER[ch] * 0.34;
            samples[o + 3] = Y / 255;
          }
        }
      } catch { samples = null; }
      kick();
    },
    paint(now) {
      if (!samples) return;
      if (active && !active()) { if (!blank) { ctx.clearRect(0, 0, W, H); blank = true; } return; }
      blank = false;
      const t = now / 1000, gx = gapX(), still = reducedMotion();
      ctx.clearRect(0, 0, W, H);
      ripples = ripples.filter(rp => t - rp.t0 < 2.6);
      for (let r = 0; r < rows; r++) {
        const y = r * GY + GY / 2, depth = r / rows;
        const fade = Math.pow(1 - depth, 1.7) * 0.56;
        if (fade < 0.02) continue;
        // Slow side-to-side bands, growing toward you; the picture itself shifts with them.
        const sway = still ? 0 : Math.sin(y * 0.05 - t * 0.9) * (0.4 + 9 * depth * depth) + Math.sin(y * 0.17 + t * 1.6) * (0.2 + 1.6 * depth);
        const shift = Math.round(sway / gx);
        // The sides fade in, more softly further down.
        const edge = 0.08 + depth * 0.24;
        for (let c = 0; c < cols; c++) {
          // Calm streaks and broken water: gaps open up the further down you look.
          const calm = still ? 1 : 0.55 + 0.45 * Math.sin(c * 0.31 + y * 0.23 - t * 1.2) * Math.sin(c * 0.09 - y * 0.06 + t * 0.6);
          if (calm < depth * 0.7) continue;
          const sc = clamp(c + shift, 0, cols - 1), o = (r * cols + sc) * 4, lum = samples[o + 3];
          const u = (c + 0.5) / cols, side = smooth(clamp(Math.min(u, 1 - u) / edge, 0, 1));
          let k = (0.16 + 0.84 * lum) * (still ? 0.9 : 0.82 + 0.18 * Math.sin(c * gx * 0.05 + y * 0.5 - t * 1.4));
          let a = fade * side;
          const x = c * gx + gx / 2 + (sway - shift * gx);
          for (const rp of ripples) {
            const age = t - rp.t0, ring = 8 + age * 70;
            const de = Math.hypot(x - rp.x, (y - rp.y) * 2.4);
            const boost = Math.exp(-((de - ring) ** 2) / 90) * Math.exp(-age * 1.5);
            k += boost * 0.6; a += boost * 0.35 * side;
          }
          // Long thin streaks where it's bright, short ticks where it's dark.
          const rx = Math.min(gx * 0.66, gx * 0.56 * k * (0.85 + 0.4 * depth)), ry = Math.max(0.45, 0.95 - depth * 0.35);
          if (rx < 0.45 || a < 0.015) continue;
          ctx.globalAlpha = Math.min(1, a);
          ctx.fillStyle = `rgb(${samples[o] | 0} ${samples[o + 1] | 0} ${samples[o + 2] | 0})`;
          ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
  const ripple = (x: number, y: number) => {
    if (reducedMotion()) return;
    const now = performance.now();
    if (now - last < 110) return;
    last = now; ripples.push({ x, y, t0: now / 1000 });
    if (ripples.length > 12) ripples.shift();
    kick();
  };
  // Pointing at the picture drops a ripple at the water's edge below it; pointing at the water drops one there.
  const overPicture = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ripple(e.clientX - r.left, 3); };
  const overWater = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ripple(e.clientX - r.left, e.clientY - r.top); };
  picture.addEventListener('pointermove', overPicture);
  canvas.addEventListener('pointermove', overWater);
  painters.add(painter); io?.observe(canvas);
  const resize = new ResizeObserver(() => painter.layout());
  resize.observe(picture);
  const imgs = [...picture.querySelectorAll('img')];
  const loaded = () => requestAnimationFrame(() => painter.layout());
  // Every load, not just the first: the home page gives a picture its src only when it's about to rise.
  imgs.forEach(img => img.addEventListener('load', loaded));
  loaded();
  return () => {
    gone = true; painters.delete(painter); io?.unobserve(canvas); resize.disconnect();
    picture.removeEventListener('pointermove', overPicture); canvas.removeEventListener('pointermove', overWater);
    imgs.forEach(img => img.removeEventListener('load', loaded));
  };
}

/** A ring of small gold dots spreads from wherever you press, and fades. Horizons ripple on their own instead. */
export function clickRipples() {
  if (reducedMotion()) return () => {};
  const c = document.createElement('canvas');
  c.className = 'sky-ripples'; c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const ctx = c.getContext('2d');
  if (!ctx) { c.remove(); return () => {}; }
  let rings: { x: number; y: number; t0: number }[] = [], loop = 0;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const tick = (now: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    rings = rings.filter(r => now - r.t0 < 900);
    for (const r of rings) {
      const a = (now - r.t0) / 900, e = 1 - Math.pow(1 - a, 3);
      const rad = 5 + e * 40, n = 16, dot = 0.5 + 1.5 * (1 - a);
      ctx.fillStyle = `rgb(233 184 96 / ${(0.8 * (1 - a)).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2, x = r.x + Math.cos(th) * rad, y = r.y + Math.sin(th) * rad;
        ctx.moveTo(x + dot, y); ctx.arc(x, y, dot, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    loop = rings.length ? requestAnimationFrame(tick) : 0;
  };
  const press = (e: PointerEvent) => {
    if ((e.target as Element | null)?.closest('.sky-lit, .sky-water')) return;
    rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    if (!loop) loop = requestAnimationFrame(tick);
  };
  size();
  addEventListener('resize', size);
  addEventListener('pointerdown', press, { passive: true });
  return () => { removeEventListener('resize', size); removeEventListener('pointerdown', press); cancelAnimationFrame(loop); c.remove(); };
}
