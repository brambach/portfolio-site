import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOTS } from './copy';

/* WCAG 2.2.2: nothing on the home moves for more than 5s without stopping. Each loop plays a set number of times and
   rests on its last frame, and every animation's delay + duration x count ends by 5s. */
const read = (f: string) => readFileSync(`${process.cwd()}/src/site/home/${f}`, 'utf8');
const look = read('look-d.css');
const mock = read('scenes/dervo-mock.css');

type Rule = { sel: string; decls: Map<string, string> };
const rules = (css: string): Rule[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim(),
    decls: new Map(body.split(';').map(d => d.split(/:(.*)/s).map(s => s.trim())).filter(([k, v]) => k && v).map(([k, v]) => [k, v] as [string, string])),
  }));

/* Custom properties a timing can use. --i is a row's index, so take the last row's. */
const vars = (rs: Rule[]) => {
  const out = new Map<string, string>([['--i', String(BOTS.stations.length - 1)]]);
  for (const r of rs) for (const [k, v] of r.decls) if (k.startsWith('--') && !out.has(k)) out.set(k, v);
  return out;
};

const resolve = (v: string, env: Map<string, string>) => {
  let s = v;
  for (let n = 0; n < 10 && /var\(/.test(s); n++) s = s.replace(/var\((--[\w-]+)\)/g, (_, k) => `(${env.get(k) ?? 'NaN'})`);
  return s;
};
/* A token is a time if, with its custom properties filled in, it's a number of s or ms (or a calc() over them). */
const isTime = (t: string, env: Map<string, string>) => {
  const s = resolve(t, env);
  return /^-?\d*\.?\d+m?s$/.test(s) || (/^(calc)?\(/.test(s) && /\d(m?s)\b/.test(s) && /^[\d.\s+\-*/()calms]+$/.test(s));
};

/* Seconds for a time: 2s, 520ms, or a calc() over times, numbers and custom properties. */
const seconds = (v: string, env: Map<string, string>): number => {
  const s = resolve(v, env)
    .replace(/calc/g, '').replace(/(-?\d*\.?\d+)ms\b/g, '($1/1000)').replace(/(-?\d*\.?\d+)s\b/g, '($1)');
  if (!/^[\d.\s+\-*/()]+$/.test(s)) throw new Error(`can't read a time from ${v}`);
  return Function(`return (${s})`)() as number;
};

/* Split on commas and spaces that aren't inside parentheses. */
const split = (v: string, on: string) => {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === on && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  return [...out, cur.trim()].filter(Boolean);
};

type Timing = { duration: number; delay: number; count: number };
const shorthand = (v: string, env: Map<string, string>): Timing[] =>
  v === 'none' ? [] : split(v, ',').map(one => {
    const tokens = split(one, ' ');
    const times = tokens.filter(t => isTime(t, env)).map(t => seconds(t, env));
    const count = tokens.find(t => t === 'infinite' || /^\d*\.?\d+$/.test(t));
    return { duration: times[0] ?? 0, delay: times[1] ?? 0, count: count === 'infinite' ? Infinity : Number(count ?? 1) };
  });

const classes = (sel: string) => new Set(sel.match(/\.[\w-]+/g) ?? []);

/** Every animation in a sheet, with when it stops: delay + duration x iteration count. */
const ends = (css: string) => {
  const rs = rules(css), env = vars(rs);
  const bases = rs.filter(r => r.decls.has('animation'));
  const out: { sel: string; end: number }[] = [];
  for (const r of rs) {
    const own = [...r.decls.keys()].filter(k => k.startsWith('animation'));
    if (!own.length) continue;
    // A rule that only sets a longhand (a delay, a name) builds on the shorthand of a rule its selector extends.
    const base = r.decls.get('animation')
      ?? bases.find(b => b !== r && [...classes(b.sel)].every(c => classes(r.sel).has(c)) && classes(b.sel).size)?.decls.get('animation');
    const ts = base ? shorthand(base, env) : [{ duration: 0, delay: 0, count: 1 }];
    for (const t of ts) {
      const dur = r.decls.get('animation-duration'), del = r.decls.get('animation-delay'), cnt = r.decls.get('animation-iteration-count');
      const duration = dur ? seconds(dur, env) : t.duration;
      const delay = del ? seconds(del, env) : t.delay;
      const count = cnt ? (cnt === 'infinite' ? Infinity : Number(cnt)) : t.count;
      out.push({ sel: r.sel, end: delay + duration * count });
    }
  }
  return out;
};

describe('The home’s loops', () => {
  const all = [...ends(look), ...ends(mock)];

  it('finds the animations it times', () => {
    expect(all.map(a => a.sel)).toEqual(expect.arrayContaining(['.vig__glints', '.vig__rise', '.bt__slip', '.bt__mark', '.dm__live']));
  });
  it('each stop by 5s, delays included', () => {
    expect(all.filter(a => !(a.end <= 5))).toEqual([]);
  });
  it('never run forever', () => {
    expect(look).not.toMatch(/\binfinite\b/);
    expect(mock).not.toMatch(/\binfinite\b/);
  });
  it('rest on their last frame', () => {
    expect(look).toMatch(/\.vig__glints \{ animation: vigd-breathe [^;]* 1 forwards; \}/);
    expect(look).toMatch(/\.bt__slip \{ animation: bt-hand [^;]* 1 forwards; \}/);
    expect(look).toMatch(/\.bt__mark \{ visibility: hidden; animation: bt-ink [^;]* 1 forwards; \}/);
    expect(mock).toMatch(/animation: dm-breathe 1\.2s ease-in-out 4 alternate forwards;/);
  });
  it('keep still for reduced motion', () => {
    expect(look).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.hero__in, \.vig__rise, \.vig__glints \{ animation: none; \}/);
    expect(mock).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.dm__live \{ animation: none; \}/);
    expect(mock).toMatch(/\.dv--still \.dm__live \{ animation: none; \}/);
    expect(look).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.bt :is\(\.bt__slip, \.bt__mark\)[^}]*animation: none; \}\s*\.bt \.bt__mark \{ visibility: visible; \}/);
  });
});
