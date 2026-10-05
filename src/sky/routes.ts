/* Which addresses the sky site answers. Kept apart from the site itself so main.tsx (and the inline script in
   index.html, which mirrors this rule to paint the sky before anything loads) can decide without loading it.

   - /                    the sky home page
   - /projects/<id>       a project page, for the six projects in catalog.ts
   - /?mile=<id>          still the road, parked at that billboard (old study links come back this way)
   - /projects?look=...   still the old studies, which /next links to
   - /?town and friends   still the 3D drive */

export const SKY_IDS = ['dervo', 'integration-portal', 'lucid', 'arro', 'port', 'agentsky'] as const;
const DRIVE_KEYS = ['from', 'town', 'city', 'journey', 'forest'];

export function isSkyPath(pathname: string, search: string) {
  const path = pathname.replace(/\/$/, '');
  const params = new URLSearchParams(search);
  if (params.has('look')) return false;
  if (path === '') return !params.has('mile') && !DRIVE_KEYS.some(key => params.has(key));
  const id = /^\/projects\/([^/]+)$/.exec(path)?.[1];
  return !!id && (SKY_IDS as readonly string[]).includes(id);
}
