// Frames of the banknote home's motion at exact times, ported from the banknote-motion mockup's tools/frames.mjs.
// Every animation and transition on the page is paused and seeked to a time after its scene starts, so frames do not
// depend on machine speed. Run it against a production build served by `vite preview`. Not part of npm test.
// Scenes, and the moment each starts:
//   face, back            the note's one-shots start (it is first seen): the roll and the foil, the back's foil and pen
//   work-1 .. work-4      the row's one-shots start: the wheel, then the rule
//   hover-1 .. hover-4    the pointer arrives on the row's print, once the row has settled: the frame and the lift;
//                         "out:t" is t ms after it leaves
//   link-hero, link-back  the same for a link's line, on the face and on the dark back
//   stamp-hero, stamp-footer   the copy button is clicked; "out:t" is t ms after the stamp starts to go. The page's
//                         JS clock is held, so the stamp only goes when this script lets it.
// Writes <scene>-<width>-<time>.png for each time and <scene>-<width>-sheet.png, tiled four across (needs ffmpeg),
// and prints what the moving parts read at each time, plus the frame's distance from the print on hover scenes.
// Usage: node scripts/frames.mjs <width> <scene> <outdir> [times, comma list] [--url http://localhost:4180/] [--scale n]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2), opts = {}, pos = [];
for (let i = 0; i < args.length; i++) args[i].startsWith('--') ? (opts[args[i].slice(2)] = args[++i]) : pos.push(args[i]);
const [w, scene, out, list] = pos;
const width = Number(w), mobile = width < 760;
const URL = opts.url ?? 'http://localhost:4180/';
const scale = Number(opts.scale ?? (mobile ? 2 : 1));

const ROWS = ['dervo', 'integration-portal', 'arro', 'lucid'];
// Each scene: what to crop, how it starts, its default times, and what to read at each time ([selector, property],
// with ::before for the pseudo-element).
const SCENES = {
  face: { kind: 'block', block: '.note--face', times: '0,1200,2400,3500,4500,5700', read: [['.note--face .roll', 'transform'], ['.note--face .foil__band', 'transform']] },
  back: { kind: 'block', block: '.note--back', times: '0,800,1600,2400,3300', read: [['.note--back .foil__band', 'transform'], ['.medal path', 'strokeDashoffset']] },
  ...Object.fromEntries(ROWS.flatMap((id, i) => [
    [`work-${i + 1}`, { kind: 'block', block: `#${id}`, crop: `#${id} .work__line`, pad: [16, 16], times: '0,600,1200,1700,2200', read: [[`#${id} .wheel__col`, 'transform'], [`#${id} .micro--rule`, 'transform']] }],
    [`hover-${i + 1}`, { kind: 'hover', block: `#${id}`, target: `#${id} .print`, pad: [32, 56], times: '0,120,240,480,out:0,out:70,out:140', read: [[`#${id} .print__rule`, 'strokeDashoffset'], [`#${id} .print__rule`, 'opacity'], [`#${id} .print__frame`, 'transform'], [`#${id} .print::before`, 'opacity']] }],
  ])),
  'link-hero': { kind: 'hover', block: '.note--face', target: '.hero__links a[href*="github"]', pad: [24, 12], times: '0,110,220,out:0,out:70,out:140', read: [['.hero__links a[href*="github"]::before', 'transform'], ['.hero__links a[href*="github"]::before', 'transformOrigin']] },
  'link-back': { kind: 'hover', block: '.note--back', target: '.back__links a[href*="github"]', pad: [24, 12], times: '0,110,220,out:0,out:70,out:140', read: [['.back__links a[href*="github"]::before', 'transform'], ['.back__links a[href*="github"]::before', 'transformOrigin']] },
  'stamp-hero': { kind: 'stamp', target: '.hero__links .copy', pad: [64, 56], times: '0,110,220,1000,out:0,out:70,out:140', read: [['.hero__links .stamp', 'opacity'], ['.hero__links .stamp', 'scale']] },
  'stamp-footer': { kind: 'stamp', target: '.back__links .copy', pad: [64, 56], times: '0,110,220,1000,out:0,out:70,out:140', read: [['.back__links .stamp', 'opacity'], ['.back__links .stamp', 'scale']] },
};
const sc = SCENES[scene];
if (!width || !sc || !out) {
  console.log(`usage: node scripts/frames.mjs <width> <scene> <outdir> [times] [--url u] [--scale n]\nscenes: ${Object.keys(SCENES).join(', ')}`);
  process.exit(2);
}
const times = (list ?? sc.times).split(',').map((t) => ({ out: t.startsWith('out:'), ms: Number(t.replace('out:', '')) }));
mkdirSync(out, { recursive: true });

// In the page: pause each animation the first time it is seen, keeping when it started on the document timeline;
// seek sets every paused one to a time after t0.
function clock() {
  const frozen = window.__frozen = new Map();
  window.__freeze = () => {
    for (const a of document.getAnimations()) if (!frozen.has(a)) { frozen.set(a, a.startTime ?? document.timeline.currentTime); a.pause(); }
  };
  // A transition a later style change cancelled goes idle, and setting its time would bring it back.
  window.__seek = (t0, t) => { window.__freeze(); for (const [a, start] of frozen) if (a.playState !== 'idle') a.currentTime = t0 + t - start; };
  // The earliest start among the paused animations that pass the test, or now.
  window.__start = (test) => {
    const starts = [...frozen].filter(([a]) => test(a)).map(([, s]) => s);
    return starts.length ? Math.min(...starts) : document.timeline.currentTime;
  };
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
if (sc.kind === 'stamp') await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
const page = await ctx.newPage();
page.on('pageerror', (e) => process.stderr.write(`pageerror ${e.message}\n`));
await page.addInitScript(clock);
// The face is seen on load, so it freezes the moment it is seen with its picture drawn, before its roll ends.
if (scene === 'face') await page.addInitScript(() => new MutationObserver((_, mo) => {
  if (document.querySelector('.note--face')?.dataset.seen !== '' || !document.querySelector('.vig__plate > svg')) return;
  mo.disconnect();
  window.__freeze();
}).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-seen'] }));
if (sc.kind === 'stamp') await page.clock.install();
await page.goto(URL, { waitUntil: 'load' });
await page.waitForSelector('.vig__plate > svg', { state: 'attached' });
await page.evaluate(() => document.fonts.ready);

const center = (s) => page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), s);
// The block's own one-shots, so loops elsewhere (the birds) never set the start.
const blockStart = (block) => page.evaluate((block) => window.__start((a) => document.querySelector(block).contains(a.effect.target) && a.effect.getTiming().iterations !== Infinity), block);
const newStart = (within) => page.evaluate((within) => window.__start((a) => !window.__before.has(a) && a.effect.target.closest(within)), within);
// Paused past their end, earlier transitions drop out of getAnimations(), so the frozen ones count as before too.
const mark = () => page.evaluate(() => { window.__before = new Set([...document.getAnimations(), ...window.__frozen.keys()]); });
// The JS clock is held in stamp scenes, which holds requestAnimationFrame too.
const settle = () => (sc.kind === 'stamp' ? page.waitForTimeout(80) : page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
const until = async (fn, arg, ms = 5000) => {
  for (const end = Date.now() + ms; Date.now() < end; await page.waitForTimeout(20)) if (await page.evaluate(fn, arg)) return;
  throw new Error(`timed out waiting for ${fn}`);
};

let t0 = 0;
if (sc.kind === 'block' && scene !== 'face') {
  await page.evaluate((block) => {
    const el = document.querySelector(block);
    new MutationObserver((_, mo) => { if (el.dataset.seen === '') { mo.disconnect(); window.__freeze(); } }).observe(el, { attributes: true, attributeFilter: ['data-seen'] });
  }, sc.block);
  await center(sc.block);
  await until((block) => document.querySelector(block).dataset.seen === '', sc.block);
}
if (sc.kind === 'block') {
  await page.waitForFunction(() => window.__frozen.size);
  t0 = await blockStart(sc.block);
}
if (sc.kind === 'hover') {
  await center(sc.block);
  await until((block) => document.querySelector(block).dataset.seen === '' && document.querySelector(block).getAnimations({ subtree: true }).every((a) => a.effect.getTiming().iterations === Infinity), sc.block, 10000);
  const box = await page.locator(sc.target).boundingBox();
  await mark();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.evaluate(() => window.__freeze());
  t0 = await newStart(sc.target);
}
if (sc.kind === 'stamp') {
  await center(sc.target);
  // Pointing first, so the button has its hover colour before the click and only the stamp moves.
  await page.hover(sc.target);
  await page.waitForTimeout(400);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1));
  await mark();
  await page.click(sc.target);
  await until((s) => document.querySelector(s).dataset.stamp === 'in', sc.target);
  await page.evaluate(() => window.__freeze());
  t0 = await newStart(sc.target);
}

const crop = await page.evaluate(([s, [px, py]]) => {
  const r = document.querySelector(s).getBoundingClientRect();
  const x = Math.max(0, r.left - px), y = Math.max(0, r.top - py);
  return { x, y, width: Math.min(innerWidth - x, r.width + 2 * px), height: Math.min(innerHeight - y, r.height + 2 * py) };
}, [sc.crop ?? sc.target ?? sc.block, sc.pad ?? [8, 8]]);
const read = (pairs) => page.evaluate((pairs) => pairs.map(([s, p]) => {
  const [sel, pseudo] = s.split('::');
  const el = document.querySelector(sel);
  return `${s} ${p} ${el ? getComputedStyle(el, pseudo ? `::${pseudo}` : null)[p] : 'missing'}`;
}).join(' | '), pairs);

const files = [];
let outStart = null;
for (const t of times) {
  // The pointer leaves; or the held clock goes forward a step at a time until the stamp starts to go, so its next
  // phase never comes.
  if (t.out && outStart === null) {
    await mark();
    if (sc.kind === 'hover') await page.mouse.move(1, 1);
    else for (let held = 0; await page.evaluate((s) => document.querySelector(s).dataset.stamp !== 'out', sc.target); held += 20) {
      if (held > 5000) throw new Error('the stamp never started to go');
      await page.clock.runFor(20);
      await page.waitForTimeout(20);
    }
    await page.evaluate(() => window.__freeze());
    outStart = await newStart(sc.target);
  }
  await page.evaluate(([t0, t]) => window.__seek(t0, t), [t.out ? outStart : t0, t.ms]);
  await settle();
  const label = `${t.out ? 'out-' : ''}${String(t.ms).padStart(5, '0')}`;
  const file = join(out, `${scene}-${width}-${label}.png`);
  await page.screenshot({ path: file, clip: crop });
  files.push(file);
  console.log(`${label}: ${await read(sc.read)}`);
}

// Where the frame's stroke runs, against the print it frames, arro's two phones included.
if (sc.kind === 'hover' && scene.startsWith('hover')) console.log(await page.evaluate((target) => {
  const print = document.querySelector(target), shot = print.querySelector('.print__frame').getBoundingClientRect();
  const rule = print.querySelector('.print__rule').getBoundingClientRect();
  const gap = { top: shot.top - rule.top, right: rule.right - shot.right, bottom: rule.bottom - shot.bottom, left: shot.left - rule.left };
  return `frame stroke centre outside the print (px, covers that +-0.5): ${Object.entries(gap).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`;
}, sc.target));

await browser.close();
const cols = Math.min(4, files.length);
const at = (i) => `${i % cols ? Array.from({ length: i % cols }, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, () => 'h0').join('+') : '0'}`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]),
  '-filter_complex', `${files.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => at(i)).join('|')}:fill=white`,
  join(out, `${scene}-${width}-sheet.png`)]);
console.log(`saved ${files.length} frames and ${scene}-${width}-sheet.png in ${out}`);
