// With the Vite dev server running, render the existing model into the loader asset.
// Usage: node scripts/render-idle-porsche.mjs [http://localhost:3000]
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(new URL('/scripts/render-idle-porsche.html', process.argv[2] || 'http://localhost:3000').href);
  await page.waitForFunction(() => window.asset, undefined, { timeout: 60000 });
  const data = await page.evaluate(() => window.asset);
  const destination = new URL('../public/images/entrance/porsche-idle.webp', import.meta.url);
  await writeFile(destination, Buffer.from(data.split(',')[1], 'base64'));
  console.log(`Rendered ${destination.pathname}`);
} finally {
  await browser.close();
}
