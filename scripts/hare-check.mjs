import { chromium } from 'playwright';

const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);

// wake the trail head: just past the hero fold
await p.evaluate(() => window.scrollTo(0, 650));
await p.waitForTimeout(1100);
await p.screenshot({ path: `${out}/hare-0-head.png` });

// cross the work waypoint; catch the sprint mid-flight
await p.evaluate(() => window.scrollTo(0, 1000));
for (let i = 0; i < 5; i++) {
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${out}/hare-1-sprint-${i}.png` });
}
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/hare-2-rest.png` });

// fling to the end of the trail
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/hare-3-fling.png` });
await p.waitForTimeout(1400);
await p.screenshot({ path: `${out}/hare-4-flag.png` });

console.log(await p.evaluate(() => document.documentElement.scrollHeight));
await b.close();
