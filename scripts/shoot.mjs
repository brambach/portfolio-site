// Visual verification: scrolls through the page so in-view animations settle,
// then captures a viewport shot per section plus a full-page shot.
// Usage: node scripts/shoot.mjs <outDir> [width] [height]
import { chromium } from 'playwright';

const outDir = process.argv[2] ?? 'shots';
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// walk the page so every whileInView fires
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= docH; y += Math.round(height * 0.55)) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(450);
}

const sections = await page.evaluate(() =>
  [...document.querySelectorAll('section[id]')].map((s) => ({
    id: s.id,
    top: s.getBoundingClientRect().top + window.scrollY,
  })),
);

for (const s of sections) {
  await page.evaluate((top) => window.scrollTo(0, Math.max(0, top)), s.top - 40);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${outDir}/${width}-${s.id}.png` });
}

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/${width}-full.png`, fullPage: true });
await browser.close();
console.log(`shots in ${outDir}: ${sections.map((s) => s.id).join(', ')}`);
