import { describe, expect, it } from 'vitest';
import { isSkyPath } from '../sky/routes';
import { labRoute } from './routes';

describe('the motion lab addresses', () => {
  it('answers /lab and the three directions', () => {
    expect(labRoute('/lab')).toBe('index');
    expect(labRoute('/lab/')).toBe('index');
    expect(labRoute('/lab/a')).toBe('a');
    expect(labRoute('/lab/b/')).toBe('b');
    expect(labRoute('/lab/c')).toBe('c');
  });
  it('leaves everything else alone', () => {
    expect(labRoute('/')).toBeNull();
    expect(labRoute('/lab/d')).toBeNull();
    expect(labRoute('/labs')).toBeNull();
    expect(isSkyPath('/lab/a', '')).toBe(false);
  });
});
