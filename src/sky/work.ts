import { projects as catalog, type Project } from '../projects/catalog';
import { SKY_IDS } from './routes';

/* The projects that get a page on the sky site. The words that describe each one come from catalog.ts, so the
   road, the old studies and this site never disagree; this file only adds what the sky site needs on top:
   a short kind, the picture a project opens on, captions and the extra screens. Captions come from the
   study pages (DervoStudy, ArroStudy, PortStudy) or describe what the screenshot itself shows. */

export type Picture = { src: string; title?: string; text?: string; tall?: boolean; pos?: string };
export type Work = Omit<Project, 'id'> & {
  id: SkyId;
  kind: string;
  hero: Picture & { port?: boolean };
  gallery: Picture[];
  link?: { href: string; label: string };
};

export type SkyId = (typeof SKY_IDS)[number];
const extra: Record<SkyId, Omit<Work, keyof Project>> = {
  dervo: {
    kind: 'Mac app',
    hero: { src: '/projects/dervo/catch-up.jpg', title: 'Come back to a few sentences.', text: 'Catch up says what finished, what’s stuck and what needs you since you last looked. Answer one question and the thread carries on.' },
    gallery: [
      { src: '/projects/dervo/thread.jpg', title: 'It reads the record, not the agent’s account.', text: 'Every run ends with what changed, what was checked, what wasn’t, and what’s next. Approving it commits the work.' },
      { src: '/projects/dervo/sunrise.jpg', title: 'A sunrise that rises as the run goes.', text: 'The landing page rebuilds the product in HTML, over a dotted sunrise drawn in a shader. It echoes the progress dot in the app, and it’s where the light on this site comes from.' },
    ],
    link: { href: 'https://github.com/brambach/dervo', label: 'Read the source on GitHub' },
  },
  arro: {
    kind: 'React Native',
    hero: { src: '/projects/arro/today-sample.png', tall: true, title: 'A little encouragement.', text: 'See who’s already been out and who still has today. There’s room for a cheer, without turning the family into a leaderboard.' },
    gallery: [
      { src: '/projects/arro/trail-sample.png', tall: true, title: 'Every day adds up.', text: 'The weekly trail makes everyone’s effort visible. A rest day can belong in the story too.' },
    ],
    link: { href: 'https://arrofamily.com', label: 'arrofamily.com' },
  },
  port: {
    kind: 'SwiftUI',
    hero: { src: '', port: true, title: 'Hold to close.', text: 'Press and hold the circle, or focus it and press Enter, to try a browser version of the hold. It plays the sound from the project.' },
    gallery: [],
    link: { href: 'https://github.com/brambach/port', label: 'Read the source on GitHub' },
  },
};

export const WORK: Work[] = SKY_IDS.map(id => {
  const project = catalog.find(p => p.id === id)!;
  return { ...project, ...extra[id], id };
});
export const workById = (id: string | null | undefined) => WORK.find(work => work.id === id);
export const isWorkId = (id: string) => WORK.some(work => work.id === id);
