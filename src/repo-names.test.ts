import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The employer, its clients and its vendors stay out of every file in the repo, and so do claims to be its only,
// sole or solo technical person. The site's own pages are checked in src/site/Home.test.tsx; this keeps notes,
// plans, drafts and other files that never reach the site from bringing the names back.
const BANNED = [
  /digital[\s_-]*directions/i, /\bDDi?\b/, /\bdd[- ]portal\b/i, /swyft/i, /hi\s?bob/i, /net\s?suite/i, /workato/i,
  /key\s?pay/i, /\bmyob\b/i, /employment\s+hero/i, /freshdesk/i, /\bdeputy\b/i,
  /\bonly integrations\b/i, /\bsole (integrations|developer|technical)/i, /\bsolo integrator\b/i,
  /\bone[- ]person (team|integrations)\b/i,
];

const root = path.resolve(__dirname, '..');
// The two files that hold the banned list itself.
const SKIP = new Set(['src/repo-names.test.ts', 'src/site/Home.test.tsx']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.vercel', '.codex', 'output']);

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  if (SKIP_DIRS.has(name)) return [];
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [path.relative(root, full)];
});

// Tracked files plus new ones git doesn't ignore, so a file is caught before it is committed. Without git, every file.
const files = (): string[] => {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
    return out.split('\0').filter(Boolean);
  } catch {
    return walk(root);
  }
};

describe('The repo', () => {
  it('names no employer, client or vendor and claims no sole role, in any text file', () => {
    const found: string[] = [];
    let read = 0;
    for (const file of files()) {
      if (SKIP.has(file)) continue;
      const full = path.join(root, file);
      if (!existsSync(full) || !statSync(full).isFile()) continue;
      const buf = readFileSync(full);
      if (buf.subarray(0, 8000).includes(0)) continue; // images, video, fonts
      read++;
      const text = buf.toString('utf8');
      for (const re of BANNED) {
        const m = text.match(re);
        if (m) found.push(`${file}: ${m[0]}`);
      }
    }
    expect(read).toBeGreaterThan(100);
    expect(found).toEqual([]);
  });
});
