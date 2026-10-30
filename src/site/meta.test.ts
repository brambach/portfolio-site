import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_META, headTags, NOT_FOUND_META, PAGES, PROJECT_META, sitemap, withMeta } from './meta';
import { STORY_IDS, WORK_IDS } from './routes';

const DASHES = /[\u2013\u2014]/;
const root = process.cwd();
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

describe('what each page tells search engines and link previews', () => {
  it('covers the home page, every project page and the not-found page', () => {
    expect(PROJECT_META.map(p => p.path)).toEqual(WORK_IDS.map(id => `/projects/${id}`));
    expect(new Set(PAGES.map(p => p.file)).size).toBe(PAGES.length);
    expect(HOME_META.file).toBe('index.html');
    expect(NOT_FOUND_META.file).toBe('404.html');
  });

  it('has a title, a description and a 1200 by 630 picture that exists for every page, with no dashes', () => {
    for (const page of PAGES) {
      for (const text of [page.title, page.description, page.imageAlt]) expect(DASHES.test(text), text).toBe(false);
      for (const text of [page.title, page.imageAlt]) expect(text, page.file).not.toContain('·');
      expect(page.description.length, page.file).toBeGreaterThan(40);
      const file = path.join(root, 'public', page.image.split('?')[0]);
      expect(existsSync(file), file).toBe(true);
      const jpg = readFileSync(file);
      // A JPEG's size is in its start-of-frame marker.
      const sof = jpg.findIndex((b, i) => b === 0xff && (jpg[i + 1] === 0xc0 || jpg[i + 1] === 0xc2));
      expect([jpg.readUInt16BE(sof + 7), jpg.readUInt16BE(sof + 5)], page.image).toEqual([1200, 630]);
    }
  });

  it('gives every page with an address a canonical one, and keeps not found out of search', () => {
    expect(headTags(HOME_META)).toContain('<link rel="canonical" href="https://brycerambach.com/" />');
    expect(headTags(PROJECT_META[1])).toContain('<link rel="canonical" href="https://brycerambach.com/projects/arro" />');
    expect(headTags(NOT_FOUND_META)).not.toContain('canonical');
    expect(headTags(NOT_FOUND_META)).toContain('<meta name="robots" content="noindex" />');
  });

  it('fills index.html once per page, and marks the not-found page before anything runs', () => {
    const arro = withMeta(html, PROJECT_META[1]);
    expect(arro.match(/<title>/g)).toHaveLength(1);
    expect(arro).toContain('<title>arro, bryce rambach</title>');
    expect(arro).toContain('content="https://brycerambach.com/og/arro.jpg?');
    expect(arro).not.toContain('__notFound = true');
    const missing = withMeta(html, NOT_FOUND_META);
    expect(missing.indexOf('window.__notFound = true')).toBeLessThan(missing.indexOf('Paint the page'));
  });

  it('lists the home page and the project pages in the sitemap, and robots.txt points at it', () => {
    const map = sitemap();
    for (const page of [HOME_META, ...PROJECT_META]) expect(map).toContain(`<loc>https://brycerambach.com${page.path}</loc>`);
    expect(map).not.toContain('404');
    expect(map).not.toContain('/projects/port<');
    expect(PAGES.map(p => p.file)).not.toContain('projects/port.html');
    expect(readFileSync(path.join(root, 'public/robots.txt'), 'utf8')).toContain('Sitemap: https://brycerambach.com/sitemap.xml');
  });

  it('has the icons index.html asks for', () => {
    for (const href of [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*href="([^"?]+)/g)].map(m => m[1])) {
      expect(existsSync(path.join(root, 'public', href)), href).toBe(true);
    }
  });
});

describe('vercel.json', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8')) as {
    redirects: { source: string; destination: string }[]; rewrites: { source: string; destination: string }[];
  };
  const ids = WORK_IDS.join('|'), pages = [...WORK_IDS, ...STORY_IDS].join('|');

  it('sends the motion lab to the site, a lab project to the same project first', () => {
    expect(config.redirects.map(r => [r.source, r.destination])).toEqual([
      [`/lab/e/projects/:id(${ids})`, '/projects/:id'],
      ['/lab', '/'],
      ['/lab/:path*', '/'],
    ]);
  });

  it('serves each project’s own page and nothing else under /projects, so the rest gets the not-found page', () => {
    expect(config.rewrites).toContainEqual({ source: `/projects/:id(${pages})`, destination: '/projects/:id.html' });
    expect(config.rewrites.some(r => r.source === '/projects/:path*' || r.source.startsWith('/lab'))).toBe(false);
  });
});
