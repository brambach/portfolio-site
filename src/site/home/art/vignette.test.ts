import { describe, expect, it } from 'vitest';
import { PARTS, vignette } from './vignette';

const plate = (w: number, h: number) => {
  const el = document.createElement('div');
  el.innerHTML = vignette(w, h);
  return el;
};
const LAND = ['far', 'mid', 'near', 'water', 'ridges'];

/* Counts from the picture before it was split into parts, so the split moved shapes without adding or losing any. */
describe.each([
  { w: 390, h: 96, sun: 123, glints: 40 },
  { w: 1440, h: 245, sun: 774, glints: 161 },
])('the picture at $w x $h', ({ w, h, sun, glints }) => {
  it('has each part once, three glint bands and three birds, in paint order', () => {
    const el = plate(w, h);
    for (const part of ['halo', 'sun', ...LAND]) expect(el.querySelectorAll(`.vig__${part}`)).toHaveLength(1);
    expect([...el.querySelectorAll('.vig__glints')].map(g => g.getAttribute('data-band'))).toEqual(['0', '1', '2']);
    expect([...el.querySelectorAll('.vig__bird')].map(b => (b as HTMLElement).style.getPropertyValue('--i'))).toEqual(['0', '1', '2']);
    const order = [...el.children].map(c => c.getAttribute('class')!.replace('vig__', ''));
    expect([...new Set(order)]).toEqual([...PARTS]);
  });

  it('keeps the birds out of the land, each a pair of small wings of its own size', () => {
    const el = plate(w, h);
    // A wing is the only curve in the picture; everything else is straight rules.
    for (const path of el.querySelectorAll(LAND.map(p => `.vig__${p} path`).join())) expect(path.getAttribute('d')).not.toMatch(/q/i);
    const birds = [...el.querySelectorAll('.vig__bird')];
    for (const bird of birds) {
      expect(bird.parentElement).toBe(el);
      const wings = bird.querySelectorAll(':scope > div > svg.vig__wing');
      expect(wings).toHaveLength(2);
      // One wing drawn twice: CSS mirrors the second, so the two can't come apart.
      expect(wings[0].outerHTML).toBe(wings[1].outerHTML);
      expect(Number(wings[0].getAttribute('width'))).toBeLessThan(12);
      expect(wings[0].querySelector('path')!.getAttribute('d')).toMatch(/^M0,0Q/);
    }
    expect(new Set(birds.map(b => b.querySelector('path')!.getAttribute('d'))).size).toBe(3);
  });

  it('draws the same markup every time, with every sun dot and glint it had before', () => {
    expect(vignette(w, h)).toBe(vignette(w, h));
    const el = plate(w, h);
    expect(el.querySelectorAll('.vig__sun circle')).toHaveLength(sun);
    expect(el.querySelectorAll('.vig__glints circle')).toHaveLength(glints);
    expect(el.innerHTML).not.toMatch(/NaN|undefined/);
  });
});
