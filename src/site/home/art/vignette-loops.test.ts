import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* The hero picture's loops run past 5s, so each one must run only while motion is allowed and must stop when the
   picture is off screen. Anything that plays once ends by 5s. */
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
/** [duration, delay] in seconds of each animation in a declaration that plays once. */
const once = (animation: string) => split(animation, ',').map(a => split(a, ' '))
  .filter(t => !t.includes('infinite') && !t.includes('none')).map(t => t.filter(isTime).map(seconds));

describe('The hero picture’s loops', () => {
  it('finds the loops it checks', () => {
    expect(animated.map(r => r.sel)).toEqual(expect.arrayContaining([
      '.vig__plate:not([data-motion="still"]) .vig__bird',
      '.vig__plate:not([data-motion="still"]) .vig__bird > svg',
      '.vig__plate:not([data-motion="still"]) .vig__sun',
      '.vig__plate:not([data-motion="still"]) .vig__halo',
      '.vig__plate:not([data-motion="still"]) .vig__glints',
    ]));
  });

  it('run forever only while motion is allowed', () => {
    expect(animated.filter(r => /\binfinite\b/.test(r.decls.get('animation')!) && !motionOn(r.sel)).map(r => r.sel)).toEqual([]);
    expect(all.filter(r => [...r.decls].some(([k, v]) => k.startsWith('animation') && /\binfinite\b/.test(v)) && !motionOn(r.sel))).toEqual([]);
  });

  it('pause off screen', () => {
    const pausing = all.filter(r => /^paused\b/.test(r.decls.get('animation-play-state') ?? '')).map(r => r.sel);
    expect(pausing).toContain('.vig__plate[data-motion="off"] *');
  });

  it('end by 5s when they play once, delays included', () => {
    expect(animated.flatMap(r => once(r.decls.get('animation')!)).filter(([dur = 0, delay = 0]) => delay + dur > 5)).toEqual([]);
    // Timing set apart from the shorthand would slip past the check above.
    expect(all.filter(r => r.decls.has('animation-duration') || r.decls.has('animation-delay')).map(r => r.sel)).toEqual([]);
  });

  it('draw in every part once, by 4.5s, with the glow ending last', () => {
    const drawIn = new Map(animated.filter(r => r.sel.includes('[data-drawn=""]'))
      .map(r => [r.sel.match(/vig__(\w+)$/)![1], once(r.decls.get('animation')!).map(([dur = 0, delay = 0]) => dur + delay)]));
    expect([...drawIn.keys()].sort()).toEqual(['bird', 'far', 'glints', 'halo', 'mid', 'near', 'ridges', 'sun', 'water']);
    const ends = [...drawIn.values()].flat();
    expect(ends).toHaveLength(9);
    expect(Math.max(...ends)).toBeLessThanOrEqual(4.5);
    // Vignette marks the plate done when the glow's fade ends, so nothing may still be drawing in after it.
    expect(drawIn.get('halo')).toEqual([Math.max(...ends)]);
  });

  it('do nothing with reduced motion', () => {
    expect(all.find(r => r.reduce && r.sel === '.vig__plate *')?.decls.get('animation')).toBe('none !important');
  });
});
