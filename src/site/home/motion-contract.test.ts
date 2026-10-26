import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* The home's motion contract, read from its two stylesheets: each looping animation is named here, runs only while
   motion is allowed and stops off screen and in a hidden tab. Everything else plays once, for under 5s, and rests on
   the finished print. */

const FILES = ['banknote.css', 'art/vignette.css'];
const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';
const WITH_LINEAR = '@supports (animation-timing-function: linear(0, 1))';
const MOVABLE = ['transform', 'translate', 'rotate', 'scale', 'opacity', 'stroke-dashoffset'];
const LOOPS = { 'sun breathe': ['vig-breathe'], 'water glints': ['vig-shimmer'], birds: ['vig-drift', 'vig-bob', 'vig-flap'] };
// The longhands a rule may set apart from the shorthand: neither changes how long a one-shot lasts or what repeats.
const LONGHANDS = ['animation-delay', 'animation-play-state'];
// --n is a row's units digit, so a wheel's clicks run longest at 9.
const VARS: Record<string, number> = { '--n': 9 };

type Rule = { file: string; sel: string; decls: Map<string, string>; at: string[] };
type Keyframes = { name: string; steps: { sel: string; decls: Map<string, string> }[] };
type Animation = { name: string; duration: string; iterations: number; fill: string; rule: Rule };

/** Splits at top-level separators, outside brackets and quotes. */
const split = (v: string, on: RegExp) => {
  const out: string[] = [];
  let depth = 0, quote = '', cur = '';
  for (const ch of v) {
    if (quote) quote = ch === quote ? '' : quote;
    else if (ch === '"' || ch === "'") quote = ch;
    else depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
    if (!quote && !depth && on.test(ch)) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  return [...out, cur.trim()].filter(Boolean);
};
const declarations = (body: string) => new Map(split(body, /;/).map(d => {
  const at = d.indexOf(':');
  return [d.slice(0, at).trim(), d.slice(at + 1).trim()] as [string, string];
}));

function parse(file: string, src: string, at: string[] = [], out = { rules: [] as Rule[], keyframes: [] as Keyframes[] }) {
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) break;
    const head = src.slice(i, open).trim().replace(/\s+/g, ' ');
    let depth = 1, j = open + 1;
    for (; depth; j++) depth += src[j] === '{' ? 1 : src[j] === '}' ? -1 : 0;
    const body = src.slice(open + 1, j - 1);
    if (head.startsWith('@media') || head.startsWith('@supports')) parse(file, body, [...at, head], out);
    else if (head.startsWith('@keyframes')) out.keyframes.push({ name: head.split(' ')[1], steps: parse(file, body).rules.map(({ sel, decls }) => ({ sel, decls })) });
    else if (!head.startsWith('@')) out.rules.push({ file, sel: head, decls: declarations(body), at });
    i = j;
  }
  return out;
}

const sheets = FILES.map(f => parse(f, readFileSync(new URL(f, import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;/g, '')));
const rules = sheets.flatMap(s => s.rules);
const keyframes = new Map(sheets.flatMap(s => s.keyframes).map(k => [k.name, k]));
const parts = (r: Rule) => split(r.sel, /,/);

const animations: Animation[] = rules.filter(r => r.decls.has('animation') && !r.at.includes(REDUCE)).flatMap(rule =>
  split(rule.decls.get('animation')!, /,/).map(a => {
    const tokens = split(a, /\s/);
    const name = tokens.filter(t => keyframes.has(t));
    if (name.length !== 1) throw new Error(`no single keyframes name in "${a}" (${rule.sel})`);
    const count = tokens.find(t => t === 'infinite' || /^\d*\.?\d+$/.test(t));
    return {
      name: name[0], rule, duration: tokens.find(t => /m?s\b/.test(t)) ?? '0s',
      iterations: count === 'infinite' ? Infinity : Number(count ?? 1),
      fill: tokens.find(t => ['none', 'forwards', 'backwards', 'both'].includes(t)) ?? 'none',
    };
  }));
const loops = animations.filter(a => a.iterations === Infinity);
const oneShots = animations.filter(a => a.iterations !== Infinity);

/** A CSS time in seconds, with each custom property at its largest. */
const seconds = (v: string) => {
  const s = v.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    if (!(name in VARS)) throw new Error(`no value for ${name} in ${v}`);
    return String(VARS[name]);
  }).replace(/calc/g, '').replace(/(\d*\.?\d+)ms\b/g, '($1/1000)').replace(/(\d*\.?\d+)s\b/g, '($1)');
  if (!/^[\d.\s+\-*/()]+$/.test(s)) throw new Error(`can't read a time from ${v}`);
  return Function(`return (${s})`)() as number;
};

describe('The home’s motion contract', () => {
  it('finds the rules it checks in both stylesheets', () => {
    for (const file of FILES) expect(rules.filter(r => r.file === file && r.decls.has('animation')).length, file).toBeGreaterThan(0);
    expect([...new Set(loops.map(a => a.name))].sort()).toEqual(Object.values(LOOPS).flat().sort());
    expect(new Set(oneShots.map(a => a.name))).toEqual(new Set(['vig-roll', 'vig-unroll', 'vig-rise', 'bn-click']));
    expect(rules.filter(r => r.at.includes(REDUCE)).length).toBeGreaterThan(0);
  });

  it('lets its keyframes set only transform, translate, rotate, scale, opacity and stroke-dashoffset', () => {
    expect(keyframes.size).toBeGreaterThan(0);
    const moved = [...keyframes.values()].flatMap(k => k.steps.flatMap(s => [...s.decls.keys()].map(p => `${k.name}: ${p}`)));
    expect(moved.filter(m => !MOVABLE.includes(m.split(': ')[1]))).toEqual([]);
  });

  it('repeats only the sun’s breath, the water’s glints and the birds, and only while motion is allowed', () => {
    const allowed = Object.values(LOOPS).flat();
    expect(loops.map(a => a.name).filter(n => !allowed.includes(n))).toEqual([]);
    expect(loops.flatMap(a => parts(a.rule)).filter(s => !s.includes('[data-motion]:not([data-motion="still"])'))).toEqual([]);
    expect(rules.filter(r => [...r.decls].some(([k, v]) => k.startsWith('animation') && /\binfinite\b/.test(v)) && !loops.some(a => a.rule === r))).toEqual([]);
  });

  it('pauses every loop off screen and in a hidden tab, where watch() sets data-motion="off"', () => {
    const pause = rules.filter(r => r.decls.get('animation-play-state') === 'paused !important' && r.at.includes(NO_PREFERENCE));
    expect(pause.map(r => r.sel)).toEqual(['.bn [data-motion="off"] *']);
    // Each loop sits inside a watched block on the page, so the pause above reaches it.
    expect(loops.flatMap(a => parts(a.rule)).filter(s => !/^\.bn \[data-motion\]\S* \S/.test(s))).toEqual([]);
  });

  it('plays each one-shot for under 5s, counted as duration times iteration count, delay apart', () => {
    expect(oneShots.map(a => ({ name: a.name, s: seconds(a.duration) * a.iterations })).filter(a => !(a.s > 0 && a.s < 5))).toEqual([]);
    // Timing set apart from the shorthand would slip past the check above.
    expect(rules.flatMap(r => [...r.decls.keys()].filter(k => k.startsWith('animation-') && !LONGHANDS.includes(k)).map(k => `${r.sel} { ${k} }`))).toEqual([]);
  });

  it('holds each one-shot at its start until its block is seen, and rests on the finished print', () => {
    expect(oneShots.flatMap(a => parts(a.rule)).filter(s => !/^\.bn\S* \[data-motion\]\S*:not\(\[data-seen="done"\]\)/.test(s))).toEqual([]);
    expect(oneShots.filter(a => a.fill !== 'backwards').map(a => a.name)).toEqual([]);
    // Only a from step, so the element's own style is where it ends.
    expect(oneShots.filter(a => keyframes.get(a.name)!.steps.some(s => !['from', '0%'].includes(s.sel))).map(a => a.name)).toEqual([]);
  });

  it('moves only when the visitor has no preference against motion, and reduced motion turns every animation off', () => {
    const moving = rules.filter(r => [...r.decls.keys()].some(k => k.startsWith('animation')) && !r.at.includes(REDUCE));
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.filter(r => !r.at.includes(NO_PREFERENCE)).map(r => r.sel)).toEqual([]);
    const off = rules.filter(r => r.at.includes(REDUCE));
    expect(off.map(r => [r.sel, [...r.decls]])).toEqual([['.bn *', [['animation', 'none !important']]]]);
  });

  it('shows the numbering wheel only where the browser can run its clicks', () => {
    const shown = rules.filter(r => /\.wheel$/.test(r.sel) && r.decls.get('display') !== 'none');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter(r => !r.at.includes(WITH_LINEAR)).map(r => r.sel)).toEqual([]);
    expect(rules.find(r => r.sel === '.bn .wheel' && !r.at.length)?.decls.get('display')).toBe('none');
  });

  it('never moves box-shadow or uses --ease-signature in a transition or animation', () => {
    const timed = [
      ...rules.flatMap(r => [...r.decls].filter(([k]) => /^(transition|animation)/.test(k)).map(([k, v]) => `${r.sel} { ${k}: ${v} }`)),
      ...[...keyframes.values()].flatMap(k => k.steps.flatMap(s => [...s.decls].map(([p, v]) => `@keyframes ${k.name} { ${p}: ${v} }`))),
    ];
    expect(timed.length).toBeGreaterThan(0);
    expect(timed.filter(t => /box-shadow|--ease-signature/.test(t))).toEqual([]);
  });
});
