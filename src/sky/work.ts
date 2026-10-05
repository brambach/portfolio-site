import { projects as catalog, type Project, type ProjectId } from '../projects/catalog';

/* The work as the sky site shows it. The words that describe each project come from catalog.ts, so the
   road, the old studies and this site never disagree; this file only adds what the sky site needs on top:
   a short kind, the picture a project opens on, captions and the extra screens. Captions come from the
   study pages (DervoStudy, PortalStudy, LucidStudy, ArroStudy, ProjectLab) or describe what the screenshot
   itself shows. */

export type Picture = { src: string; title?: string; text?: string; tall?: boolean; pos?: string };
export type Work = Project & {
  kind: string;
  hero: Picture & { port?: boolean };
  gallery: Picture[];
  link?: { href: string; label: string };
};

const extra: Record<ProjectId, Omit<Work, keyof Project>> = {
  dervo: {
    kind: 'Mac app',
    hero: { src: '/projects/dervo/catch-up.jpg', title: 'Come back to a few sentences.', text: 'Catch up says what finished, what’s stuck and what needs you since you last looked. Answer one question and the thread carries on.' },
    gallery: [
      { src: '/projects/dervo/thread.jpg', title: 'It reads the record, not the agent’s account.', text: 'Every run ends with what changed, what was checked, what wasn’t, and what’s next. Approving it commits the work.' },
      { src: '/projects/dervo/sunrise.jpg', title: 'A sunrise that rises as the run goes.', text: 'The landing page rebuilds the product in HTML, over a dotted sunrise drawn in a shader. It echoes the progress dot in the app, and it’s where the light on this site comes from.' },
    ],
    link: { href: 'https://trydervo.com/#waitlist', label: 'Join the waitlist at trydervo.com' },
  },
  'integration-portal': {
    kind: 'Employee work',
    // The client's hub is live in the journey below, so the page opens on the specialist's side.
    hero: { src: '/projects/portal/today.png', title: 'What needs a person?', text: 'A ranked list turns operational state into a sentence and an action. Everything else stays quiet.' },
    gallery: [],
  },
  lucid: {
    kind: 'In development',
    hero: { src: '/projects/lucid/spec.png' },
    gallery: [
      { src: '/projects/lucid/mapping.png', title: 'Every value carries its source.', text: 'The specification brings fields, transformations and risk into one readable document.' },
    ],
  },
  arro: {
    kind: 'React Native',
    hero: { src: '/projects/arro/today-sample.png', tall: true, title: 'A little encouragement.', text: 'See who’s already been out and who still has today. There’s room for a cheer, without turning the family into a leaderboard.' },
    gallery: [
      { src: '/projects/arro/trail-sample.png', tall: true, title: 'Every day adds up.', text: 'The weekly trail makes everyone’s effort visible. A rest day can belong in the story too.' },
    ],
  },
  port: {
    kind: 'SwiftUI',
    hero: { src: '', port: true, title: 'Hold to close.', text: 'Press and hold the circle, or focus it and press Enter, to try a browser version of the hold. It plays the sound from the project.' },
    gallery: [],
  },
  agentsky: {
    kind: 'Design study',
    // Compressed copies in public/sky/; the originals in public/project-lab/ stay for the AgentSky study.
    hero: { src: '/sky/agentsky-sky.jpg', pos: '50% 40%' },
    gallery: [
      { src: '/sky/agentsky-session.jpg', title: 'One place to follow the work.', text: 'Agent selection, the request and its files stay visible together. Changing the selected agent resets the sample run, so an old result never appears to belong to a new agent.' },
      { src: '/project-lab/cloud.png', title: 'Close the window. Keep the context.', text: 'The local and cloud windows share the same workspace identity. Movement explains the transfer, while the remaining window makes persistence visible.' },
      { src: '/project-lab/comparison.png', title: 'Give the result room.', text: 'A selector sits beside one large output preview. Each result has space to be read, and the viewer can open it for closer inspection.' },
    ],
  },
};

export const WORK: Work[] = catalog.map(project => ({ ...project, ...extra[project.id] }));
export const workById = (id: string | null | undefined) => WORK.find(work => work.id === id);
export const isWorkId = (id: string) => WORK.some(work => work.id === id);
