import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

const css=readFileSync('src/prototype/journey-map.css','utf8');

it('keeps the straight-through cover opaque before placement can paint',()=>{
  expect(css).toMatch(/\.route-jump-cover\{[^}]*background:#151b16;/);
  expect(css).toMatch(/@keyframes route-jump-cover\{0%,70%\{opacity:1\}100%\{opacity:0\}\}/);
});

it('keeps reduced-motion straight-through cover opaque without animation',()=>{
  expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)\{[^}]*\.route-jump-cover\{animation:none;opacity:1\}/);
});
