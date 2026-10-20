import { describe, expect, it } from 'vitest';
import { isSkyPath } from '../sky/routes';
import { eWorkHref, isLabWorkPath, labRoute, labWorkId } from './routes';

describe('the motion lab addresses', () => {
  it('answers /lab and the five directions', () => {
    expect(labRoute('/lab')).toBe('index');
    expect(labRoute('/lab/')).toBe('index');
    expect(labRoute('/lab/a')).toBe('a');
    expect(labRoute('/lab/b/')).toBe('b');
    expect(labRoute('/lab/c')).toBe('c');
    expect(labRoute('/lab/d')).toBe('d');
    expect(labRoute('/lab/e')).toBe('e');
  });
  it('leaves everything else alone', () => {
    expect(labRoute('/')).toBeNull();
    expect(labRoute('/lab/f')).toBeNull();
    expect(labRoute('/labs')).toBeNull();
    expect(isSkyPath('/lab/a', '')).toBe(false);
  });
});

describe('E’s project pages', () => {
  it('answers each of E’s projects under /lab/e/projects, and nothing else', () => {
    expect(labWorkId('/lab/e/projects/port')).toBe('port');
    expect(labWorkId('/lab/e/projects/integration-portal/')).toBe('integration-portal');
    expect(labWorkId('/lab/e/projects/nope')).toBeNull();
    expect(labWorkId('/projects/port')).toBeNull();
    expect(isLabWorkPath('/lab/e/projects/nope')).toBe(true);
    expect(isLabWorkPath('/lab/e')).toBe(false);
    expect(labRoute('/lab/e/projects/port')).toBeNull();
    // The live project pages are untouched.
    expect(isSkyPath('/projects/port', '')).toBe(true);
    expect(isSkyPath('/lab/e/projects/port', '')).toBe(false);
  });
  it('keeps an ?hour= preview on the way to a project, and drops anything else', () => {
    expect(eWorkHref('arro', '?hour=13')).toBe('/lab/e/projects/arro?hour=13');
    expect(eWorkHref('arro', '?x=1')).toBe('/lab/e/projects/arro');
    expect(eWorkHref('arro')).toBe('/lab/e/projects/arro');
  });
});
