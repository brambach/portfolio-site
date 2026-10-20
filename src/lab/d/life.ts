import { clamp, horizonAt, lightAt, lookAt, type RGB } from './day';

/* What lives in Direction D's landscape, drawn on a 2D canvas over the shader and under the words: grass along the
   bottom of the screen that leans in the wind, a little pollen drifting in the light, now and then a few birds
   crossing low over the hills, and rings on the water where something came up for air.

   All of it is meant to be noticed late. The grass is the darkest thing on the page, the pollen is a few pixels
   across, birds come every half a minute or so, and the rings fade in a few seconds. The wind is a slow wave
   that rolls along the grass; moving the pointer near the grass, or scrolling fast, adds a gust. */

type Blade = { x: number; h: number; w: number; phase: number; stiff: number; seed: boolean };
type Mote = { x: number; y: number; vx: number; vy: number; r: number; phase: number };
type Bird = { dx: number; dy: number; phase: number; size: number };
type Flock = { x: number; y: number; vx: number; vy: number; birds: Bird[] };
type Ring = { x: number; y: number; age: number; size: number; depth: number };

export type Life = {
  draw: (day: number, time: number, dt: number) => void;
  /** The pointer, in screen pixels, with its horizontal speed. */
  pointer: (x: number, y: number, vx: number) => void;
  /** A push of wind, from scrolling. */
  gust: (v: number) => void;
  /** A flock heading home toward the light. */
  flock: (count?: number) => void;
  stop: () => void;
};

const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a.toFixed(3)})`;
const mixC = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function startLife(canvas: HTMLCanvasElement, opts: { light: boolean; still: boolean }): Life | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let rand = 7;
  // A seeded random, so the grass grows the same way every visit.
  const rnd = () => { rand = (rand * 16807) % 2147483647; return (rand - 1) / 2147483646; };

  let W = 0, H = 0, dpr = 1;
  let back: Blade[] = [], front: Blade[] = [], motes: Mote[] = [];
  const grow = (n: number, tall: number) => {
    const out: Blade[] = [];
    for (let i = 0; i < n; i++) {
      const x = (i + rnd() * 0.9) / n;
      // Tufts: the grass is taller in clumps and thinner between them.
      const clump = 0.55 + 0.45 * Math.sin(x * 23.0 + 1.3) * Math.sin(x * 7.0 + 0.4);
      out.push({ x: x * W, h: tall * (0.35 + 0.65 * rnd()) * (0.5 + 0.5 * clump), w: 1.6 + rnd() * 2.6, phase: rnd() * 6.28, stiff: 0.7 + rnd() * 0.6, seed: rnd() < 0.06 });
    }
    return out;
  };
  const resize = () => {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    rand = 7;
    const scale = W / 1440;
    back = grow(Math.round((opts.light ? 90 : 200) * Math.max(0.6, scale)), H * (opts.light ? 0.05 : 0.06));
    front = grow(Math.round((opts.light ? 60 : 140) * Math.max(0.6, scale)), H * (opts.light ? 0.075 : 0.095));
    motes = Array.from({ length: opts.light ? 14 : 36 }, () => ({ x: rnd() * W, y: H * (0.25 + rnd() * 0.7), vx: (rnd() - 0.5) * 6, vy: -2 - rnd() * 5, r: 0.6 + rnd() * 1.1, phase: rnd() * 6.28 }));
  };
  resize();
  addEventListener('resize', resize);

  // ---- wind --------------------------------------------------------------------------------------------------
  let extra = 0, px = -1e4, py = -1e4, pv = 0, near = 0;
  const wind = (x: number, t: number) => {
    const roll = Math.pow(Math.max(0, Math.sin(t * 0.21 - x * 0.0023)), 3) * 0.55;
    return 0.16 * Math.sin(t * 0.8 + x * 0.005) + 0.09 * Math.sin(t * 1.9 + x * 0.017) + roll + extra;
  };

  // ---- birds and rings --------------------------------------------------------------------------------------
  let flocks: Flock[] = [], rings: Ring[] = [];
  let nextFlock = 9 + Math.random() * 8, nextRing = 4 + Math.random() * 4, clock = 0;
  let horizonY = H * 0.7;
  function addFlock(count: number, towardLight: boolean, day: number) {
    const light = lightAt(day, 0.3);
    const right = towardLight ? light.x > 0.5 : Math.random() < 0.5;
    const y = horizonY - H * (0.12 + Math.random() * 0.2);
    const birds: Bird[] = Array.from({ length: count }, (_, i) => {
      const k = i - (count - 1) / 2;
      // A loose V, each bird a little off its line.
      return { dx: -Math.abs(k) * 16 * (right ? 1 : -1) + (Math.random() - 0.5) * 8, dy: Math.abs(k) * 7 + (Math.random() - 0.5) * 6 - (k < 0 ? 3 : 0), phase: Math.random() * 6.28, size: 3.2 + Math.random() * 1.6 };
    });
    const speed = (opts.light ? 26 : 38) + Math.random() * 14;
    flocks.push({ x: right ? -60 : W + 60, y, vx: right ? speed : -speed, vy: -1.5 - Math.random() * 2, birds });
  }

  let shownDay = -1;
  function draw(day: number, time: number, dt: number) {
    const t = opts.still ? 0 : time;
    // With reduced motion the grass is drawn once per hour of the page and left there.
    if (opts.still && Math.abs(day - shownDay) < 0.002) return;
    shownDay = day;
    const look = lookAt(day), tall = H > W, horizon = horizonAt(day, tall), light = lightAt(day, horizon);
    horizonY = H * (1 - horizon);
    const lowLight = 1 - light.elev;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);

    if (!opts.still) {
      clock += dt;
      extra *= Math.exp(-dt * 1.6);
      near *= Math.exp(-dt * 2.5);

      // Pollen, brighter on the side the light comes from.
      const lx = clamp(light.x, -0.2, 1.2);
      for (const m of motes) {
        m.x += (m.vx + wind(m.x, t) * 22) * dt; m.y += (m.vy + Math.sin(t * 0.7 + m.phase) * 3) * dt;
        if (m.x > W + 10) m.x = -10; else if (m.x < -10) m.x = W + 10;
        if (m.y < H * 0.2) { m.y = H * (0.75 + Math.random() * 0.2); m.x = Math.random() * W; }
        const side = Math.exp(-Math.abs(m.x / W - lx) * 1.4);
        const a = (0.1 + 0.4 * side) * (0.5 + 0.5 * Math.sin(t * 1.3 + m.phase)) * (0.5 + 0.5 * lowLight) * clamp((m.y - H * 0.2) / (H * 0.15));
        if (a < 0.02) continue;
        ctx!.fillStyle = rgba(look.light, a);
        ctx!.beginPath(); ctx!.arc(m.x, m.y, m.r, 0, 6.283); ctx!.fill();
      }

      // Rings on the water, flattened the farther away they are.
      nextRing -= dt;
      if (nextRing <= 0) {
        nextRing = 5 + Math.random() * 7;
        const depth = Math.random() * 0.75;
        const waterBottom = H * 0.94;
        rings.push({ x: W * (0.35 + Math.random() * 0.6), y: horizonY + 6 + (waterBottom - horizonY - 6) * depth * depth, age: 0, size: 16 + depth * 40, depth });
      }
      rings = rings.filter(r => (r.age += dt) < 4.5);
      ctx!.lineWidth = 1;
      for (const r of rings) {
        for (let k = 0; k < 2; k++) {
          const age = r.age - k * 0.6;
          if (age <= 0) continue;
          const life = age / 3.9, rad = r.size * (0.15 + Math.sqrt(life));
          const a = (1 - life) * 0.28 * (0.6 + lowLight * 0.4);
          if (a <= 0) continue;
          ctx!.strokeStyle = rgba(mixC(look.haze, look.light, 0.5), a);
          ctx!.beginPath(); ctx!.ellipse(r.x, r.y, rad, rad * (0.1 + r.depth * 0.22), 0, 0, 6.283); ctx!.stroke();
        }
      }

      // Birds.
      nextFlock -= dt;
      if (nextFlock <= 0) { nextFlock = 30 + Math.random() * 22; addFlock(3 + Math.floor(Math.random() * 3), false, day); }
      flocks = flocks.filter(f => f.x > -200 && f.x < W + 200);
      ctx!.strokeStyle = rgba(mixC(look.land, look.zenith, 0.3), 0.8);
      ctx!.lineWidth = 1.3; ctx!.lineCap = 'round';
      for (const f of flocks) {
        f.x += f.vx * dt; f.y += f.vy * dt + Math.sin(clock * 0.6) * 0.1;
        ctx!.beginPath();
        for (const b of f.birds) {
          const bx = f.x + b.dx, by = f.y + b.dy + Math.sin(clock * 1.3 + b.phase) * 1.5, s = b.size;
          const flap = Math.sin(clock * 7.5 + b.phase);
          ctx!.moveTo(bx - s, by - flap * s * 0.6);
          ctx!.quadraticCurveTo(bx - s * 0.45, by - s * 0.15 - flap * s * 0.25, bx, by);
          ctx!.quadraticCurveTo(bx + s * 0.45, by - s * 0.15 - flap * s * 0.25, bx + s, by - flap * s * 0.6);
        }
        ctx!.stroke();
      }
    }

    // Grass: the row behind is hazier, the row in front darker, and both catch a little of the light at the tips.
    const layer = (blades: Blade[], base: RGB, lit: number, sway: number) => {
      const top = H - Math.max(...blades.map(b => b.h), 1);
      const g = ctx!.createLinearGradient(0, H, 0, top);
      g.addColorStop(0, rgba(base, 1));
      g.addColorStop(0.6, rgba(mixC(base, look.haze, 0.18), 1));
      g.addColorStop(1, rgba(mixC(base, look.light, lit), 1));
      ctx!.fillStyle = g;
      ctx!.beginPath();
      const seeds: [number, number][] = [];
      for (const b of blades) {
        let lean = wind(b.x, t + b.phase * 0.05) * sway / b.stiff;
        if (near > 0.01) {
          const d = b.x - px, R = 150;
          if (Math.abs(d) < R) lean += Math.sign(d || 1) * (1 - Math.abs(d) / R) ** 2 * near * (0.6 + Math.abs(pv) * 0.02);
        }
        lean = clamp(lean, -1.1, 1.1);
        const bend = lean * b.h * 0.55;
        const tipX = b.x + bend, tipY = H - b.h * (1 - 0.18 * lean * lean);
        const midX = b.x + bend * 0.35, midY = H - b.h * 0.55;
        ctx!.moveTo(b.x - b.w / 2, H + 2);
        ctx!.quadraticCurveTo(midX - b.w * 0.25, midY, tipX, tipY);
        ctx!.quadraticCurveTo(midX + b.w * 0.25, midY, b.x + b.w / 2, H + 2);
        if (b.seed) seeds.push([tipX, tipY]);
      }
      ctx!.fill();
      // A few stems carry seed heads, which hold the light longer than the blades.
      if (seeds.length) {
        ctx!.fillStyle = rgba(mixC(base, look.light, lit + 0.12), 1);
        ctx!.beginPath();
        for (const [x, y] of seeds) { ctx!.moveTo(x + 1.6, y - 3); ctx!.ellipse(x, y - 3, 1.6, 4.2, 0.1, 0, 6.283); }
        ctx!.fill();
      }
    };
    const dark: RGB = mixC(look.land, [0, 0, 0], 0.35);
    layer(back, mixC(look.land, look.haze, 0.22), 0.1 + 0.12 * lowLight, 0.75);
    layer(front, dark, 0.06 + 0.12 * lowLight, 1);
  }

  return {
    draw,
    pointer(x, y, vx) {
      px = x; py = y; pv = vx;
      // Only a hand near the grass pushes it, and a fast one sends a gust along the whole row.
      const close = clamp((py - H * 0.62) / (H * 0.25));
      near = Math.max(near, close);
      extra = clamp(extra + vx * 0.0006 * (0.3 + close), -0.6, 0.6);
    },
    gust(v) { extra = clamp(extra + v * 0.00012, -0.5, 0.5); },
    flock(count = 7) { if (!opts.still) addFlock(count, true, shownDay < 0 ? 1 : shownDay); },
    stop() { removeEventListener('resize', resize); },
  };
}
