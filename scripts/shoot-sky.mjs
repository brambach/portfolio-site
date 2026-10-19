// Screenshots of the sky home page, for checking a change by eye.
// Run `npm run build && npm run preview` first, then:
//   node scripts/shoot-sky.mjs <outDir> [baseUrl]
// Shoots 390x844 and 1440x900, plus a reduced-motion pass at both, and fails if the console logged an error.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const outDir = process.argv[2] ?? 'docs/screenshots/generalist';
const base = process.argv[3] ?? 'http://localhost:4173';
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
const errors = [];
const browser = await chromium.launch();

async function shoot(size, reduced) {
  const tag = `${size.name}${reduced ? '-reduced' : ''}`;
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
    isMobile: size.mobile,
    hasTouch: size.mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') errors.push(`${tag}: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`${tag}: ${error.message}`));
  // Noon, so every run gets the same sky.
  await page.goto(`${base}/?hour=12`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(reduced ? 600 : 4200);
  await page.screenshot({ path: `${outDir}/${tag}-01-first-screen.png` });

  // Raise a different skill: point at it on a desktop, tap it on a phone.
  const row = page.locator('.sky-ix a[data-i="2"]');
  if (await row.count()) {
    if (size.mobile) await row.tap(); else await row.hover();
    await page.waitForTimeout(reduced ? 300 : 1800);
    await page.screenshot({ path: `${outDir}/${tag}-02-skill-raised.png` });
  }

  // Walk down the page so everything that reveals on the way has, then a shot per screen.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let n = 3;
  for (let y = Math.round(size.height * 0.9); y < height; y += Math.round(size.height * 0.9)) {
    await page.evaluate(top => window.scrollTo(0, top), y);
    await page.waitForTimeout(reduced ? 250 : 1100);
    await page.screenshot({ path: `${outDir}/${tag}-${String(n++).padStart(2, '0')}-scroll.png` });
    if (n > 14) break;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${tag}-full.png`, fullPage: true });
  await context.close();
}

for (const size of sizes) for (const reduced of [false, true]) await shoot(size, reduced);
await browser.close();

if (errors.length) { console.error(`Console errors:\n${errors.join('\n')}`); process.exit(1); }
console.log(`Shots in ${outDir}. No console errors.`);
