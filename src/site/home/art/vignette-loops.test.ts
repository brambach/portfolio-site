import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* WCAG 2.2.2 for the hero picture: its loops run past 5s, so each one must run only while motion is allowed and must
   stop when the picture is off screen or the visitor presses pause. Anything that plays once ends by 5s. */
const css = readFileSync(`${process.cwd()}/src/site/home/art/vignette.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

type Rule = { sel: string; decls: Map<string, string>; reduce: boolean };
/** Style rules with their declarations, noting which sit in the reduced-motion block. Keyframes are skipped. */
const rules = (src: string, reduce = false): Rule[] => {
  const out: Rule[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) break;
    const head = src.slice(i, open).trim();
    let depth = 1, j = open + 1;
    for (; depth; j++) depth += src[j] === '{' ? 1 : src[j] === '}' ? -1 : 0;
    const body = src.slice(open + 1, j - 1);
    if (head.startsWith('@media')) out.push(...rules(body, reduce || head.includes('prefers-reduced-motion: reduce')));
    else if (!head.startsWith('@')) out.push({
      sel: head, reduce,
      decls: new Map(body.split(';').map(d => d.split(/:(.*)/s).map(s => s.trim())).filter(([k, v]) => k && v).map(([k, v]) => [k, v] as [string, string])),
    });
    i = j;
  }
  return out;
};

/* --i is a bird's index; the last bird has the longest timings. */
const seconds = (v: string) => {
  const s = v.replace(/var\(--i\)/g, '2').replace(/calc/g, '').replace(/(-?\d*\.?\d+)ms\b/g, '($1/1000)').replace(/(-?\d*\.?\d+)s\b/g, '($1)');
  if (!/^[\d.\s+\-*/()]+$/.test(s)) throw new Error(`can't read a time from ${v}`);
  return Function(`return (${s})`)() as number;
};
const split = (v: string, on: string) => {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of v) {
    depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
    if (ch === on && !depth) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  return [...out, cur.trim()].filter(Boolean);
};
const isTime = (t: string) => /^(calc\(.*m?s\b.*\)|-?\d*\.?\d+m?s)$/.test(t);

const all = rules(css);
const animated = all.filter(r => !r.reduce && r.decls.has('animation'));
const motionOn = (sel: string) => split(sel, ',').every(s => s.includes(':not([data-motion="still"])'));

describe('The hero picture’s loops', () => {
  it('finds the bird loops it checks', () => {
    expect(animated.map(r => r.sel)).toEqual(expect.arrayContaining([
      '.vig__plate:not([data-motion="still"]) .vig__bird',
      '.vig__plate:not([data-motion="still"]) .vig__bird > svg',
    ]));
  });

  it('run forever only while motion is allowed', () => {
    expect(animated.filter(r => /\binfinite\b/.test(r.decls.get('animation')!) && !motionOn(r.sel)).map(r => r.sel)).toEqual([]);
    expect(all.filter(r => [...r.decls].some(([k, v]) => k.startsWith('animation') && /\binfinite\b/.test(v)) && !motionOn(r.sel))).toEqual([]);
  });

  it('pause off screen and when the visitor presses pause', () => {
    const pausing = all.filter(r => /^paused\b/.test(r.decls.get('animation-play-state') ?? '')).map(r => r.sel).join(',');
    expect(pausing).toContain('.vig__plate[data-motion="off"] *');
    expect(pausing).toContain('.vig__plate[data-motion="paused"] *');
  });

  it('end by 5s when they play once, delays included', () => {
    const once = animated.flatMap(r => split(r.decls.get('animation')!, ',').map(a => split(a, ' ')))
      .filter(t => !t.includes('infinite') && !t.includes('none'));
    expect(once.map(t => t.filter(isTime).map(seconds)).filter(([dur = 0, delay = 0]) => delay + dur > 5)).toEqual([]);
  });

  it('do nothing with reduced motion', () => {
    expect(all.find(r => r.reduce && r.sel === '.vig__plate *')?.decls.get('animation')).toBe('none !important');
  });
});
