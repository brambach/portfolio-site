import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BANNED } from '../banned-names';
import CobaltStory from './cobalt/StoryPage';
import { WORK } from './cobalt/copy';
import { PAGES } from './meta';
import PatchStory from './patch/StoryPage';
import { siteRoute } from './routes';
import { STORIES, STORY_IDS } from './stories';

const DASHES = /[–—]/;
const strings = (v: unknown): string[] => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

afterEach(() => vi.restoreAllMocks());

describe('The product pages', () => {
  it('have an address, a built page and a row on the home page that leads to it', () => {
    for (const id of STORY_IDS) {
      expect(siteRoute(`/projects/${id}`)).toEqual({ name: 'story', id });
      expect(PAGES.some(p => p.file === `projects/${id}.html`)).toBe(true);
      expect(WORK.rows.some(r => r.href === `/projects/${id}`)).toBe(true);
    }
    expect(siteRoute('/projects/nope')).toEqual({ name: 'missing' });
  });

  it.each(STORY_IDS)('%s names itself, links the live product and its source, in both looks', id => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const s = STORIES[id];
    for (const Page of [PatchStory, CobaltStory]) {
      const { unmount } = render(<Page id={id} />);
      expect(screen.getByRole('heading', { level: 1, name: s.name })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(s.live.label) })).toHaveAttribute('href', s.live.href);
      expect(screen.getByRole('link', { name: new RegExp(s.source.label) })).toHaveAttribute('href', s.source.href);
      expect(screen.getByRole('img', { name: s.hero.alt })).toBeInTheDocument();
      unmount();
    }
  });

  it('use no dashes and name no port, city or employer', () => {
    const employer = [...BANNED, /\bdd\b/i, /\bcontract/i, /\bfreelanc/i];
    for (const t of strings(STORIES)) {
      if (t.startsWith('http') || t.startsWith('/')) continue;
      expect(t, t).not.toMatch(DASHES);
      expect(t, t).not.toMatch(/parked/i);
      expect(t, t).not.toMatch(/\bport\b/i);
      expect(t, t).not.toMatch(/\bs[f]\b|\bn[y]c\b|san fr[a]ncisco|new y[o]rk|truckee/i);
      for (const re of employer) expect(t, t).not.toMatch(re);
    }
  });
});
