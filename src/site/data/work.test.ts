import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../../projects/catalog';
import { INDEX_IDS, WORK, workById } from './work';

const publicFile = (src: string) => path.join(process.cwd(), 'public', src);

describe('the work on the home page’s index', () => {
  it('is the catalog, word for word, plus a picture for each project', () => {
    expect(WORK.map(w => w.id)).toEqual([...INDEX_IDS]);
    for (const work of WORK) {
      const project = projects.find(p => p.id === work.id)!;
      for (const key of ['name', 'line', 'category', 'status', 'role', 'introduction', 'decision', 'engineering', 'boundary'] as const) expect(work[key]).toBe(project[key]);
      expect(work.kind.length).toBeGreaterThan(0);
    }
  });
  it('only points at screenshots that exist', () => {
    for (const work of WORK) {
      expect(existsSync(publicFile(work.hero.src)), work.hero.src).toBe(true);
      for (const picture of work.gallery) {
        expect(existsSync(publicFile(picture.src)), picture.src).toBe(true);
        expect(picture.title && picture.text, picture.src).toBeTruthy();
      }
    }
  });
  it('has the files the pages link to', () => {
    for (const file of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/og/home-banknote.jpg']) {
      expect(existsSync(publicFile(file)), file).toBe(true);
    }
  });
  it('sends Dervo visitors to the source, now that I’ve stopped building it', () => {
    expect(workById('dervo')?.link?.href).toBe('https://github.com/brambach/dervo');
  });
});
