import { SKILLS } from './data/skills';
import { WORK } from './data/work';

/* What the site says. The words come from the home page before this one (skills.ts and work.ts in data/), and the
   hero line is the tagline. */

export const NAME = 'Bryce Rambach';
export const TAGLINE = 'I design it, make it move, and build it.';
export const SUB = 'I’m looking for a founding engineer role at an early AI startup in a new city.';

export const INTRO = {
  before: 'I’m 22. I finished a computer science degree in May 2026. Since July I’ve been on a three-month contract building HR and payroll integrations, and before that I founded ',
  link: { label: 'Dervo', to: '/projects/dervo' },
  after: '.',
  second: 'I do my best work on a small team where one person can own a product from the API at the bottom to the words on the buttons. Here’s what that looks like, one part at a time.',
};

export { SKILLS, WORK };

export const SIDE_QUESTS = [
  { name: 'The drive', href: '/drive', note: 'A 3D Porsche on a mountain lake. Sound on.' },
  { name: 'The road', href: '/work', note: 'The old homepage. Scroll and the Porsche drives.' },
  { name: 'Fire Station #33', href: 'https://github.com/brambach/fire-station-33', note: 'A Unity game about rescuing hikers from a wildfire. Four of us made it for a class.', external: true },
  { name: 'Apple Picker', href: 'https://github.com/brambach/apple-picker', note: 'A small Unity game. Catch the good apples, dodge the bad ones.', external: true },
];

export const CONTACT = [
  { name: 'bryce.rambach@gmail.com', href: 'mailto:bryce.rambach@gmail.com', note: 'Email' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/bryce-rambach/', note: 'bryce-rambach', external: true },
  { name: 'X', href: 'https://x.com/brycerambach', note: '@brycerambach', external: true },
  { name: 'GitHub', href: 'https://github.com/brambach', note: 'brambach', external: true },
];

export const SIGN = 'Designed and built by me, which is sort of the point.';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
export const narrow = () => typeof window !== 'undefined' && document.documentElement.clientWidth < 760;
