import { ROWS } from '../block/copy';

/* The work, in the order the home flies through it. Names, kinds and lines are the black and white home's
   (block/copy.ts), so every look says the same thing about each project. Each one has a wide picture for the reel and
   a short status. The AI teammate stays unnamed. */

export type Work = {
  id: string;
  name: string;
  kind: string;
  status: string;
  year: string;
  line: string;
  /** A 16:10 picture for the reel and the index. */
  img: string;
  alt: string;
  /** Its page on the site, when it has one. */
  href?: string;
};

const row = (name: string) => ROWS.find(r => r.name === name)!;

const from = (name: string, id: string, status: string, img?: string, alt?: string): Work => {
  const r = row(name);
  return { id, name: r.name, kind: r.kind, status, year: '2026', line: r.line, img: img ?? r.img, alt: alt ?? r.alt, href: r.href };
};

export const WORK: Work[] = [
  from('AI teammate', 'ai-teammate', 'in pilot'),
  from('Dervo', 'dervo', 'stopped'),
  from('Psyche', 'psyche', 'built in 13 days'),
  from('receipts', 'receipts', 'not public yet'),
  from('tastepack', 'tastepack', 'not public yet'),
  from('Trace', 'trace', 'live demo'),
  from('easeprint', 'easeprint', 'live'),
  from('dryline', 'dryline', 'live'),
  from('comehome', 'comehome', 'live demo'),
  from('Arro', 'arro', 'stopped', '/projects/arro/story.jpg', 'Three Arro screens: Today with the family streak on day 24, the family feed with a run and cheers, and a nudge that says "Maya still has today"'),
];

/** The projects with a page, in order, for "next project". */
export const PAGED = WORK.filter(w => w.href);

export const workById = (id: string) => WORK.find(w => w.id === id);

/** Two digits, the way the reel and the pages count. */
export const nn = (i: number) => String(i + 1).padStart(2, '0');
