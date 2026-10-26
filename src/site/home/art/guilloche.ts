/* The note's engraved line work as pure functions: same input, same string. */

type Point = { x: number; y: number; nx: number; ny: number };
type Path = { len: number; at: (u: number) => Point };
type Ring = { r0: number; r1: number; n: number; copies: number; w?: number; o?: number };

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const f2 = (n: number) => (Math.round(n * 100) / 100).toString();
const TAU = 2 * Math.PI;
const svgUrl = (svg: string) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/[%#<>]/g, encodeURIComponent)}")`;

const BEAD = 42, WAVES = 3;
function beads(at: Path['at'], len: number, { half, strands = 6, step = 0.5, pinch = 0.8 }: { half: number; strands?: number; step?: number; pinch?: number }) {
  const n = Math.max(1, Math.round(len / BEAD)), bead = len / n, p = bead / WAVES;
  let d = '';
  for (let k = 0; k < strands; k++) {
    for (let u = 0; u <= len + 0.01; u += step) {
      const e = pinch + (half - pinch) * Math.pow(Math.abs(Math.sin((Math.PI * u) / bead)), 0.8);
      const { x, y, nx, ny } = at(u);
      const off = e * Math.sin((TAU * u) / p + (TAU * k) / strands);
      d += (u ? 'L' : 'M') + f1(x + nx * off) + ',' + f1(y + ny * off);
    }
  }
  return d;
}

function straight(x0: number, y0: number, x1: number, y1: number): Path {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  return { len, at: u => ({ x: x0 + ux * u, y: y0 + uy * u, nx: -uy, ny: ux }) };
}

function oval(cx: number, cy: number, rx: number, ry: number): Path {
  const N = 1440, pts: (Point & { s: number })[] = [];
  let len = 0;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU - Math.PI / 2;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    if (i) len += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    const nx = Math.cos(a) / rx, ny = Math.sin(a) / ry, nl = Math.hypot(nx, ny);
    pts.push({ x, y, nx: nx / nl, ny: ny / nl, s: len });
  }
  const at = (u: number) => {
    u = Math.min(Math.max(u, 0), len);
    let lo = 0, hi = N;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid].s < u) lo = mid; else hi = mid; }
    return pts[hi];
  };
  return { len, at };
}

function rose(c: number, rings: Ring[]) {
  return rings.map(({ r0, r1, n, copies, w = .45, o = .6 }) => {
    const steps = n * 20;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU, r = r0 + (r1 - r0) * (.5 + .5 * Math.sin(n * a));
      d += (i ? 'L' : 'M') + f2(c + r * Math.cos(a)) + ',' + f2(c + r * Math.sin(a));
    }
    let g = '';
    for (let k = 0; k < copies; k++) g += `<path d="${d}"${k ? ` transform="rotate(${f2((k * 360) / n / copies)} ${c} ${c})"` : ''}/>`;
    return `<g stroke-width="${w}" stroke-opacity="${o}">${g}</g>`;
  }).join('');
}

// The corner and border-image slice size (banknote.css slices at 30); the edge tile is one bead, so `round`
// repeats whole beads along any length.
const C = 30;

export function borderImage(ink: string): string {
  const W = 2 * C + BEAD, mid = C / 2;
  const band = (e: Path) => beads(e.at, e.len, { half: 6 });
  const edges = [straight(C, mid, C + BEAD, mid), straight(C, W - mid, C + BEAD, W - mid), straight(mid, C, mid, C + BEAD), straight(W - mid, C, W - mid, C + BEAD)];
  const o = 1.5, i = C - 2.5;
  const boss = [[mid, mid], [W - mid, mid], [mid, W - mid], [W - mid, W - mid]]
    .map(([x, y]) => `<use href="#r" x="${f1(x - 11)}" y="${f1(y - 11)}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" fill="none" stroke="${ink}">` +
    `<defs><g id="r">${rose(11, [{ r0: 2.4, r1: 9.4, n: 9, copies: 4, w: .4, o: .7 }])}<circle cx="11" cy="11" r="10.6" stroke-width=".5" stroke-opacity=".6"/></g></defs>` +
    `<path d="${edges.map(band).join('')}" stroke-width=".4" stroke-opacity=".62"/>` +
    `<rect x="${o}" y="${o}" width="${W - 2 * o}" height="${W - 2 * o}" stroke-width=".7" stroke-opacity=".7"/>` +
    `<rect x="${i}" y="${i}" width="${W - 2 * i}" height="${W - 2 * i}" stroke-width=".55" stroke-opacity=".75"/>` +
    boss + `</svg>`;
  return svgUrl(svg);
}

export function cameo(iw: number, ih: number): { w: number; h: number; svg: string } {
  const m = 18, W = iw + 2 * m, H = ih + 2 * m, cx = W / 2, cy = H / 2;
  const rx = iw / 2 + 8.5, ry = ih / 2 + 8.5;
  const o = oval(cx, cy, rx, ry);
  const d = beads(o.at, o.len, { half: 5, strands: 6, step: 1 });
  const ring = (a: number, b: number) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(a)}" ry="${f1(b)}"/>`;
  return {
    w: W, h: H,
    svg: `<svg class="cameo__frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">` +
      `<g stroke-width=".7" stroke-opacity=".7">${ring(rx + 7.5, ry + 7.5)}</g>` +
      `<path d="${d}" stroke-width=".38" stroke-opacity=".6"/>` +
      `<g stroke-width=".55" stroke-opacity=".75">${ring(rx - 7, ry - 7)}</g></svg>`,
  };
}

export function waveField(ink: string): string {
  const Wd = 168, gap = 4.2, rows = 12, amp = 3.2;
  let d = '';
  for (let r = 0; r < rows; r++) {
    const y0 = r * gap + gap / 2, ph = (r / rows) * TAU;
    for (let x = 0; x <= Wd; x += 3) d += (x ? 'L' : 'M') + x + ',' + f2(y0 + amp * Math.sin((TAU * x) / Wd + ph));
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${f1(rows * gap)}" width="${Wd}" height="${f1(rows * gap)}"><path d="${d}" fill="none" stroke="${ink}" stroke-width=".4"/></svg>`;
  return svgUrl(svg);
}

export function bandRule(ink: string): string {
  const H = 11, d = beads(straight(0, H / 2, BEAD, H / 2).at, BEAD, { half: 3.6, strands: 4 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BEAD} ${H}" width="${BEAD}" height="${H}" fill="none" stroke="${ink}">` +
    `<path d="${d}" stroke-width=".4" stroke-opacity=".5"/><path d="M0,.5H${BEAD}M0,${H - .5}H${BEAD}" stroke-width=".6" stroke-opacity=".55"/></svg>`;
  return svgUrl(svg);
}
