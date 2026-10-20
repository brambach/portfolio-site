import { projects, type Project } from '../../projects/catalog';
import { workById } from '../../sky/work';
import { E_WORK_IDS, type EWorkId } from '../routes';

/* What E's project pages show. The words about each project come from catalog.ts, like every other page of the
   site, and the pictures and their captions from the pages that already show them: sky/work.ts for Dervo, Arro
   and Port, the Lucid study and the AgentSky study for theirs. Nothing here is new about a project. */

export type EShot = { src: string; alt: string; title?: string; text?: string; tall?: boolean };
export type EWork = Project & {
  id: EWorkId;
  /** What the dots draw at the top of the page: one of the project's own screens, or Port's ring to hold. */
  hero: { src: string; tall?: boolean } | { ring: true };
  /** The project's screens, shown as they are, with the captions they have elsewhere on the site. */
  shots: EShot[];
  link?: { href: string; label: string };
};

const fromSky = (id: 'dervo' | 'arro' | 'port') => {
  const w = workById(id)!;
  const shots: EShot[] = [w.hero, ...w.gallery]
    .filter(p => p.src)
    .map(p => ({ src: p.src, alt: `${w.name}${p.title ? `: ${p.title}` : ''}`, title: p.title, text: p.text, tall: p.tall }));
  return { hero: w.hero.port ? { ring: true as const } : { src: w.hero.src, tall: w.hero.tall }, shots, link: w.link };
};

const extra: Record<EWorkId, Pick<EWork, 'hero' | 'shots' | 'link'>> = {
  dervo: fromSky('dervo'),
  arro: fromSky('arro'),
  port: fromSky('port'),
  // From LucidStudy.tsx.
  lucid: {
    hero: { src: '/projects/lucid/spec.png' },
    shots: [{ src: '/projects/lucid/mapping.png', alt: 'Original Lucid preview showing five mappings with their evidence categories', title: 'Every value carries its source.', text: 'The specification brings fields, transformations and risk into one readable document.' }],
  },
  // The cover the project collection uses. The portal's study redraws everything else.
  'integration-portal': { hero: { src: '/projects/portal/hub.png' }, shots: [] },
  // From the AgentSky study's three artifacts (project-lab/ProjectLab.tsx).
  agentsky: {
    hero: { src: '/project-lab/sky.png' },
    shots: [
      { src: '/project-lab/hero.png', alt: 'The session', title: 'One place to follow the work.', text: 'Agent selection, the request and its files stay visible together. Changing the selected agent resets the sample run, so an old result never appears to belong to a new agent.' },
      { src: '/project-lab/cloud.png', alt: 'The workspace', title: 'Close the window. Keep the context.', text: 'The local and cloud windows share the same workspace identity. Movement explains the transfer, while the remaining window makes persistence visible.' },
      { src: '/project-lab/comparison.png', alt: 'The output', title: 'Give the result room.', text: 'A selector sits beside one large output preview. Each result has space to be read, and the viewer can open it for closer inspection.' },
    ],
  },
};

/** Every screen's size in pixels, so the page keeps its place for one before it loads. */
export const SHOT_SIZE: Record<string, [number, number]> = {
  '/project-lab/cloud.png': [658, 511],
  '/project-lab/comparison.png': [1440, 1296],
  '/project-lab/hero.png': [1440, 1100],
  '/project-lab/sky.png': [1536, 1024],
  '/projects/arro/feed.jpg': [780, 1688],
  '/projects/arro/log-today.jpg': [780, 1688],
  '/projects/arro/nudge.jpg': [780, 1688],
  '/projects/arro/today.jpg': [780, 1688],
  '/projects/arro/workout.jpg': [780, 1688],
  '/projects/dervo/catch-up.jpg': [1512, 840],
  '/projects/dervo/sunrise.jpg': [1200, 963],
  '/projects/dervo/thread.jpg': [1512, 840],
  '/projects/lucid/mapping.png': [1440, 1000],
  '/projects/lucid/spec.png': [1440, 1000],
  '/projects/portal/hub.png': [1650, 962],
};

export const E_WORK: EWork[] = E_WORK_IDS.map(id => ({ ...projects.find(p => p.id === id)!, ...extra[id], id }));

/** A project's page by its id. There's deliberately no fallback: an id E doesn't know gets no page, not
 *  some other project's. */
export const eWorkById = (id: string | null | undefined) => E_WORK.find(w => w.id === id) ?? null;
export const nextEWork = (id: EWorkId) => E_WORK[(E_WORK_IDS.indexOf(id) + 1) % E_WORK.length];

/** E's own page for a link that points at a live project page, so following one from E stays in E. */
export function toEWork(href: string) {
  const id = /^\/projects\/([^/?#]+)$/.exec(href)?.[1];
  return id && eWorkById(id) ? id as EWorkId : null;
}
