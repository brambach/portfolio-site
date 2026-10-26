// The banknote home's motion, checked in a real browser against a production build served by `vite preview`.
// Not part of npm test. Modes, run in this order when several are given:
//   --baseline <dir>  the whole page painted finished (reduced motion) at 320, 390, 768 and 1440, saved as PNGs
//   --diff <dir>      the same shots compared to a baseline, failing on any changed pixel; on failure it writes
//                     home-<width>-new.png and home-<width>-diff.png (changed pixels in red) beside the baseline
//   --states          at 1440 and 390: only transform, translate, rotate, scale, opacity and stroke-dashoffset animate;
//                     the animation names are exactly the contract's; face loops run and back loops wait on load, and
//                     the other way round once scrolled through, with every watched block seen; every one-shot ends
//                     by its block's seen time plus its delay and duration (300ms margin) and none is left running or
//                     waiting; a hidden tab pauses every loop and showing it resumes the ones on screen; no layout
//                     shift; the roll plays once a visit; a redraw at a new width does not raise the sun again;
//                     reduced motion runs nothing and reads data-mode="still"
//   --trace           at 390 (phone, 4x CPU): once the face's one-shots end, 4s on the face with no Paint and no
//                     Layout on the main thread; also prints the longest main-thread task during load and the paints
//                     during the roll
//   --load            at 390 (phone, 4x CPU), five cold loads traced until the face settles: the longest main-thread
//                     task, and the longest from the moment the Home chunk has arrived (before it the main entry runs,
//                     the same on every page), each with what it spent its time on; fails when the median of the
//                     second is over 50ms
//   --lite            at 390: Save-Data goes lite, the medallion rests drawn with only bn-turn running from the start
//                     (a crop goes to --out <dir> when given), and a row's number still clicks while its rule is
//                     printed rather than inked in; prefers-reduced-data goes lite; a slow roll goes lite mid-roll, is
//                     remembered as "bn-slow" and a reload starts lite; a narrow touch screen alone stays full
//   --hover           at 1440, pointing at a print or at its row's name draws the frame round it and lifts it; with
//                     reduced motion, and on a 390 touch screen, pointing at it changes nothing
//   --stills <dir>    the page top through the picture once the face has settled, desktop and phone, saved as
//                     <name>-desktop.png and <name>-mobile.png (--name, default after)
//   --record <dir>    the stills plus reduced-motion-desktop.png, and clips from the moment the face is seen with its
//                     picture drawn, every animation's time stepped by hand, so frames are sharp and even whatever the
//                     machine's load: vignette-desktop.webm, vignette-desktop.gif and vignette-mobile-390.webm (needs
//                     ffmpeg)
//   --birds <dir>     tight crops round the birds every 100ms for 3s, starting --from ms (default 0) after the face
//                     settles, time stepped by hand as in --record, at 1440 and 390 (DPR 2), plus the reduced-motion
//                     rest: birds-<width>-<ms>.png and birds-<width>-reduced.png
// Usage: node scripts/home-check.mjs [--url http://localhost:4180/] --baseline dir | --diff dir | --states | --trace
//        | --load | --lite [--out dir] | --hover | --stills dir [--name before] | --record dir | --birds dir [--from ms]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const URL = value('--url') ?? 'http://localhost:4180/';
const baseline = value('--baseline'), diff = value('--diff'), stills = value('--stills'), record = value('--record'), birds = value('--birds');
if (!baseline && !diff && !flag('--states') && !flag('--trace') && !flag('--load') && !flag('--lite') && !flag('--hover') && !stills && !record && !birds) {
  console.log('usage: node scripts/home-check.mjs [--url u] --baseline dir | --diff dir | --states | --trace | --load | --lite [--out dir] | --hover | --stills dir [--name n] | --record dir | --birds dir [--from ms]');
  process.exit(2);
}

const SHOTS = [
  { name: '320', width: 320, height: 568, dpr: 2 },
  { name: '390', width: 390, height: 844, dpr: 2 },
  { name: '768', width: 768, height: 1024, dpr: 1 },
  { name: '1440', width: 1440, height: 900, dpr: 1 },
];
const DESKTOP = { name: '1440', width: 1440, height: 900, dpr: 1 };
const PHONE = { name: '390', width: 390, height: 844, dpr: 2 };
const TOUCH = { ...PHONE, mobile: true };
const ALLOWED = new Set(['transform', 'translate', 'rotate', 'scale', 'opacity', 'strokeDashoffset', 'offset', 'easing', 'composite', 'computedOffset']);
const EXPECTED = ['bn-click', 'bn-foil', 'bn-ink', 'bn-pen', 'bn-turn', 'vig-bob', 'vig-breathe', 'vig-drift', 'vig-flap', 'vig-rise', 'vig-roll', 'vig-shimmer', 'vig-unroll'];
const ROLL = ['vig-roll', 'vig-unroll', 'vig-rise'];
const MARGIN_MS = 300;
const TRACE_MS = 4000;
const LOAD_RUNS = 5;
const LOAD_BUDGET_MS = 50;
const CATS = 'devtools.timeline,disabled-by-default-devtools.timeline,toplevel';
const STILLS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
  { name: 'mobile', width: 390, height: 844, dpr: 2 },
];
// context: CSS px of page kept above and below the picture.
const CLIPS = [
  { name: 'vignette-desktop', width: 1440, height: 900, dpr: 2, seconds: 8, context: 0, gif: { seconds: 6, width: 960 } },
  { name: 'vignette-mobile-390', width: 390, height: 844, dpr: 2, seconds: 8, context: 48 },
];
const BIRDS = [
  { width: 1440, height: 900, dpr: 2 },
  { width: 390, height: 844, dpr: 2 },
];
const BIRD_STEP_MS = 100;
const BIRD_MS = 3000;
// CSS px kept round the wings.
const BIRD_PAD = 6;
const FPS = 30;
const WEBM_MAX = 300 * 1024;
const GIF_MAX = 2 * 1024 * 1024;
const WEBM_CRF = [34, 40, 46];
const GIF_TRIES = [{ fps: 15, colors: 48 }, { fps: 15, colors: 32 }, { fps: 12, colors: 32 }];

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };
const pass = (msg) => console.log(`  ok   ${msg}`);
const check = (cond, msg, detail) => (cond ? pass(msg) : fail(detail === undefined ? msg : `${msg} ${JSON.stringify(detail)}`));

async function open(size, { reducedMotion = 'no-preference', init = [], before, on = browser } = {}) {
  const ctx = await on.newContext({
    viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.dpr,
    isMobile: !!size.mobile, hasTouch: !!size.mobile, reducedMotion,
  });
  for (const script of init) await ctx.addInitScript(script);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail(`page error: ${e.message}`));
  await before?.(page);
  await page.goto(URL, { waitUntil: 'load' });
  // The picture lands a frame and a task after first paint; until then the plate is an empty box.
  await page.waitForSelector('.vig__plate > svg', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

const show = (page, selector) => page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), selector);

// An init script: what moved and when, from the page's first moment, on the page's own clock. Seen times come from a
// MutationObserver, one-shots from animationstart and animationend, so finished ones are still accounted for after
// getAnimations() has dropped them.
function motionLog() {
  const log = window.__log = { seen: new Map(), names: new Set(), props: new Set(), shots: [], cls: 0, modes: [] };
  const note = (a) => {
    log.names.add(a.animationName);
    for (const k of a.effect.getKeyframes()) for (const p of Object.keys(k)) log.props.add(p);
  };
  log.note = () => document.getAnimations().forEach(note);
  new MutationObserver((records) => {
    if (!('first' in log) && document.querySelector('.home')) log.first = document.querySelector('.home').dataset.mode;
    for (const { target: el, attributeName } of records) {
      if (attributeName === 'data-seen' && el.dataset.seen === '' && !log.seen.has(el)) {
        log.seen.set(el, performance.now());
        if (el.closest('.note--face')) console.timeStamp('bn-face-seen');
      }
      if (attributeName === 'data-mode' && el.classList.contains('home')) log.modes.push({ mode: el.dataset.mode, at: performance.now() });
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-seen', 'data-mode'] });
  addEventListener('animationstart', (e) => {
    const a = e.target.getAnimations().find((x) => x.animationName === e.animationName);
    if (!a) return;
    note(a);
    const t = a.effect.getTiming();
    if (t.iterations !== Infinity) log.shots.push({ name: e.animationName, target: e.target, block: e.target.closest('[data-motion]'), delay: t.delay, run: t.duration * t.iterations, start: performance.now(), end: null });
  }, true);
  addEventListener('animationend', (e) => {
    const shot = log.shots.find((s) => s.target === e.target && s.name === e.animationName && s.end === null);
    if (shot) shot.end = performance.now();
  }, true);
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) log.cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
}

// Seen, drawn, and no one-shot left on it.
const faceSettled = () => {
  const face = document.querySelector('.note--face');
  return !!face && face.matches('[data-seen], :has([data-seen])') && !!document.querySelector('.vig__plate > svg')
    && face.getAnimations({ subtree: true }).every((a) => a.effect.getTiming().iterations === Infinity);
};

// Pixel compare in a page canvas, with no image library. Pixels outside either image count as changed, and the diff
// image paints them red over a faded copy of b.
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
    const w = Math.max(x.width, y.width), h = Math.max(x.height, y.height);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    const out = cx.createImageData(w, h);
    let changed = 0;
    for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
      const o = (row * w + col) * 4;
      const inX = row < x.height && col < x.width, inY = row < y.height && col < y.width;
      const ox = (row * x.width + col) * 4, oy = (row * y.width + col) * 4;
      const same = inX && inY && x.data[ox] === y.data[oy] && x.data[ox + 1] === y.data[oy + 1] && x.data[ox + 2] === y.data[oy + 2] && x.data[ox + 3] === y.data[oy + 3];
      if (same) { const g = 255 - (255 - (y.data[oy] + y.data[oy + 1] + y.data[oy + 2]) / 3) / 4; out.data.set([g, g, g, 255], o); }
      else { changed++; out.data.set([255, 0, 0, 255], o); }
    }
    const note = x.width === y.width && x.height === y.height ? `${w}x${h}` : `size ${x.width}x${x.height} vs ${y.width}x${y.height}`;
    if (!changed) return { changed, note };
    cx.putImageData(out, 0, 0);
    return { changed, note, png: c.toDataURL('image/png').slice('data:image/png;base64,'.length) };
  }, [a.toString('base64'), b.toString('base64')]);
}

// Every after-paint drawing and lazy picture in, so two runs paint the same pixels.
async function shoot(size) {
  const { ctx, page } = await open(size, { reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete) && document.querySelector('.cameo__in > svg') && document.querySelectorAll('.medal > svg').length === 3);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    await document.fonts.ready;
    scrollTo(0, 0);
  });
  // A full-page capture resizes the viewport mid-shot, and at 768 about half its shots set the body text at 16px on
  // both builds. A viewport as tall as the page needs no resize.
  await page.setViewportSize({ width: size.width, height: await page.evaluate(() => document.documentElement.scrollHeight) });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot();
  await ctx.close();
  return png;
}

async function runBaseline(dir) {
  console.log(`baseline into ${dir}`);
  mkdirSync(dir, { recursive: true });
  for (const size of SHOTS) {
    const file = join(dir, `home-${size.name}.png`);
    writeFileSync(file, await shoot(size));
    pass(`${size.name} saved ${file}`);
  }
}

async function runDiff(dir) {
  console.log(`diff against ${dir}`);
  for (const size of SHOTS) {
    const now = await shoot(size);
    const { changed, note, png } = await differ(readFileSync(join(dir, `home-${size.name}.png`)), now);
    const line = `${size.name}: ${changed} pixels changed (${note})`;
    if (!changed) { pass(line); continue; }
    writeFileSync(join(dir, `home-${size.name}-new.png`), now);
    writeFileSync(join(dir, `home-${size.name}-diff.png`), Buffer.from(png, 'base64'));
    fail(`${line}, see ${join(dir, `home-${size.name}-diff.png`)}`);
  }
}

// Each block's loops, as the set of their play states ('' when it has none yet).
const loops = (page) => page.evaluate(() => Object.fromEntries(['.note--face', '.note--back'].map((s) => [s.slice(7),
  [...new Set(document.querySelector(s).getAnimations({ subtree: true }).filter((a) => a.effect.getTiming().iterations === Infinity).map((a) => a.playState))].sort().join(',')])));

// Brings each watched block on screen in page order and stays until its one-shots should have ended, so none is
// scrolled away mid-run.
async function scrollThrough(page) {
  const count = await page.evaluate(() => document.querySelectorAll('[data-motion]').length);
  for (let i = 0; i < count; i++) {
    await page.evaluate((i) => document.querySelectorAll('[data-motion]')[i].scrollIntoView({ block: 'center' }), i);
    await page.waitForTimeout(150);
    const wait = await page.evaluate(([i, margin]) => {
      const el = document.querySelectorAll('[data-motion]')[i], seen = window.__log.seen.get(el);
      window.__log.note();
      if (seen === undefined) return 0;
      const due = el.getAnimations({ subtree: true }).map((a) => a.effect.getTiming())
        .filter((t) => t.iterations !== Infinity).map((t) => seen + t.delay + t.duration * t.iterations + margin);
      return Math.max(0, ...due) + 50 - performance.now();
    }, [i, MARGIN_MS]);
    await page.waitForTimeout(Math.max(0, wait));
  }
}

async function runStates() {
  console.log('states');
  for (const size of [DESKTOP, PHONE]) {
    const at = size.name;
    const { ctx, page } = await open(size, { init: [motionLog] });
    await page.waitForTimeout(400);
    const first = await loops(page);
    check(first.face === 'running' && (first.back === '' || first.back === 'paused'), `${at} on load: face loops running, back loops waiting`, first);

    await scrollThrough(page);
    await page.waitForTimeout(400);
    const after = await loops(page);
    check(after.face === 'paused' && after.back === 'running', `${at} scrolled through: face loops paused, back loops running`, after);
    const unseen = await page.evaluate(() => [...document.querySelectorAll('[data-motion]')].filter((el) => el.dataset.seen === undefined).map((el) => el.className));
    const blocks = await page.evaluate(() => document.querySelectorAll('[data-motion]').length);
    check(blocks && !unseen.length, `${at} scrolled through: all ${blocks} watched blocks seen`, unseen);

    const log = await page.evaluate(() => { window.__log.note(); return { names: [...window.__log.names].sort(), props: [...window.__log.props], cls: window.__log.cls }; });
    const bad = log.props.filter((p) => !ALLOWED.has(p));
    check(!bad.length, `${at}: only transform, translate, rotate, scale, opacity and stroke-dashoffset animate`, bad);
    check(log.names.join() === EXPECTED.join(), `${at}: animation names are exactly ${EXPECTED.join(', ')}`, log.names);

    const shots = await page.evaluate((margin) => {
      const { seen, shots } = window.__log;
      return {
        ran: shots.map((s) => {
          const at = seen.get(s.block);
          const due = at === undefined ? null : at + s.delay + s.run + margin;
          return { name: s.name, on: s.target.getAttribute('class') ?? s.target.tagName, block: s.block?.className ?? null, due, end: s.end, late: due === null || s.end === null ? null : Math.round(s.end - due) };
        }),
        left: document.getAnimations().filter((a) => a.effect.getTiming().iterations !== Infinity).map((a) => ({ name: a.animationName, state: a.playState, on: a.effect.target.getAttribute('class') })),
      };
    }, MARGIN_MS);
    const late = shots.ran.filter((s) => s.late === null || s.late > 0);
    const slack = Math.min(...shots.ran.filter((s) => s.late !== null).map((s) => -s.late));
    check(shots.ran.length && !late.length, `${at}: all ${shots.ran.length} one-shots (${[...new Set(shots.ran.map((s) => s.name))].join(', ')}) ended by seen + delay + duration + ${MARGIN_MS}ms (tightest ${slack}ms to spare)`, late);
    check(!shots.left.length, `${at}: no one-shot left running or waiting`, shots.left);
    check(log.cls === 0, `${at}: no layout shift over load and the scroll-through (cls ${log.cls})`);

    const setHidden = (hidden) => page.evaluate((hidden) => {
      if (hidden) Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      else delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    await setHidden(true);
    const hidden = await loops(page);
    check(hidden.face === 'paused' && hidden.back === 'paused', `${at} hidden tab: every loop paused`, hidden);
    await setHidden(false);
    const shown = await loops(page);
    check(shown.face === 'paused' && shown.back === 'running', `${at} shown again: the back's loops run again, the face's stay paused off screen`, shown);

    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.vig__plate > svg', { state: 'attached' });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    const again = await page.evaluate(() => { window.__log.note(); return { seen: document.querySelector('.note--face').dataset.seen, names: [...window.__log.names] }; });
    check(again.seen === 'done' && !again.names.some((n) => ROLL.includes(n)), `${at} reloaded in the same visit: face starts done, no roll or sun rise`, again);
    await show(page, '.note--back');
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => {
      window.__log.note();
      const b = document.querySelector('.note--back');
      return { plate: b.querySelector('.note__plate').dataset.seen, foil: getComputedStyle(b.querySelector('.foil')).display, swept: window.__log.names.has('bn-foil'), pen: window.__log.names.has('bn-pen') };
    });
    check(back.plate === 'done' && back.foil === 'none' && !back.swept && back.pen, `${at} reloaded in the same visit: the back's foil stays put and its medallion's pen draws again`, back);
    await ctx.close();

    const fresh = await open(size, { init: [motionLog] });
    await fresh.page.waitForTimeout(400);
    const rolled = await fresh.page.evaluate(() => { window.__log.note(); return { seen: document.querySelector('.note--face').dataset.seen, names: [...window.__log.names] }; });
    check(rolled.seen === '' && ROLL.every((n) => rolled.names.includes(n)), `${at} a new visit rolls again`, rolled);
    await fresh.page.waitForFunction(faceSettled, null, { timeout: 15000 });
    await fresh.page.setViewportSize({ width: Math.min(size.width - 40, 1000), height: size.height });
    await fresh.page.waitForFunction(() => document.querySelector('.vig__plate').dataset.redrawn === '', null, { timeout: 5000 }).catch(() => {});
    await fresh.page.waitForTimeout(100);
    const redrawn = await fresh.page.evaluate(() => ({ redrawn: document.querySelector('.vig__plate').dataset.redrawn ?? null, sun: document.querySelector('.vig__sun').getAnimations().map((a) => a.animationName) }));
    check(redrawn.redrawn === '' && redrawn.sun.join() === 'vig-breathe', `${at} drawn again at a new width: the new sun breathes and does not rise again`, redrawn);
    await fresh.ctx.close();

    const still = await open(size, { reducedMotion: 'reduce', init: [motionLog] });
    await still.page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    });
    await still.page.waitForTimeout(400);
    const rest = await still.page.evaluate(() => { window.__log.note(); return { mode: document.querySelector('.home').dataset.mode, names: [...window.__log.names] }; });
    check(rest.mode === 'still' && !rest.names.length, `${at} reduced motion: data-mode still and no animations at all`, rest);
    await still.ctx.close();
  }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// Traced from before navigation, so load and the roll are in the same trace as the idle face. The page marks the
// face being seen (motionLog) and the idle window with console.timeStamp, which lands on the trace's clock.
async function runTrace() {
  console.log(`trace: ${TRACE_MS / 1000}s on the face once its one-shots end, 390 phone at 4x CPU`);
  let cdp;
  const events = [];
  const { ctx, page } = await open(TOUCH, {
    init: [motionLog],
    before: async (page) => {
      cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
      await cdp.send('Tracing.start', { categories: CATS, transferMode: 'ReportEvents' });
    },
  });
  await page.waitForFunction(faceSettled, null, { timeout: 20000, polling: 100 });
  await page.evaluate(() => console.timeStamp('bn-idle'));
  const frames = await page.evaluate((ms) => new Promise((done) => {
    const gaps = [];
    let last = performance.now();
    const end = last + ms;
    const tick = (now) => { gaps.push(now - last); last = now; now < end ? requestAnimationFrame(tick) : done(gaps); };
    requestAnimationFrame(tick);
  }), TRACE_MS);
  await page.evaluate(() => console.timeStamp('bn-idle-end'));
  const complete = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  await complete;
  await ctx.close();

  const mark = (m) => events.find((e) => e.name === 'TimeStamp' && e.args?.data?.message === m);
  const idle = mark('bn-idle');
  const onMain = (e) => e.pid === idle.pid && e.tid === idle.tid;
  const within = (from, to) => events.filter((e) => onMain(e) && e.ts >= from && e.ts <= to);
  // Metadata events carry ts 0, so the trace starts at the first timed event on the main thread.
  const start = events.filter((e) => onMain(e) && e.ph !== 'M').reduce((t, e) => Math.min(t, e.ts), Infinity);
  const [seen, to] = [mark('bn-face-seen')?.ts ?? start, mark('bn-idle-end').ts];
  const quiet = within(idle.ts, to);
  const named = (es, n) => es.filter((e) => e.name === n);
  const ms = (es) => +(es.reduce((t, e) => t + (e.dur ?? 0), 0) / 1000).toFixed(1);
  const tasks = within(start, idle.ts).filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
  const longest = tasks.reduce((a, e) => ((e.dur ?? 0) > (a?.dur ?? 0) ? e : a), null);
  const roll = named(within(seen, idle.ts), 'Paint');
  frames.sort((a, b) => a - b);
  console.log(`  ${JSON.stringify({
    loadLongestTaskMs: +((longest?.dur ?? 0) / 1000).toFixed(1), loadLongestTaskAtMs: longest ? Math.round((longest.ts - start) / 1000) : null,
    rollMs: Math.round((idle.ts - seen) / 1000), rollPaints: roll.length, rollPaintMs: ms(roll),
    idlePaints: named(quiet, 'Paint').length, idleLayouts: named(quiet, 'Layout').length, idleFrames: frames.length,
    idleP95: +frames[Math.floor(frames.length * 0.95)].toFixed(1), idleMedian: +median(frames).toFixed(1),
  })}`);
  named(quiet, 'Paint').length ? fail(`${named(quiet, 'Paint').length} Paint events in ${TRACE_MS / 1000}s on the idle face`) : pass('no Paint on the idle face');
  named(quiet, 'Layout').length ? fail(`${named(quiet, 'Layout').length} Layout events in ${TRACE_MS / 1000}s on the idle face`) : pass('no Layout on the idle face');
}

// A task's own time by what it did: style, layout, paint, script (by file where the trace names it), html parse, gc.
const KINDS = { UpdateLayoutTree: 'style', Layout: 'layout', PrePaint: 'paint', Paint: 'paint', Layerize: 'paint', Commit: 'paint', ParseHTML: 'html', MinorGC: 'gc', MajorGC: 'gc' };
const SCRIPTS = new Set(['FunctionCall', 'EvaluateScript', 'v8.evaluateModule', 'TimerFire', 'FireAnimationFrame', 'EventDispatch', 'RunMicrotasks']);
function spentOn(task, events) {
  const inside = events.filter((e) => e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const stack = [], kind = new Map(), self = new Map();
  for (const e of inside) {
    while (stack.length && stack.at(-1).ts + stack.at(-1).dur <= e.ts) stack.pop();
    const up = stack.at(-1), upKind = up ? kind.get(up) : 'other';
    const file = (e.args?.data?.url ?? '').split('/').pop().replace(/-[\w-]{8}\.js$/, '.js');
    let k = KINDS[e.name] ?? (e.name.startsWith('V8.GC') ? 'gc' : SCRIPTS.has(e.name) ? `script ${file}`.trim() : null);
    if (k?.startsWith('script') && upKind.startsWith('script') && (upKind !== 'script' || !file)) k = upKind;
    kind.set(e, k ?? upKind);
    self.set(e, e.dur);
    if (up) self.set(up, self.get(up) - e.dur);
    stack.push(e);
  }
  const by = {};
  for (const e of inside) by[kind.get(e)] = (by[kind.get(e)] ?? 0) + self.get(e);
  return Object.entries(by).filter(([, us]) => us >= 1000).sort((a, b) => b[1] - a[1]).map(([k, us]) => `${k} ${Math.round(us / 1000)}`).join(', ');
}

// Each load in a new context, so nothing is cached, traced from before navigation until the face has settled.
async function runLoad() {
  console.log(`load: longest main-thread task, ${LOAD_RUNS} cold loads, 390 phone at 4x CPU`);
  const runs = [];
  for (let i = 0; i < LOAD_RUNS; i++) {
    let cdp;
    const events = [];
    const { ctx, page } = await open(TOUCH, {
      before: async (page) => {
        cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
        await cdp.send('Tracing.start', { categories: `${CATS},v8.execute`, transferMode: 'ReportEvents' });
      },
    });
    await page.waitForFunction(faceSettled, null, { timeout: 20000, polling: 100 });
    await page.evaluate(() => console.timeStamp('bn-load-end'));
    const complete = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    await complete;
    await ctx.close();

    const end = events.find((e) => e.name === 'TimeStamp' && e.args?.data?.message === 'bn-load-end');
    const main = events.filter((e) => e.pid === end.pid && e.tid === end.tid && e.ph === 'X' && e.dur !== undefined && e.ts <= end.ts);
    const start = Math.min(...main.map((e) => e.ts));
    const tasks = [];
    for (const e of main.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').sort((a, b) => a.ts - b.ts)) {
      if (!tasks.length || e.ts >= tasks.at(-1).ts + tasks.at(-1).dur) tasks.push(e);
    }
    const home = events.find((e) => e.name === 'ResourceSendRequest' && /\/assets\/Home-[^/]+\.js$/.test(e.args?.data?.url ?? ''));
    const arrived = events.find((e) => e.name === 'ResourceFinish' && e.args?.data?.requestId === home?.args.data.requestId);
    if (!arrived) { fail(`run ${i + 1}: no Home chunk in the trace`); continue; }
    const longest = (ts) => ts.reduce((a, t) => (t.dur > a.dur ? t : a));
    const all = longest(tasks), own = longest(tasks.filter((t) => t.ts >= arrived.ts));
    const line = (t) => `${(t.dur / 1000).toFixed(1)}ms at ${Math.round((t.ts - start) / 1000)}ms (${spentOn(t, main)})`;
    console.log(`  run ${i + 1}: longest ${line(all)}; from the Home chunk on ${line(own)}`);
    runs.push({ all: all.dur / 1000, own: own.dur / 1000 });
  }
  const spread = (xs) => `median ${median(xs).toFixed(1)}ms, ${Math.min(...xs).toFixed(1)} to ${Math.max(...xs).toFixed(1)}`;
  console.log(`  longest task: ${spread(runs.map((r) => r.all))}`);
  const own = runs.map((r) => r.own);
  check(runs.length === LOAD_RUNS && median(own) <= LOAD_BUDGET_MS, `longest task from the Home chunk on: ${spread(own)} (budget ${LOAD_BUDGET_MS}ms)`);
}

function saveData() {
  const connection = { saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} };
  Object.defineProperty(navigator, 'connection', { get: () => connection, configurable: true });
}

// A device too slow for the roll: about 30ms of main-thread work in every frame for the first 3s of the first load.
function slowDevice() {
  if (performance.getEntriesByType('navigation')[0]?.type === 'reload') return;
  const until = performance.now() + 3000;
  const burn = () => {
    const end = performance.now() + 30;
    while (performance.now() < end);
    if (performance.now() < until) requestAnimationFrame(burn);
  };
  requestAnimationFrame(burn);
}

const mode = (page) => page.evaluate(() => document.querySelector('.home').dataset.mode);

async function runLite(out) {
  console.log('lite');
  const data = await open(PHONE, { init: [saveData, motionLog] });
  check(await mode(data.page) === 'lite', 'save-data: data-mode lite', await mode(data.page));
  await show(data.page, '.note--back');
  await data.page.waitForFunction(() => document.querySelector('.note--back').dataset.seen === '' && document.querySelectorAll('.medal > svg').length === 3, null, { timeout: 5000 }).catch(() => {});
  await data.page.waitForTimeout(400);
  const medal = await data.page.evaluate(() => {
    window.__log.note();
    const paths = [...document.querySelectorAll('.medal path')];
    return {
      rings: document.querySelectorAll('.medal > svg').length, paths: paths.length,
      undrawn: paths.filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) !== 0).length,
      medal: document.querySelector('.medal').getAnimations({ subtree: true }).map((a) => ({ name: a.animationName, state: a.playState, delay: a.effect.getTiming().delay })),
      pen: window.__log.names.has('bn-pen'),
    };
  });
  check(medal.rings === 3 && medal.paths && !medal.undrawn && !medal.pen, `save-data: medallion rests drawn, ${medal.paths} paths at stroke-dashoffset 0 and no bn-pen`, medal);
  check(medal.medal.length === 3 && medal.medal.every((a) => a.name === 'bn-turn' && a.state === 'running' && a.delay === 0), 'save-data: only bn-turn runs on the medallion, three rings, no delay', medal.medal);
  await show(data.page, '#lucid');
  await data.page.waitForTimeout(2400);
  const row = await data.page.evaluate(() => { window.__log.note(); return { click: window.__log.names.has('bn-click'), ink: window.__log.names.has('bn-ink') }; });
  check(row.click && !row.ink, 'save-data: a row\'s number still clicks and its rule is printed from the start', row);
  if (out) {
    mkdirSync(out, { recursive: true });
    const file = join(out, 'lite-medal-390.png');
    writeFileSync(file, await data.page.locator('.medal').screenshot());
    pass(`saved ${file}`);
  }
  await data.ctx.close();

  // Chromium reads prefers-reduced-data only with this Blink feature on, so this case gets its own browser.
  const flagged = await chromium.launch({ args: ['--enable-blink-features=PrefersReducedData'] });
  const reduced = await open(PHONE, {
    on: flagged,
    before: async (page) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-data', value: 'reduce' }] });
    },
  });
  if (await reduced.page.evaluate(() => matchMedia('(prefers-reduced-data: reduce)').matches))
    check(await mode(reduced.page) === 'lite', 'prefers-reduced-data: data-mode lite', await mode(reduced.page));
  else console.log(`  skip prefers-reduced-data: Chromium ${flagged.version()} does not report it to matchMedia, even with the PrefersReducedData Blink feature`);
  await reduced.ctx.close();
  await flagged.close();

  const slow = await open(PHONE, { init: [slowDevice, motionLog] });
  await slow.page.waitForFunction(() => document.querySelector('.home').dataset.mode === 'lite', null, { timeout: 6000 }).catch(() => {});
  const switched = await slow.page.evaluate(() => {
    const roll = window.__log.shots.find((s) => s.name === 'vig-roll');
    const face = document.querySelector('.note--face');
    return {
      mode: document.querySelector('.home').dataset.mode, modes: window.__log.modes, slow: sessionStorage.getItem('bn-slow'),
      roll: roll && { start: Math.round(roll.start), end: roll.end && Math.round(roll.end) }, face: { motion: face.dataset.motion, seen: face.dataset.seen },
    };
  });
  const turned = switched.modes.find((m) => m.mode === 'lite')?.at;
  check(switched.mode === 'lite' && switched.roll && turned >= switched.roll.start && (switched.roll.end === null || turned <= switched.roll.end),
    `slow device: data-mode lite during the roll (at ${Math.round(turned)}ms, roll ${switched.roll?.start}..${switched.roll?.end ?? 'running'}ms)`, switched);
  check(switched.slow === '1', 'slow device: sessionStorage bn-slow is "1"', switched.slow);
  check(switched.face.motion === 'on' && switched.face.seen === '', 'slow device: the face keeps playing (data-motion on, data-seen "")', switched.face);
  await slow.page.reload({ waitUntil: 'load' });
  await slow.page.waitForSelector('.vig__plate > svg', { state: 'attached' });
  const reload = await slow.page.evaluate(() => ({ first: window.__log.first, seen: document.querySelector('.note--face').dataset.seen }));
  check(reload.first === 'lite' && reload.seen === 'done', 'slow device reloaded in the same visit: starts lite with the face done', reload);
  await slow.ctx.close();

  const touch = await open(TOUCH, { init: [motionLog] });
  await touch.page.waitForFunction(faceSettled, null, { timeout: 10000 }).catch(() => {});
  const control = await touch.page.evaluate(() => ({
    mode: document.querySelector('.home').dataset.mode, changes: window.__log.modes, slow: sessionStorage.getItem('bn-slow'),
    width: innerWidth, coarse: matchMedia('(pointer: coarse)').matches,
  }));
  check(control.width === 390 && control.coarse, 'control: a 390px touch screen with a coarse pointer', control);
  check(control.mode === 'full' && !control.changes.length && control.slow === null, 'control: narrow screen and coarse pointer alone stay full through the roll', control);
  await touch.ctx.close();
}

// The print's frame, lift and shadow as computed, after pointing at a part of the row once it has settled.
async function runHover() {
  console.log('hover');
  const print = (page) => page.evaluate(() => {
    const p = document.querySelector('#dervo .print'), rule = getComputedStyle(p.querySelector('.print__rule'));
    return { frame: `${rule.opacity} ${rule.strokeDashoffset}`, lift: getComputedStyle(p.querySelector('.print__frame')).transform, shadow: getComputedStyle(p, '::before').opacity };
  });
  const DRAWN = { frame: '1 0px', lift: 'matrix(1, 0, 0, 1, 0, -3)', shadow: '1' };
  for (const { name, size, reducedMotion, at, drawn } of [
    { name: '1440, pointing at the print', size: DESKTOP, at: '#dervo .print', drawn: true },
    { name: '1440, pointing at the row\'s name', size: DESKTOP, at: '#dervo h3 a', drawn: true },
    { name: '1440 reduced motion, pointing at the print', size: DESKTOP, reducedMotion: 'reduce', at: '#dervo .print', drawn: false },
    { name: '390 touch screen, pointing at the print', size: TOUCH, at: '#dervo .print', drawn: false },
  ]) {
    const { ctx, page } = await open(size, { reducedMotion });
    await show(page, '#dervo');
    await page.waitForTimeout(2500);
    const before = await print(page);
    await page.hover(at);
    await page.waitForTimeout(700);
    const after = await print(page);
    check(JSON.stringify(after) === JSON.stringify(drawn ? DRAWN : before), `${name}: ${drawn ? 'the frame is drawn and the print lifts' : 'nothing changes'}`, { before, after });
    await ctx.close();
  }
}

async function still(size, file, reducedMotion) {
  const { ctx, page } = await open(size, { reducedMotion });
  await page.waitForFunction(faceSettled, null, { timeout: 15000 });
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

// Every animation is paused the moment the face is seen with its picture drawn (the sun's rise only exists from
// then), then all of them are set to the same time past that moment for each frame, so the clip shows the timeline
// exactly as a visitor sees it from first view.
async function recordClip(clip, dir) {
  const { ctx, page } = await open(clip, {
    init: [() => {
      new MutationObserver((_, observer) => {
        if (document.querySelector('.note--face')?.dataset.seen !== '' || !document.querySelector('.vig__plate > svg')) return;
        observer.disconnect();
        window.__clock = document.getAnimations().map((a) => { a.pause(); return [a, a.currentTime ?? 0]; });
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-seen'] });
    }],
  });
  await page.waitForFunction(() => window.__clock, null, { timeout: 15000 });
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

// The box round every wing at each of the given times (or now), in viewport pixels as screenshot clips take them.
const birdBox = (page, times = [null]) => page.evaluate(([pad, times]) => {
  const rs = times.flatMap((ms) => {
    if (ms !== null) for (const [a, t0] of window.__clock) a.currentTime = t0 + ms;
    return [...document.querySelectorAll('.vig__wing')].map((w) => w.getBoundingClientRect());
  });
  const x = Math.min(...rs.map((r) => r.left)) - pad, y = Math.min(...rs.map((r) => r.top)) - pad;
  return { x: Math.floor(x), y: Math.floor(y), width: Math.ceil(Math.max(...rs.map((r) => r.right)) + pad - x), height: Math.ceil(Math.max(...rs.map((r) => r.bottom)) + pad - y) };
}, [BIRD_PAD, times]);

async function runBirds(dir, from) {
  console.log(`birds into ${dir}`);
  mkdirSync(dir, { recursive: true });
  for (const size of BIRDS) {
    const still = await open(size, { reducedMotion: 'reduce' });
    await show(still.page, '.vig');
    await still.page.waitForTimeout(400);
    const box = await birdBox(still.page);
    await still.page.screenshot({ path: join(dir, `birds-${size.width}-reduced.png`), clip: box });
    await still.ctx.close();

    const { ctx, page } = await open(size);
    await show(page, '.vig');
    await page.waitForFunction(faceSettled, null, { timeout: 10000 });
    await page.evaluate(() => { window.__clock = document.getAnimations().map((a) => { a.pause(); return [a, a.currentTime ?? 0]; }); });
    const times = Array.from({ length: BIRD_MS / BIRD_STEP_MS + 1 }, (_, k) => from + k * BIRD_STEP_MS);
    const moving = await birdBox(page, times);
    for (const ms of times) {
      await page.evaluate((ms) => {
        for (const [a, t0] of window.__clock) a.currentTime = t0 + ms;
        return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, ms);
      await page.screenshot({ path: join(dir, `birds-${size.width}-${String(ms).padStart(5, '0')}.png`), clip: moving });
    }
    await ctx.close();
    pass(`${size.width}: ${times.length} frames (${moving.width}x${moving.height} CSS px) and the rest pose (${box.width}x${box.height})`);
  }
}

if (baseline) await runBaseline(baseline);
if (diff) await runDiff(diff);
if (flag('--states')) await runStates();
if (flag('--trace')) await runTrace();
if (flag('--load')) await runLoad();
if (flag('--lite')) await runLite(value('--out'));
if (flag('--hover')) await runHover();
if (stills) await runStills(stills, value('--name') ?? 'after');
if (record) await runRecord(record);
if (birds) await runBirds(birds, Number(value('--from') ?? 0));
await browser.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
