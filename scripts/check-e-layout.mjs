// The site's layout at the sizes it gets used at: nothing wider than the screen, the tagline clear of the line
// beside it, the dots' pictures clear of the words, every link at least 44 px to tap, labels big enough to read on a
// phone, project notes wide enough to read, and the not-found page's headline on the first screen.
// Usage: node scripts/check-e-layout.mjs <base url> [chromium|webkit] [WxH ...] [--shots dir]
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const si = args.indexOf('--shots'), shots = si < 0 ? null : args.splice(si, 2)[1];
const [base, engine = 'chromium', ...sizes] = args;
const SIZES = sizes.length ? sizes : ['375x667', '393x852', '430x932', '667x375', '852x393', '932x430', '744x1133', '768x1024', '820x1180', '1024x768', '1180x820', '1440x900', '1920x1080', '5120x1440'];
if (shots) mkdirSync(shots, { recursive: true });
const browser = await (engine === 'webkit' ? webkit : chromium).launch();
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

// Where the dots are drawn: a screenshot with the words hidden, read back in the page, so it's what was painted.
async function artPixels(page) {
  await page.addStyleTag({ content: '.e-site main, .e-head, .e-peek, .e-cursor { visibility: hidden !important; }' }).then(h => h.evaluate(el => el.setAttribute('data-probe', '')));
  await page.waitForTimeout(80);
  const png = await page.screenshot();
  await page.evaluate(() => document.querySelectorAll('style[data-probe]').forEach(s => s.remove()));
  return png.toString('base64');
}
// Words and links that have something drawn on them, given that screenshot.
async function wordsUnderArt(page, b64) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, c.width, c.height).data, k = c.width / innerWidth;
    const paper = getComputedStyle(document.documentElement).backgroundColor.match(/\d+/g).map(Number);
    const art = (x, y) => { const o = (y * c.width + x) * 4; return Math.abs(px[o] - paper[0]) + Math.abs(px[o + 1] - paper[1]) + Math.abs(px[o + 2] - paper[2]) > 60; };
    const hits = [];
    const walker = document.createTreeWalker(document.querySelector('.e-site'), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      // The header sits on its own paper over the dots, so whatever passes under it is covered, like the words are.
      if (!n.textContent.trim() || el.closest('.e-sr, .e-cursor, .e-peek, .e-head')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
      // Clipped away (a closed row on the index), so not on screen at all.
      const clips = [];
      for (let a = el.parentElement; a; a = a.parentElement) if (getComputedStyle(a).overflow !== 'visible' && a !== document.documentElement && a !== document.body) clips.push(a.getBoundingClientRect());
      const r = document.createRange(); r.selectNodeContents(n);
      for (const raw of r.getClientRects()) {
        const b = { left: raw.left, right: raw.right, top: raw.top, bottom: raw.bottom, width: raw.width };
        for (const c of clips) { b.left = Math.max(b.left, c.left); b.right = Math.min(b.right, c.right); b.top = Math.max(b.top, c.top); b.bottom = Math.min(b.bottom, c.bottom); }
        b.width = b.right - b.left;
        if (b.bottom - b.top < 2) continue;
        if (b.bottom < 0 || b.top > innerHeight || b.width < 1) continue;
        let count = 0;
        for (let y = Math.max(0, Math.floor(b.top * k)); y < Math.min(c.height, b.bottom * k); y += 2)
          for (let x = Math.max(0, Math.floor(b.left * k)); x < Math.min(c.width, b.right * k); x += 2) if (art(x, y)) count++;
        if (count > 12) hits.push(`"${n.textContent.trim().slice(0, 40)}" (${count})`);
      }
    }
    return hits;
  }, b64);
}

async function settle(page, ms = 2600) { await page.waitForTimeout(ms); }
async function scrollTo(page, y) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(150); }

for (const size of SIZES) {
  const [w, h] = size.split('x').map(Number);
  const touch = w < 1000 || h < 500, phone = w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 2600 ? 1 : touch ? 3 : 2, hasTouch: touch, isMobile: touch && engine === 'chromium' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  console.log(`${engine} ${size}${touch ? ' touch' : ''}`);

  // ---- home ----
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await settle(page, 3400);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 0) fail(`home is ${over}px wider than the screen`);
  const hero = await page.evaluate(() => {
    const sub = document.querySelector('.e-hero__sub').getBoundingClientRect();
    const lines = [...document.querySelectorAll('.e-tag__l')].map(l => { const r = document.createRange(); r.selectNodeContents(l); const b = [...r.getClientRects()]; return { left: Math.min(...b.map(x => x.left)), right: Math.max(...b.map(x => x.right)), top: Math.min(...b.map(x => x.top)), bottom: Math.max(...b.map(x => x.bottom)) }; });
    const hit = lines.map((l, i) => (l.right > sub.left && l.left < sub.right && l.bottom > sub.top && l.top < sub.bottom ? i + 1 : 0)).filter(Boolean);
    return { hit, sub: { top: Math.round(sub.top), bottom: Math.round(sub.bottom) }, tag: Math.round(lines[2].bottom), font: getComputedStyle(document.querySelector('.e-tag')).fontSize };
  });
  console.log(`  hero: tagline ${hero.font}, ends at ${hero.tag}px; line under it ${hero.sub.top} to ${hero.sub.bottom}px of ${h}`);
  if (hero.hit.length) fail(`tagline line ${hero.hit.join(', ')} runs through the line under it`);
  if (hero.sub.bottom > h) fail(`the line under the tagline is below the first screen`);
  let under = await wordsUnderArt(page, await artPixels(page));
  if (shots) await page.screenshot({ path: `${shots}/${engine}-${size}-home.png` });
  if (under.length) fail(`the plane is drawn over ${under.join(', ')}`);

  // Proof notes: how wide the note beside each project's name gets.
  const notes = await page.evaluate(() => [...document.querySelectorAll('.e-proof__note')].map(n => Math.round(n.getBoundingClientRect().width)));
  const narrowest = Math.min(...notes);
  console.log(`  proof notes: narrowest ${narrowest}px`);
  if (narrowest < 220) fail(`a proof note is only ${narrowest}px wide`);

  // The hand at the foot: walk through the last part and check it's never drawn on the words.
  const foot = await page.evaluate(() => { const f = document.querySelector('[data-scene="contact"]'); return { top: f.getBoundingClientRect().top + scrollY, end: document.documentElement.scrollHeight - innerHeight }; });
  const stops = [];
  for (let y = Math.max(0, foot.top - h * 0.4); y < foot.end; y += h * 0.22) stops.push(Math.round(y));
  stops.push(foot.end);
  await scrollTo(page, stops[0]); await settle(page, 2200);
  for (const y of stops) {
    await scrollTo(page, y); await page.waitForTimeout(y === foot.end ? 2200 : 500);
    const hits = await wordsUnderArt(page, await artPixels(page));
    if (hits.length) fail(`at ${y}px, the hand is drawn over ${hits.join(', ')}`);
  }
  if (shots) await page.screenshot({ path: `${shots}/${engine}-${size}-home-end.png` });

  // Tap targets and label sizes, over the whole home page.
  const sizesAndTaps = async () => page.evaluate(async () => {
    const small = new Map(), taps = [];
    const walker = document.createTreeWalker(document.querySelector('.e-site'), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() || el.closest('.e-sr, .e-cursor, .e-peek')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || !el.getClientRects().length || el.closest('[hidden]')) continue;
      const fs = parseFloat(cs.fontSize);
      const key = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${fs}px`;
      small.set(key, Math.min(small.get(key) ?? 99, fs));
    }
    // Port's ring and its controls first, while the page is still at the top, where they're up.
    const all = [...document.querySelectorAll('.e-site a, .e-site button')];
    for (const a of [...all.filter(a => a.closest('.e-hold')), ...all.filter(a => !a.closest('.e-hold'))]) {
      if (!a.getClientRects().length || a.closest('.e-index__row:not(.is-open) .e-index__more') || a.closest('.e-index__more') && getComputedStyle(a.closest('.e-index__more')).display === 'none') continue;
      const ra = a.getBoundingClientRect();
      if (!ra.width) continue;
      if (!a.closest('.e-head, .e-hold')) { window.scrollTo(0, ra.top + scrollY - innerHeight / 2 + ra.height / 2); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
      const r = a.getBoundingClientRect(), cx = r.left + Math.min(r.width / 2, 12), cy = r.top + r.height / 2;
      const inside = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === a || a.contains(t)); };
      if (!inside(cx, cy) && !inside(r.left + r.width / 2, cy)) { taps.push(`${a.textContent.trim().slice(0, 30)}: covered`); continue; }
      const x0 = inside(cx, cy) ? cx : r.left + r.width / 2;
      let up = 0, down = 0, left = 0, right = 0;
      while (up < 60 && inside(x0, cy - up - 1)) up++;
      while (down < 60 && inside(x0, cy + down + 1)) down++;
      while (left < 400 && inside(x0 - left - 1, cy)) left++;
      while (right < 400 && inside(x0 + right + 1, cy)) right++;
      const hh = up + down + 1, ww = left + right + 1;
      if (hh < 44 || ww < 44) taps.push(`${(a.textContent.trim() || a.getAttribute('aria-label') || a.className).slice(0, 30)}: ${ww}x${hh}`);
    }
    return { small: [...small.entries()].filter(([, v]) => v < 12).map(([k]) => k), taps };
  });
  const homeChecks = await sizesAndTaps();
  if (homeChecks.taps.length) fail(`home tap targets under 44px: ${homeChecks.taps.join('; ')}`);
  const tooSmall = (list) => list.filter(k => parseFloat(k.split(' ').pop()) < (phone ? 11 : 10));
  if (tooSmall(homeChecks.small).length) fail(`home text under ${phone ? 11 : 10}px: ${tooSmall(homeChecks.small).join('; ')}`);
  console.log(`  home text under 12px: ${homeChecks.small.join('; ') || 'none'}`);

  // ---- a project page ----
  for (const id of ['dervo', 'port']) {
    await page.goto(`${base}/projects/${id}`, { waitUntil: 'load' });
    await settle(page, 3000);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 0) fail(`/projects/${id} is ${o}px wider than the screen`);
    if (shots && id === 'dervo') await page.screenshot({ path: `${shots}/${engine}-${size}-dervo.png` });
    const top = await wordsUnderArt(page, await artPixels(page));
    if (top.length) console.log(`  note: /projects/${id} top, dots under ${top.slice(0, 4).join(', ')}`);
    const c = await sizesAndTaps();
    if (c.taps.length) fail(`/projects/${id} tap targets under 44px: ${c.taps.join('; ')}`);
    if (tooSmall(c.small).length) fail(`/projects/${id} text under ${phone ? 11 : 10}px: ${tooSmall(c.small).join('; ')}`);
  }

  // ---- not found ----
  await page.goto(`${base}/nothing-here`, { waitUntil: 'load' });
  await settle(page, 1500);
  const nf = await page.evaluate(() => { const t = document.querySelector('.e-404__title').getBoundingClientRect(), l = document.querySelector('.e-404__ways').getBoundingClientRect(); return { title: Math.round(t.bottom), ways: Math.round(l.bottom), over: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  console.log(`  404: headline ends at ${nf.title}px, the links at ${nf.ways}px, of ${h}`);
  if (nf.title > h) fail('the 404 headline is below the first screen');
  if (nf.over > 0) fail(`404 is ${nf.over}px wider than the screen`);
  if (shots) await page.screenshot({ path: `${shots}/${engine}-${size}-404.png` });
  const nfc = await sizesAndTaps();
  if (nfc.taps.length) fail(`404 tap targets under 44px: ${nfc.taps.join('; ')}`);

  if (errors.length) fail(`page errors: ${errors.join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(failures ? `${failures} failed` : 'all clean');
process.exitCode = failures ? 1 : 0;
