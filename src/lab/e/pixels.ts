import type { Palette } from './palette';

/* Blocky pixel dissolves, like the squares breaking up the edge of the reference. A screen is cut into square
   blocks, and each block turns over at its own moment, set by an 8x8 ordered dither, so the change spreads in
   that checkered way instead of as a wipe. Two uses: the curtain that covers the page before a project opens,
   and the picture that follows the pointer over the work, which changes from one project to the next this way. */

const B8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
/** When a block turns over, 0 to 1: mostly the dither, with a little noise so it doesn't look printed. */
export function blockAt(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (B8[(y & 7) * 8 + (x & 7)] / 64) * 0.82 + (n - Math.floor(n)) * 0.18;
}

/** The curtain: blocks cover the page, passing through the palette's tones on the way to the dark of the project
 *  pages, then the project's name. `draw(p)` paints it at progress p (0 open, 1 covered). */
export function curtainPainter(canvas: HTMLCanvasElement, palette: Palette) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let size = 0, cols = 0, rows = 0;
  const steps = [palette.tones[5], palette.tones[3], palette.tones[1], '#090f1c'];
  function fit() {
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    size = Math.max(28, Math.round(Math.max(w, h) / 30));
    cols = Math.ceil(w / size); rows = Math.ceil(h / size);
  }
  return {
    fit,
    draw(p: number) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        // Each block takes a third of the time to turn over, through the tones, starting at its own moment.
        const k = (p - blockAt(x, y) * 0.66) / 0.34;
        if (k <= 0) continue;
        ctx.fillStyle = steps[Math.min(steps.length - 1, Math.floor(k * steps.length))];
        ctx.fillRect(x * size, y * size, size + 0.5, size + 0.5);
      }
    },
  };
}

type Pic = HTMLImageElement | HTMLCanvasElement;

/** The picture over the work index. `show(pic)` dissolves to it from whatever was there, block by block. */
export function peekPainter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let from: Pic | null = null, to: Pic | null = null, p = 1, raf = 0, last = 0;
  const w = () => canvas.clientWidth, h = () => canvas.clientHeight;
  const cover = (pic: Pic) => {
    const pw = pic instanceof HTMLImageElement ? pic.naturalWidth : pic.width, ph = pic instanceof HTMLImageElement ? pic.naturalHeight : pic.height;
    const s = Math.max(w() / pw, h() / ph);
    return { sw: w() / s, sh: h() / s, sx: (pw - w() / s) / 2, sy: (ph - h() / s) * 0.2 };
  };
  function paint() {
    if (!ctx) return;
    if (canvas.width !== Math.round(w() * dpr)) { canvas.width = Math.round(w() * dpr); canvas.height = Math.round(h() * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w(), h());
    const size = Math.max(14, Math.round(w() / 16)), cols = Math.ceil(w() / size), rows = Math.ceil(h() / size);
    const a = from && cover(from), b = to && cover(to);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const showNew = p >= 1 || blockAt(x, y) * 0.9 < p;
      const pic = showNew ? to : from, c = showNew ? b : a;
      if (!pic || !c) continue;
      const fx = (x * size) / w(), fy = (y * size) / h(), fw = size / w(), fh = size / h();
      ctx.drawImage(pic, c.sx + fx * c.sw, c.sy + fy * c.sh, fw * c.sw, fh * c.sh, x * size, y * size, size + 0.5, size + 0.5);
    }
  }
  function tick(now: number) {
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    p = Math.min(1, p + dt / 0.42);
    paint();
    raf = p < 1 ? requestAnimationFrame(tick) : 0;
  }
  return {
    show(pic: Pic | null) {
      if (pic === to) return;
      from = to; to = pic; p = 0; last = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}

/** Port has no screenshots, so its picture is the ring you hold, drawn once. */
export function portPicture(ink: string) {
  const c = document.createElement('canvas');
  c.width = 840; c.height = 560;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const g = ctx.createRadialGradient(420, 250, 20, 420, 250, 520);
  g.addColorStop(0, '#2a3346'); g.addColorStop(1, '#151a26');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 840, 560);
  ctx.strokeStyle = ink; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(420, 250, 64, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgb(236 235 230 / 0.7)';
  ctx.font = '400 22px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOLD TO CLOSE', 420, 380);
  return c;
}
