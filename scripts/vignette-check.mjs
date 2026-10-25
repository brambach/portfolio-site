// The hero picture's motion, checked in a real browser against a production build served by `vite preview`.
// Not part of npm test. Modes, run in this order when several are given:
//   --baseline <dir>  the picture painted finished (reduced motion) at three sizes, saved as PNGs
//   --diff <dir>      the same shots compared to a baseline, failing past 0.5% of pixels changed
//   --trace           the frame budget: no Paint or Layout at all in 4s of looping, phone and desktop
//   --states          animations run in view and pause off screen; reduced motion runs nothing and holds still
// Usage: node scripts/vignette-check.mjs [--url http://localhost:4180/] --baseline dir | --diff dir | --trace | --states
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const URL = value('--url') ?? 'http://localhost:4180/';
const baseline = value('--baseline'), diff = value('--diff');
if (!baseline && !diff && !flag('--trace') && !flag('--states')) {
  console.log('usage: node scripts/vignette-check.mjs [--url u] --baseline dir | --diff dir | --trace | --states');
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

async function runTrace() {
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
      const off = anims.filter((a) => a.state !== expect);
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

    const still = await open(profile, 'reduce');
    await intoView(still.page);
    await still.page.waitForTimeout(400);
    const running = await still.page.evaluate(() => document.querySelector('.vig').getAnimations({ subtree: true }).length);
    running ? fail(`${profile.name} reduced motion: ${running} animations on the picture`) : pass(`${profile.name} reduced motion: no animations`);
    const plate = still.page.locator('.vig__plate');
    const first = await plate.screenshot();
    await still.page.waitForTimeout(2000);
    const { share } = await differ(first, await plate.screenshot());
    share ? fail(`${profile.name} reduced motion: ${(share * 100).toFixed(3)}% changed over 2s`) : pass(`${profile.name} reduced motion: identical 2s apart`);
    await still.ctx.close();
  }
}

if (baseline) await runBaseline(baseline);
if (diff) await runDiff(diff);
if (flag('--trace')) await runTrace();
if (flag('--states')) await runStates();
await browser.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
