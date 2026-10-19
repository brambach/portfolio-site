import { frameRate, horizon, isNight, kick, MOON, mix, reflection, rgb, SUN, wake, type RGB, type SceneInfo } from './light';

/* The home page's one sun, from dawn to dusk.

   Dawn: the first screen is one wide horizon. The sun rises out of the water and glides along it to whichever
   project is current, climbing behind that project's picture so its top half shows over it. The picture rises out
   of the water in front of it, with its reflection below (and the sun's glitter hidden behind that reflection).

   The day: scroll, and the picture sinks back. The sun draws in to a small sun on the spot, which keeps its place in
   the sky while the page moves under it and drifts out to the right margin. Through the rest of the page it climbs
   to noon and comes down through the afternoon in that margin, never over the words, and at the end it comes down
   into the closing sunset and opens out into it. The sky's colour follows the time of day, and a small clock rides
   under the sun. Screens without a margin to spare skip the small sun and keep the colour and the two horizons.

   Smoothness: the small sun is drawn once and then only moved, scaled and faded, and the sky is a stack of
   gradients that only fade into each other, so scrolling never waits on drawing. The horizons share the light's
   frame loop, raised to 60 frames a second while this page is open. */

/** What the home page tells the sun about itself, updated as it renders. */
export type DayLive = {
  /** The project whose spot the sun goes to (its picture is up only at the top of the page). */
  current: number | null;
  /** Each project's spot on the horizon, and the picture width, in the first screen's pixels. */
  centers: number[];
  cardW: number;
  /** Arriving back from a project: the sun is already up, and already at its spot. */
  instant: boolean;
};
export type DayParts = {
  stage: HTMLElement; stageCanvas: HTMLCanvasElement;
  dusk: HTMLElement; duskCanvas: HTMLCanvasElement;
  sky: HTMLElement; sunLayer: HTMLElement; sun: HTMLElement; morning: HTMLCanvasElement; evening: HTMLCanvasElement; clock: HTMLElement;
  berths: HTMLElement[]; shots: HTMLElement[]; mirrors: HTMLCanvasElement[];
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number, a: number, b: number) => smooth(clamp((v - a) / Math.max(1, b - a), 0, 1));
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const width = () => document.documentElement.clientWidth;

/** The first screen is laid out for phones up to here. */
export const narrowDawn = () => width() <= 760;
/** The small sun needs a margin beside the 600px column to live in. */
const roomy = () => width() >= 1000;
const bigR = () => (width() < 700 ? 30 : 46);
const SMALL = 15, REACH = SMALL * 7, BOX = REACH * 2;
/** How much water the first screen has. On shorter wide screens there's less, so the index on the shore stays
 *  clear of the claim above it (it needs about 560px over the water). On phones it's kept low so the sun rising
 *  behind the picture stays under the words. */
export const waterFor = (stageHeight: number) => Math.round(narrowDawn()
  ? stageHeight * 0.26
  : Math.min(stageHeight * 0.36, Math.max(stageHeight * 0.24, stageHeight - 560)));

// The sky through the day: top, middle and bottom of the screen, in oklch. Hues are unwrapped (422 is 62) so the
// afternoon goes through violet and rose to amber, never green. All stay dark enough that --sky-faint text keeps
// about 4.6:1. At night the day is the same shape in deeper blues, under the moon.
type Stop = [number, [number, number, number], [number, number, number], [number, number, number]];
const DAY: Stop[] = [
  [0.00, [0.165, 0.030, 264], [0.200, 0.024, 284], [0.205, 0.016, 262]],
  [0.14, [0.180, 0.032, 260], [0.205, 0.030, 300], [0.222, 0.034, 330]],
  [0.38, [0.205, 0.036, 252], [0.215, 0.030, 245], [0.222, 0.026, 238]],
  [0.56, [0.222, 0.040, 246], [0.225, 0.032, 250], [0.228, 0.024, 262]],
  [0.76, [0.200, 0.030, 262], [0.215, 0.030, 300], [0.232, 0.046, 422]],
  [0.90, [0.185, 0.026, 285], [0.205, 0.026, 320], [0.232, 0.048, 396]],
  [1.00, [0.175, 0.024, 282], [0.200, 0.020, 300], [0.225, 0.026, 388]],
];
const NIGHT: Stop[] = [
  [0.00, [0.150, 0.030, 266], [0.175, 0.026, 276], [0.185, 0.020, 262]],
  [0.50, [0.165, 0.034, 262], [0.180, 0.028, 268], [0.190, 0.022, 258]],
  [1.00, [0.150, 0.026, 276], [0.175, 0.022, 288], [0.195, 0.020, 300]],
];
const ok = ([L, C, h]: [number, number, number]) => `oklch(${L} ${C} ${h % 360})`;

/** The clock: from 5:48 am at dawn to 7:44 pm at dusk. */
export function clockAt(D: number) {
  const m = Math.round(lerp(348, 1184, clamp(D, 0, 1))), h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** The small sun, in the same dots as the horizons, drawn once at the size it's shown. */
function paintSun(canvas: HTMLCanvasElement, [midC, highC]: [RGB, RGB]) {
  const c = canvas.getContext('2d');
  if (!c) return;
  const dpr = 3, x = REACH, y = REACH, r = SMALL;
  canvas.width = canvas.height = BOX * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const wash = c.createRadialGradient(x, y, r * 0.5, x, y, r * 7);
  wash.addColorStop(0, `rgb(${highC.join(' ')} / 0.13)`); wash.addColorStop(1, `rgb(${highC.join(' ')} / 0)`);
  c.fillStyle = wash; c.fillRect(0, 0, BOX, BOX);
  const gap = r / 3.4, maxR = gap * 0.46, reach = r * 3.4, n = Math.ceil(reach / gap);
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const dx = i * gap, dy = j * gap, d = Math.hypot(dx, dy);
    if (d > reach) continue;
    const B = d < r ? 1 : Math.exp(-(d - r) / (r * 0.75)) * 0.62, rad = maxR * Math.pow(B, 0.8);
    if (rad < 0.3) continue;
    c.fillStyle = rgb(B < 0.5 ? mix([70, 64, 82], midC, B / 0.5) : mix(midC, highC, (B - 0.5) / 0.5));
    c.beginPath(); c.arc(x + dx, y + dy, rad, 0, Math.PI * 2); c.fill();
  }
}

export function startDay(parts: DayParts, live: DayLive, onDock: (docked: boolean) => void) {
  const { stage, dusk: duskEl, berths, mirrors } = parts;
  const root = document.documentElement, night = isNight(), still = reducedMotion();
  const restoreRate = frameRate(60);

  // ---- where the day is, from the scroll position -----------------------------------------------------------
  //   gather  the dawn sun drawing in to the small sun, as the picture sinks
  //   leave   the small sun keeping its height while the page moves under it, out to the right margin
  //   day     morning to noon to evening, up and then down the margin
  //   arrive  down to where the sunset is, then
  //   open    out into it.
  // D is the time of day for the sky and the clock, 0 at dawn to 1 at dusk.
  function phases() {
    const H = innerHeight, y = scrollY, end = root.scrollHeight - H, wide = roomy();
    const dayFrom = H * 0.55, dayTo = end - H * 0.5, day = clamp((y - dayFrom) / Math.max(1, dayTo - dayFrom), 0, 1);
    return {
      gather: wide ? ease(y, H * 0.02, H * 0.15) : 0,
      leave: ease(y, H * 0.13, H * 0.55),
      day,
      arrive: ease(y, end - H * 0.5, end - H * 0.18),
      open: wide ? ease(y, end - H * 0.24, end) : 1,
      D: 0.14 * ease(y, 0, H * 0.5) + 0.72 * day + 0.14 * ease(y, dayTo, end),
    };
  }

  // The margin path: morning low on the inner side, noon high and a little further out, evening low again.
  const marginX = () => { const W = width(), m = (W - 600) / 2; return W - m * 0.5; };
  function path(day: number) {
    const H = innerHeight, m = (width() - 600) / 2;
    const y = day < 0.45 ? lerp(H * 0.42, H * 0.17, Math.sin((Math.PI / 2) * (day / 0.45)))
      : lerp(H * 0.17, H * 0.64, 1 - Math.cos((Math.PI / 2) * ((day - 0.45) / 0.55)));
    return { x: marginX() + m * 0.1 * Math.sin(Math.PI * day), y };
  }

  // ---- dawn ------------------------------------------------------------------------------------------------
  let sx: number | null = null, vx = 0, lift = 0, last = 0, dawnX = 0, dawnY = 0, snap = live.instant;
  let travelling: { x: number; y: number } | null = null;
  // How far each picture has risen (0 to 1), read from the page once a frame, for the reflections and the glitter.
  const risen = berths.map(() => 0);
  const target = (s: SceneInfo) => live.current == null ? s.W * 0.66 : live.centers[live.current] ?? s.W * 0.66;
  const wantLift = () => live.current == null ? 0 : live.cardW * 0.625 - bigR() * 0.75;
  let hiding = -1, hideL = 0, hideW = 1, hideH = 1, hideTop = 0;

  const dawn = horizon(stage, parts.stageCanvas, 'rise', {
    R: 46, Rs: 30, waterAt: () => waterFor(stage.clientHeight),
    sun(s, now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const tx = target(s), R = bigR();
      if (sx == null || still || snap) { sx = tx; vx = 0; }
      else { vx += (60 * (tx - sx) - 13 * vx) * dt; sx += vx * dt; }
      lift = still || snap ? wantLift() : lift + (wantLift() - lift) * Math.min(1, dt * 3);
      snap = false;
      const age = still || live.instant ? 1 : s.born == null ? 0 : 1 - Math.pow(1 - clamp((now - s.born) / 3200, 0, 1), 3);
      dawnX = sx; dawnY = s.hz + R * 1.15 - (R * 1.15 + R * 0.55) * age - lift;
      // Which picture is up, how far, and where its reflection lies, so the sun's glitter can hide behind it.
      const sr = stage.getBoundingClientRect();
      hiding = -1;
      berths.forEach((b, i) => {
        const card = b.firstElementChild as HTMLElement | null;
        if (!card) return;
        const br = b.getBoundingClientRect(), cr = card.getBoundingClientRect();
        risen[i] = br.height ? clamp(1 - (cr.top - br.top) / br.height, 0, 1) : 0;
        if (risen[i] > 0.01 && (hiding < 0 || risen[i] > risen[hiding])) {
          hiding = i; hideL = br.left - sr.left; hideW = br.width; hideH = mirrors[i].clientHeight || 1; hideTop = s.hz;
        }
      });
      if (travelling) return { x: travelling.x - sr.left, y: travelling.y - sr.top };
      return { x: dawnX, y: dawnY };
    },
    reach: () => lerp(bigR(), SMALL, phases().gather),
    disc: () => bigR() * (1 - phases().gather),
    hide(x, y) {
      if (hiding < 0) return 0;
      const u = (x - hideL) / hideW, d = (y - hideTop) / (hideH * risen[hiding]);
      if (u < -0.05 || u > 1.05 || d > 1) return 0;
      const side = smooth(clamp(Math.min(u, 1 - u) / 0.14 + 0.35, 0, 1));
      return side * Math.pow(1 - clamp(d, 0, 1), 0.9) * 0.92;
    },
    busy: () => Math.abs(vx) > 0.5 || (sx != null && Math.abs(target(dawn.scene) - sx) > 0.5) || Math.abs(lift - wantLift()) > 0.5 || risen.some(r => r > 0.01 && r < 0.99),
  });

  // The reflections draw only while their picture is at least partly up.
  const stopReflections = parts.shots.map((shot, i) => reflection(shot, mirrors[i], () => risen[i] > 0.01));

  // ---- dusk ------------------------------------------------------------------------------------------------
  // The dusk sun sits under the margin, so the small sun comes straight down into it.
  function duskSun(s: SceneInfo) {
    const R = bigR(), top = duskEl.getBoundingClientRect().top + scrollY;
    const p = clamp((scrollY + innerHeight - top) / Math.max(1, root.scrollHeight - top), 0, 1);
    return { x: roomy() ? marginX() : s.sx, y: s.hz - R * 1.8 + R * 2.25 * smooth(p) };
  }
  const dusk = horizon(duskEl, parts.duskCanvas, 'set', {
    sun: duskSun,
    reach: () => lerp(SMALL, bigR(), phases().open),
    disc: () => bigR() * phases().open,
  });

  // ---- the sky ----------------------------------------------------------------------------------------------
  const STOPS = night ? NIGHT : DAY;
  parts.sky.replaceChildren(...STOPS.map(([, top, mid, bot]) => {
    const layer = document.createElement('i');
    layer.style.background = `linear-gradient(to bottom, ${ok(top)}, ${ok(mid)} 55%, ${ok(bot)})`;
    return layer;
  }));
  const layers = [...parts.sky.children] as HTMLElement[];
  let lastLayer = -1, lastT = -1;
  function skyAt(D: number) {
    let i = 0;
    while (i < STOPS.length - 2 && D > STOPS[i + 1][0]) i++;
    const t = smooth(clamp((D - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0]), 0, 1));
    if (i === lastLayer && Math.abs(t - lastT) < 0.002) return;
    layers.forEach((el, k) => { el.style.opacity = k < i ? '0' : k === i ? '1' : k === i + 1 ? t.toFixed(3) : '0'; });
    lastLayer = i; lastT = t;
  }

  // ---- the small sun ----------------------------------------------------------------------------------------
  const { sun, morning, evening, clock, sunLayer } = parts;
  sun.style.width = sun.style.height = `${BOX}px`;
  paintSun(morning, night ? MOON.rise : SUN.rise); paintSun(evening, night ? MOON.set : SUN.set);

  let docked = scrollY < innerHeight * 0.04, frame = 0, followUntil = 0;
  // With reduced motion the horizons only draw when asked, and the scroll asks before the sun has moved, so draw
  // them again once it has.
  function update() {
    frame = 0;
    place();
    if (still) kick();
  }
  function place() {
    const ph = phases(), H = innerHeight;
    skyAt(ph.D);
    // A picture is up only at the top.
    const dock = scrollY < H * 0.04;
    if (dock !== docked) { docked = dock; onDock(dock); wake(); }
    const size = SMALL * ph.gather * (1 - ph.open);
    if (!roomy() || size < 0.4) { travelling = null; sun.style.visibility = 'hidden'; clock.classList.remove('is-on'); return; }
    // Out of the dawn sun, along the margin, down into the dusk sun.
    const hr = stage.getBoundingClientRect(), sr = duskEl.getBoundingClientRect(), p = path(ph.day), b = duskSun(dusk.scene);
    let x = lerp(hr.left + dawnX, p.x, ph.leave), y = lerp(hr.top + dawnY, p.y, ph.leave);
    x = lerp(x, sr.left + b.x, ph.arrive); y = lerp(y, Math.min(H - 30, sr.top + b.y), ph.arrive);
    travelling = { x, y };
    sun.style.visibility = 'visible';
    sun.style.transform = `translate3d(${(x - REACH).toFixed(2)}px, ${(y - REACH).toFixed(2)}px, 0) scale(${(size / SMALL).toFixed(4)})`;
    evening.style.opacity = clamp((ph.D - 0.55) / 0.4, 0, 1).toFixed(3);
    // Nothing of it shows below the dusk waterline, so it sets into the water rather than over it.
    const line = sr.top + dusk.scene.hz;
    sunLayer.style.setProperty('--below', `${(line < H ? H - line : 0).toFixed(1)}px`);
    if (!night) {
      clock.textContent = clockAt(ph.D);
      clock.style.transform = `translate3d(${(x - clock.offsetWidth / 2).toFixed(1)}px, ${(y + size * 1.7 + 12).toFixed(1)}px, 0)`;
      clock.classList.toggle('is-on', ph.leave > 0.85 && ph.arrive < 0.25);
    }
  }
  // The dawn sun may still be gliding while it gathers, so keep following for a moment after the last scroll.
  const tick = (now: number) => { update(); if (now < followUntil) frame = requestAnimationFrame(tick); };
  const schedule = () => { followUntil = still ? 0 : performance.now() + 450; if (!frame) frame = requestAnimationFrame(tick); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();

  const timers = new Set<number>();
  return {
    /** A ring in the water where picture i comes up. */
    splash(i: number, delayMs: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (docked && live.current === i) dawn.ripple(live.centers[i], dawn.scene.hz + 6);
      }, delayMs);
      timers.add(timer);
    },
    /** Something on the page moved the sun (a new project); draw for a while. */
    wake,
    stop() {
      removeEventListener('scroll', schedule); removeEventListener('resize', schedule);
      cancelAnimationFrame(frame); timers.forEach(t => clearTimeout(t));
      dawn.stop(); dusk.stop(); stopReflections.forEach(stop => stop()); restoreRate();
    },
  };
}
