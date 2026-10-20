import { horizonAt, lightAt, lookAt, starsAt } from './day';

/* Direction D's landscape: one full-screen shader that draws the sky, three decks of cloud, three ridgelines of
   hills with pines along the nearest two, mist lying in the valleys and on the water, and the water itself with
   the ridges and the light reflected in it. The page only says where the day is (0 first light, 1 dusk); every
   color comes from day.ts.

   There's no sun. The light comes from a point that's always out of frame (lightAt), so you only ever see what
   it does: which side of the clouds is lit, the warm side of the haze, the rims on the ridges and the glints on
   the water.

   It's plain WebGL with no library, since it's a single triangle. It renders at a fraction of the screen (the
   picture is soft, so nobody sees it), pauses when the tab is hidden, and phones get fewer noise octaves. */

const VERT = `attribute vec2 a; varying vec2 vUv; void main() { vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uHorizon, uElev, uMist, uStars, uScroll, uExposure, uPx;
uniform vec2 uLight;
uniform vec3 uZenith, uMiddle, uHaze, uLand, uLightC;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
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
float noise1(float x) { float i = floor(x), f = fract(x); return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
// Peaks for the far range: folded noise, so it has sharp tops and soft valleys.
float peaks(float x) {
  float v = 0.0, a = 0.6;
  for (int i = 0; i < 4; i++) { float n = 1.0 - abs(noise1(x) * 2.0 - 1.0); v += a * n * n; x = x * 2.1 + 5.3; a *= 0.45; }
  return v;
}
float hills(float x) { return noise1(x) * 0.6 + noise1(x * 2.3 + 3.7) * 0.28 + noise1(x * 5.1 + 9.1) * 0.12; }

// How far ridge k is slid sideways by the scroll, in screen units, so the near hills pass faster than the far.
float slide(int k) { return uScroll * (0.012 + float(k) * 0.03); }

// The height of ridge k above the horizon at x, without its trees: a far range of peaks, then two rows of hills.
float land(int k, float x) {
  float sx = x + slide(k);
  if (k == 0) return 0.035 + 0.2 * peaks(sx * 1.05 + 2.0);
  if (k == 1) return 0.035 + 0.06 * hills(sx * 2.2 + 13.7);
  return 0.012 + 0.035 * hills(sx * 3.4 + 27.4);
}
// The same, with pines on the near two: a row of narrow cones of random height wherever a slow noise says forest.
float ridge(int k, float x) {
  float h = land(k, x);
  if (k == 0) return h;
  float fk = float(k);
  float cell = 0.012 + fk * 0.004;
  float cx = (x + slide(k)) / cell;
  float id = floor(cx), local = fract(cx) - 0.5;
  float forest = smoothstep(0.38, 0.6, noise1(id * 0.06 + fk * 5.0));
  float tall = (0.35 + 0.65 * hash1(id + fk * 31.0)) * (0.02 + fk * 0.009) * forest;
  float j = (hash1(id * 1.7 + 4.0) - 0.5) * 0.3;
  float cone = 1.0 - abs(local - j) * 2.0 / (0.42 + 0.3 * hash1(id + 9.0));
  return max(h, h - tall * 0.15 + tall * max(cone, 0.0));
}

vec3 skyAt(float h) {
  vec3 s = mix(uHaze, uMiddle, smoothstep(0.0, 0.34, h));
  return mix(s, uZenith, smoothstep(0.3, 1.0, h));
}

// One deck of cloud: density, and how lit it is from the light's side.
vec2 deck(vec2 p, vec2 toLight, float cover) {
  float d = smoothstep(cover, cover + 0.3, fbm(p));
  float d2 = smoothstep(cover, cover + 0.3, fbm(p + toLight * 0.08));
  return vec2(d, clamp(0.5 + (d - d2) * 2.8, 0.0, 1.0));
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 L = vec2(uLight.x * aspect, uLight.y);
  float above = uv.y - uHorizon;
  float low = 1.0 - uElev;
  float t = uTime;

  // ---- the sky: zenith to the haze on the horizon, warmer on the side the light comes from ----------------------
  float h = clamp(above / max(0.2, 1.0 - uHorizon), 0.0, 1.0);
  vec3 col = skyAt(h);
  float dl = distance(p, L);
  col += uLightC * exp(-dl * 1.5) * (0.1 + 0.22 * low);
  float side = exp(-abs(p.x - L.x) * (0.9 + uElev));
  col += uLightC * exp(-abs(above) * 9.0) * side * 0.22 * low;

  // Stars, in the last minutes of the page.
  if (uStars > 0.0) {
    vec2 g = floor(uv * uRes / 3.0);
    float s = hash(g);
    float tw = 0.6 + 0.4 * sin(t * (1.0 + s * 3.0) + s * 40.0);
    col += vec3(0.85, 0.88, 1.0) * step(0.9975, s) * tw * uStars * smoothstep(0.08, 0.5, above) * 0.8;
  }

  // ---- clouds: three decks, far to near, each squashed toward the horizon and drifting at its own speed --------
  vec2 toLight = normalize(L - p + 1e-4);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float y = above * (1.0 + fk * 0.85);
    if (y < 0.04) continue;
    vec2 q = vec2(p.x * (1.3 + fk * 0.5) / (0.3 + y), y * (2.1 + fk * 0.6));
    q.x += t * (0.004 + fk * 0.004) + uScroll * (0.05 + fk * 0.1);
    q.y -= uScroll * (0.12 + fk * 0.2);
    vec2 c = deck(q * (0.9 + fk * 0.35) + fk * 7.3, toLight, 0.53 + fk * 0.03 - 0.04 * low);
    float fade = smoothstep(0.04, 0.16, y) * (1.0 - smoothstep(0.55, 1.35, y));
    vec3 shade = mix(uMiddle * 0.6, uZenith * 0.85, 0.45);
    vec3 lit = mix(shade, mix(uHaze, uLightC, 0.5), c.y);
    lit += uLightC * exp(-dl * 1.3) * c.y * 0.28;
    col = mix(col, lit, c.x * fade * (0.42 + fk * 0.15));
  }

  // ---- ridges, far to near: each one darker and less hazy than the one behind it ----------------------------
  // On a tall screen the hills are drawn wider than the screen, so a phone sees a range, not one peak.
  float x = uv.x * max(aspect, 1.2);
  float r0 = ridge(0, x), r1 = ridge(1, x), r2 = ridge(2, x);
  float aa = uPx * 1.2;
  {
    vec3 c = mix(uLand, uHaze, 0.66);
    // The slopes facing the light catch it.
    float slope = (land(0, x + 0.006) - land(0, x - 0.006)) / 0.012;
    float facing = clamp(-slope * sign(L.x - x) * 1.5, 0.0, 1.0);
    c += uLightC * facing * (0.05 + 0.1 * low) * smoothstep(-0.06, 0.0, above - r0);
    col = mix(col, c, smoothstep(-aa, aa, r0 - above));
  }
  {
    vec3 c = mix(uLand, uHaze, 0.48);
    c += uLightC * smoothstep(0.01, 0.0, r1 - above) * 0.07 * low;
    col = mix(col, c, smoothstep(-aa, aa, r1 - above));
  }
  col = mix(col, mix(uLand, uHaze, 0.2), smoothstep(-aa, aa, r2 - above));

  // Mist lying in the valleys, thickest at dawn and in the evening, drifting slowly along the hills.
  if (above > -0.01) {
    float m = fbm(vec2(p.x * 1.6 - t * 0.012 - uScroll * 0.04, above * 14.0 + t * 0.01));
    float band = exp(-max(above, 0.0) * 20.0) + exp(-abs(above - land(1, x) * 0.6) * 30.0) * 0.45;
    col = mix(col, mix(uHaze, uLightC, 0.12) * 1.02, clamp(uMist * band * smoothstep(0.32, 0.72, m) * 0.85, 0.0, 0.85));
  }

  // ---- water: the hills and the sky upside down, broken up by ripples, with glints toward the light ----------
  if (above < 0.0) {
    float dd = -above;
    float wx = (p.x - L.x) / (dd + 0.03), wy = 1.0 / (dd + 0.03);
    float ripple = noise(vec2(wx * 0.6, wy * 1.4 - t * 0.55)) * 0.6 + noise(vec2(wx * 1.9 + 3.1, wy * 3.0 - t * 0.9)) * 0.4;
    // The reflection is offset sideways by the ripples, more so close up.
    float rx = x + (ripple - 0.5) * (0.004 + dd * 0.05);
    float rh = dd * 1.04;
    vec3 refl = skyAt(clamp(rh / max(0.2, 1.0 - uHorizon), 0.0, 1.0));
    float ra = uPx * 2.0 + dd * 0.03;
    refl = mix(refl, mix(uLand, uHaze, 0.7), smoothstep(-ra, ra, ridge(0, rx) - rh));
    refl = mix(refl, mix(uLand, uHaze, 0.44), smoothstep(-ra, ra, ridge(1, rx) - rh));
    refl = mix(refl, mix(uLand, uHaze, 0.16), smoothstep(-ra, ra, ridge(2, rx) - rh));
    vec3 water = mix(refl * 0.62, uZenith * 0.5, smoothstep(0.0, 0.32, dd) * 0.55);
    // Glints: ripples facing the light pick it up, in a broad path that leans toward wherever it is.
    float path = exp(-pow((p.x - clamp(L.x, -0.15, aspect + 0.15)) / (0.45 + low * 0.5), 2.0));
    float glint = smoothstep(0.6, 0.82, ripple) * (0.25 + 0.75 * path);
    water += uLightC * glint * (0.06 + 0.22 * low) * exp(-dd * 3.0);
    water += uHaze * 0.1 * smoothstep(0.55, 0.9, ripple) * exp(-dd * 6.0);
    // A bright line where the water meets the far shore.
    water += mix(uHaze, uLightC, 0.4) * exp(-dd * 70.0) * 0.22;
    // Mist on the water, near the far shore.
    float m = fbm(vec2(p.x * 1.2 - t * 0.018, dd * 9.0 - t * 0.006));
    water = mix(water, uHaze * 1.02, clamp(uMist * exp(-dd * 7.0) * smoothstep(0.35, 0.75, m) * 0.7, 0.0, 0.7));
    col = water;
  }

  // Darker toward the edges and on the left, where the words are.
  col *= 0.86 + 0.14 * smoothstep(1.3, 0.2, distance(uv, vec2(0.55, 0.5)));
  col *= mix(0.8, 1.0, smoothstep(0.0, 0.6, uv.x));
  col *= uExposure;
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

/** What the page tells the landscape each frame. */
export type LandState = { day: number; scroll: number; exposure: number };
export type Land = { draw: (s: LandState, time: number) => void; stop: () => void };

/** Starts the landscape on `canvas`, or returns null without WebGL. */
export function startLand(canvas: HTMLCanvasElement, opts: { light: boolean }): Land | null {
  let gl: WebGLRenderingContext | null = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); } catch { gl = null; }
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) { const log = gl!.getShaderInfoLog(s); gl!.deleteShader(s); throw new Error(`land shader: ${log}`); }
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `#define OCTAVES ${opts.light ? 3 : 5}\n${FRAG}`));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);
  // One triangle that covers the screen.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl!.getUniformLocation(prog, name);
  const U = {
    res: u('uRes'), px: u('uPx'), time: u('uTime'), horizon: u('uHorizon'), elev: u('uElev'), mist: u('uMist'), stars: u('uStars'), scroll: u('uScroll'), exposure: u('uExposure'),
    light: u('uLight'), zenith: u('uZenith'), middle: u('uMiddle'), haze: u('uHaze'), land: u('uLand'), lightC: u('uLightC'),
  };

  const scale = opts.light ? 0.45 : 0.7;
  let W = 0, H = 0;
  const resize = () => {
    W = innerWidth; H = innerHeight;
    canvas.width = Math.max(1, Math.round(W * scale));
    canvas.height = Math.max(1, Math.round(H * scale));
    gl!.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);

  return {
    draw(s, time) {
      const look = lookAt(s.day), tall = H > W, horizon = horizonAt(s.day, tall), light = lightAt(s.day, horizon);
      gl!.uniform2f(U.res, W, H);
      gl!.uniform1f(U.px, 1 / Math.max(1, canvas.height));
      gl!.uniform1f(U.time, time);
      gl!.uniform1f(U.horizon, horizon);
      gl!.uniform1f(U.elev, light.elev);
      gl!.uniform1f(U.mist, look.mist);
      gl!.uniform1f(U.stars, starsAt(s.day));
      gl!.uniform1f(U.scroll, s.scroll);
      gl!.uniform1f(U.exposure, s.exposure);
      gl!.uniform2f(U.light, light.x, light.y);
      gl!.uniform3f(U.zenith, ...look.zenith);
      gl!.uniform3f(U.middle, ...look.middle);
      gl!.uniform3f(U.haze, ...look.haze);
      gl!.uniform3f(U.land, ...look.land);
      gl!.uniform3f(U.lightC, ...look.light);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    },
    stop() {
      removeEventListener('resize', resize);
      gl!.deleteBuffer(buf);
      gl!.deleteProgram(prog);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
