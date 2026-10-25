import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANNED, isBanned } from './banned-names';

// The employer, its clients and its vendors stay out of every file in the repo, file names included, and so do
// claims to be its only, sole or solo technical person. The site's own pages are checked in src/site/Home.test.tsx;
// this keeps notes, plans, drafts and other files that never reach the site from bringing the names back.
// The names are only ever built from pieces here, so this file never spells one out.
const j = (...parts: string[]) => parts.join('');

const root = path.resolve(__dirname, '..');
// The files that hold the banned list or its test cases.
const SKIP = new Set(['src/banned-names.ts', 'src/repo-names.test.ts']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.vercel', '.codex', '.claude',
  '.superpowers', '.worktrees', 'output']);
const SKIP_FILE = (name: string) => name.startsWith('.env') || name.endsWith('.log') || name === '.DS_Store';

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const full = path.join(dir, name);
  const stat = statSync(full, { throwIfNoEntry: false });
  if (!stat) return [];
  if (stat.isDirectory()) return SKIP_DIRS.has(name) ? [] : walk(full);
  return SKIP_FILE(name) ? [] : [path.relative(root, full).split(path.sep).join('/')];
});

// Tracked files plus new ones git doesn't ignore, so a file is caught before it is committed. Without git (a deploy
// build can run from a copy with no .git), every file outside the ignored folders.
const files = (): string[] => {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const list = out.split('\0').filter(Boolean);
    if (list.length) return list;
  } catch { /* no git here */ }
  return walk(root);
};

// Text as a person would read it, or null for binary files. UTF-16 files are full of zero bytes, so their byte
// order mark is checked before the binary test.
export const readText = (buf: Buffer): string | null => {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le');
  if (buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(buf.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  if (buf.subarray(0, 8000).includes(0)) return null; // images, video, fonts
  return buf.toString('utf8');
};

const findings = (text: string, where: string) => BANNED.flatMap(re => {
  const m = text.match(re);
  return m ? [`${where}: ${m[0]}`] : [];
});

describe('The banned names list', () => {
  const caught = [
    j('Digital ', 'Directions'), j('digital', 'directions', '.com'), j('digital-', 'directions'),
    j('the ', 'DD', ' portal'), j('keep ', 'DD', '-specific content out'), j('the ', 'DD', 'i concept'),
    j('dd', '-portal'), j('dd', 'portal'), j('dd', '_portal'), j('/Users/bryce/', 'dd', '/integration'),
    j('Swy', 'ftX'),
    j('Hi', 'Bob'), j('hi', '-bob'), j('hi', '_bob'), j('hi', ' bob'),
    j('Net', 'Suite'), j('net', '-suite'), j('net', '_suite'), j('a ', 'net', ' suite', ' sync'),
    j('Work', 'ato'),
    j('Key', 'Pay'), j('key', '-pay'), j('key', '_pay'),
    j('MY', 'OB'),
    j('Employment', ' Hero'), j('employment', 'hero', '.com'), j('Employment', 'Hero'), j('employment', '-hero'),
    j('Fresh', 'desk'), j('fresh', '-desk'),
    j('Dep', 'uty'), j('dep', 'uty integrations'), j('and ', 'Dep', 'uty, for payroll'), j('dep', 'utyhq'),
    j('its ', 'only', ' integrations', ' developer'), j('the ', 'only', ' integration', ' developer'),
    j('only', '\nintegrations'), j('the ', 'sole', ' integrations developer'), j('sole', ' technical', ' hire'),
    j('sole', ' engineer'), j('solo', ' developer'), j('solo', ' integrator'), j('a one-', 'person', ' team'),
    j('one ', 'person', ' integrations'),
  ];
  const passes = [
    'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'abc+DD/xyz==', 'keyPayload', 'apiKeyPayload', 'a key pay rise',
    j('dep', 'uty mayor'), j('Dep', 'uty Head of School'), j('inter', 'net suite'), j('cabi', 'net suite'),
    j('chi', 'bob'), '<dd>role</dd>', 'a fresh desk by the window', 'the only integration test',
    'a solo trip', 'one person owns a product from the api to the buttons', 'an operating system for exactly one person',
    'sole trader', 'only developers',
  ];
  it.each(caught)('catches %j', text => expect(isBanned(text)).toBe(true));
  it.each(passes)('lets %j through', text => expect(isBanned(text)).toBe(false));

  it('reads UTF-16 text, both byte orders, and skips binary', () => {
    const name = j('Hi', 'Bob');
    const le = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(name, 'utf16le')]);
    const be = Buffer.from(le); be.swap16();
    expect(readText(le)).toBe(name);
    expect(readText(be)).toBe(name);
    expect(readText(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0]))).toBeNull();
  });
});

describe('The repo', () => {
  it('names no employer, client or vendor and claims no sole role, in any file name or text file', () => {
    const found: string[] = [];
    let read = 0;
    for (const file of files()) {
      found.push(...findings(file, 'file name'));
      if (SKIP.has(file)) continue;
      const full = path.join(root, file);
      const stat = existsSync(full) ? statSync(full) : null;
      if (!stat?.isFile()) continue;
      const text = readText(readFileSync(full));
      if (text === null) continue;
      read++;
      found.push(...findings(text, file));
    }
    expect(read).toBeGreaterThan(100);
    expect(found).toEqual([]);
  });
});
