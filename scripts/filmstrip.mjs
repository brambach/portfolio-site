// A filmstrip of a page loading: what was on screen every 100 ms from navigation to 2.5 s, from Chromium's own
// screencast, laid out in a grid with the time under each frame.
// Usage: node scripts/filmstrip.mjs <url> <out.png> [width] [height] [--from <home url>]
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const fi = args.indexOf('--from'), from = fi < 0 ? null : args.splice(fi, 2)[1];
const [url, out, w = '393', h = '852'] = args;
const touch = Number(w) < 1000;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', (f) => { frames.push({ at: f.metadata.timestamp * 1000, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
if (from) {
  await page.goto(from, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const path = new URL(url).pathname, link = page.locator(`a.e-index__link[href="${path}"]`).first();
  await link.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: Number(w), maxHeight: Number(h) });
  await link.click();
  // On a touch screen the first tap opens the row, and its Open link leaves.
  await page.waitForTimeout(800);
  if (await page.locator('.e-index__row.is-open').count()) await page.locator(`a.e-open[href="${path}"]`).first().click();
  await page.waitForURL(url);
} else {
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: Number(w), maxHeight: Number(h) });
  await page.goto(url, { waitUntil: 'commit' });
}
await page.waitForTimeout(3000);
const origin = await page.evaluate(() => performance.timeOrigin);
await cdp.send('Page.stopScreencast');
// Lay the frames out in the page itself, so there's nothing to install.
const steps = Array.from({ length: 26 }, (_, i) => i * 100);
const picks = steps.map((t) => { const f = [...frames].reverse().find((x) => x.at - origin <= t); return f ? f.data : null; });
const sheet = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const png = await sheet.evaluate(async ({ picks, steps, w, h, title }) => {
  const cols = 7, scale = 0.42, fw = Math.round(w * scale), fh = Math.round(h * scale), gap = 10, label = 22;
  const rows = Math.ceil(picks.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * (fw + gap) + gap; c.height = 40 + rows * (fh + label + gap) + gap;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#222'; x.font = '15px -apple-system, sans-serif'; x.fillText(title, gap, 26);
  for (let i = 0; i < picks.length; i++) {
    const cx = gap + (i % cols) * (fw + gap), cy = 40 + Math.floor(i / cols) * (fh + label + gap);
    x.strokeStyle = '#ccc'; x.strokeRect(cx - 0.5, cy - 0.5, fw + 1, fh + 1);
    if (picks[i]) { const img = new Image(); img.src = `data:image/png;base64,${picks[i]}`; await img.decode(); x.drawImage(img, cx, cy, fw, fh); }
    else { x.fillStyle = '#eee'; x.fillRect(cx, cy, fw, fh); }
    x.fillStyle = '#222'; x.font = '13px ui-monospace, monospace'; x.fillText(`${steps[i]} ms`, cx, cy + fh + 16);
  }
  return c.toDataURL('image/png').split(',')[1];
}, { picks, steps, w: Number(w), h: Number(h), title: `${url}${from ? ' (opened from the home page)' : ''}, ${w}x${h}, every 100 ms from navigation` });
const { writeFileSync } = await import('node:fs');
writeFileSync(out, Buffer.from(png, 'base64'));
console.log(`${frames.length} frames, wrote ${out}`);
await browser.close();
