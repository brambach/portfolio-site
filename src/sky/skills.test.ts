import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../projects/catalog';
import { SKY_IDS } from './routes';
import { SKILLS, skillForProject } from './skills';

const DASHES = /[–—]/;

describe('the five skills', () => {
  it('are the five the home page claims, each with proof', () => {
    expect(SKILLS.map(s => s.name)).toEqual(['Integrations', 'Agents', 'Harnesses', 'Design', 'Product taste']);
    expect(new Set(SKILLS.map(s => s.id)).size).toBe(SKILLS.length);
    for (const skill of SKILLS) {
      expect(skill.body.length, skill.id).toBeGreaterThan(0);
      expect(skill.evidence.length, skill.id).toBeGreaterThan(0);
    }
  });

  it('only link to pages that exist, outside links that are public, or nothing', () => {
    const pages = SKY_IDS.map(id => `/projects/${id}`);
    for (const skill of SKILLS) {
      expect(skill.to.startsWith('#') ? skill.to === `#${skill.id}` : pages.includes(skill.to), skill.to).toBe(true);
      for (const item of skill.evidence) {
        if (item.to) expect(pages, item.to).toContain(item.to);
        if (item.href) expect(item.href, item.name).toMatch(/^https:\/\//);
      }
    }
  });

  it('raise pictures that exist', () => {
    for (const { picture } of SKILLS) {
      if (picture.port || picture.map) continue;
      expect(existsSync(path.join(process.cwd(), 'public', picture.src)), picture.src).toBe(true);
    }
  });

  it('map a project page back to the first skill it backs', () => {
    expect(SKILLS[skillForProject('dervo')].id).toBe('agents');
    expect(SKILLS[skillForProject('arro')].id).toBe('product');
    expect(skillForProject(null)).toBe(-1);
  });

  it('use no em or en dashes, here or in the sky site’s project words', () => {
    const words = [
      ...SKILLS.flatMap(s => [s.name, s.proof, s.line, ...s.body, ...s.evidence.flatMap(e => [e.name, e.note])]),
      ...projects.filter(p => (SKY_IDS as readonly string[]).includes(p.id)).flatMap(p => Object.values(p)),
    ];
    for (const text of words) expect(DASHES.test(text), text).toBe(false);
  });
});
