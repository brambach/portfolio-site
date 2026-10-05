import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../projects/catalog';
import { WORK, workById } from './work';

const publicFile = (src: string) => path.join(process.cwd(), 'public', src);

describe('the work on the sky site', () => {
  it('is the catalog, word for word, plus a picture for each project', () => {
    expect(WORK.map(w => w.id)).toEqual(projects.map(p => p.id));
    WORK.forEach((work, i) => {
      const project = projects[i];
      for (const key of ['name', 'line', 'category', 'status', 'role', 'introduction', 'decision', 'engineering', 'boundary'] as const) expect(work[key]).toBe(project[key]);
      expect(work.kind.length).toBeGreaterThan(0);
    });
  });
  it('only points at screenshots that exist', () => {
    for (const work of WORK) {
      if (!work.hero.port) expect(existsSync(publicFile(work.hero.src)), work.hero.src).toBe(true);
      for (const picture of work.gallery) {
        expect(existsSync(publicFile(picture.src)), picture.src).toBe(true);
        expect(picture.title && picture.text, picture.src).toBeTruthy();
      }
    }
  });
  it('has the files the pages link to', () => {
    for (const file of ['/Bryce_Rambach_Resume.pdf', '/projects/port/close.wav', '/project-lab/walkthrough.webm', '/sky/agentsky-session.jpg', '/favicon-sky.svg', '/og-sky.jpg']) {
      expect(existsSync(publicFile(file)), file).toBe(true);
    }
  });
  it('sends Dervo visitors to the waitlist', () => {
    expect(workById('dervo')?.link?.href).toBe('https://trydervo.com/#waitlist');
  });
});
