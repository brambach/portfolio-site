import type { Creature, Floor, Sounds } from './creature';
import { clamp } from './ink';
import { drawCat } from './reactions';

/* The cat from comehome, once it has been found: it hops down off the picture and goes everywhere the creature goes
   from then on. It trots to keep up, sits when the creature stops, and jumps after it from floor to floor, a beat
   late, the way a cat would. */

export class Cat {
  x: number; y: number;
  floor: Floor;
  private vy = 0;
  private mode: 'air' | 'walk' | 'sit' | 'leap' = 'air';
  private ph = 0;
  private face = 1;
  private wait = -1;
  private leap: { fx: number; fy: number; tx: number; ty: number; at: number; dur: number; h: number; floor: Floor } | null = null;

  constructor(x: number, y: number, floor: Floor) {
    this.x = x; this.y = y; this.floor = floor;
    this.mode = y < floor.y - 1 ? 'air' : 'sit';
  }

  /** How big it is next to this creature. */
  scale(g: Creature) { return clamp((g.size * g.k) / 95, 0.68, 1.05); }

  update(dt: number, t: number, g: Creature, sounds: Sounds | null) {
    const sc = this.scale(g);
    if (this.mode === 'leap' && this.leap) {
      const L = this.leap, u = clamp((t - L.at) / L.dur, 0, 1);
      this.x = L.fx + (L.tx - L.fx) * u;
      this.y = L.fy + (L.ty - L.fy) * u - 4 * L.h * u * (1 - u);
      this.ph += dt * 10;
      if (u >= 1) { this.floor = L.floor; this.y = L.floor.y; this.leap = null; this.mode = 'sit'; sounds?.land(18); }
      return;
    }
    if (this.mode === 'air') {
      this.vy += 2300 * dt; this.y += this.vy * dt;
      if (this.y >= this.floor.y) { this.y = this.floor.y; this.vy = 0; this.mode = 'sit'; sounds?.land(18); }
      return;
    }
    // The creature went to another floor: follow it there, after a moment's thought.
    const to = g.bound;
    if (to !== this.floor) {
      if (this.wait < 0) this.wait = t + 0.28;
      if (t < this.wait || g.leaping) return;
      this.wait = -1;
      const side = this.x < g.x ? -1 : 1;
      const tx = clamp(g.x + side * (g.half + 26 * sc), to.x0 + 8, to.x1 - 8);
      const up = this.y - to.y;
      this.leap = { fx: this.x, fy: this.y, tx, ty: to.y, at: t, dur: clamp(0.45 + Math.abs(up) / 2000, 0.45, 1), h: up > 0 ? up * 0.5 + 40 : 50, floor: to };
      this.mode = 'leap';
      this.face = Math.sign(tx - this.x) || this.face;
      return;
    }
    // On the same floor: a little behind it.
    const want = clamp(g.x - (g.facing || 1) * (g.half + 24 * sc), this.floor.x0 + 8, this.floor.x1 - 8);
    const dx = want - this.x;
    if (Math.abs(dx) > (this.mode === 'walk' ? 3 : 14)) {
      this.mode = 'walk';
      this.face = Math.sign(dx);
      const v = Math.min(360, Math.abs(dx) * 3 + 70);
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
      this.ph += dt * 15 * Math.min(1.4, v / 220);
    } else {
      this.mode = 'sit';
      this.face = Math.sign(g.x - this.x) || this.face;
    }
    this.y = this.floor.y;
  }

  draw(ctx: CanvasRenderingContext2D, t: number, g: Creature) {
    drawCat(ctx, this.x, this.y, this.scale(g), this.mode === 'sit' ? 'sit' : 'run', this.ph, this.face, t);
  }
}
