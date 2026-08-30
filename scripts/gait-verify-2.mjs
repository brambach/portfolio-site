/**
 * Gait verification, part 2: the reversal and the crawl.
 * Run with the dev server up: node scripts/gait-verify-2.mjs [screenshot-dir]
 *
 *  1. reader retreats up the page -> hare turns (mirror flip), trail
 *     retracts behind it, passed rings un-stamp on a real retreat
 *  2. a barely-moving reader (~30 px/s) -> hop-and-wait rhythm, with the
 *     pose actually alternating rather than flapping every frame
 *  3. frame burst through a settle to eyeball the squash landing
 */
import { chromium } from 'playwright';

const out = process.argv[2] ?? '.';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);

// run to the bottom first, settled
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(3500);

// 1. retreat: scroll steadily back up for 3s, watch facing + stamps
const retreat = await p.evaluate(async () => {
  const hare = document.querySelector('.trail-ink > g[style]');
  const stampedBefore = document.querySelectorAll('.trail-ink .wp.stamped').length;
  const start = performance.now();
  let last = start;
  let sawMirror = false;
  await new Promise((res) => {
    const step = (now) => {
      const dt = now - last;
      last = now;
      window.scrollBy(0, -1.2 * dt); // brisk retreat, ~1200 px/s
      if (/scale\(-/.test(hare?.getAttribute('transform') ?? '')) sawMirror = true;
      if (now - start > 3000) return res();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  await new Promise((r) => setTimeout(r, 1500));
  return {
    sawMirror,
    stampedBefore,
    stampedAfter: document.querySelectorAll('.trail-ink .wp.stamped').length,
    dotsVisible: [...document.querySelectorAll('.trail-dots circle')].filter(
      (c) => c.getAttribute('opacity') === '0.85',
    ).length,
    dotsTotal: document.querySelectorAll('.trail-dots circle').length,
  };
});
await p.screenshot({ path: `${out}/gait2-1-retreat.png` });

// 2. crawl: ~30 px/s for 8s; log pose changes (sit <-> run alternation)
const crawl = await p.evaluate(async () => {
  const ink = document.querySelector('.trail-ink');
  const changes = [];
  let lastSitting = !!ink.querySelector('.hare-sit');
  const poll = setInterval(() => {
    const s = !!ink.querySelector('.hare-sit');
    if (s !== lastSitting) {
      changes.push({ t: Math.round(performance.now()), sitting: s });
      lastSitting = s;
    }
  }, 40);
  const start = performance.now();
  let last = start;
  await new Promise((res) => {
    const step = (now) => {
      const dt = now - last;
      last = now;
      window.scrollBy(0, 0.03 * dt);
      if (now - start > 8000) return res();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  clearInterval(poll);
  const spans = changes.slice(1).map((c, i) => c.t - changes[i].t);
  return { poseChanges: changes.length, spansMs: spans };
});

// 3. settle burst: hop forward, then capture the landing every 80ms
await p.evaluate(() => window.scrollBy(0, 400));
await p.waitForTimeout(500);
for (let i = 0; i < 8; i++) {
  await p.screenshot({ path: `${out}/gait2-settle-${i}.png` });
  await p.waitForTimeout(80);
}

console.log(JSON.stringify({ retreat, crawl }, null, 2));
await b.close();
