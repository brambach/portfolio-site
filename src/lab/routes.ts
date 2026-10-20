/* The motion lab: /lab and a page per direction at /lab/a, /lab/b, /lab/c and /lab/d. */
export const LAB_IDS = ['a', 'b', 'c', 'd'] as const;
export type LabId = (typeof LAB_IDS)[number];

export function labRoute(pathname: string): LabId | 'index' | null {
  const path = pathname.replace(/\/$/, '');
  if (path === '/lab') return 'index';
  const id = /^\/lab\/([^/]+)$/.exec(path)?.[1];
  return id && (LAB_IDS as readonly string[]).includes(id) ? (id as LabId) : null;
}
