/* Which page an address gets. Kept apart from the pages so main.tsx (and the inline script in index.html, which
   mirrors this to paint the right paper before anything loads) can decide without loading them.

   - /                  the home page
   - /projects/<id>     a project's page, for the five in WORK_IDS and the products in STORY_IDS (stories.ts)
   - /projects/<id>     a case study, for the two in CASE_IDS (block/)
   - anything else      not found, unless it's one of the older pages main.tsx still serves (OLDER_PATHS) */

/** The projects with a page, in the order the pages walk through them: the two on the home page's index
 *  first, then the rest. */
export const WORK_IDS = ['dervo', 'arro', 'lucid', 'integration-portal', 'agentsky'] as const;
export type WorkId = (typeof WORK_IDS)[number];
/** The projects that grew into products, with their pages in stories.ts. */
export const STORY_IDS = ['jared', 'trace', 'easeprint', 'dryline', 'comehome'] as const;
export type StoryId = (typeof STORY_IDS)[number];

/** Pages from before this design that are still linked from it (the drive and the road, under "Side quests") or
 *  that have their own reasons to stay. main.tsx serves them as before. */
export const OLDER_PATHS = ['/work', '/drive', '/next', '/admin', '/previous', '/entrance-still', '/project-lab'] as const;
/** Old links to the home page that open the road (`?mile=`) or the drive (the rest). */
export const ROAD_KEYS = ['mile'] as const;
export const DRIVE_KEYS = ['from', 'town', 'city', 'journey', 'forest'] as const;

/** Case studies Bryce wrote, each a page of its own in the black and white look (block/TeammatePage.tsx,
 *  block/PsychePage.tsx). */
export const CASE_IDS = ['ai-teammate', 'psyche'] as const;
export type CaseId = (typeof CASE_IDS)[number];

/** Addresses that now send people to another page (vercel.json does the same with a redirect, and main.tsx wherever
 *  that doesn't run). The AI teammate's case study is unnamed, so the older page that used the product's name sends
 *  people to it. */
export const MOVED: Readonly<Record<string, string>> = { '/projects/jared': '/projects/ai-teammate' };

export type Route = { name: 'home' } | { name: 'project'; id: WorkId } | { name: 'story'; id: StoryId } | { name: 'case'; id: CaseId } | { name: 'missing' };

const trim = (pathname: string) => pathname.replace(/\/+$/, '');

export function workId(pathname: string): WorkId | null {
  const id = /^\/projects\/([^/]+)$/.exec(trim(pathname))?.[1];
  return id && (WORK_IDS as readonly string[]).includes(id) ? (id as WorkId) : null;
}

/** The page for an address, or null when it belongs to one of the older pages. */
export function siteRoute(pathname: string, search = ''): Route | null {
  const path = trim(pathname);
  if (path === '') {
    const q = new URLSearchParams(search);
    return [...ROAD_KEYS, ...DRIVE_KEYS].some(k => q.has(k)) ? null : { name: 'home' };
  }
  if ((OLDER_PATHS as readonly string[]).includes(path) || movedTo(path)) return null;
  const id = workId(path);
  if (id) return { name: 'project', id };
  const story = /^\/projects\/([^/]+)$/.exec(path)?.[1];
  if (story && (CASE_IDS as readonly string[]).includes(story)) return { name: 'case', id: story as CaseId };
  return story && (STORY_IDS as readonly string[]).includes(story) ? { name: 'story', id: story as StoryId } : { name: 'missing' };
}

/** Where an address from the motion lab lives now (vercel.json says the same, so this only runs where that
 *  doesn't, like `vite preview`). A lab project page goes to the same project, everything else in the lab home. */
export function fromLab(pathname: string): string | null {
  const path = trim(pathname);
  if (path !== '/lab' && !path.startsWith('/lab/')) return null;
  const id = /^\/lab\/e\/projects\/([^/]+)$/.exec(path)?.[1];
  return id && (WORK_IDS as readonly string[]).includes(id) ? `/projects/${id}` : '/';
}

/** Where a moved address lives now, or null when it hasn't moved. */
export function movedTo(pathname: string): string | null {
  return MOVED[trim(pathname)] ?? null;
}

/** A project page's address, keeping a `?hour=` preview so the paper doesn't change on the way. */
export const workHref = (id: string, search = '') => `/projects/${id}${hourQuery(search)}`;
/** The home page's address, the same way. */
export const homeHref = (search = '', hash = '') => `/${hourQuery(search)}${hash}`;
export function hourQuery(search: string) {
  const hour = new URLSearchParams(search).get('hour');
  return hour === null ? '' : `?hour=${encodeURIComponent(hour)}`;
}
