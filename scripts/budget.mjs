// node scripts/budget.mjs [dist]: gzip -9 sizes of the home page's files against the plan's budget (section 3.7).
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const entry = html.match(/<script type="module"[^>]*src="\/(assets\/index-[^"]+\.js)"/)?.[1];
if (!entry) throw new Error(`no module script for assets/index-*.js in ${dist}/index.html`);

const one = re => {
  const hits = readdirSync(join(dist, 'assets')).filter(f => re.test(f));
  if (hits.length !== 1) throw new Error(`expected one ${re} in ${dist}/assets, found ${hits.length}: ${hits.join(' ')}`);
  return `assets/${hits[0]}`;
};

// Sizes at commit e5e4afa, from the gzip command. zlib reads the same entry 150 bytes bigger, so that check runs strict.
const AT_E5E4AFA = { entry: 65200, html: 3152 };
const items = [
  [entry, AT_E5E4AFA.entry + 500],
  [one(/^Home-.*\.js$/), 12000],
  [one(/^Home-.*\.css$/), 10000],
  ['index.html', AT_E5E4AFA.html + 100],
];

const over = [];
for (const [file, limit] of items) {
  const size = gzipSync(readFileSync(join(dist, file)), { level: 9 }).length;
  console.log(`${size > limit ? 'OVER' : 'ok  '} ${file} ${size} / ${limit} bytes gz`);
  if (size > limit) over.push(file);
}
if (over.length) {
  console.error(`over budget: ${over.join(', ')}`);
  process.exit(1);
}
