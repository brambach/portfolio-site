import { DERVO } from '../cobalt/copy';
import { PROJECT_META } from '../meta';
import { ARRO, STORIES, type Pic } from '../stories';
import { said, VOICE, type Said, type VoiceId } from '../voice';
import { PSYCHE } from '../block/psyche';
import { TEAMMATE } from '../block/teammate';
import { PAGED, WORK, workById } from './work';

/* Each project's page in the loupe look, gathered into one shape from wherever its words already live: stories.ts for
   the products, cobalt/copy.ts for Dervo, and the two case studies Bryce wrote (block/teammate.ts, block/psyche.ts).
   Nothing is rewritten here. The case studies keep their own long body (Chapter.tsx shows it under the loupe's
   opening). */

export type Stat = { n: number; plus?: boolean; unit?: string; pre?: string; k: string };

export type ChapterData = {
  id: string;
  /** Where it sits in the work, counting from 1. */
  n: number;
  name: string;
  kind: string;
  status: string;
  year: string;
  line: string;
  lead: string;
  title: string;
  cover: { src: string; alt: string };
  facts: { label: string; value: string }[];
  links: { href: string; label: string; kind: 'live' | 'source' }[];
  stats?: Stat[];
  words: Said[];
  pics: Pic[];
  does?: { title: string; items: [string, string][] };
  call?: { title: string; body: string };
  hood?: { title: string; body: string };
  stands?: { title: string; body: string[] };
  /** A case study's own body, or Dervo's rebuilt Home. */
  body?: 'teammate' | 'psyche' | 'dervo';
  privacy?: string;
};

const base = (id: string) => {
  const w = workById(id)!;
  return { id, n: WORK.indexOf(w) + 1, name: w.name, kind: w.kind, status: w.status, year: w.year, cover: { src: w.img, alt: w.alt } };
};

const words = (id: VoiceId) => said(VOICE[id] ?? []);

function story(id: 'trace' | 'easeprint' | 'dryline' | 'comehome' | 'arro'): ChapterData {
  const s = id === 'arro' ? ARRO : STORIES[id];
  const links: ChapterData['links'] = [];
  if (s.live.kind !== 'source') links.push({ href: s.live.href, label: s.live.label, kind: 'live' });
  if (s.source.href) links.push({ href: s.source.href, label: s.source.label, kind: 'source' });
  return {
    ...base(id),
    line: s.line,
    lead: s.lead,
    title: `${s.name.toLowerCase()}, bryce rambach`,
    facts: s.facts,
    links,
    words: words(id),
    pics: [s.hero, s.shot],
    does: s.does,
    call: s.call,
    stands: s.stands,
  };
}

function dervo(): ChapterData {
  return {
    ...base('dervo'),
    line: DERVO.line,
    lead: DERVO.lead,
    title: PROJECT_META.find(p => p.path === '/projects/dervo')!.title,
    facts: DERVO.facts,
    links: [{ href: DERVO.source.href, label: DERVO.source.label, kind: 'source' }],
    words: words('dervo'),
    pics: [{ src: DERVO.shot.src, alt: DERVO.shot.alt, caption: DERVO.shot.caption, w: 1600, h: 1000 }],
    does: DERVO.does,
    call: DERVO.call,
    hood: DERVO.hood,
    stands: DERVO.stands,
    body: 'dervo',
  };
}

function teammate(): ChapterData {
  return {
    ...base('ai-teammate'),
    line: TEAMMATE.h1,
    lead: `${TEAMMATE.lead} ${TEAMMATE.leadStrong} ${TEAMMATE.leadEnd}`,
    title: TEAMMATE.title,
    facts: TEAMMATE.meta.map(([label, value]) => ({ label, value })),
    links: [],
    stats: TEAMMATE.stats,
    words: [],
    pics: [],
    body: 'teammate',
    privacy: TEAMMATE.privacy,
  };
}

function psyche(): ChapterData {
  return {
    ...base('psyche'),
    line: PSYCHE.h1,
    lead: PSYCHE.lead,
    title: PSYCHE.title,
    facts: PSYCHE.meta.map(([label, value]) => ({ label, value })),
    links: [{ href: PSYCHE.source.href, label: PSYCHE.source.label, kind: 'source' }],
    stats: PSYCHE.stats,
    words: [],
    pics: [],
    body: 'psyche',
  };
}

/** The page for an address id. The AI teammate's old named address shows the same unnamed page. */
export function chapter(id: string): ChapterData | null {
  switch (id) {
    case 'ai-teammate': case 'jared': return teammate();
    case 'psyche': return psyche();
    case 'dervo': return dervo();
    case 'trace': case 'easeprint': case 'dryline': case 'comehome': case 'arro': return story(id);
    default: return null;
  }
}

/** The project after this one, round to the start again. */
export function nextOf(id: string) {
  const at = PAGED.findIndex(w => w.id === (id === 'jared' ? 'ai-teammate' : id));
  return PAGED[(at + 1) % PAGED.length];
}

/** The ids that have a loupe page. */
export const CHAPTER_IDS = PAGED.map(w => w.id);
