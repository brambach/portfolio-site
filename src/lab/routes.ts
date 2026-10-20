/* The motion lab: /lab and a page per direction at /lab/a to /lab/e, plus E's own work pages at
   /lab/e/projects/<id>. Those are E's versions of the project pages, so the live ones at /projects/<id> stay as
   they are. */
export const LAB_IDS = ['a', 'b', 'c', 'd', 'e'] as const;
export type LabId = (typeof LAB_IDS)[number];

/** The projects that have a page in E's style, in the order E walks through them: the three on E's index first,
 *  then the rest. */
export const E_WORK_IDS = ['dervo', 'arro', 'port', 'lucid', 'integration-portal', 'agentsky'] as const;
export type EWorkId = (typeof E_WORK_IDS)[number];

export function labRoute(pathname: string): LabId | 'index' | null {
  const path = pathname.replace(/\/$/, '');
  if (path === '/lab') return 'index';
  const id = /^\/lab\/([^/]+)$/.exec(path)?.[1];
  return id && (LAB_IDS as readonly string[]).includes(id) ? (id as LabId) : null;
}

/** Anything under /lab/e/projects/ belongs to E: a project's page if the id is one of E's, otherwise nothing
 *  (and E sends it back to its index). */
export const isLabWorkPath = (pathname: string) => /^\/lab\/e\/projects(?:\/|$)/.test(pathname);

export function labWorkId(pathname: string): EWorkId | null {
  const id = /^\/lab\/e\/projects\/([^/]+)\/?$/.exec(pathname)?.[1];
  return id && (E_WORK_IDS as readonly string[]).includes(id) ? (id as EWorkId) : null;
}

/** E's address for a project page, keeping a `?hour=` preview so the paper doesn't change on the way. */
export const eWorkHref = (id: string, search = '') => `/lab/e/projects/${id}${hourQuery(search)}`;
export function hourQuery(search: string) {
  const hour = new URLSearchParams(search).get('hour');
  return hour === null ? '' : `?hour=${encodeURIComponent(hour)}`;
}
