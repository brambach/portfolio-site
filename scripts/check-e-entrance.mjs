// The site's first load, frame by frame: how visible each part of the entrance is from navigation to 2.5 s, and
// whether anything shows, hides and shows again (the flash this checks for).
// Usage: node scripts/check-e-entrance.mjs <url> [chromium|webkit] [width] [height] [--json out.json] [--reduced]
import { chromium, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
const json = option('--json');
// --from <home url>: open the home page first and follow its link to the page, so the dots are handed over.
const from = option('--from');
const reduced = args.includes('--reduced') ? (args.splice(args.indexOf('--reduced'), 1), true) : false;
const [url, engine = 'chromium', w = '1440', h = '900'] = args;
const browser = await (engine === 'webkit' ? webkit : chromium).launch();
const touch = Number(w) < 1000;
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: touch ? 3 : 1, hasTouch: touch, isMobile: touch && engine === 'chromium', reducedMotion: reduced ? 'reduce' : 'no-preference' });

const TARGETS = {
  'header': '.e-head',
  'headline': 'h1.e-tag, h1.e-wp__name',
  'sub (home)': 'p.e-hero__sub',
  'line': 'p.e-wp__line',
  'facts': 'dl.e-wp__facts',
  'see it link': 'dl.e-wp__facts a.e-go.is-away',
  'back link': 'a.e-wp__back',
  'top rule labels': '.e-wp__top > .e-rule span',
};
await page.addInitScript((targets) => {
  const log = (window.__entrance = []);
  // How much of an element shows: its opacity times every ancestor's, zero if it's hidden. For the headline, whether
  // its first letter has come up out of its mask yet counts too.
  const seen = (el) => {
    if (!el) return null;
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none') return 0;
      o *= Number(cs.opacity);
    }
    if (getComputedStyle(el).visibility === 'hidden') return 0;
    return Math.round(o * 1000) / 1000;
  };
  // A split headline is as visible as its letters are: each one's opacity times how much of it is out of its mask.
  const letters = (el) => {
    const base = seen(el);
    const chars = el ? [...el.querySelectorAll('.e-ch, [data-title] > div > div, [data-title] div[class*="char"]')] : [];
    if (!base || !chars.length) return base;
    let sum = 0;
    for (const c of chars) {
      const r = c.getBoundingClientRect(), m = c.parentElement.getBoundingClientRect();
      const mask = getComputedStyle(c.parentElement).overflow !== 'visible' ? m : { top: -1e9, bottom: 1e9 };
      const full = c.offsetHeight || 1, grown = Math.min(1, r.height / full);
      const inside = r.height ? grown * Math.max(0, Math.min(r.bottom, mask.bottom) - Math.max(r.top, mask.top)) / r.height : 0;
      sum += (seen(c) ?? 0) * inside;
    }
    return Math.round((base * sum / chars.length) * 1000) / 1000;
  };
  const tick = () => {
    const row = { t: Math.round(performance.now()) };
    for (const [k, sel] of Object.entries(targets)) row[k] = k === 'headline' ? letters(document.querySelector(sel)) : seen(document.querySelector(sel));
    log.push(row);
    if (performance.now() < 2700) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, TARGETS);

if (from) {
  await page.goto(from, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const link = page.locator(`a.e-index__link[href="${new URL(url).pathname}"]`).first();
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await link.click();
  // On a touch screen the first tap opens the row, and its Open link leaves.
  await page.waitForTimeout(800);
  if (await page.locator('.e-index__row.is-open').count()) await page.locator(`a.e-open[href="${new URL(url).pathname}"]`).first().click();
  await page.waitForURL(url, { waitUntil: 'commit' });
} else await page.goto(url, { waitUntil: 'commit' });
await page.waitForTimeout(3200);
const log = await page.evaluate(() => window.__entrance);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await browser.close();

// One row per 100 ms: the last frame at or before each step.
const keys = Object.keys(TARGETS);
const steps = [];
for (let t = 0; t <= 2500; t += 100) {
  const row = [...log].reverse().find((r) => r.t <= t) ?? null;
  steps.push({ t, ...Object.fromEntries(keys.map((k) => [k, row ? row[k] : null])) });
}
// A flash: any part that got more visible and then less visible again.
const flashes = [];
for (const k of keys) {
  let peak = 0;
  for (const r of log) {
    const v = r[k];
    if (v == null) continue;
    if (v > peak) peak = v;
    else if (peak - v > 0.02) { flashes.push(`${k}: up to ${peak} then down to ${v} at ${r.t}ms`); break; }
  }
}
const fmt = (v) => (v == null ? '  -  ' : v.toFixed(2).padStart(5));
console.log(`${url} ${engine} ${w}x${h}${reduced ? ' reduced motion' : ''}${from ? ' (from ' + from + ')' : ''}`);
console.log('   ms  ' + keys.map((k) => k.slice(0, 12).padStart(12)).join(''));
for (const s of steps) console.log(String(s.t).padStart(5) + '  ' + keys.map((k) => fmt(s[k]).padStart(12)).join(''));
console.log(flashes.length ? `FLASH\n  ${flashes.join('\n  ')}` : 'no flash: nothing goes up and then down');
if (json) writeFileSync(json, JSON.stringify({ url, engine, w, h, reduced, steps, frames: log, flashes }, null, 1));
process.exitCode = flashes.length ? 1 : 0;
