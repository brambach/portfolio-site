import { ABOUT, EMAIL, FOOTER, HERO, NAME, NOW } from '../cobalt/copy';
import { BLOCK, SOCIAL } from '../block/copy';

/* Every word the loupe look adds. The about, the email, the line and the links still come from the cobalt and block
   copy so every look says the same things. Same rules: sentence case, no dashes, no city, no employer, Bryce's voice
   (the voice repo's check.py --prose passes on these), and the AI teammate stays unnamed. */

export { ABOUT, EMAIL, FOOTER, HERO, NAME, NOW, SOCIAL };

export const LOUPE = {
  role: BLOCK.role,
  first: 'Bryce',
  last: 'Rambach',
  art: 'A wall of screenshots from my projects, dim and grey, under a glass loupe that follows your pointer and shows what it passes over in full color.',
  open: 'Looking for a founding or product engineer role',
  nav: [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
  work: { title: 'Selected work' },
  index: { title: 'Every project', cols: ['Project', 'What it is', 'Where it stands'] },
  numbers: { title: 'By the numbers' },
  off: 'Off the clock',
  hello: 'Say hello',
  copy: 'Copy email',
  copied: 'Copied',
  sign: FOOTER.sign,
  back: 'All work',
  next: 'Next project',
  top: 'Back to the top',
};

/** The big numbers, each from a project's own page. */
export const NUMBERS = [
  { n: 1000, plus: true, k: 'merged pull requests in 23 days on the AI teammate', href: '/projects/ai-teammate' },
  { n: 8400, plus: true, k: 'passing tests on it, up from 626', href: '/projects/ai-teammate' },
  { n: 3, unit: 'days', k: 'from kickoff to its first production deploy', href: '/projects/ai-teammate' },
  { n: 53793, k: 'minds alive at once in one Psyche world', href: '/projects/psyche' },
  { n: 1500, plus: true, k: 'agent tasks run through Dervo in beta', href: '/projects/dervo' },
  { n: 20, k: 'trails dryline makes a call on every morning', href: '/projects/dryline' },
];

/** The off the clock line, split into the things themselves, each with a small drawing. */
export const OFF = [
  { k: 'run', label: 'dawn miles' },
  { k: 'tennis', label: 'clay tennis' },
  { k: 'coffee', label: 'coffee' },
  { k: 'car', label: 'the green 911' },
  { k: 'board', label: 'a little snowboarding' },
] as const;
