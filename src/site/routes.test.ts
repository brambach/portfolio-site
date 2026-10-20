import { describe, expect, it } from 'vitest';
import { fromLab, homeHref, siteRoute, workHref, workId, WORK_IDS } from './routes';

describe('the site’s addresses', () => {
  it('answers / with the home page', () => {
    expect(siteRoute('/')).toEqual({ name: 'home' });
    expect(siteRoute('')).toEqual({ name: 'home' });
    expect(siteRoute('/', '?hour=7')).toEqual({ name: 'home' });
  });

  it('answers each project’s page at /projects/<id>, and nothing else under /projects', () => {
    for (const id of WORK_IDS) expect(siteRoute(`/projects/${id}`)).toEqual({ name: 'project', id });
    expect(workId('/projects/integration-portal/')).toBe('integration-portal');
    expect(siteRoute('/projects/nope')).toEqual({ name: 'missing' });
    expect(siteRoute('/projects/port/more')).toEqual({ name: 'missing' });
  });

  it('gives anything it doesn’t know the not-found page', () => {
    for (const path of ['/nope', '/lab/x', '/sky', '/projectsx', '/work/2']) expect(siteRoute(path)).toEqual({ name: 'missing' });
  });

  it('leaves the older pages and the old links into them alone', () => {
    for (const path of ['/work', '/drive', '/next', '/admin', '/previous', '/entrance-still', '/project-lab', '/drive/']) expect(siteRoute(path), path).toBeNull();
    expect(siteRoute('/', '?mile=dervo')).toBeNull();
    expect(siteRoute('/', '?town')).toBeNull();
  });

  it('sends the motion lab’s addresses to the site', () => {
    expect(fromLab('/lab')).toBe('/');
    expect(fromLab('/lab/')).toBe('/');
    for (const d of ['a', 'b', 'c', 'd', 'e']) expect(fromLab(`/lab/${d}`)).toBe('/');
    for (const id of WORK_IDS) expect(fromLab(`/lab/e/projects/${id}`)).toBe(`/projects/${id}`);
    expect(fromLab('/lab/e/projects/nope')).toBe('/');
    expect(fromLab('/lab/e/projects')).toBe('/');
    expect(fromLab('/labs')).toBeNull();
    expect(fromLab('/projects/port')).toBeNull();
  });

  it('keeps an ?hour= preview on the way, and nothing else', () => {
    expect(workHref('arro', '?hour=13')).toBe('/projects/arro?hour=13');
    expect(workHref('arro', '?x=1')).toBe('/projects/arro');
    expect(workHref('arro')).toBe('/projects/arro');
    expect(homeHref('?hour=7&x=1')).toBe('/?hour=7');
    expect(homeHref('', '#work')).toBe('/#work');
  });
});
