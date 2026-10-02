// Builds the brambach/brambach profile repo into build/github-profile/ (git-ignored):
// README.md (copied from docs/github-profile.md), assets/banner-light.svg and
// assets/banner-dark.svg (the road banner, with the site's own fonts inlined so
// GitHub draws them), and assets/dervo.jpg (a fresh shot of trydervo.com).
// Run from the project root: node scripts/github-profile.mjs
// Then copy everything in build/github-profile/ over the profile repo.
import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'build', 'github-profile');
const assets = path.join(outDir, 'assets');
mkdirSync(assets, { recursive: true });
copyFileSync(path.join(root, 'docs/github-profile.md'), path.join(outDir, 'README.md'));

// SVGs shown through an <img> can't load web fonts, so they travel inside the file.
const font = (file) => readFileSync(path.join(root, 'node_modules', file)).toString('base64');
const DISPLAY = font('@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2');
const DISPLAY_ITALIC = font('@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2');
const MONO = font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2');

// Paper and night, from the road's tokens (simple.css) and the quiet page's green 911 (quiet.css).
const THEMES = {
  light: {
    paper: '#f4efe4', line: '#ddd5c4', ink: '#1f2a22', soft: '#5d6a60', green: '#2f5d3a',
    sky: '#e8c98f', hill: '#e7dfcd', road: '#2b322c', edge: '#c9bfa6', dash: '#e8d48a', puff: '#d9d5c8',
    beam: 0, night: false,
    car: { hi: '#3d7349', paint: '#2f5d3a', lo: '#24492d', glass: '#dfe6dc', crease: '#4b8a5c', seam: '#1f2a22', stripe: '#f4efe4', rim: '#f4efe4', spoke: '#2f5d3a', hub: '#1f2a22', tyre: '#161d18', arch: '#1f2a22', lamp: '#f4efe4', core: '#e8d48a', tail: '#d9683f', shadow: '#1f2a22' },
  },
  dark: {
    paper: '#0d1712', line: '#1f2d25', ink: '#f4efe4', soft: '#9aa79c', green: '#6fbf87',
    sky: '#efe6cf', hill: '#13211a', road: '#1b221d', edge: '#3a4a3f', dash: '#e8d48a', puff: '#3a4a3f',
    beam: 0.5, night: true,
    car: { hi: '#4aa56d', paint: '#2f8a54', lo: '#1f6b3f', glass: '#cfd8cc', crease: '#5fb07e', seam: '#0d1712', stripe: '#f4efe4', rim: '#e9e3d4', spoke: '#2f8a54', hub: '#0d1712', tyre: '#070b09', arch: '#0d1712', lamp: '#fff6d8', core: '#ffe9a8', tail: '#e0703f', shadow: '#000000' },
  },
};
const W = 1200, H = 320, ROAD = 258, DASH = 52;
const LABEL = 'Bryce Rambach. San Francisco, building Dervo.';

// The flat 911 from src/projects/FlatCar.tsx, facing right, in its 320 x 120 box.
const wheel = (c, cx) => `<g transform="translate(${cx} 90)">
      <circle r="20" fill="${c.tyre}"/>
      <g class="spin">
        <circle r="12.5" fill="${c.rim}"/>
        ${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a})" d="M-3 -2 L-2 -11 L2 -11 L3 -2 Z" fill="${c.spoke}"/>`).join('')}
        <circle r="3" fill="${c.hub}"/>
      </g>
    </g>`;

const car = (t) => {
  const c = t.car;
  return `<g transform="translate(860 183) scale(0.9)">
    ${t.beam ? `<polygon points="283,50 380,24 380,86" fill="url(#beam)" opacity="${t.beam}"/>` : ''}
    <ellipse cx="160" cy="108" rx="150" ry="8" fill="url(#shadow)"/>
    <circle class="puff" cx="2" cy="78" r="6" fill="${t.puff}"/>
    <circle class="puff puff--late" cx="2" cy="78" r="6" fill="${t.puff}"/>
    <g class="body">
      <path fill="url(#paint)" d="M24 90 C14 89 9 82 11 73 C13 64 22 57 36 51 C60 39 92 23 128 18 C150 15 170 16 184 22 C196 28 206 38 215 46 L238 50 C260 52 282 56 297 62 C306 66 310 74 308 82 C306 88 300 90 292 90 Z"/>
      <path fill="url(#paint)" d="M236 60 C244 44 276 42 292 58 Z"/>
      <path fill="url(#paint)" d="M34 52 L20 45 L44 42 Z"/>
      <path fill="none" stroke="${c.crease}" stroke-width="2" stroke-linecap="round" d="M44 46 C70 32 100 21 130 19 C152 17 170 18 182 24"/>
      <path fill="url(#glass)" d="M98 44 C120 30 146 23 170 23 C184 23 194 30 203 42 L203 44 Z"/>
      <path stroke="${c.lo}" stroke-width="5" d="M160 23 L158 45"/>
      <path fill="none" stroke="${c.seam}" stroke-opacity="0.35" stroke-width="1.2" d="M158 49 L156 82 M210 46 C214 60 214 74 210 84"/>
      <rect x="186" y="56" width="14" height="2.5" rx="1.25" fill="${c.seam}" fill-opacity="0.35"/>
      <path fill="url(#paint)" d="M204 41 C206 36 214 34 217 38 L214 42 Z"/>
      <ellipse cx="278" cy="52" rx="7" ry="6" transform="rotate(-18 278 52)" fill="${c.lamp}"/>
      <circle cx="279" cy="52" r="2.5" fill="${c.core}"/>
      <rect x="10" y="70" width="12" height="4" rx="2" fill="${c.tail}"/>
      <rect x="100" y="75" width="112" height="2" rx="1" fill="${c.stripe}" fill-opacity="0.6"/>
      <circle cx="72" cy="90" r="25" fill="${c.arch}"/>
      <circle cx="250" cy="90" r="25" fill="${c.arch}"/>
    </g>
    ${wheel(c, 72)}
    ${wheel(c, 250)}
  </g>`;
};

// A sun on paper; a crescent and a few stars at night.
const sky = (t) => t.night
  ? `<circle cx="1062" cy="96" r="30" fill="${t.sky}"/>
    <circle cx="1074" cy="88" r="26" fill="${t.paper}"/>
    ${[[640, 58], [722, 112], [905, 50], [982, 138], [1150, 66], [1128, 156]].map(([x, y], i) => `<circle class="star" style="animation-delay:${-i * 0.5}s" cx="${x}" cy="${y}" r="1.4" fill="${t.ink}"/>`).join('')}`
  : `<circle cx="1062" cy="100" r="52" fill="${t.sky}" opacity="0.25"/>
    <circle cx="1062" cy="100" r="36" fill="${t.sky}"/>`;

const banner = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}">
  <style>
    @font-face { font-family: "Display"; font-style: normal; font-weight: 100 900; src: url(data:font/woff2;base64,${DISPLAY}) format("woff2"); }
    @font-face { font-family: "Display"; font-style: italic; font-weight: 100 900; src: url(data:font/woff2;base64,${DISPLAY_ITALIC}) format("woff2"); }
    @font-face { font-family: "Mono"; src: url(data:font/woff2;base64,${MONO}) format("woff2"); }
    .name { font-family: "Display", Georgia, serif; font-size: 96px; font-weight: 640; letter-spacing: -2.4px; font-variation-settings: "opsz" 144, "SOFT" 100, "WONK" 1; fill: ${t.ink}; }
    .name .em { font-style: italic; font-weight: 380; fill: ${t.green}; }
    .label { font-family: "Mono", ui-monospace, Menlo, monospace; font-size: 16px; letter-spacing: 2.6px; fill: ${t.soft}; }
    .spin { transform-box: fill-box; transform-origin: center; animation: spin 0.9s linear infinite; }
    .body { animation: bob 1.3s ease-in-out infinite; }
    .dash { animation: road 0.42s linear infinite; }
    .speed { stroke-dasharray: 36 84; animation: streak 1.1s linear infinite; }
    .speed--2 { animation-delay: -0.4s; }
    .speed--3 { animation-delay: -0.75s; }
    .puff { opacity: 0; transform-box: fill-box; transform-origin: center; animation: puff 1.8s ease-out infinite; }
    .puff--late { animation-delay: -0.9s; }
    .dot { transform-box: fill-box; transform-origin: center; animation: dot 2.4s ease-in-out infinite; }
    .star { animation: twinkle 3s ease-in-out infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes bob { 50% { transform: translateY(-1.2px); } }
    @keyframes road { to { transform: translateX(-${DASH}px); } }
    @keyframes streak { to { stroke-dashoffset: 120; } }
    @keyframes puff { 0% { opacity: 0; transform: translateX(0) scale(0.5); } 25% { opacity: 0.85; } 100% { opacity: 0; transform: translateX(-40px) scale(1.6); } }
    @keyframes dot { 50% { opacity: 0.35; transform: scale(0.7); } }
    @keyframes twinkle { 50% { opacity: 0.25; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="20"/></clipPath>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.car.hi}"/><stop offset="0.55" stop-color="${t.car.paint}"/><stop offset="1" stop-color="${t.car.lo}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.car.glass}"/><stop offset="1" stop-color="${t.car.glass}"/>
    </linearGradient>
    <radialGradient id="shadow"><stop offset="0" stop-color="${t.car.shadow}" stop-opacity="0.3"/><stop offset="1" stop-color="${t.car.shadow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.car.core}"/><stop offset="1" stop-color="${t.car.core}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${t.paper}"/>
    ${sky(t)}
    <path d="M560 ${ROAD} C700 236 820 214 960 222 C1060 228 1130 206 1200 196 L1200 ${ROAD} Z" fill="${t.hill}"/>
    <text class="label" x="76" y="96">SAN FRANCISCO, CA</text>
    <text class="name" x="70" y="180">Bryce <tspan class="em">Rambach</tspan></text>
    <circle class="dot" cx="82" cy="224.5" r="5" fill="${t.green}"/>
    <text class="label" x="98" y="230">BUILDING DERVO</text>
    <rect y="${ROAD}" width="${W}" height="${H - ROAD}" fill="${t.road}"/>
    <rect y="${ROAD}" width="${W}" height="3" fill="${t.edge}"/>
    <g class="dash">
      ${Array.from({ length: Math.ceil(W / DASH) + 2 }, (_, i) => `<rect x="${i * DASH}" y="288" width="26" height="3" rx="1.5" fill="${t.dash}"/>`).join('')}
    </g>
    <g stroke="${t.ink}" stroke-opacity="0.28" stroke-width="2.5" stroke-linecap="round">
      <line class="speed" x1="772" y1="214" x2="848" y2="214"/>
      <line class="speed speed--2" x1="790" y1="232" x2="852" y2="232"/>
      <line class="speed speed--3" x1="760" y1="248" x2="846" y2="248"/>
    </g>
    ${car(t)}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="none" stroke="${t.line}"/>
</svg>
`;

for (const [name, theme] of Object.entries(THEMES)) {
  const svg = banner(theme);
  writeFileSync(path.join(assets, `banner-${name}.svg`), svg);
  console.log(`banner-${name}.svg`, Math.round(svg.length / 1024), 'KB');
}

// The Dervo picture is the live landing page, so it's never older than the site.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('https://trydervo.com', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3500); // the sunrise and the first catch-up settle
await page.screenshot({ path: path.join(assets, 'dervo.jpg'), type: 'jpeg', quality: 85 });
await browser.close();
console.log('dervo.jpg from trydervo.com');
console.log(`profile repo ready in ${path.relative(process.cwd(), outDir) || '.'}`);
