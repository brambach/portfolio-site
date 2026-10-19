/* Springs for Direction C. Everything that moves here is a mass on a spring: the sun, the letters, the cards, the
   dial. `step` advances one spring by dt seconds (in small fixed sub-steps, so a long frame never blows up), and
   `springEasing` turns the same spring into a CSS linear() curve, so hover states in CSS move the same way. */

export type Spring = { x: number; v: number; to: number };
export type Feel = { k: number; c: number };

/** Stiff and settled, for things that should feel heavy (scroll, the sky). */
export const CALM: Feel = { k: 120, c: 22 };
/** A little loose, for things that should feel like objects (the sun, cards). */
export const BODY: Feel = { k: 90, c: 11 };
/** Quick with one visible wobble, for letters and small controls. */
export const SNAP: Feel = { k: 260, c: 15 };

export const spring = (x = 0): Spring => ({ x, v: 0, to: x });

export function step(s: Spring, dt: number, { k, c }: Feel) {
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = Math.min(dt, 0.064) / n;
  for (let i = 0; i < n; i++) {
    const a = -k * (s.x - s.to) - c * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
  return s;
}

export const resting = (s: Spring, eps = 0.01) => Math.abs(s.x - s.to) < eps && Math.abs(s.v) < eps;

/** A CSS linear() easing (and how long it takes to settle) for a unit step on this spring. */
export function springEasing(feel: Feel, points = 32) {
  const s = spring(0);
  s.to = 1;
  const dt = 1 / 240, trace: number[] = [0];
  let t = 0;
  while (t < 3 && !(resting(s, 0.002) && t > 0.1)) { step(s, dt, feel); trace.push(s.x); t += dt; }
  const out: string[] = [];
  for (let i = 0; i <= points; i++) out.push((i === points ? 1 : trace[Math.round((i / points) * (trace.length - 1))]).toFixed(3));
  return { easing: `linear(${out.join(', ')})`, ms: Math.round(t * 1000) };
}
