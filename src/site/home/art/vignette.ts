/* The hero's picture: look D's banknote vignette, ported from blend() in design-system/components.html.
   Layered ridges in fine violet hatching, shaded on the slopes that face away from the sun, pines along the near
   ridges, finer water with the hills' reflection and a faint ruled sky. No frame: the plate's CSS mask fades it into
   the paper at the edges. The halftone sun, in the one blue, sits behind the far range, clipped to the sky so it can
   rise from behind it, and glints on the water under it.

   Pure and deterministic: the same size always draws the same picture. It returns three SVGs stacked in one box,
   so the sun and the glints can move on their own layers without repainting the hills:
   .vig__sun (bottom), .vig__land, .vig__glints (top). Lengths are in CSS pixels at the given size, so draw it at
   the size it's shown. Under 760px wide it draws the narrow variant: a bigger sun and coarser rules. */

type Ridge = (x: number) => number;

const seeded = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const f1 = (n: number) => n.toFixed(1);

function pine(x: number, base: number, ht: number) {
  let p = `M${f1(x)},${f1(base + 1)}V${f1(base - ht)}`;
  const n = Math.max(4, Math.round(ht / 2.6));
  for (let k = 0; k < n; k++) {
    const t = k / n, yk = base - ht * (0.14 + 0.84 * t), hw = ht * 0.3 * (1 - t) + 0.7, dy = hw * 0.5;
    p += `M${f1(x)},${f1(yk - 0.8)}l${f1(-hw)},${f1(dy)}M${f1(x)},${f1(yk - 0.8)}l${f1(hw)},${f1(dy)}`;
  }
  return p;
}

/** Engraver's shading: rules that follow the ridge down the hill. Each run of a rule is filed into one of four
 *  tones by how far the slope turns from the light (upper right) and how deep below the crest it sits, with a
 *  little jitter so tone edges feather. The darkest tone also gets a rule between the rules. */
function engraveLayer(R: Ridge, front: Ridge[], x0: number, x1: number, sp: number, deep: number, light = 1) {
  const tones = ['', '', '', ''];
  const hash = (a: number, b: number) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const tone = (x: number, o: number, k: number) => {
    const s = (R(x + 5) - R(x - 5)) / 10, shadow = 0.5 - 0.5 * Math.tanh(s * 2.4 * light);
    const v = 0.12 + 0.55 * shadow + 0.33 * Math.min(1, o / deep) + 0.1 * Math.sin(x * 0.13 + k * 1.7) + 0.07 * Math.sin(x * 0.047 - k * 0.9) + (hash(Math.round(x / 3), k) - 0.5) * 0.06;
    return Math.max(0, Math.min(3, Math.floor(v * 4)));
  };
  const step = 3;
  const row = (o: number, k: number, only: number | null) => {
    let cur = -1, pen = false;
    for (let x = x0; x <= x1; x += step) {
      const y = R(x) + o;
      let lim = Infinity;
      for (const F of front) lim = Math.min(lim, F(x) - 0.6);
      const vis = y < lim;
      const t = vis ? tone(x, o, k) : -1;
      const ok = vis && (only == null || t >= only);
      const b = only == null ? t : 3;
      if (!ok) { cur = -1; pen = false; continue; }
      const pt = `${x.toFixed(0)},${f1(y)}`;
      if (b !== cur) { if (pen && cur >= 0) tones[cur] += 'L' + pt; tones[b] += 'M' + pt; cur = b; pen = true; }
      else tones[b] += 'L' + pt;
    }
  };
  for (let k = 1, o = sp * 0.8; o < deep * 2.2; k++, o += sp * (1 + k * 0.012)) {
    row(o, k, null);
    row(o + sp * 0.5, k + 500, 3);
  }
  return tones;
}

function contour(R: Ridge, front: Ridge[], x0: number, x1: number, dy = 0) {
  let p = '', pen = false;
  for (let x = x0; x <= x1; x += 2) {
    const y = R(x) + dy, ok = front.every(F => y < F(x) - 0.5);
    if (ok) { p += (pen ? 'L' : 'M') + f1(x) + ',' + f1(y); pen = true; } else pen = false;
  }
  return p;
}

export function vignette(width: number, height: number): string {
  const W = Math.round(width), H = Math.round(height), narrow = W < 760;
  const rnd = seeded(7);
  const x0 = 0, y0 = 0, w = W, h = H, x1 = W, y1 = H;
  const hz = y0 + h * 0.72; // horizon
  const U = (x: number) => (x - x0) / w;
  const far: Ridge = x => { const u = U(x); return hz - h * (0.25 + 0.07 * Math.sin(u * 6.1 + 0.4) + 0.04 * Math.sin(u * 14.3 + 1.1) + 0.012 * Math.sin(u * 41 + 2)); };
  const mid: Ridge = x => { const u = U(x); return hz - h * (0.06 + 0.32 * Math.exp(-((u - 0.27) ** 2) / 0.016) + 0.07 * Math.exp(-((u - 0.5) ** 2) / 0.008) + 0.008 * Math.sin(u * 63)); };
  const near: Ridge = x => { const u = U(x); return hz - h * (0.015 + 0.17 * Math.exp(-((u - 0.95) ** 2) / 0.010) + 0.07 * Math.exp(-((u + 0.01) ** 2) / 0.003)); };
  const ground: Ridge = x => Math.min(far(x), mid(x), near(x));
  const sunX = x0 + w * (narrow ? 0.68 : 0.70), sunR = h * (narrow ? 0.25 : 0.27);
  const sunY = far(sunX) + sunR * 0.18;
  const sp = narrow ? 1.9 : 1.7;

  // Sky: faint rules, denser toward the horizon, with a halo cut round the sun.
  const skyBands = ['', '', ''];
  for (let y = y0 + 3; y < hz; y += narrow ? 2.6 : 2.4) {
    const band = Math.min(2, Math.floor(((y - y0) / (hz - y0)) * 3));
    let on = -1;
    for (let x = x0; x <= x1 + 2; x += 2) {
      const ok = x <= x1 && y < ground(x) - 2.5 && Math.hypot(x - sunX, y - sunY) > sunR * 1.28;
      if (ok && on < 0) on = x;
      if (!ok && on >= 0) { if (x - on > 2) skyBands[band] += `M${on},${f1(y)}H${Math.min(x, x1)}`; on = -1; }
    }
  }

  // Halftone sun, clipped to the sky.
  let skyClip = `M${x0},${y0}H${x1}`;
  for (let x = x1; x >= x0; x -= 3) skyClip += `L${x},${f1(ground(x))}`;
  skyClip += 'Z';
  let dots = '';
  const ds = narrow ? 3.8 : 4.2;
  for (let y = sunY - sunR; y <= sunY + sunR; y += ds) for (let x = sunX - sunR; x <= sunX + sunR; x += ds) {
    const d = Math.hypot(x - sunX, y - sunY);
    if (d > sunR) continue;
    dots += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${(0.35 + ds * 0.36 * (1 - d / sunR) ** 0.6).toFixed(2)}"/>`;
  }

  // Land, back to front.
  const hor: Ridge = () => hz - 0.6;
  const farT = engraveLayer(far, [mid, near, hor], x0, x1, sp * 1.3, h * 0.22, 0.8);
  const midT = engraveLayer(mid, [near, hor], x0, x1, sp * 1.05, h * 0.26);
  const nearT = engraveLayer(near, [hor], x0, x1, sp * 0.9, h * 0.14);
  const ridges = contour(far, [mid, near], x0, x1) + contour(mid, [near], x0, x1) + contour(near, [], x0, x1);
  const ridges2 = contour(far, [mid, near], x0, x1, 2.2) + contour(mid, [near], x0, x1, 2.4);

  // Pines on the mid ridge and the near banks.
  let pines = '';
  for (let x = x0 + w * 0.10; x < x0 + w * 0.47; x += (narrow ? 6 : 7) + rnd() * 9) {
    const base = mid(x) + 1.5 + rnd() * 2;
    if (base > near(x) - 2) continue;
    pines += pine(x, base, (narrow ? 6 : 8) + rnd() * (narrow ? 6 : 9) + (1 - Math.abs(U(x) - 0.27) * 4) * 3);
  }
  for (let x = x0 + w * 0.86; x < x1 - 4; x += 8 + rnd() * 10) pines += pine(x, near(x) + 2, (narrow ? 9 : 12) + rnd() * 10);
  for (let x = x0 + 4; x < x0 + w * 0.07; x += 7 + rnd() * 8) pines += pine(x, near(x) + 2, (narrow ? 8 : 10) + rnd() * 8);

  // Water: fine broken rules that open up toward the viewer, darker where the hills reflect.
  let water = '', deep = '', reflect = '';
  for (let y = hz + 1.4, k = 0; y < y1; k++) {
    const t = (y - hz) / (y1 - hz);
    let x = x0 + rnd() * 20;
    while (x < x1) {
      const len = (narrow ? 14 : 22) + rnd() * (90 * (1 - t) + 20), gap = 2 + rnd() * (6 + 26 * t);
      const seg = `M${f1(x)},${f1(y)}H${f1(Math.min(x1, x + len))}`;
      if (t < 0.45) deep += seg; else water += seg;
      x += len + gap;
    }
    // Reflection: extra rows under each hill, as deep as the hill is tall.
    let on = -1;
    for (let x = x0; x <= x1 + 2; x += 2) {
      const ok = x <= x1 && (y - hz) < (hz - Math.min(mid(x), near(x))) * 0.62 && ((x * 13 + k * 7) % 11) > 2;
      if (ok && on < 0) on = x;
      if (!ok && on >= 0) { if (x - on > 3) reflect += `M${on},${f1(y + 0.8)}H${x}`; on = -1; }
    }
    y += 1.4 + 3.2 * t ** 1.3;
  }

  // Sun glints on the water, the only other blue.
  let glint = '';
  for (let y = hz + 2, k = 0; y < y1 - 2; y += 3.2, k++) for (let x = sunX - sunR * 1.2; x < sunX + sunR * 1.2; x += ds) {
    const fall = 1 - Math.abs(x - sunX) / (sunR * (0.55 + k * 0.07));
    const r = 0.25 + 1.1 * fall * (1 - k / 16);
    if (r < 0.45 || ((x / ds + k * 2) | 0) % 3 === 0) continue;
    glint += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r.toFixed(2)}"/>`;
  }

  const box = `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false"`;
  const tone = (ts: string[], op: number[]) => ts.map((d, i) => d && `<path d="${d}" stroke-opacity="${op[i]}"/>`).join('');
  const sun =
    `<svg class="vig__sun" ${box}><defs><clipPath id="vig-sky"><path d="${skyClip}"/></clipPath></defs>` +
    `<g clip-path="url(#vig-sky)"><g class="vig__rise" style="--rise:${(sunR * 0.55).toFixed(0)}px">${dots}</g></g></svg>`;
  const land =
    `<svg class="vig__land" ${box}><g fill="none" stroke="currentColor" stroke-width=".5">` +
    `<path d="${skyBands[0]}" stroke-opacity=".08"/><path d="${skyBands[1]}" stroke-opacity=".12"/><path d="${skyBands[2]}" stroke-opacity=".17"/></g>` +
    `<g fill="none" stroke="currentColor" stroke-width=".55">` +
    tone(farT, [0.12, 0.2, 0.28, 0.34]) + tone(midT, [0.18, 0.3, 0.42, 0.52]) + tone(nearT, [0.26, 0.42, 0.56, 0.68]) +
    `<path d="${ridges2}" stroke-opacity=".28"/>` +
    `<path d="${ridges}" stroke-width=".8" stroke-opacity=".75"/>` +
    `<path d="${pines}" stroke-width=".6" stroke-opacity=".78" stroke-linecap="round"/>` +
    `<path d="M${x0},${f1(hz)}H${x1}" stroke-width=".6" stroke-opacity=".45"/>` +
    `<path d="${deep}" stroke-opacity=".4"/><path d="${water}" stroke-opacity=".26"/><path d="${reflect}" stroke-opacity=".3"/></g>` +
    `<g fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-opacity=".75">` +
    `<path d="M${f1(x0 + w * 0.47)},${f1(y0 + h * 0.24)} q4,-4 8,0 q4,-4 8,0"/><path d="M${f1(x0 + w * 0.51)},${f1(y0 + h * 0.30)} q3,-3 6,0 q3,-3 6,0"/>` +
    `<path d="M${f1(x0 + w * 0.42)},${f1(y0 + h * 0.19)} q3,-3 6,0 q3,-3 6,0"/></g></svg>`;
  const glints = `<svg class="vig__glints" ${box}>${glint}</svg>`;
  return sun + land + glints;
}
