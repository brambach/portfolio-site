/**
 * Gait verification: measures the hare's stride against real scroll speeds.
 * Run with the dev server up: node scripts/gait-verify.mjs [screenshot-dir]
 *
 * Checks, in order:
 *  1. slow scroll  -> slow, legible hops (long half-stride intervals)
 *  2. flat-out fling -> gallop cadence near the 4/s ceiling
 *  3. bounce amplitude scales between the two
 *  4. a settled hare ignores a sub-hop nudge (deadband)
 *  5. ...but gets up once the gap is real
 *  6. settle lands in the sit drawing with squash + breath animations
 */
import { chromium } from 'playwright';

const out = process.argv[2] ?? '.';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);

await p.evaluate(() => {
  window.__gait = { flips: [] };
  const ink = document.querySelector('.trail-ink');
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      const el = m.target;
      if (el.classList?.contains('hare-fA') && m.attributeName === 'style')
        window.__gait.flips.push(performance.now());
    }
  });
  mo.observe(ink, { attributes: true, subtree: true, attributeFilter: ['style'] });
});

const intervals = (flips) => flips.slice(1).map((t, i) => Math.round(t - flips[i]));

const scrollAt = (pxPerMs, ms) =>
  p.evaluate(
    async ([speed, dur]) => {
      window.__gait.flips.length = 0;
      window.__bob = [];
      const hare = document.querySelector('.trail-ink > g[style]');
      const start = performance.now();
      let last = start;
      await new Promise((res) => {
        const step = (now) => {
          const dt = now - last;
          last = now;
          window.scrollBy(0, speed * dt);
          const bobG = hare?.firstElementChild;
          const m = /translate\(0,\s*(-?[\d.]+)\)/.exec(bobG?.getAttribute('transform') ?? '');
          if (m) window.__bob.push(Number(m[1]));
          if (now - start > dur) return res();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      return { flips: [...window.__gait.flips], bobMin: Math.min(0, ...window.__bob) };
    },
    [pxPerMs, ms],
  );

// 1. slow amble: ~140 px/s for 5s
const slow = await scrollAt(0.14, 5000);
await p.screenshot({ path: `${out}/gait-1-slow.png` });
await p.waitForTimeout(1200); // settle

// 2. flat-out: fling to the bottom, sample mid-sprint
const fast = await p.evaluate(async () => {
  window.__gait.flips.length = 0;
  window.__bob = [];
  window.scrollTo(0, document.documentElement.scrollHeight);
  const hare = document.querySelector('.trail-ink > g[style]');
  const start = performance.now();
  await new Promise((res) => {
    const step = (now) => {
      const bobG = hare?.firstElementChild;
      const m = /translate\(0,\s*(-?[\d.]+)\)/.exec(bobG?.getAttribute('transform') ?? '');
      if (m) window.__bob.push(Number(m[1]));
      if (now - start > 2500) return res();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  return { flips: [...window.__gait.flips], bobMin: Math.min(0, ...window.__bob) };
});
await p.screenshot({ path: `${out}/gait-2-sprint.png` });

// 3. settle at the flag, then check the sit drawing and its animations
await p.waitForTimeout(2500);
const settle = await p.evaluate(() => {
  const sit = document.querySelector('.trail-ink .hare-sit');
  const hare = document.querySelector('.trail-ink > g[style]');
  const m = /translate\((-?[\d.]+),\s*(-?[\d.]+)\)/.exec(hare?.getAttribute('transform') ?? '');
  const rings = [...document.querySelectorAll('.trail-ink .wp circle')].map((c) => ({
    x: Number(c.getAttribute('cx')),
    y: Number(c.getAttribute('cy')),
  }));
  let nearestRingPx = null;
  if (m && rings.length) {
    const hx = Number(m[1]);
    const hy = Number(m[2]);
    nearestRingPx = Math.min(...rings.map((r) => Math.hypot(r.x - hx, r.y - hy)));
  }
  const wps = [...document.querySelectorAll('.trail-ink .wp')];
  return {
    sitting: !!sit,
    animations: sit ? getComputedStyle(sit).animationName : null,
    nearestRingPx: nearestRingPx === null ? null : Math.round(nearestRingPx),
    lastRingStamped: wps.length ? wps[wps.length - 1].classList.contains('stamped') : null,
  };
});
await p.screenshot({ path: `${out}/gait-3-settled.png` });

// 4 + 5. deadband: a settled hare ignores 6px, gets up for 60px
const deadband = await p.evaluate(async () => {
  const hare = document.querySelector('.trail-ink > g[style]');
  const before = hare.getAttribute('transform');
  window.scrollBy(0, -6);
  await new Promise((r) => setTimeout(r, 500));
  const afterNudge = hare.getAttribute('transform');
  window.scrollBy(0, -60);
  await new Promise((r) => setTimeout(r, 700));
  const afterMove = hare.getAttribute('transform');
  return { ignoredNudge: before === afterNudge, movedForReal: before !== afterMove };
});

console.log(
  JSON.stringify(
    {
      slowHalfStridesMs: intervals(slow.flips),
      slowBobMin: slow.bobMin,
      fastHalfStridesMs: intervals(fast.flips),
      fastBobMin: fast.bobMin,
      settle,
      deadband,
    },
    null,
    2,
  ),
);
await b.close();
