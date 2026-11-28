import type { Creature, Env, Floor } from './creature';
import { catmull } from './creature';
import { clamp, line, quad, rand, ring, stroke } from './ink';
import type { StageId } from './copy';

/* What happens when a creature lands on a project's stage. Each project gets a small scene that says something
   about it without a word: it gets rained on at dryline (a forecast for muddy trails) until the sun comes out, chases a
   cat at comehome (lost pets) until the cat is found sitting on the picture, gets traced over at Trace, gets copied a
   beat late at easeprint (it copies motion), falls asleep and gets pinged awake at Dervo, and so on. Everything is
   ink drawn on the spot, boiling like the creature does. A scene directs the creature while it plays, then lets it
   go. */

export type Box = { x: number; y: number; w: number; h: number };
export type Stage = { id: StageId; floor: Floor; pic: Box; room: { x0: number; x1: number; y0: number } };
export type Kit = { nib(x: number, y: number, alpha?: number): void; reduced: boolean };
export type Play = {
  /** The creature is free again. */
  done: boolean;
  step(t: number, env: Env): void;
  draw(ctx: CanvasRenderingContext2D, t: number): void;
  /** Hands over something from the scene that goes on with the creature (the cat), and stops drawing it. */
  release?(): { x: number; y: number } | null;
};

type XY = [number, number];
const TAU = Math.PI * 2;
const back = (u: number) => { const c = 1.7, v = clamp(u, 0, 1) - 1; return 1 + (c + 1) * v * v * v + c * v * v; };
const smooth = (u: number) => { const v = clamp(u, 0, 1); return v * v * (3 - 2 * v); };
const part = (pts: XY[], u: number) => pts.slice(0, Math.max(2, Math.ceil(pts.length * clamp(u, 0, 1))));
/** Fill in points along each straight run, so a two point line is drawn as a line and not as a dot. */
const dense = (pts: XY[]): XY[] => {
  const out: XY[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
    for (let j = 1; j <= n; j++) out.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  return out;
};
const ink = (ctx: CanvasRenderingContext2D, pts: XY[], w: number, t: number, seed = 0, boil = 0.45) => { if (pts.length > 1) line(ctx, stroke(pts.length < 12 ? dense(pts) : pts, w, 0.7, 0.85), boil, Math.floor(t * 9) + seed); };
const W = 2.4;

/** A rounded box as one line, starting top left. */
function roundBox(x: number, y: number, w: number, h: number, r: number): XY[] {
  const out: XY[] = [];
  const c = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  c(x + w - r, y + r, -Math.PI / 2); c(x + w - r, y + h - r, 0); c(x + r, y + h - r, Math.PI / 2); c(x + r, y + r, Math.PI);
  out.push(out[0]);
  return out;
}
const squiggle = (x0: number, x1: number, y: number, amp: number, seed: number): XY[] => {
  const out: XY[] = [];
  for (let x = x0; x <= x1; x += 2.5) out.push([x, y + Math.sin(x * 0.45 + seed) * amp + Math.sin(x * 0.13 + seed * 2) * amp * 0.6]);
  return out;
};
const check = (x: number, y: number, s: number): XY[] => [[x - s * 0.5, y], [x - s * 0.1, y + s * 0.42], [x + s * 0.6, y - s * 0.5]];
const heart = (x: number, y: number, s: number): XY[] => {
  const out: XY[] = [];
  for (let i = 0; i <= 28; i++) {
    const a = (i / 28) * TAU;
    out.push([x + s * 0.06 * 16 * Math.pow(Math.sin(a), 3), y - s * 0.06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]);
  }
  return out;
};
const scale = (s: Stage) => clamp((s.room.x1 - s.room.x0) / 320, 0.75, 1.1);
/** Which side of the creature the picture is on. */
const toward = (s: Stage, g: Creature) => (s.pic.x + s.pic.w / 2 < g.x ? -1 : 1);

function once() {
  const done = new Set<string>();
  return (key: string, ok: boolean, fn: () => void) => { if (ok && !done.has(key)) { done.add(key); fn(); } };
}

export function play(stage: Stage, g: Creature, t0: number, kit: Kit): Play {
  g.script = true;
  const make = SCENES[stage.id] ?? SCENES.teammate;
  return make(stage, g, t0, kit);
}

type Make = (s: Stage, g: Creature, t0: number, kit: Kit) => Play;

const SCENES: Record<StageId, Make> = {
  // A small business texts it: a message bubble, a couple of nods, a check.
  teammate(s, g, t0) {
    const at = once(), sc = scale(s), side = toward(s, g);
    let bx = 0, by = 0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        bx = g.x + side * (g.half + 52 * sc) - (side < 0 ? 0 : 0); by = g.top - 40 * sc;
        bx = clamp(bx, s.room.x0 - 40, s.room.x1 + 40);
        at('look', e > 0.35, () => { g.lookAt({ x: bx, y: by }, t + 2.6); env.sounds?.pop(40); });
        at('nod1', e > 1.5, () => { g.sqv -= 4; });
        at('nod2', e > 1.85, () => { g.sqv -= 4; });
        at('yes', e > 2.3, () => { g.say('happy', t + 1.3); g.hop(env, 0, 300); env.sounds?.giggle(40); });
        if (e > 4) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e < 0.3 || e > 4) return;
        const k = e < 3.6 ? back((e - 0.3) / 0.35) : 1 - smooth((e - 3.6) / 0.3);
        const w = 96 * sc * k, h = 50 * sc * k, x = bx - w / 2, y = by - h / 2;
        if (k < 0.05) return;
        ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.restore();
        ink(ctx, roundBox(x, y, w, h, 12 * k), W * 0.9, t, 1);
        const tx = side < 0 ? x + w * 0.7 : x + w * 0.3;
        ink(ctx, [[tx - 6 * k, y + h - 1], [tx - side * 10 * k, y + h + 12 * k], [tx + 8 * k, y + h - 1]], W * 0.85, t, 2);
        if (k > 0.9) {
          ink(ctx, part(squiggle(x + 12, x + w - 16, y + h * 0.36, 1.6, 1), (e - 0.6) / 0.5), 1.8, t, 3);
          ink(ctx, part(squiggle(x + 12, x + w * 0.6, y + h * 0.66, 1.6, 4), (e - 1.05) / 0.4), 1.8, t, 4);
        }
        if (e > 2.25) {
          const cx = x + w - 4, cy = y + 2, r = 11 * sc * back((e - 2.25) / 0.3);
          ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.restore();
          ink(ctx, ring(cx, cy, r, r, 18, -1.2), W * 0.85, t, 5);
          ink(ctx, part(check(cx, cy, r * 0.9), (e - 2.4) / 0.25), W, t, 6);
        }
      },
    };
    return p;
  },

  // It dozes off while the agents work, then gets pinged.
  dervo(s, g, t0) {
    const at = once(), side = toward(s, g), sc = scale(s);
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        at('sleep', e > 0.3, () => g.say('sleepy', t + 2.4));
        at('ping', e > 2.75, () => { g.say('surprised', t + 0.6); g.hop(env, 0, 430); env.sounds?.pop(30); });
        at('glad', e > 3.4, () => g.say('happy', t + 1));
        if (e > 4.2) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        for (let i = 0; i < 4; i++) {
          const age = e - 0.6 - i * 0.48;
          if (age < 0 || age > 1.7 || e > 2.8) continue;
          const z = (5 + age * 4) * sc, x = g.x - side * (g.half * 0.3 + 8 + age * 16), y = g.top - 10 - age * 40 * sc;
          ctx.save(); ctx.globalAlpha = clamp(1 - age / 1.7, 0, 1) * clamp(age * 5, 0, 1);
          ink(ctx, [[x - z, y - z], [x + z, y - z], [x - z, y + z], [x + z, y + z]], 1.9, t, i);
          ctx.restore();
        }
        if (e > 2.7 && e < 4.1) {
          const k = e < 3.7 ? back((e - 2.7) / 0.25) : 1 - smooth((e - 3.7) / 0.4), x = g.x, y = g.top - 30 * sc;
          ctx.save(); ctx.globalAlpha = clamp(k, 0, 1);
          ink(ctx, [[x, y - 18 * k], [x + 0.5, y - 5 * k]], 3.2, t, 7);
          ctx.beginPath(); ctx.arc(x, y + 1, 2 * k, 0, TAU); ctx.fill();
          ctx.restore();
        }
      },
    };
    return p;
  },

  // Two villagers come over and say hello. One of them is thinking about the creature.
  psyche(s, g, t0) {
    const at = once(), sc = scale(s), from = g.x < (s.room.x0 + s.room.x1) / 2 ? 1 : -1;
    const folk = [{ x: from > 0 ? s.room.x1 + 40 : s.room.x0 - 40, stop: 40 * sc + g.half, h: 56 * sc, ph: 0 }, { x: from > 0 ? s.room.x1 + 80 : s.room.x0 - 80, stop: 82 * sc + g.half, h: 47 * sc, ph: 1.7 }];
    let last = t0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0, dt = Math.min(0.05, t - last); last = t;
        for (const f of folk) {
          const goal = e < 3.4 ? g.x + from * f.stop : (from > 0 ? s.room.x1 + 90 : s.room.x0 - 90);
          const d = goal - f.x;
          if (Math.abs(d) > 1) { f.x += Math.sign(d) * Math.min(Math.abs(d), 120 * sc * dt); f.ph += dt * 10; }
        }
        at('see', e > 0.4, () => g.lookAt({ x: folk[0].x, y: s.floor.y - 30 }, t + 1.2));
        at('wave', e > 1.7, () => { g.wave(1.5, t); g.say('happy', t + 1.8); env.sounds?.giggle(50); });
        at('hop', e > 3.3, () => g.hop(env, 0, 280));
        if (e > 4) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e > 5.6) return;
        // They fade in from the edge of the room and out again on the way home.
        ctx.save();
        ctx.globalAlpha = Math.min(smooth(e / 0.4), 1 - smooth((e - 4.7) / 0.8));
        folk.forEach((f, i) => {
          const fy = s.floor.y, h = f.h, r = h * 0.17, walking = e < 1.6 || e > 3.4;
          const face = e < 3.4 ? -from : from;
          const hip: XY = [f.x, fy - h * 0.38], neck: XY = [f.x, fy - h + r * 2.1];
          const sw = walking ? Math.sin(f.ph) * h * 0.2 : 0;
          ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, fy - h + r, r, 0, TAU); ctx.fill(); ctx.restore();
          ink(ctx, ring(f.x, fy - h + r, r, r, 14, i), 1.9, t, 10 + i);
          ink(ctx, [neck, hip], 2.1, t, 12 + i);
          ink(ctx, [hip, [f.x + sw, fy]], 2, t, 14 + i);
          ink(ctx, [hip, [f.x - sw, fy]], 2, t, 16 + i);
          const sh: XY = [f.x, neck[1] + h * 0.1];
          const waving = e > 1.6 && e < 3.3;
          const up = waving ? Math.sin(t * 14 + i) * 0.5 : 0;
          ink(ctx, [sh, [f.x - face * h * 0.24, sh[1] + h * 0.26]], 1.9, t, 18 + i);
          ink(ctx, waving ? [sh, [f.x + face * h * 0.2, sh[1] - h * 0.12], [f.x + face * h * (0.26 + up * 0.2), sh[1] - h * 0.34]] : [sh, [f.x + face * h * 0.22, sh[1] + h * 0.25]], 1.9, t, 20 + i);
          if (i === 0 && e > 2 && e < 3.5) {
            const k = e < 3.2 ? back((e - 2) / 0.3) : 1 - smooth((e - 3.2) / 0.3);
            const bx = f.x + face * 10 * sc, by = fy - h - 26 * sc;
            ctx.save(); ctx.globalAlpha = clamp(k, 0, 1);
            ctx.beginPath(); ctx.arc(f.x + face * 3, fy - h - 5, 1.6, 0, TAU); ctx.arc(f.x + face * 6, fy - h - 11, 2.2, 0, TAU); ctx.fill();
            ink(ctx, heart(bx, by, 11 * sc * k), 2, t, 22);
            ctx.restore();
          }
        });
        ctx.restore();
      },
    };
    return p;
  },

  // A receipt unrolls next to it with every line checked, and it reads it top to bottom.
  receipts(s, g, t0) {
    const at = once(), sc = scale(s), side = toward(s, g);
    const rw = 64 * sc, full = 122 * sc;
    let x = 0, top = 0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        x = clamp(g.x + side * (g.half + 26 * sc) - (side < 0 ? rw : 0), s.room.x0 - 30, s.room.x1 + 30 - rw);
        top = s.floor.y - full - 34 * sc;
        for (let i = 0; i < 4; i++) at(`row${i}`, e > 1.05 + i * 0.38, () => { g.lookAt({ x: x + rw / 2, y: top + 18 * sc + i * 24 * sc }, t + 0.6); env.sounds?.pop(110); });
        at('ok', e > 2.8, () => { g.say('happy', t + 1.2); g.hop(env, 0, 300); });
        if (e > 3.8) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e < 0.2 || e > 4.6) return;
        const len = full * (e < 3.9 ? smooth((e - 0.2) / 0.75) : 1 - smooth((e - 3.9) / 0.6));
        if (len < 2) return;
        ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x, top, rw, len); ctx.restore();
        ink(ctx, [[x - 4, top], [x + rw + 4, top]], 3.4, t, 1);
        ink(ctx, [[x, top], [x, top + len]], 1.9, t, 2);
        ink(ctx, [[x + rw, top], [x + rw, top + len]], 1.9, t, 3);
        const zig: XY[] = [];
        for (let i = 0; i <= 8; i++) zig.push([x + (i * rw) / 8, top + len + (i % 2 ? 4 : 0)]);
        ink(ctx, zig, 1.9, t, 4);
        for (let i = 0; i < 4; i++) {
          const y = top + 18 * sc + i * 24 * sc;
          if (y > top + len - 8) break;
          ink(ctx, part(squiggle(x + 8, x + rw - 24, y, 1.3, i * 3), (e - 0.9 - i * 0.38) / 0.25), 1.6, t, 5 + i);
          if (e > 1.05 + i * 0.38) ink(ctx, part(check(x + rw - 12, y, 9 * sc), (e - 1.05 - i * 0.38) / 0.18), 2.4, t, 9 + i);
        }
      },
    };
    return p;
  },

  // Three snapshots drop in one by one; it likes them.
  tastepack(s, g, t0) {
    const at = once(), sc = scale(s), side = toward(s, g);
    const snaps = [0, 1, 2].map(i => ({ at: 0.3 + i * 0.45, dx: g.half + 34 * sc + i * 34 * sc, rot: rand(-0.22, 0.22), kind: i }));
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        snaps.forEach((n, i) => at(`land${i}`, e > n.at + 0.34, () => { g.lookAt({ x: g.x + side * n.dx, y: s.floor.y - 20 }, t + 0.5); env.sounds?.land(30); }));
        at('love', e > 1.95, () => { g.say('happy', t + 1.6); g.hop(env, 0, 330); env.sounds?.giggle(40); });
        if (e > 3.8) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e > 5) return;
        const fade = e > 4.4 ? 1 - smooth((e - 4.4) / 0.6) : 1;
        ctx.save(); ctx.globalAlpha = fade;
        for (const n of snaps) {
          const u = (e - n.at) / 0.34;
          if (u < 0) continue;
          const S = 38 * sc, x = g.x + side * n.dx, y = s.floor.y - S * 0.62 - 260 * (1 - smooth(Math.min(1, u))) + (u > 1 && u < 1.4 ? -Math.sin((u - 1) / 0.4 * Math.PI) * 5 : 0);
          ctx.save(); ctx.translate(x, y); ctx.rotate(n.rot);
          ctx.fillStyle = '#fff'; ctx.fillRect(-S / 2, -S / 2, S, S * 1.2);
          ctx.fillStyle = '#111110';
          ink(ctx, roundBox(-S / 2, -S / 2, S, S * 1.2, 2), 1.8, t, n.kind);
          ink(ctx, roundBox(-S / 2 + 4, -S / 2 + 4, S - 8, S * 0.78, 1), 1.3, t, n.kind + 4);
          // What's in each picture.
          if (n.kind === 0) ink(ctx, [[-S / 2 + 6, S * 0.2], [-S * 0.1, -S * 0.12], [S * 0.06, S * 0.06], [S * 0.18, -S * 0.04], [S / 2 - 6, S * 0.2]], 1.4, t, 8);
          else if (n.kind === 1) ink(ctx, ring(0, -S * 0.02, S * 0.16, S * 0.16, 12), 1.4, t, 9);
          else ink(ctx, squiggle(-S / 2 + 7, S / 2 - 7, 0, 2.2, 2), 1.4, t, 10);
          ctx.restore();
        }
        ctx.restore();
        if (e > 1.95 && e < 3.9) {
          const k = e < 3.4 ? back((e - 1.95) / 0.3) : 1 - smooth((e - 3.4) / 0.5);
          ink(ctx, heart(g.x, g.top - 22 * sc - (e - 1.95) * 6, 12 * sc * k), 2.2, t, 11);
        }
      },
    };
    return p;
  },

  // The pen comes down and traces around it, like a correction, then the trace settles onto it.
  trace(s, g, t0, kit) {
    const at = once();
    let shape: { x: number; y: number }[] = [], cx = 0, cy = 0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        at('look', e > 0.25, () => { g.say('surprised', t + 1.3); });
        at('glad', e > 1.9, () => { g.say('happy', t + 1.2); g.hop(env, 0, 300); env.sounds?.giggle(40); });
        if (e < 1.7) {
          shape = g.outline(t);
          cx = 0; cy = 0; for (const q of shape) { cx += q.x; cy += q.y; } cx /= shape.length || 1; cy /= shape.length || 1;
          g.lookAt(tip(e), t + 0.2);
        }
        if (e > 3.2) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e < 0.3 || e > 3 || shape.length < 3) return;
        const grow = e < 1.8 ? 1.24 : 1.24 - 0.24 * smooth((e - 1.8) / 0.7);
        const u = smooth((e - 0.3) / 1.3);
        const n = Math.floor(shape.length * u);
        ctx.save();
        ctx.globalAlpha = e > 2.3 ? 1 - smooth((e - 2.3) / 0.6) : 1;
        // Dashes: a pencil going round.
        for (let i = 0; i < n - 1; i += 6) {
          const dash = shape.slice(i, Math.min(n, i + 4)).map((a): XY => [cx + (a.x - cx) * grow, cy + (a.y - cy) * grow]);
          if (dash.length > 1) ink(ctx, dash, 2, t, i, 0.3);
        }
        ctx.restore();
        if (e < 1.7) { const q = tip(e); kit.nib(q.x, q.y); }
      },
    };
    function tip(e: number) {
      const i = clamp(Math.floor(shape.length * smooth((e - 0.3) / 1.3)), 0, Math.max(0, shape.length - 1));
      const q = shape[i] ?? { x: g.x, y: g.y };
      return { x: cx + (q.x - cx) * 1.24, y: cy + (q.y - cy) * 1.24 };
    }
    return p;
  },

  // An echo appears beside it and copies every move, a beat late.
  easeprint(s, g, t0) {
    const at = once(), side = toward(s, g) * -1;
    const room = (s.room.x1 - s.room.x0);
    const dx = side * Math.min(g.half * 2 + 26, room * 0.4);
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        at('a', e > 0.7, () => g.hop(env, 0, 380));
        at('b', e > 1.5, () => g.hop(env, 0, 250));
        at('c', e > 2.3, () => g.hop(env, 0, 470));
        at('see', e > 2.95, () => { g.lookAt({ x: g.x + dx, y: g.y }, t + 1); g.say('happy', t + 1); });
        if (e > 4) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e < 0.15 || e > 4.3) return;
        const a = e < 0.6 ? smooth((e - 0.15) / 0.45) : e > 3.8 ? 1 - smooth((e - 3.8) / 0.5) : 1;
        g.drawEcho(ctx, t, 0.32, dx, 0.3 * a);
      },
    };
    return p;
  },

  // A rain cloud parks over it. It shivers. Then the sun comes out and it shakes itself dry.
  dryline(s, g, t0, kit) {
    const at = once(), sc = scale(s), side = toward(s, g);
    const drops: { x: number; y: number; v: number; splash: number }[] = [];
    let last = t0, cx = g.x, cy = 0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0, dt = Math.min(0.05, t - last); last = t;
        const come = 1 - smooth(e / 0.9), go = smooth((e - 3.4) / 0.9);
        cx = g.x + side * 220 * come - side * 260 * go;
        cy = g.top - 70 * sc;
        if (e > 0.9 && e < 3.4 && !kit.reduced) for (let i = 0; i < 2; i++) if (Math.random() < 0.5) drops.push({ x: cx + rand(-40, 40) * sc, y: cy + 10 * sc, v: rand(420, 560), splash: 0 });
        for (const d of drops) { if (d.splash) d.splash += dt; else { d.y += d.v * dt; d.x -= d.v * dt * 0.08; if (d.y >= s.floor.y - 1) { d.y = s.floor.y - 1; d.splash = 0.001; } } }
        for (let i = drops.length - 1; i >= 0; i--) if (drops[i].splash > 0.18) drops.splice(i, 1);
        at('cold', e > 1.1, () => g.shiver(t + 2.3));
        at('sun', e > 3.85, () => { g.say('happy', t + 1.6); g.jelly = 0.9; g.hop(env, 0, 320); env.sounds?.giggle(40); });
        if (e > 5.2) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e > 6.4) return;
        if (e < 4.4) {
          const r = 19 * sc, x = cx, y = cy;
          const out = catmull([[x - 2.6 * r, y + r * 0.6], [x - 2.7 * r, y - r * 0.1], [x - 1.6 * r, y - r * 0.6], [x - 0.9 * r, y - r * 1.35], [x + 0.3 * r, y - r * 1.4], [x + 1.1 * r, y - r * 0.8], [x + 2.2 * r, y - r * 0.7], [x + 2.8 * r, y + r * 0.1], [x + 2.3 * r, y + r * 0.6], [x - 2.6 * r, y + r * 0.6]], 6);
          ctx.save(); ctx.globalAlpha = e > 3.6 ? 1 - smooth((e - 3.6) / 0.8) : 1;
          ctx.fillStyle = '#fff'; ctx.beginPath(); out.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill(); ctx.fillStyle = '#111110';
          ink(ctx, out, 2.5, t, 1, 0.6);
          ctx.restore();
        }
        for (const d of drops) {
          if (d.splash) { const k = d.splash / 0.18 * 5; ink(ctx, [[d.x - 1, d.y], [d.x - 2 - k, d.y - 3 - k * 0.4]], 1.3, t, 2); ink(ctx, [[d.x + 1, d.y], [d.x + 2 + k, d.y - 3 - k * 0.4]], 1.3, t, 3); }
          else ink(ctx, [[d.x, d.y], [d.x + 1.4, d.y - 11 * sc]], 2.1, t, 4, 0.2);
        }
        if (e > 3.7) {
          const k = e < 5.6 ? back((e - 3.7) / 0.4) : 1 - smooth((e - 5.6) / 0.7), r = 12 * sc * k;
          const x = g.x - side * (g.half + 40 * sc), y = g.top - 52 * sc;
          ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
          ink(ctx, ring(x, y, r, r, 20, 0.3), 2.3, t, 5);
          for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + t * 0.6; ink(ctx, [[x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45], [x + Math.cos(a) * r * 1.9, y + Math.sin(a) * r * 1.9]], 1.9, t, 6 + i); }
        }
      },
    };
    return p;
  },

  // A cat bolts past. It gives chase. The cat ends up sitting on top of the picture, found.
  comehome(s, g, t0) {
    const at = once(), sc = scale(s);
    const dir = s.pic.x + s.pic.w / 2 < g.x ? -1 : 1;
    const perch = { x: dir < 0 ? s.pic.x + s.pic.w * 0.78 : s.pic.x + s.pic.w * 0.22, y: s.pic.y - 9 };
    const cat = { x: dir < 0 ? s.room.x1 + 60 : s.room.x0 - 60, y: s.floor.y, mode: 'run' as 'run' | 'leap' | 'sit', at: 0, from: { x: 0, y: 0 }, ph: 0, face: dir };
    const edge = dir < 0 ? s.room.x0 + 6 : s.room.x1 - 6;
    let last = t0;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0, dt = Math.min(0.05, t - last); last = t;
        if (cat.mode === 'run' && e > 0.25) {
          cat.x += dir * 250 * sc * dt; cat.ph += dt * 16;
          const goal = dir < 0 ? Math.min(edge, perch.x + 40) : Math.max(edge, perch.x - 40);
          if ((dir < 0 && cat.x <= goal) || (dir > 0 && cat.x >= goal)) { cat.mode = 'leap'; cat.at = t; cat.from = { x: cat.x, y: cat.y }; env.sounds?.boing(20); }
        } else if (cat.mode === 'leap') {
          const u = clamp((t - cat.at) / 0.5, 0, 1);
          cat.x = cat.from.x + (perch.x - cat.from.x) * u;
          cat.y = cat.from.y + (perch.y - cat.from.y) * u - 4 * Math.max(60, cat.from.y - perch.y) * 0.35 * u * (1 - u);
          if (u >= 1) { cat.mode = 'sit'; cat.y = perch.y; env.sounds?.land(20); }
        }
        const passed = (dir < 0 && cat.x < g.x) || (dir > 0 && cat.x > g.x);
        at('see', e > 0.3, () => { g.say('surprised', t + 0.7); });
        if (passed && cat.mode === 'run') { g.hurry = 2.4; g.goal = clamp(cat.x - dir * 30, s.room.x0 + g.half + 4, s.room.x1 - g.half - 4); }
        if (cat.mode !== 'run') { g.goal = null; g.lookAt({ x: cat.x, y: cat.y - 12 }, t + 0.3); }
        at('found', cat.mode === 'sit', () => { g.hurry = 1; g.say('happy', t + 1.5); g.hop(env, 0, 340); env.sounds?.giggle(40); });
        if (cat.mode === 'sit' && t - cat.at > 1.6) { p.done = true; g.script = false; g.hurry = 1; }
      },
      draw(ctx, t) {
        const e = t - t0;
        if (e < 0.25 || gone) return;
        drawCat(ctx, cat.x, cat.y, sc, cat.mode === 'sit' ? 'sit' : 'run', cat.ph, cat.face, t);
      },
      release() { if (gone || cat.mode !== 'sit') return null; gone = true; return { x: cat.x, y: cat.y }; },
    };
    let gone = false;
    return p;
  },

  // A lap of the stage at a jog, footprints behind it, and a little flag at the end. Every day counts.
  arro(s, g, t0) {
    const at = once(), sc = scale(s);
    const marks: { x: number; y: number; at: number }[] = [];
    let leg = 0, lastX = g.x, side = 1, flagAt = -1;
    const a = s.room.x0 + g.half + 10, b = s.room.x1 - g.half - 10;
    const p: Play = {
      done: false,
      step(t, env) {
        const e = t - t0;
        if (e > 0.25 && leg === 0) { leg = 1; g.hurry = 1.7; g.goal = Math.abs(g.x - a) > Math.abs(g.x - b) ? a : b; }
        if (leg > 0 && leg < 3 && g.goal === null) { leg++; g.goal = leg === 2 ? (Math.abs(g.x - a) < Math.abs(g.x - b) ? b : a) : null; }
        if (leg === 3 && flagAt < 0) { leg = 4; flagAt = t; g.hurry = 1; g.say('happy', t + 1.4); g.hop(env, 0, 360); env.sounds?.giggle(40); }
        if (Math.abs(g.x - lastX) > 13 * sc && g.standing) { side = -side; marks.push({ x: g.x, y: s.floor.y - 3 + side * 1.5, at: t }); lastX = g.x; }
        if (e > 7 && leg < 3) { leg = 3; }
        if (flagAt > 0 && t - flagAt > 1.3) { p.done = true; g.script = false; }
      },
      draw(ctx, t) {
        for (const m of marks) {
          const age = t - m.at;
          if (age > 3) continue;
          ctx.save(); ctx.globalAlpha = 0.5 * (1 - age / 3);
          ctx.beginPath(); ctx.ellipse(m.x, m.y, 2.6, 1.2, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
        if (flagAt > 0) {
          const k = back((t - flagAt) / 0.4), x = clamp(g.x + 34 * sc, s.room.x0 + 10, s.room.x1 - 10), y = s.floor.y, hgt = 34 * sc * k;
          if (t - flagAt > 4) return;
          ctx.save(); ctx.globalAlpha = t - flagAt > 3.4 ? 1 - smooth((t - flagAt - 3.4) / 0.6) : 1;
          ink(ctx, [[x, y], [x, y - hgt]], 2.2, t, 1);
          const wv = Math.sin(t * 8) * 2;
          ink(ctx, [[x, y - hgt], [x + 16 * sc * k, y - hgt + 5 * sc + wv], [x, y - hgt + 11 * sc * k]], 2, t, 2);
          ctx.restore();
        }
      },
    };
    void at;
    return p;
  },
};

/** A cat, in a few lines: running (a long bean on four galloping legs) or sitting (a teardrop with its tail round). */
export function drawCat(ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, pose: 'run' | 'sit', ph: number, face: number, t: number) {
  const f = face, s = sc;
  if (pose === 'run') {
    const by = y - 13 * s;
    const body = catmull([[x - f * 17 * s, by + 2 * s], [x - f * 8 * s, by - 6 * s], [x + f * 8 * s, by - 5 * s], [x + f * 15 * s, by + 1 * s], [x + f * 6 * s, by + 6 * s], [x - f * 12 * s, by + 6 * s], [x - f * 17 * s, by + 2 * s]], 5);
    ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); body.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill(); ctx.restore();
    ink(ctx, body, 2, t, 30);
    const hx = x + f * 19 * s, hy = by - 6 * s, r = 6.5 * s;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill(); ctx.restore();
    ink(ctx, ring(hx, hy, r, r * 0.92, 14, 2), 2, t, 31);
    ink(ctx, [[hx - f * 4 * s, hy - r * 0.7], [hx - f * 2 * s, hy - r * 1.7], [hx + f * 1 * s, hy - r * 0.9]], 1.8, t, 32);
    ink(ctx, [[hx + f * 2 * s, hy - r * 0.9], [hx + f * 4.5 * s, hy - r * 1.6], [hx + f * 5.5 * s, hy - r * 0.5]], 1.8, t, 33);
    ctx.beginPath(); ctx.arc(hx + f * 2.5 * s, hy - 1 * s, 1.2 * s, 0, TAU); ctx.fill();
    ink(ctx, quad(x - f * 16 * s, by, x - f * 28 * s, by - 6 * s + Math.sin(ph) * 4 * s, x - f * 26 * s, by - 16 * s, 8), 1.8, t, 34);
    const g1 = Math.sin(ph) * 6 * s, g2 = Math.sin(ph + Math.PI) * 6 * s;
    for (const [lx, sw] of [[x + f * 9 * s, g1], [x + f * 4 * s, g2], [x - f * 8 * s, g2], [x - f * 13 * s, g1]] as [number, number][]) ink(ctx, [[lx, by + 5 * s], [lx + f * sw, y]], 1.8, t, 35 + lx);
    return;
  }
  // Sitting.
  const body = catmull([[x, y - 26 * s], [x + 9 * s, y - 14 * s], [x + 10 * s, y - 2 * s], [x, y], [x - 10 * s, y - 2 * s], [x - 9 * s, y - 14 * s], [x, y - 26 * s]], 5);
  ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); body.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill(); ctx.restore();
  ink(ctx, body, 2, t, 40);
  const hy = y - 31 * s, r = 7 * s;
  ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, hy, r, 0, TAU); ctx.fill(); ctx.restore();
  ink(ctx, ring(x, hy, r, r * 0.92, 14, 2), 2, t, 41);
  ink(ctx, [[x - 5 * s, hy - r * 0.6], [x - 4 * s, hy - r * 1.6], [x - 1 * s, hy - r * 0.95]], 1.8, t, 42);
  ink(ctx, [[x + 1 * s, hy - r * 0.95], [x + 4 * s, hy - r * 1.6], [x + 5 * s, hy - r * 0.6]], 1.8, t, 43);
  const blink = (t % 3.4) < 0.13;
  for (const ex of [-2.6, 2.6]) { if (blink) ink(ctx, [[x + ex * s - 1.4, hy], [x + ex * s + 1.4, hy]], 1.2, t, 44); else { ctx.beginPath(); ctx.arc(x + ex * s, hy, 1.1 * s, 0, TAU); ctx.fill(); } }
  const sw = Math.sin(t * 2.2) * 5 * s;
  ink(ctx, quad(x + 8 * s, y - 2 * s, x + 22 * s, y + 1 * s, x + 20 * s + sw, y - 14 * s, 8), 1.8, t, 45);
}
