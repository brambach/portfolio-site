import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from 'three';

/* Direction A's sky: one full-screen shader that draws the whole day. The page tells it where the day is (0 at
   first light, 1 at dusk) and it works out the rest: the sky's colours, where the sun sits on its arc, how far the
   camera has tilted up off the horizon, and three decks of cloud lit from the sun, drifting at different speeds so
   they read as depth. Below the horizon is water, with the sun's column in it.

   Cost: it renders at a fraction of the screen (clouds are soft, so nobody sees it) and pauses when the tab is
   hidden. Phones get fewer noise octaves and a lower resolution. */

export type RGB = [number, number, number];
type Stop = [at: number, zenith: string, middle: string, horizon: string];

// The day's palette. Kept dark enough that the cream type stays readable at every hour.
const STOPS: Stop[] = [
  [0.00, '#070b1a', '#1d1a36', '#9c4f3e'],
  [0.10, '#0c1531', '#2d2a52', '#c87452'],
  [0.24, '#11244a', '#294a7a', '#9a8a93'],
  [0.42, '#102c5a', '#22508a', '#6f93b6'],
  [0.58, '#0f2a55', '#264f86', '#7b95b0'],
  [0.74, '#16244a', '#46406e', '#c7805e'],
  [0.88, '#140f2a', '#4a2340', '#e07a44'],
  [1.00, '#09081a', '#2c1428', '#a8452f'],
];
const hex = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const PALETTE = STOPS.map(([at, a, b, c]) => [at, hex(a), hex(b), hex(c)] as const);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mixC = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The three sky colours at a point in the day. */
export function paletteAt(day: number): [RGB, RGB, RGB] {
  let i = 0;
  while (i < PALETTE.length - 2 && day > PALETTE[i + 1][0]) i++;
  const [a0, z0, m0, h0] = PALETTE[i], [a1, z1, m1, h1] = PALETTE[i + 1];
  const t = smooth(clamp((day - a0) / (a1 - a0)));
  return [mixC(z0, z1, t), mixC(m0, m1, t), mixC(h0, h1, t)];
}

/** Where the camera's horizon sits on screen (0 bottom, 1 top): low at dawn, tilted up out of view through the
 *  working day, back down for the sunset. */
export function horizonAt(day: number, rise: number) {
  const up = smooth(clamp((day - 0.07) / 0.15)), down = smooth(clamp((day - 0.84) / 0.12));
  const dawn = 0.3 - 0.04 * (1 - rise);
  return dawn + (-0.55 - dawn) * up + (0.34 - -0.55) * down;
}

/** The sun on screen (0 to 1 from the bottom left). It comes up out of the water at dawn, climbs as the camera
 *  tilts up, crosses the top of the frame through the working day (above the words, never behind them), and comes
 *  back down to set into the water at dusk. */
export function sunAt(day: number, rise: number, aspect: number, horizon: number, flowing = false) {
  // Without the pinned shots (phones, reduced motion) the words run up the whole page, so the sun keeps to the corner.
  const narrowScreen = aspect < 0.9 || flowing;
  const up = smooth(clamp((day - 0.03) / 0.1)), down = smooth(clamp((day - 0.82) / 0.13));
  const set = smooth(clamp((day - 0.95) / 0.05));
  const dawnY = horizon + (-0.09 + 0.22 * rise) + day * 0.6;
  const noon = clamp((day - 0.2) / 0.62);
  // On a phone the words run the full width, so through the day the sun keeps to the top right corner, half out of frame.
  const highY = narrowScreen ? 0.985 + 0.015 * Math.sin(Math.PI * noon) : 0.83 + 0.06 * Math.sin(Math.PI * noon);
  const duskY = horizon + 0.12 - 0.2 * set;
  const y = up < 1 && day < 0.5 ? dawnY + (highY - dawnY) * up : highY + (duskY - highY) * down;
  // On a wide screen that corner holds the clock, so the sun keeps a little to its left.
  const x = narrowScreen ? (aspect < 0.9 ? 0.8 : 0.64) + 0.06 * Math.sin(Math.PI * noon) * (1 - down) : 0.7 + 0.12 * Math.sin(Math.PI * noon) + 0.04 * down;
  return { x, y };
}

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uHorizon, uDay, uScroll;
uniform vec2 uSun;
uniform vec3 uZenith, uMiddle, uHorizonC;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return v;
}

// One deck of cloud: density at p, and how lit it is from the sun's side.
vec2 deck(vec2 p, vec2 toSun, float cover) {
  float d = smoothstep(cover, cover + 0.32, fbm(p));
  float d2 = smoothstep(cover, cover + 0.32, fbm(p + toSun * 0.09));
  return vec2(d, clamp(0.55 + (d - d2) * 2.6, 0.0, 1.0));
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 sun = vec2(uSun.x * aspect, uSun.y);
  float above = uv.y - uHorizon;

  // Sky: zenith to middle to a warm band on the horizon.
  float h = clamp(above / 1.15, 0.0, 1.0);
  vec3 sky = mix(uHorizonC, uMiddle, smoothstep(0.0, 0.32, h));
  sky = mix(sky, uZenith, smoothstep(0.28, 1.0, h));

  // The sun and the light around it. Warmer and wider the lower it is.
  float low = 1.0 - clamp((uSun.y - uHorizon) / 0.6, 0.0, 1.0);
  vec3 sunCol = mix(vec3(1.0, 0.93, 0.78), vec3(1.0, 0.62, 0.36), low);
  float ds = distance(p, sun);
  float glow = exp(-ds * (3.4 - 1.6 * low)) * (0.32 + 0.3 * low);
  float halo = exp(-ds * 14.0) * 0.55;
  sky += sunCol * (glow + halo);

  // Three decks of cloud, far to near. They drift with time and slide with the scroll at different rates, so the
  // near deck moves past faster than the far one.
  vec2 toSun = normalize(sun - p + 1e-4);
  vec3 col = sky;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float depth = 1.0 + fk * 0.9;
    float y = above * depth;
    if (y < -0.02) continue;
    // Perspective: decks squash toward the horizon.
    vec2 q = vec2(p.x * (1.4 + fk * 0.5) / (0.35 + y), y * (2.2 + fk * 0.6));
    q.x += uTime * (0.006 + fk * 0.006) + uScroll * (0.08 + fk * 0.16);
    q.y -= uScroll * (0.35 + fk * 0.55);
    vec2 c = deck(q * (0.9 + fk * 0.35) + fk * 7.3, toSun, 0.5 + fk * 0.035 - 0.05 * low);
    float fade = smoothstep(-0.02, 0.12, y) * (1.0 - smoothstep(0.55, 1.4, y));
    vec3 shade = mix(uMiddle * 0.55, uZenith * 0.8, 0.4);
    vec3 lit = mix(shade, mix(uHorizonC, sunCol, 0.55), c.y);
    // Edges facing the sun catch more of it.
    lit += sunCol * exp(-ds * 2.2) * c.y * 0.35;
    col = mix(col, lit, c.x * fade * (0.5 + fk * 0.16));
  }

  // Water below the horizon: the sky darkened, with the sun's column broken into ripples.
  if (above < 0.0) {
    float dd = -above;
    vec3 water = mix(uHorizonC * 0.55, uZenith * 0.7, smoothstep(0.0, 0.3, dd));
    // Perspective: ripples shrink and crowd toward the horizon.
    float wx = (p.x - sun.x) / (dd + 0.025), wy = 1.0 / (dd + 0.025);
    float ripple = noise(vec2(wx * 0.9, wy * 1.6 - uTime * 0.9)) * 0.6 + noise(vec2(wx * 2.3 + 3.1, wy * 3.4 - uTime * 1.4)) * 0.4;
    float column = exp(-pow(wx / (3.2 + low * 3.0), 2.0));
    float bright = clamp(1.0 - (uHorizon - uSun.y) * 3.0, 0.0, 1.0);
    water += sunCol * column * smoothstep(0.5, 0.78, ripple) * (0.6 + low * 0.3) * bright;
    water += uMiddle * 0.25 * smoothstep(0.55, 0.9, ripple) * (1.0 - column);
    water += sunCol * exp(-dd * 40.0) * 0.18 * bright;
    col = water;
  }
  // The sun's disc sits on top of the clouds near the horizon but behind them when high, so give it a soft edge.
  float disc = smoothstep(0.05, 0.047, ds) * step(0.0, above);
  col = mix(col, sunCol * 1.08, disc * 0.94);

  // Vignette, and a gentle darkening on the left where the words live.
  col *= 0.86 + 0.14 * smoothstep(1.25, 0.2, distance(uv, vec2(0.55, 0.5)));
  col *= mix(0.82, 1.0, smoothstep(0.0, 0.55, uv.x));
  // Dither against banding.
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export type SkyState = { day: number; rise: number; scroll: number };
export type Sky = { stop: () => void; webgl: boolean };

/** Starts the sky on `canvas`. `read` is called every frame for where the day is. */
export function startSky(canvas: HTMLCanvasElement, read: () => SkyState, opts: { light: boolean; still: boolean; onFrame?: (s: { sunX: number; sunY: number; horizon: number }) => void }): Sky {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return { stop: () => {}, webgl: false };
  }
  const scale = opts.light ? 0.5 : 0.62;
  renderer.setPixelRatio(1);
  const uniforms = {
    uRes: { value: new Vector2(1, 1) }, uTime: { value: 0 }, uHorizon: { value: 0.3 }, uDay: { value: 0 }, uScroll: { value: 0 },
    uSun: { value: new Vector2(0.7, 0.3) }, uZenith: { value: new Vector3() }, uMiddle: { value: new Vector3() }, uHorizonC: { value: new Vector3() },
  };
  const material = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, defines: { OCTAVES: opts.light ? 3 : 5 }, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let W = 0, H = 0;
  const resize = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(Math.max(1, Math.round(W * scale)), Math.max(1, Math.round(H * scale)), false);
    uniforms.uRes.value.set(W, H);
  };
  resize();
  addEventListener('resize', resize);

  let frame = 0, t0 = performance.now(), running = true;
  const draw = (now: number) => {
    const s = read();
    if (!opts.still) uniforms.uTime.value = (now - t0) / 1000;
    const [z, m, h] = paletteAt(s.day);
    uniforms.uZenith.value.set(...z); uniforms.uMiddle.value.set(...m); uniforms.uHorizonC.value.set(...h);
    const horizon = horizonAt(s.day, s.rise);
    const sun = sunAt(s.day, s.rise, W / Math.max(1, H), horizon, opts.still);
    uniforms.uHorizon.value = horizon;
    uniforms.uSun.value.set(sun.x, sun.y);
    uniforms.uDay.value = s.day;
    uniforms.uScroll.value = s.scroll;
    renderer.render(scene, camera);
    opts.onFrame?.({ sunX: sun.x, sunY: sun.y, horizon });
  };
  const loop = (now: number) => { if (!running) return; draw(now); frame = requestAnimationFrame(loop); };
  const visibility = () => {
    cancelAnimationFrame(frame);
    running = !document.hidden;
    if (running) frame = requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', visibility);
  frame = requestAnimationFrame(loop);

  return {
    webgl: true,
    stop() {
      running = false;
      cancelAnimationFrame(frame);
      removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      geometry.dispose(); material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/** Without WebGL: the same palette as a CSS gradient. */
export function cssSky(day: number) {
  const [z, m, h] = paletteAt(day).map(c => `rgb(${c.map(v => Math.round(v * 255)).join(' ')})`);
  return `linear-gradient(to bottom, ${z}, ${m} 60%, ${h})`;
}
