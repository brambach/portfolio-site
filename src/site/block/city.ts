// @ts-nocheck: a drawing, not an API; every value here is a number in the drawing's own 460 by 800 units.
/* The block: a city street drawn like a scratchboard etching for the home page's side panel. Black ground, white
   lines, and more lines wherever there is more light, so the lamp, the shop and the lit windows light the brick around
   them. The still layers are drawn once to canvas (sky, far towers, near towers, the street) and redrawn only when the
   time, the season or the size changes; what moves lives in two SVG overlays on top (Home.tsx stacks them).
   Time of day follows the visitor's clock and the season follows the date (?time= and ?season= preview them).
   All original line art. */
const VW = 460, VH = 800, NS = 'http://www.w3.org/2000/svg';
const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- state ---------- */
const PH = { day: { win: .06, tow: .03, amb: .5 }, dusk: { win: .45, tow: .35, amb: .22 }, night: { win: .72, tow: .5, amb: .1 }, late: { win: .14, tow: .18, amb: .06 } };
const autoPhase = d => { const h = d.getHours(); return h >= 7 && h < 16 ? 'day' : h >= 16 && h < 18 ? 'dusk' : h >= 18 ? 'night' : 'late'; };
const autoSeason = d => {
  const m = d.getMonth() + 1, day = d.getDate(), md = m * 100 + day;
  if (md >= 1125 || md <= 106) return 'holiday';
  if (md <= 319) return 'winter';
  if (md <= 620) return 'spring';
  if (md <= 921) return 'summer';
  return 'fall';
};
const autoEve = d => (d.getMonth() === 11 && d.getDate() === 24 && d.getHours() >= 17) || (d.getMonth() === 11 && d.getDate() === 25 && d.getHours() < 5);
const st = { phase: 'night', season: 'holiday', eve: false, lit: false, pick: { phase: 'now', season: 'now' } };
const resolve = () => {
  const now = new Date();
  st.phase = st.pick.phase === 'now' ? autoPhase(now) : st.pick.phase === 'eve' ? 'night' : st.pick.phase;
  st.season = st.pick.season === 'now' ? autoSeason(now) : st.pick.season;
  st.eve = st.pick.phase === 'eve' || (st.pick.phase === 'now' && autoEve(now));
  if (st.eve) st.season = 'holiday';
};
const snowy = () => st.season === 'holiday' || st.season === 'winter';

/* ---------- seeded random ---------- */
let seed = 1;
const rs = n => { seed = n; };
const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------- geometry (shared by canvas and overlay) ---------- */
/* left to right: a brownstone, a five story walk-up with a fire escape and a corner shop, another brownstone */
const houses = [0, 1, 2].map(i => {
  const x0 = i * 156 - 6, w = 152, base = 704;
  if (i === 1) {
    const top = 356, wins = [];
    [376, 440, 504].forEach(y => [x0 + 16, x0 + 62, x0 + 108].forEach(x => wins.push({ x, y, w: 28, h: 44 })));
    return { i, kind: 'walkup', x0, w, top, base, wins };
  }
  const top = 420, door = x0 + 22, py = top + 172, dir = i === 0 ? -1 : 1;
  const wins = [];
  [top + 26, top + 96].forEach(y => [x0 + 18, x0 + 62, x0 + 106].forEach(x => wins.push({ x, y, w: 28, h: 48 })));
  [x0 + 62, x0 + 106].forEach(x => wins.push({ x, y: py + 6, w: 28, h: 44, parlor: true }));
  return { i, kind: 'brownstone', x0, w, top, base, door, py, dir, sx: door + (dir > 0 ? 30 : 0), wins };
});
const allWins = houses.flatMap(h => h.wins);
rs(5); allWins.forEach(w => { w.t = r(); });
const SPECIAL = { star: 21, cat: 4, pie: 14 };
const LAMP = { x: 122, y: 580 };
const TREES = [40, 440];
const SHOP = { x: 156, y: 586 };
rs(21);
const far = []; for (let x = -16; x < 480;) { const w = 18 + r() * 26, h = 120 + r() * 170; far.push({ x, w, top: 470 - h, t: [] }); x += w + 2 + r() * 4; }
const near = []; for (let x = -24; x < 484;) { const w = 40 + r() * 34, h = 70 + r() * 120; near.push({ x, w, top: 540 - h, tank: r() < .55 ? r() : -1 }); x += w + 3; }
const winLit = w => { const id = allWins.indexOf(w); if (id === SPECIAL.cat || id === SPECIAL.star || id === SPECIAL.pie) return true; return w.t < PH[st.phase].win; };

/* ---------- light ---------- */
let lights = [];
const buildLights = () => {
  lights = [];
  if (st.phase !== 'day') { lights.push({ x: LAMP.x, y: LAMP.y + 4, r: 62, s: .9 }); lights.push({ x: SHOP.x + 46, y: 660, r: 46, s: .85 }); }
  allWins.forEach(w => { if (winLit(w) && st.phase !== 'day') lights.push({ x: w.x + w.w / 2, y: w.y + w.h / 2, r: 30, s: .55 }); });
  if (st.lit && st.season === 'holiday') houses.forEach(h => { if (h.kind === 'walkup') return; for (let x = h.x0 + 6; x < h.x0 + h.w; x += 16) lights.push({ x, y: h.top + 12, r: 16, s: .35 }); });
};
const L = (x, y) => { let v = PH[st.phase].amb; for (const l of lights) { const dx = x - l.x, dy = y - l.y, d2 = dx * dx + dy * dy, R = l.r * l.r * 4.5; if (d2 < R) v += l.s * Math.exp(-d2 / (2 * l.r * l.r)); } return v > 1 ? 1 : v; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- drawing helpers ---------- */
const INK = '#f4f4f1', NIGHT = '#0a0a0a';
const B = 9;
function hatch(c, clip, bx, by, bw, bh, ang, sp, fn, lw = .5, col = INK) {
  c.save(); if (clip) c.clip(clip);
  const paths = Array.from({ length: B }, () => new Path2D());
  const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca, cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2 + 2, SEG = 3.2;
  for (let o = -R; o <= R; o += sp) {
    const ox = cx + nx * o, oy = cy + ny * o;
    for (let t = -R; t < R; t += SEG) {
      const x = ox + ca * t, y = oy + sa * t;
      if (x < bx - 4 || x > bx + bw + 4 || y < by - 4 || y > by + bh + 4) continue;
      const v = fn(x, y); if (v <= .04) continue;
      if (r() > .35 + v) continue; // broken lines where it is dark, like a burin lifting
      const b = Math.min(B - 1, Math.max(1, Math.round(v * (B - 1))));
      const j = () => (r() - .5) * .35;
      paths[b].moveTo(x + j(), y + j()); paths[b].lineTo(x + ca * SEG * .96 + j(), y + sa * SEG * .96 + j());
    }
  }
  c.strokeStyle = col; c.lineCap = 'round';
  paths.forEach((p, b) => { if (!b) return; c.globalAlpha = Math.min(1, .15 + b / (B - 1) * .9); c.lineWidth = lw * (.75 + b / (B - 1) * .5); c.stroke(p); });
  c.restore(); c.globalAlpha = 1;
}
const rect = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
function line(c, pts, lw = 1, a = 1, col = INK) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.globalAlpha = 1; }
function fillP(c, p, col) { c.fillStyle = col; c.fill(p); }
function lumps(x1, x2, y, k, h) { const p = new Path2D(); p.moveTo(x1, y + 2); const s = (x2 - x1) / k; for (let i = 0; i < k; i++) p.quadraticCurveTo(x1 + s * (i + .5), y - h * (.7 + r() * .6), x1 + s * (i + 1), y); p.lineTo(x2, y + 2); p.closePath(); return p; }

/* ---------- layers ---------- */
function drawSky(c) {
  rs(31);
  c.fillStyle = NIGHT; c.fillRect(-200, -600, VW + 400, VH + 600);
  const moon = { x: 96, y: 118 };
  const fn = {
    day: (x, y) => .6 + .32 * sstep(0, 470, y),
    dusk: (x, y) => .04 + .72 * sstep(200, 480, y) + .1 * Math.exp(-((x - 380) ** 2 + (y - 470) ** 2) / 20000),
    night: (x, y) => .55 * Math.exp(-((x - moon.x) ** 2 + (y - moon.y) ** 2) / (2 * 62 * 62)) + .16 * sstep(330, 480, y),
    late: (x, y) => .5 * Math.exp(-((x - moon.x) ** 2 + (y - moon.y) ** 2) / (2 * 58 * 58)) + .06 * sstep(360, 480, y),
  }[st.phase];
  hatch(c, null, -200, -600, VW + 400, 1090, -.52, 2.5, fn, .5);
  const nStars = { day: 0, dusk: 10, night: 46, late: 80 }[st.phase];
  for (let k = 0; k < nStars; k++) { const x = r() * VW, y = r() * 330 - 60; c.globalAlpha = .35 + r() * .6; c.fillStyle = INK; c.beginPath(); c.arc(x, y, .4 + r() * .8, 0, 6.3); c.fill(); if (r() < .12) { line(c, [[x - 3, y], [x + 3, y]], .5, .7); line(c, [[x, y - 3], [x, y + 3]], .5, .7); } }
  c.globalAlpha = 1;
  if (st.phase !== 'day') {
    const disk = new Path2D(); disk.arc(moon.x, moon.y, 24, 0, 6.3);
    hatch(c, disk, moon.x - 26, moon.y - 26, 52, 52, .7, 1.5, () => .9, .55);
    hatch(c, disk, moon.x - 26, moon.y - 26, 52, 52, -.7, 2.2, () => .55, .45);
    c.save(); c.clip(disk); c.fillStyle = NIGHT; c.beginPath(); c.arc(moon.x + 11, moon.y - 7, 22, 0, 6.3); c.fill(); c.restore();
    c.strokeStyle = INK; c.globalAlpha = .35; c.lineWidth = .6; c.stroke(disk); c.globalAlpha = 1;
  } else {
    const sun = new Path2D(); sun.arc(380, 300, 30, 0, 6.3);
    fillP(c, sun, NIGHT); hatch(c, sun, 348, 268, 64, 64, 0, 1.6, () => .95, .6);
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; line(c, [[380 + Math.cos(a) * 38, 300 + Math.sin(a) * 38], [380 + Math.cos(a) * 48, 300 + Math.sin(a) * 48]], .7, .6); }
  }
}
function tower(c, x, top, w, base, sp, winP, ww, wh, gx, gy, faceA) {
  const p = rect(x, top, w, base - top);
  fillP(c, p, NIGHT);
  hatch(c, p, x, top, w, base - top, Math.PI / 2, sp, (X, Y) => faceA * (X < x + w * .4 ? 1 : .45) * (1 - (Y - top) / (base - top) * .5), .45);
  c.strokeStyle = INK; c.globalAlpha = .55; c.lineWidth = .7; c.stroke(p); c.globalAlpha = 1;
  c.fillStyle = INK;
  for (let yy = top + 7; yy < base - 6; yy += gy) for (let xx = x + 3; xx < x + w - ww - 2; xx += gx) if (r() < winP) { c.globalAlpha = .55 + r() * .45; c.fillRect(xx, yy, ww, wh); }
  c.globalAlpha = 1;
}
function drawFar(c) {
  rs(41);
  const P = PH[st.phase], face = st.phase === 'day' ? .4 : st.phase === 'dusk' ? .22 : .1;
  far.forEach(t => tower(c, t.x, t.top, t.w, 470, 3.2, P.tow * .6, 2, 3, 5, 7, face));
  // the deco spire
  const parts = [[318, 246, 50, 224], [326, 206, 34, 40], [333, 176, 20, 30]];
  parts.forEach(([x, y, w, h]) => tower(c, x, y, w, y + h, 2.4, P.tow * .7, 2, 3, 5, 7, face * 1.3));
  const cap = new Path2D(); cap.moveTo(336, 176); cap.lineTo(343, 144); cap.lineTo(350, 176); cap.closePath();
  fillP(c, cap, NIGHT); hatch(c, cap, 334, 144, 18, 32, Math.PI / 2, 1.6, () => .7, .45);
  line(c, [[343, 144], [343, 108]], .9, .8);
  if (st.phase !== 'day') { c.fillStyle = INK; c.beginPath(); c.arc(343, 108, 1.4, 0, 6.3); c.fill(); }
}
function drawNear(c) {
  rs(51);
  const P = PH[st.phase], face = st.phase === 'day' ? .5 : st.phase === 'dusk' ? .28 : .14;
  near.forEach(t => {
    tower(c, t.x, t.top, t.w, 540, 2.6, P.tow, 3, 4, 7, 9, face);
    if (snowy()) { c.fillStyle = INK; c.globalAlpha = .9; c.fill(lumps(t.x - 1, t.x + t.w + 1, t.top + 1, 4, 3)); c.globalAlpha = 1; }
    if (t.tank >= 0) {
      const tx = t.x + 8 + t.tank * (t.w - 30), ty = t.top;
      line(c, [[tx + 2, ty], [tx + 4, ty - 10]], .8); line(c, [[tx + 14, ty], [tx + 12, ty - 10]], .8); line(c, [[tx + 3, ty - 5], [tx + 13, ty - 5]], .6);
      const tank = rect(tx, ty - 26, 16, 16); fillP(c, tank, NIGHT);
      hatch(c, tank, tx, ty - 26, 16, 16, Math.PI / 2, 1.5, X => .25 + face + (X < tx + 6 ? .3 : 0), .45);
      line(c, [[tx, ty - 21], [tx + 16, ty - 21]], .5, .8); line(c, [[tx, ty - 15], [tx + 16, ty - 15]], .5, .8);
      c.strokeStyle = INK; c.lineWidth = .8; c.strokeRect(tx, ty - 26, 16, 16);
      const roof = new Path2D(); roof.moveTo(tx - 1, ty - 26); roof.lineTo(tx + 8, ty - 35); roof.lineTo(tx + 17, ty - 26); roof.closePath();
      fillP(c, roof, NIGHT); hatch(c, roof, tx - 1, ty - 36, 18, 10, .3, 1.4, () => .6, .45); c.stroke(roof);
      if (snowy()) { c.fillStyle = INK; c.beginPath(); c.moveTo(tx + 2, ty - 28); c.lineTo(tx + 8, ty - 35); c.lineTo(tx + 14, ty - 28); c.quadraticCurveTo(tx + 8, ty - 30, tx + 2, ty - 28); c.fill(); }
    }
  });
}
function branch(c, x, y, a, len, d, tips) {
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  line(c, [[x, y], [x2, y2]], Math.max(.4, d * .55), .9);
  if (d <= 0) { tips.push([x2, y2]); return; }
  const n = d > 3 ? 2 : 2 + (r() < .4 ? 1 : 0);
  for (let k = 0; k < n; k++) branch(c, x2, y2, a + (r() - .5) * 1.1 + (k - (n - 1) / 2) * .5, len * (.68 + r() * .14), d - 1, tips);
}
const treeTips = [];
function drawWalkup(c, h, snow) {
  const x0 = h.x0, S = st.season;
  // heavier cornice with brackets
  for (let x = x0 + 4; x < x0 + h.w; x += 14) { const b = new Path2D(); b.moveTo(x, h.top); b.lineTo(x + 6, h.top); b.lineTo(x + 4, h.top + 9); b.lineTo(x + 2, h.top + 9); b.closePath(); fillP(c, b, NIGHT); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(b); }
  // belt course between shop and flats
  line(c, [[x0 - 2, 566], [x0 + h.w + 2, 566]], 2); line(c, [[x0, 570], [x0 + h.w, 570]], .7, .8);
  // the shop: sign band, striped awning, a lit window, a glass door
  const sign = rect(x0 + 6, 576, h.w - 12, 16); fillP(c, sign, INK);
  c.fillStyle = NIGHT; c.font = '600 8.5px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.fillText('COFFEE  ·  NEWS  ·  FLOWERS', x0 + h.w / 2, 587);
  const aw = [[x0 + 8, 594], [x0 + 96, 594], [x0 + 102, 610], [x0 + 2, 610]];
  for (let k = 0; k < 10; k++) { const t0 = k / 10, t1 = (k + 1) / 10; const p = new Path2D(); const lx = (a, b, t) => a + (b - a) * t;
    p.moveTo(lx(aw[0][0], aw[1][0], t0), 594); p.lineTo(lx(aw[0][0], aw[1][0], t1), 594); p.lineTo(lx(aw[3][0], aw[2][0], t1), 610); p.lineTo(lx(aw[3][0], aw[2][0], t0), 610); p.closePath();
    fillP(c, p, k % 2 ? NIGHT : INK); }
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); aw.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
  for (let x = x0 + 2; x < x0 + 102; x += 5) { c.beginPath(); c.arc(x + 2.5, 610, 2.5, 0, Math.PI); c.fillStyle = INK; c.fill(); }
  if (snow) { c.fillStyle = INK; c.fill(lumps(x0 + 6, x0 + 98, 594, 6, 3)); }
  const sw = rect(x0 + 10, 618, 84, 70);
  if (st.phase === 'day') { fillP(c, sw, NIGHT); hatch(c, sw, x0 + 10, 618, 84, 70, -.8, 2, () => .35, .4); }
  else {
    fillP(c, sw, INK);
    hatch(c, sw, x0 + 10, 618, 84, 70, 0, 2.2, (x, y) => Math.pow(Math.abs(x - x0 - 52) / 42, 2.2) * .4, .35, NIGHT);
    c.fillStyle = NIGHT;
    c.fillRect(x0 + 10, 664, 84, 3); c.fillRect(x0 + 10, 640, 84, 1.2); for (let x = x0 + 14; x < x0 + 92; x += 6) c.fillRect(x, 633 + (x % 3), 3.5, 7 - (x % 3));
    c.beginPath(); c.arc(x0 + 66, 650, 4, 0, 6.3); c.fill(); c.beginPath(); c.moveTo(x0 + 59, 664); c.quadraticCurveTo(x0 + 66, 652, x0 + 73, 664); c.fill(); // someone behind the counter
    for (let x = x0 + 20; x < x0 + 50; x += 7) { c.beginPath(); c.ellipse(x, 678, 3, 4, 0, 0, 6.3); c.fill(); } // buckets of flowers
    if (st.season === 'holiday') { for (let k = 0; k < 9; k++) { const x = x0 + 16 + k * 9.4, y = 622 + Math.sin(k) * 2 + (k % 2) * 3; c.beginPath(); c.arc(x, y, 1.4, 0, 6.3); c.fill(); } }
  }
  c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(sw); line(c, [[x0 + 52, 618], [x0 + 52, 688]], .8, 1, st.phase === 'day' ? INK : NIGHT);
  const kick = rect(x0 + 10, 688, 84, 16); fillP(c, kick, NIGHT); hatch(c, kick, x0 + 10, 688, 84, 16, 0, 1.8, (x, y) => .15 + L(x, y) * .6, .4); c.stroke(kick);
  const dr = rect(x0 + 102, 614, 28, 90); fillP(c, dr, NIGHT); hatch(c, dr, x0 + 102, 614, 28, 90, Math.PI / 2, 2, (x, y) => .15 + L(x, y) * .6, .4); c.stroke(dr);
  const dg = rect(x0 + 106, 620, 20, 44); fillP(c, dg, st.phase === 'day' ? NIGHT : INK); c.stroke(dg);
  if (st.season === 'holiday') { const wx = x0 + 116, wy = 638; c.save(); for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283; line(c, [[wx + Math.cos(a) * 4, wy + Math.sin(a) * 4], [wx + Math.cos(a + .5) * 8, wy + Math.sin(a + .5) * 8]], .9, 1, st.phase === 'day' ? INK : NIGHT); } c.restore(); }
  line(c, [[x0 + 136, 614], [x0 + 136, 704]], .8, .8); line(c, [[x0 + 146, 614], [x0 + 146, 704]], .8, .8);
  // the fire escape over the middle and right windows
  const a = x0 + 54, b = x0 + 142, floors = [376, 440, 504].map(y => y + 47);
  floors.forEach((py, f) => {
    const plat = rect(a, py, b - a, 3); fillP(c, plat, NIGHT); c.strokeStyle = INK; c.lineWidth = .9; c.stroke(plat);
    for (let x = a + 2; x < b; x += 3) line(c, [[x, py], [x, py + 3]], .4, .7);
    line(c, [[a, py - 13], [b, py - 13]], 1); line(c, [[a, py - 13], [a, py]], 1); line(c, [[b, py - 13], [b, py]], 1);
    for (let x = a + 4; x < b; x += 4) line(c, [[x, py - 13], [x, py]], .45, .75);
    line(c, [[a, py + 3], [a + 8, py + 12]], .7, .7); line(c, [[b, py + 3], [b - 8, py + 12]], .7, .7);
    if (snow) { c.fillStyle = INK; c.fillRect(a - 1, py - 1.6, b - a + 2, 1.8); c.fillRect(a - 1, py - 14.4, b - a + 2, 1.4); }
    const ny = floors[f + 1];
    if (ny) { const x1 = a + 46, x2 = a + 74; line(c, [[x1, py], [x2, ny]], 1); line(c, [[x1 + 6, py], [x2 + 6, ny]], 1); for (let t = .12; t < 1; t += .12) line(c, [[x1 + (x2 - x1) * t, py + (ny - py) * t], [x1 + 6 + (x2 - x1) * t, py + (ny - py) * t]], .6, .85); }
  });
  const ly = floors[2] + 3; line(c, [[a + 60, ly], [a + 60, ly + 26]], .9); line(c, [[a + 68, ly], [a + 68, ly + 26]], .9); for (let y = ly + 4; y < ly + 26; y += 4) line(c, [[a + 60, y], [a + 68, y]], .5, .85);
}
function drawFront(c) {
  rs(61);
  const S = st.season, snow = snowy();
  buildLights();
  // facades
  houses.forEach(h => {
    const p = rect(h.x0, h.top, h.w, h.base - h.top);
    fillP(c, p, NIGHT);
    hatch(c, p, h.x0, h.top, h.w, h.base - h.top, 0, 2.3, (x, y) => L(x, y) * .95, .5);
    // brick joints where it is light
    rs(70 + h.i);
    for (let y = h.top + 4; y < h.base; y += 4.6) for (let x = h.x0 + (y % 9.2 < 4.6 ? 3 : 7); x < h.x0 + h.w; x += 8) { const v = L(x, y); if (v > .3 && r() < v) line(c, [[x, y], [x, y + 2.3]], .35, v * .8); }
    c.strokeStyle = INK; c.lineWidth = 1.3; c.globalAlpha = .9; c.stroke(p); c.globalAlpha = 1;
    // cornice
    const cp = rect(h.x0 - 5, h.top - 12, h.w + 10, 12); fillP(c, cp, NIGHT);
    hatch(c, cp, h.x0 - 5, h.top - 12, h.w + 10, 12, Math.PI / 2, 1.5, (x, y) => .25 + L(x, y + 14) * .6, .45);
    line(c, [[h.x0 - 6, h.top - 12], [h.x0 + h.w + 6, h.top - 12]], 1.4); line(c, [[h.x0 - 5, h.top], [h.x0 + h.w + 5, h.top]], .9, .8);
    for (let x = h.x0; x < h.x0 + h.w; x += 7) line(c, [[x + 2, h.top], [x + 2, h.top + 4]], .7, .8);
    if (snow) { c.fillStyle = INK; c.fill(lumps(h.x0 - 7, h.x0 + h.w + 7, h.top - 12, 7, 5)); }
    // windows
    h.wins.forEach(w => {
      const id = allWins.indexOf(w), lit = winLit(w);
      line(c, [[w.x - 4, w.y - 6], [w.x + w.w + 4, w.y - 6]], 2.2);
      const wp = rect(w.x, w.y, w.w, w.h);
      if (lit) {
        fillP(c, wp, INK);
        // the room behind the glass: falloff toward the frame, then one thing in it
        c.save(); c.clip(wp); rs(90 + id);
        const cx = w.x + w.w / 2;
        hatch(c, wp, w.x, w.y, w.w, w.h, 0, 1.9, (x, y) => Math.pow(Math.abs(x - cx) / (w.w / 2), 2.4) * .5 + Math.pow(Math.max(0, (w.y + 8 - y) / 8), 2) * .3, .35, NIGHT);
        const kind = id === SPECIAL.star || id === SPECIAL.cat || id === SPECIAL.pie ? 9 : r();
        c.fillStyle = NIGHT;
        if (kind < .22) { for (let yy = w.y + 1.5; yy < w.y + w.h * (.3 + r() * .3); yy += 2) line(c, [[w.x, yy], [w.x + w.w, yy]], .55, .85, NIGHT); }
        else if (kind < .42) { const lx = w.x + 5 + r() * 6, ly = w.y + w.h - 3; c.beginPath(); c.moveTo(lx - 4, ly - 13); c.lineTo(lx + 4, ly - 13); c.lineTo(lx + 6, ly - 7); c.lineTo(lx - 6, ly - 7); c.closePath(); c.fill(); c.fillRect(lx - .6, ly - 7, 1.2, 5); c.fillRect(lx - 3, ly - 2, 6, 2); }
        else if (kind < .58) { const px = w.x + w.w - 8, py0 = w.y + w.h - 3; c.fillRect(px - 3, py0 - 5, 6, 5); for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(px + (r() - .5) * 8, py0 - 7 - r() * 9, 2.6, 1.2, r() * 3, 0, 6.3); c.fill(); } }
        else if (kind < .78) { hatch(c, wp, w.x, w.y, 5, w.h, Math.PI / 2, 1.6, () => .5, .35, NIGHT); hatch(c, wp, w.x + w.w - 5, w.y, 5, w.h, Math.PI / 2, 1.6, () => .5, .35, NIGHT); }
        c.restore();
        line(c, [[w.x + w.w / 2, w.y], [w.x + w.w / 2, w.y + w.h]], 1, 1, NIGHT); line(c, [[w.x, w.y + w.h / 2], [w.x + w.w, w.y + w.h / 2]], 1, 1, NIGHT);
      } else {
        fillP(c, wp, NIGHT);
        hatch(c, wp, w.x, w.y, w.w, w.h, -.8, 2.2, (x, y) => .1 + L(x, y) * .35, .4);
        line(c, [[w.x + w.w / 2, w.y], [w.x + w.w / 2, w.y + w.h]], .6, .7); line(c, [[w.x, w.y + w.h / 2], [w.x + w.w, w.y + w.h / 2]], .6, .7);
      }
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(w.x, w.y, w.w, w.h);
      line(c, [[w.x - 2, w.y + w.h + 1.5], [w.x + w.w + 2, w.y + w.h + 1.5]], 1.6);
      if (snow) { c.fillStyle = INK; c.fill(lumps(w.x - 4, w.x + w.w + 4, w.y - 7, 3, 3)); c.fill(lumps(w.x - 2, w.x + w.w + 2, w.y + w.h + 1, 3, 2.4)); }
      if (id === SPECIAL.pie && S === 'fall') { // a pie cooling on the sill
        const px = w.x + 4, py2 = w.y + w.h - 2;
        c.fillStyle = NIGHT; c.beginPath(); c.moveTo(px, py2 - 6); c.lineTo(px + 20, py2 - 6); c.lineTo(px + 17, py2); c.lineTo(px + 3, py2); c.closePath(); c.fill();
        line(c, [[px + 3, py2 - 6], [px + 17, py2 - 6]], .7, 1, INK);
      }
    });
    if (h.kind === 'walkup') { drawWalkup(c, h, snow); return; }
    // door, transom, wreath
    const dp = rect(h.door, h.py, 30, 640 - h.py); fillP(c, dp, NIGHT);
    hatch(c, dp, h.door, h.py, 30, 640 - h.py, Math.PI / 2, 2, (x, y) => .15 + L(x, y) * .7, .45);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(dp); line(c, [[h.door + 15, h.py], [h.door + 15, 640]], .7, .8);
    line(c, [[h.door - 4, h.py - 2], [h.door + 34, h.py - 2]], 2);
    if (st.phase !== 'day') { c.fillStyle = INK; c.fillRect(h.door + 2, h.py - 12, 26, 7); }
    if (S === 'holiday') {
      const wx = h.door + 15, wy = h.py + 24;
      for (let k = 0; k < 26; k++) { const a = k / 26 * 6.283; line(c, [[wx + Math.cos(a) * 5, wy + Math.sin(a) * 5], [wx + Math.cos(a + .5) * 10, wy + Math.sin(a + .5) * 10]], .9, .95); }
      line(c, [[wx - 4, wy + 9], [wx, wy + 7], [wx + 4, wy + 9]], 1); line(c, [[wx, wy + 7], [wx - 2, wy + 15]], .8); line(c, [[wx, wy + 7], [wx + 2, wy + 15]], .8);
    }
    // stoop
    for (let s = 0; s < 6; s++) {
      const yy = 640 + s * 10.6, xx = h.sx + h.dir * s * 9, xa = h.dir > 0 ? xx - 30 - s * 2 : xx + 30 + s * 2;
      const lo = Math.min(xa, xx), hi = Math.max(xa, xx);
      const riser = rect(lo, yy, hi - lo, 10.6); fillP(c, riser, NIGHT);
      hatch(c, riser, lo, yy, hi - lo, 10.6, 0, 1.8, (x, y) => .1 + L(x, y) * .75, .45);
      line(c, [[lo, yy], [hi, yy]], snow ? 2.6 : 1.3);
      if (S === 'fall' && h.i === 2 && (s === 1 || s === 3)) { // pumpkins on the steps
        const px = lo + 8 + s * 2, py2 = yy - 4;
        c.fillStyle = NIGHT; c.strokeStyle = INK; c.lineWidth = .9;
        c.beginPath(); c.ellipse(px, py2, 6, 4.2, 0, 0, 6.3); c.fill(); c.stroke();
        line(c, [[px, py2 - 4], [px, py2 + 4]], .6); line(c, [[px - 3, py2 - 3.6], [px - 3, py2 + 3.6]], .5, .7); line(c, [[px + 3, py2 - 3.6], [px + 3, py2 + 3.6]], .5, .7); line(c, [[px, py2 - 4], [px + 1.5, py2 - 7]], .9);
      }
    }
    line(c, [[h.sx, 624], [h.sx + h.dir * 54, 686], [h.sx + h.dir * 54, 704]], 1.5);
    line(c, [[h.sx, 624], [h.sx, 640]], 1.5);
    for (let k = 1; k < 6; k++) line(c, [[h.sx + h.dir * k * 9, 624 + k * 10.3], [h.sx + h.dir * k * 9, 636 + k * 10.3]], .7, .9);
    c.fillStyle = INK; c.beginPath(); c.arc(h.sx + h.dir * 54, 686, 2, 0, 6.3); c.fill();
  });
  // sidewalk and street
  if (snow) {
    c.fillStyle = INK; c.fillRect(-200, 704, VW + 400, 12);
    hatch(c, rect(-200, 704, VW + 400, 12), -200, 704, VW + 400, 12, 0, 2.6, (x) => .25 + (1 - L(x, 700)) * .3, .4, NIGHT);
  } else {
    const sw = rect(-200, 704, VW + 400, 12); fillP(c, sw, NIGHT);
    hatch(c, sw, -200, 704, VW + 400, 12, 0, 2, (x, y) => .2 + L(x, y) * .7, .45);
    for (let x = -200; x < VW + 200; x += 38) line(c, [[x, 704], [x - 3, 716]], .6, .7);
    if (S === 'fall') { rs(77); for (let k = 0; k < 60; k++) { c.fillStyle = INK; c.globalAlpha = .5 + r() * .5; c.beginPath(); c.ellipse(r() * VW, 705 + r() * 10, 1.6, .9, r() * 3, 0, 6.3); c.fill(); } c.globalAlpha = 1; }
  }
  line(c, [[-200, 704], [VW + 200, 704]], 1.3); line(c, [[-200, 716], [VW + 200, 716]], .9);
  const street = rect(-200, 716, VW + 400, 120); fillP(c, street, NIGHT);
  hatch(c, street, -200, 716, VW + 400, 120, Math.PI / 2, 2.2, (x, y) => (L(x, 690) - PH[st.phase].amb * .6) * (1 - (y - 716) / 70) * .9 + (st.phase === 'day' ? .2 : 0), .45);
  if (snow) { c.fillStyle = INK; c.fill(lumps(-200, VW + 200, 718, 30, 5)); }
  for (let x = -200; x < VW + 200; x += 26) line(c, [[x, 786], [x + 14, 786]], .7, .45);
  // street trees
  treeTips.length = 0;
  TREES.forEach((tx, k) => {
    rs(100 + k);
    const pit = rect(tx - 9, 704, 18, 4); fillP(c, pit, NIGHT); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(pit);
    const tips = [];
    line(c, [[tx, 704], [tx - 1, 650]], 2.6); line(c, [[tx - 1.5, 700], [tx - 2, 655]], .5, .6);
    branch(c, tx - 1, 650, -Math.PI / 2 - .1, 26, 5, tips);
    if (S === 'spring') tips.forEach(([x, y]) => { for (let q = 0; q < 9; q++) { c.fillStyle = INK; c.globalAlpha = .6 + r() * .4; c.beginPath(); c.arc(x + (r() - .5) * 12, y + (r() - .5) * 10, .6 + r() * 1.1, 0, 6.3); c.fill(); } });
    if (S === 'summer' || S === 'fall') tips.forEach(([x, y]) => { const n = S === 'summer' ? 14 : 5; for (let q = 0; q < n; q++) { const lx = x + (r() - .5) * 16, ly = y + (r() - .5) * 12; c.fillStyle = NIGHT; c.strokeStyle = INK; c.lineWidth = .6; c.globalAlpha = 1; c.beginPath(); c.ellipse(lx, ly, 2.6, 1.5, r() * 3, 0, 6.3); c.fill(); c.globalAlpha = .55 + L(lx, ly) * .45; c.stroke(); } });
    if (snow) tips.forEach(([x, y]) => { if (r() < .5) { c.fillStyle = INK; c.globalAlpha = .9; c.fillRect(x - 2, y - .6, 4, 1.2); } });
    c.globalAlpha = 1;
    treeTips.push(...tips);
  });
  // hydrant and a steam stack in the street
  { const hx = 306; c.fillStyle = NIGHT;
    const hb = rect(hx - 4, 688, 8, 16); fillP(c, hb, NIGHT); hatch(c, hb, hx - 4, 688, 8, 16, Math.PI / 2, 1.4, (x) => .3 + (x < hx ? .5 : 0) + L(x, 696) * .3, .4);
    c.strokeStyle = INK; c.lineWidth = .9; c.stroke(hb);
    c.beginPath(); c.arc(hx, 688, 4.5, Math.PI, 0); c.fill(); c.stroke(); line(c, [[hx - 7, 694], [hx + 7, 694]], 2.2); line(c, [[hx - 6, 703.5], [hx + 6, 703.5]], 1.6); line(c, [[hx, 682], [hx, 684]], 1.4);
    if (snowy()) { c.fillStyle = INK; c.beginPath(); c.ellipse(hx, 683.6, 4.6, 1.6, 0, 0, 6.3); c.fill(); } }
  { const sx = 250, sy = 776;
    for (let k = 0; k < 5; k++) { const y0 = sy - 30 + k * 6; const band = new Path2D(); const t0 = (y0 - (sy - 30)) / 30, t1 = (y0 + 6 - (sy - 30)) / 30; const w0 = 4 + t0 * 8, w1 = 4 + t1 * 8; band.moveTo(sx - w0, y0); band.lineTo(sx + w0, y0); band.lineTo(sx + w1, y0 + 6); band.lineTo(sx - w1, y0 + 6); band.closePath(); fillP(c, band, k % 2 ? NIGHT : INK); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(band); }
    line(c, [[sx - 16, sy], [sx + 16, sy]], 1.2); }
  // lamp
  line(c, [[LAMP.x + 24, 704], [LAMP.x + 24, 592]], 2.2); line(c, [[LAMP.x + 24, 592], [LAMP.x + 24, 584], [LAMP.x + 20, 574], [LAMP.x + 10, 572], [LAMP.x + 2, 576], [LAMP.x, 580]], 1.8);
  line(c, [[LAMP.x + 28, 704], [LAMP.x + 20, 704]], 3);
  const lant = new Path2D(); lant.moveTo(LAMP.x - 7, 580); lant.lineTo(LAMP.x + 7, 580); lant.lineTo(LAMP.x + 4, 594); lant.lineTo(LAMP.x - 4, 594); lant.closePath();
  fillP(c, lant, st.phase === 'day' ? NIGHT : INK); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(lant);
  if (snow) { c.fillStyle = INK; c.fillRect(LAMP.x - 8, 577, 16, 3); }
  // the tree stand
  if (S === 'holiday') {
    rs(111);
    line(c, [[66, 662], [138, 662]], .8, .9);
    for (let k = 0; k < 6; k++) {
      const x = 76 + k * 11, lean = (k - 2.5) * 2, top = 648 + (k % 2) * 5;
      const tp = new Path2D(); tp.moveTo(x + lean, top); tp.lineTo(x + 9, 704); tp.lineTo(x - 9, 704); tp.closePath();
      fillP(c, tp, NIGHT); hatch(c, tp, x - 10, top, 20, 704 - top, -.9, 1.7, (X, Y) => .2 + L(X, Y) * .6, .45); hatch(c, tp, x - 10, top, 20, 704 - top, .9, 2.6, (X, Y) => .1 + L(X, Y) * .4, .4);
      c.strokeStyle = INK; c.lineWidth = .9; c.stroke(tp);
    }
    const sg = rect(84, 624, 40, 15); fillP(c, sg, INK);
    c.fillStyle = NIGHT; c.font = '600 8px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.fillText('TREES', 104, 634.5);
    line(c, [[88, 639], [88, 662]], .8); line(c, [[120, 639], [120, 662]], .8);
  }
}

/* ---------- overlays (things that move) ---------- */
const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
function buildFrontOverlay(svg) {
  svg.innerHTML = '';
  const S = st.season, g = el('g', { fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  // hover glows on every window, used by the work list
  allWins.forEach((w, id) => el('rect', { id: 'bk-w' + id, class: 'whi', x: w.x, y: w.y, width: w.w, height: w.h, fill: INK, stroke: 'none' }, g));
  if (S === 'holiday') {
    houses.forEach(h => {
      const n = 11, y1 = h.top + 6, x1 = h.x0 + 2, x2 = h.x0 + h.w - 2, xm = h.x0 + h.w / 2;
      el('path', { d: `M${x1} ${y1} Q${xm} ${y1 + 16} ${x2} ${y1}`, 'stroke-width': .8 }, g);
      for (let k = 0; k < n; k++) { const t = (k + .5) / n, bx = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * xm + t * t * x2, by = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * (y1 + 16) + t * t * y1; el('circle', { class: 'bulb', cx: bx.toFixed(1), cy: (by + 3).toFixed(1), r: 2.3, 'stroke-width': .9 }, g); }
    });
    treeTips.forEach(([x, y], k) => { if (k % 2 === 0) el('circle', { class: 'fairy', cx: x.toFixed(1), cy: y.toFixed(1), r: 1.1, fill: INK, stroke: 'none', style: `animation-delay:${(k * .37) % 3}s` }, g); });
    // star on the tree in the window
    const w = allWins[SPECIAL.star], wx = w.x, wy = w.y;
    const sg = el('g', { class: 'starwin' }, g);
    el('path', { d: `M${wx + 18} ${wy + 14} L${wx + 26} ${wy + 46} L${wx + 10} ${wy + 46} Z`, fill: NIGHT, stroke: 'none' }, sg);
    const fig = el('g', { class: 'placer' }, sg);
    el('circle', { cx: wx + 6, cy: wy + 22, r: 3.2, fill: NIGHT, stroke: 'none' }, fig);
    el('path', { d: `M${wx + 3} ${wy + 48} L${wx + 4} ${wy + 27} Q${wx + 6} ${wy + 25} ${wx + 8} ${wy + 27} L${wx + 9} ${wy + 48} Z`, fill: NIGHT, stroke: 'none' }, fig);
    el('path', { class: 'arm', d: `M${wx + 8} ${wy + 29} L${wx + 15} ${wy + 18}`, stroke: NIGHT, 'stroke-width': 1.8 }, fig);
    el('path', { class: 'wstar', d: `M${wx + 18} ${wy + 9} l1.4 3 3.2 .3 -2.4 2.1 .8 3.1 -3 -1.7 -3 1.7 .8 -3.1 -2.4 -2.1 3.2 -.3 z`, fill: NIGHT, stroke: 'none' }, sg);
    // two people carrying a tree home
    const cp = el('g', { class: 'walk couple' }, g);
    person(cp, 0, 0); person(cp, 34, .5);
    el('path', { d: 'M-6 -16 L40 -14 L44 -22 Z', fill: NIGHT, 'stroke-width': .9 }, cp);
    for (let k = 0; k < 6; k++) el('path', { d: `M${2 + k * 6} -15 l3 -4`, 'stroke-width': .5 }, cp);
  }
  // a cat in the parlor window, tail going
  { const w = allWins[SPECIAL.cat], x = w.x + 6, y = w.y + w.h - 1;
    const cat = el('g', {}, g);
    el('path', { d: `M${x} ${y} Q${x - 1} ${y - 9} ${x + 3} ${y - 12} L${x + 2} ${y - 16} L${x + 5} ${y - 13.5} L${x + 7} ${y - 13.5} L${x + 9} ${y - 16} L${x + 9} ${y - 12} Q${x + 12} ${y - 8} ${x + 11} ${y} Z`, fill: NIGHT, stroke: 'none' }, cat);
    el('path', { class: 'tail', d: `M${x + 10} ${y - 1} Q${x + 17} ${y - 2} ${x + 16} ${y - 9}`, stroke: NIGHT, 'stroke-width': 1.6 }, cat); }
  if (S === 'fall') { const w = allWins[SPECIAL.pie]; el('path', { class: 'steam', d: `M${w.x + 10} ${w.y + w.h - 9} q-3 -5 0 -9 q3 -4 0 -9 M${w.x + 16} ${w.y + w.h - 9} q-3 -5 0 -9 q3 -4 0 -9`, stroke: NIGHT, 'stroke-width': .8 }, g); }
  // someone walking a dog the other way
  const dw = el('g', { class: 'walk dogwalk' }, g);
  person(dw, 0, .3, -1);
  el('path', { d: 'M-4 -12 Q-14 -6 -20 -5', 'stroke-width': .6 }, dw);
  const dog = el('g', { class: 'dog' }, dw);
  el('path', { d: 'M-34 -2 L-34 -7 Q-34 -10 -30 -10 L-23 -10 L-21 -14 L-19 -10 Q-18 -7 -20 -6 L-22 -6 L-22 -2', fill: NIGHT, 'stroke-width': .9 }, dog);
  el('path', { class: 'dleg', d: 'M-32 -2 v2 M-24 -2 v2', 'stroke-width': .9 }, dog);
  el('path', { d: 'M-34 -8 l-4 -3', 'stroke-width': .9, class: 'dtail' }, dog);
  // steam off the stack
  const stm = el('g', { class: 'stm' }, g);
  for (let k = 0; k < 5; k++) el('ellipse', { cx: 250, cy: 744, rx: 7, ry: 5, fill: INK, stroke: 'none', style: `animation-delay:${-k * 1.1}s` }, stm);
  // windows that come and go
  el('g', { class: 'life' }, g);
  // cab
  const cab = el('g', { class: 'cab' }, g);
  cab.innerHTML = `<path d="M98 744 L190 730 L190 764 Z" fill="${INK}" opacity=".09" stroke="none"/><g fill="${NIGHT}" stroke-width="1.3"><path d="M0 758 V742 Q2 736 10 735 L24 734 L34 722 H66 L78 734 L92 736 Q98 738 98 744 V758 Z"/><rect x="42" y="713" width="18" height="8" rx="1.5" fill="${INK}"/><path d="M38 724 H52 V734 H32 Z M56 724 H68 L74 734 H56 Z" stroke-width=".9"/><circle cx="22" cy="759" r="7"/><circle cx="78" cy="759" r="7"/><circle cx="22" cy="759" r="2.4"/><circle cx="78" cy="759" r="2.4"/><path d="M0 747 H98" stroke-width=".6" stroke-dasharray="3 2"/></g>`;
}
function person(g, x, delay, dir = 1) {
  const p = el('g', { transform: `translate(${x} 0)` }, g);
  const s = `animation-delay:${-delay}s`;
  el('rect', { class: 'leg', x: -1.6, y: -9, width: 1.4, height: 9, fill: INK, stroke: 'none', style: s }, p);
  el('rect', { class: 'leg b', x: .2, y: -9, width: 1.4, height: 9, fill: INK, stroke: 'none', style: s }, p);
  el('path', { d: 'M-4 -9 L-3 -20 Q0 -22 3 -20 L4 -9 Z', fill: NIGHT, 'stroke-width': .9 }, p);
  el('circle', { cx: 0, cy: -24, r: 3.2, fill: NIGHT, 'stroke-width': .9 }, p);
  if (snowy()) el('path', { d: 'M-3.4 -25.5 Q0 -31 3.4 -25.5 Z', fill: INK, stroke: 'none' }, p);
  el('path', { d: `M${2 * dir} -18 L${7 * dir} -14`, 'stroke-width': .9 }, p);
}
function buildSkyOverlay(svg) {
  svg.innerHTML = '';
  if (!st.eve) return;
  const g = el('g', { class: 'sleigh', fill: NIGHT, stroke: INK, 'stroke-width': .8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  for (let k = 0; k < 4; k++) { const x = k * 14; el('path', { d: `M${x} 0 Q${x + 4} -3 ${x + 8} 0 L${x + 9} -3 L${x + 11} -6 M${x + 9} -3 L${x + 12} -4 M${x + 1} 0 L${x} 3 M${x + 7} 0 L${x + 8} 3`, fill: 'none' }, g); }
  el('path', { d: 'M-6 -1 L-24 4', fill: 'none' }, g);
  el('path', { d: 'M-24 0 L-42 0 Q-44 6 -38 8 L-24 8 Q-20 6 -24 0 Z M-44 10 H-20 Q-17 10 -17 7' }, g);
  el('circle', { cx: -33, cy: -3, r: 3 }, g);
}

/* ---------- particles: snow, petals, fireflies, leaves ---------- */
function particles(canvas, far) {
  const c = canvas.getContext('2d');
  let W = 0, H = 0, raf = 0, items = [], kind = 'snow', wind = 0, windT = 0;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * d; canvas.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  const make = top => ({ x: Math.random() * W, y: top ? -10 : Math.random() * H, z: far ? .4 + Math.random() * .4 : .9 + Math.random() * .7, p: Math.random() * 6.28, a: Math.random() * 6.28 });
  const count = () => ({ snow: far ? 90 : 30, petals: far ? 14 : 10, leaves: far ? 10 : 8, fireflies: far ? 0 : 18, none: 0 })[kind];
  const tick = () => {
    c.clearRect(0, 0, W, H); wind += (windT - wind) * .03;
    c.fillStyle = INK; c.strokeStyle = INK;
    for (const f of items) {
      f.p += .012;
      if (kind === 'fireflies') { f.x += Math.sin(f.p * 1.3) * .25; f.y += Math.cos(f.p) * .15; c.globalAlpha = Math.max(0, Math.sin(f.p * 2.2 + f.a)) * .9; c.beginPath(); c.arc(f.x, f.y, 1.3, 0, 6.3); c.fill(); continue; }
      const fall = kind === 'snow' ? .5 : .35;
      f.y += fall * f.z * (far ? .7 : 1.4); f.x += Math.sin(f.p) * .3 + wind * f.z;
      if (f.y > H + 10) Object.assign(f, make(true)); if (f.x > W + 10) f.x = -10; if (f.x < -10) f.x = W + 10;
      c.globalAlpha = far ? .55 : .9;
      if (kind === 'snow') { c.beginPath(); c.arc(f.x, f.y, f.z * 1.3, 0, 6.3); c.fill(); }
      else { f.a += .02; c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.scale(1, Math.abs(Math.sin(f.a * 1.7)) + .2); c.beginPath(); c.ellipse(0, 0, (kind === 'leaves' ? 3.6 : 2.2) * f.z, (kind === 'leaves' ? 1.8 : 1.4) * f.z, 0, 0, 6.3); kind === 'leaves' ? c.stroke() : c.fill(); c.restore(); }
    }
    c.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  };
  return {
    set(k) {
      kind = k; size();
      items = kind === 'fireflies' ? Array.from({ length: count() }, () => ({ ...make(false), y: H * (.55 + Math.random() * .4) })) : Array.from({ length: count() }, () => make(false));
      cancelAnimationFrame(raf); raf = 0;
      if (reduce) { tick(); cancelAnimationFrame(raf); return; }
      if (items.length) raf = requestAnimationFrame(tick); else c.clearRect(0, 0, W, H);
    },
    stop() { cancelAnimationFrame(raf); raf = 0; c.clearRect(0, 0, W, H); },
    wind(v) { windT = v; },
  };
}

/* ---------- mount ---------- */
export type Block = { start(): void; stop(): void; scroll(p: number): void; highlight(i: number, on: boolean): void; destroy(): void };

/** Draws the block into `art` (which holds the canvases and overlays, see Home.tsx) and keeps it alive. */
export function mountBlock(art: HTMLElement): Block {
  const $ = (s: string) => art.querySelector(s) as any;
  const q = new URLSearchParams(location.search);
  if (q.get('time') && (PH as any)[q.get('time')!] || q.get('time') === 'eve') st.pick.phase = q.get('time')!;
  if (q.get('season') && ['holiday', 'winter', 'spring', 'summer', 'fall'].includes(q.get('season')!)) st.pick.season = q.get('season')!;
  const layers = { sky: $('.cv-sky'), far: $('.cv-far'), near: $('.cv-near'), front: $('.cv-front') };
  const ovSky = $('.ov-sky'), ovFront = $('.ov-front');
  [ovSky, ovFront].forEach(s => { s.setAttribute('viewBox', `0 0 ${VW} ${VH}`); s.setAttribute('preserveAspectRatio', 'xMidYMax slice'); });
  const pFar = particles($('.pt-far'), true), pNear = particles($('.pt-near'), false);
  const hi = new Set<number>();
  function paint() {
    const W = art.clientWidth, H = art.clientHeight; if (!W || !H) return;
    const d = Math.min(devicePixelRatio || 1, 3), s = Math.max(W / VW, H / VH), ox = (W - VW * s) / 2;
    const draw = { sky: drawSky, far: drawFar, near: drawNear, front: drawFront };
    for (const k in layers) {
      const cv = layers[k], Hc = cv.clientHeight || H, oy = Hc - VH * s; cv.width = Math.round(W * d); cv.height = Math.round(Hc * d);
      const c = cv.getContext('2d'); if (!c) continue;
      c.setTransform(d * s, 0, 0, d * s, d * ox, d * oy); c.clearRect(-VW, -VH, VW * 3, VH * 3);
      draw[k](c);
    }
    buildFrontOverlay(ovFront); buildSkyOverlay(ovSky);
    hi.forEach(id => ovFront.querySelector('#bk-w' + id)?.classList.add('hi'));
    art.dataset.phase = st.phase; art.dataset.season = st.season;
  }
  function setParticles() {
    const k = snowy() ? 'snow' : st.season === 'spring' ? 'petals' : st.season === 'fall' ? 'leaves' : st.season === 'summer' && st.phase !== 'day' ? 'fireflies' : 'none';
    pFar.set(k); pNear.set(k);
  }
  let running = false;
  const refresh = () => { resolve(); paint(); if (running) setParticles(); };
  const tap = () => { if (st.season !== 'holiday') return; st.lit = !st.lit; art.classList.toggle('lit', st.lit); paint(); };
  const move = (e: PointerEvent) => { const b = art.getBoundingClientRect(); const v = ((e.clientX - b.left) / b.width - .5) * 1.2; pFar.wind(v); pNear.wind(v * 1.6); };
  const leave = () => { pFar.wind(0); pNear.wind(0); };
  art.addEventListener('click', tap); art.addEventListener('pointermove', move); art.addEventListener('pointerleave', leave);
  let rz = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { paint(); if (running) setParticles(); }); });
  ro.observe(art);
  const clock = setInterval(() => { const before = st.phase + st.season + st.eve; resolve(); if (before !== st.phase + st.season + st.eve) refresh(); }, 60000);
  // now and then someone turns a light on or off
  const life = setInterval(() => {
    if (!running || reduce || st.phase === 'day' || document.hidden) return;
    const g = ovFront.querySelector('.life'); if (!g) return;
    const id = Math.floor(Math.random() * allWins.length); if (Object.values(SPECIAL).includes(id)) return;
    const w = allWins[id], on = !winLit(w);
    if (g.querySelector(`[data-id="${id}"]`)) return;
    const rr = el('rect', { x: w.x + .6, y: w.y + .6, width: w.w - 1.2, height: w.h - 1.2, fill: on ? INK : NIGHT, class: 'flip', 'data-id': id }, g);
    requestAnimationFrame(() => rr.classList.add('in'));
    setTimeout(() => { rr.classList.remove('in'); setTimeout(() => rr.remove(), 1400); }, 9000 + Math.random() * 9000);
  }, 2600);
  resolve();
  return {
    start() { running = true; refresh(); },
    stop() { running = false; pFar.stop(); pNear.stop(); },
    scroll(p) { art.style.setProperty('--p', p.toFixed(3)); },
    highlight(i, on) { if (on) hi.add(i); else hi.delete(i); ovFront.querySelector('#bk-w' + i)?.classList.toggle('hi', on); },
    destroy() { running = false; pFar.stop(); pNear.stop(); ro.disconnect(); clearInterval(clock); clearInterval(life); art.removeEventListener('click', tap); art.removeEventListener('pointermove', move); art.removeEventListener('pointerleave', leave); },
  };
}
