// The hero picture's motion, checked in a real browser against a production build served by `vite preview`.
// Not part of npm test. Modes, run in this order when several are given:
//   --baseline <dir>  the picture painted finished (reduced motion) at three sizes, saved as PNGs
//   --diff <dir>      the same shots compared to a baseline, failing past 0.5% of pixels changed
//   --trace           the frame budget: the draw-in paints under 2ms a frame (median) with no frame over 50ms, then
//                     no Paint or Layout at all in 4s of looping, phone and desktop
//   --states          animations run in view, pause off screen and run again back in view; the draw-in is gone by
//                     5s, a resize doesn't replay it and a reload in the same visit skips it; reduced motion runs
//                     nothing and holds still, painted finished
//   --stills <dir>    the page top through the picture once it has drawn in, desktop and phone, saved as
//                     <name>-desktop.png and <name>-mobile.png (--name, default after)
//   --record <dir>    the stills plus reduced-motion-desktop.png, and clips from the start of the draw-in with every
//                     animation's time stepped by hand, so frames are sharp and even whatever the machine's load:
//                     vignette-desktop.webm, vignette-desktop.gif and vignette-mobile-390.webm (needs ffmpeg)
// Usage: node scripts/vignette-check.mjs [--url http://localhost:4180/] --baseline dir | --diff dir | --trace | --states
//        | --stills dir [--name before] | --record dir
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const URL = value('--url') ?? 'http://localhost:4180/';
const baseline = value('--baseline'), diff = value('--diff'), stills = value('--stills'), record = value('--record');
if (!baseline && !diff && !flag('--trace') && !flag('--states') && !stills && !record) {
  console.log('usage: node scripts/vignette-check.mjs [--url u] --baseline dir | --diff dir | --trace | --states | --stills dir [--name n] | --record dir');
  process.exit(2);
}

const SHOTS = [
  { name: '390', width: 390, height: 844, dpr: 2 },
  { name: '768', width: 768, height: 1024, dpr: 1 },
  { name: '1440', width: 1440, height: 900, dpr: 1 },
];
const PROFILES = [
  { name: 'phone', width: 390, height: 844, dpr: 2, cpu: 4 },
  { name: 'desktop', width: 1440, height: 900, dpr: 1, cpu: 1 },
];
// The draw-in will take up to 5s from first view; the trace has to measure the loops alone, after it.
const DRAW_IN_MS = 5500;
const TRACE_MS = 4000;
const MAX_DIFF = 0.005;
const DRAW_IN = ['vig-sweep', 'vig-settle', 'vig-in'];
const DRAW_IN_PAINT_MS = 2;
const DRAW_IN_FRAME_MS = 50;
const STILLS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
  { name: 'mobile', width: 390, height: 844, dpr: 2 },
];
// context: CSS px of page kept above and below the picture.
const CLIPS = [
  { name: 'vignette-desktop', width: 1440, height: 900, dpr: 2, seconds: 8, context: 0, gif: { seconds: 6, width: 960 } },
  { name: 'vignette-mobile-390', width: 390, height: 844, dpr: 2, seconds: 8, context: 48 },
];
const FPS = 30;
const WEBM_MAX = 300 * 1024;
const GIF_MAX = 2 * 1024 * 1024;
const WEBM_CRF = [34, 40, 46];
const GIF_TRIES = [{ fps: 15, colors: 48 }, { fps: 15, colors: 32 }, { fps: 12, colors: 32 }];

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };
const pass = (msg) => console.log(`  ok   ${msg}`);

async function open({ width, height, dpr }, reducedMotion = 'no-preference') {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail(`page error: ${e.message}`));
  await page.goto(URL, { waitUntil: 'load' });
  // The drawing lands a frame and a task after first paint; until then the plate is an empty box.
  await page.waitForSelector('.vig__plate > svg');
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

const intoView = (page) => page.evaluate(() => document.querySelector('.vig').scrollIntoView({ block: 'center' }));

// Every animation on the picture, with where it runs, so a report says what moved and not just how many.
const vigAnimations = (page) => page.evaluate(() => document.getAnimations()
  .filter((a) => a.effect?.target?.closest?.('.vig'))
  .map((a) => ({ name: a.animationName ?? a.id ?? '', on: a.effect.target.getAttribute('class') ?? a.effect.target.tagName, state: a.playState })));

// Pixel compare in a page canvas, with no image library: the share of pixels where any channel differs.
let comparer = null;
async function differ(a, b) {
  comparer ??= await browser.newPage();
  return comparer.evaluate(async ([a, b]) => {
    const read = async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      return cx.getImageData(0, 0, c.width, c.height);
    };
    const [x, y] = await Promise.all([read(a), read(b)]);
    if (x.width !== y.width || x.height !== y.height) return { share: 1, note: `size ${x.width}x${x.height} vs ${y.width}x${y.height}` };
    let changed = 0;
    for (let o = 0; o < x.data.length; o += 4)
      if (x.data[o] !== y.data[o] || x.data[o + 1] !== y.data[o + 1] || x.data[o + 2] !== y.data[o + 2] || x.data[o + 3] !== y.data[o + 3]) changed++;
    return { share: changed / (x.width * x.height), note: `${x.width}x${x.height}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

async function shoot(size) {
  const { ctx, page } = await open(size, 'reduce');
  await intoView(page);
  await page.waitForTimeout(400);
  const png = await page.locator('.vig').screenshot();
  await ctx.close();
  return png;
}

async function runBaseline(dir) {
  console.log(`baseline into ${dir}`);
  mkdirSync(dir, { recursive: true });
  for (const size of SHOTS) {
    const file = join(dir, `vig-${size.name}.png`);
    writeFileSync(file, await shoot(size));
    pass(`${size.name} saved ${file}`);
  }
}

async function runDiff(dir) {
  console.log(`diff against ${dir}`);
  for (const size of SHOTS) {
    const { share, note } = await differ(readFileSync(join(dir, `vig-${size.name}.png`)), await shoot(size));
    const line = `${size.name}: ${(share * 100).toFixed(3)}% of pixels differ (${note})`;
    share > MAX_DIFF ? fail(line) : pass(line);
  }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// The draw-in starts on the first screen at load, so tracing starts before the page does. The page marks the window
// itself, from the frame the plate is drawn and drawing in to the frame it's marked done, with console.timeStamp,
// which lands in the trace on the same clock as the paints.
async function traceDrawIn(profile) {
  const ctx = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail(`page error: ${e.message}`));
  await page.addInitScript(() => {
    let start = 0, last = 0;
    const gaps = [];
    const tick = (now) => {
      const plate = document.querySelector('.vig__plate');
      const drawn = plate?.dataset.drawn;
      if (!start && drawn === '' && plate.querySelector('svg')) { start = now; console.timeStamp('vig-draw-in'); }
      else if (start) gaps.push(now - last);
      last = now;
      if (start && (drawn === 'done' || now - start > 6000)) {
        console.timeStamp('vig-drawn');
        window.__drawIn = { gaps, ms: now - start, drawn };
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
  const events = [];
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame', transferMode: 'ReportEvents' });
  await page.goto(URL, { waitUntil: 'load' });
  const run = await page.waitForFunction(() => window.__drawIn, null, { timeout: 15000 }).then((h) => h.jsonValue());
  const complete = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  await complete;
  await ctx.close();
  const mark = (m) => events.find((e) => e.name === 'TimeStamp' && e.args?.data?.message === m)?.ts;
  const [from, to] = [mark('vig-draw-in'), mark('vig-drawn')];
  const main = events.find((e) => e.name === 'TimeStamp' && e.args?.data?.message === 'vig-draw-in');
  const onMain = (e) => e.pid === main.pid && e.tid === main.tid;
  const frames = events.filter((e) => e.name === 'BeginMainThreadFrame' && onMain(e) && e.ts >= from && e.ts <= to).map((e) => e.ts);
  // Each paint counts toward the main-thread frame it falls in.
  const perFrame = new Map();
  for (const e of events.filter((e) => e.name === 'Paint' && onMain(e) && e.ts >= from && e.ts <= to)) {
    const f = frames.findLast((t) => t <= e.ts) ?? from;
    perFrame.set(f, (perFrame.get(f) ?? 0) + (e.dur ?? 0) / 1000);
  }
  const painted = [...perFrame.values()];
  const longest = Math.max(...run.gaps);
  const result = {
    windowMs: +run.ms.toFixed(0), endedAs: run.drawn, frames: run.gaps.length, mainFrames: frames.length,
    paintedFrames: painted.length, paintMs: +painted.reduce((a, b) => a + b, 0).toFixed(1),
    medianPaintMs: +median(painted).toFixed(2), maxPaintMs: +Math.max(0, ...painted).toFixed(2),
    p95: +[...run.gaps].sort((a, b) => a - b)[Math.floor(run.gaps.length * 0.95)].toFixed(1), longestFrame: +longest.toFixed(1),
    longestAtMs: +run.gaps.slice(0, run.gaps.indexOf(longest) + 1).reduce((x, y) => x + y, 0).toFixed(0),
  };
  console.log(`  ${profile.name} draw-in ${JSON.stringify(result)}`);
  run.drawn === 'done' ? pass(`${profile.name}: draw-in marked done after ${result.windowMs}ms`) : fail(`${profile.name}: draw-in not done after ${result.windowMs}ms`);
  result.medianPaintMs < DRAW_IN_PAINT_MS ? pass(`${profile.name}: draw-in median paint ${result.medianPaintMs}ms a frame`)
    : fail(`${profile.name}: draw-in median paint ${result.medianPaintMs}ms a frame, over ${DRAW_IN_PAINT_MS}ms`);
  longest <= DRAW_IN_FRAME_MS ? pass(`${profile.name}: draw-in longest frame ${result.longestFrame}ms`)
    : fail(`${profile.name}: draw-in frame of ${result.longestFrame}ms, over ${DRAW_IN_FRAME_MS}ms`);
}

async function runTrace() {
  console.log('trace: the draw-in from first view');
  for (const profile of PROFILES) await traceDrawIn(profile);
  console.log(`trace: ${TRACE_MS / 1000}s after ${DRAW_IN_MS / 1000}s in view`);
  for (const profile of PROFILES) {
    const { ctx, page } = await open(profile);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    await intoView(page);
    await page.waitForTimeout(DRAW_IN_MS);
    const events = [];
    cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
    const frames = await page.evaluate((ms) => new Promise((done) => {
      const gaps = [];
      let last = performance.now();
      const end = last + ms;
      const tick = (now) => { gaps.push(now - last); last = now; now < end ? requestAnimationFrame(tick) : done(gaps); };
      requestAnimationFrame(tick);
    }), TRACE_MS);
    const complete = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    await complete;
    const named = (n) => events.filter((e) => e.name === n);
    const ms = (n) => +(named(n).reduce((t, e) => t + (e.dur ?? 0), 0) / 1000).toFixed(1);
    frames.sort((a, b) => a - b);
    const anims = await vigAnimations(page);
    const all = await page.evaluate(() => document.getAnimations().map((a) => a.playState));
    console.log(`  ${profile.name} ${JSON.stringify({
      paintMs: ms('Paint'), paints: named('Paint').length, layoutMs: ms('Layout'), layouts: named('Layout').length,
      rasterMs: ms('RasterTask'), frames: frames.length, p95: +frames[Math.floor(frames.length * 0.95)].toFixed(1),
      animations: all.length, playStates: all, vig: anims,
    })}`);
    named('Paint').length ? fail(`${profile.name}: ${named('Paint').length} Paint events while looping`) : pass(`${profile.name}: no Paint`);
    named('Layout').length ? fail(`${profile.name}: ${named('Layout').length} Layout events while looping`) : pass(`${profile.name}: no Layout`);
    await ctx.close();
  }
}

async function runStates() {
  console.log('states');
  for (const profile of PROFILES) {
    const { ctx, page } = await open(profile);
    const states = async (expect, where) => {
      const anims = await vigAnimations(page);
      if (!anims.length) return console.log(`  skip ${profile.name} ${where}: no .vig animations to check`);
      // A layer that has already drawn in holds its last frame as finished until the plate is marked done.
      const off = anims.filter((a) => a.state !== expect && !(a.state === 'finished' && DRAW_IN.includes(a.name)));
      off.length ? fail(`${profile.name} ${where}: ${off.length}/${anims.length} not ${expect} ${JSON.stringify(off)}`)
        : pass(`${profile.name} ${where}: all ${anims.length} ${expect}`);
    };
    await intoView(page);
    await page.waitForTimeout(1000);
    await states('running', 'in view');
    await page.evaluate(() => scrollBy(0, innerHeight * 2));
    await page.waitForTimeout(600);
    const away = await page.evaluate(() => { const r = document.querySelector('.vig').getBoundingClientRect(); return r.bottom < 0 || r.top > innerHeight; });
    away ? await states('paused', 'two screens away') : fail(`${profile.name}: page too short to scroll the picture out of view`);
    await intoView(page);
    await page.waitForTimeout(600);
    await states('running', 'back in view');
    await ctx.close();

    await checkDrawIn(profile);

    const still = await open(profile, 'reduce');
    await intoView(still.page);
    await still.page.waitForTimeout(400);
    const running = await still.page.evaluate(() => document.querySelector('.vig').getAnimations({ subtree: true }).length);
    running ? fail(`${profile.name} reduced motion: ${running} animations on the picture`) : pass(`${profile.name} reduced motion: no animations`);
    await finished(still.page, `${profile.name} reduced motion`);
    const plate = still.page.locator('.vig__plate');
    const first = await plate.screenshot();
    await still.page.waitForTimeout(2000);
    const { share } = await differ(first, await plate.screenshot());
    share ? fail(`${profile.name} reduced motion: ${(share * 100).toFixed(3)}% changed over 2s`) : pass(`${profile.name} reduced motion: identical 2s apart`);
    await still.ctx.close();
  }
}

const drawInLeft = async (page) => (await vigAnimations(page)).filter((a) => DRAW_IN.includes(a.name));

// Painted finished: marked done, every part shown whole, nothing left of the draw-in.
async function finished(page, where) {
  const state = await page.evaluate(() => {
    const plate = document.querySelector('.vig__plate');
    const parts = [...plate.children].map((el) => getComputedStyle(el));
    return {
      drawn: plate.dataset.drawn, parts: parts.length,
      hidden: parts.filter((s) => s.visibility !== 'visible' || s.clipPath !== 'none' || s.translate !== 'none' || s.filter !== 'none').length,
    };
  });
  const left = await drawInLeft(page);
  state.drawn === 'done' && state.parts && !state.hidden && !left.length
    ? pass(`${where}: painted finished (${state.parts} parts, none clipped, hidden, faded or offset)`)
    : fail(`${where}: not painted finished ${JSON.stringify({ ...state, drawInLeft: left })}`);
}

async function checkDrawIn(profile) {
  const { ctx, page } = await open(profile);
  const firstView = Date.now();
  const drawing = await drawInLeft(page);
  const drawn = await page.evaluate(() => document.querySelector('.vig__plate').dataset.drawn);
  drawn === '' && drawing.length ? pass(`${profile.name}: draws in on first view (${drawing.length} draw-in animations, ${[...new Set(drawing.map((a) => a.name))]})`)
    : fail(`${profile.name}: no draw-in on first view ${JSON.stringify({ drawn, drawing })}`);
  await page.waitForTimeout(Math.max(0, 5000 - (Date.now() - firstView)));
  await finished(page, `${profile.name} 5s after first view`);
  const loops = (await vigAnimations(page)).filter((a) => a.state === 'running').length;
  loops ? pass(`${profile.name}: ${loops} loops still running after the draw-in`) : fail(`${profile.name}: no loops running after the draw-in`);

  const before = await page.evaluate(() => document.querySelector('.vig__far').getAttribute('width'));
  await page.setViewportSize({ width: profile.width - 60, height: profile.height });
  await page.waitForFunction((w) => document.querySelector('.vig__far')?.getAttribute('width') !== w, before);
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => document.querySelector('.vig__far').getAttribute('width'));
  await finished(page, `${profile.name} after a resize redraw (${before} to ${after}px wide)`);

  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.vig__plate > svg');
  await finished(page, `${profile.name} reloaded in the same visit`);
  await ctx.close();
}

async function still(size, file, reducedMotion) {
  const { ctx, page } = await open(size, reducedMotion);
  await page.waitForTimeout(DRAW_IN_MS);
  const bottom = await page.evaluate(() => Math.ceil(document.querySelector('.vig').getBoundingClientRect().bottom + scrollY) + 24);
  writeFileSync(file, await page.screenshot({ clip: { x: 0, y: 0, width: size.width, height: bottom } }));
  await ctx.close();
  pass(`saved ${file}`);
}

async function runStills(dir, name) {
  console.log(`stills into ${dir}`);
  mkdirSync(dir, { recursive: true });
  for (const size of STILLS) await still(size, join(dir, `${name}-${size.name}.png`));
}

// Tries each setting in turn until the file fits, keeping the last one if none does.
function encode(out, max, tries, argsFor) {
  for (const t of tries) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...argsFor(t), out]);
    const size = statSync(out).size;
    const line = `${out} ${(size / 1024).toFixed(0)} KB (${JSON.stringify(t)})`;
    if (size <= max) return pass(line);
    if (t === tries.at(-1)) return fail(`${line}, over ${(max / 1024).toFixed(0)} KB`);
  }
}

// Every animation is paused the moment the plate starts drawing in, then all of them are set to the same time past
// that moment for each frame, so the clip shows the timeline exactly as a visitor sees it from first view.
async function recordClip(clip, dir) {
  const ctx = await browser.newContext({ viewport: { width: clip.width, height: clip.height }, deviceScaleFactor: clip.dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail(`page error: ${e.message}`));
  await page.addInitScript(() => {
    new MutationObserver((_, observer) => {
      const plate = document.querySelector('.vig__plate');
      if (plate?.dataset.drawn !== '' || !plate.querySelector('svg')) return;
      observer.disconnect();
      window.__clock = document.getAnimations().map((a) => { a.pause(); return [a, a.currentTime ?? 0]; });
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-drawn'] });
  });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__clock, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  const box = await page.evaluate((context) => {
    const r = document.querySelector('.vig').getBoundingClientRect();
    return { x: 0, y: Math.round(r.top + scrollY - context), width: innerWidth, height: Math.round(r.height + 2 * context) };
  }, clip.context);
  const frames = mkdtempSync(join(tmpdir(), `${clip.name}-`));
  for (let i = 0; i < clip.seconds * FPS; i++) {
    await page.evaluate((ms) => {
      for (const [a, t0] of window.__clock) { a.pause(); a.currentTime = t0 + ms; }
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, (i * 1000) / FPS);
    await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`), clip: box });
  }
  await ctx.close();
  console.log(`  ${clip.name}: ${clip.seconds * FPS} frames of ${box.width * clip.dpr}x${box.height * clip.dpr}px`);
  const input = ['-framerate', String(FPS), '-i', join(frames, 'f%04d.png')];
  encode(join(dir, `${clip.name}.webm`), WEBM_MAX, WEBM_CRF,
    (crf) => [...input, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-pix_fmt', 'yuv420p', '-row-mt', '1', '-an']);
  if (clip.gif) encode(join(dir, `${clip.name}.gif`), GIF_MAX, GIF_TRIES, ({ fps, colors }) => [...input, '-t', String(clip.gif.seconds), '-vf',
    `fps=${fps},scale=${clip.gif.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`]);
  rmSync(frames, { recursive: true });
}

async function runRecord(dir) {
  await runStills(dir, 'after');
  await still(STILLS[0], join(dir, 'reduced-motion-desktop.png'), 'reduce');
  console.log(`record into ${dir}`);
  for (const clip of CLIPS) await recordClip(clip, dir);
}

if (baseline) await runBaseline(baseline);
if (diff) await runDiff(diff);
if (flag('--trace')) await runTrace();
if (flag('--states')) await runStates();
if (stills) await runStills(stills, value('--name') ?? 'after');
if (record) await runRecord(record);
await browser.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
