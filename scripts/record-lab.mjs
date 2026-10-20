// Screen recordings and stills of the motion lab, for comparing the directions.
// Run `npm run build && npm run preview` first, then:
//   node scripts/record-lab.mjs [outDir] [baseUrl] [directions]
// For each direction it records a scroll-through at 1440x900 and at 390x844 (touch), converts each to an H.264 mp4
// with ffmpeg if it's installed, and takes stills at the top, the middle and the end. Fails if the console logged
// an error.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] ?? 'docs/motion-lab/recordings';
const base = process.argv[3] ?? 'http://localhost:4173';
const only = (process.argv[4] ?? 'a,b,c,d').split(',');
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'desktop', width: 1440, height: 900, mobile: false, scale: 1 },
  { name: 'mobile', width: 390, height: 844, mobile: true, scale: 2 },
];
const errors = [];
const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const wait = ms => new Promise(r => setTimeout(r, ms));
// Where the middle still is taken, as a share of the page. A's middle lands between two of its pinned shots at 45%.
const MIDDLE = { a: 0.38, b: 0.45, c: 0.45, d: 0.45 };

/** Scrolls the page from top to bottom in about `seconds`, holding briefly every screen or so. Desktop scrolls
 *  with the wheel (so smooth-scroll libraries see real input), phones with a finger-like eased scroll. */
async function scrollThrough(page, size, seconds) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const stepPx = size.mobile ? 0 : 90;
  if (!size.mobile) {
    const steps = Math.ceil(total / stepPx);
    const per = (seconds * 1000) / steps;
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepPx);
      await wait(i % 10 === 9 ? per + 500 : per);
    }
  } else {
    // Flick by flick, each one easing out like a released finger.
    const flick = size.height * 0.7, flicks = Math.ceil(total / flick), per = (seconds * 1000) / flicks;
    for (let i = 0; i < flicks; i++) {
      await page.evaluate(([dist, dur]) => new Promise(done => {
        const from = scrollY, t0 = performance.now();
        const step = now => {
          const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          scrollTo(0, from + dist * e);
          if (t < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      }), [flick, Math.min(900, per * 0.7)]);
      await wait(per * 0.3);
    }
  }
  await wait(2500);
}

async function record(id, size) {
  const tag = `${id}-${size.name}`;
  const tmp = join(outDir, `.tmp-${tag}`);
  rmSync(tmp, { recursive: true, force: true });
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale,
    isMobile: size.mobile,
    hasTouch: size.mobile,
    recordVideo: { dir: tmp, size: { width: size.width, height: size.height } },
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  await page.goto(`${base}/lab/${id}`, { waitUntil: 'networkidle' });
  await wait(3200);
  if (!size.mobile) {
    // A slow pass of the pointer across the first screen, for the directions that answer it.
    for (let i = 0; i <= 40; i++) { await page.mouse.move(size.width * (0.25 + i * 0.012), size.height * (0.45 + Math.sin(i / 6) * 0.12)); await wait(30); }
  }
  await scrollThrough(page, size, size.mobile ? 26 : 34);
  const video = page.video();
  await context.close();
  const webm = await video.path();
  const name = join(outDir, `${tag}`);
  if (hasFfmpeg) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', size.mobile ? '27' : '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${name}.mp4`]);
    rmSync(tmp, { recursive: true, force: true });
    console.log(`${tag}.mp4 ${(statSync(`${name}.mp4`).size / 1e6).toFixed(1)} MB`);
  } else {
    renameSync(webm, `${name}.webm`);
    rmSync(tmp, { recursive: true, force: true });
    console.log(`${tag}.webm ${(statSync(`${name}.webm`).size / 1e6).toFixed(1)} MB`);
  }
}

async function stills(id, size) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 2, isMobile: size.mobile, hasTouch: size.mobile });
  const page = await context.newPage();
  await page.goto(`${base}/lab/${id}`, { waitUntil: 'networkidle' });
  await wait(3500);
  await page.screenshot({ path: join(outDir, `${id}-${size.name}-1-top.png`) });
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const [n, at] of [[2, MIDDLE[id] ?? 0.45], [3, 1]]) {
    // Walk there rather than jump, so scroll-driven scenes have caught up.
    const from = await page.evaluate(() => scrollY), to = Math.round(total * at), steps = 30;
    for (let i = 1; i <= steps; i++) { await page.evaluate(y => scrollTo(0, y), from + ((to - from) * i) / steps); await wait(40); }
    await wait(1800);
    await page.screenshot({ path: join(outDir, `${id}-${size.name}-${n}-${at === 1 ? 'end' : 'middle'}.png`) });
  }
  await context.close();
}

for (const id of only) for (const size of sizes) { await record(id, size); await stills(id, size); }
await browser.close();
for (const f of readdirSync(outDir).filter(f => f.endsWith('.png'))) {
  // Keep the stills small enough for a pull request.
  if (hasFfmpeg) {
    const png = join(outDir, f), jpg = png.replace(/\.png$/, '.jpg');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '4', jpg]);
    rmSync(png);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
