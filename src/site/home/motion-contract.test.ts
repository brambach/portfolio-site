import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { must } from '../../test/helpers';

/* The home's motion contract, read from its two stylesheets: each looping animation is named here, runs only while
   motion is allowed and stops off screen and in a hidden tab. Everything else plays once, for under 5s, and rests on
   the finished print. */

const FILES = ['banknote.css', 'art/vignette.css'];
const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';
const WITH_LINEAR = '@supports (animation-timing-function: linear(0, 1))';
const WITH_MASK = '@supports (-webkit-mask-box-image: none)';
const HOVER = '@media (hover: hover) and (pointer: fine)';
// The look's two curves: entrances ease out, exits ease in and run faster.
const EASE_OUT = 'cubic-bezier(.2, .7, .2, 1)', EASE_IN = 'cubic-bezier(.4, 0, 1, 1)';
// The print's frame, while the row's name has keyboard focus.
const FOCUSED = '.bn .work:has(h3 a:focus-visible) .print__rule';
const MOVABLE = ['transform', 'translate', 'rotate', 'scale', 'opacity', 'stroke-dashoffset'];
const LOOPS = { 'sun breathe': ['vig-breathe'], 'water glints': ['vig-shimmer'], birds: ['vig-drift', 'vig-bob', 'vig-flap'], 'medallion turn': ['bn-turn'] };
// The longhands a rule may set apart from the shorthand: neither changes how long a one-shot lasts or what repeats.
const LONGHANDS = ['animation-delay', 'animation-play-state'];
// --n is a row's units digit, so a wheel's clicks run longest at 9.
const VARS: Record<string, number> = { '--n': 9 };

type Rule = { file: string; sel: string; decls: Map<string, string>; at: string[] };
type Keyframes = { name: string; steps: { sel: string; decls: Map<string, string> }[] };
type Animation = { name: string; duration: string; delay: string; easing?: string; iterations: number; fill: string; rule: Rule };
type Transition = { prop: string; duration: string; delay: string; easing: string; rule: Rule };

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
    const times = tokens.filter(t => /^-?\d*\.?\d+m?s$|^(calc|var)\(/.test(t));
    return {
      name: name[0], rule, duration: tokens.find(t => /m?s\b/.test(t)) ?? '0s', delay: times[1] ?? '0s',
      easing: tokens.find(t => /^(cubic-bezier\(|ease|linear|steps\()/.test(t)),
      iterations: count === 'infinite' ? Infinity : Number(count ?? 1),
      fill: tokens.find(t => ['none', 'forwards', 'backwards', 'both'].includes(t)) ?? 'none',
    };
  }));
const loops = animations.filter(a => a.iterations === Infinity);
const oneShots = animations.filter(a => a.iterations !== Infinity);

const transitions: Transition[] = rules.filter(r => r.decls.has('transition')).flatMap(rule =>
  split(rule.decls.get('transition')!, /,/).map(t => {
    const tokens = split(t, /\s/), times = tokens.filter(x => /^-?\d*\.?\d+m?s$/.test(x));
    return { prop: tokens[0], duration: times[0] ?? '0s', delay: times[1] ?? '0s', easing: tokens.find(x => /^(cubic-bezier\(|ease|linear|steps\()/.test(x)) ?? 'ease', rule };
  }));
/** Each transition as "property duration easing", once each, sorted. */
const timings = (ts: Transition[]) => [...new Set(ts.map(t => `${t.prop} ${t.duration} ${t.easing}`))].sort();

/** A CSS time in seconds, with each custom property at its largest unless given. */
const seconds = (v: string, vars = VARS) => {
  const s = v.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`no value for ${name} in ${v}`);
    return String(vars[name]);
  }).replace(/calc/g, '').replace(/(\d*\.?\d+)ms\b/g, '($1/1000)').replace(/(\d*\.?\d+)s\b/g, '($1)');
  if (!/^[\d.\s+\-*/()]+$/.test(s)) throw new Error(`can't read a time from ${v}`);
  return Function(`return (${s})`)() as number;
};

describe('The home’s motion contract', () => {
  it('finds the rules it checks in both stylesheets', () => {
    for (const file of FILES) expect(rules.filter(r => r.file === file && r.decls.has('animation')).length, file).toBeGreaterThan(0);
    expect([...new Set(loops.map(a => a.name))].sort()).toEqual(Object.values(LOOPS).flat().sort());
    expect(new Set(oneShots.map(a => a.name))).toEqual(new Set(['vig-roll', 'vig-unroll', 'vig-rise', 'bn-click', 'bn-ink', 'bn-pen', 'bn-foil']));
    expect(transitions.length).toBeGreaterThan(0);
    expect(rules.filter(r => r.at.includes(REDUCE)).length).toBeGreaterThan(0);
  });

  it('lets its keyframes set only transform, translate, rotate, scale, opacity and stroke-dashoffset', () => {
    expect(keyframes.size).toBeGreaterThan(0);
    const moved = [...keyframes.values()].flatMap(k => k.steps.flatMap(s => [...s.decls.keys()].map(p => `${k.name}: ${p}`)));
    expect(moved.filter(m => !MOVABLE.includes(m.split(': ')[1]))).toEqual([]);
  });

  it('repeats only the sun’s breath, the water’s glints, the birds and the medallion’s turn, and only while motion is allowed', () => {
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

  it('draws the medallion with a pen only off lite, so a lite page shows it drawn and only turning', () => {
    const pen = rules.filter(r => /\.medal\b/.test(r.sel) && (r.decls.get('animation')?.includes('bn-pen') || r.decls.has('animation-delay')));
    expect(pen.length).toBeGreaterThan(0);
    expect(pen.flatMap(parts).filter(s => !s.startsWith('.bn:not([data-mode="lite"]) '))).toEqual([]);
  });

  it('shows the numbering wheel only where the browser can run its clicks', () => {
    const shown = rules.filter(r => /\.wheel$/.test(r.sel) && r.decls.get('display') !== 'none');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter(r => !r.at.includes(WITH_LINEAR)).map(r => r.sel)).toEqual([]);
    expect(rules.find(r => r.sel === '.bn .wheel' && !r.at.length)?.decls.get('display')).toBe('none');
  });

  it('transitions only transform, translate, rotate, scale, opacity and stroke-dashoffset, and only when motion is allowed', () => {
    const moving = transitions.filter(t => t.prop !== 'none');
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.filter(t => !MOVABLE.includes(t.prop)).map(t => `${t.rule.sel} { ${t.prop} }`)).toEqual([]);
    expect(moving.filter(t => !t.rule.at.includes(NO_PREFERENCE)).map(t => t.rule.sel)).toEqual([]);
    // A longhand could slip a property past the list above.
    expect(rules.flatMap(r => [...r.decls.keys()].filter(k => k.startsWith('transition-')).map(k => `${r.sel} { ${k} }`))).toEqual([]);
  });

  it('sweeps the foil once a visit for 3.3s, 2.4s after the face is first seen and at once on the back, only where the border can mask it', () => {
    const foil = oneShots.filter(a => a.name === 'bn-foil');
    expect(foil.map(a => [a.duration, a.delay, a.easing, a.iterations])).toEqual([['3.3s', '2.4s', 'cubic-bezier(.45, 0, .3, 1)', 1]]);
    const back = rules.filter(r => /\.foil__band$/.test(r.sel) && r.decls.has('animation-delay'));
    expect(back.map(r => [r.sel.includes('.note--back'), r.decls.get('animation-delay'), r.at.includes(NO_PREFERENCE)])).toEqual([[true, '0s', true]]);
    // Unmasked, the band would light the whole note, so it shows only where the box mask works: not in Firefox.
    const shown = rules.filter(r => /\.foil$/.test(r.sel) && r.decls.has('display') && r.decls.get('display') !== 'none');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter(r => !r.at.includes(WITH_MASK) || !r.at.includes(NO_PREFERENCE)).map(r => r.sel)).toEqual([]);
    expect(rules.find(r => r.sel === '.bn .foil' && !r.at.length)?.decls.get('display')).toBe('none');
    // The back's plate keeps its own once-a-visit seen (the note's stays per load, for the pen), so a reload in the
    // same visit puts the back's foil away. It comes after the rule that shows it, at the same weight.
    const away = rules.filter(r => /\.foil$/.test(r.sel) && r.decls.get('display') === 'none' && r.at.length);
    expect(away.map(r => [r.sel, r.at])).toEqual([['.bn .note__plate[data-seen="done"] > .foil', [NO_PREFERENCE, WITH_MASK]]]);
    expect(rules.indexOf(away[0])).toBeGreaterThan(rules.indexOf(must(shown.at(-1), 'a rule that shows the foil')));
    expect(rules.filter(r => /\.foil$/.test(r.sel) && r.decls.has('-webkit-mask-box-image')).map(r => r.decls.get('-webkit-mask-box-image')))
      .toEqual(['var(--border-ink) 30 / var(--edge) round', 'var(--border-cream) 30 / var(--edge) round']);
  });

  it('inks a row’s rule in from the left as its last click lands, off lite and only where the wheel can click', () => {
    const [ink] = oneShots.filter(a => a.name === 'bn-ink'), [click] = oneShots.filter(a => a.name === 'bn-click');
    for (let n = 1; n <= 9; n++) {
      const vars = { '--n': n };
      expect(seconds(ink.delay, vars), `n = ${n}`).toBeCloseTo(seconds(click.delay, vars) + seconds(click.duration, vars), 6);
    }
    expect([ink.duration, ink.easing]).toEqual(['480ms', EASE_OUT]);
    expect(keyframes.get('bn-ink')!.steps.map(s => s.decls.get('transform'))).toEqual(['scaleX(0)']);
    expect(rules.find(r => r.sel === '.bn .micro--rule' && !r.at.length)?.decls.get('transform-origin')).toBe('left');
    expect(parts(ink.rule).filter(s => !s.startsWith('.bn:not([data-mode="lite"]) '))).toEqual([]);
    expect(ink.rule.at).toContain(WITH_LINEAR);
  });

  it('draws the print’s frame and lifts it on hover only for a pointer that hovers, and never draws the frame backwards', () => {
    // Rules whose subject is the print, its frame, its shadow or the screenshot's box, apart from the keyboard focus
    // rules below.
    const ofPrint = (sel: string) => /\.print(__frame|__rule|::before)$/.test(sel) && sel !== FOCUSED;
    const print = transitions.filter(t => ofPrint(t.rule.sel));
    expect(print.filter(t => !t.rule.at.includes(HOVER) || !t.rule.at.includes(NO_PREFERENCE)).map(t => t.rule.sel)).toEqual([]);
    const hovered = rules.filter(r => /:hover/.test(r.sel) && ofPrint(r.sel));
    expect(hovered.length).toBeGreaterThan(0);
    expect(hovered.filter(r => !r.at.includes(HOVER) || !r.at.includes(NO_PREFERENCE)).map(r => r.sel)).toEqual([]);
    expect(hovered.flatMap(r => [...r.decls].filter(([k]) => k !== 'transition').map(([k, v]) => `${k}: ${v}`)).sort())
      .toEqual(['opacity: 1', 'opacity: 1', 'stroke-dashoffset: 0', 'transform: translateY(-3px)', 'transform: translateY(-3px)']);
    const into = print.filter(t => t.rule.sel.includes(':hover')), out = print.filter(t => !t.rule.sel.includes(':hover'));
    expect(timings(into)).toEqual([`opacity 220ms ${EASE_OUT}`, `stroke-dashoffset 480ms ${EASE_OUT}`, `transform 220ms ${EASE_OUT}`]);
    // Out, the frame fades with the lift; its dash is reset only once it can't be seen.
    expect(timings(out.filter(t => t.prop !== 'stroke-dashoffset'))).toEqual([`opacity 140ms ${EASE_IN}`, `transform 140ms ${EASE_IN}`]);
    expect(out.filter(t => t.prop === 'stroke-dashoffset').map(t => [t.duration, t.delay])).toEqual([['0s', '140ms']]);
    // The lift is a shadow that fades in under the print, never a moving box-shadow.
    expect(rules.find(r => r.sel === '.bn .print::before' && !r.at.length)?.decls.get('box-shadow')).toBe('var(--lift)');
  });

  it('draws the print’s frame for the row’s name in keyboard focus, lifting it only for a pointer that hovers, and at once under reduced motion', () => {
    // A pointer that hovers takes focus into the hover rules, lift and all.
    const hovered = rules.filter(r => r.at.includes(HOVER) && /:hover/.test(r.sel));
    expect(hovered.length).toBeGreaterThan(0);
    expect(hovered.filter(r => !r.sel.startsWith('.bn .work:has(.print:hover, h3 a:hover, h3 a:focus-visible) ')).map(r => r.sel)).toEqual([]);
    // Without one, focus only draws the frame, never the lift or the shadow: under reduced motion it is there at once,
    // and where motion is allowed the pen draws it in.
    expect(rules.filter(r => r.sel === FOCUSED).map(r => [r.at, [...r.decls]])).toEqual([
      [[], [['opacity', '1'], ['stroke-dashoffset', '0']]],
      [[NO_PREFERENCE], [['opacity', '1'], ['stroke-dashoffset', '0'], ['transition', `stroke-dashoffset 480ms ${EASE_OUT}`]]],
    ]);
  });

  it('grows a link’s solid line from the left in 220ms and takes it back toward the right in 140ms, at once under reduced motion', () => {
    const line = transitions.filter(t => t.rule.sel.includes('a:not(.print)'));
    expect(timings(line.filter(t => /:hover/.test(t.rule.sel)))).toEqual([`transform 220ms ${EASE_OUT}`]);
    expect(timings(line.filter(t => !/:hover/.test(t.rule.sel)))).toEqual([`transform 140ms ${EASE_IN}`]);
    const rest = rules.find(r => r.sel === '.bn a:not(.print)::before' && !r.at.length)!;
    const on = rules.find(r => r.sel === '.bn a:not(.print):is(:hover, :focus-visible)::before' && !r.at.length)!;
    expect([rest.decls.get('transform'), rest.decls.get('transform-origin')]).toEqual(['scaleX(0)', 'right']);
    expect([on.decls.get('transform'), on.decls.get('transform-origin')]).toEqual(['none', 'left']);
  });

  it('raises the copy stamp from .92 in 220ms and fades it out at full size in 140ms, and only shows and hides it under reduced motion', () => {
    const stamp = transitions.filter(t => /\.stamp$/.test(t.rule.sel));
    expect(timings(stamp.filter(t => t.rule.sel.includes('[data-stamp="in"]')))).toEqual([`opacity 220ms ${EASE_OUT}`, `scale 220ms ${EASE_OUT}`]);
    expect(timings(stamp.filter(t => !t.rule.sel.includes('[data-stamp')))).toEqual([`opacity 140ms ${EASE_IN}`]);
    const state = (sel: string) => rules.find(r => r.sel === sel && !r.at.length)?.decls;
    expect([state('.bn .stamp')?.get('opacity'), state('.bn .stamp')?.get('scale')]).toEqual(['0', '.92']);
    expect(state('.bn [data-stamp="in"] > .stamp')?.get('opacity')).toBe('1');
    expect(state('.bn [data-stamp] > .stamp')?.get('scale')).toBe('none');
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
