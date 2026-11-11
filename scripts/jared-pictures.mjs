// Draws the pictures on Jared's page and its row from scripts/jared-pictures.html: a thread and a setup by text,
// both redrawn with a made up business, since the real ones belong to real businesses. Needs Pillow for the JPEGs.
// Usage: node scripts/jared-pictures.mjs   (CHROME=/path/to/chrome to pick the browser)
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..'), tmp = mkdtempSync(join(tmpdir(), 'jared-'));
const VIEWS = {
  thread: [1600, 1125, 'public/projects/jared/thread.jpg'],
  card: [1600, 1000, 'public/projects/jared/card.jpg'],
  phone: [780, 1500, 'public/projects/jared/thread-phone.jpg'],
  text: [1600, 1000, 'public/projects/jared/text.jpg'],
  og: [1200, 630, 'public/og/jared.jpg'],
};
mkdirSync(join(root, 'public/projects/jared'), { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const [view, [width, height, out]] of Object.entries(VIEWS)) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`file://${here}/jared-pictures.html?view=${view}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const png = join(tmp, `${view}.png`);
  await page.screenshot({ path: png });
  await page.close();
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], quality=88, optimize=True, progressive=True)', png, join(root, out)]);
  console.log(out);
}
await browser.close();
