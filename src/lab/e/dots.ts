import { pair, type Formation, type Grid } from './field';

/* The dots on screen. One WebGL draw of points, never more than about 35,000 with the pool (about 21,000 on a
   1440 by 900 laptop) and 9,000 or so on a phone.

   Each dot knows where it was and where it's going. A morph is a single clock: every dot starts on its own
   short delay, flies a curved path to its new slot and changes color on the way, all worked out in the vertex
   shader, so starting a morph costs one upload and nothing per frame. While it's home, a dot lives the way its
   spot in its picture does (see LIFE in scenes.ts), also in the shader.

   The pointer is the one thing done on the CPU: dots near it get pushed aside on springs and settle back. Only the
   dots that are moving get worked on, and they're found through a map from cell to dot. */

const VERT = `
attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 aColF; attribute vec3 aColT; attribute vec4 aMeta; attribute vec4 aAux; attribute vec2 aOff;
uniform vec2 uView; uniform float uClock, uDur, uTime, uCell, uDpr, uIdle, uTypeFade, uFocusAt, uLoose; uniform vec2 uShiftF, uShiftT, uDrip; uniform vec3 uDark;
varying vec3 vCol; varying float vBlur;
const float PI = 3.14159265, TAU = 6.2831853;
float h(float n) { return fract(sin(n) * 43758.5453); }
vec2 turn(vec2 arm, float a) { return vec2(arm.x * (cos(a) - 1.0) - arm.y * sin(a), arm.x * sin(a) + arm.y * (cos(a) - 1.0)); }
// What a dot does while it's home: x and y nudges, a change in brightness and a change in size. \`dark\` says how
// far it's drawn in the darkest tone instead of its own (the pen's curve, before it's drawn).
vec4 live(float k, vec2 p, vec2 aux, float s, float t, out float dark) {
  dark = 0.0;
  if (k < 0.5 || k > 19.5) return vec4(0.0);
  if (k < 1.5) // bob: the plane rides the air, all of it together
    return vec4(cos(t * 0.55) * 0.3 * uCell, sin(t * 1.1) * 0.6 * uCell, 0.0, 0.0);
  if (k < 2.5) { // trail: light runs back along it, away from the plane
    float w = pow(0.5 + 0.5 * sin(TAU * (aux.x * 2.5 - t * 0.35)), 6.0);
    return vec4(0.0, 0.0, w * 0.35, w * 0.3);
  }
  if (k < 4.5) { // plugs: they nudge closer, click, and ease apart, and the prong and socket light up as they meet
    float c = fract(t / 5.0);
    float near = smoothstep(0.08, 0.42, c) * (1.0 - smoothstep(0.72, 0.94, c)), click = exp(-pow((c - 0.44) * 30.0, 2.0));
    return vec4((k < 3.5 ? 1.0 : -1.0) * (near * 0.9 + click * 0.35) * uCell, 0.0, aux.x * click * 0.9, 0.0);
  }
  if (k < 5.5) // drift: the cursor goes round a small loop of its own
    return vec4(cos(t * 0.7) * 0.7 * uCell, -sin(t * 0.7) * 0.5 * uCell, 0.0, 0.0);
  if (k < 6.5) { // loop: light runs along the dotted path toward the cursor
    float w = pow(0.5 + 0.5 * sin(TAU * (aux.x * 1.5 - t * 0.3)), 8.0);
    return vec4(0.0, 0.0, w * 0.3, w * 0.45);
  }
  if (k < 7.5) { // glint: each sparkle twinkles now and then, all of it at once
    float ph = fract(t * 0.2 + h(floor(p.x / (uCell * 10.0)) * 7.0 + floor(p.y / (uCell * 10.0)) * 13.0));
    float w = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.08, 0.3, ph));
    return vec4(0.0, 0.0, w * 0.6, w * 0.5);
  }
  if (k < 8.5) // sway: the rope swings a little about where it hangs
    return vec4(turn(aux, sin(t * 0.9) * 0.022 + sin(t * 0.37) * 0.01), 0.0, 0.0);
  if (k < 10.5) { // draw: the pen's curve draws itself from one anchor to the other, holds, and clears
    float c = fract(t / 7.0), head = smoothstep(0.02, 0.3, c) * 1.04, tail = smoothstep(0.9, 0.98, c) * 1.04;
    float shown = step(aux.x, head) * step(tail, aux.x);
    dark = 1.0 - shown;
    return vec4(0.0, 0.0, shown * exp(-pow((head - aux.x) * 16.0, 2.0)) * 0.6, 0.0);
  }
  if (k < 11.5) { // steam: it wavers as it rises, each dot lifting and thinning out, then back
    float r = fract(t * 0.45 + s * 0.61);
    return vec4(sin(aux.x * 7.0 - t * 1.8) * 0.55 * uCell * (0.3 + aux.x), -r * 1.1 * uCell, 0.0, -r * 0.45);
  }
  if (k < 13.5) { // wave: the hand waves from the wrist, twice, then rests, and the lines flick with each wave
    float c = fract(t / 4.6), wc = clamp(c / 0.38, 0.0, 1.0), env = sin(wc * PI), sw = sin(wc * 2.0 * TAU);
    if (k < 12.5) return vec4(turn(aux, sw * 0.065 * env), 0.0, 0.0);
    float w = env * abs(sw);
    return vec4(w * 0.35 * uCell, 0.0, w * 0.5, 0.0);
  }
  if (k > 14.5 && k < 15.5) { // static: jumping about before it's anything
    float f = floor(t * 14.0);
    return vec4((h(s * 17.0 + f) - 0.5) * 1.6 * uCell, (h(s * 29.0 + f) - 0.5) * 1.6 * uCell, 0.0, 0.0);
  }
  if (k > 15.5 && k < 16.5) { // drip: grains break off the bottom of the picture and fall off the screen, one by one
    float period = 3.4 + h(s * 7.0) * 2.4, at = h(s * 11.0), ph = t / period + at, start = (floor(ph) - at) * period, tau = t - start;
    // Only grains that set off between the plane settling and the first scroll fall. Any already falling finish.
    if (start < uDrip.x || start > uDrip.y) return vec4(0.0, 0.0, 0.0, -1.0);
    float fall = max(0.0, tau - 0.6), dy = 18.0 * fall + 85.0 * fall * fall;
    if (p.y + dy > uView.y + uCell * 2.0) return vec4(0.0, 0.0, 0.0, -1.0);
    return vec4(sin(fall * 2.5 + s * 9.0) * 0.35 * uCell * min(1.0, fall), dy, 0.0, smoothstep(0.0, 0.6, tau) - 1.0);
  }
  return vec4(0.0);
}
vec2 dust(vec2 p, float s, float t) {
  float fall = 6.0 + h(s * 5.0) * 14.0;
  return vec2(p.x + sin(t * 0.25 + s * 9.0) * uCell * 1.5, mod(p.y + t * fall + 20.0, uView.y + 40.0) - 20.0);
}
void main() {
  float seed = aMeta.z, delay = aMeta.w;
  vec2 from = aFrom.xy + (aMeta.x > 19.5 ? uShiftF : vec2(0.0));
  vec2 to = aTo.xy + (aMeta.y > 19.5 ? uShiftT : vec2(0.0));
  float t = clamp((uClock - delay) / uDur, 0.0, 1.0);
  float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  vec2 d = to - from; float len = length(d);
  vec2 perp = len > 0.5 ? vec2(-d.y, d.x) / len : vec2(0.0);
  float bend = (h(seed * 3.1) - 0.5) * min(len, 600.0) * 0.24;
  float fly = sin(PI * e);
  vec2 p = mix(from, to, e) + perp * bend * fly;
  p += vec2(sin(uTime * 3.0 + seed * 20.0), cos(uTime * 2.6 + seed * 13.0)) * fly * uCell * 0.8;
  // The focus pull: dots arrive a little loose and soft, then the whole picture snaps sharp together.
  float k = clamp((uClock - uFocusAt) / 0.42, 0.0, 1.0);
  float loose = uLoose * e * (1.0 - k * k * (3.0 - 2.0 * k));
  p += (vec2(h(seed * 5.3), h(seed * 8.1)) - 0.5) * 2.6 * uCell * loose;
  vBlur = loose;
  if (aMeta.x > 13.5 && aMeta.x < 14.5) p = mix(dust(from, seed, uTime), p, e);
  if (aMeta.y > 13.5 && aMeta.y < 14.5) p = mix(p, dust(to, seed, uTime), e * uIdle);
  float darkF, darkT;
  vec4 lf = live(aMeta.x, from, aAux.xy, seed, uTime, darkF), lt = live(aMeta.y, to, aAux.zw, seed, uTime, darkT);
  vec4 l = mix(lf, lt, e) * uIdle;
  p += l.xy + aOff;
  float size = mix(aFrom.z, aTo.z, e) * (1.0 - 0.3 * fly) * max(0.0, 1.0 + l.w);
  if (aMeta.y > 19.5) size *= mix(1.0, uTypeFade, e);
  vec3 col = mix(aColF, aColT, smoothstep(0.15, 0.85, e));
  col = mix(col, uDark, mix(darkF, darkT, e) * uIdle);
  col = l.z > 0.0 ? mix(col, vec3(1.0), clamp(l.z, 0.0, 1.0) * 0.55) : col * (1.0 + l.z);
  vCol = col;
  float px = size * uCell * 0.9 * uDpr;
  gl_PointSize = px;
  gl_Position = px < 0.6 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec3 vCol; varying float vBlur;
void main() {
  float r = length(gl_PointCoord - 0.5);
  // Crisp edges once in focus, soft while the picture is still settling.
  float a = (1.0 - smoothstep(0.45 - 0.3 * vBlur, 0.5, r)) * (1.0 - 0.35 * vBlur);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vCol * a, a);
}`;

const STRIDE = 20;
/** Lives at or above this are type, which follows the scroll while the words change over. */
const TYPE = 19.5;
const hash = (n: number) => { const v = Math.sin(n) * 43758.5453; return v - Math.floor(v); };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type MorphOptions = {
  /** Seconds each dot takes. */
  dur?: number;
  /** How the delays are spread: a sweep across the screen, from the middle out, or at random. */
  order?: 'sweep' | 'center' | 'random';
  spread?: number;
  /** Type dots leave first, so the words break before the scene starts to move. */
  typeFirst?: boolean;
  /** Arrive loose and soft, then snap sharp. On by default. Off for the words, which hand over to real type. */
  focus?: boolean;
  onDone?: () => void;
};

export type Dots = {
  readonly grid: Grid;
  /** Put every dot in its slot at once. */
  set: (f: Formation) => void;
  morph: (f: Formation, o?: MorphOptions) => void;
  /** Take a formation's type slots at once, for the dots holding them, and leave every other dot be. It's how
   *  the words turn into dots in place, without anything else on screen jumping. */
  adopt: (f: Formation) => void;
  /** How far the words a type formation was sampled from have scrolled since. */
  shift: (from: [number, number], to: [number, number]) => void;
  typeFade: (v: number) => void;
  /** Grains drip off the hero's picture if they set off between these two times (seconds, on the frame clock). */
  drip: (from: number, stop: number) => void;
  pointer: (x: number, y: number) => void;
  leave: () => void;
  frame: (now: number, dt: number) => void;
  reset: (grid: Grid, f: Formation) => void;
  readonly busy: boolean;
  stop: () => void;
};

export function startDots(canvas: HTMLCanvasElement, first: Grid, opts: { still: boolean; phone: boolean; dark: [number, number, number] }): Dots | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { view: U('uView'), clock: U('uClock'), dur: U('uDur'), time: U('uTime'), cell: U('uCell'), dpr: U('uDpr'), idle: U('uIdle'), fade: U('uTypeFade'), shf: U('uShiftF'), st: U('uShiftT'),
    dark: U('uDark'), focusAt: U('uFocusAt'), loose: U('uLoose'), drip: U('uDrip') };
  const buf = gl.createBuffer(), offBuf = gl.createBuffer();
  const attr = (name: string, size: number, offset: number) => {
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
  };
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  attr('aFrom', 3, 0); attr('aTo', 3, 3); attr('aColF', 3, 6); attr('aColT', 3, 9); attr('aMeta', 4, 12); attr('aAux', 4, 16);
  gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
  const offLoc = gl.getAttribLocation(prog, 'aOff');
  gl.enableVertexAttribArray(offLoc);
  gl.vertexAttribPointer(offLoc, 2, gl.FLOAT, false, 0, 0);

  const dpr = Math.min(window.devicePixelRatio || 1, opts.phone ? 1.5 : 2);
  let grid = first, n = 0;
  let data = new Float32Array(0), keys = new Float32Array(0), off = new Float32Array(0), vel = new Float32Array(0);
  let slot = new Uint32Array(0), owner = new Int32Array(0), active = new Uint8Array(0), list: number[] = [];
  let clock = 1e3, dur = 1, end = 1, time = 0, fade = 1, focusAt = -1e3, loose = 0, dripFrom = 1e9, dripStop = 1e9, stopped = false, done: (() => void) | undefined, dirty = true, offDirty = false;
  let shiftF: [number, number] = [0, 0], shiftT: [number, number] = [0, 0];
  let px = -1e4, py = -1e4, pvx = 0, pvy = 0, pointerOn = false, lastT = 0;

  function alloc(g: Grid) {
    grid = g; n = g.n;
    data = new Float32Array(n * STRIDE); keys = new Float32Array(n);
    off = new Float32Array(n * 2); vel = new Float32Array(n * 2);
    slot = new Uint32Array(n); owner = new Int32Array(g.cells).fill(-1); active = new Uint8Array(n); list = [];
    for (let i = 0; i < n; i++) data[i * STRIDE + 14] = hash(i * 1.618 + 0.5) * 100;
    canvas.width = Math.round(g.w * dpr); canvas.height = Math.round(g.h * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, offBuf);
    gl!.bufferData(gl!.ARRAY_BUFFER, off, gl!.DYNAMIC_DRAW);
  }
  alloc(first);

  /** Where dot i is right now, partway through the current morph (the same path as the shader, less the small
   *  wobble and life), so a new morph can start from there. */
  function snapshot(i: number) {
    const o = i * STRIDE, seed = data[o + 14];
    const t = Math.min(1, Math.max(0, (clock - data[o + 15]) / dur)), e = ease(t);
    const fx = data[o] + (data[o + 12] > TYPE ? shiftF[0] : 0), fy = data[o + 1] + (data[o + 12] > TYPE ? shiftF[1] : 0);
    const tx = data[o + 3] + (data[o + 13] > TYPE ? shiftT[0] : 0), ty = data[o + 4] + (data[o + 13] > TYPE ? shiftT[1] : 0);
    const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy);
    const bend = (hash(seed * 3.1) - 0.5) * Math.min(len, 600) * 0.24 * Math.sin(Math.PI * e);
    const x = fx + dx * e + (len > 0.5 ? (-dy / len) * bend : 0), y = fy + dy * e + (len > 0.5 ? (dx / len) * bend : 0);
    let size = data[o + 2] + (data[o + 5] - data[o + 2]) * e;
    if (data[o + 13] > TYPE) size *= 1 + (fade - 1) * e;
    const k = Math.min(1, Math.max(0, (t - 0.15) / 0.7)), c = k * k * (3 - 2 * k);
    const life = e < 0.5 ? data[o + 12] : data[o + 13];
    data[o] = x; data[o + 1] = y; data[o + 2] = size;
    for (let j = 0; j < 3; j++) data[o + 6 + j] += (data[o + 9 + j] - data[o + 6 + j]) * c;
    if (e >= 0.5) { data[o + 16] = data[o + 18]; data[o + 17] = data[o + 19]; }
    // Words that were following the scroll stay where they are now.
    data[o + 12] = life > TYPE ? 0 : life;
  }

  function place(f: Formation, i: number, s: number, end: boolean) {
    const o = i * STRIDE, base = end ? 0 : 3;
    data[o + base] = f.pos[s * 2]; data[o + base + 1] = f.pos[s * 2 + 1]; data[o + base + 2] = f.size[s];
    for (let j = 0; j < 3; j++) data[o + (end ? 6 : 9) + j] = f.col[s * 3 + j];
    data[o + (end ? 12 : 13)] = f.life[s];
    data[o + (end ? 16 : 18)] = f.aux[s * 2]; data[o + (end ? 17 : 19)] = f.aux[s * 2 + 1];
    keys[i] = f.key[s];
  }

  function index(f: Formation, to: Uint32Array | null) {
    // Only dots in a grid cell can be pushed. Dots set as type are only up while the words change over.
    owner.fill(-1);
    for (let i = 0; i < n; i++) {
      const s = to ? to[i] : i;
      if (s < grid.cells && f.size[s] > 0) owner[s] = i;
    }
  }

  function upload() {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
    dirty = true;
  }

  function set(f: Formation) {
    for (let i = 0; i < n; i++) { place(f, i, i, true); place(f, i, i, false); slot[i] = i; }
    index(f, null);
    clock = 1e3; dur = 1; end = 1; focusAt = -1e3; done = undefined;
    upload();
  }

  function morph(f: Formation, o: MorphOptions = {}) {
    if (opts.still) { set(f); o.onDone?.(); return; }
    // Which dots are words right now, before the snapshot forgets.
    const typed = new Uint8Array(n);
    for (let i = 0; i < n; i++) typed[i] = data[i * STRIDE + 13] > TYPE ? 1 : 0;
    for (let i = 0; i < n; i++) snapshot(i);
    // The snapshot has the scroll baked in, and the caller sets where the next words are.
    shiftF = [0, 0]; shiftT = [0, 0]; fade = 1;
    const to = pair(keys, f);
    slot = to;
    dur = o.dur ?? 1.25;
    const spread = o.spread ?? 0.75, order = o.order ?? 'sweep';
    let last = 0;
    for (let i = 0; i < n; i++) {
      const s = to[i];
      place(f, i, s, false);
      const x = f.pos[s * 2] / grid.w, y = f.pos[s * 2 + 1] / grid.h, r = hash(i * 7.31 + 1);
      const along = order === 'center' ? Math.min(1, Math.hypot(x - 0.5, (y - 0.5) * 0.8) * 1.6) : order === 'sweep' ? x * 0.8 + y * 0.2 : r;
      let delay = (along * 0.6 + r * 0.4) * spread;
      if (o.typeFirst) delay = typed[i] ? r * 0.12 : 0.18 + delay;
      data[i * STRIDE + 15] = delay;
      if (delay > last) last = delay;
    }
    end = last + dur;
    // Most dots are home a little before the last one arrives, and the picture snaps sharp just then.
    focusAt = end - 0.15; loose = o.focus === false ? 0 : 1;
    index(f, to);
    clock = 0; done = o.onDone;
    upload();
  }

  function adopt(f: Formation) {
    for (let i = 0; i < n; i++) {
      const s = slot[i];
      if (s < grid.cells) continue;
      place(f, i, s, true); place(f, i, s, false);
      data[i * STRIDE + 15] = -1e4;
    }
    shiftF = [0, 0]; shiftT = [0, 0]; fade = 1;
    upload();
  }

  function reset(g: Grid, f: Formation) {
    alloc(g);
    shiftF = [0, 0]; shiftT = [0, 0];
    set(f);
  }

  // ---- the pointer ------------------------------------------------------------------------------------------
  const R = opts.phone ? 70 : 110, K = 90, C = 9;
  function push(dt: number) {
    const speed = Math.min(1, Math.hypot(pvx, pvy) / 1400), strength = (0.3 + speed * 0.7) * 6000;
    const c0 = Math.max(0, Math.floor((px - R) / grid.cell)), c1 = Math.min(grid.cols - 1, Math.floor((px + R) / grid.cell));
    const r0 = Math.max(0, Math.floor((py - R) / grid.cell)), r1 = Math.min(grid.rows - 1, Math.floor((py + R) / grid.cell));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = owner[r * grid.cols + c];
      if (i < 0) continue;
      const hx = (c + 0.5) * grid.cell - px, hy = (r + 0.5) * grid.cell - py, d = Math.hypot(hx, hy);
      if (d >= R || d < 0.01) continue;
      const f = (1 - d / R) ** 2 * strength * dt;
      // Pushed out from the pointer, and a little along the way it's going.
      vel[i * 2] += (hx / d) * f + pvx * f * 0.00025; vel[i * 2 + 1] += (hy / d) * f + pvy * f * 0.00025;
      if (!active[i]) { active[i] = 1; list.push(i); }
    }
  }
  function springs(dt: number) {
    if (!list.length) return;
    const keep: number[] = [];
    for (const i of list) {
      const x = i * 2, y = x + 1;
      vel[x] += (-K * off[x] - C * vel[x]) * dt; vel[y] += (-K * off[y] - C * vel[y]) * dt;
      off[x] += vel[x] * dt; off[y] += vel[y] * dt;
      if (Math.abs(off[x]) + Math.abs(off[y]) < 0.05 && Math.abs(vel[x]) + Math.abs(vel[y]) < 0.5) { off[x] = off[y] = vel[x] = vel[y] = 0; active[i] = 0; }
      else keep.push(i);
    }
    list = keep;
    offDirty = true;
  }

  function frame(now: number, dt: number) {
    if (stopped) return;
    const was = clock;
    clock += dt;
    time = now;
    if (was < end && clock >= end && done) { const d = done; done = undefined; d(); }
    if (!opts.still) {
      if (pointerOn) push(Math.min(dt, 1 / 30));
      springs(Math.min(dt, 1 / 30));
      pvx *= 0.85; pvy *= 0.85;
    }
    if (offDirty) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, offBuf);
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, off);
      offDirty = list.length > 0;
    }
    // With reduced motion nothing moves, so only draw when something changed.
    if (opts.still && !dirty) return;
    dirty = false;
    gl!.uniform2f(u.view, grid.w, grid.h);
    gl!.uniform1f(u.clock, opts.still ? 1e3 : clock);
    gl!.uniform1f(u.dur, dur);
    gl!.uniform1f(u.time, opts.still ? 0 : time);
    gl!.uniform1f(u.cell, grid.cell);
    gl!.uniform1f(u.dpr, dpr);
    gl!.uniform1f(u.idle, opts.still ? 0 : 1);
    gl!.uniform1f(u.fade, fade);
    gl!.uniform2f(u.shf, shiftF[0], shiftF[1]);
    gl!.uniform2f(u.st, shiftT[0], shiftT[1]);
    gl!.uniform3f(u.dark, opts.dark[0], opts.dark[1], opts.dark[2]);
    gl!.uniform1f(u.focusAt, focusAt);
    gl!.uniform1f(u.loose, opts.still ? 0 : loose);
    gl!.uniform2f(u.drip, dripFrom, dripStop);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.POINTS, 0, n);
  }

  const lost = (e: Event) => { e.preventDefault(); stopped = true; canvas.style.visibility = 'hidden'; };
  canvas.addEventListener('webglcontextlost', lost);

  return {
    get grid() { return grid; },
    get busy() { return clock < end; },
    set, morph, adopt, reset, frame,
    shift(from, to) { shiftF = from; shiftT = to; dirty = true; },
    typeFade(v) { fade = v; dirty = true; },
    drip(from, stop) { dripFrom = from; dripStop = stop; },
    pointer(x, y) {
      const now = performance.now() / 1000;
      if (pointerOn) { const dt = Math.max(1 / 240, now - lastT); pvx = (x - px) / dt; pvy = (y - py) / dt; }
      px = x; py = y; lastT = now; pointerOn = true;
    },
    leave() { pointerOn = false; pvx = pvy = 0; },
    stop() {
      stopped = true;
      canvas.removeEventListener('webglcontextlost', lost);
      gl!.deleteBuffer(buf); gl!.deleteBuffer(offBuf); gl!.deleteProgram(prog);
    },
  };
}

