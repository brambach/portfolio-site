import { describe, expect, it } from 'vitest';
import { bandRule, borderImage, cameo, medallionRings, waveField } from './guilloche';

const INK = '#5e2a7e', PAPER = '#efe7d6';
const CSS_URL = /^url\("data:image\/svg\+xml,[^"]*"\)$/;

describe('the guilloche', () => {
  it('draws the same string for the same input every time', () => {
    expect(borderImage(INK)).toBe(borderImage(INK));
    expect(waveField(INK)).toBe(waveField(INK));
    expect(bandRule(INK)).toBe(bandRule(INK));
    expect(cameo(150, 192)).toEqual(cameo(150, 192));
    expect(medallionRings(260)).toEqual(medallionRings(260));
  });

  it('draws the border in the ink it is given and the rings at the size they are given', () => {
    expect(borderImage(INK)).not.toBe(borderImage(PAPER));
    expect(medallionRings(260)).not.toEqual(medallionRings(168));
  });

  it.each([
    ['borderImage', borderImage],
    ['waveField', waveField],
    ['bandRule', bandRule],
  ])('%s is one css url value with the ink escaped', (_, draw) => {
    const value = draw(INK);
    expect(value).toMatch(CSS_URL);
    expect(value).not.toContain('#');
    expect(value).toContain('%235e2a7e');
  });

  it('gives the medallion three ring svgs, every rose path ready for the pen, the rim on the outer', () => {
    const rings = medallionRings(260);
    expect(rings).toHaveLength(3);
    for (const ring of rings) expect(ring.match(/<svg/g)).toHaveLength(1);
    const paths = rings.flatMap(ring => ring.match(/<path[^>]*>/g) ?? []);
    expect(paths).toHaveLength(5 + 6 + 6);
    for (const path of paths) expect(path).toContain('pathLength="1"');
    const [outer, middle, inner] = rings;
    expect(outer).toMatch(/<circle(?![^>]*pathLength)[^>]*>/);
    expect(middle).not.toContain('<circle');
    expect(inner).not.toContain('<circle');
  });

  it('sizes the cameo to the engraving plus its margin', () => {
    const { w, h, svg } = cameo(150, 192);
    expect([w, h]).toEqual([186, 228]);
    expect(svg).toContain('viewBox="0 0 186 228" width="186" height="228"');
    expect(svg).toContain('class="cameo__frame"');
    expect(svg).toContain('aria-hidden="true"');
  });

  it('never prints NaN or undefined', () => {
    const all = [borderImage(INK), waveField(INK), bandRule(INK), cameo(150, 192).svg, ...medallionRings(260), ...medallionRings(168)];
    for (const s of all) expect(s).not.toMatch(/NaN|undefined/);
  });
});
