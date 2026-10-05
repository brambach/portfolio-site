import { describe, expect, it } from 'vitest';
import { isSkyPath, SKY_IDS } from './routes';
import { WORK } from './work';

describe('isSkyPath', () => {
  it('answers the home page and the six project pages', () => {
    expect(isSkyPath('/', '')).toBe(true);
    for (const id of SKY_IDS) expect(isSkyPath(`/projects/${id}`, '')).toBe(true);
    expect(isSkyPath('/projects/lucid/', '')).toBe(true);
  });
  it('leaves the road, the drive, the old studies and everything else alone', () => {
    expect(isSkyPath('/', '?mile=lucid')).toBe(false);
    expect(isSkyPath('/', '?town')).toBe(false);
    expect(isSkyPath('/', '?from=work')).toBe(false);
    expect(isSkyPath('/work', '')).toBe(false);
    expect(isSkyPath('/drive', '')).toBe(false);
    expect(isSkyPath('/next', '')).toBe(false);
    expect(isSkyPath('/projects', '')).toBe(false);
    expect(isSkyPath('/projects/lucid', '?look=green')).toBe(false);
    expect(isSkyPath('/projects/not-a-project', '')).toBe(false);
  });
  it('knows the same projects as the catalog, in the same order', () => {
    expect([...SKY_IDS]).toEqual(WORK.map(work => work.id));
  });
});
