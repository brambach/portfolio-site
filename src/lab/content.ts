import { SKILLS } from '../sky/skills';
import { WORK } from '../sky/work';

/* What every motion lab direction says. The words come from the live home page (src/sky/SkyHome.tsx,
   skills.ts and work.ts), so the three directions differ only in how they move. The one change is the hero line,
   which is the new tagline. */

export const NAME = 'Bryce Rambach';
export const TAGLINE = 'I design it, make it move, and build it.';
/** The tagline in its three beats, for directions that animate them one at a time. */
export const TAGLINE_PARTS = ['I design it,', 'make it move,', 'and build it.'] as const;
export const SUB = 'I’m looking for a founding engineer role at an early AI startup in SF or New York.';

export const INTRO = {
  before: 'I’m 22. I finished a computer science degree in May 2026. Since July I’ve been on a three-month contract building HR and payroll integrations, and before that I founded ',
  link: { label: 'Dervo', to: '/projects/dervo' },
  after: '.',
  second: 'I do my best work on a small team where one person can own a product from the API at the bottom to the words on the buttons. Here’s what that looks like, one part at a time.',
};

export { SKILLS, WORK };

/** One day, told by the page. Each part of the page has an hour, so the sky isn't just "further down is later":
 *  it's the day Bryce describes. `at` is where the part sits in the day (0 dawn, 1 dusk). */
export const DAY_BEATS = [
  { id: 'hero', time: '5:48 am', at: 0, label: 'First light' },
  { id: 'intro', time: '7:10 am', at: 0.12, label: 'Morning' },
  { id: 'integrations', time: '9:00 am', at: 0.26, label: 'Integrations' },
  { id: 'agents', time: '11:30 am', at: 0.4, label: 'Agents' },
  { id: 'harnesses', time: '1:15 pm', at: 0.52, label: 'Harnesses' },
  { id: 'design', time: '3:40 pm', at: 0.66, label: 'Design' },
  { id: 'product', time: '5:20 pm', at: 0.78, label: 'Product taste' },
  { id: 'work', time: '6:30 pm', at: 0.88, label: 'The work' },
  { id: 'contact', time: '7:44 pm', at: 1, label: 'Say hello' },
] as const;

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
