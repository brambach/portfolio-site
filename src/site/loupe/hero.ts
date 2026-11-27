import { context, fullscreen, loadImage, texture } from './gl';

/* The hero: a wall of every project drifting in the dark, dim and grey, and a glass loupe that follows the pointer (or
   a thumb) and shows whatever is under it magnified and in full color, the name included. It's one fragment shader:
   the wall is a tilted plane worked out per pixel, tiled from one picture of all the work (public/loupe/atlas.webp),
   and the lens samples that scene three times, once per color, so its edge splits light like real glass.

   The name is drawn by the page in HTML (for search, screen readers and selection) and copied glyph by glyph into a
   texture at the same spots, so the glass can bend it. The HTML copy is kept transparent while the canvas draws.

   Everything is optional: no WebGL2, a shader that won't compile or a lost context and the page keeps its plain
   name on a dark field (Home.tsx). */

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uAtlas;
uniform sampler2D uName;
uniform vec2 uLens;
uniform float uR;
uniform float uMag;
uniform vec2 uDrift;
uniform float uTilt;
uniform float uRoll;
uniform float uDist;
uniform float uReady;
uniform float uNameA;
uniform vec2 uNameOff;
uniform float uDim;
uniform float uTime;
uniform float uTexel;
uniform float uFade;
out vec4 outColor;

const vec2 TILE = vec2(1.6, 1.0);
const float GAP = 0.16;
const float RAD = 0.05;
const vec3 BG = vec3(0.035, 0.035, 0.037);
const vec3 INK = vec3(0.955, 0.948, 0.925);

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

// The wall at a point on screen: its color, and how much of the pixel it covers (gaps, fog and the horizon are 0).
// zoom is how much the loupe magnifies here, so the picture is read at the right sharpness.
vec4 wall(vec2 frag, float zoom) {
  vec2 q = (frag - 0.5 * uRes) / uRes.y;
  vec3 dir = normalize(vec3(q, -1.35));
  mat3 R = rotZ(uRoll) * rotX(uTilt);
  vec3 n = R * vec3(0., 0., 1.);
  vec3 P0 = vec3(0., 0., -uDist);
  float den = dot(dir, n);
  float hit = step(den, -0.0005);
  float t = clamp(dot(P0, n) / min(den, -0.0005), 0., 400.);
  vec3 h = dir * t;
  vec2 uv = (transpose(R) * (h - P0)).xy + uDrift;
  vec2 period = TILE + GAP;
  float row = floor(uv.y / period.y);
  vec2 su = vec2(uv.x + row * period.x * 0.5, uv.y);
  vec2 cell = floor(su / period);
  vec2 lp = su - cell * period;
  // World units per screen pixel here, for the edge softening and the texture's level of detail.
  float pw = t / (1.35 * uRes.y) / max(-den, 0.08) / zoom;
  float d = sdRound(lp - TILE * 0.5, TILE * 0.5, RAD);
  float inside = 1. - smoothstep(-pw, pw, d);
  float idx = mod(cell.x * 3. + cell.y * 7., 16.);
  vec2 cr = vec2(mod(idx, 4.), floor(idx / 4.));
  float lod = log2(max(pw * uTexel, 1.));
  float m = 0.75 * exp2(lod) / uTexel / TILE.x + 0.002;
  vec2 tuv = clamp(lp / TILE, m, 1. - m);
  tuv.y = 1. - tuv.y;
  vec3 c = textureLod(uAtlas, (cr + tuv) / 4., lod).rgb;
  float fog = exp(-max(t - uDist, 0.) * 0.11);
  return vec4(c, inside * fog * hit);
}

// Everything under the glass: the wall, graded (k 0 is the dim grey outside, 1 the full color inside), and the name.
vec3 scene(vec2 p, vec2 pn, float zoom, float k) {
  vec4 w = wall(p, zoom);
  float lum = dot(w.rgb, vec3(0.299, 0.587, 0.114));
  vec3 c = mix(vec3(lum) * uDim, w.rgb, k);
  vec3 col = mix(BG, c, w.a * mix(uReady, 1., k));
  float a = texture(uName, (pn - uNameOff) / uRes).r * uNameA;
  return mix(col, INK, a);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 rel = (p - uLens) / max(uR, 1.);
  float d = length(rel);
  vec3 col = scene(p, p, 1., 0.);
  // The loupe's shadow on the wall, a little below and to the right.
  float sd = length((p - uLens - vec2(0.06, -0.12) * uR) / max(uR, 1.));
  col *= 1. - 0.6 * smoothstep(1.5, 0.9, sd) * step(1., uR);
  float edge = 1.5 / max(uR, 1.);
  float mask = (1. - smoothstep(1. - edge, 1., d)) * step(1., uR);
  if (mask > 0.) {
    // Less magnification toward the rim, like a real lens, and the colors split more there.
    float m = uMag * mix(1., 0.62, pow(d, 2.2));
    float ca = 0.012 + 0.07 * pow(d, 3.);
    // The name sits nearer the glass than the wall, so it swells less.
    vec2 off = p - uLens;
    float mn = 1. + (m - 1.) * 0.45;
    float r = scene(uLens + off / (m * (1. - ca)), uLens + off / (mn * (1. - ca)), m, 1.).r;
    float g = scene(uLens + off / m, uLens + off / mn, m, 1.).g;
    float b = scene(uLens + off / (m * (1. + ca)), uLens + off / (mn * (1. + ca)), m, 1.).b;
    vec3 lens = vec3(r, g, b);
    lens *= mix(1.05, 0.74, smoothstep(0.78, 1., d));
    float ring = smoothstep(0.95, 0.982, d) * (1. - smoothstep(0.982, 1., d));
    lens += ring * 0.42;
    float spec = smoothstep(0.46, 0., length(rel - vec2(-0.34, 0.42)));
    lens += spec * spec * 0.2;
    float arc = smoothstep(0.05, 0., abs(d - 0.9)) * smoothstep(0.15, 0.85, dot(rel / max(d, 0.001), vec2(0.6, -0.8)));
    lens += arc * 0.12;
    col = mix(col, lens, mask);
  }
  vec2 v = p / uRes - 0.5;
  col *= 1. - 0.9 * dot(v, v);
  col += (hash(p + fract(uTime) * 91.7) - 0.5) * 0.028;
  outColor = vec4(col * uFade, 1.);
}`;

export type Hero = {
  start(): void;
  stop(): void;
  destroy(): void;
  /** 0 while the hero fills the screen, 1 once the page has scrolled past it. */
  exit(p: number): void;
  /** Redraw the name, after the face loads or the layout changes. */
  name(): void;
};

type Opts = { canvas: HTMLCanvasElement; name: HTMLElement; reduced: boolean; onLost?: () => void };

const STRETCH: Record<string, string> = { '50%': 'ultra-condensed', '62.5%': 'extra-condensed', '75%': 'condensed', '87.5%': 'semi-condensed', '100%': 'normal', '112.5%': 'semi-expanded', '125%': 'expanded', '150%': 'extra-expanded', '200%': 'ultra-expanded' };

export function mountHero({ canvas, name, reduced, onLost }: Opts): Hero | null {
  const gl = context(canvas);
  if (!gl) return null;
  let prog;
  try { prog = fullscreen(gl, FRAG); } catch { return null; }
  const P = prog;

  const small = Math.min(innerWidth, innerHeight) < 600;
  const atlas = texture(gl, { mips: true }), words = texture(gl, { flip: true });
  const texel = small ? 352 : 640;
  let atlasIn = false;
  loadImage(small ? '/loupe/atlas-sm.webp' : '/loupe/atlas.webp').then(img => { if (!gone) { atlas.upload(img); atlasIn = true; } }, () => {});

  const ink = document.createElement('canvas'), ctx = ink.getContext('2d');
  let W = 1, H = 1, dpr = 1, raf = 0, running = false, gone = false, exitP = 0, nameReady = false;
  const now = () => performance.now() / 1000;
  const t0 = now();
  let last = t0;

  // The lens: where it is, where it's headed and how fast it's going, in CSS pixels.
  const lens = { x: innerWidth * 0.5, y: innerHeight * 0.45, vx: 0, vy: 0, tx: innerWidth * 0.5, ty: innerHeight * 0.45 };
  let mode: 'intro' | 'idle' | 'hand' = reduced ? 'idle' : 'intro', handAt = -10, mag = 1.85, magT = 1.85, ready = 0, drift = { x: 0, y: 0 };

  const rect = () => canvas.getBoundingClientRect();

  function size() {
    const r = rect();
    const cap = Math.sqrt(5.2e6 / Math.max(1, r.width * r.height));
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, cap));
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    drawName();
  }

  // Copies the name into the texture, each letter where the page set it.
  function drawName() {
    if (!ctx) return;
    ink.width = W; ink.height = H;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    const box = rect();
    for (const line of name.querySelectorAll<HTMLElement>('.ln')) {
      const cs = getComputedStyle(line), mark = line.querySelector('.bl');
      if (!mark) continue;
      const base = (mark.getBoundingClientRect().top - box.top) * dpr;
      const size = parseFloat(cs.fontSize) * dpr, ls = (parseFloat(cs.letterSpacing) || 0) * dpr;
      const stretch = STRETCH[cs.fontStretch] ?? (cs.fontStretch || 'normal');
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${stretch} ${size}px ${cs.fontFamily}`;
      ctx.textBaseline = 'alphabetic';
      const upper = cs.textTransform === 'uppercase';
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        const text = node.data;
        for (let i = 0; i < text.length; i++) {
          const ch = upper ? text[i].toUpperCase() : text[i];
          if (!ch.trim()) continue;
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          const x = (r.left - box.left) * dpr, want = r.width * dpr - ls, got = ctx.measureText(ch).width;
          const sx = got > 0 && want > 0 && Math.abs(want / got - 1) > 0.04 ? want / got : 1;
          ctx.save();
          ctx.translate(x, base);
          ctx.scale(sx, 1);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        }
      }
    }
    words.upload(ink);
    nameReady = true;
  }

  const idle = (t: number) => {
    const r = rect(), wide = r.width > 760;
    return wide
      ? { x: r.width * (0.6 + 0.2 * Math.sin(t * 0.21)), y: r.height * (0.46 + 0.17 * Math.sin(t * 0.29 + 1.3)) }
      : { x: r.width * (0.5 + 0.24 * Math.sin(t * 0.24)), y: r.height * (0.33 + 0.1 * Math.sin(t * 0.33 + 0.8)) };
  };

  const local = (cx: number, cy: number) => { const r = rect(); return { x: cx - r.left, y: cy - r.top }; };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const p = local(e.clientX, e.clientY);
    lens.tx = p.x; lens.ty = p.y;
    if (mode !== 'intro') mode = 'hand';
    handAt = now();
  };
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const p = local(t.clientX, t.clientY);
    lens.tx = p.x; lens.ty = p.y - (small ? 70 : 0);
    if (mode !== 'intro') mode = 'hand';
    handAt = now();
  };
  const onLeave = () => { handAt = -10; };
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('a,button')) return;
    magT = magT < 2.5 ? 3.1 : 1.85;
  };
  const host = canvas.parentElement!;
  addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('touchstart', onTouch, { passive: true });
  host.addEventListener('touchmove', onTouch, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  host.addEventListener('click', onClick);

  const lost = (e: Event) => { e.preventDefault(); stop(); onLost?.(); };
  canvas.addEventListener('webglcontextlost', lost);

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => size()) : null;
  ro?.observe(canvas);
  size();

  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function frame() {
    raf = 0;
    if (!running) return;
    const t = now(), dt = Math.min(0.05, t - last), age = t - t0;
    last = t;
    const r = rect();
    const base = Math.min(r.width, r.height) * (r.width > 760 ? 0.175 : 0.235);

    // Where the lens is headed: the middle while it opens, then the pointer, or a slow wander when nobody's steering.
    if (mode === 'intro') {
      lens.tx = r.width * 0.5; lens.ty = r.height * 0.46;
      if (age > 1.5) mode = 'idle';
    } else if (mode === 'hand' && t - handAt > 3.2) mode = 'idle';
    if (mode === 'idle' && !reduced) { const i = idle(age); lens.tx = i.x; lens.ty = i.y; }
    // Holding still, it rests over the wall beside the name instead of on it, until a hand moves it.
    if (mode === 'idle' && reduced && handAt < 0) { lens.tx = r.width * (r.width > 760 ? 0.76 : 0.7); lens.ty = r.height * (r.width > 760 ? 0.3 : 0.24); }
    if (reduced) { lens.x = lens.tx; lens.y = lens.ty; }
    else {
      const k = mode === 'hand' ? 110 : 18, c = 2 * Math.sqrt(k) * (mode === 'hand' ? 0.8 : 1);
      lens.vx += (k * (lens.tx - lens.x) - c * lens.vx) * dt;
      lens.vy += (k * (lens.ty - lens.y) - c * lens.vy) * dt;
      lens.x += lens.vx * dt; lens.y += lens.vy * dt;
    }
    if (mode === 'intro' && age < 0.05) { lens.x = lens.tx; lens.y = lens.ty; }

    mag += (magT - mag) * Math.min(1, dt * 7);
    if (atlasIn) ready = Math.min(1, ready + dt / (reduced ? 0.01 : 1.1));
    const open = reduced ? 1 : age < 0.9 ? ease(age / 0.9) * 1.32 : 1.32 - 0.32 * smooth(0.9, 1.9, age);
    const radius = base * open * (1 - 0.85 * smooth(0, 0.9, exitP));
    if (!reduced) { drift.x += dt * 0.055; drift.y += dt * 0.022; }

    gl!.viewport(0, 0, W, H);
    P.use();
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, atlas.t);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, words.t);
    gl!.uniform1i(P.u('uAtlas'), 0);
    gl!.uniform1i(P.u('uName'), 1);
    gl!.uniform2f(P.u('uRes'), W, H);
    gl!.uniform2f(P.u('uLens'), lens.x * dpr, H - lens.y * dpr);
    gl!.uniform1f(P.u('uR'), radius * dpr);
    gl!.uniform1f(P.u('uMag'), mag);
    gl!.uniform2f(P.u('uDrift'), drift.x, drift.y);
    gl!.uniform1f(P.u('uTilt'), 0.62 + exitP * 0.42);
    gl!.uniform1f(P.u('uRoll'), -0.2 + exitP * 0.08);
    gl!.uniform1f(P.u('uDist'), 4.2 + exitP * 2.5);
    gl!.uniform1f(P.u('uReady'), reduced ? (atlasIn ? 1 : 0) : ease(ready));
    gl!.uniform1f(P.u('uNameA'), nameReady ? (reduced ? 1 : smooth(0.35, 1.3, age)) * (1 - smooth(0.1, 0.75, exitP)) : 0);
    gl!.uniform2f(P.u('uNameOff'), 0, exitP * 140 * dpr);
    gl!.uniform1f(P.u('uDim'), 0.16);
    gl!.uniform1f(P.u('uTime'), t);
    gl!.uniform1f(P.u('uTexel'), texel / 1.6);
    gl!.uniform1f(P.u('uFade'), 1 - 0.55 * exitP);
    P.draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || gone) return;
    running = true;
    last = now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  return {
    start,
    stop,
    exit: p => { exitP = Math.min(1, Math.max(0, p)); },
    name: () => drawName(),
    destroy() {
      gone = true;
      stop();
      ro?.disconnect();
      removeEventListener('pointermove', onMove);
      host.removeEventListener('touchstart', onTouch);
      host.removeEventListener('touchmove', onTouch);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('click', onClick);
      canvas.removeEventListener('webglcontextlost', lost);
      atlas.dispose(); words.dispose(); P.dispose();
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
