// Draws the site's icons from public/favicon.svg: the browser tab icon (favicon.ico, 16 to 48 px, rounded like the
// svg) and the full-bleed squares a phone's home screen and the web manifest ask for (the phone rounds them itself).
// Run it after changing the svg: node scripts/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync('public/favicon.svg', 'utf8');
// The same dots on a square tile, for the places that round the corners themselves.
const square = svg.replace(/<rect([^>]*?) rx="[^"]*"/, '<rect$1');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
async function png(source, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${source.replace('<svg ', `<svg width="${size}" height="${size}" `)}`);
  return page.screenshot({ omitBackground: true, type: 'png' });
}
for (const [file, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) writeFileSync(`public/${file}`, await png(square, size));
// An .ico is a small directory of images; browsers read PNGs stored inside it.
const images = [];
for (const size of [16, 32, 48]) images.push([size, await png(svg, size)]);
const head = Buffer.alloc(6 + 16 * images.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
let offset = head.length;
images.forEach(([size, data], i) => {
  const at = 6 + 16 * i;
  head.writeUInt8(size, at); head.writeUInt8(size, at + 1); head.writeUInt8(0, at + 2); head.writeUInt8(0, at + 3);
  head.writeUInt16LE(1, at + 4); head.writeUInt16LE(32, at + 6); head.writeUInt32LE(data.length, at + 8); head.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
writeFileSync('public/favicon.ico', Buffer.concat([head, ...images.map(([, data]) => data)]));
await browser.close();
