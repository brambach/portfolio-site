import { skyAt, sunAt, type RGB } from './day';
import { BODY, CALM, resting, spring, step } from './spring';

/* Direction C's sky: one full-screen WebGL quad behind the page. The light is a halftone field like the live
   site's, computed per pixel in a shader, so it costs the same at any size: dots whose size is the light reaching
   them, the sun as a disc of full dots, flattened dashes for the water with the sun's reflection shimmering in it.

   It's touchable. Near the pointer the field swells and parts, as if you were looking through water, and a little
   light follows you. A click or a tap on the sky drops a ripple. The sun is a body on a spring: it follows its path
   through the day, leans toward the pointer and settles back.

   Cost: the loop only runs while something's moving (the sun or the day settling, a ripple, the pointer in the
   last couple of seconds) and stops when the tab is hidden. With reduced motion it draws single frames when the
   time of day changes, without the pointer, ripples or shimmer. Without WebGL the page keeps its CSS gradient. */

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uDpr; uniform float uTime; uniform float uGap; uniform float uHz;
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow; uniform vec3 uSunA; uniform vec3 uSunB;
uniform vec3 uSun; uniform vec3 uPtr; uniform vec4 uRip[4]; uniform float uMove;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float ty = p.y / uRes.y;
  vec3 col = ty < 0.6 ? mix(uTop, uMid, ty / 0.6) : mix(uMid, uLow, (ty - 0.6) / 0.4);
  // Under the line the water is darker than the sky it reflects.
  if (p.y > uHz) col = mix(uLow, uTop, 0.55 * smoothstep(uHz, uRes.y, p.y)) * 0.86;

  // The pointer's lens: sampling closer to it magnifies the field, so dots swell and part around it.
  vec2 q = p;
  vec2 dp = p - uPtr.xy; float dl = length(dp) + 0.001; vec2 dir = dp / dl;
  float sig = 120.0;
  q -= dir * uPtr.z * 0.42 * sig * (dl / sig) * exp(-0.5 * (dl / sig) * (dl / sig));
  float glow = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    vec2 dr = p - r.xy; float d = length(dr) + 0.001;
    float front = r.z * 340.0;
    float band = exp(-pow((d - front) / 26.0, 2.0)) * r.w * exp(-r.z * 1.4);
    q += (dr / d) * band * 10.0 * sin((d - front) * 0.22);
    glow += band * 0.3;
  }

  bool water = q.y > uHz;
  vec2 g = water ? vec2(uGap, uGap * 0.6) : vec2(uGap);
  vec2 rel = q - vec2(0.0, uHz);
  vec2 cell = floor(rel / g);
  vec2 c = (cell + 0.5) * g + vec2(0.0, uHz);
  vec2 local = q - c;

  float R = uSun.z;
  float B = 0.045 + 0.05 * hash(cell) * (0.6 + 0.4 * sin(uTime * 0.7 * uMove + hash(cell.yx) * 6.28));
  if (!water) {
    float ds = length(c - uSun.xy);
    float sun = ds < R ? 1.0 : exp(-(ds - R) / (R * 0.85)) * 0.6;
    float low = 1.0 - smoothstep(uHz - R * 1.5, uHz - uRes.y * 0.45, uSun.y);
    float band = exp(-(uHz - c.y) / 46.0) * (0.12 + 0.3 * low) * exp(-pow((c.x - uSun.x) / (uRes.x * 0.42), 2.0));
    B = max(B, max(sun, band));
  } else {
    float depth = c.y - uHz;
    float w = R * (0.7 + depth / 70.0);
    float dx = c.x - uSun.x;
    float shim = 0.55 + 0.45 * sin(c.y * 0.41 + uTime * 2.2 * uMove + sin(c.x * 0.045 + uTime * 0.9 * uMove) * 2.2);
    float height = clamp((uHz - uSun.y) / (uRes.y * 0.7), 0.0, 1.0);
    float refl = exp(-dx * dx / (2.0 * w * w)) * shim * (0.95 - 0.55 * height) * exp(-depth / 260.0);
    float line = exp(-depth / 18.0) * 0.32 * exp(-pow(dx / (uRes.x * 0.38), 2.0));
    B = max(B, max(refl, line));
  }
  // A little light follows the pointer.
  float pd = length(c - uPtr.xy);
  B += uPtr.z * 0.16 * exp(-pd * pd / (2.0 * 150.0 * 150.0)) + glow;
  B = clamp(B, 0.0, 1.0);

  float rad = 0.5 * g.y * pow(B, 0.72);
  float d = water ? length(local / vec2(2.1, 1.0)) : length(local);
  float a = 1.0 - smoothstep(rad - 0.6, rad + 0.6, d);
  vec3 dim = mix(col, vec3(0.93, 0.92, 0.9), 0.32);
  vec3 ink = B < 0.45 ? mix(dim, uSunA, smoothstep(0.08, 0.45, B)) : mix(uSunA, uSunB, (B - 0.45) / 0.55);
  col = mix(col, ink, a * smoothstep(0.0, 0.05, B));
  gl_FragColor = vec4(col, 1.0);
}`;

export type SkyOptions = { reduced: boolean; lite: boolean; fallback: HTMLElement };
export type Sky = {
  /** The time of day the page is at (0 dawn, 1 dusk). The sky eases there on a spring. */
  setDay: (D: number) => void;
  pointer: (x: number, y: number, kind: string) => void;
  leave: () => void;
  ripple: (x: number, y: number) => void;
  /** Lift the sun out of the water (the intro). */
  rise: () => void;
  stop: () => void;
  /** Where the sun is drawn now, in viewport pixels, for anything that wants to sit beside it. */
  sun: () => { x: number; y: number; r: number };
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function startSky(canvas: HTMLCanvasElement, { reduced, lite, fallback }: SkyOptions): Sky {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) as WebGLRenderingContext | null;
  const day = spring(0), sx = spring(0), sy = spring(0), lift = spring(reduced ? 0 : 1), amp = spring(0);
  const px = spring(-999), py = spring(-999);
  const ripples: { x: number; y: number; t0: number }[] = [];
  let W = 0, H = 0, dpr = 1, raf = 0, last = 0, lastInput = -1e9, alive = true, placed = false, lastGradient = -1;
  let ptrX = -999, ptrY = -999;

  const paintFallback = (D: number) => {
    if (Math.abs(D - lastGradient) < 0.004) return;
    lastGradient = D;
    const s = skyAt(D), css = (c: RGB) => `rgb(${c.map(v => Math.round(v * 255)).join(' ')})`;
    fallback.style.background = `linear-gradient(to bottom, ${css(s.top)}, ${css(s.mid)} 60%, ${css(s.low)} 84%, ${css(s.top)})`;
  };

  let prog: WebGLProgram | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};
  if (gl) {
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (import.meta.env.DEV && !gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('Sky shader:', gl.getShaderInfoLog(s));
      return s;
    };
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { if (import.meta.env.DEV) console.warn('Sky shader:', gl.getProgramInfoLog(prog)); prog = null; }
    else {
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uRes', 'uDpr', 'uTime', 'uGap', 'uHz', 'uTop', 'uMid', 'uLow', 'uSunA', 'uSunB', 'uSun', 'uPtr', 'uRip', 'uMove']) U[n] = gl.getUniformLocation(prog, n);
    }
  }
  canvas.style.visibility = prog ? 'visible' : 'hidden';

  const narrowNow = () => W < 760;
  const hz = () => H * (narrowNow() ? 0.88 : 0.84);
  const R = () => (narrowNow() ? 22 : 46);
  /** The sun's path through the day: up from the water, over, and down into it. On wide screens it keeps to the
   *  right, clear of the reading column. */
  function path(D: number) {
    const n = narrowNow(), h = hz(), r = R();
    // On phones the words run the full width, so it climbs fast into the top right corner and spends the day there,
    // only coming down near the ends of the day.
    const x = W * (n ? 0.84 + 0.06 * D : 0.6 + 0.3 * D);
    const top = n ? Math.max(28, H * 0.05) : H * 0.2;
    const d = clamp(D, 0, 1), e = Math.min(1, Math.min(d, 1 - d) / 0.05);
    const up = n ? e * e * (3 - 2 * e) : Math.pow(Math.sin(Math.PI * d), 0.75);
    const y = h + r * 0.35 - (h + r * 0.35 - top) * up;
    return { x, y };
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(lite ? 1.5 : 1.75, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl?.viewport(0, 0, canvas.width, canvas.height);
    if (!placed) { const p = path(day.x); sx.x = sx.to = p.x; sy.x = sy.to = p.y; placed = true; }
    draw(performance.now());
  }

  function draw(now: number) {
    paintFallback(day.x);
    if (!gl || !prog) return;
    const s = skyAt(day.x), [a, b] = sunAt(day.x), r = R() * (1 + 0.18 * (1 - Math.sin(Math.PI * clamp(day.x, 0, 1))));
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uTime, reduced ? 0 : now / 1000);
    gl.uniform1f(U.uGap, lite ? 15 : 12); gl.uniform1f(U.uHz, hz()); gl.uniform1f(U.uMove, reduced ? 0 : 1);
    gl.uniform3f(U.uTop, ...s.top); gl.uniform3f(U.uMid, ...s.mid); gl.uniform3f(U.uLow, ...s.low);
    gl.uniform3f(U.uSunA, ...a); gl.uniform3f(U.uSunB, ...b);
    gl.uniform3f(U.uSun, sx.x, sy.x + lift.x * (R() * 2.6), r);
    gl.uniform3f(U.uPtr, px.x, py.x, reduced ? 0 : amp.x);
    const rip = new Float32Array(16);
    ripples.forEach((rp, i) => { rip.set([rp.x, rp.y, (now - rp.t0) / 1000, 1], i * 4); });
    gl.uniform4fv(U.uRip, rip);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(day, dt, CALM);
    const p = path(day.x);
    // The sun leans toward the pointer, a little, and swings back when it leaves.
    const lean = amp.to > 0 ? { x: clamp((ptrX - p.x) * 0.07, -36, 36), y: clamp((ptrY - p.y) * 0.07, -28, 28) } : { x: 0, y: 0 };
    sx.to = p.x + lean.x; sy.to = p.y + lean.y;
    step(sx, dt, BODY); step(sy, dt, BODY); step(lift, dt, { k: 18, c: 8.2 });
    px.to = ptrX; py.to = ptrY;
    step(px, dt, { k: 140, c: 22 }); step(py, dt, { k: 140, c: 22 }); step(amp, dt, { k: 40, c: 12 });
    while (ripples.length && now - ripples[0].t0 > 2600) ripples.shift();
    draw(now);
    const moving = !resting(day, 0.0004) || !resting(sx, 0.3) || !resting(sy, 0.3) || !resting(lift, 0.002) || !resting(amp, 0.004) || ripples.length > 0;
    if (moving || now - lastInput < 2200) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const wake = () => {
    if (reduced) { if (!raf) raf = requestAnimationFrame(now => { raf = 0; const p = path(day.x); sx.x = p.x; sy.x = p.y; draw(now); }); return; }
    if (!raf && alive && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; } else wake(); };
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  resize();

  return {
    setDay(D) { day.to = D; if (reduced || !placed) day.x = D; wake(); },
    pointer(x, y, kind) {
      if (reduced) return;
      if (ptrX < -900) { px.x = x; py.x = y; }
      ptrX = x; ptrY = y; amp.to = kind === 'touch' ? 0.8 : 1; lastInput = performance.now(); wake();
    },
    leave() { amp.to = 0; wake(); },
    ripple(x, y) {
      if (reduced) return;
      ripples.push({ x, y, t0: performance.now() });
      if (ripples.length > 4) ripples.shift();
      wake();
    },
    rise() { lift.to = 0; wake(); },
    sun: () => ({ x: sx.x, y: sy.x + lift.x * R() * 2.6, r: R() }),
    stop() {
      alive = false; cancelAnimationFrame(raf);
      removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis);
      // The context stays with the canvas (React may mount the page again on it); the program goes.
      if (gl && prog) gl.deleteProgram(prog);
    },
  };
}
